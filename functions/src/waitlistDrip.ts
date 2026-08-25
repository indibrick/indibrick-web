/* eslint-disable import/no-unresolved */
// Waitlist onboarding drip.
//
// Two functions:
//   1. sendWaitlistWelcome — Firestore trigger on /partner_waitlist doc
//      create. Sends the day-0 welcome email immediately.
//   2. sendWaitlistNudges — daily 9am America/Toronto scheduled sweep.
//      Walks docs that need day-7 / day-30 / day-90 sends and dispatches.
//
// The email content is per-kind (realtor vs insurance_agent) and per-
// day. All copy is inline here so a change doesn't require another
// deployable template. Emails go through the existing Firebase Trigger
// Email extension (writes to /mail).

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

const DAY_MS = 24 * 60 * 60 * 1000;

interface DripStep {
  day: number;          // days after submittedAt to send
  subject: (kind: 'realtor' | 'insurance_agent', name: string) => string;
  html: (kind: 'realtor' | 'insurance_agent', name: string) => string;
}

// Copy is deliberately different per role. Realtor voice = deal-centric
// ("your buyer, your commission"). Insurance voice = lead-centric
// ("bind rate, book value"). Both keep the CTA singular.

const REALTOR_STEPS: DripStep[] = [
  {
    day: 0,
    subject: () => 'You\'re on the IndiBrick realtor list',
    html: (_k, name) => welcomeHtml({
      name,
      leadCopy: `Thanks for requesting access to IndiBrick Pro for realtors. We'll route your application to our partner team and reply within 2 business hours.`,
      whatNext: [
        'Onboarding call to walk through the AI Deal Analyzer (~15 min)',
        'Territory confirmation + your dedicated broker introduction',
        'Referral-fee paperwork (FSRA Rule 2020-001 disclosure) — one-page e-sign',
      ],
      ctaLabel: 'Review our partner terms',
      ctaHref: 'https://indibrick.ca/for-realtors#waitlist',
      accent: '#2563eb',
    }),
  },
  {
    day: 7,
    subject: () => 'Quick check: still interested in the referral program?',
    html: (_k, name) => nudgeHtml({
      name,
      body: `Hey ${name.split(' ')[0]} — just following up on your IndiBrick partner request from last week. If the timing was off or you had questions we didn't answer, hit reply and let us know. Otherwise we'll continue to hold your spot for the next intake window.`,
      accent: '#2563eb',
    }),
  },
  {
    day: 30,
    subject: () => 'Territory update: spots opening in your area',
    html: (_k, name) => nudgeHtml({
      name,
      body: `Hi ${name.split(' ')[0]} — quick update. We're adding partner capacity in a couple of Ontario territories next week, and your submission is queued for review. If your situation has changed (new brokerage, different focus, no longer interested), reply and let us know so we can update the file.`,
      accent: '#2563eb',
    }),
  },
];

const INSURANCE_STEPS: DripStep[] = [
  {
    day: 0,
    subject: () => 'You\'re on the IndiBrick insurance-agent list',
    html: (_k, name) => welcomeHtml({
      name,
      leadCopy: `Thanks for requesting access to the IndiBrick Insurance Desk. We'll review your application and reply within 2 business hours.`,
      whatNext: [
        'Onboarding call to walk through the claim feed (~15 min)',
        'RIBO Rule 12 referral-disclosure paperwork — one-page e-sign',
        'First lead demo (we can simulate a claim so you see the flow)',
      ],
      ctaLabel: 'Review our program terms',
      ctaHref: 'https://indibrick.ca/for-insurance-agents#waitlist',
      accent: '#10b981',
    }),
  },
  {
    day: 7,
    subject: () => 'Still interested? First cohort intake next Tuesday',
    html: (_k, name) => nudgeHtml({
      name,
      body: `Hey ${name.split(' ')[0]} — following up on your IndiBrick Insurance Desk request. We're opening the next batch of partner spots on Tuesday. If you want to be in that intake window, reply "still in" and we'll fast-track your onboarding call.`,
      accent: '#10b981',
    }),
  },
  {
    day: 30,
    subject: () => 'New lead volume update for your territory',
    html: (_k, name) => nudgeHtml({
      name,
      body: `Hi ${name.split(' ')[0]} — quick update from IndiBrick. Our funded mortgage volume in your area has grown enough that we're re-opening partner intake. Your submission is queued and we'll be in touch to onboard. If anything changed on your end, reply and let us know.`,
      accent: '#10b981',
    }),
  },
];

const STEPS_BY_KIND: Record<'realtor' | 'insurance_agent', DripStep[]> = {
  realtor: REALTOR_STEPS,
  insurance_agent: INSURANCE_STEPS,
};

// ─── Shared email skeletons ────────────────────────────────────────

