# Neighborhood Enrichment Pipeline

Auto-promotes standard-tier neighborhood pages (currently `noindex, follow` because they only carry era + history + buyer profile) into flagship-tier by adding **research-grounded** Walk Scores, transit stations, and notable places.

## What "research-grounded" means

Every field the pipeline writes comes from **one of four real sources**:

| Source | What it provides | Cost |
|---|---|---|
| **Wikipedia REST API** | Neighborhood intro paragraph + history + character | Free |
| **OpenStreetMap Nominatim** | Geocoding to a bounding box | Free (1 req/sec) |
| **OpenStreetMap Overpass** | Real transit stops, parks, cafes, restaurants, landmarks by geographic area | Free |
| **walkscore.com HTML** | Per-neighborhood Walk / Transit / Bike scores | Free (best-effort scrape) |

The LLM step (Claude) is the last stage. It only structures the raw data into the `NeighborhoodExtras` shape — it's explicitly instructed to **refuse to fill in from training data**. If Wikipedia has no article for a neighborhood and OSM has no landmarks in the bounding box, the field is left blank, and that neighborhood stays standard-tier. That's the correct outcome — better than an invented Walk Score.

## Setup

```bash
# From project root
npm install --save-dev @anthropic-ai/sdk tsx

# Get an Anthropic API key from https://console.anthropic.com
export ANTHROPIC_API_KEY=sk-ant-...
```

## Run

```bash
# Full run (all standard-tier neighborhoods)
npx tsx scripts/enrich-neighborhoods/index.ts

# Test run — first 3 entries only
LIMIT=3 npx tsx scripts/enrich-neighborhoods/index.ts

# Pin a specific Claude model (default: claude-sonnet-5)
ANTHROPIC_MODEL=claude-opus-4-8 npx tsx scripts/enrich-neighborhoods/index.ts
```

Runtime is dominated by rate limits (Nominatim's 1 req/sec is the tightest bottleneck). Expect **~10-15 seconds per neighborhood**, so a full run of ~225 entries is **~30-60 minutes**.

## Cost

Rough estimate at Claude Sonnet 5 pricing:

- **~1500 input tokens** per neighborhood (research bundle handed to model)
- **~500 output tokens** per neighborhood (structured JSON)
- **225 neighborhoods** total

Total: **~$1–3** for the full batch. Verify the current Sonnet 5 pricing at [anthropic.com/pricing](https://www.anthropic.com/pricing) before starting.

## Resumability

The pipeline writes to `staging.ts` after **every** entry. If your machine sleeps, the network drops, or you Ctrl-C halfway through:

- Re-running skips anything already in `staging.ts` (matched by `city|slug` key)
- No wasted API calls, no partial state to clean up

## Review + merge workflow

After the run completes:

1. Open `scripts/enrich-neighborhoods/staging.ts`. Every entry looks like:
   ```ts
   // SOURCES: https://en.wikipedia.org/wiki/Foo | OpenStreetMap | https://walkscore.com/score/...
   // CONFIDENCE: high
   'oshawa|o-neill': {
     "walkScore": 71,
     "transitStations": [
       { "name": "Oshawa GO Station", "lines": ["GO Lakeshore East"] }
     ],
     "notableSpots": [
       { "name": "McLaughlin Bay Wildlife Reserve", "kind": "park" }
     ]
   },
   ```

2. **High-confidence entries** (Wikipedia AND OSM both returned data) are usually correct — Wikipedia doesn't lie about street names and OSM tags landmarks accurately. Skim, sanity-check, merge.

3. **Medium-confidence entries** (one source returned useful data) — verify the specific claims before merging.

4. **Low-confidence entries** — pipeline had nothing, or Claude judged the material too thin. Skip these, or fill in manually.

5. To promote an entry, **merge** the fields into the existing entry in `data/neighborhoodExtras.ts` (don't overwrite — the source file already has `architecturalEra` / `historyBlurb` / `buyerProfile`). Merged entry becomes flagship-tier automatically → `noindex` disappears on next deploy → Google re-indexes.

## Rate limit courtesies

The pipeline is deliberately polite:

- Nominatim: 1 request per 1.1 seconds (matches public usage policy)
- Overpass: 1 request per 0.8 seconds
- Wikipedia REST API: 1 per 0.2 seconds
- walkscore.com: 1 per 1.5 seconds (best-effort scrape; unofficial)
- All requests carry a `User-Agent` identifying IndiBrick with a contact email

If you get blocked or rate-limited, back off by editing `config.ts` and doubling the intervals.

## What the pipeline does NOT do

- **Does not** hit Fraser Institute for school ratings — that data isn't free. `notableSchools` will remain blank; add manually if you want it.
- **Does not** re-enrich existing flagship-tier entries — it only promotes standards.
- **Does not** delete or downgrade anything. Only writes to staging.
- **Does not** auto-commit or auto-push. Review + merge is a human step.

## Troubleshooting

- **"Missing ANTHROPIC_API_KEY"** — export the env var in your shell before running.
- **All entries come back low-confidence** — most likely walkscore.com blocked your IP or Nominatim rate-limited. Wait 5 minutes and re-run (idempotent).
- **Some cities produce no Wikipedia hits** — expected for tract-name suburbs (e.g. Milton's Beaty, Clarke, Coates). Those neighborhoods will stay standard-tier until manually enriched.
- **Overpass timing out** — the mirror `https://overpass.kumi.systems/api/interpreter` is a drop-in fallback; edit `researcher.ts` to swap.
