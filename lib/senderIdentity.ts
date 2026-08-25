// Per-partner sender identity — display name, from-email, brokerage
// name, verification status. Stored on /users/{uid}.senderIdentity.
//
// Verification is a Wave E-5+ feature (send a confirmation email to
// the fromEmail with a signed token; on click, flip verified=true).
// For now we store the intent + expose it to the mass-send + drip
// runner CASL footer; verification is deferred until we're actually
// letting partners set their own From address.

export interface SenderIdentity {
  displayName?: string;      // "Sarah Nguyen"
  brokerageName?: string;    // "Sutton Group West Coast"
  fromEmail?: string;        // preferred from-address (may or may not be verified)
  replyToEmail?: string;     // where replies route
  verifiedFromEmail?: boolean;
  verifiedAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

const MAX_LEN = 120;

export function validateSenderIdentity(input: Partial<SenderIdentity>): string[] {
  const errors: string[] = [];
  if (input.displayName && input.displayName.length > MAX_LEN) errors.push('Display name too long.');
  if (input.brokerageName && input.brokerageName.length > MAX_LEN) errors.push('Brokerage name too long.');
  if (input.fromEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.fromEmail) || input.fromEmail.length > MAX_LEN)) {
    errors.push('fromEmail must be a valid email.');
  }
  if (input.replyToEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.replyToEmail) || input.replyToEmail.length > MAX_LEN)) {
    errors.push('replyToEmail must be a valid email.');
  }
  return errors;
}
