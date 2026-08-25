// Merge-tag interpolation shared by the mass-send preview + the actual
// send pipe. Uses the SAME syntax as the workflow interpreter — dot-path
// {{fieldPath}} against a referral doc — so partners learn one language.

export function interpolate(template: string, ctx: Record<string, any> | null): string {
  if (!template) return '';
  if (!ctx) return template;
  return template.replace(/\{\{([^}]+)\}\}/g, (_m, path) => {
    const value = String(path).trim().split('.').reduce<any>((acc, key) => {
      if (acc == null) return undefined;
      return acc[key];
    }, ctx);
    return value == null ? '' : String(value);
  });
}

// Return every {{fieldPath}} referenced in a template, in order of
// appearance. Used by the editor UI to render a "you'll need these
// fields set" hint on templates that pull from custom or optional data.
export function extractMergeTags(template: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /\{\{([^}]+)\}\}/g;
  let m;
  while ((m = re.exec(template || ''))) {
    const path = String(m[1]).trim();
    if (!seen.has(path)) {
      seen.add(path);
      out.push(path);
    }
  }
  return out;
}
