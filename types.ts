export interface CityData {
  name: string;
  slug: string;
  avgHomePrice: string;
  avgRent: string;
  marketTrend: string;
  intro: string;
  metaDescription: string;
  neighborhoods: string[];
  scenarios: { title: string; description: string }[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string; // "vaughan-mortgage-rates-2024"
  category: string;
  author: string;
  date: string; // ISO String
  imageUrl: string;
  excerpt: string;
  content: string; // HTML string
  status?: 'draft' | 'published';
}

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  source: string;
  url: string;
}

export interface Lead {
  id: string;
  date: string;
  name: string;
  email: string;
  phone: string;
  serviceNeeded: string;
  city: string;
  message?: string;
  status: 'new' | 'contacted' | 'closed';
}

export interface MortgageRate {
  id: string;
  name: string;
  rate: number;
  type: 'fixed' | 'variable';
  term?: number;
}

// ... Add other types (Builder, Property, etc.) as needed from your previous files
export interface Builder { id: string; name: string; }
export interface RecruitmentLead { id: string; name: string; }
export interface Property { 
  id: string; 
  title: string; 
  price: number; 
  address: string; 
  city: string; 
  bedrooms: number; 
  bathrooms: number; 
  type: string; 
  purpose: string; 
  imageUrl: string; 
  isFeatured: boolean;
  description?: string; 
}
export interface SiteSettings {
  enableMortgageCalculator: boolean;
  enableTriggerRateTool: boolean;
  enableLTTCalculator: boolean;
  enableNewsScraper: boolean;
  useExternalRatesWidget: boolean;
  ratesWidgetUrl: string;
}
// types.ts (Additions)

export type UserRole = 'admin' | 'internal_agent' | 'external_agent' | 'partner_realtor' | 'partner_lawyer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  organization?: string; // e.g. "ReMax Reality"
  commissionSplit?: number; // e.g. 20%
}

export interface Referral {
  id: string;
  leadId: string;
  referrerId: string; // The Realtor's UID
  assignedAgentId: string; // The Broker's UID
  status: 'Received' | 'Contacted' | 'Application' | 'Underwriting' | 'Approved' | 'Funded' | 'Declined';
  clientName: string;
  referralDate: string;
  estimatedVolume: number;
  notes: string;
}
// types.ts (Update Referral Interface)

export interface Note {
  author: string; // 'Admin' or 'Partner Name'
  content: string;
  timestamp: string;
  isSystemMessage?: boolean; // e.g., "Status changed to Funded"
}

export interface Referral {
  id: string;
  leadId: string;
  
  // Who sent it?
  referrerId: string;
  referrerName: string;
  
  // Who is working on it?
  assignedAgentId: string; // Could be Indibrick Agent OR External Partner
  assignedAgentName?: string;
  
  status: string; // 'New' | 'Contacted' | 'In Progress' | 'Closed' | 'Declined'
  
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  
  referralDate: string;
  
  // The Conversation / Audit Trail
  notes: string; // Initial note
  timeline: Note[]; // New field for updates
  
  type: 'Mortgage' | 'Real Estate' | 'Legal'; // Context
}
// services/CRMService.ts (Append these methods to the class)

  /**
   * 5. ADMIN: FETCH ALL REFERRALS
   * Used by the Super Admin to see the entire pipeline.
   */
  static async getAllReferrals(): Promise<Referral[]> {
    const q = query(collection(db, "referrals"), orderBy("referralDate", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
  }

  /**
   * 6. ADMIN: ASSIGN AGENT
   * Assigns a specific human to the deal.
   */
  static async assignAgent(referralId: string, agentUid: string, agentName: string) {
    try {
      const ref = doc(db, "referrals", referralId);
      
      const systemNote = {
        author: "Admin",
        content: `Lead assigned to agent: ${agentName}`,
        timestamp: new Date().toISOString(),
        isSystemMessage: true
      };

      await updateDoc(ref, {
        assignedAgentId: agentUid,
        assignedAgentName: agentName,
        status: 'Contacted', // Auto-update status on assignment
        timeline: arrayUnion(systemNote)
      });
      return true;
    } catch (e) {
      console.error("Assignment Error:", e);
      return false;
    }
  }

  /**
   * 7. ADMIN: FETCH TEAM (Users)
   * Retrieves potential assignees from the 'users' collection.
   * NOTE: You must manually create these documents in Firestore 'users' collection first!
   */
  static async getTeamMembers() {
    try {
      // Fetches anyone with a role that can accept leads
      const q = query(collection(db, "users"), where("role", "in", ["internal_agent", "partner_realtor", "partner_lawyer"]));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn("Could not fetch users. Ensure 'users' collection exists.", e);
      return [];
    }
  }