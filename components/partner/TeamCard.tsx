'use client';
// Settings-tab card for team / brokerage management. Wave I-2
// scaffolding: create a team, add/remove members by uid. Referral
// ACL is NOT yet team-scoped (deals still share via participantIds).
// Once brokerages validate the flow we wire the ACL into rules.

import { useState } from 'react';
import { Users, Plus, X, Loader2 } from 'lucide-react';
import { useTeam } from '@/hooks/useTeam';

export default function TeamCard() {
  const { team, members, loading, error, create, addMemberByEmail, removeMember, disband, rename } = useTeam();
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  if (loading) return <div className="text-sm text-neutral-500">Loading team…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  if (!team) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} className="text-neutral-500"/>
          <h3 className="text-base font-semibold text-neutral-900">Your team</h3>
        </div>
        <p className="text-xs text-neutral-500 mb-3">
          Group your brokerage under one team. Members share your account&apos;s workspace.
        </p>
        <div className="flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Sutton West Coast Toronto"
            className="flex-1 p-2 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
          <button
            onClick={async () => {
              if (!newName.trim()) return;
              setBusy(true); setLocalError(null);
              const res = await create(newName.trim());
              setBusy(false);
              if (!res.ok) setLocalError(res.error || 'Create failed.');
              else setNewName('');
            }}
            disabled={busy || !newName.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-600 disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
            Create
          </button>
        </div>
        {localError && <div className="text-xs text-red-600 mt-2">{localError}</div>}
      </div>
    );
  }

  const isOwner = team._relation === 'owner';

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-neutral-500"/>
            <h3 className="text-base font-semibold text-neutral-900">{team.name}</h3>
            <span className={`text-[10px] uppercase tracking-widest ${isOwner ? 'text-emerald-700' : 'text-neutral-500'}`}>
              · {isOwner ? 'owner' : 'member'}
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            {team.memberUids.length} member{team.memberUids.length === 1 ? '' : 's'}
            {isOwner ? ' · you can add or remove members below.' : ''}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={async () => {
              if (!confirm('Disband team? Members lose visibility (no data is deleted).')) return;
              await disband();
            }}
            className="text-xs text-red-600 hover:text-red-800">Disband</button>
        )}
      </div>

      {isOwner && (
        <>
          <div className="mt-4 flex gap-2 items-center">
            <input value={renameInput} onChange={e => setRenameInput(e.target.value)}
              placeholder="Rename team"
              className="flex-1 p-2 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
            <button onClick={async () => {
              if (!renameInput.trim()) return;
              await rename(renameInput.trim());
              setRenameInput('');
            }}
              className="text-xs text-neutral-700 hover:text-neutral-900 font-medium">Rename</button>
          </div>

          <div className="mt-4">
            <label className="block text-xs text-neutral-500 mb-1">Add member by email</label>
            <div className="flex gap-2">
              <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)}
                placeholder="teammate@brokerage.ca"
                className="flex-1 p-2 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
              <button onClick={async () => {
                if (!memberEmail.trim()) return;
                setBusy(true); setLocalError(null);
                const res = await addMemberByEmail(memberEmail.trim());
                setBusy(false);
                if (!res.ok) setLocalError(res.error || 'Add failed.');
                else setMemberEmail('');
              }}
                disabled={busy || !memberEmail.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50">
                <Plus size={12}/> Add
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              They must have already signed in at least once. If not, invite them first from{' '}
              <a href="/admin/invites" className="text-blue-600 hover:underline">/admin/invites</a>.
            </p>
            {localError && <div className="text-xs text-red-600 mt-2">{localError}</div>}
          </div>
        </>
      )}

      {members.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-2">Roster</div>
          <ul className="space-y-2">
            {members.map(m => (
              <li key={m.uid} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <div className="text-neutral-900 font-medium truncate">
                    {m.displayName || m.email || m.uid.slice(0, 8)}
                    {m.relation === 'owner' && (
                      <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">owner</span>
                    )}
                  </div>
                  {m.email && m.displayName && (
                    <div className="text-xs text-neutral-500 truncate">{m.email}</div>
                  )}
                </div>
                {isOwner && m.relation !== 'owner' && (
                  <button onClick={() => removeMember(m.uid)}
                    className="text-red-600 hover:text-red-800 ml-2 shrink-0"><X size={14}/></button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
