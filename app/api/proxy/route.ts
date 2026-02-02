import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Optional: Use Edge runtime for lower latency

const TARGET_API_BASE = 'https://generativelanguage.googleapis.com';

export async function POST(req: NextRequest) {
  try {
    // 1. Extract the path after /api/proxy
    // Note: You need to adjust your frontend to send requests to /api/proxy/v1beta/...
    const url = new URL(req.url);
    const targetPath = url.pathname.replace('/api/proxy', ''); 
    const targetUrl = `${TARGET_API_BASE}${targetPath}${url.search}`;

    console.log(`[Proxy] Forwarding to: ${targetUrl}`);

    // 2. Prepare Headers (Inject API Key server-side)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error: API Key missing' }, { status: 500 });
    }

    const headers = new Headers(req.headers);
    headers.set('X-Goog-Api-Key', apiKey);
    headers.delete('host'); // Let fetch handle the host

    // 3. Forward the Request
    const body = await req.text(); // or req.body for stream
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    // 4. Stream the Response back
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

  } catch (error: any) {
    console.error("[Proxy Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}