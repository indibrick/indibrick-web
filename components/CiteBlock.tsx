import React from 'react';

// CiteBlock — the AI-citation compound habit.
//
// Every statistic on the site should live inside this component. It forces
// the writer to attach a source URL + an "as-of" date at authoring time,
// which eliminates 4 GEO audit penalties in one component:
//   - "no source citations"
//   - "no data points with attribution"
//   - "no freshness signals"
//   - "no blockquotes"
//
// Emits schema.org/Claim microdata (via itemScope/itemType) — Claude and
// Perplexity treat Claim as a first-class citation unit distinct from body
// copy. Google reads it as reinforced fact provenance.
//
// Visual: styled as an unobtrusive callout so writers reach for it instead
// of dropping raw numbers into a <p>. Use `variant="inline"` for a small
// pill (in sentence flow); default is the full block.

export interface CiteBlockProps {
  /** The human-readable claim, e.g. "of Canadian mortgages renew in 2025-26". */
  claim: string;
  /** The number or fact being cited, e.g. "60%" or "$1,100/mo". */
  value: string;
  /** The source's short name, e.g. "Bank of Canada MPR Q3 2025". */
  source: string;
  /** Deep link to the source page — always cite to the specific page, not the homepage. */
  sourceUrl: string;
  /** ISO date the source was published or last verified: 'YYYY-MM-DD'. */
  asOf: string;
  /** Visual variant. */
  variant?: 'block' | 'inline';
  /** Optional accent class hook if a page wants a different tone (defaults to slate). */
  accentClass?: string;
}

/**
 * Format an ISO date for the visible label — long month, day, year in en-CA.
 * Kept deterministic so SSR + CSR match; no locale-dependent surprise.
 */
function formatAsOf(iso: string): string {
  // Accept 'YYYY-MM-DD' or 'YYYY-MM'. Both are valid inputs.
  const parts = iso.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = parts[2] ? Number(parts[2]) : undefined;
  if (!y || !m) return iso;
  const monthName = ['January','February','March','April','May','June','July','August','September','October','November','December'][m - 1];
  return d ? `${monthName} ${d}, ${y}` : `${monthName} ${y}`;
}

export function CiteBlock({
  claim,
  value,
  source,
  sourceUrl,
  asOf,
  variant = 'block',
  accentClass,
}: CiteBlockProps) {
  const asOfLabel = formatAsOf(asOf);

  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex flex-wrap items-baseline gap-1.5 text-sm ${accentClass || 'text-slate-700'}`}
        itemScope
        itemType="https://schema.org/Claim"
      >
        <strong className="font-black tabular-nums text-slate-900" itemProp="text">{value}</strong>
        <span>— {claim}</span>
        <span className="text-xs text-gray-500">
          (
          <a href={sourceUrl} rel="external" itemProp="citation" className="underline hover:text-slate-900">
            {source}
          </a>
          , <time dateTime={asOf}>{asOfLabel}</time>
          )
        </span>
      </span>
    );
  }

  return (
    <blockquote
      className={`my-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5 ${accentClass || ''}`}
      itemScope
      itemType="https://schema.org/Claim"
    >
      <p className="text-base md:text-lg leading-relaxed text-slate-800" itemProp="text">
        <strong className="font-black tabular-nums text-slate-900">{value}</strong>{' '}
        <span className="text-slate-700">— {claim}</span>
      </p>
      <cite className="mt-2 block text-[11px] font-bold uppercase tracking-widest text-gray-500 not-italic">
        Source:{' '}
        <a
          href={sourceUrl}
          rel="external"
          itemProp="citation"
          className="underline decoration-dotted underline-offset-2 hover:text-slate-900"
          target="_blank"
        >
          {source}
        </a>
        {' · '}
        <time dateTime={asOf}>{asOfLabel}</time>
      </cite>
    </blockquote>
  );
}

export default CiteBlock;
