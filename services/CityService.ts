import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { CityData } from "../types";
import { CITIES } from "../data/cityData"; // Fallback data

const COLLECTION_NAME = "cities";

export class CityService {
  
  // 1. Fetch All Cities (For Sitemap & Menu)
  static async getAllCities(): Promise<CityData[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      if (snapshot.empty) return CITIES; // Fallback to static file if DB empty
      
      return snapshot.docs.map(doc => doc.data() as CityData);
    } catch (error) {
      console.error("Error fetching cities:", error);
      return CITIES; // Fail safe
    }
  }

  // 2. Fetch Single City by Slug (For Landing Pages)
  static async getCityBySlug(slug: string): Promise<CityData | null> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where("slug", "==", slug));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Fallback to static data if not in DB yet
        return CITIES.find(c => c.slug === slug) || null;
      }
      
      return snapshot.docs[0].data() as CityData;
    } catch (error) {
      console.error("Error fetching city:", error);
      return null;
    }
  }
}