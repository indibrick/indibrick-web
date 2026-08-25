// Custom deal field definitions.
//
// Stored on /users/{uid}.customDealFields as an array of these shapes.
// Values on each referral live at referral.customFields.<key>.
// Definitions are per-user right now (single-tenant) — when multi-tenant
// lands they'll move to /tenants/{tenantId}/customDealFields but the
// shape stays the same.

export const CUSTOM_FIELD_TYPES = [
  { value: 'text',     label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number',   label: 'Number' },
  { value: 'currency', label: 'Currency ($)' },
  { value: 'date',     label: 'Date' },
  { value: 'checkbox', label: 'Yes / No' },
  { value: 'select',   label: 'Dropdown' },
] as const;

export type CustomFieldType = typeof CUSTOM_FIELD_TYPES[number]['value'];

export interface CustomFieldDef {
  key: string;                   // stable, becomes referral.customFields[key]
  label: string;                 // rendered in the deal modal
  type: CustomFieldType;
  options?: string[];            // required when type === 'select'
  showInList?: boolean;          // future: render on card in list view (Wave A follow-up)
  helpText?: string;             // optional inline hint under the input
}

const MAX_FIELDS = 25;
const MAX_LEN = 60;
const KEY_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const TYPE_SET = new Set(CUSTOM_FIELD_TYPES.map(t => t.value));

export function validateCustomFields(input: any): { defs: CustomFieldDef[]; errors: string[] } {
  const errors: string[] = [];
  const defs: CustomFieldDef[] = [];
  if (!Array.isArray(input)) {
    errors.push('customDealFields must be an array');
    return { defs, errors };
  }
  if (input.length > MAX_FIELDS) {
    errors.push(`Max ${MAX_FIELDS} custom fields`);
  }
  const seen = new Set<string>();
  input.forEach((raw, i) => {
    const key = String(raw?.key || '').trim();
    const label = String(raw?.label || '').trim();
    const type = String(raw?.type || '');
    if (!KEY_RE.test(key)) errors.push(`Field ${i + 1}: key must start with letter/underscore, only letters/numbers/underscore.`);
    else if (seen.has(key)) errors.push(`Field ${i + 1}: duplicate key "${key}".`);
    else seen.add(key);
    if (!label || label.length > MAX_LEN) errors.push(`Field ${i + 1}: label required (max ${MAX_LEN} chars).`);
    if (!TYPE_SET.has(type as CustomFieldType)) errors.push(`Field ${i + 1}: unknown type "${type}".`);
    let options: string[] | undefined;
    if (type === 'select') {
      if (!Array.isArray(raw.options) || raw.options.length === 0) errors.push(`Field ${i + 1}: dropdown needs options.`);
      else options = raw.options.map((o: any) => String(o).trim()).filter(Boolean).slice(0, 30);
    }
    defs.push({
      key,
      label,
      type: type as CustomFieldType,
      ...(options ? { options } : {}),
      ...(raw.showInList ? { showInList: true } : {}),
      ...(raw.helpText ? { helpText: String(raw.helpText).slice(0, 200) } : {}),
    });
  });
  return { defs, errors };
}
