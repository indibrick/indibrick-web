import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface MarketReport {
  citySlug: string;
  cityName: string;
  reportDate: string;
  averagePrice: number;
  activeListings: number;
  dom: number;
  summary: string;
  aiForecast: string;
  buySellScore: number;
  investorHotspots: string[];
  priceTrend: { month: string; price: number }[];
}

export const MarketReportService = {
  async getReport(slug: string): Promise<MarketReport> {
    try {
      // 1. Try Fetch Live Data from Firestore
      const docRef = doc(db, 'market_reports', slug);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as MarketReport;
      }

      // 2. Fallback Mock Data (CRITICAL for site to work before AI runs)
      return {
        citySlug: slug,
        cityName: slug.charAt(0).toUpperCase() + slug.slice(1),
        reportDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        averagePrice: 1050000,
        activeListings: 432,
        dom: 18,
        summary: `The ${slug} market is showing resilience. Inventory levels are tightening, putting upward pressure on detached home prices.`,
        aiForecast: "Gemini predicts a 3.5% price appreciation in the coming quarter based on current yield spreads.",
        buySellScore: 7.8,
        investorHotspots: ['Downtown Core', 'North Waterfront', 'Innovation District'],
        priceTrend: []
      };
    } catch (error) {
      console.error("Error fetching market report:", error);
      // Fallback on error to prevent page crash
      return {
        citySlug: slug,
        cityName: slug,
        reportDate: "N/A",
        averagePrice: 0,
        activeListings: 0,
        dom: 0,
        summary: "Data unavailable.",
        aiForecast: "Data unavailable.",
        buySellScore: 0,
        investorHotspots: [],
        priceTrend: []
      };
    }
  }
};