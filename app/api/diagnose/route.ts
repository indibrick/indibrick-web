import { NextResponse } from 'next/server';
import { CityService } from '../../../services/CityService';
import { ContentService } from '../../../services/ContentService';
import { PropertyService } from '../../../services/PropertyService';

export const dynamic = 'force-dynamic'; // Force real-time execution

export async function GET() {
  try {
    const startTime = Date.now();
    
    // 1. Fetch Cities
    console.log("Testing City Connection...");
    const cities = await CityService.getAllCities();
    
    // 2. Fetch Blogs
    console.log("Testing Blog Connection...");
    const posts = await ContentService.fetchPosts();
    
    // 3. Fetch Properties
    console.log("Testing Property Connection...");
    const properties = await PropertyService.fetchProperties();

    return NextResponse.json({
      status: "SUCCESS",
      timeTaken: `${Date.now() - startTime}ms`,
      database: {
        citiesFound: cities.length,
        postsFound: posts.length,
        propertiesFound: properties.length,
      },
      sampleData: {
        firstCity: cities[0]?.name || "None",
        firstPost: posts[0]?.title || "None"
      }
    });

  } catch (error: any) {
    console.error("DIAGNOSTIC FAILURE:", error);
    return NextResponse.json({
      status: "FAILURE",
      error: error.message,
      code: error.code || "UNKNOWN"
    }, { status: 500 });
  }
}