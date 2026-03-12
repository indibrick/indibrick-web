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
  // 1. DASHBOARD & DATA FETCHING
  // ===========================================================================

  static async getPartnerDashboard(profile: { uid: string, role: string, displayName: string }) {
    const referralsRef = collection(db, "referrals");

    if (profile.role === 'admin') {
       const inboxQuery = query(referralsRef, where("assignedAgentId", "==", "ADMIN_INBOX"));
       const inboxSnap = await getDocs(inboxQuery);
       const inbox = inboxSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));

       const mineQuery = query(referralsRef, where("assignedAgentId", "==", profile.uid));
       const mineSnap = await getDocs(mineQuery);
       const mine = mineSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));

       const sentQuery = query(referralsRef, where("referrerId", "==", profile.uid));
       const sentSnap = await getDocs(sentQuery);
       const sentAll = sentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
       const sent = sentAll.filter(lead => lead.assignedAgentId !== profile.uid);

       return { sent, received: inbox, mine };
    }

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
  // 2. ADMIN COMMAND CENTER METHODS (FIXES THE TYPE ERROR)
  // ===========================================================================

  static async getAllReferrals() {
    const snapshot = await getDocs(collection(db, "referrals"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
  }

  static async getUsersByRole(rolePrefix: string) {
    const snapshot = await getDocs(collection(db, "users"));
    // Filter out users that match the requested role (e.g. 'partner_realtor' contains 'partner')
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter((u: any) => u.role && u.role.includes(rolePrefix));
  }

  static async savePartnerProfile(partner: any) {
    const userRef = doc(db, "users", partner.uid);
    // Merge true ensures we don't accidentally wipe out other auth data if it exists
    await setDoc(userRef, partner, { merge: true });
  }

  static async deletePartnerProfile(uid: string) {
    const userRef = doc(db, "users", uid);
    await deleteDoc(userRef);
  }

  static async addNoteToReferral(referralId: string, content: string, authorName: string) {
    const ref = doc(db, "referrals", referralId);
    const note = {
      type: 'user', author: authorName, content,
      timestamp: new Date().toISOString(), isSystemMessage: false
    };
    await updateDoc(ref, {
      timeline: arrayUnion(note),
      lastUpdated: new Date().toISOString()
    });
  }

  static async assignWebLeadToPartner(leadId: string, leadData: any, partnerUid: string, partnerName: string) {
    const timestamp = new Date().toISOString();
    await addDoc(collection(db, "referrals"), {
      leadId: leadId, // Link to original web lead
      referrerId: 'INDIBRICK_WEB',
      referrerName: 'Indibrick Website',
      assignedAgentId: partnerUid,
      assignedAgentName: partnerName,
      status: 'Routed to Partner',
      clientName: leadData.name || 'Unknown',
      clientPhone: leadData.phone || '',
      clientEmail: leadData.email || '',
      referralDate: timestamp,
      notes: leadData.serviceNeeded || 'Web Lead Transfer',
      timeline: [{
        type: 'system', author: 'Indibrick Routing Engine', 
        content: `Lead captured from indibrick.ca and transferred to ${partnerName}.`,
        timestamp: timestamp, isSystemMessage: true
      }],
      type: 'Web Lead'
    });
  }

  // ===========================================================================
  // 3. INBOUND FLOW & INGESTION
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
          type: 'system', author: 'System', content: `Lead ingested via ${clientData.type || 'Manual Entry'}.`,
          timestamp: timestamp, isSystemMessage: true
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
          type: 'system', author: 'System', content: 'Lead imported via CSV batch upload.',
          timestamp: new Date().toISOString(), isSystemMessage: true
        }],
        type: 'Imported Lead'
      });
    });
    await batch.commit(); 
  }

  // ===========================================================================
  // 4. COLLABORATION, NOTES & LOGS
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
      const docSnap = await getDoc(ref);
      
      if (docSnap.exists()) {
         const data = docSnap.data();
         if (data.leadId) {
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
  // 5. TRAFFIC CONTROL & ROUTING
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
  // 6. TASKS & SCHEDULING
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