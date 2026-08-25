// Client-side fetch wrapper that attaches the current Firebase user's
// ID token as a Bearer header. Use this for every call to /api/partner/*.
//
// Rationale: prior to lib/authGuard.ts, partner routes trusted `uid` /
// `userId` from the request payload. Server routes now verify the token.
// Every client call must therefore carry Authorization: Bearer <token>.

import { getAuth } from 'firebase/auth';

async function currentIdToken(): Promise<string | null> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}

export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = await currentIdToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

// Convenience helpers for the common cases.
export async function authedGet(url: string): Promise<Response> {
  return authedFetch(url, { method: 'GET' });
}

export async function authedPost(url: string, body: unknown): Promise<Response> {
  return authedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function authedPut(url: string, body: unknown): Promise<Response> {
  return authedFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function authedPatch(url: string, body: unknown): Promise<Response> {
  return authedFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function authedDelete(url: string): Promise<Response> {
  return authedFetch(url, { method: 'DELETE' });
}
