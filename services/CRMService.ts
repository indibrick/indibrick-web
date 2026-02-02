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
  orderBy
} from "firebase/firestore";
import { Referral, PartnerProfile, Note } from "../types";

export class CRMService {
  
  // ===========================================================================
  // 1. INBOUND FLOW (Partner -> Indibrick)
  // ===========================================================================

  static async createReferral(referrer: PartnerProfile, clientData: any) {
    try {
      const timestamp = new Date().toISOString();

      // A. Create the Main Lead (Internal Indibrick Use)
      const leadRef = await addDoc(collection(db, "leads"), {
        ...clientData,
        source: `Partner: ${referrer.displayName}`,
        referrerUid: referrer.uid,
        status: 'New',
        createdAt: Timestamp.now()
      });

      // B. Create the Referral Record (Shared View)
      await addDoc(collection(db, "referrals"), {
        leadId: leadRef.id,
        referrerId: referrer.uid,
        referrerName: referrer.displayName,
        
        assignedAgentId: 'UNASSIGNED', 
        assignedAgentName: 'Pending Assignment',
        
        status: 'Received',
        
        clientName: clientData.name,
        clientPhone: clientData.phone,
        clientEmail: clientData.email || '',
        
        referralDate: timestamp,
        notes: clientData.message || '',
        timeline: [{
          author: referrer.displayName,
          content: 'Referral submitted to Indibrick HQ',
          timestamp: timestamp,
          isSystemMessage: true
        }],
        
        type: clientData.type || 'Mortgage' 
      });

      return { success: true };
    } catch (error) {
      console.error("CRM Error:", error);
      return { success: false, error };
    }
  }

  // ===========================================================================
  // 2. DASHBOARD & DATA FETCHING
  // ===========================================================================

  static async getPartnerDashboard(user: PartnerProfile) {
    const refCollection = collection(db, "referrals");
    
    // A. Leads the Partner SENT to Indibrick
    const sentQuery = query(refCollection, where("referrerId", "==", user.uid));
    const sentDocs = await getDocs(sentQuery);
    const sent = sentDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));

    // B. Leads Indibrick ASSIGNED to the Partner
    const receivedQuery = query(refCollection, where("assignedAgentId", "==", user.uid));
    const receivedDocs = await getDocs(receivedQuery);
    const received = receivedDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));

    return { sent, received };
  }

  static async getAllReferrals(): Promise<Referral[]> {
    const q = query(collection(db, "referrals"), orderBy("referralDate", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
  }

  static async getUsersByRole(roleType: 'internal' | 'partner') {
    const roles = roleType === 'internal' 
      ? ['internal_agent', 'admin'] 
      : ['partner_realtor', 'partner_lawyer'];
      
    const q = query(collection(db, "users"), where("role", "in", roles));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  }

  // ===========================================================================
  // 3. COLLABORATION (Notes & Status)
  // ===========================================================================

  static async addNoteToReferral(referralId: string, noteContent: string, authorName: string) {
    try {
      const ref = doc(db, "referrals", referralId);
      
      const newNote: Note = {
        author: authorName,
        content: noteContent,
        timestamp: new Date().toISOString(),
        isSystemMessage: false
      };

      await updateDoc(ref, {
        timeline: arrayUnion(newNote)
      });
      return true;
    } catch (e) {
      console.error("Error adding note:", e);
      return false;
    }
  }

  static async updateReferralStatus(referralId: string, newStatus: string, authorName: string) {
    try {
      const ref = doc(db, "referrals", referralId);
      
      const systemNote: Note = {
        author: "System",
        content: `${authorName} changed status to ${newStatus}`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true
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

  // ===========================================================================
  // 4. TRAFFIC CONTROL (Assignments)
  // ===========================================================================

  static async assignAgent(referralId: string, agentUid: string, agentName: string) {
    try {
      const ref = doc(db, "referrals", referralId);
      
      const systemNote = {
        author: "Admin",
        content: `Lead assigned to internal agent: ${agentName}`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true
      };

      await updateDoc(ref, {
        assignedAgentId: agentUid,
        assignedAgentName: agentName,
        status: 'Contacted', 
        timeline: arrayUnion(systemNote)
      });
      return true;
    } catch (e) {
      console.error("Assignment Error:", e);
      return false;
    }
  }

  static async assignWebLeadToPartner(leadId: string, leadData: any, partnerUid: string, partnerName: string) {
    try {
      await addDoc(collection(db, "referrals"), {
        leadId: leadId,
        referrerId: 'INDIBRICK_WEB',
        referrerName: 'Indibrick Website',
        
        assignedAgentId: partnerUid,
        assignedAgentName: partnerName,
        
        status: 'Received', 
        clientName: leadData.name,
        clientPhone: leadData.phone,
        clientEmail: leadData.email,
        referralDate: new Date().toISOString(),
        notes: `Transfer from Indibrick Web: ${leadData.message || 'No notes'}`,
        timeline: [{
          author: 'Admin',
          content: 'Lead transferred from Indibrick Website to Partner',
          timestamp: new Date().toISOString(),
          isSystemMessage: true
        }],
        type: 'General Lead'
      });

      const leadRef = doc(db, "leads", leadId);
      await updateDoc(leadRef, { 
        status: 'closed', 
        assignedTo: partnerName 
      });

      return true;
    } catch (e) {
      console.error("Error promoting lead:", e);
      return false;
    }
  }

  // ===========================================================================
  // 5. PARTNER MANAGEMENT (CRUD)
  // ===========================================================================

  static async savePartnerProfile(data: any) {
    try {
      if (!data.uid) throw new Error("User UID is required");
      
      const ref = doc(db, "users", data.uid);
      
      // Update fields without overwriting everything
      await setDoc(ref, {
        uid: data.uid,
        displayName: data.displayName,
        email: data.email,
        phone: data.phone || '',
        organization: data.organization || '',
        role: data.role, 
        referralVolume: data.referralVolume || '$0.00',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return true;
    } catch (e) {
      console.error("Save Partner Error:", e);
      return false;
    }
  }

  static async deletePartnerProfile(uid: string) {
    try {
      await deleteDoc(doc(db, "users", uid));
      return true;
    } catch (e) {
      console.error("Delete Partner Error:", e);
      return false;
    }
  }

  static async updatePartnerVolume(uid: string, volume: string) {
    try {
      const ref = doc(db, "users", uid);
      await updateDoc(ref, { referralVolume: volume });
      return true;
    } catch (e) {
      console.error("Volume Update Error:", e);
      return false;
    }
  }
}