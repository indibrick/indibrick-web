import { db } from "../firebase";
import { 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  query 
} from "firebase/firestore";
import { Lead } from "../types";

export const LeadService = {
  // ===========================================================================
  // 1. SUBMIT LEAD (SECURE API CALL)
  // Use this for the Public LeadForm.tsx
  // ===========================================================================
  async submitLead(data: any) {
    try {
      // Send data to our secure Next.js API Route
      const response = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          // Capture client-side metadata
          pageSource: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Submission Failed');
      }
      return { success: true, id: result.id };

    } catch (error) {
      console.error("Error submitting lead:", error);
      return { success: false };
    }
  },

  // ===========================================================================
  // 2. FETCH LEADS (ADMIN ONLY)
  // Use this for Portal-X-99 Dashboard
  // ===========================================================================
  async fetchLeads(): Promise<Lead[]> {
    try {
      const q = query(collection(db, 'leads'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          serviceNeeded: d.serviceNeeded,
          city: d.city,
          message: d.message,
          consent: d.consent,
          status: d.status || 'new',
          date: d.date || new Date().toISOString(),
        } as Lead;
      });
    } catch (error) {
      console.error("Error fetching leads:", error);
      return [];
    }
  },

  // ===========================================================================
  // 3. ADMIN ACTIONS
  // ===========================================================================
  
  async updateStatus(id: string, status: string) {
    try {
      const leadRef = doc(db, 'leads', id);
      await updateDoc(leadRef, { status });
      return true;
    } catch (e) {
      console.error("Update Status Error:", e);
      return false;
    }
  },

  async deleteLead(id: string) {
    try {
      await deleteDoc(doc(db, 'leads', id));
      return true;
    } catch (e) {
      console.error("Delete Lead Error:", e);
      return false;
    }
  }
};