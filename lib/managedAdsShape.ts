// Managed Ads tier state stored on /users/{uid}.
//
// Only admins can write these fields (they're pricing state — a
// partner shouldn't self-select a tier). Partners can READ their own
// state to render the "you're on Growth tier" chip in their dashboard.

export const MANAGED_ADS_TIERS = [
  { value: 'starter', label: 'Starter',  priceCad: 897,  adSpendIncluded: 500,  mgmtFee: 397 },
  { value: 'growth',  label: 'Growth',   priceCad: 1497, adSpendIncluded: 900,  mgmtFee: 597 },
  { value: 'scale',   label: 'Scale',    priceCad: 2497, adSpendIncluded: 1500, mgmtFee: 997 },
] as const;

export type ManagedAdsTier = typeof MANAGED_ADS_TIERS[number]['value'];

export interface ManagedAdsProfile {
  tier: ManagedAdsTier;
  status: 'active' | 'paused' | 'churned';
  startedAt?: string;           // ISO date
  endedAt?: string;
  monthlyRetainer?: number;     // CAD
  monthlyAdBudget?: number;     // CAD
  // Free-form context — creative preferences, target audiences, etc.
  brief?: string;
  // Platforms currently running (google | meta | linkedin | reddit).
  platforms?: string[];
  // The UTM campaign labels tied to this client so we can attribute
  // inbound leads. Set at campaign launch, one label per active push.
  campaignLabels?: string[];
  updatedAt?: any;
  updatedBy?: string;
}

export function validateManagedAdsProfile(input: Partial<ManagedAdsProfile>): string[] {
  const errors: string[] = [];
  const validTiers = new Set(MANAGED_ADS_TIERS.map(t => t.value));
  if (!input.tier || !validTiers.has(input.tier)) errors.push('Choose a tier (starter, growth, scale).');
  if (input.status && !['active', 'paused', 'churned'].includes(input.status)) errors.push('Status must be active, paused, or churned.');
  if (input.monthlyRetainer !== undefined && (typeof input.monthlyRetainer !== 'number' || input.monthlyRetainer < 0 || input.monthlyRetainer > 100_000)) {
    errors.push('monthlyRetainer must be a positive number under 100,000.');
  }
  if (input.monthlyAdBudget !== undefined && (typeof input.monthlyAdBudget !== 'number' || input.monthlyAdBudget < 0 || input.monthlyAdBudget > 100_000)) {
    errors.push('monthlyAdBudget must be a positive number under 100,000.');
  }
  if (input.campaignLabels !== undefined && (!Array.isArray(input.campaignLabels) || input.campaignLabels.length > 20)) {
    errors.push('campaignLabels must be an array of at most 20 strings.');
  }
  if (input.platforms !== undefined && (!Array.isArray(input.platforms) || input.platforms.length > 10)) {
    errors.push('platforms must be an array.');
  }
  return errors;
}
