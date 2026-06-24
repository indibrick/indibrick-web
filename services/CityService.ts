import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { CityData } from "../types";
import { CITIES } from "../data/cityData"; // Fallback data

const COLLECTION_NAME = "cities";

export class CityService {
  
  // 1. Fetch All Cities (For Sitemap & Menu)
  //
  // Strategy: static `data/cityData.ts` is the always-on base — any city added
  // there is guaranteed to appear on the site even if Firestore hasn't been
  // reseeded. Firestore documents then merge ON TOP of the static entry per
  // slug, so editors can enrich individual cities (richer copy, custom rates,
  // updated neighborhoods) through the CMS without a code deploy.
  static async getAllCities(): Promise<CityData[]> {
    const bySlug = new Map<string, CityData>();
    for (const c of CITIES) bySlug.set(c.slug, c);

    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as Partial<CityData>;
        if (!data.slug) continue;
        const base = bySlug.get(data.slug);
        // Merge so Firestore overrides specific fields without nuking static ones.
        bySlug.set(data.slug, { ...(base as CityData), ...data } as CityData);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      // Continue with static base — no need to bail.
    }

    return Array.from(bySlug.values());
  }

  // 2. Fetch Single City by Slug (For Landing Pages)
  //
  // Same merge pattern as getAllCities: static is the floor, Firestore overrides
  // specific fields. Returns null only if neither source has the slug.
  static async getCityBySlug(slug: string): Promise<CityData | null> {
    const staticEntry = CITIES.find(c => c.slug === slug) || null;
    try {
      const q = query(collection(db, COLLECTION_NAME), where("slug", "==", slug));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return staticEntry;
      const firestoreData = snapshot.docs[0].data() as Partial<CityData>;
      // Static fills any field Firestore doesn't override.
      return { ...(staticEntry as CityData), ...firestoreData } as CityData;
    } catch (error) {
      console.error("Error fetching city:", error);
      return staticEntry;
    }
  }
}