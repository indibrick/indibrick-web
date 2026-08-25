// Public form-submit endpoint.
//
// Rate-limited by IP. Validates required fields. Writes a
// /form_submissions doc + creates a /referrals doc using the mapped
// fields — the referral create fires onReferralWrite which runs the
// rules engine + any user-authored workflows (e.g. "when a form-
// captured deal lands with dealType=Mortgage, notify me").
//
// Notification emails to the form's notifyEmails list are enqueued via
// the Firebase Trigger Email extension (same /mail collection pattern
// the rest of the system uses).

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { REFERRAL_MAPPED_FIELDS } from '@/lib/formShape';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { checkRateLimit } from '@/lib/rateLimiter';
import { filterOutSuppressed } from '@/lib/suppression';
import { projectAttribution, hasAttribution } from '@/lib/attributionShape';

const FORM_WINDOW_MS = 60 * 60 * 1000;
const FORM_MAX = 8;

function ipOf(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const rate = await checkRateLimit({
    bucket: 'form.submit',
    key: `${params.slug}:${ipOf(req)}`,
    windowMs: FORM_WINDOW_MS,
    max: FORM_MAX,
  });
  if (!rate.ok) {
    return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 });
  }
  if (!adminDb) return NextResponse.json({ error: 'Server not initialized' }, { status: 500 });

  const snap = await adminDb.collection('forms').where('slug', '==', params.slug).limit(1).get();
  if (snap.empty) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const formRef = snap.docs[0].ref;
  const form = snap.docs[0].data() || {};
  if (!form.enabled) return NextResponse.json({ error: 'Form disabled' }, { status: 410 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // CAPTCHA verification (Wave B.4). Only enforced when the form has
  // requireCaptcha=true AND the server has a Turnstile secret configured.
  // Missing secret means dev mode — verifyTurnstileToken() returns
  // skipped=true and passes through.
  if (form.requireCaptcha === true) {
    const token = String(body._captchaToken || '');
    const result = await verifyTurnstileToken(token, ipOf(req));
    if (!result.ok) {
      return NextResponse.json({
        error: 'CAPTCHA verification failed. Refresh the form and try again.',
        codes: result.errorCodes,
      }, { status: 403 });
    }
  }

  // Validate required fields.
  const fields: any[] = Array.isArray(form.fields) ? form.fields : [];
  const missing: string[] = [];
  for (const f of fields) {
    if (f.required) {
      const v = body[f.key];
      if (v === undefined || v === null || String(v).trim() === '') missing.push(f.label || f.key);
    }
  }
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
  }

  // Sanitize + collect payload.
  const payload: Record<string, any> = {};
  for (const f of fields) {
    const raw = body[f.key];
    if (raw === undefined || raw === null) continue;
    const v = typeof raw === 'string' ? raw.trim().slice(0, 2000) : raw;
    payload[f.key] = v;
  }

  // Split into referral-mapped fields vs extras.
  const referralPatch: Record<string, any> = {};
  const extras: Record<string, any> = {};
  for (const f of fields) {
    const v = payload[f.key];
    if (v === undefined) continue;
    if (f.mapTo && REFERRAL_MAPPED_FIELDS.includes(f.mapTo)) {
      referralPatch[f.mapTo] = v;
    } else {
      extras[f.key] = v;
    }
  }

  const nowIso = new Date().toISOString();

  // Duplicate detection — Wave B.2. Look up an existing referral by
  // email OR phone. Policy defaults to 'append' when the form doesn't
  // specify (safer default than always-create).
  const dedupePolicy = String(form.dedupePolicy || 'append');
  const emailN = String(referralPatch.clientEmail || '').trim().toLowerCase();
  const phoneRaw = String(referralPatch.clientPhone || '').replace(/\D/g, '');
  let existingId: string | null = null;
  if (dedupePolicy !== 'always_create' && (emailN || phoneRaw.length >= 10)) {
    // Prefer email match — realtors reuse phone numbers across relatives.
    try {
      if (emailN) {
        const s = await adminDb.collection('referrals').where('clientEmail', '==', referralPatch.clientEmail).limit(1).get();
        if (!s.empty) existingId = s.docs[0].id;
      }
      if (!existingId && phoneRaw.length >= 10) {
        // Try both E.164 and raw suffix — different intake sources normalize differently.
        const s = await adminDb.collection('referrals').where('clientPhone', '==', referralPatch.clientPhone).limit(1).get();
        if (!s.empty) existingId = s.docs[0].id;
      }
    } catch (e) {
      console.warn('[form-submit] dedupe lookup failed', e);
    }
  }

  // 1. Write the /form_submissions audit row.
  const subDoc = {
    formSlug: form.slug,
    formId: formRef.id,
    payload,
    ip: ipOf(req).slice(0, 40),
    userAgent: (req.headers.get('user-agent') || '').slice(0, 200),
    dedupePolicy,
    dedupedInto: existingId,   // set only when matched an existing referral
    createdAt: FieldValue.serverTimestamp(),
    submittedAt: nowIso,
  };
  const submissionRef = await adminDb.collection('form_submissions').add(subDoc);

  // If skip policy and duplicate found: return success without creating
  // a referral. Still notify (below) so the admin knows a duplicate
  // came in.
  if (existingId && dedupePolicy === 'skip') {
    try {
      await formRef.update({
        submitCount: FieldValue.increment(1),
        lastSubmitAt: FieldValue.serverTimestamp(),
      });
    } catch { /* best-effort */ }
    return NextResponse.json({
      success: true,
      referralId: existingId,
      duplicated: true,
      action: 'skipped',
      successMessage: form.successMessage,
      redirectUrl: form.redirectUrl || null,
    });
  }

  // If append policy and duplicate found: add a timeline entry to
  // the existing referral instead of creating a new one.
  if (existingId && dedupePolicy === 'append') {
    try {
      await adminDb.collection('referrals').doc(existingId).update({
        lastUpdated: nowIso,
        timeline: FieldValue.arrayUnion({
          type: 'system',
          author: 'Form Capture',
          content: `📥 Re-submitted via form "${form.slug}" (payload keys: ${Object.keys(payload).join(', ')})`,
          timestamp: nowIso,
          isSystemMessage: true,
        }),
      });
      await formRef.update({
        submitCount: FieldValue.increment(1),
        lastSubmitAt: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.warn('[form-submit] append failed', e);
    }
    return NextResponse.json({
      success: true,
      referralId: existingId,
      duplicated: true,
      action: 'appended',
      successMessage: form.successMessage,
      redirectUrl: form.redirectUrl || null,
    });
  }

  // Attribution — Wave E-4. Client sends via _attribution; we project
  // + persist only known keys (defense against arbitrary payload
  // stuffing). Direct visitors get an empty bag which we skip writing.
  const attributionRaw = (body?._attribution && typeof body._attribution === 'object') ? body._attribution : {};
  const attribution = projectAttribution(attributionRaw);
  attribution.capturedAt = nowIso;

  // 2. Create the /referrals doc — this is the trigger the rules
  //    engine + user workflows fire on.
  const referral = {
    ...referralPatch,
    formExtras: extras,
    ...(hasAttribution(attribution) ? { attribution } : {}),
    referrerId: 'FORM_CAPTURE',
    referrerName: `Form: ${form.slug}`,
    assignedAgentId: 'ADMIN_INBOX',
    assignedAgentName: 'Admin Triage',
    status: 'New',
    dealType: form.dealType || 'Mortgage',
    dealCategory: 'potential',
    leadTag: form.autoTag || null,
    referralDate: nowIso,
    type: 'Form Capture',
    participants: [],
    participantIds: [],
    pushedForMortgage: true,     // form captures are always broker-visible
    submissionId: submissionRef.id,
    formSlug: form.slug,
    timeline: [{
      type: 'system',
      author: 'Form Capture',
      content: `📥 Submitted via form "${form.slug}"`,
      timestamp: nowIso,
      isSystemMessage: true,
    }],
    callCount: 0,
    createdAt: FieldValue.serverTimestamp(),
  };
  const referralRef = await adminDb.collection('referrals').add(referral);

  // 3. Optional: notification email to configured recipients. Filter
  //    the notify list against the suppression list (Wave E-2) — a
  //    partner who unsubscribed from campaigns shouldn't still receive
  //    per-submission notifications either.
  const rawNotify: string[] = Array.isArray(form.notifyEmails) ? form.notifyEmails : [];
  const suppressed = await filterOutSuppressed(rawNotify);
  const notifyEmails = rawNotify.filter(e => !suppressed.has(String(e || '').trim().toLowerCase()));
  if (notifyEmails.length > 0) {
    try {
      const rows = Object.entries(payload)
        .map(([k, v]) => `<tr><td style="padding:6px 10px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">${k}</td><td style="padding:6px 10px;color:#0f172a;font-weight:bold;">${String(v).slice(0, 400)}</td></tr>`)
        .join('');
      await adminDb.collection('mail').add({
        to: notifyEmails,
        message: {
          subject: `New form submission: ${form.slug}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h2 style="color:#0f172a;">New submission via <em>${form.slug}</em></h2>
              <table style="width:100%;border-collapse:collapse;margin-top:12px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                ${rows}
              </table>
              <p style="color:#64748b;font-size:12px;margin-top:16px;">Deal record: <code>${referralRef.id}</code></p>
              <div style="margin-top:20px;"><a href="https://indibrick.ca/partner" style="background:#0f172a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Open CRM</a></div>
            </div>`,
        },
      });
    } catch (e) {
      console.warn('[form-submit] notify email enqueue failed', e);
    }
  }

  // 4. Bump the form's submit counter.
  try {
    await formRef.update({
      submitCount: FieldValue.increment(1),
      lastSubmitAt: FieldValue.serverTimestamp(),
    });
  } catch { /* best-effort */ }

  return NextResponse.json({
    success: true,
    referralId: referralRef.id,
    successMessage: form.successMessage,
    redirectUrl: form.redirectUrl || null,
  });
}
