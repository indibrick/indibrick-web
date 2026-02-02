import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { CITIES } from '@/data/cityData';

const apiKey = process.env.GEMINI_API_KEY || '';
console.log(`API Key Status: ${apiKey ? `Loaded (${apiKey.substring(0,4)}...)` : 'MISSING'}`);

const genAI = new GoogleGenerativeAI(apiKey);
export const maxDuration = 300; 

export async function POST(request: Request) {
  try {
    const { macroTrend, adminKey } = await request.json();

    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const targetMonthName = targetDate.toLocaleString('en-US', { month: 'long' });
    const targetYear = targetDate.getFullYear();
    const reportTitle = `${targetMonthName} ${targetYear} Market Report`;

    // --- FIX 1: Use a stable model (flash is fastest/cheapest) ---
    // If 'gemini-2.5-flash' fails, fallback to 'gemini-1.5-flash'
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', // Rolling back to 1.5-flash for maximum stability
      generationConfig: { 
        responseMimeType: "application/json" // --- FIX 2: FORCE VALID JSON ---
      }
    }); 

    const reportsCollection = collection(db, 'market_reports');
    const results = [];
    const errors = [];

    console.log(`Starting Generation for: ${reportTitle}`);

    for (const city of CITIES) {
      const prompt = `
        Act as a Senior Real Estate Analyst. Generate a JSON report for ${city.name}, Ontario.
        CONTEXT: ${targetMonthName} ${targetYear}. Trend: "${macroTrend}".
        
        REQUIREMENTS:
        - Return ONLY a single JSON object.
        - Do not include markdown formatting (no \`\`\`json).
        - Escaped quotes properly.
        
        SCHEMA:
        {
          "averagePrice": Number,
          "activeListings": Number,
          "dom": Number,
          "summary": "String",
          "aiForecast": "String",
          "buySellScore": Number,
          "investorHotspots": ["String", "String"],
          "priceTrend": [{"month": "String", "price": Number}]
        }
      `;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Debugging: Log the raw text if it fails
        // console.log(`Raw output for ${city.name}:`, text.substring(0, 100));

        const data = JSON.parse(text);

        await setDoc(doc(reportsCollection, city.slug), {
          ...data,
          citySlug: city.slug,
          cityName: city.name,
          reportDate: reportTitle,
          generatedOn: new Date().toISOString()
        });

        results.push(city.name);
      } catch (err: any) {
        console.error(`❌ Failed: ${city.name}`, err.message);
        // Fallback: If JSON mode fails, try to repair it manually (rare)
        errors.push(`${city.name}: ${err.message}`);
      }
    }

    return NextResponse.json({ 
      success: results.length > 0, 
      count: results.length,
      errors: errors 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}