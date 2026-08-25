// Team / brokerage shape.
//
// A team is a group of partners under one brokerage or firm. The
// owner is a single uid; members are additional uids granted
// visibility into shared team resources (analytics rollups today,
// pooled referral access later once ACL is scoped).
//
// This is the SHAPE ONLY. Referral row-level access is not yet wired
// to team membership — a member's visibility into another member's
// deals still requires participantIds. Wave I-2 stops here on
// purpose; the referral ACL change is Wave J when we have real
// brokerages to validate it against.

export interface TeamDoc {
  name: string;              // "Sutton Group West Coast Toronto"
  ownerUid: string;
  memberUids: string[];      // owner NOT included; keep sets disjoint
  tenantId?: string;
  createdAt?: any;
  updatedAt?: any;
}

const MAX_MEMBERS = 50;
const NAME_MAX = 120;

export function validateTeamCreate(input: Partial<TeamDoc>): string[] {
  const errors: string[] = [];
  const name = String(input.name || '').trim();
  if (!name) errors.push('Team name is required.');
  if (name.length > NAME_MAX) errors.push('Team name too long.');
  return errors;
}

export function validateMembership(currentMembers: string[], add?: string, remove?: string): string[] {
  const errors: string[] = [];
  if (add && !/^[A-Za-z0-9_-]{3,128}$/.test(add)) errors.push('Add uid looks invalid.');
  if (remove && !/^[A-Za-z0-9_-]{3,128}$/.test(remove)) errors.push('Remove uid looks invalid.');
  if (add && currentMembers.length >= MAX_MEMBERS) errors.push(`Team is at the ${MAX_MEMBERS}-member cap.`);
  return errors;
}
