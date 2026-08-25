// Shared form-builder shape.
//
// A stored form is a JSON blob with a slug (public URL is /f/{slug}),
// a list of fields, and the write behavior on submit — creates a
// /referrals doc (fires the rules engine + any user workflows) and
// optionally stamps a lead tag.

export const FIELD_TYPES = [
  { value: 'text',     label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'email',    label: 'Email' },
  { value: 'phone',    label: 'Phone' },
  { value: 'number',   label: 'Number' },
  { value: 'select',   label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
] as const;

export type FieldTypeValue = typeof FIELD_TYPES[number]['value'];

// Fields whose values map directly to /referrals columns. Anything not
// in this map lands under `formExtras.<fieldKey>` on the referral so it
// survives without polluting the top-level schema.
export const REFERRAL_MAPPED_FIELDS = [
  'clientName', 'clientEmail', 'clientPhone', 'notes',
] as const;

export type MappedField = typeof REFERRAL_MAPPED_FIELDS[number];

export interface FormField {
  key: string;                    // internal name — becomes the payload key
  label: string;                  // rendered above the input
  type: FieldTypeValue;
  required?: boolean;
  placeholder?: string;
  options?: string[];             // for 'select'
  mapTo?: MappedField;            // if set, value copies into that Referral field
}

// What to do when a form submission matches an existing referral on
// email OR phone.
//   append        — add a timeline entry to the existing referral,
//                   don't create a new one. Best for repeat submitters.
//   skip          — do nothing beyond the /form_submissions audit row.
//                   Best when the workflow is "capture once, ignore reruns".
//   always_create — create a fresh referral every time. Historical default
//                   (pre-Wave B) — kept for forms that WANT duplicates
//                   (e.g. renewal follow-ups where each submit is a
//                    distinct event, not the same lead).
export type DedupePolicy = 'append' | 'skip' | 'always_create';

export interface FormDoc {
  id: string;
  slug: string;                   // unique, URL-safe
  name: string;                   // admin label
  headline?: string;              // page hero
  subheadline?: string;
  submitLabel?: string;           // CTA text
  successMessage?: string;
  enabled: boolean;
  ownerUid?: string;
  tenantId?: string;

  fields: FormField[];

  // Behavior on submit
  autoTag?: string;               // set as leadTag on the created referral
  dealType?: 'Mortgage' | 'Real Estate' | 'Legal' | 'Insurance';
  redirectUrl?: string;           // 302 after successful submit
  notifyEmails?: string[];        // optional inline email notification
  dedupePolicy?: DedupePolicy;    // Wave B.2 — default 'append' if unset
  requireCaptcha?: boolean;       // Wave B.4 — verify Turnstile token on submit

  // Stats
  submitCount?: number;
  lastSubmitAt?: any;

  createdAt?: any;
  updatedAt?: any;
}

// ─── Validation ────────────────────────────────────────────────────

const FIELD_TYPE_VALUES = new Set(FIELD_TYPES.map(t => t.value));
const MAPPED_FIELD_VALUES = new Set(REFERRAL_MAPPED_FIELDS);

// Slug: lowercase, dashes, 3-40 chars, no leading/trailing dash.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

export function validateForm(input: Partial<FormDoc>): string[] {
  const errors: string[] = [];
  if (!input.slug || !SLUG_RE.test(String(input.slug))) {
    errors.push('Slug must be lowercase letters/numbers/dashes, 3-40 chars.');
  }
  if (!input.name || String(input.name).trim().length === 0) {
    errors.push('Form name is required.');
  }
  if (!Array.isArray(input.fields) || input.fields.length === 0) {
    errors.push('Add at least one field.');
  } else {
    const seenKeys = new Set<string>();
    input.fields.forEach((f, i) => {
      if (!f.key || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(f.key)) {
        errors.push(`Field ${i + 1}: key must start with a letter and contain only letters/numbers/underscores.`);
      } else if (seenKeys.has(f.key)) {
        errors.push(`Field ${i + 1}: duplicate key "${f.key}".`);
      } else {
        seenKeys.add(f.key);
      }
      if (!f.label || !f.label.trim()) errors.push(`Field ${i + 1}: label is required.`);
      if (!f.type || !FIELD_TYPE_VALUES.has(f.type)) errors.push(`Field ${i + 1}: choose a type.`);
      if (f.type === 'select' && (!Array.isArray(f.options) || f.options.length === 0)) {
        errors.push(`Field ${i + 1}: dropdown needs options.`);
      }
      if (f.mapTo && !MAPPED_FIELD_VALUES.has(f.mapTo)) {
        errors.push(`Field ${i + 1}: unknown mapping "${f.mapTo}".`);
      }
    });
  }
  return errors;
}
