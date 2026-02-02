import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { BlogPost, NewsArticle, MortgageRate } from "../types";

export const ContentService = {
  // --- BLOG POSTS ---
  async fetchPosts(): Promise<BlogPost[]> {
    try {
      const postsRef = collection(db, "posts");
      const snapshot = await getDocs(postsRef);
      
      if (snapshot.empty) return [];

      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as BlogPost));
    } catch (error) {
      console.error("Error fetching posts:", error);
      return [];
    }
  },

  async createPost(post: Omit<BlogPost, 'id'>) {
    // Use the slug as the ID for SEO friendly URLs
    await setDoc(doc(db, "posts", post.slug), post);
  },

  async deletePost(id: string) {
    await deleteDoc(doc(db, "posts", id));
  },

  // --- NEWS ARTICLES ---
  async fetchNews(): Promise<NewsArticle[]> {
    try {
      const snapshot = await getDocs(collection(db, "news"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsArticle));
    } catch (error) { return []; }
  },

  async createNews(news: Omit<NewsArticle, 'id'>) {
    await setDoc(doc(collection(db, "news")), news);
  },

  // --- MORTGAGE RATES (FIXED) ---
  async fetchRates(): Promise<MortgageRate[]> {
    try {
      const snapshot = await getDocs(collection(db, "rates"));
      
      if (snapshot.empty) {
        // FALLBACK: Return default rates if DB is empty to prevent crash
        const defaults: MortgageRate[] = [
          { id: '5-year-fixed-insured', name: '5-Year Fixed (Insured)', rate: 4.69, type: 'fixed', term: 5 },
          { id: '3-year-fixed-insured', name: '3-Year Fixed (Insured)', rate: 4.99, type: 'fixed', term: 3 },
          { id: '5-year-variable-insured', name: '5-Year Variable (Insured)', rate: 5.60, type: 'variable', term: 5 },
        ];
        return defaults;
      }

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MortgageRate));
    } catch (error) {
      console.error("Error fetching rates:", error);
      return [];
    }
  },

  async updateRate(id: string, rate: number) {
    // Merges the new rate into the existing document (or creates it)
    await setDoc(doc(db, "rates", id), { rate }, { merge: true });
  }
};