import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  setDoc,
  deleteDoc,
  arrayUnion,
  Timestamp,
  orderBy,
  writeBatch,
  getDoc
} from "firebase/firestore";
import { Referral, PartnerProfile, Task, ActivityLog } from "../types";

export class CRMService {
  
  // ===========================================================================
  // 1. DASHBOARD & DATA FETCHING (WITH ADMIN OVERRIDE)
  // ===========================================================================

  static async getPartnerDashboard(profile: { uid: string, role: string, displayName: string }) {
    const referralsRef = collection(db, "referrals");

    if (profile.role === 'admin') {
       // Inbox: Web leads waiting in the triage queue
       const inboxQuery = query(referralsRef, where("assignedAgentId", "==", "ADMIN_INBOX"));
       const inboxSnap = await getDocs(inboxQuery);
       const inbox = inboxSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));

       // Mine: Leads specifically routed/assigned to the Admin's personal account to work on
       const mineQuery = query(referralsRef, where("assignedAgentId", "==", profile.uid));
       const mineSnap = await getDocs(mineQuery);
       const mine = mineSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));

       // Sent: Leads the Admin created/ingested manually and routed to others
       const sentQuery = query(referralsRef, where("referrerId", "==", profile.uid));
       const sentSnap = await getDocs(sentQuery);
       const sentAll = sentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
       const sent = sentAll.filter(lead => lead.assignedAgentId !== profile.uid);

       return { sent, received: inbox, mine };
    }

    // Standard Partner Queries
    const sentQuery = query(referralsRef, where("referrerId", "==", profile.uid));
    const sentSnapshot = await getDocs(sentQuery);
    const sentAll = sentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));

    const receivedQuery = query(referralsRef, where("assignedAgentId", "==", profile.uid));
    const receivedSnapshot = await getDocs(receivedQuery);
    const receivedAll = receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));

    const mine = sentAll.filter(lead => lead.assignedAgentId === profile.uid);
    const sent = sentAll.filter(lead => lead.assignedAgentId !== profile.uid);
    const received = receivedAll.filter(lead => lead.referrerId !== profile.uid);

    return { sent, received, mine };
  }

  static async getEcosystemPartners() {
    const q = query(
      collection(db, "users"), 
      where("role", "in", ["partner_realtor", "partner_lawyer", "partner_mortgage", "admin"]) 
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  }

  // ===========================================================================
  // 2. INBOUND FLOW & INGESTION
  // ===========================================================================

  static async createReferral(referrer: PartnerProfile, clientData: any) {
    try {
      const timestamp = new Date().toISOString();

      await addDoc(collection(db, "referrals"), {
        referrerId: referrer.uid,
        referrerName: referrer.displayName,
        assignedAgentId: referrer.uid, 
        assignedAgentName: referrer.displayName,
        status: 'New',
        clientName: clientData.name,
        clientPhone: clientData.phone,
        clientEmail: clientData.email || '',
        referralDate: timestamp,
        notes: clientData.message || '',
        timeline: [{
          type: 'system',
          author: 'System',
          content: `Lead ingested via ${clientData.type || 'Manual Entry'}.`,
          timestamp: timestamp,
          isSystemMessage: true
        }],
        type: clientData.type || 'Manual Entry' 
      });

      return { success: true };
    } catch (error) {
      console.error("CRM Error:", error);
      return { success: false, error };
    }
  }

  static async batchImportLeads(partnerProfile: any, leads: any[]) {
    const batch = writeBatch(db);
    const referralsRef = collection(db, "referrals");

    leads.forEach(lead => {
      const newLeadRef = doc(referralsRef); 
      batch.set(newLeadRef, {
        referrerId: partnerProfile.uid,
        referrerName: partnerProfile.displayName,
        assignedAgentId: partnerProfile.uid, 
        assignedAgentName: partnerProfile.displayName,
        clientName: lead.name || 'Unknown',
        clientEmail: lead.email || '',
        clientPhone: lead.phone || '',
        serviceRequested: lead.service || 'Imported Lead',
        notes: lead.notes || '',
        status: 'New',
        referralDate: new Date().toISOString(),
        timeline: [{
          type: 'system', author: 'System',
          content: 'Lead imported via CSV batch upload.',
          timestamp: new Date().toISOString(), isSystemMessage: true
        }],
        type: 'Imported Lead'
      });
    });

    await batch.commit(); 
  }

  // ===========================================================================
  // 3. COLLABORATION, NOTES & LOGS (WITH PORTAL X 99 SYNC)
  // ===========================================================================

  static async logActivity(referralId: string, activity: ActivityLog) {
    const ref = doc(db, "referrals", referralId);
    await updateDoc(ref, {
      timeline: arrayUnion(activity),
      lastUpdated: new Date().toISOString()
    });
  }

  static async updateReferralStatus(referralId: string, newStatus: string, authorName: string) {
    try {
      const ref = doc(db, "referrals", referralId);
      
      // Look up the referral to find the legacy leadId for Portal X 99 Sync
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
         const data = docSnap.data();
         if (data.leadId) {
            // Write the status back to Portal X 99's database so they stay in sync
            const legacyRef = doc(db, "leads", data.leadId);
            const legacySnap = await getDoc(legacyRef);
            if(legacySnap.exists()){
               await updateDoc(legacyRef, { status: newStatus });
            }
         }
      }

      const systemNote = {
        type: 'system', author: "System", content: `${authorName} changed status to ${newStatus}`,
        timestamp: new Date().toISOString(), isSystemMessage: true
      };

      await updateDoc(ref, {
        status: newStatus,
        timeline: arrayUnion(systemNote),
        lastUpdated: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Error updating status:", e);
      return false;
    }
  }

  static async deleteReferral(referralId: string) {
    try {
      await deleteDoc(doc(db, "referrals", referralId));
      return true;
    } catch (e) {
      console.error("Error deleting lead:", e);
      return false;
    }
  }

  // ===========================================================================
  // 4. TRAFFIC CONTROL & ROUTING
  // ===========================================================================

  static async routeLeadToPartner(referralId: string, currentPartnerName: string, targetPartnerUid: string, targetPartnerName: string) {
    const ref = doc(db, "referrals", referralId);
    await updateDoc(ref, {
      assignedAgentId: targetPartnerUid, 
      assignedAgentName: targetPartnerName,
      status: 'Routed to Partner',
      lastUpdated: new Date().toISOString(),
      timeline: arrayUnion({
        type: 'system', author: 'Indibrick Routing Engine',
        content: `Lead securely routed from ${currentPartnerName} to ${targetPartnerName}.`,
        timestamp: new Date().toISOString(), isSystemMessage: true
      })
    });
  }

  // ===========================================================================
  // 5. TASKS & SCHEDULING
  // ===========================================================================

  static async scheduleTask(taskData: Omit<Task, 'id'>) {
    await addDoc(collection(db, "tasks"), taskData);
  }

  static async fetchDailyTasks(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, "tasks"), 
      where("assigneeId", "==", userId),
      where("dueDate", "==", today),
      where("status", "==", "Pending")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  }

  static async completeTask(taskId: string) {
    await updateDoc(doc(db, "tasks", taskId), { status: 'Completed' });
  }
}