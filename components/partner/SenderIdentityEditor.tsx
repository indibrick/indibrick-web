'use client';
import { useEffect, useState } from 'react';
import { useSenderIdentity } from '@/hooks/useSenderIdentity';

// Compact form partners see under Settings > Sender identity. Sets
// the display name / brokerage / from-address / reply-to used in
// campaigns + drips. From-address is intentionally NOT active in
// send until verifiedFromEmail flips true (see route). Until then
// campaigns still go through the platform-wide From address.

export default function SenderIdentityEditor() {
  const { identity, fallback, loading, saving, error, save } = useSenderIdentity();
  const [displayName, setDisplayName] = useState('');
  const [brokerageName, setBrokerageName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [replyToEmail, setReplyToEmail] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (identity) {
      setDisplayName(identity.displayName || '');
      setBrokerageName(identity.brokerageName || '');
      setFromEmail(identity.fromEmail || '');
      setReplyToEmail(identity.replyToEmail || '');
    }
  }, [identity]);

  if (loading) {
    return <div className="text-sm text-neutral-500">Loading sender identity…</div>;
  }

  const onSave = async () => {
    const ok = await save({ displayName, brokerageName, fromEmail, replyToEmail });
    if (ok) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <h3 className="text-base font-semibold text-neutral-900">Sender identity</h3>
        <p className="text-xs text-neutral-500 mt-1">
          This is how your name shows up in emails and SMS you send from the CRM.
          Sending from your own address requires a one-time verification click
          — until then, your campaigns will still send through IndiBrick&apos;s
          platform address with your name attached.
        </p>
      </div>

      <label className="block text-sm">
        <span className="text-neutral-700">Display name</span>
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder={fallback?.displayName || 'Your name'}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
        />
      </label>

      <label className="block text-sm">
        <span className="text-neutral-700">Brokerage / company</span>
        <input
          type="text"
          value={brokerageName}
          onChange={e => setBrokerageName(e.target.value)}
          placeholder="e.g. Sutton Group West Coast"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
        />
      </label>

      <label className="block text-sm">
        <span className="text-neutral-700">
          Preferred From email {identity?.verifiedFromEmail && (
            <span className="ml-2 text-xs text-emerald-700">✓ verified</span>
          )}
        </span>
        <input
          type="email"
          value={fromEmail}
          onChange={e => setFromEmail(e.target.value)}
          placeholder={fallback?.email || 'you@yourdomain.ca'}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
        />
        {!identity?.verifiedFromEmail && fromEmail && (
          <span className="mt-1 block text-xs text-amber-700">
            Not verified yet — sends will go through the platform address.
          </span>
        )}
      </label>

      <label className="block text-sm">
        <span className="text-neutral-700">Reply-to email</span>
        <input
          type="email"
          value={replyToEmail}
          onChange={e => setReplyToEmail(e.target.value)}
          placeholder={fallback?.email || 'where replies should go'}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
        />
      </label>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {savedFlash && <div className="text-sm text-emerald-700">Saved.</div>}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save sender identity'}
      </button>
    </div>
  );
}
