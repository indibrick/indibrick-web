import { db } from "../firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  query, 
  where 
} from "firebase/firestore";
import { BlogPost, NewsArticle, MortgageRate, MarketMetric } from "../types";

export const ContentService = {
  
  // ===========================================================================
  // 1. BLOG POSTS (Knowledge Base & SEO Content)
  // ===========================================================================

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

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      // First try to get by document ID (if slug is the ID)
      const docRef = doc(db, "posts", slug);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as BlogPost;
      }

      // Fallback: Query by 'slug' field if IDs are different
      const q = query(collection(db, "posts"), where("slug", "==", slug));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BlogPost;
      }

      return null;
    } catch (error) {
      console.error("Error fetching single post:", error);
      return null;
    }
  },

  async createPost(post: Omit<BlogPost, 'id'>) {
    // 1. Write the new post to Firestore
    await setDoc(doc(db, "posts", post.slug), post);

    // 2. 🚀 SEO PIPELINE: Trigger Google Indexing API Webhook
    try {
      // Use environment variable for base URL, fallback to production URL
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://indibrick.ca';
      
      // We ping the API route we created to securely handle the Google JWT auth
      const response = await fetch(`${baseUrl}/api/admin/index-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Assuming this service is called from a secure server context or Next.js API route
          'Authorization': `Bearer ${process.env.ADMIN_SECRET_KEY}` 
        },
        body: JSON.stringify({
          urlToUpdate: `${baseUrl}/blog/${post.slug}`
        })
      });

      if (response.ok) {
        console.log(`✅ [SEO] Successfully pinged Indexing API for: ${post.slug}`);
      } else {
        console.warn(`⚠️ [SEO] Indexing API returned status: ${response.status}`);
      }
    } catch (error) {
      // Non-blocking error: We don't want a failed ping to crash the post creation
      console.error("❌ Failed to trigger Google Indexing API:", error);
    }
  },

  async deletePost(id: string) {
    await deleteDoc(doc(db, "posts", id));
  },

  // ===========================================================================
  // 2. MARKET TICKER (Dynamic Real-Time Data)
  // ===========================================================================

  async fetchTicker(): Promise<MarketMetric[]> {
    try {
      const docRef = doc(db, "site_settings", "ticker");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().metrics) {
        return docSnap.data().metrics as MarketMetric[];
      }

      // Fallback Default Data (Prevents empty bar if DB is new)
      return [
        { label: 'Prime Rate', value: '5.95%', trend: 'down', change: '-0.25%' },
        { label: '5-Yr Bond Yield', value: '3.12%', trend: 'up', change: '+0.04%' },
        { label: 'Qualifying Rate (B-20)', value: '5.25%', trend: 'flat', change: '0.00%' },
        { label: 'Avg Toronto Detached', value: '$1.45M', trend: 'down', change: '-2.1%' },
      ];
    } catch (error) {
      console.error("Error fetching ticker:", error);
      return [];
    }
  },

  async updateTicker(metrics: MarketMetric[]) {
    await setDoc(doc(db, "site_settings", "ticker"), { 
      metrics,
      lastUpdated: new Date().toISOString() 
    });
  },

  // ===========================================================================
  // 3. NEWS ARTICLES
  // ===========================================================================

  async fetchNews(): Promise<NewsArticle[]> {
    try {
      const snapshot = await getDocs(collection(db, "news"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsArticle));
    } catch (error) {
      return [];
    }
  },

  async createNews(news: Omit<NewsArticle, 'id'>) {
    // Auto-generate ID
    const newsRef = doc(collection(db, "news"));
    await setDoc(newsRef, { ...news, id: newsRef.id });
  },

  // ===========================================================================
  // 4. MORTGAGE RATES (Global Pricing)
  // ===========================================================================

  async fetchRates(): Promise<MortgageRate[]> {
    try {
      const snapshot = await getDocs(collection(db, "rates"));
      
      if (snapshot.empty) {
        // SAFETY NET: Return default rates if DB is empty to prevent crash
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