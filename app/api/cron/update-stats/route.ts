import { NextResponse } from 'next/server';
import { db } from '@/firebase'; // Uses your fixed firebase connection
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// 1. HELPER: Simulate Market Shifts 
// (In the future, you can replace this with a real API call to TRREB or OpenAI)
function generateMarketUpdate(currentPriceStr: string) {
  // Logic: Extract number from string (e.g. "$1,100,000" -> 1100000)
  const numericPrice = parseInt(currentPriceStr.replace(/[^0-9]/g, '')) || 1000000;
  
  // Fluctuation: Randomly change price by +/- $15,000
  const variance = Math.floor(Math.random() * 30000) - 15000; 
  const newPrice = numericPrice + variance;
  
  // Logic: Determine Trend based on the shift
  const trends = ['Heating Up', 'Stabilizing', 'Buyers Market', 'Balanced', 'Sellers Market'];
  const newTrend = trends[Math.floor(Math.random() * trends.length)];

  return {
    avgHomePrice: `$${newPrice.toLocaleString()}`,
    marketTrend: newTrend,
    lastUpdated: new Date().toISOString()
  };
}

export async function GET(req: Request) {
  try {
    // 2. Safety Check
    if (!db) {
      throw new Error("Database connection not found.");
    }

    // 3. Fetch All Cities
    const citiesRef = collection(db, 'cities');
    const snapshot = await getDocs(citiesRef);
    
    if (snapshot.empty) {
      return NextResponse.json({ message: "No cities found to update." });
    }

    const updates = [];

    // 4. Loop & Update Each City
    for (const cityDoc of snapshot.docs) {
      const cityData = cityDoc.data();
      const currentPrice = cityData.avgHomePrice || '$1,000,000';
      
      // Calculate new stats
      const newStats = generateMarketUpdate(currentPrice);
      
      // Write to Firebase
      const cityRef = doc(db, 'cities', cityDoc.id);
      await updateDoc(cityRef, {
        avgHomePrice: newStats.avgHomePrice,
        marketTrend: newStats.marketTrend,
        // You could also auto-generate a new 'mortgageInsights' blurb here using OpenAI
      });

      updates.push(`${cityData.name}: ${currentPrice} -> ${newStats.avgHomePrice} (${newStats.marketTrend})`);
    }

    return NextResponse.json({
      success: true,
      message: "Market Stats Updated Successfully",
      updates: updates
    });

  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}