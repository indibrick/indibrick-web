import { db } from "../firebase";
import { collection, getDocs, updateDoc, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { Lead } from "../types";

export const LeadService = {
  // 1. SUBMIT LEAD: Strictly routes to the secure backend API to trigger emails and CRM injection
  async submitLead(data: any) {
    try {
      const response = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (!result.success) throw new Error('API failed');
      
      return { success: true, id: result.id };
    } catch (error) {
      console.error("Submission error:", error);
      return { success: false };
    }
  },

  // 2. FETCH LEADS (For Portal-X-99 Dashboard)
  async fetchLeads(): Promise<Lead[]> {
    try {
      const q = query(collection(db, 'leads'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(document => {
        const d = document.data();
        return {
          id: document.id,
          name: d.name, email: d.email, phone: d.phone,
          serviceNeeded: d.serviceNeeded, city: d.city, message: d.message,
          consent: d.consent, status: d.status || 'new',
          date: d.date || d.createdAt?.toDate().toISOString() || new Date().toISOString(),
        } as Lead;
      });
    } catch (error) {
      console.error("Error fetching leads:", error);
      return [];
    }
  },

  async updateStatus(id: string, status: string) {
    await updateDoc(doc(db, 'leads', id), { status });
    return true;
  },
  async deleteLead(id: string) {
    await deleteDoc(doc(db, 'leads', id));
    return true;
  }
};