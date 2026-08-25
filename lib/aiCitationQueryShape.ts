// Tracked queries for the citation tracker.
//
// Each doc is one search string the operator wants monitored across
// AI engines. `enabledEngines` narrows which engines to poll for
// this query — some queries only make sense against certain engines
// (e.g. a hyper-local "IndiBrick Vaughan" query is best on
// Perplexity + AI Overviews, less so on ChatGPT/Claude which may
// generalize away).

export type CitationEngine = 'chatgpt' | 'claude' | 'perplexity' | 'google_ai_overviews' | 'gemini';
export type QueryCategory = 'brand' | 'keyword' | 'competitor';

export interface AiCitationQueryDoc {
  query: string;               // exact string submitted to the engines
  label?: string;              // friendly name for the dashboard
  category: QueryCategory;
  isActive: boolean;
  enabledEngines: CitationEngine[];

  // Metadata mirrored from the last successful run for fast reads
  // without joining to /aiCitations on every dashboard render.
  lastRunAt?: string | null;
  lastRunRunId?: string | null;
  lastCitedCounts?: Partial<Record<CitationEngine, boolean>>;

  createdBy: string;
  createdAt?: any;
  updatedAt?: any;
  tenantId?: string;
}

const QUERY_MAX = 400;
const LABEL_MAX = 120;
const VALID_CATEGORIES: QueryCategory[] = ['brand', 'keyword', 'competitor'];
const VALID_ENGINES: CitationEngine[] = ['chatgpt', 'claude', 'perplexity', 'google_ai_overviews', 'gemini'];

export function validateQuery(input: Partial<AiCitationQueryDoc>): string[] {
  const errors: string[] = [];
  const query = String(input.query || '').trim();
  if (!query) errors.push('query required.');
  if (query.length > QUERY_MAX) errors.push(`query too long (max ${QUERY_MAX}).`);
  if (input.label && input.label.length > LABEL_MAX) errors.push('label too long.');
  if (!input.category || !VALID_CATEGORIES.includes(input.category)) errors.push('category invalid.');
  const engines = input.enabledEngines || [];
  if (!Array.isArray(engines) || engines.length === 0) errors.push('At least one engine required.');
  for (const e of engines) {
    if (!VALID_ENGINES.includes(e)) errors.push(`Unknown engine: ${e}`);
  }
  return errors;
}