function welcomeHtml(opts: {
  name: string;
  leadCopy: string;
  whatNext: string[];
  ctaLabel: string;
  ctaHref: string;
  accent: string;
}) {
  const listRows = opts.whatNext.map(item => `
    <li style="padding: 6px 0; color: #334155; font-size: 14px; line-height: 1.6;">${item}</li>
  `).join('');
  return `
    <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0f172a; margin-bottom: 8px;">Welcome, ${opts.name.split(' ')[0]}.</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">${opts.leadCopy}</p>
      <h3 style="color: #0f172a; margin-top: 24px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">What's next</h3>
      <ol style="padding-left: 20px; margin-top: 8px;">${listRows}</ol>
      <div style="margin: 28px 0;">
        <a href="${opts.ctaHref}" style="background-color: ${opts.accent}; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">${opts.ctaLabel}</a>
      </div>
      <p style="color: #64748b; font-size: 13px; margin-top: 16px;">Reply to this email to reach our partner team directly.</p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        IndiBrick Financial · FSRA-licensed Ontario mortgage brokerage · <a href="https://indibrick.ca" style="color: #64748b;">indibrick.ca</a>
      </p>
    </div>`;
}

function nudgeHtml(opts: { name: string; body: string; accent: string }) {
  return `
    <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
      <p style="color: #334155; font-size: 15px; line-height: 1.7;">${opts.body}</p>
      <p style="color: #334155; font-size: 15px; margin-top: 20px;">— IndiBrick Partner Team</p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        You're receiving this because you requested partner access at indibrick.ca.
        <a href="mailto:partners@indibrick.ca?subject=Unsubscribe" style="color: #64748b;">Unsubscribe</a>
      </p>
    </div>`;
}

async function sendStep(
  db: FirebaseFirestore.Firestore,
  docId: string,
  data: any,
  step: DripStep,
) {
  const kind = data.kind as 'realtor' | 'insurance_agent';
  await db.collection('mail').add({
    to: [data.email],
    message: {
      subject: step.subject(kind, data.name),
      html: step.html(kind, data.name),
    },
  });
  await db.collection('partner_waitlist').doc(docId).update({
    dripDay: step.day,
    lastDripAt: new Date().toISOString(),
    _systemUpdate: admin.firestore.FieldValue.delete(), // no-op if never set
  });
}

// ─── Trigger: send day-0 welcome on submission ─────────────────────

export const sendWaitlistWelcome = onDocumentCreated(
  { document: 'partner_waitlist/{id}', region: 'us-central1' },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const kind: 'realtor' | 'insurance_agent' | undefined =
      data.kind === 'realtor' || data.kind === 'insurance_agent' ? data.kind : undefined;
    if (!kind) return;
    const steps = STEPS_BY_KIND[kind];
    const dayZero = steps.find((s: DripStep) => s.day === 0);
    if (!dayZero) return;
    try {
      await sendStep(admin.firestore(), event.params.id, data, dayZero);
      console.log(`[waitlistDrip] day-0 sent for ${kind} / ${data.email}`);
    } catch (e: any) {
      console.error('[waitlistDrip] day-0 failed', e?.message);
    }
  },
);

// ─── Scheduled: daily 9am sweep for day-7 / day-30 / day-90 sends ──

export const sendWaitlistNudges = onSchedule(
  { schedule: 'every day 09:00', timeZone: 'America/Toronto' },
  async () => {
    const db = admin.firestore();
    const now = Date.now();

    // Pull unreviewed docs — reviewed prospects have converted (or been
    // rejected) and shouldn't get nudges anymore.
    const snap = await db.collection('partner_waitlist')
      .where('reviewed', '==', false)
      .get();

    let sent = 0;
    for (const doc of snap.docs) {
      const data = doc.data() as any;
      if (!data.email || !data.submittedAt) continue;
      const submittedMs = new Date(data.submittedAt).getTime();
      if (isNaN(submittedMs)) continue;
      const daysSince = Math.floor((now - submittedMs) / DAY_MS);
      const currentDripDay = Number(data.dripDay || 0);
      const kind: 'realtor' | 'insurance_agent' | undefined =
        data.kind === 'realtor' || data.kind === 'insurance_agent' ? data.kind : undefined;
      if (!kind) continue;

      // Find the next-highest step this doc has aged into but hasn't
      // been sent yet.
      const nextStep = STEPS_BY_KIND[kind]
        .filter((s: DripStep) => s.day > 0 && daysSince >= s.day && s.day > currentDripDay)
        .sort((a: DripStep, b: DripStep) => a.day - b.day)[0];
      if (!nextStep) continue;

      try {
        await sendStep(db, doc.id, data, nextStep);
        sent += 1;
      } catch (e: any) {
        console.error('[waitlistDrip] scheduled send failed', doc.id, e?.message);
      }
    }

    if (sent > 0) console.log(`[waitlistDrip] scheduled sweep sent ${sent}`);
  },
);
