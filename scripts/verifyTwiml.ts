// Asserts that every TwiML document we emit is valid XML.
//
// This exists because it wasn't. Adding a query string to the whisper
// URL put a bare `&` inside an XML attribute, which makes the whole
// document unparseable. Twilio's response to unparseable TwiML is to
// tell the caller "an application error has occurred" and hang up — the
// call fails completely, and nothing in our logs says why, because from
// our side the webhook returned 200.
//
// Run before deploying any change to a TwiML endpoint:
//   npx tsx scripts/verifyTwiml.ts

import { DOMParser } from '@xmldom/xmldom';

function xmlAttr(v: string): string {
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const BASE = 'https://indibrick.ca';

function dialTwiml(record: boolean, transcribe: boolean, clientPhone = '+16475550100') {
  const whisper = `${BASE}/api/twilio/voice-whisper?rec=${record ? '1' : '0'}&txt=${transcribe ? '1' : '0'}`;
  const recAttrs = record
    ? ` record="record-from-answer-dual" recordingStatusCallback="${xmlAttr(`${BASE}/api/twilio/recording-status`)}"`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting your I n d i Brick call.</Say>
  <Dial callerId="+14165550100" timeout="30"${recAttrs}>
    <Number url="${xmlAttr(whisper)}">${clientPhone}</Number>
  </Dial>
</Response>`;
}

function whisperTwiml(notice: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">${notice}</Say></Response>`;
}

let failures = 0;

function check(label: string, xml: string) {
  const errors: string[] = [];
  // xmldom reports recoverable problems through onError rather than
  // throwing, so they must be collected or a malformed document passes
  // silently — which is precisely the failure mode being guarded here.
  const parser = new DOMParser({
    onError: (level: string, msg: string) => errors.push(`${level}: ${msg}`),
  } as any);
  try {
    parser.parseFromString(xml, 'text/xml');
  } catch (e: any) {
    errors.push(`throw: ${e?.message || e}`);
  }

  if (errors.length > 0) {
    failures += 1;
    console.log(`  ✗ ${label}`);
    errors.slice(0, 2).forEach((e) => console.log(`      ${e.replace(/\n/g, ' ').slice(0, 110)}`));
  } else {
    console.log(`  ✓ ${label}`);
  }
}

console.log('\nTwiML validity\n');
check('dial · record + transcribe', dialTwiml(true, true));
check('dial · record only',         dialTwiml(true, false));
check('dial · private',             dialTwiml(false, false));
check('whisper · full notice',      whisperTwiml('This call is recorded and summarized for your file.'));
check('whisper · empty',            '<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

console.log('');
if (failures > 0) {
  console.log(`${failures} document(s) invalid — Twilio would answer with an application error.\n`);
  process.exit(1);
}
console.log('All TwiML parses.\n');
