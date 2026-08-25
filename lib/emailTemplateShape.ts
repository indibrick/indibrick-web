// Email templates for the mass-send feature.
//
// Stored per-user (single-tenant for now). Body supports the same
// {{fieldPath}} merge tags as the workflow interpreter — anything
// referenceable on a referral doc is interpolatable in a template.
//
// Categories are curated so partners don't have to invent them: they
// drive the pre-built Ontario template library plus filter chips in
// the picker UI.

export const TEMPLATE_CATEGORIES = [
  { value: 'general',       label: 'General' },
  { value: 'nurture',       label: 'Nurture / follow-up' },
  { value: 'renewal',       label: 'Renewal reminder' },
  { value: 'listing_alert', label: 'Listing / market update' },
  { value: 'offer',         label: 'Offer / negotiation' },
  { value: 'closing',       label: 'Closing / post-close' },
  { value: 'review',        label: 'Review / referral ask' },
  { value: 'event',         label: 'Event / holiday' },
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]['value'];

export const TEMPLATE_CHANNELS = ['email', 'sms'] as const;
export type TemplateChannel = typeof TEMPLATE_CHANNELS[number];

export interface EmailTemplateDoc {
  id: string;
  name: string;                     // admin label
  category: TemplateCategory;
  channel: TemplateChannel;
  subject?: string;                 // email only
  body: string;                     // HTML for email, plain for SMS
  ownerUid?: string;
  tenantId?: string;
  archivedAt?: string;
  usageCount?: number;              // increments on each mass-send
  lastUsedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

const MAX_NAME = 120;
const MAX_SUBJECT = 200;
const MAX_BODY = 30_000;            // ~30KB — well below the 100KB Firestore per-field cap
const MAX_SMS_BODY = 1600;          // ~10 SMS segments

const CATEGORY_SET = new Set(TEMPLATE_CATEGORIES.map(c => c.value));

export function validateTemplate(input: Partial<EmailTemplateDoc>): string[] {
  const errors: string[] = [];
  if (!input.name || String(input.name).trim().length === 0) errors.push('Template name is required.');
  if (input.name && String(input.name).length > MAX_NAME) errors.push(`Name too long (max ${MAX_NAME}).`);
  if (!input.category || !CATEGORY_SET.has(input.category)) errors.push('Choose a category.');
  const channel = input.channel;
  if (channel !== 'email' && channel !== 'sms') errors.push('Choose a channel (email or sms).');
  if (!input.body || String(input.body).trim().length === 0) errors.push('Body is required.');
  const bodyLen = String(input.body || '').length;
  if (channel === 'email' && bodyLen > MAX_BODY) errors.push(`Email body too long (max ${MAX_BODY} chars).`);
  if (channel === 'sms' && bodyLen > MAX_SMS_BODY) errors.push(`SMS body too long (max ${MAX_SMS_BODY} chars).`);
  if (channel === 'email' && (!input.subject || String(input.subject).trim().length === 0)) errors.push('Email needs a subject.');
  if (input.subject && String(input.subject).length > MAX_SUBJECT) errors.push('Subject too long.');
  return errors;
}
