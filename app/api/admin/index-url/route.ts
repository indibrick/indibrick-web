import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    // 1. Authorization check: Ensure only our internal systems can trigger this
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { urlToUpdate } = await request.json();

    if (!urlToUpdate) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 2. Initialize the Google Auth Client using Environment Variables
    const jwtClient = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      undefined,
      process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Fix newline formatting from env
      ['https://www.googleapis.com/auth/indexing'],
      undefined
    );

    await jwtClient.authorize();

    const indexing = google.indexing({
      version: 'v3',
      auth: jwtClient,
    });

    // 3. Ping Google to index the URL immediately
    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url: urlToUpdate,
        type: 'URL_UPDATED',
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully pinged Google Indexing API for: ${urlToUpdate}`,
      data: response.data 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to ping Google Indexing API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}