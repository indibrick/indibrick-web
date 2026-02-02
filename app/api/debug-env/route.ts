import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  return NextResponse.json({
    status: "Environment Diagnostic",
    variables: {
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: {
        exists: !!projectId,
        value: projectId || "MISSING"
      },
      FIREBASE_CLIENT_EMAIL: {
        exists: !!clientEmail,
        value: clientEmail ? "HIDDEN_EMAIL_CHECK_OK" : "MISSING"
      },
      FIREBASE_PRIVATE_KEY: {
        exists: !!privateKey,
        length: privateKey ? privateKey.length : 0,
        startsWithHeader: privateKey ? privateKey.trim().startsWith("-----BEGIN PRIVATE KEY-----") : false,
        endsWithFooter: privateKey ? privateKey.trim().endsWith("-----END PRIVATE KEY-----") : false,
        containsNewlines: privateKey ? privateKey.includes("\n") : false,
        containsEscapedNewlines: privateKey ? privateKey.includes("\\n") : false,
        // Shows first 10 chars to check for quote marks like " or '
        previewStart: privateKey ? privateKey.substring(0, 10) : "N/A" 
      }
    },
    timestamp: new Date().toISOString()
  });
}