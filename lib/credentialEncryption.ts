// Credential encryption for /integrationCredentials.
//
// Two paths, chosen at runtime:
//   1) Cloud KMS (production) — KMS_KEY_NAME set to a fully-qualified
//      key resource (projects/.../locations/.../keyRings/.../cryptoKeys/...).
//      Encryption is performed by KMS; only KMS holds the key material.
//   2) AES-256-GCM local (dev / bootstrap) — INTEGRATION_ENCRYPTION_SECRET
//      is a base64 32-byte key. If neither env var is set we fall back
//      to a DEV_ONLY key with a loud console warning, matching the
//      lib/unsubscribeToken.ts pattern.
//
// The KMS path is intentionally not wired to the @google-cloud/kms
// package at import time — we require() lazily inside the KMS branch
// so a repo without the dep still runs the AES path clean. When
// production wires KMS we'll add the dep + set KMS_KEY_NAME.
//
// Callers see one API: encrypt(plaintext) / decrypt(envelope). The
// envelope stores the key version so we can rotate without a
// re-encryption dance.

import crypto from 'crypto';

const ALGO_AES = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

export interface EncryptedEnvelope {
  ciphertext: string;         // base64
  algo: 'AES-256-GCM' | 'KMS';
  keyVersion: string;
}

function loadLocalKey(): Buffer {
  const raw = process.env.INTEGRATION_ENCRYPTION_SECRET || '';
  if (!raw) {
    console.warn('[credentialEncryption] INTEGRATION_ENCRYPTION_SECRET not set — DEV_ONLY fallback in use. DO NOT ship to prod.');
    // Deterministic dev key. Never use in prod — the health check
    // panel at /admin/health flags this.
    return crypto.createHash('sha256').update('DEV_ONLY_INSECURE_INTEGRATION_KEY').digest();
  }
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) {
    throw new Error('INTEGRATION_ENCRYPTION_SECRET must decode to 32 bytes (base64 AES-256).');
  }
  return buf;
}

function kmsKeyName(): string | null {
  return process.env.KMS_KEY_NAME || null;
}

export async function encryptCredential(plaintext: string): Promise<EncryptedEnvelope> {
  const kms = kmsKeyName();
  if (kms) {
    return encryptViaKms(plaintext, kms);
  }
  return encryptViaAes(plaintext);
}

export async function decryptCredential(envelope: EncryptedEnvelope): Promise<string> {
  if (envelope.algo === 'KMS') {
    const kms = kmsKeyName();
    if (!kms) throw new Error('Envelope requires KMS but KMS_KEY_NAME not set on this instance.');
    return decryptViaKms(envelope, kms);
  }
  return decryptViaAes(envelope);
}

function encryptViaAes(plaintext: string): EncryptedEnvelope {
  const key = loadLocalKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO_AES, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Packed as [iv | tag | ciphertext] base64.
  const packed = Buffer.concat([iv, tag, enc]).toString('base64');
  return {
    ciphertext: packed,
    algo: 'AES-256-GCM',
    keyVersion: process.env.INTEGRATION_ENCRYPTION_SECRET ? 'env-v1' : 'dev-fallback',
  };
}

function decryptViaAes(envelope: EncryptedEnvelope): string {
  const key = loadLocalKey();
  const packed = Buffer.from(envelope.ciphertext, 'base64');
  if (packed.length < IV_LEN + TAG_LEN + 1) throw new Error('Malformed ciphertext.');
  const iv = packed.slice(0, IV_LEN);
  const tag = packed.slice(IV_LEN, IV_LEN + TAG_LEN);
  const enc = packed.slice(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO_AES, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}

async function encryptViaKms(plaintext: string, keyName: string): Promise<EncryptedEnvelope> {
  // Lazy import so repos without the KMS dep still run.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { KeyManagementServiceClient } = require('@google-cloud/kms');
  const client = new KeyManagementServiceClient();
  const [response] = await client.encrypt({
    name: keyName,
    plaintext: Buffer.from(plaintext, 'utf8'),
  });
  const ciphertext = Buffer.from(response.ciphertext).toString('base64');
  // KMS handles rotation internally; we just record which key resource
  // was used so a future migration can identify the source.
  return { ciphertext, algo: 'KMS', keyVersion: keyName };
}

async function decryptViaKms(envelope: EncryptedEnvelope, keyName: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { KeyManagementServiceClient } = require('@google-cloud/kms');
  const client = new KeyManagementServiceClient();
  const [response] = await client.decrypt({
    name: keyName,
    ciphertext: Buffer.from(envelope.ciphertext, 'base64'),
  });
  return Buffer.from(response.plaintext).toString('utf8');
}
