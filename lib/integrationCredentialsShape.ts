// Encrypted per-integration credential envelope.
//
// A single row in /integrationCredentials holds ONE credential for
// ONE connected surface — one WordPress site, one Shopify shop, one
// Google Business Profile account. The plaintext (OAuth token / app
// password / refresh token) is encrypted at rest via lib/credentialEncryption.
//
// Firestore rules deny ALL client reads to this collection — the
// only path that ever surfaces plaintext is inside a server-side
// API route with the admin SDK, and even then plaintext is decrypted
// only at send-time (never returned to the browser).

export type IntegrationService = 'wordpress' | 'shopify' | 'gbp';

export interface IntegrationCredentialDoc {
  service: IntegrationService;

  // Human-readable label so an operator can tell them apart in the
  // publish console — e.g. "Vaughan blog WP", "IndiBrick Shop".
  accountLabel: string;

  // Encrypted payload. Shape of the decrypted JSON is service-specific
  // (app-password / api-token / oauth {access, refresh, expiry}).
  encryptedPayload: string;      // base64
  encryptionKeyVersion: string;  // key rotation marker — one string per key we've used
  encryptionAlgo: 'AES-256-GCM' | 'KMS';

  // Non-secret metadata mirrored for filtering / display without
  // needing to decrypt (site URL, shop domain, GBP location id).
  publicMetadata?: {
    wordpressSiteUrl?: string;
    shopifyShopDomain?: string;
    gbpLocationId?: string;
    gbpAccountId?: string;
  };

  // Scope of the credential — a UI can show "this token can only
  // publish posts, not read stats" so operators know the blast radius.
  scopes?: string[];

  // Lifecycle.
  createdBy: string;             // admin uid
  createdAt?: any;
  updatedAt?: any;
  lastUsedAt?: string | null;
  expiresAt?: string | null;     // for OAuth refresh flows
  revokedAt?: string | null;

  tenantId?: string;
}

export function validateCredentialCreate(input: Partial<IntegrationCredentialDoc>): string[] {
  const errors: string[] = [];
  if (!input.service || !['wordpress', 'shopify', 'gbp'].includes(input.service)) {
    errors.push('service invalid.');
  }
  if (!input.accountLabel || input.accountLabel.trim().length === 0) {
    errors.push('accountLabel required.');
  }
  if (input.accountLabel && input.accountLabel.length > 120) {
    errors.push('accountLabel too long.');
  }
  if (!input.encryptedPayload) errors.push('encryptedPayload required.');
  if (!input.encryptionKeyVersion) errors.push('encryptionKeyVersion required.');
  return errors;
}
