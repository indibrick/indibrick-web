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
  /**
   * Returns the stored market report for a city, or `null` when we don't
   * have one.
   *
   * This used to fall back to hardcoded mock data — $1,050,000 average
   * price, 432 active listings, 18 days on market, a fabricated "Gemini
   * predicts 3.5% appreciation" forecast, and three invented investor
   * hotspots ("Downtown Core", "North Waterfront", "Innovation District").
   * Because `market_reports` is sparsely populated, the overwhelming
   * majority of /city-data/* pages published that identical fiction as
   * though it were real market analysis.
   *
   * Publishing invented market statistics on an FSRA-regulated brokerage
   * site is a consumer-protection problem before it's an SEO one, and the
   * near-identical output across every city is precisely why Google
   * declined to index the set. Callers MUST handle null by rendering an
   * honest empty state and setting `noindex`.
   */
  async getReport(slug: string): Promise<MarketReport | null> {
    try {
      const docRef = doc(db, 'market_reports', slug);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;

      const data = docSnap.data() as Partial<MarketReport>;
      // A stored doc missing its headline figures is not publishable
      // either — treat it as absent rather than rendering zeros.
      if (typeof data.averagePrice !== 'number' || data.averagePrice <= 0) return null;

      return data as MarketReport;
    } catch (error) {
      console.error('[MarketReportService] fetch failed for', slug, error);
      return null;
    }
  },
};