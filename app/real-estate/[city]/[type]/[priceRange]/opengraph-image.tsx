// Per-cell Open Graph image. Generates a unique 1200×630 social card for
// every (city × type × price) tuple at build time. Lifts CTR on shares to
// Slack/Twitter/iMessage and is favored by AI Overviews when surfacing
// page previews. Audit 3A.

import { ImageResponse } from 'next/og';
import { CITIES } from '../../../../../data/cityData';
import {
  PROPERTY_TYPES, PRICE_RANGES, getTypeBySlug, getPriceRangeBySlug,
} from '../../../../../data/matrixData';
import { MarketDataService } from '../../../../../services/MarketDataService';

export const runtime = 'nodejs';
export const alt = 'IndiBrick Live Market Snapshot';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Pre-render an OG image for every matrix cell — same set as page.tsx.
export async function generateImageMetadata() {
  return MarketDataService.enumerateCells().map((t) => ({
    id: `${t.city}-${t.type}-${t.price}`,
    // params are filled in by the framework from the URL — this just labels the file
  }));
}

interface Params { city: string; type: string; priceRange: string }

export default async function OGImage({ params }: { params: Params }) {
  const city = CITIES.find((c) => c.slug === params.city);
  const type = getTypeBySlug(params.type);
  const range = getPriceRangeBySlug(params.priceRange);

  // Defensive fallback so the build doesn't break on a stray invalid slug.
  if (!city || !type || !range) {
    return new ImageResponse(
      (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0f172a', color: '#fff', fontSize: 64, fontWeight: 900,
        }}>
          IndiBrick · Live Market Data
        </div>
      ),
      { ...size },
    );
  }

  const snap = await MarketDataService.getSnapshot(params.city, params.type, params.priceRange);
  const trendUp = snap.yoyChangePct >= 0;
  const priceK = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}K`;

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: '#fff', padding: 64, fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Top row: brand + live badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>
            indibrick<span style={{ color: '#60a5fa' }}>.</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            color: '#a7f3d0',
            padding: '10px 18px', borderRadius: 999,
            fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: '#34d399' }} />
            Live · {snap.asOfDate}
          </div>
        </div>

        {/* Title block */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 56 }}>
          <div style={{
            fontSize: 22, fontWeight: 800, letterSpacing: 4,
            textTransform: 'uppercase', color: '#93c5fd', marginBottom: 12,
          }}>
            {city.name}, Ontario · {range.label}
          </div>
          <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 1, letterSpacing: -3 }}>
            {type.plural} for Sale
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: 32, marginTop: 56,
        }}>
          <Cell label="Median" value={priceK(snap.medianPrice)} />
          <Cell label="Active" value={String(snap.activeListings)} />
          <Cell label="Days on Mkt" value={`${snap.daysOnMarket}d`} />
          <Cell
            label="YoY"
            value={`${trendUp ? '+' : ''}${snap.yoyChangePct.toFixed(1)}%`}
            color={trendUp ? '#34d399' : '#f87171'}
          />
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.15)',
          fontSize: 20, fontWeight: 700, color: '#cbd5e1', letterSpacing: 2, textTransform: 'uppercase',
        }}>
          <div>indibrick.ca/real-estate/{city.slug}/{type.slug}/{range.slug}</div>
          <div>CREA MLS HPI · Updated Hourly</div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Cell({ label, value, color = '#fff' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 24, padding: '24px 28px', minWidth: 200,
    }}>
      <div style={{
        fontSize: 16, fontWeight: 800, letterSpacing: 3,
        textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 56, fontWeight: 900, color, letterSpacing: -1 }}>
        {value}
      </div>
    </div>
  );
}

// Keep tree-shaking honest — unused warnings on PROPERTY_TYPES / PRICE_RANGES otherwise.
void PROPERTY_TYPES; void PRICE_RANGES;
