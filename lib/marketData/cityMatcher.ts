// Maps our 40 cityData slugs to the best CREA HPI sheet name from the
// monthly Not-Seasonally-Adjusted workbook. Where a city has no direct CREA
// region (e.g. Brampton rolls into "Greater Toronto" because Peel isn't
// individually published), we fall back to the parent area code.
//
// Update this map whenever new CREA HPI sheets become available.

export const CITY_TO_HPI_SHEET: Record<string, string> = {
  // Direct matches
  mississauga: 'MISSISSAUGA',
  oakville: 'OAKVILLE_MILTON',
  milton: 'OAKVILLE_MILTON',
  burlington: 'HAMILTON_BURLINGTON',
  hamilton: 'HAMILTON_BURLINGTON',
  cambridge: 'CAMBRIDGE',
  guelph: 'GUELPH_AND_DISTRICT',
  kitchener: 'KITCHENER_WATERLOO',
  waterloo: 'KITCHENER_WATERLOO',
  london: 'LONDON_ST_THOMAS',
  windsor: 'WINDSOR_ESSEX',
  barrie: 'BARRIE_AND_DISTRICT',
  ottawa: 'OTTAWA',
  kanata: 'OTTAWA',
  nepean: 'OTTAWA',
  orleans: 'OTTAWA',

  // Niagara region rollup
  'st-catharines': 'NIAGARA_REGION',
  'niagara-falls': 'NIAGARA_REGION',
  welland: 'NIAGARA_REGION',
  'niagara-on-the-lake': 'NIAGARA_REGION',
  'fort-erie': 'NIAGARA_REGION',
  grimsby: 'NIAGARA_REGION',

  // Simcoe rollup
  innisfil: 'BARRIE_AND_DISTRICT',
  bradford: 'BARRIE_AND_DISTRICT',

  // GTA rollup — CREA only publishes Mississauga + Oakville-Milton separately
  // inside the GTA. Everything else falls into the Greater Toronto composite.
  toronto: 'GREATER_TORONTO',
  brampton: 'GREATER_TORONTO',
  vaughan: 'GREATER_TORONTO',
  scarborough: 'GREATER_TORONTO',
  markham: 'GREATER_TORONTO',
  'richmond-hill': 'GREATER_TORONTO',
  etobicoke: 'GREATER_TORONTO',
  newmarket: 'GREATER_TORONTO',
  aurora: 'GREATER_TORONTO',
  'king-city': 'GREATER_TORONTO',
  pickering: 'GREATER_TORONTO',
  ajax: 'GREATER_TORONTO',
  whitby: 'GREATER_TORONTO',
  oshawa: 'GREATER_TORONTO',
  clarington: 'GREATER_TORONTO',
  caledon: 'GREATER_TORONTO',
  'halton-hills': 'GREATER_TORONTO',
};

export function hpiSheetForCity(citySlug: string): string | null {
  return CITY_TO_HPI_SHEET[citySlug] ?? null;
}
