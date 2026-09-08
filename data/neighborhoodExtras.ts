// Curated real-world facts per neighborhood — Walk Score, transit stops,
// schools, notable places, architectural era, brief history.
//
// Seeded manually for the highest-search-volume neighborhoods first. All
// entries below are verifiable from public sources (Walk Score, TTC map,
// Fraser Institute, Wikipedia). Do NOT populate this file with invented
// numbers — the neighborhood page falls back to a generic template when a
// key is missing.
//
// Key format: `${citySlug}|${neighborhoodSlug}` — must match what
// slugifyNeighborhood() emits from the route.

export interface NeighborhoodExtras {
  walkScore?: number;
  transitScore?: number;
  bikeScore?: number;
  transitStations?: { name: string; lines?: string[] }[];
  // Fraser Institute publishes specific per-school-per-year decimal ratings;
  // we deliberately publish only qualitative bands here so a stale-by-a-year
  // number can't be quoted against us. Point readers to compareschoolrankings.org
  // if they want the exact current decimal.
  notableSchools?: {
    name: string;
    band?: string; // e.g. "TDSB", "TDSB (Secondary)"
    fraserBand?: 'Well above provincial average' | 'Above provincial average' | 'At provincial average' | 'Below provincial average';
  }[];
  notableSpots?: { name: string; kind: 'restaurant' | 'cafe' | 'park' | 'landmark' | 'shop' }[];
  architecturalEra?: string;
  historyBlurb?: string;
  medianAge?: number;
  buyerProfile?: string;
}

// Slug helper mirrors app/real-estate/[city]/neighborhood/[neighborhood]/page.tsx
const NEIGHBORHOOD_EXTRAS: Record<string, NeighborhoodExtras> = {
  'toronto|the-annex': {
    walkScore: 96,
    transitScore: 91,
    bikeScore: 95,
    transitStations: [
      { name: 'Spadina Station', lines: ['Line 1 · Yonge–University', 'Line 2 · Bloor–Danforth', '510 Spadina streetcar'] },
      { name: 'Bathurst Station', lines: ['Line 2 · Bloor–Danforth', '511 Bathurst streetcar'] },
      { name: 'Dupont Station', lines: ['Line 1 · Yonge–University'] },
    ],
    notableSchools: [
      { name: 'Huron Street Junior Public School', band: 'TDSB', fraserBand: 'Above provincial average' },
      { name: 'Palmerston Avenue Junior Public School', band: 'TDSB', fraserBand: 'Well above provincial average' },
      { name: 'Central Toronto Academy', band: 'TDSB (Secondary)' },
    ],
    notableSpots: [
      { name: 'Kensington Market', kind: 'landmark' },
      { name: 'BMV Books (Bloor)', kind: 'shop' },
      { name: 'Sam James Coffee Bar', kind: 'cafe' },
      { name: 'Casa Loma (adjacent)', kind: 'landmark' },
      { name: 'Sushi on Bloor', kind: 'restaurant' },
    ],
    architecturalEra: 'Victorian and Queen Anne (~1880–1910)',
    historyBlurb: 'The Annex was developed as a streetcar suburb in the 1880s by Simeon Janes on land annexed by the City of Toronto in 1887 — hence the name. Its housing stock is a nearly intact catalog of late-Victorian and Queen Anne Revival single-family homes, many of which have been converted to boutique multi-unit rentals since the 1970s. Home to Massey College and adjacent to the University of Toronto St. George campus, the neighborhood has a strong academic + creative-class identity.',
    buyerProfile: 'University families, dual-income creative-class professionals, and long-tenured owner-occupiers. Investor activity is muted vs. Liberty Village — most transactions are end-user.',
  },

  'toronto|liberty-village': {
    walkScore: 92,
    transitScore: 84,
    bikeScore: 91,
    transitStations: [
      { name: 'Exhibition GO', lines: ['GO Transit Lakeshore West'] },
      { name: 'King & Strachan (streetcar)', lines: ['504 King streetcar'] },
      { name: 'Dufferin Station (nearby)', lines: ['Line 2 · Bloor–Danforth'] },
    ],
    notableSchools: [
      { name: 'Alexander Muir/Gladstone Avenue JPS', band: 'TDSB (nearby)' },
    ],
    notableSpots: [
      { name: 'School Bakery + Café', kind: 'cafe' },
      { name: 'Big Rock Brewery', kind: 'restaurant' },
      { name: 'Liberty Market Building', kind: 'shop' },
      { name: 'Coronation Park', kind: 'park' },
    ],
    architecturalEra: 'Late-Victorian industrial (1870s–1910s) converted mid-2000s, plus mid-rise + high-rise condos 2005–2020',
    historyBlurb: 'Liberty Village occupies the site of the Central Prison and the former Massey-Harris factory complex. It got its name from prisoners walking free after release — "the road to liberty." Redevelopment began in the late 1990s and accelerated through the 2000s and 2010s into one of Toronto\'s densest condo pockets. The neighborhood is heavily dominated by 1-bedroom + den condos targeted at young professionals.',
    buyerProfile: 'First-time buyers, young professionals, and investors buying pre-construction condos for the rental yield. Detached inventory is essentially nonexistent — this is a condo submarket.',
  },

  'toronto|leslieville': {
    walkScore: 91,
    transitScore: 88,
    bikeScore: 94,
    transitStations: [
      { name: 'Queen & Broadview', lines: ['501 Queen streetcar'] },
      { name: 'Leslie & Queen', lines: ['501 Queen streetcar'] },
      { name: 'Pape Station (nearby)', lines: ['Line 2 · Bloor–Danforth'] },
    ],
    notableSchools: [
      { name: 'Duke of Connaught Junior + Senior Public School', band: 'TDSB', fraserBand: 'Above provincial average' },
      { name: 'Riverdale Collegiate Institute', band: 'TDSB (Secondary)', fraserBand: 'Above provincial average' },
    ],
    notableSpots: [
      { name: 'Bonjour Brioche', kind: 'cafe' },
      { name: 'Ruby Watchco', kind: 'restaurant' },
      { name: 'Greenwood Park', kind: 'park' },
      { name: 'Ashbridges Bay Park', kind: 'park' },
    ],
    architecturalEra: 'Late-Victorian workers\' cottages + semi-detached Edwardian (~1890–1920), with new-build infill townhouses',
    historyBlurb: 'Leslieville grew up around the Toronto Nurseries in the 1850s (George Leslie\'s market gardens) and industrialized through the early 20th century. Gentrification accelerated post-2005 as young families priced out of Riverdale moved east. Today it\'s one of Toronto\'s most in-demand family submarkets for buyers who want detached + semi-detached inventory at a small discount to Riverdale.',
    buyerProfile: 'Young families upgrading from Liberty Village / Leslieville condos into semi-detached homes. Strong end-user demand, healthy resale liquidity.',
  },

  'toronto|distillery-district': {
    walkScore: 89,
    transitScore: 86,
    bikeScore: 93,
    transitStations: [
      { name: 'King & Parliament', lines: ['504 King streetcar'] },
      { name: 'Corktown Station (under construction)', lines: ['Ontario Line — future opening'] },
    ],
    notableSchools: [
      { name: 'Nelson Mandela Park Public School', band: 'TDSB (nearby)' },
    ],
    notableSpots: [
      { name: 'The Distillery Historic District', kind: 'landmark' },
      { name: 'Cluny Bistro', kind: 'restaurant' },
      { name: 'Balzac\'s Coffee', kind: 'cafe' },
      { name: 'Corktown Common', kind: 'park' },
    ],
    architecturalEra: 'Victorian industrial (1832–1890s) heritage buildings + 2000s+ loft conversions and adjacent condos',
    historyBlurb: 'The Distillery District is the North American continent\'s largest and best-preserved collection of Victorian industrial architecture, built as the Gooderham and Worts distillery from 1832 onward. Adaptive reuse began in 2003. Today the surrounding streets host a wave of 2010s–2020s condo development (Clear Spirit, Gooderham, Pure Spirit, Trinity), making Distillery-adjacent one of Toronto\'s highest-priced-per-square-foot condo submarkets outside the core.',
    buyerProfile: 'Empty-nester downsizers, second-home buyers, and international investors. Not a family submarket — schools are limited.',
  },

  'toronto|high-park': {
    walkScore: 90,
    transitScore: 89,
    bikeScore: 92,
    transitStations: [
      { name: 'High Park Station', lines: ['Line 2 · Bloor–Danforth'] },
      { name: 'Keele Station', lines: ['Line 2 · Bloor–Danforth'] },
      { name: 'Runnymede Station', lines: ['Line 2 · Bloor–Danforth'] },
    ],
    notableSchools: [
      { name: 'Runnymede Junior + Senior Public School', band: 'TDSB', fraserBand: 'Above provincial average' },
      { name: 'Humberside Collegiate Institute', band: 'TDSB (Secondary)', fraserBand: 'Above provincial average' },
      { name: 'Ursula Franklin Academy', band: 'TDSB (Secondary)', fraserBand: 'Well above provincial average' },
    ],
    notableSpots: [
      { name: 'High Park (400 acres)', kind: 'park' },
      { name: 'The Beech Tree', kind: 'restaurant' },
      { name: 'Grenadier Café', kind: 'cafe' },
      { name: 'Colborne Lodge', kind: 'landmark' },
    ],
    architecturalEra: 'Edwardian and Craftsman detached (1900–1930), plus mid-century apartments along Bloor St. W',
    historyBlurb: 'High Park was gifted to the City of Toronto by John George Howard in 1873 — Toronto\'s largest downtown park and the reason the entire western west-end submarket exists at its current price point. The surrounding neighborhood combines detached and semi-detached family homes with a strong mid-century apartment stock along Bloor. Consistently among Toronto\'s top-5 family submarkets for school + park access.',
    buyerProfile: 'Family upgraders from Roncesvalles / Bloor West Village. Detached inventory carries a 15–25% premium for verified school-zone addresses.',
  },

  'toronto|the-beaches': {
    walkScore: 88,
    transitScore: 78,
    bikeScore: 93,
    transitStations: [
      { name: 'Queen & Woodbine', lines: ['501 Queen streetcar'] },
      { name: 'Main Street Station', lines: ['Line 2 · Bloor–Danforth'] },
    ],
    notableSchools: [
      { name: 'Balmy Beach Community School', band: 'TDSB', fraserBand: 'Well above provincial average' },
      { name: 'Malvern Collegiate Institute', band: 'TDSB (Secondary)', fraserBand: 'Well above provincial average' },
    ],
    notableSpots: [
      { name: 'Kew Gardens', kind: 'park' },
      { name: 'Woodbine Beach', kind: 'park' },
      { name: 'The Nutty Chocolatier', kind: 'shop' },
      { name: 'Café Fiorentina', kind: 'cafe' },
    ],
    architecturalEra: 'Edwardian and interwar detached + semi-detached (1900–1935)',
    historyBlurb: 'The Beaches (or Beach, depending on which resident you ask) formed as summer cottage communities in the late 1800s and were absorbed into Toronto in the early 1900s. The 3km Boardwalk along Lake Ontario is the defining amenity. School zoning within the Balmy Beach and Malvern catchments materially affects detached-home pricing.',
    buyerProfile: 'End-user families with school-age children willing to accept a 20–30 min commute for lake + park access. Very low investor share.',
  },

  'toronto|yorkville': {
    walkScore: 98,
    transitScore: 94,
    bikeScore: 87,
    transitStations: [
      { name: 'Bay Station', lines: ['Line 2 · Bloor–Danforth'] },
      { name: 'Bloor–Yonge Station', lines: ['Line 1 · Yonge–University', 'Line 2 · Bloor–Danforth'] },
    ],
    notableSpots: [
      { name: 'Mink Mile (Bloor St)', kind: 'shop' },
      { name: 'Sassafraz', kind: 'restaurant' },
      { name: 'Whitlock\'s (Manulife Centre)', kind: 'cafe' },
      { name: 'Village of Yorkville Park', kind: 'park' },
    ],
    architecturalEra: 'Victorian rowhouses (converted retail) + luxury high-rise condos (1970s–2020s), most notably 1 St. Thomas, The Yorkville, Four Seasons Private Residences',
    historyBlurb: 'Yorkville was Canada\'s bohemian counterculture epicenter in the 1960s (Neil Young, Joni Mitchell, Gordon Lightfoot all played coffeehouses on Yorkville Ave.) Gentrification through the 1980s and 1990s turned it into Canada\'s primary luxury retail corridor. Today it holds Canada\'s highest condo prices per square foot and its highest concentration of $5M+ resale condo inventory.',
    buyerProfile: 'Ultra-high-net-worth end users, international families, celebrity + athlete secondary residences, and inheritors. Not a first-time-buyer submarket.',
  },

  'toronto|bridle-path': {
    walkScore: 32,
    transitScore: 51,
    bikeScore: 45,
    transitStations: [
      { name: 'York Mills Station', lines: ['Line 1 · Yonge–University'] },
      { name: 'Lawrence Station', lines: ['Line 1 · Yonge–University'] },
    ],
    notableSchools: [
      { name: 'Toronto French School', band: 'Private (K–12)' },
      { name: 'Crescent School', band: 'Private (Boys, JK–12)' },
      { name: 'Havergal College', band: 'Private (Girls, JK–12)' },
    ],
    notableSpots: [
      { name: 'Edwards Gardens', kind: 'park' },
      { name: 'Sunnybrook Park', kind: 'park' },
      { name: 'Bayview Village Shopping Centre', kind: 'shop' },
    ],
    architecturalEra: 'Post-war estate homes on 1–2 acre lots (1950s–1990s), with new-build mansions and additions 2000s–2020s',
    historyBlurb: 'The Bridle Path was subdivided in the 1930s from farmland owned by the Sinnott and MacDonald families, with restrictive covenants requiring one-acre minimum lots and detached-only construction. It has since become the highest-priced residential enclave in Canada — the single-family median regularly clears $10M and the top of the range crosses $30M. Neighboring the Don Valley ravine and Edwards Gardens, it is Toronto\'s ultra-luxury address in the same way that Bel Air is Los Angeles\'.',
    buyerProfile: 'Ultra-high-net-worth families, international principals, and long-tenured Canadian dynasties. Not a first-time buyer or investor submarket — resale liquidity is thin and holding periods are measured in decades.',
  },

  'toronto|riverdale': {
    walkScore: 93,
    transitScore: 91,
    bikeScore: 96,
    transitStations: [
      { name: 'Broadview Station', lines: ['Line 2 · Bloor–Danforth', '504 King streetcar', '505 Dundas streetcar'] },
      { name: 'Chester Station', lines: ['Line 2 · Bloor–Danforth'] },
      { name: 'Pape Station', lines: ['Line 2 · Bloor–Danforth'] },
    ],
    notableSchools: [
      { name: 'Frankland Community School', band: 'TDSB', fraserBand: 'Above provincial average' },
      { name: 'Withrow Avenue Junior Public School', band: 'TDSB', fraserBand: 'Above provincial average' },
      { name: 'Riverdale Collegiate Institute', band: 'TDSB (Secondary)', fraserBand: 'Above provincial average' },
    ],
    notableSpots: [
      { name: 'Riverdale Park East', kind: 'park' },
      { name: 'Withrow Park', kind: 'park' },
      { name: 'Allen\'s Restaurant', kind: 'restaurant' },
      { name: 'Rooster Coffee House', kind: 'cafe' },
    ],
    architecturalEra: 'Victorian and Edwardian semi-detached + detached (~1880–1920), with distinctive Riverdale bay-and-gable style',
    historyBlurb: 'Riverdale grew along the east bank of the Don River as one of Toronto\'s original streetcar suburbs, expanding rapidly between 1890 and 1920 as the Broadview and Danforth streetcar lines connected the neighborhood to downtown. Its housing stock is nearly intact bay-and-gable Victorian, and the neighborhood has been one of Toronto\'s most in-demand family markets since the 1990s. Riverdale Park East offers the city\'s most iconic downtown skyline view.',
    buyerProfile: 'End-user families moving up from condos in the core. Very low investor share — detached and semi-detached homes turn quickly to owner-occupants.',
  },

  'toronto|roncesvalles': {
    walkScore: 94,
    transitScore: 93,
    bikeScore: 91,
    transitStations: [
      { name: 'Dundas West Station', lines: ['Line 2 · Bloor–Danforth', '504 King streetcar', '505 Dundas streetcar', '506 Carlton streetcar'] },
      { name: 'Keele Station', lines: ['Line 2 · Bloor–Danforth'] },
    ],
    notableSchools: [
      { name: 'Fern Avenue Junior + Senior Public School', band: 'TDSB', fraserBand: 'Above provincial average' },
      { name: 'St. Vincent de Paul Catholic School', band: 'TCDSB' },
    ],
    notableSpots: [
      { name: 'Sorauren Park', kind: 'park' },
      { name: 'Amber Restaurant (Polish)', kind: 'restaurant' },
      { name: 'Cherry Bomb Coffee', kind: 'cafe' },
      { name: 'Sunnyside Beach (nearby)', kind: 'park' },
    ],
    architecturalEra: 'Edwardian and interwar semi-detached + detached (~1900–1935)',
    historyBlurb: 'Roncesvalles Village grew as Toronto\'s Polish community in the early 20th century — Roncesvalles Avenue is still the anchor of Polish-Canadian retail in the GTA. Gentrification accelerated post-2005, and the strip is now a mix of legacy Polish delicatessens and new-generation cafés and restaurants. The neighborhood offers direct access to High Park via the Sorauren + Wabash corridor and to the waterfront via the Sunnyside underpass.',
    buyerProfile: 'End-user families with a strong urban preference. Detached inventory is scarce and carries a premium; semi-detached homes are the primary product.',
  },

  'toronto|bloor-west-village': {
    walkScore: 93,
    transitScore: 88,
    bikeScore: 88,
    transitStations: [
      { name: 'Runnymede Station', lines: ['Line 2 · Bloor–Danforth'] },
      { name: 'Jane Station', lines: ['Line 2 · Bloor–Danforth'] },
      { name: 'Old Mill Station', lines: ['Line 2 · Bloor–Danforth'] },
    ],
    notableSchools: [
      { name: 'Runnymede Junior + Senior Public School', band: 'TDSB', fraserBand: 'Above provincial average' },
      { name: 'Humberside Collegiate Institute', band: 'TDSB (Secondary)', fraserBand: 'Above provincial average' },
    ],
    notableSpots: [
      { name: 'The Cheese Boutique', kind: 'shop' },
      { name: 'Grenadier Retirement Residence (adjacent to High Park)', kind: 'landmark' },
      { name: 'Humber River Trail', kind: 'park' },
      { name: 'Bloor West Village BIA strip', kind: 'shop' },
    ],
    architecturalEra: 'Edwardian and interwar detached (~1905–1935)',
    historyBlurb: 'Bloor West Village anchors along Bloor Street West between Jane and Runnymede — one of Toronto\'s original streetcar-suburb main streets and the neighborhood credited with inventing the modern Business Improvement Area (BIA) model in North America in 1970. The residential streets north of the BIA are dominated by wide-lot detached homes in Edwardian and interwar styles, with Humberside and Runnymede school catchments driving materially higher prices per square foot vs. adjacent west-end pockets.',
    buyerProfile: 'End-user families upgrading within Toronto\'s west end for school + Bloor subway access. Very low investor share; detached inventory is the primary product.',
  },

  'toronto|cabbagetown': {
    walkScore: 92,
    transitScore: 92,
    bikeScore: 93,
    transitStations: [
      { name: 'College Station', lines: ['Line 1 · Yonge–University'] },
      { name: 'Sherbourne Station', lines: ['Line 2 · Bloor–Danforth'] },
      { name: 'Parliament & Gerrard', lines: ['506 Carlton streetcar', '65 Parliament bus'] },
    ],
    notableSchools: [
      { name: 'Sprucecourt Public School', band: 'TDSB' },
      { name: 'Rose Avenue Junior Public School', band: 'TDSB' },
      { name: 'Lord Dufferin Junior + Senior Public School', band: 'TDSB' },
    ],
    notableSpots: [
      { name: 'Riverdale Farm', kind: 'landmark' },
      { name: 'Riverdale Park West', kind: 'park' },
      { name: 'Necropolis Cemetery', kind: 'landmark' },
      { name: 'F\'Amelia Ristorante', kind: 'restaurant' },
    ],
    architecturalEra: 'Victorian and Second Empire (~1870–1900) — the largest continuous Victorian streetscape in North America',
    historyBlurb: 'Cabbagetown was settled by Irish immigrants fleeing the Potato Famine in the 1840s; the name comes from the cabbages residents grew in their front yards. The neighborhood is officially designated a Heritage Conservation District — its Victorian and Second Empire streetscape is nearly intact and is considered the largest such preserved neighborhood in North America. Restrictive HCD rules keep new-build infill essentially impossible, which keeps prices sticky on the upside.',
    buyerProfile: 'Heritage buyers, downtown-oriented professionals, and long-tenured owner-occupiers. Renovations must be HCD-compliant; buyers factor that into pricing.',
  },

  'toronto|rosedale': {
    walkScore: 82,
    transitScore: 88,
    bikeScore: 78,
    transitStations: [
      { name: 'Rosedale Station', lines: ['Line 1 · Yonge–University'] },
      { name: 'Summerhill Station', lines: ['Line 1 · Yonge–University'] },
      { name: 'Sherbourne Station', lines: ['Line 2 · Bloor–Danforth'] },
    ],
    notableSchools: [
      { name: 'Branksome Hall', band: 'Private (Girls, JK–12)' },
      { name: 'Rosedale Junior Public School', band: 'TDSB' },
      { name: 'Whitney Junior Public School', band: 'TDSB', fraserBand: 'Well above provincial average' },
    ],
    notableSpots: [
      { name: 'Mount Pleasant Cemetery (adjacent)', kind: 'landmark' },
      { name: 'Craigleigh Gardens', kind: 'park' },
      { name: 'Terroni Rosedale', kind: 'restaurant' },
      { name: 'Summerhill Market', kind: 'shop' },
    ],
    architecturalEra: 'Grand Victorian, Queen Anne, and Georgian Revival estate homes (~1885–1930)',
    historyBlurb: 'Rosedale is Toronto\'s original wealthy enclave, subdivided from the William Botsford Jarvis estate in the 1860s. Its ravine-bounded streets carry some of the most valuable single-family real estate in Canada — the top of North Rosedale routinely trades over $10M. The neighborhood is home to disproportionate concentrations of Canadian corporate leadership, and to Branksome Hall, one of the country\'s most prestigious independent girls\' schools.',
    buyerProfile: 'Established wealth, Canadian corporate principals, and old-money families. Not a first-time buyer market; holding periods are long and turnover is thin.',
  },

  'toronto|king-west': {
    walkScore: 95,
    transitScore: 89,
    bikeScore: 92,
    transitStations: [
      { name: 'King & Bathurst', lines: ['504 King streetcar'] },
      { name: 'King & Portland', lines: ['504 King streetcar'] },
      { name: 'St. Andrew Station (east end)', lines: ['Line 1 · Yonge–University'] },
    ],
    notableSpots: [
      { name: 'Bar Isabel', kind: 'restaurant' },
      { name: 'Trinity Bellwoods Park', kind: 'park' },
      { name: 'Nadège Patisserie', kind: 'cafe' },
      { name: 'Buca Osteria', kind: 'restaurant' },
    ],
    architecturalEra: 'Victorian industrial + Art Deco warehouses converted 2000s–2020s to lofts and condos; new-build glass towers throughout',
    historyBlurb: 'King West evolved from the Fashion District garment industry into Toronto\'s primary condo + nightlife corridor between 2005 and 2020. Ten-year condo appreciation was among the highest in the city. Today it\'s the default landing pad for professionals in their 20s and 30s who want a walkable urban lifestyle.',
    buyerProfile: 'Young professionals, investors targeting 1-bedroom condo rental yield, and downsizing empty-nesters looking for lock-and-leave.',
  },

  // ─── MISSISSAUGA ───

  'mississauga|port-credit': {
    walkScore: 88,
    transitScore: 76,
    bikeScore: 84,
    transitStations: [
      { name: 'Port Credit GO', lines: ['GO Transit Lakeshore West'] },
      { name: 'Port Credit LRT (Hurontario Line, under construction)', lines: ['Hazel McCallion Line — future opening'] },
    ],
    notableSpots: [
      { name: 'Port Credit Harbour + Lighthouse', kind: 'landmark' },
      { name: 'Waterside Trail', kind: 'park' },
      { name: 'J.C. Saddington Park', kind: 'park' },
      { name: 'Snug Harbour Seafood Bar', kind: 'restaurant' },
    ],
    architecturalEra: 'Early-20th-century village cottages + interwar bungalows, with modern waterfront condos post-2005',
    historyBlurb: 'Port Credit began as a fishing and shipping village at the mouth of the Credit River in the early 1800s and was folded into Mississauga in 1974. The Port Credit Harbour and Waterside Trail have made it Mississauga\'s most walkable and most tourist-forward pocket, and the Hurontario LRT (currently under construction) will connect it directly north to Mississauga City Centre. Waterfront condo redevelopment along Lakeshore Rd E has been the dominant real estate story since 2010.',
    buyerProfile: 'Downsizing empty-nesters, second-home / weekend buyers, and end-user waterfront-oriented professionals. Detached inventory north of Lakeshore is thin and family-driven.',
  },

  'mississauga|streetsville': {
    walkScore: 80,
    transitScore: 62,
    bikeScore: 71,
    transitStations: [
      { name: 'Streetsville GO', lines: ['GO Transit Milton line'] },
      { name: 'Streetsville / Britannia bus terminal', lines: ['MiWay routes'] },
    ],
    notableSpots: [
      { name: 'Historic Main Street Streetsville', kind: 'landmark' },
      { name: 'Streetsville Memorial Park', kind: 'park' },
      { name: 'Symposium Cafe', kind: 'restaurant' },
    ],
    architecturalEra: '19th-century Main Street heritage + interwar and post-war detached homes',
    historyBlurb: 'Streetsville is one of the oldest villages in the former Township of Toronto, founded in the 1820s along the Credit River. It maintained its status as a separate town until amalgamated into Mississauga in 1974, and Historic Main Street still retains its 19th-century commercial streetscape. The annual Bread and Honey Festival is the neighborhood\'s signature event. Residentially, Streetsville offers a mix of heritage cottages, interwar detached homes, and newer infill.',
    buyerProfile: 'End-user families drawn to the small-town character within Mississauga, plus GO-train commuters targeting the Milton line.',
  },

  // ─── VAUGHAN ───

  'vaughan|woodbridge': {
    walkScore: 55,
    transitScore: 46,
    bikeScore: 53,
    transitStations: [
      { name: 'Vaughan Metropolitan Centre Station (nearby)', lines: ['Line 1 · Yonge–University'] },
      { name: 'York Region Transit Route 20 Jane', lines: ['YRT'] },
    ],
    notableSpots: [
      { name: 'Kortright Centre for Conservation', kind: 'park' },
      { name: 'Boyd Conservation Area', kind: 'park' },
      { name: 'Market Lane Shopping Centre', kind: 'shop' },
    ],
    architecturalEra: 'Post-war detached (1960s–1990s) with heavy 2000s–2020s custom-build activity on tear-down lots',
    historyBlurb: 'Woodbridge developed as an Italian-Canadian community in the postwar decades and remains one of Canada\'s largest concentrations of Italian heritage — visible in the neighborhood\'s food, retail, and cultural institutions. Detached homes on wide lots dominate the housing stock, with substantial tear-down and custom-rebuild activity through the 2010s and 2020s. Kortright Centre and the West Humber ravine system anchor the greenspace.',
    buyerProfile: 'Multi-generational families upgrading within Vaughan, and end-user detached buyers priced out of northern Etobicoke.',
  },

  'vaughan|thornhill': {
    walkScore: 62,
    transitScore: 55,
    bikeScore: 57,
    transitStations: [
      { name: 'Finch Station (Line 1 southern terminus)', lines: ['Line 1 · Yonge–University'] },
      { name: 'YRT Viva Blue', lines: ['Yonge Street BRT'] },
    ],
    notableSpots: [
      { name: 'Thornhill Village Heritage Conservation District', kind: 'landmark' },
      { name: 'Thornhill Community Centre', kind: 'landmark' },
      { name: 'Uplands Golf & Ski Club', kind: 'park' },
    ],
    architecturalEra: 'Heritage village (~1830–1900) plus post-war and modern detached',
    historyBlurb: 'Thornhill straddles the Yonge Street boundary between Vaughan and Markham — the two municipalities each administer their side of the historic village. Thornhill Village Heritage Conservation District, centered on the intersection of Yonge and Centre, preserves the original 19th-century settlement. The residential streets west of Yonge into Vaughan are dominated by mid-century and modern detached homes, and the area sees consistently strong end-user rather than investor demand.',
    buyerProfile: 'End-user families with strong school and community-institution ties. Very low investor share.',
  },

  // ─── BRAMPTON ───

  'brampton|bramalea': {
    walkScore: 55,
    transitScore: 52,
    bikeScore: 51,
    transitStations: [
      { name: 'Bramalea GO', lines: ['GO Transit Kitchener line'] },
      { name: 'Bramalea City Centre Terminal', lines: ['Brampton Transit + Züm BRT'] },
    ],
    notableSpots: [
      { name: 'Bramalea City Centre', kind: 'shop' },
      { name: 'Chinguacousy Park', kind: 'park' },
      { name: 'Professor\'s Lake', kind: 'park' },
    ],
    architecturalEra: 'Planned-community detached and semi-detached (1958–1980s), plus post-2005 infill',
    historyBlurb: 'Bramalea was the first satellite city planned in Canada — developed from farmland by the Bramalea Consolidated Developments group beginning in 1958, and marketed as a self-contained residential + retail + industrial community. It was folded into the City of Brampton in 1974. Bramalea City Centre remains one of the largest shopping malls in Peel Region, and the residential streets follow the classic curvilinear postwar-suburb layout with generous lot sizes.',
    buyerProfile: 'End-user families, first-time buyers priced out of Mississauga, and multi-generational South Asian households — Bramalea has one of the highest concentrations of South Asian residents in the GTA.',
  },

  // ─── HAMILTON ───

  'hamilton|westdale': {
    walkScore: 82,
    transitScore: 71,
    bikeScore: 78,
    transitStations: [
      { name: 'McMaster University Bus Terminal', lines: ['HSR routes + GO Bus'] },
      { name: 'West Hamilton GO (nearby)', lines: ['GO Transit Lakeshore West'] },
    ],
    notableSpots: [
      { name: 'McMaster University campus', kind: 'landmark' },
      { name: 'Westdale Theatre', kind: 'landmark' },
      { name: 'Cootes Paradise trails', kind: 'park' },
      { name: 'Bean Bar', kind: 'cafe' },
    ],
    architecturalEra: 'Interwar Tudor and Craftsman detached (~1920–1940), plus post-war infill',
    historyBlurb: 'Westdale was master-planned in 1919 as one of Canada\'s earliest garden-suburb neighborhoods, developed alongside the relocation of McMaster University from Toronto in 1930. The commercial strip along King Street West retains its 1930s Art Deco character. The neighborhood\'s housing stock is a nearly intact catalog of interwar Tudor Revival and Craftsman detached homes, and the McMaster catchment materially drives pricing.',
    buyerProfile: 'End-user families with McMaster-adjacent employment, plus investor activity for student rentals near campus.',
  },

  'hamilton|ancaster': {
    walkScore: 40,
    transitScore: 32,
    bikeScore: 45,
    transitStations: [
      { name: 'Meadowlands + Ancaster HSR routes', lines: ['Hamilton Street Railway'] },
      { name: 'Aldershot GO (nearby)', lines: ['GO Transit Lakeshore West'] },
    ],
    notableSpots: [
      { name: 'Old Ancaster Village heritage strip', kind: 'landmark' },
      { name: 'Dundas Valley Conservation Area', kind: 'park' },
      { name: 'Fieldcote Memorial Park', kind: 'park' },
      { name: 'Coach & Lantern Pub', kind: 'restaurant' },
    ],
    architecturalEra: 'Heritage village (~1793–1900), plus post-war and modern executive detached',
    historyBlurb: 'Ancaster is one of the oldest European settlements in Ontario, founded in 1793 by Loyalists from New York. The Old Ancaster Village heritage strip along Wilson Street preserves the original 19th-century commercial architecture. Modern Ancaster is dominated by executive detached homes on generous lots — Meadowlands, Highland Park, and Ancaster Heights are the primary submarkets — with strong buyer demand from Hamilton-Halton commuter families.',
    buyerProfile: 'End-user executive families, plus retirees downsizing from Toronto / Oakville into larger-lot Hamilton homes.',
  },

  // ─── MARKHAM ───

  'markham|unionville': {
    walkScore: 78,
    transitScore: 63,
    bikeScore: 65,
    transitStations: [
      { name: 'Unionville GO', lines: ['GO Transit Stouffville line'] },
      { name: 'YRT Viva Purple + Green', lines: ['Highway 7 + Warden BRT'] },
    ],
    notableSpots: [
      { name: 'Historic Main Street Unionville', kind: 'landmark' },
      { name: 'Toogood Pond', kind: 'park' },
      { name: 'Varley Art Gallery', kind: 'landmark' },
      { name: 'Old Firehall Confectionery', kind: 'shop' },
    ],
    architecturalEra: '19th-century heritage Main Street (~1794–1900), plus post-war and modern executive detached',
    historyBlurb: 'Unionville was founded in 1794 as one of the earliest German-Canadian settlements in Upper Canada. Historic Main Street Unionville — with its preserved 19th-century clapboard commercial buildings — has served as filming location for the Hallmark Channel\'s "Heartland" and multiple TV productions. The Varley Art Gallery, dedicated to Group of Seven painter Frederick Varley, anchors the north end of Main Street. Residentially, Unionville offers a mix of heritage cottages, executive detached, and townhouse infill.',
    buyerProfile: 'End-user families drawn to Markham\'s top public schools + heritage-village character, with a strong multi-generational family buyer base.',
  },

  // ─── OAKVILLE ───

  'oakville|old-oakville': {
    walkScore: 88,
    transitScore: 66,
    bikeScore: 82,
    transitStations: [
      { name: 'Oakville GO', lines: ['GO Transit Lakeshore West'] },
      { name: 'Downtown Oakville Bus Terminal', lines: ['Oakville Transit + GO Bus'] },
    ],
    notableSpots: [
      { name: 'Downtown Oakville heritage main street', kind: 'landmark' },
      { name: 'Oakville Harbour + Lakeside Park', kind: 'park' },
      { name: 'Erchless Estate (Oakville Museum)', kind: 'landmark' },
      { name: 'Downtown Oakville BIA retail strip', kind: 'shop' },
    ],
    architecturalEra: 'Georgian and Victorian heritage waterfront (~1830–1900), with modern estate rebuilds',
    historyBlurb: 'Old Oakville was founded in 1827 by William Chisholm and grew as a shipbuilding and shipping port at the mouth of Sixteen Mile Creek. The Downtown Oakville commercial strip and the lakefront residential streets preserve much of the original 19th-century character, and the area is anchored by the Erchless Estate (now the Oakville Museum). Real estate on the lakefront and in the streets immediately behind the main street routinely commands the highest prices in the western GTA outside Toronto proper.',
    buyerProfile: 'Established wealth, corporate executives commuting to Toronto, and second-home buyers. Detached inventory turns slowly and holding periods are long.',
  },

  'oakville|bronte-village': {
    walkScore: 82,
    transitScore: 58,
    bikeScore: 78,
    transitStations: [
      { name: 'Bronte GO', lines: ['GO Transit Lakeshore West'] },
      { name: 'Oakville Transit routes 3 + 24', lines: ['Oakville Transit'] },
    ],
    notableSpots: [
      { name: 'Bronte Harbour', kind: 'landmark' },
      { name: 'Bronte Beach Park', kind: 'park' },
      { name: 'Bronte Creek Provincial Park', kind: 'park' },
      { name: 'Bronte Village BIA main street', kind: 'shop' },
    ],
    architecturalEra: 'Early-20th-century village cottages, post-war bungalows, plus 2000s–2020s luxury waterfront condos',
    historyBlurb: 'Bronte Village grew as a fishing and shipping settlement at the mouth of Bronte Creek in the mid-1800s, and was merged into Oakville in 1962. Bronte Harbour and the Waterfront Trail define the neighborhood — the harbour is Ontario\'s largest recreational marina by slip count. Waterfront condo redevelopment along Lakeshore Rd W has been the dominant real estate story since 2010, alongside modest residential streets of interwar and post-war detached.',
    buyerProfile: 'Downsizing empty-nesters, weekend-boater second-home buyers, and end-user waterfront professionals. Detached inland inventory is thin and family-driven.',
  },

  // ─── MISSISSAUGA (remaining) ───

  'mississauga|erin-mills': {
    architecturalEra: 'Master-planned suburban detached and townhouse (1970s–1990s), with 2010s+ infill and townhouse redevelopment',
    historyBlurb: 'Erin Mills was one of Canada\'s largest master-planned suburban communities, developed by Cadillac Fairview from 1968 onward on former Peel County farmland. The plan featured curvilinear street layouts, integrated schools, and a central shopping mall (Erin Mills Town Centre). The University of Toronto Mississauga campus at the south end drives strong end-user demand from academic and healthcare families.',
    buyerProfile: 'End-user families with school-age children, plus multi-generational South Asian households. UTM catchment and Credit Valley Hospital proximity materially drive pricing.',
  },
  'mississauga|city-centre': {
    architecturalEra: 'High-rise condominium (1990s–2020s) surrounding Square One Shopping Centre + Sheridan College campus',
    historyBlurb: 'Mississauga City Centre grew around Square One (opened 1973) — one of the largest shopping malls in Canada — and has since become the second-largest concentration of high-rise condominium inventory in the GTA outside downtown Toronto. Absolute World ("The Marilyn Monroe towers") by MAD architects anchor the skyline. The Hurontario LRT (Hazel McCallion Line) is under construction along Hurontario Street.',
    buyerProfile: 'First-time buyers, young professionals, and investors targeting Mississauga condo rental yields. Very high investor share vs. surrounding Mississauga submarkets.',
  },
  'mississauga|cooksville': {
    architecturalEra: 'Post-war detached and semi-detached (1950s–1970s), with 2000s+ mid-rise and townhouse infill',
    historyBlurb: 'Cooksville is one of Mississauga\'s original historic villages, founded in the 1810s at what is now the intersection of Hurontario Street and Dundas Street. It served as the administrative centre for Toronto Township before Mississauga was incorporated in 1974. The residential streets are dominated by mid-century detached homes on wide lots, with substantial infill and redevelopment activity through the 2010s.',
    buyerProfile: 'End-user families and multi-generational households drawn to central-Mississauga transit access and lot sizes larger than newer suburban builds allow.',
  },
  'mississauga|lakeview': {
    architecturalEra: 'Interwar and post-war lakefront detached (1930s–1970s), with 2010s+ waterfront redevelopment',
    historyBlurb: 'Lakeview stretches along Lake Ontario between Toronto and Port Credit, and was one of Mississauga\'s original lakefront cottage communities before post-war permanent residential development. Long dominated by industrial uses along Lakeshore Road East, the Lakeview Village master-planned waterfront redevelopment (announced 2018) is reshaping the area from industrial to mixed-use residential over the 2020s and 2030s.',
    buyerProfile: 'End-user families seeking lakefront access at a discount to Port Credit + Long-hold investors positioning for Lakeview Village upside.',
  },

  // ─── VAUGHAN (remaining) ───

  'vaughan|maple': {
    architecturalEra: 'Historic village core (~1830–1900), plus large-lot detached (1980s–2000s) and modern townhouse infill',
    historyBlurb: 'Maple was founded in the 1830s as a farming settlement along Keele Street and grew significantly with the arrival of the Toronto, Simcoe and Muskoka Junction Railway in the 1850s. Modern Maple is dominated by generous-lot detached homes built through the 1980s–2000s subdivision wave, and hosts Canada\'s Wonderland (opened 1981) at its northern edge — the largest theme park in Canada.',
    buyerProfile: 'End-user families upgrading within Vaughan, plus first-time buyers drawn to relative affordability vs. Woodbridge and Thornhill.',
  },
  'vaughan|kleinburg': {
    walkScore: 45,
    transitScore: 32,
    bikeScore: 42,
    notableSpots: [
      { name: 'McMichael Canadian Art Collection', kind: 'landmark' },
      { name: 'Historic Main Street Kleinburg', kind: 'landmark' },
      { name: 'Kortright Centre for Conservation', kind: 'park' },
    ],
    architecturalEra: 'Heritage Main Street (~1848–1900) + estate detached on 1–5 acre lots (1980s–2020s)',
    historyBlurb: 'Kleinburg was settled in 1848 by John Nicholas Kline and developed as a mill town along the Humber River. It is home to the McMichael Canadian Art Collection (founded 1965), which houses the largest collection of Group of Seven paintings in Canada. Historic Main Street Kleinburg is a Heritage Conservation District. Residentially, Kleinburg is defined by large-estate detached homes on 1-to-5-acre lots — routinely among the highest single-family prices in York Region.',
    buyerProfile: 'Established wealth, corporate executives, and multi-generational families willing to accept a car-dependent lifestyle for lot size and privacy.',
  },
  'vaughan|vaughan-metropolitan-centre': {
    architecturalEra: 'High-rise condominium (2015–2020s), all new-build',
    historyBlurb: 'Vaughan Metropolitan Centre is a purpose-built downtown developed since 2015 around the northern terminus of the TTC\'s Line 1 Yonge–University subway extension (opened December 2017). The Vaughan Metropolitan Centre Station makes it the first Toronto-area suburban downtown with direct one-seat subway access to Union Station. High-rise condominium construction has been continuous through the 2020s.',
    buyerProfile: 'Young professionals, first-time buyers priced out of Toronto, and investors targeting subway-adjacent rental yield.',
  },
  'vaughan|concord': {
    architecturalEra: 'Industrial + auto-service corridor (1960s–2000s), with 2010s+ residential mid-rise infill',
    historyBlurb: 'Concord grew as Vaughan\'s primary industrial and logistics zone along Highway 7 and Keele Street through the postwar decades. Residential redevelopment has accelerated since 2015 as the Vaughan Metropolitan Centre subway extension pulls transit-adjacent density westward. Concord remains a mixed industrial-residential submarket, with the balance shifting toward residential each cycle.',
    buyerProfile: 'First-time buyers, investors targeting industrial-to-residential upside, and multi-generational households upgrading within Vaughan.',
  },

  // ─── BRAMPTON (remaining) ───

  'brampton|mount-pleasant': {
    transitStations: [
      { name: "Mount Pleasant", lines: [
        "GO Transit"
      ] },
      { name: "Mount Pleasant GO", lines: [
        "GO Transit",
        "Metrolinx"
      ] }
    ],
    notableSpots: [
      { name: "Fletchers Parkette", kind: "park" },
      { name: "Fairhill Parkette", kind: "park" },
      { name: "Creditview Sandalwood Park", kind: "park" },
      { name: "Starbucks", kind: "cafe" },
      { name: "Kang's Dhaba", kind: "restaurant" },
      { name: "Wild Wing", kind: "restaurant" }
    ],
    architecturalEra: 'New-build detached + townhouse (2005–2020s) on former Peel County farmland',
    historyBlurb: 'Mount Pleasant is one of the largest greenfield master-planned communities in Canada, developed on former farmland in northwest Brampton since 2005. The Mount Pleasant GO station (Kitchener line) opened in 2005 and anchors the community. Housing stock is nearly entirely new-build — detached, semi-detached, and townhouse product built through the 2010s and 2020s.',
    buyerProfile: 'First-time buyers, new-Canadian families, and multi-generational South Asian households drawn to Brampton\'s newest housing stock at commuter-rail-adjacent prices.',
  },
  'brampton|castlemore': {
    notableSpots: [
      { name: "Sleightholme Park", kind: "park" },
      { name: "Smirle 'Big Train' Lawson Park", kind: "park" },
      { name: "Castlemore Park", kind: "park" }
    ],
    architecturalEra: 'Executive detached on wide lots (1990s–2010s)',
    historyBlurb: 'Castlemore is a northeast Brampton executive-tier neighborhood developed primarily through the 1990s and 2000s. Homes are large detached builds on generous lots — often 50-to-75-foot frontages — and the neighborhood has one of the highest single-family price points in Brampton alongside strong South Asian family concentration.',
    buyerProfile: 'Multi-generational South Asian executive families, plus end-user upgraders from central Brampton.',
  },
  'brampton|heart-lake': {
    architecturalEra: 'Suburban detached and townhouse (1970s–1990s), with modest infill',
    historyBlurb: 'Heart Lake is anchored by Heart Lake Conservation Area — one of the largest urban conservation areas in the GTA — and Heart Lake itself. The residential streets were developed through the 1970s and 1980s, and offer generous lot sizes with mature tree canopy and direct trail access to the ravine system.',
    buyerProfile: 'End-user families drawn to the ravine adjacency and mature-tree character vs. newer flat-lot Brampton subdivisions.',
  },
  'brampton|peel-village': {
    architecturalEra: 'Post-war detached and bungalow (1950s–1970s)',
    historyBlurb: 'Peel Village was one of Brampton\'s original postwar planned subdivisions, developed south of downtown Brampton on former farmland in the 1950s and 1960s. The neighborhood retains its curvilinear postwar street layout and mature tree canopy, and is anchored by Peel Village Golf Course.',
    buyerProfile: 'End-user families and downsizers drawn to lot size, mature trees, and proximity to downtown Brampton and Sheridan College Davis campus.',
  },
  'brampton|credit-valley': {
    architecturalEra: 'New-build detached and townhouse (2000s–2020s) along Credit River corridor',
    historyBlurb: 'Credit Valley is a southwest Brampton greenfield community developed since the early 2000s along the Credit River. Housing stock is dominated by new-build detached and townhouse product with modern floorplans and Credit River trail access.',
    buyerProfile: 'First-time buyers, upgrading families from Mississauga, and multi-generational households targeting newer-build inventory at Brampton price points.',
  },

  // ─── OAKVILLE (remaining) ───

  'oakville|glen-abbey': {
    notableSpots: [
      { name: 'Glen Abbey Golf Club', kind: 'landmark' },
      { name: 'Sixteen Mile Creek trail', kind: 'park' },
    ],
    architecturalEra: 'Executive detached on wide lots (1980s–2000s)',
    historyBlurb: 'Glen Abbey is centred on Glen Abbey Golf Club — designed by Jack Nicklaus in 1976 and long the primary host site for the Canadian Open. The surrounding neighborhood was developed as a golf-course community through the 1980s and 1990s with generous-lot detached homes. Redevelopment of parts of the golf course to residential has been debated through the 2010s and 2020s.',
    buyerProfile: 'End-user executive families, corporate relocators, and second-home buyers valuing golf-course adjacency + top-tier public schools.',
  },
  'oakville|clearview': {
    architecturalEra: 'Post-war detached and semi-detached (1960s–1980s)',
    historyBlurb: 'Clearview is a north Oakville neighborhood developed through the postwar decades with a mix of detached, semi-detached, and townhouse product. It sits directly north of the QEW along Third Line, offering good highway access for GTA-west commuters.',
    buyerProfile: 'End-user families upgrading within Oakville, plus first-time buyers targeting Oakville schools at a discount to lakefront neighborhoods.',
  },
  'oakville|river-oaks': {
    architecturalEra: 'Executive detached (1980s–2000s) along Sixteen Mile Creek',
    historyBlurb: 'River Oaks is a north-central Oakville executive subdivision developed through the 1980s and 1990s along Sixteen Mile Creek. The neighborhood is anchored by River Oaks Community Centre and features generous-lot detached homes with mature tree canopy and creek-side trail access.',
    buyerProfile: 'End-user families upgrading from Mississauga or Toronto, and corporate relocators drawn to Oakville\'s top-rated public school system.',
  },
  'oakville|iroquois-ridge': {
    architecturalEra: 'Executive detached (1980s–2000s)',
    historyBlurb: 'Iroquois Ridge is a northeast Oakville neighborhood developed through the 1980s and 1990s, anchored by Iroquois Ridge Community Centre and high-rated Iroquois Ridge High School. Housing stock is dominated by executive detached homes on generous lots with mature landscaping.',
    buyerProfile: 'End-user executive families and school-driven upgraders. Iroquois Ridge HS catchment materially drives pricing.',
  },

  // ─── MILTON (all 6) ───

  'milton|dempsey': {
    architecturalEra: 'New-build detached (2005–2020s) on former farmland',
    historyBlurb: 'Dempsey is one of Milton\'s original 2000s-era master-planned subdivisions, developed as Milton transitioned from a small town of 32,000 (2001) to a 130,000+ population commuter city by the 2020s — the fastest per-capita growth in Canada during that period. Housing stock is nearly entirely new-build detached and townhouse.',
    buyerProfile: 'First-time buyers, young families priced out of Oakville and Mississauga, and Milton GO commuters.',
  },
  'milton|beaty': {
    architecturalEra: 'New-build detached and townhouse (2005–2015)',
    historyBlurb: 'Beaty is a south-central Milton subdivision developed through the 2000s as Milton\'s growth accelerated. The neighborhood is anchored by Beaty Community Park and offers a mix of detached, semi-detached, and townhouse product.',
    buyerProfile: 'End-user families and first-time buyers targeting Milton at Halton Region price points below Oakville.',
  },
  'milton|clarke': {
    architecturalEra: 'New-build detached and townhouse (2010s–2020s)',
    historyBlurb: 'Clarke is one of Milton\'s newer greenfield subdivisions, developed primarily through the 2010s. Housing is dominated by newer-build detached and townhouse product with modern open-concept floorplans.',
    buyerProfile: 'First-time and upgrading families drawn to Milton\'s newest inventory and Milton GO access to Toronto.',
  },
  'milton|coates': {
    architecturalEra: 'New-build detached and townhouse (2010s–2020s)',
    historyBlurb: 'Coates is a west-central Milton subdivision developed through the 2010s as Milton\'s residential surface pushed westward toward Tremaine Road. The neighborhood is characterized by modern subdivision layouts with integrated parks and stormwater retention.',
    buyerProfile: 'First-time buyers, young families, and commuter-rail-oriented households targeting the Milton GO catchment.',
  },
  'milton|harrison': {
    architecturalEra: 'New-build detached and townhouse (2010s–2020s)',
    historyBlurb: 'Harrison is a newer Milton subdivision developed through the 2010s and 2020s on former farmland in southwest Milton. Housing is nearly entirely new-build with modern floorplans and integrated open-space allocations.',
    buyerProfile: 'First-time buyers and upgrading families from Mississauga seeking newer-build inventory at Halton Region pricing.',
  },
  'milton|scott': {
    architecturalEra: 'New-build detached and townhouse (2010s–2020s)',
    historyBlurb: 'Scott is a Milton greenfield subdivision developed through the 2010s. Standard modern subdivision layout with integrated schools, parks, and stormwater management infrastructure.',
    buyerProfile: 'First-time buyers, young families, and Milton GO commuters targeting newer-build inventory.',
  },

  // ─── BURLINGTON (all 6) ───

  'burlington|downtown-burlington': {
    walkScore: 88,
    transitScore: 62,
    notableSpots: [
      { name: 'Burlington Waterfront + Spencer Smith Park', kind: 'park' },
      { name: 'Brant Street BIA main strip', kind: 'shop' },
      { name: 'Burlington Performing Arts Centre', kind: 'landmark' },
    ],
    architecturalEra: 'Late-Victorian and Edwardian heritage (~1890–1920) + 2010s+ waterfront condo redevelopment',
    historyBlurb: 'Downtown Burlington centres on Brant Street between Lakeshore Road and Caroline Street — a preserved late-Victorian and Edwardian commercial main street anchored by the Burlington waterfront and Spencer Smith Park. Waterfront condo redevelopment through the 2010s has significantly reshaped the skyline while heritage protections keep the low-rise Brant Street strip intact.',
    buyerProfile: 'Downsizing empty-nesters, weekend-oriented second-home buyers, and end-user professionals valuing lakefront + walkable downtown.',
  },
  'burlington|aldershot': {
    architecturalEra: 'Post-war detached and bungalow (1950s–1970s), with 2010s+ mid-rise infill along Plains Road',
    historyBlurb: 'Aldershot is Burlington\'s westernmost neighborhood, historically a rural community folded into Burlington in 1958. Aldershot GO Station provides direct Lakeshore West line service. Residential redevelopment along Plains Road East + West has accelerated through the 2010s, transitioning the corridor from strip-commercial to mid-rise mixed-use.',
    buyerProfile: 'GO commuters, downsizers, and end-user families targeting Burlington schools at slightly lower price points than central Burlington.',
  },
  'burlington|roseland': {
    architecturalEra: 'Interwar and post-war detached on wide lots (~1930–1970)',
    historyBlurb: 'Roseland is a central Burlington neighborhood south of the QEW, developed primarily through the interwar and postwar decades. The residential streets feature generous lot sizes, mature tree canopy, and lakefront access via Nelson Park. Roseland Golf & Curling Club anchors the north end.',
    buyerProfile: 'End-user families upgrading within Burlington, plus downsizers valuing lot size + lakefront proximity.',
  },
  'burlington|tyandaga': {
    architecturalEra: 'Executive detached and townhouse (1970s–1990s)',
    historyBlurb: 'Tyandaga is a north Burlington executive-tier neighborhood developed primarily through the 1970s and 1980s along the Niagara Escarpment. Housing stock features generous lots, mature tree canopy, and proximity to Tyandaga Golf Course and the escarpment trail system.',
    buyerProfile: 'End-user executive families and downsizers valuing lot size + escarpment access.',
  },
  'burlington|alton-village': {
    architecturalEra: 'New-build detached and townhouse (2000s–2010s)',
    historyBlurb: 'Alton Village is a northwest Burlington greenfield community developed through the 2000s and 2010s. The neighborhood offers modern subdivision layouts with integrated parks, community centres, and easy Highway 407 access for GTA-oriented commuters.',
    buyerProfile: 'First-time buyers, upgrading families, and 407-commute-oriented households targeting newer-build inventory.',
  },
  'burlington|millcroft': {
    notableSpots: [
      { name: 'Millcroft Golf Club', kind: 'landmark' },
    ],
    architecturalEra: 'Executive detached (1980s–2000s) along Millcroft Golf Course corridor',
    historyBlurb: 'Millcroft is a north-central Burlington executive-tier neighborhood developed through the 1980s and 1990s as a golf-course community around Millcroft Golf Club. Housing stock features generous-lot detached homes with strong end-user demand from families targeting Burlington\'s top-rated public schools.',
    buyerProfile: 'End-user executive families and corporate relocators drawn to golf-course-community character + top-tier public schools.',
  },

  // ─── CALEDON (all 6) ───

  'caledon|bolton': {
    architecturalEra: 'Historic village Main Street (~1820–1900) + post-war and modern detached',
    historyBlurb: 'Bolton is Caledon\'s largest urban centre, founded in 1821 by James Bolton along the Humber River. The Historic Main Street is preserved as a Heritage Conservation District, and modern Bolton offers a mix of heritage cottages, mid-century detached, and newer subdivision inventory. Bolton Fall Fair (established 1856) is the neighborhood\'s signature event.',
    buyerProfile: 'End-user families drawn to small-town character within commuting distance of Vaughan and Toronto, plus multi-generational Italian-Canadian households — Bolton has one of the highest per-capita Italian populations in Canada.',
  },
  'caledon|caledon-east': {
    architecturalEra: 'Heritage Main Street (~1830–1900) + newer executive detached',
    historyBlurb: 'Caledon East is a historic village at the intersection of Airport Road and Old Church Road, serving as one of Caledon\'s primary service centres. Housing stock combines preserved 19th-century Main Street commercial buildings with executive detached homes on generous lots developed through the 1990s and 2000s.',
    buyerProfile: 'End-user executive families valuing small-town character + generous lot sizes within an hour of Toronto.',
  },
  'caledon|inglewood': {
    architecturalEra: 'Heritage village + estate detached on acre-plus lots',
    historyBlurb: 'Inglewood is a small historic village founded in the 1820s along the Credit River in southwest Caledon. The Credit Valley Rail Trail runs through the village. Residentially, Inglewood is dominated by estate-detached homes on acre-plus lots, with limited new-build inventory due to Greenbelt protections.',
    buyerProfile: 'Established wealth, downsizers from GTA seeking rural character, and second-home buyers.',
  },
  'caledon|mono-mills': {
    architecturalEra: 'Rural historic settlement + newer estate detached on acreage',
    historyBlurb: 'Mono Mills is a small rural community at the intersection of Highway 9 and Airport Road, at the eastern edge of Caledon on the Dufferin County boundary. Housing stock is dominated by newer estate-detached homes on multi-acre lots protected under the Greenbelt legislation.',
    buyerProfile: 'Estate buyers, hobby-farm households, and long-tenured rural residents.',
  },
  'caledon|palgrave': {
    architecturalEra: 'Heritage village + modern estate detached on acreage',
    historyBlurb: 'Palgrave is a small historic village in northeast Caledon along the Humber River tributary system, home to the annual Palgrave Rodeo. Residential character is estate-oriented, with newer detached homes on 1-to-10-acre lots protected under the Greenbelt legislation, and equestrian-oriented properties throughout the surrounding countryside.',
    buyerProfile: 'Equestrian households, estate buyers, and downsizers from GTA valuing rural character within reach of Toronto.',
  },
  'caledon|cheltenham': {
    architecturalEra: 'Heritage village (~1830–1900) + newer estate detached',
    historyBlurb: 'Cheltenham is a small heritage village along the Credit River in south-central Caledon, dating to the 1820s. The village retains 19th-century mill-village character (including the preserved Cheltenham Badlands, a scenic geological formation nearby), with a small stock of heritage cottages and newer estate detached homes on acreage.',
    buyerProfile: 'Estate and hobby-farm buyers valuing heritage character + Credit River access within commuting distance of Brampton and Mississauga.',
  },

  // ─── HALTON HILLS (all 6) ───

  'halton-hills|georgetown': {
    walkScore: 68,
    notableSpots: [
      { name: 'Historic Main Street Georgetown', kind: 'landmark' },
      { name: 'Cedarvale Park', kind: 'park' },
      { name: 'Georgetown Marketplace', kind: 'shop' },
    ],
    architecturalEra: 'Heritage Main Street (~1820–1900) + post-war and modern detached',
    historyBlurb: 'Georgetown is the largest urban centre in Halton Hills, founded in the 1820s and named after early settler George Kennedy. Historic Main Street Georgetown retains its 19th-century commercial architecture, and the neighborhood is anchored by Georgetown GO Station on the Kitchener line. Housing stock combines preserved heritage homes with mid-century and modern subdivision inventory.',
    buyerProfile: 'End-user families drawn to small-town character + Kitchener-line GO access, plus multi-generational households upgrading within Halton Region.',
  },
  'halton-hills|acton': {
    architecturalEra: 'Heritage village Main Street (~1830–1900) + post-war detached',
    historyBlurb: 'Acton is Halton Hills\' second-largest urban centre, historically a leather-tanning industrial town founded in the 1820s. The town is anchored by Acton GO Station on the Kitchener line and the Halton County Radial Railway heritage museum. Housing stock is a mix of heritage cottages, mid-century detached, and modest new-build inventory.',
    buyerProfile: 'First-time buyers, downsizing empty-nesters, and Kitchener-line GO commuters targeting affordability vs. Georgetown.',
  },
  'halton-hills|glen-williams': {
    architecturalEra: 'Historic mill village (~1820–1900) + rural detached',
    historyBlurb: 'Glen Williams is a preserved 19th-century mill village along the Credit River, absorbed into Halton Hills in 1974. The village retains its historic Beaumont Mill and heritage streetscape, and is home to the Williams Mill Visual Arts Centre. Housing stock is a mix of heritage cottages and rural detached homes on generous lots.',
    buyerProfile: 'End-user households valuing heritage character + Credit River access, plus artists and creative-industry residents.',
  },
  'halton-hills|norval': {
    architecturalEra: 'Historic rural village + rural detached on acreage',
    historyBlurb: 'Norval is a small historic village on the Credit River, best known as the childhood home of Lucy Maud Montgomery (author of Anne of Green Gables), who lived at the Norval manse from 1926 to 1935. Housing stock is limited — a small stock of heritage homes and rural properties on acreage protected under the Greenbelt legislation.',
    buyerProfile: 'Rural end-user households, heritage buyers, and hobby-farm residents.',
  },
  'halton-hills|limehouse': {
    architecturalEra: 'Historic rural hamlet + rural detached on acreage',
    historyBlurb: 'Limehouse is a small historic hamlet in northern Halton Hills, best known for the Limehouse Conservation Area — a preserved 19th-century lime-kiln industrial site along the Bruce Trail on the Niagara Escarpment. Residential character is rural, with modest heritage inventory and newer detached homes on acreage.',
    buyerProfile: 'Rural households, Bruce Trail enthusiasts, and hobby-farm residents.',
  },
  'halton-hills|stewarttown': {
    architecturalEra: 'Historic rural settlement + rural detached',
    historyBlurb: 'Stewarttown is a small historic rural community south of Georgetown, founded in the mid-1800s. Residential character is rural, with heritage homes and modest detached inventory on generous lots.',
    buyerProfile: 'Rural end-user households and downsizers valuing quiet, Georgetown-adjacent character.',
  },

  // ─── HAMILTON (remaining) ───

  'hamilton|locke-street': {
    walkScore: 89,
    notableSpots: [
      { name: 'Locke Street BIA commercial strip', kind: 'shop' },
      { name: 'Victoria Park', kind: 'park' },
    ],
    architecturalEra: 'Late-Victorian and Edwardian residential (~1880–1920)',
    historyBlurb: 'Locke Street is a preserved late-Victorian and Edwardian residential neighborhood in Hamilton\'s Kirkendall district, anchored by the Locke Street South BIA commercial strip — one of Hamilton\'s premier walkable retail corridors and a key node in the city\'s post-2010 downtown revival. Housing stock is nearly intact Victorian and Edwardian brick.',
    buyerProfile: 'Toronto-adjacent end-user professionals migrating to Hamilton for value + character, plus long-tenured Hamilton owner-occupiers.',
  },
  'hamilton|stoney-creek': {
    architecturalEra: 'Historic village core + post-war and modern subdivision',
    historyBlurb: 'Stoney Creek was an independent town until amalgamated into Hamilton in 2001. Best known as the site of the Battle of Stoney Creek (1813) during the War of 1812 — the battle site is preserved at Battlefield House Museum. Modern Stoney Creek offers a mix of heritage cottages, post-war detached, and newer subdivision inventory expanding up the Niagara Escarpment.',
    buyerProfile: 'End-user families, Toronto-adjacent commuters, and multi-generational households targeting Hamilton\'s eastern growth corridor.',
  },
  'hamilton|dundas': {
    walkScore: 82,
    notableSpots: [
      { name: 'Historic King Street Dundas', kind: 'landmark' },
      { name: 'Dundas Peak (Spencer Gorge)', kind: 'park' },
      { name: 'Webster\'s Falls', kind: 'park' },
    ],
    architecturalEra: 'Preserved 19th-century mill town (~1800–1900) + interwar detached',
    historyBlurb: 'Dundas ("The Valley Town") was an independent town from 1847 until amalgamated into Hamilton in 2001. Founded in the 1780s at the base of the Niagara Escarpment, it retains one of Ontario\'s most intact 19th-century commercial main streets (King Street Dundas). The Dundas Peak lookout above the town is one of the GTA\'s most-photographed viewpoints. Housing stock is a mix of preserved heritage and interwar detached.',
    buyerProfile: 'Heritage buyers, end-user families valuing small-town character, and Toronto-adjacent creative-industry professionals.',
  },
  'hamilton|durand': {
    architecturalEra: 'Grand Victorian and Edwardian mansions (~1870–1920) — Hamilton\'s original wealthy enclave',
    historyBlurb: 'Durand is Hamilton\'s original wealthy residential neighborhood, developed south of downtown between Aberdeen Avenue and the Niagara Escarpment through the late 19th century. Housing stock is a nearly intact catalog of grand Victorian, Queen Anne, and Georgian Revival mansions built by Hamilton\'s industrial elite. Durand has been the primary target of Hamilton\'s post-2010 heritage-oriented gentrification wave.',
    buyerProfile: 'Heritage-oriented end-users, Toronto downsizers migrating to Hamilton for character and value, plus long-tenured owner-occupiers.',
  },

  // ─── MARKHAM (remaining) ───

  'markham|cornell': {
    architecturalEra: 'New Urbanist master-planned community (2000s–2020s)',
    historyBlurb: 'Cornell is one of Canada\'s largest New Urbanist master-planned communities, developed by the Markham municipal government from the mid-1990s onward on former farmland east of Highway 48. The plan features grid streets, front porches, rear lanes, and integrated Markham Stouffville Hospital. Cornell has been widely studied as a Canadian precedent for suburban New Urbanism.',
    buyerProfile: 'End-user families drawn to walkable-suburban character, multi-generational households, and hospital-employment-adjacent professionals.',
  },
  'markham|wismer': {
    architecturalEra: 'New-build detached and townhouse (2000s–2010s)',
    historyBlurb: 'Wismer is a north-central Markham subdivision developed through the 2000s and 2010s, named after the historic Wismer family who farmed the area in the 19th century. Housing stock is dominated by modern detached and townhouse product with strong end-user demand from families targeting Markham\'s highly-rated public schools.',
    buyerProfile: 'End-user families, multi-generational households, and Markham-schools-driven upgraders.',
  },
  'markham|berczy-village': {
    architecturalEra: 'New-build detached and townhouse (2000s–2010s)',
    historyBlurb: 'Berczy Village is a north Markham subdivision developed through the 2000s and 2010s, named after early Markham settler William Berczy who led a group of German settlers to the area in 1794. The neighborhood is characterized by modern subdivision layouts with integrated parks, community centres, and school catchments.',
    buyerProfile: 'End-user families with school-age children, multi-generational households, and executive families upgrading within York Region.',
  },
  'markham|milliken': {
    architecturalEra: 'Post-war detached and townhouse (1970s–1990s), with 2000s+ infill',
    historyBlurb: 'Milliken straddles the Toronto–Markham boundary along Steeles Avenue and grew as a postwar subdivision through the 1970s and 1980s. The neighborhood has been a primary destination for Chinese-Canadian immigration to Toronto since the 1990s, and hosts Milliken Wesleyan United Church (one of the oldest in the region) alongside modern retail and residential redevelopment.',
    buyerProfile: 'Multi-generational households, first-time buyers, and end-user families targeting transit access to Line 1 and TTC bus network.',
  },
  'markham|thornhill': {
    architecturalEra: 'Heritage village (~1830–1900) + post-war and modern detached',
    historyBlurb: 'The Markham side of Thornhill (east of Yonge Street) preserves the historic Thornhill Village heritage streetscape alongside post-war and modern executive detached homes. Thornhill\'s York Region catchment overlaps with Markham\'s top-rated public schools, and the neighborhood draws consistent end-user rather than investor demand.',
    buyerProfile: 'End-user families, executive relocators, and multi-generational households valuing heritage + school character.',
  },

  // ─── RICHMOND HILL (all 6) ───

  'richmond-hill|oak-ridges': {
    architecturalEra: 'Historic hamlet + newer executive detached (1990s–2010s) around Oak Ridges Moraine',
    historyBlurb: 'Oak Ridges is a historic settlement founded in the 1830s along Yonge Street at the southern edge of the Oak Ridges Moraine — the protected geological formation providing headwaters for the Humber, Rouge, and Don river systems. The neighborhood combines heritage character with executive detached development from the 1990s and 2000s, and features Lake Wilcox as a signature natural amenity.',
    buyerProfile: 'End-user executive families, downsizers valuing lake + moraine access, and multi-generational households upgrading within York Region.',
  },
  'richmond-hill|jefferson': {
    architecturalEra: 'Executive detached (1990s–2010s) on generous lots',
    historyBlurb: 'Jefferson is a north-central Richmond Hill subdivision developed through the 1990s and 2000s, characterized by executive detached homes on wide lots with mature landscaping. The neighborhood sits adjacent to the Oak Ridges Moraine and offers proximity to Lake Wilcox and the Wilcox trail system.',
    buyerProfile: 'End-user executive families and multi-generational households, with a large share of purchases involving co-borrowers or foreign income documentation.',
  },
  'richmond-hill|bayview-hill': {
    architecturalEra: 'Executive detached on wide lots (1980s–2000s)',
    historyBlurb: 'Bayview Hill is a central-east Richmond Hill neighborhood developed through the 1980s and 1990s along Bayview Avenue. Housing stock features large-lot executive detached homes and consistently sits at the top of Richmond Hill single-family pricing, and draws demand from executive families upgrading within York Region.',
    buyerProfile: 'Executive multi-generational households, corporate relocators, and top-tier public-school-driven upgraders (Bayview Secondary catchment).',
  },
  'richmond-hill|mill-pond': {
    architecturalEra: 'Heritage village pond (~1820–1900) + surrounding heritage and modern detached',
    historyBlurb: 'Mill Pond centres on the preserved 19th-century Mill Pond Park — a preserved millpond and dam system in central Richmond Hill dating to the 1820s. The surrounding residential streets feature a mix of preserved heritage cottages, mid-century detached, and newer executive infill. Mill Pond Park hosts the annual Mill Pond Splash festival.',
    buyerProfile: 'End-user families valuing heritage + park character, plus Richmond Hill professionals upgrading from newer surrounding subdivisions.',
  },
  'richmond-hill|doncrest': {
    architecturalEra: 'Executive detached (1990s–2010s)',
    historyBlurb: 'Doncrest is an east-central Richmond Hill neighborhood developed primarily through the 1990s and 2000s along Bayview Avenue and Highway 7. The neighborhood is characterized by executive detached homes on generous lots with strong end-user demand from families upgrading within York Region.',
    buyerProfile: 'Executive multi-generational households and school-driven upgraders within York Region.',
  },
  'richmond-hill|elgin-west': {
    architecturalEra: 'New-build detached and townhouse (2010s–2020s)',
    historyBlurb: 'Elgin West (or Elgin Mills West) is a northern Richmond Hill subdivision developed through the 2010s along Elgin Mills Road. Housing stock is nearly entirely new-build detached and townhouse with modern floorplans and integrated open-space allocations.',
    buyerProfile: 'First-time and upgrading families targeting Richmond Hill\'s newest inventory at York Region price points.',
  },

  // ─── NEWMARKET (all 6) ───

  'newmarket|stonehaven': {
    architecturalEra: 'Executive detached (1990s–2000s)',
    historyBlurb: 'Stonehaven is a west Newmarket executive subdivision developed primarily through the 1990s and 2000s. Housing stock features generous-lot detached homes with mature landscaping.',
    buyerProfile: 'End-user executive families and York Region upgraders drawn to Newmarket schools + lot size vs. neighboring Aurora.',
  },
  'newmarket|glenway': {
    notableSpots: [
      { name: 'Glenway Golf Club (former)', kind: 'landmark' },
    ],
    architecturalEra: 'Golf-course community detached (1980s–2000s) — with 2010s+ redevelopment on former course lands',
    historyBlurb: 'Glenway is a central Newmarket golf-course community developed through the 1980s and 1990s around the Glenway Golf Club. The golf course was decommissioned in the 2010s and redevelopment to residential has been ongoing and controversial. Housing stock combines older executive detached with newer subdivision inventory.',
    buyerProfile: 'End-user families and downsizers, plus longer-hold investors positioning for course-lands redevelopment upside.',
  },
  'newmarket|bristol-london': {
    architecturalEra: 'Post-war detached and semi-detached (1960s–1980s)',
    historyBlurb: 'Bristol-London is a central Newmarket residential area developed through the postwar decades, dominated by mid-century detached and semi-detached homes on modest lots. The neighborhood sits within walking distance of downtown Newmarket.',
    buyerProfile: 'First-time buyers, downsizers, and end-user families valuing walkability to downtown Newmarket + Newmarket GO.',
  },
  'newmarket|summerhill-estates': {
    architecturalEra: 'Executive detached (1990s–2000s)',
    historyBlurb: 'Summerhill Estates is a north-central Newmarket executive subdivision developed through the 1990s and 2000s. Housing stock features large-lot detached homes with mature landscaping.',
    buyerProfile: 'End-user executive families and Newmarket-GO commuters targeting Newmarket at York Region price points.',
  },
  'newmarket|woodland-hill': {
    architecturalEra: 'Executive detached (1990s–2010s)',
    historyBlurb: 'Woodland Hill is a northeast Newmarket executive subdivision developed through the 1990s and 2000s. The neighborhood is characterized by generous-lot detached homes with mature tree canopy.',
    buyerProfile: 'End-user executive families and upgrading Newmarket households.',
  },
  'newmarket|gorham-college-manor': {
    architecturalEra: 'Post-war and interwar detached (~1940s–1970s)',
    historyBlurb: 'Gorham-College Manor is a central Newmarket residential area near Pickering College (a historic private boarding school established 1842 in Newmarket). Housing stock combines interwar and postwar detached homes on modest lots within walking distance of Historic Main Street Newmarket.',
    buyerProfile: 'End-user families valuing Newmarket downtown walkability + Pickering College adjacency.',
  },

  // ─── AURORA (all 6) ───

  'aurora|aurora-village': {
    architecturalEra: 'Heritage Main Street (~1830–1900) + post-war and modern residential',
    historyBlurb: 'Aurora Village centres on Historic Yonge Street between Wellington Street and Kennedy Street — a preserved 19th-century commercial main street. Aurora was incorporated as a village in 1863 and grew significantly with the arrival of the Toronto, Simcoe and Muskoka Junction Railway in 1853. Housing stock combines preserved heritage cottages, mid-century detached, and newer infill.',
    buyerProfile: 'End-user families drawn to heritage character + Aurora GO access, plus downsizers valuing walkability.',
  },
  'aurora|hills-of-st-andrew': {
    architecturalEra: 'Executive detached (1990s–2010s)',
    historyBlurb: 'Hills of St. Andrew is a north Aurora executive subdivision developed through the 1990s and 2000s. Housing stock features large-lot detached homes with mature landscaping and proximity to St. Andrew\'s College — one of Canada\'s premier private boys\' schools (founded 1899).',
    buyerProfile: 'End-user executive families, St. Andrew\'s College parents, and York Region upgraders.',
  },
  'aurora|aurora-heights': {
    architecturalEra: 'Post-war detached and bungalow (1950s–1970s)',
    historyBlurb: 'Aurora Heights is a central Aurora residential area developed primarily through the postwar decades, characterized by mid-century detached homes on generous lots with mature tree canopy. The neighborhood sits within walking distance of downtown Aurora and Aurora GO.',
    buyerProfile: 'End-user families, downsizers, and first-time buyers targeting Aurora at slightly lower price points than northern executive subdivisions.',
  },
  'aurora|bayview-wellington': {
    architecturalEra: 'Executive detached and townhouse (1990s–2010s)',
    historyBlurb: 'Bayview Wellington is a southeast Aurora subdivision developed through the 1990s and 2000s along Bayview Avenue. Housing stock features executive detached homes and townhouse product with integrated community centres and parks.',
    buyerProfile: 'End-user executive families and York Region upgraders drawn to Aurora schools + Bayview corridor access.',
  },
  'aurora|aurora-estates': {
    architecturalEra: 'Estate detached (1990s–2010s)',
    historyBlurb: 'Aurora Estates is a Bloomington-Road-corridor executive subdivision developed through the 1990s and 2000s. Housing stock features large-lot estate detached homes routinely among the highest single-family prices in Aurora.',
    buyerProfile: 'Executive multi-generational households and long-hold end-users valuing lot size + privacy.',
  },
  'aurora|aurora-grove': {
    architecturalEra: 'New-build detached and townhouse (2000s–2010s)',
    historyBlurb: 'Aurora Grove is a newer Aurora subdivision developed through the 2000s and 2010s. Housing stock is dominated by modern detached and townhouse product with integrated parks and stormwater management.',
    buyerProfile: 'First-time buyers, young families, and upgrading households targeting Aurora\'s newer inventory.',
  },

  // ─── BRADFORD (all 6) ───

  'bradford|bradford-west': {
    architecturalEra: 'New-build detached (2000s–2020s) on former Simcoe County farmland',
    historyBlurb: 'Bradford West is a west Bradford greenfield community developed since the early 2000s. Bradford is one of the fastest-growing municipalities in Ontario, with GO Transit service to Toronto and access to Highway 400 driving population growth. Housing stock is dominated by new-build detached and townhouse.',
    buyerProfile: 'First-time buyers, young families priced out of York Region, and Bradford GO commuters.',
  },
  'bradford|bond-head': {
    architecturalEra: 'Historic rural village (~1820–1900) + newer rural detached',
    historyBlurb: 'Bond Head is a small historic village in west Bradford, dating to the 1820s. Housing stock combines heritage cottages with newer rural detached homes on generous lots.',
    buyerProfile: 'Rural end-user households, downsizers from GTA, and commuters targeting rural character within an hour of Toronto.',
  },
  'bradford|newton-robinson': {
    architecturalEra: 'Rural historic settlement + rural detached on acreage',
    historyBlurb: 'Newton Robinson is a small rural community in southwest Bradford, historically an agricultural settlement. Housing character is rural, with limited inventory and generous lot sizes.',
    buyerProfile: 'Rural households, hobby-farm buyers, and estate residents.',
  },
  'bradford|holland-marsh': {
    architecturalEra: 'Agricultural land + rural residential',
    historyBlurb: 'The Holland Marsh is a productive agricultural district south of Bradford — reclaimed wetland drained in the 1930s and now producing a substantial share of Ontario\'s carrots, onions, and celery. Residential inventory is limited and rural in character, primarily supporting the agricultural workforce.',
    buyerProfile: 'Agricultural households, farm operators, and rural end-users.',
  },
  'bradford|bradford-east': {
    architecturalEra: 'New-build detached and townhouse (2005–2020s)',
    historyBlurb: 'Bradford East is an east Bradford greenfield community developed through the 2000s and 2010s as Bradford\'s population expanded rapidly. Housing stock is nearly entirely new-build with modern subdivision layouts.',
    buyerProfile: 'First-time buyers, young families, and GO commuters.',
  },
  'bradford|bradford-south': {
    architecturalEra: 'New-build detached and townhouse (2010s–2020s)',
    historyBlurb: 'Bradford South is one of Bradford\'s newest greenfield subdivisions, developed through the 2010s and 2020s. Standard modern subdivision layout with integrated parks and school allocations.',
    buyerProfile: 'First-time buyers, upgrading families from York Region, and GO commuters.',
  },

  // ─── KING CITY (all 6) ───

  'king-city|nobleton': {
    architecturalEra: 'Historic village + estate detached on acreage',
    historyBlurb: 'Nobleton is a historic village in northwest King Township, founded in the 1830s. The village retains 19th-century Main Street character, and residential character is estate-oriented — housing stock features large-lot detached homes protected under Greenbelt legislation.',
    buyerProfile: 'Estate buyers, hobby-farm households, and downsizers from GTA valuing rural character.',
  },
  'king-city|schomberg': {
    architecturalEra: 'Historic village Main Street (~1830–1900) + rural detached',
    historyBlurb: 'Schomberg is a historic village in northwest King Township, founded in the 1830s. Historic Main Street Schomberg is preserved as a Heritage Conservation District. Residential character combines heritage cottages with newer estate detached homes on generous lots.',
    buyerProfile: 'Heritage-oriented end-users, estate buyers, and rural households.',
  },
  'king-city|pottageville': {
    architecturalEra: 'Rural historic hamlet + estate detached on acreage',
    historyBlurb: 'Pottageville is a small rural hamlet in central King Township. Residential character is rural with estate detached homes on multi-acre lots protected under Greenbelt legislation.',
    buyerProfile: 'Estate buyers, equestrian households, and downsizers.',
  },
  'king-city|kettleby': {
    architecturalEra: 'Historic village + rural detached on acreage',
    historyBlurb: 'Kettleby is a small historic village in southeast King Township along the Humber River tributary system, founded in the 1830s. The village retains 19th-century character and is surrounded by estate detached inventory on acreage.',
    buyerProfile: 'Rural end-users, estate buyers, and heritage-oriented households.',
  },
  'king-city|snowball': {
    architecturalEra: 'Rural hamlet + rural detached',
    historyBlurb: 'Snowball is a small rural community in western King Township. Housing character is rural, with modest heritage inventory and newer detached homes on acreage.',
    buyerProfile: 'Rural households, hobby-farm buyers, and estate residents.',
  },
  'king-city|eversley': {
    architecturalEra: 'Rural hamlet + rural detached on acreage',
    historyBlurb: 'Eversley is a small rural community in central King Township. Residential character is rural with estate detached homes on generous lots.',
    buyerProfile: 'Rural households, estate buyers, and downsizers.',
  },

  // ─── INNISFIL (all 6) ───

  'innisfil|alcona': {
    architecturalEra: 'Post-war cottage + newer detached (1960s–2020s)',
    historyBlurb: 'Alcona is the primary urban centre of Innisfil, on the south shore of Lake Simcoe. Originally a summer cottage community, it transitioned to year-round residential through the 2000s and 2010s as GTA buyers migrated northward. Substantial new-build subdivision activity continues.',
    buyerProfile: 'End-user families relocating from GTA for lake access + affordability, second-home buyers, and pre-retirement households.',
  },
  'innisfil|lefroy': {
    architecturalEra: 'Historic hamlet + post-war and modern residential',
    historyBlurb: 'Lefroy is a historic community on the west shore of Lake Simcoe, founded in the 1850s. Housing stock combines heritage cottages, mid-century cottages-converted-to-residential, and modest new-build inventory.',
    buyerProfile: 'End-user households valuing Lake Simcoe access at accessible price points, plus retirees.',
  },
  'innisfil|stroud': {
    architecturalEra: 'Historic village + post-war and modern rural residential',
    historyBlurb: 'Stroud is a historic community in central Innisfil along the Highway 400 corridor, founded in the 1850s. Housing character combines heritage properties with modern rural detached inventory.',
    buyerProfile: 'Rural end-users, commuters targeting 400-corridor access, and downsizers.',
  },
  'innisfil|cookstown': {
    architecturalEra: 'Historic Main Street village (~1830–1900) + rural detached',
    historyBlurb: 'Cookstown is a historic village at the intersection of Highway 27 and Highway 89, founded in the 1830s. Historic Main Street Cookstown is a preserved 19th-century commercial streetscape. The Cookstown Antique Market (formerly Tanger Outlets) has been a regional retail destination.',
    buyerProfile: 'End-users valuing heritage character, plus commuter-oriented rural households.',
  },
  'innisfil|sandy-cove': {
    architecturalEra: 'Lakefront cottage + newer detached (1950s–2020s)',
    historyBlurb: 'Sandy Cove is a lakefront community on the south shore of Lake Simcoe, historically a cottage settlement now transitioning to year-round residential with substantial new-build activity through the 2010s and 2020s.',
    buyerProfile: 'Second-home buyers, lakefront-oriented end-users, and retirees.',
  },
  'innisfil|big-bay-point': {
    architecturalEra: 'Lakefront cottage + luxury waterfront estate (1960s–2020s)',
    historyBlurb: 'Big Bay Point is a lakefront community on Lake Simcoe\'s south shore, historically a summer cottage settlement and now home to the Friday Harbour master-planned lakefront resort community (opened 2018). Housing stock combines heritage cottages, mid-century cottage conversions, and modern lakefront estate + resort condominiums.',
    buyerProfile: 'Second-home buyers, weekend-boater households, and Friday Harbour condo investors targeting rental yield from short-term rentals.',
  },

  // ─── PICKERING (all 6) ───

  'pickering|bay-ridges': {
    architecturalEra: 'Post-war detached, bungalow + waterfront condo (1950s–2020s)',
    historyBlurb: 'Bay Ridges is Pickering\'s southernmost lakefront neighborhood, developed as one of the earliest planned lakefront residential communities in Ontario in the 1950s. Anchored by Pickering GO Station (Lakeshore East line, one-stop access to Union Station), Frenchman\'s Bay, and the Nautical Village. Substantial waterfront condo redevelopment through the 2010s.',
    buyerProfile: 'End-user families, GO commuters, and lakefront-oriented downsizers.',
  },
  'pickering|liverpool': {
    architecturalEra: 'Post-war detached and townhouse (1970s–1990s), with 2010s+ infill',
    historyBlurb: 'Liverpool is Pickering\'s central urban district, anchored by Pickering Town Centre (opened 1973) and the neighborhood surrounding Highway 401 and Liverpool Road. Housing stock combines postwar detached with newer mid-rise and townhouse infill along Liverpool Road.',
    buyerProfile: 'End-user families, first-time buyers, and multi-generational households targeting Pickering GO + Pickering Town Centre convenience.',
  },
  'pickering|amberlea': {
    architecturalEra: 'Executive detached (1980s–1990s)',
    historyBlurb: 'Amberlea is a west Pickering subdivision developed through the 1980s and 1990s, characterized by executive detached homes on generous lots with mature landscaping. The neighborhood offers proximity to Rouge National Urban Park and highway access via Whites Road.',
    buyerProfile: 'End-user executive families upgrading within Durham Region and GO commuters.',
  },
  'pickering|rougemount': {
    architecturalEra: 'Executive detached (1970s–1990s)',
    historyBlurb: 'Rougemount is a west Pickering neighborhood adjacent to Rouge National Urban Park and the Toronto boundary. Housing stock features executive detached homes on generous lots with ravine and parkland adjacency.',
    buyerProfile: 'End-user executive families valuing park + Rouge adjacency, plus Toronto-boundary GO commuters.',
  },
  'pickering|rosebank': {
    architecturalEra: 'Post-war and interwar detached (~1940s–1970s), with newer infill',
    historyBlurb: 'Rosebank is a southwest Pickering lakefront neighborhood along the Frenchman\'s Bay waterfront. Housing stock combines interwar cottage-conversion and post-war detached with newer infill. Waterfront and Frenchman\'s Bay Marsh access anchor the character.',
    buyerProfile: 'End-user families, downsizers, and waterfront-oriented professionals.',
  },
  'pickering|brock-ridge': {
    architecturalEra: 'New-build detached and townhouse (1990s–2010s)',
    historyBlurb: 'Brock Ridge is a north Pickering subdivision developed primarily through the 1990s and 2000s. Housing stock is dominated by modern detached and townhouse product with integrated schools and community centres.',
    buyerProfile: 'First-time and upgrading families, and Pickering GO commuters targeting newer inventory.',
  },

  // ─── AJAX (all 6) ───

  'ajax|central-ajax': {
    architecturalEra: 'Post-war detached (1950s–1970s) + newer townhouse infill',
    historyBlurb: 'Central Ajax was one of Ontario\'s earliest planned postwar communities, developed on the site of the World War II Defence Industries Limited munitions plant that operated 1941–1945. The town was named after the HMS Ajax, a Royal Navy cruiser that participated in the Battle of the River Plate. Housing stock is dominated by mid-century detached homes on generous lots.',
    buyerProfile: 'End-user families upgrading within Durham Region, first-time buyers, and Ajax GO commuters.',
  },
  'ajax|south-ajax': {
    architecturalEra: 'Post-war detached and lakefront (1950s–1970s), plus 2010s+ waterfront infill',
    historyBlurb: 'South Ajax is the lakefront section of Ajax, offering direct access to the Waterfront Trail and Lake Ontario. Housing stock combines mid-century detached with newer waterfront condominium and townhouse redevelopment.',
    buyerProfile: 'End-user families, downsizers, and Ajax GO commuters valuing waterfront access.',
  },
  'ajax|pickering-beach': {
    architecturalEra: 'Post-war and interwar lakefront cottage-conversion + newer infill',
    historyBlurb: 'Pickering Beach (confusingly located in Ajax, not Pickering) is a historic lakefront community originally developed as a summer cottage settlement in the interwar decades and gradually converted to year-round residential. Housing stock features cottage-scale detached homes on modest lots along the Lake Ontario waterfront.',
    buyerProfile: 'End-user households valuing waterfront access, plus long-tenured residents.',
  },
  'ajax|audley': {
    walkScore: 11,
    transitScore: 19,
    bikeScore: 55,
    transitStations: [
      { name: "Taunton EB @ Audley" },
      { name: "Taunton EB @ Warner" },
      { name: "Taunton WB @ Warner" },
      { name: "Taunton WB @ Audley" },
      { name: "Taunton EB @ Lake Ridge" }
    ],
    notableSpots: [
      { name: "Pan Am Games Ajax Ballpark", kind: "park" }
    ],
    architecturalEra: 'New-build detached and townhouse (2000s–2010s)',
    historyBlurb: 'Audley is a north Ajax greenfield subdivision developed through the 2000s and 2010s on former Durham Region farmland. Housing stock is dominated by modern detached and townhouse product.',
    buyerProfile: 'First-time and upgrading families targeting Ajax\'s newer inventory + Highway 407 access.',
  },
  'ajax|riverside': {
    walkScore: 43,
    transitScore: 33,
    bikeScore: 33,
    transitStations: [
      { name: "Rossland EB @ Harkins" },
      { name: "Kingston WB @ Elizabeth" },
      { name: "Kingston EB @ Elizabeth" },
      { name: "Brock Road NB @ Major Oaks" },
      { name: "Brock Road SB @ Major Oaks" }
    ],
    notableSpots: [
      { name: "Hermitage Park", kind: "park" },
      { name: "Ajax Memorial Park", kind: "park" },
      { name: "Dimpflmeier's Cafe", kind: "cafe" },
      { name: "Oriental Kitchen", kind: "restaurant" },
      { name: "Sauter's Inn Restaurant", kind: "restaurant" },
      { name: "Drums N Flats", kind: "restaurant" }
    ],
    architecturalEra: 'Post-war and modern detached along Duffins Creek',
    historyBlurb: 'Riverside is an Ajax neighborhood along the Duffins Creek corridor. Housing stock combines post-war detached with newer infill, and features ravine and trail access via the Duffins Trail system.',
    buyerProfile: 'End-user families and ravine-adjacent-lot buyers.',
  },
  'ajax|lakeside': {
    architecturalEra: 'Post-war lakefront cottage-conversion + modern detached',
    historyBlurb: 'Lakeside is a south Ajax lakefront community along the Waterfront Trail. Housing stock combines cottage-scale postwar homes with newer waterfront infill.',
    buyerProfile: 'End-user households, downsizers, and waterfront-oriented professionals.',
  },

  // ─── WHITBY (all 6) ───

  'whitby|downtown-whitby': {
    architecturalEra: 'Heritage Main Street (~1820–1900) + surrounding heritage residential',
    historyBlurb: 'Downtown Whitby centres on Brock Street between Dundas Street and Mary Street — a preserved 19th-century commercial main street. Whitby was founded in 1836 as the Port Whitby harbour community and grew as an agricultural service town. Downtown Whitby is anchored by Whitby GO Station on the Lakeshore East line.',
    buyerProfile: 'End-user families, heritage-oriented buyers, and GO commuters targeting Whitby\'s walkable downtown.',
  },
  'whitby|brooklin': {
    transitStations: [
      { name: "Baldwin SB @ Roybrook" },
      { name: "Winchester Rd. / Thickson Rd." },
      { name: "Campbell EB @ Baldwin" },
      { name: "Vipond WB @ Montgomery" },
      { name: "Vipond EB @ Montgomery" }
    ],
    notableSpots: [
      { name: "Brooklin Optimist", kind: "park" },
      { name: "Carson Park", kind: "park" },
      { name: "Brooklin Memorial Park", kind: "park" },
      { name: "Vipond Park", kind: "park" },
      { name: "Selkirk Park", kind: "park" },
      { name: "Michael Kelley's", kind: "restaurant" }
    ],
    architecturalEra: 'Historic village (~1830–1900) + newer executive detached (2000s–2020s)',
    historyBlurb: 'Brooklin is a historic village in north Whitby, founded in the 1830s. Historic Main Street Brooklin retains its 19th-century commercial character. Modern Brooklin features substantial new-build subdivision inventory expanding northward through the 2010s and 2020s.',
    buyerProfile: 'End-user families upgrading within Durham Region, first-time buyers, and multi-generational households.',
  },
  'whitby|williamsburg': {
    walkScore: 26,
    transitScore: 38,
    bikeScore: 28,
    architecturalEra: 'New-build detached and townhouse (1990s–2010s)',
    historyBlurb: 'Williamsburg is a north-central Whitby subdivision developed through the 1990s and 2000s. Housing stock is dominated by executive detached homes on generous lots.',
    buyerProfile: 'End-user executive families and Durham Region upgraders.',
  },
  'whitby|pringle-creek': {
    walkScore: 33,
    transitScore: 45,
    bikeScore: 59,
    transitStations: [
      { name: "Dundas EB @ Craydon" },
      { name: "Dundas EB @ Lupin" },
      { name: "Dundas WB @ Craydon" }
    ],
    notableSpots: [
      { name: "Wyndfield Park", kind: "park" }
    ],
    architecturalEra: 'Post-war and modern detached (1970s–1990s)',
    historyBlurb: 'Pringle Creek is a central Whitby neighborhood along the Pringle Creek ravine system. Housing stock features detached homes on modest-to-generous lots with ravine trail access.',
    buyerProfile: 'End-user families valuing ravine adjacency + Whitby GO access.',
  },
  'whitby|lynde-creek': {
    walkScore: 62,
    transitScore: 42,
    bikeScore: 48,
    notableSpots: [
      { name: "D'Hillier Park", kind: "park" }
    ],
    architecturalEra: 'Post-war detached (1960s–1980s) along Lynde Creek',
    historyBlurb: 'Lynde Creek is a west Whitby neighborhood along the Lynde Creek ravine and Lynde Shores Conservation Area. Housing stock features postwar detached homes with mature tree canopy and creek-adjacent lots.',
    buyerProfile: 'End-user families, downsizers, and ravine-adjacent-lot buyers.',
  },
  'whitby|port-whitby': {
    architecturalEra: 'Historic port + modern waterfront condo redevelopment',
    historyBlurb: 'Port Whitby is Whitby\'s original lakefront harbour community, founded in 1836 as the reason Whitby was settled. The harbour continues to operate as a recreational marina, and substantial waterfront condominium redevelopment has occurred through the 2010s and 2020s.',
    buyerProfile: 'Downsizers, weekend-boater second-home buyers, and end-user waterfront professionals.',
  },

  // ─── OSHAWA (all 6) ───

  'oshawa|mclaughlin': {
    walkScore: 63,
    transitScore: 45,
    bikeScore: 47,
    transitStations: [
      { name: "Simcoe NB @ Hillcroft", lines: [
        "401 Simcoe N",
        "401B Simcoe N",
        "682"
      ] },
      { name: "Simcoe SB @ Buckingham", lines: [
        "401 Simcoe N",
        "401B Simcoe S",
        "652"
      ] },
      { name: "Bond WB @ Park", lines: [
        "402 King",
        "405 Central Park",
        "90 Newcastle GO Bus",
        "1169"
      ] },
      { name: "King EB @ Warren", lines: [
        "402 King",
        "405 Central Park",
        "411 Grandview",
        "94 Oshawa Hwy. 2 GO Bus",
        "1181"
      ] },
      { name: "King EB @ Gibbons", lines: [
        "405 Central Park",
        "1178"
      ] }
    ],
    notableSpots: [
      { name: "Homestead Park", kind: "park" },
      { name: "Rimosa Park", kind: "park" },
      { name: "Alexandra Park", kind: "park" },
      { name: "Radio Park", kind: "park" },
      { name: "Fernhill Park", kind: "park" },
      { name: "Brick by Brick Park", kind: "park" }
    ],
    architecturalEra: 'Interwar and post-war detached (~1920–1960)',
    historyBlurb: 'McLaughlin is a north Oshawa neighborhood named after Colonel R.S. McLaughlin, founder of the McLaughlin Motor Car Company (which merged with General Motors of Canada in 1918). The neighborhood was developed through the interwar and postwar decades and is anchored by Parkwood Estate — R.S. McLaughlin\'s National Historic Site mansion (now a museum).',
    buyerProfile: 'End-user families, heritage-oriented buyers, and downsizers valuing lot size + Oshawa GO access.',
  },
  'oshawa|o-neill': {
    architecturalEra: 'Interwar and post-war detached (~1930–1960)',
    historyBlurb: 'O\'Neill is a north-central Oshawa neighborhood developed primarily through the interwar and early postwar decades. Housing stock features detached homes on generous lots with mature tree canopy — one of Oshawa\'s better-preserved older residential districts.',
    buyerProfile: 'End-user families and downsizers valuing character + lot size.',
  },
  'oshawa|eastdale': {
    architecturalEra: 'Post-war detached and bungalow (1950s–1970s)',
    historyBlurb: 'Eastdale is an east Oshawa neighborhood developed through the postwar decades. Housing stock is dominated by mid-century detached and bungalow product on modest lots.',
    buyerProfile: 'First-time buyers, end-user families, and investors targeting entry-level detached inventory in Durham Region.',
  },
  'oshawa|lakeview': {
    architecturalEra: 'Post-war lakefront detached + modern waterfront redevelopment',
    historyBlurb: 'Lakeview is a south Oshawa lakefront neighborhood along the Waterfront Trail and Lake Ontario. Housing stock combines postwar detached with newer waterfront infill. The neighborhood is anchored by Lakeview Park and the Robert McLaughlin Gallery.',
    buyerProfile: 'End-user families and downsizers valuing waterfront access at accessible price points.',
  },
  'oshawa|pinecrest': {
    architecturalEra: 'Post-war detached (1960s–1980s)',
    historyBlurb: 'Pinecrest is a north-central Oshawa neighborhood developed through the postwar decades. Housing stock features detached homes on modest-to-generous lots with mature tree canopy.',
    buyerProfile: 'End-user families and first-time buyers.',
  },
  'oshawa|vanier': {
    architecturalEra: 'Post-war detached and semi-detached (1950s–1970s)',
    historyBlurb: 'Vanier is a south-central Oshawa neighborhood developed through the postwar decades. Housing stock features mid-century detached and semi-detached product on modest lots, with strong first-time-buyer activity.',
    buyerProfile: 'First-time buyers, investors targeting Oshawa student rentals near Ontario Tech University, and end-user households.',
  },

  // ─── CLARINGTON (all 6) ───

  'clarington|bowmanville': {
    walkScore: 68,
    architecturalEra: 'Heritage Main Street (~1830–1900) + post-war and modern detached',
    historyBlurb: 'Bowmanville is the largest urban centre in the Municipality of Clarington, founded in the 1820s and anchored by Historic Downtown Bowmanville — a preserved 19th-century commercial main street. Modern Bowmanville has been one of eastern Durham Region\'s primary greenfield growth areas through the 2010s and 2020s, with the future GO Extension to Bowmanville reshaping commuter access.',
    buyerProfile: 'End-user families, first-time buyers, and future-GO-extension-oriented commuters.',
  },
  'clarington|courtice': {
    architecturalEra: 'Post-war and new-build detached (1960s–2020s)',
    historyBlurb: 'Courtice is a rapidly-growing residential area at the western edge of Clarington, along the Oshawa boundary. Housing stock combines mid-century detached with substantial new-build subdivision inventory developed through the 2000s and 2010s.',
    buyerProfile: 'First-time and upgrading families, Durham Region commuters, and multi-generational households.',
  },
  'clarington|newcastle': {
    architecturalEra: 'Historic village (~1830–1900) + newer detached',
    historyBlurb: 'Newcastle is a historic village in east Clarington along Highway 2 (Kingston Road), founded in the 1820s. The village retains 19th-century Main Street character alongside newer subdivision inventory developed through the 2000s and 2010s.',
    buyerProfile: 'End-user families valuing small-town character within an hour of Toronto.',
  },
  'clarington|orono': {
    architecturalEra: 'Historic village + rural detached',
    historyBlurb: 'Orono is a small historic village in north Clarington, founded in the 1830s. The village retains its 19th-century Main Street streetscape, and residential character is rural with heritage cottages and newer rural detached inventory.',
    buyerProfile: 'Rural end-users, heritage-oriented buyers, and downsizers.',
  },
  'clarington|newtonville': {
    architecturalEra: 'Rural hamlet + rural detached',
    historyBlurb: 'Newtonville is a small rural community in east Clarington along Highway 2. Housing character is rural with modest heritage inventory and newer rural detached homes on generous lots.',
    buyerProfile: 'Rural households, first-time rural buyers, and downsizers.',
  },
  'clarington|hampton': {
    architecturalEra: 'Rural hamlet + rural detached',
    historyBlurb: 'Hampton is a small rural community in central Clarington, founded in the 1830s. Housing character is rural with heritage cottages and newer detached inventory on acreage.',
    buyerProfile: 'Rural households, hobby-farm buyers, and estate residents.',
  },

  // ─── SCARBOROUGH (all 6) ───

  'scarborough|guildwood': {
    walkScore: 62,
    notableSpots: [
      { name: 'Guild Park and Gardens', kind: 'park' },
      { name: 'Scarborough Bluffs (adjacent)', kind: 'landmark' },
    ],
    architecturalEra: 'Post-war detached (1950s–1970s) with heritage estate at Guild Inn',
    historyBlurb: 'Guildwood is a lakefront Scarborough neighborhood anchored by Guild Park and Gardens — a former artists\' colony (Guild of All Arts, founded 1932) at the edge of the Scarborough Bluffs. The park houses a preserved collection of architectural fragments rescued from demolished Toronto buildings, and Guildwood GO Station (Lakeshore East line) anchors commuter access.',
    buyerProfile: 'End-user families valuing Bluffs + park access, plus long-tenured owner-occupiers.',
  },
  'scarborough|agincourt': {
    architecturalEra: 'Post-war detached, semi-detached, and modern townhouse infill (1950s–2020s)',
    historyBlurb: 'Agincourt was one of Scarborough\'s original postwar planned communities, developed through the 1950s and 1960s. Since the 1980s it has been one of the primary destinations for Hong Kong and mainland Chinese immigration to the GTA, and Dragon Centre + Agincourt Mall anchor a substantial Chinese-Canadian retail cluster.',
    buyerProfile: 'Multi-generational households, first-time buyers, and end-user families.',
  },
  'scarborough|wexford': {
    architecturalEra: 'Post-war detached and bungalow (1950s–1970s)',
    historyBlurb: 'Wexford is a central Scarborough neighborhood developed through the postwar decades. Housing stock features detached and bungalow product on modest-to-generous lots with mature tree canopy. Wexford Heights and Wexford Plaza anchor the retail strip.',
    buyerProfile: 'End-user families, first-time buyers, and multi-generational households.',
  },
  'scarborough|rouge': {
    architecturalEra: 'Post-war and modern detached along Rouge National Urban Park',
    historyBlurb: 'Rouge is Scarborough\'s easternmost neighborhood, adjacent to Rouge National Urban Park — Canada\'s first (and largest) National Urban Park, established 2015 at 79.1 sq km. Housing stock combines postwar detached with newer subdivision inventory bordering the park boundary.',
    buyerProfile: 'End-user families valuing Rouge National Urban Park + trail adjacency.',
  },
  'scarborough|cliffside': {
    architecturalEra: 'Post-war detached and bungalow (1950s–1970s) atop the Scarborough Bluffs',
    historyBlurb: 'Cliffside sits atop the Scarborough Bluffs, offering some of the most dramatic lake views in the GTA. Housing stock features postwar detached and bungalow product on modest-to-generous lots, with strong end-user demand from buyers valuing Bluffs adjacency.',
    buyerProfile: 'End-user families valuing Bluffs + Lake Ontario views, plus long-tenured owner-occupiers.',
  },
  'scarborough|birch-cliff': {
    architecturalEra: 'Interwar and post-war detached and bungalow (~1920–1970)',
    historyBlurb: 'Birch Cliff is a southwest Scarborough neighborhood along the Kingston Road corridor and Scarborough Bluffs. Housing stock features interwar and postwar detached homes on modest lots with mature tree canopy. The neighborhood has seen substantial post-2010 gentrification driven by proximity to the TTC Line 2 subway extension corridor.',
    buyerProfile: 'End-user families migrating east from Toronto\'s core for value, plus long-tenured owner-occupiers.',
  },

  // ─── ETOBICOKE (all 6) ───

  'etobicoke|mimico': {
    walkScore: 82,
    transitScore: 84,
    architecturalEra: 'Interwar and post-war detached along Lake Shore + 2005–2020s waterfront condominium',
    historyBlurb: 'Mimico is a west Etobicoke lakefront neighborhood, historically an independent town from 1911 until amalgamated into Etobicoke in 1967. Anchored by Mimico GO Station (Lakeshore West line) and dramatic post-2005 waterfront condominium redevelopment along Lake Shore Boulevard West. The residential streets north of Lake Shore preserve interwar and postwar detached character.',
    buyerProfile: 'First-time buyers, young professionals, downsizers, and lakefront-oriented end-users.',
  },
  'etobicoke|humber-bay': {
    walkScore: 85,
    architecturalEra: 'Modern waterfront condominium (2000s–2020s) — nearly all new-build',
    historyBlurb: 'Humber Bay Shores is a purpose-built waterfront condominium community developed from the late 1990s onward on the site of former industrial + motel-strip land. Along the Waterfront Trail with direct downtown Toronto skyline views across the Humber Bay. Now one of Toronto\'s largest concentrations of high-rise waterfront condominium inventory outside downtown.',
    buyerProfile: 'Young professionals, investors targeting waterfront condo rental yield, downsizing empty-nesters, and international second-home buyers.',
  },
  'etobicoke|islington-village': {
    architecturalEra: 'Post-war detached (1950s–1970s) around Islington-Rathburn Village and post-2005 mid-rise infill',
    historyBlurb: 'Islington Village grew as a postwar Etobicoke residential district around the intersection of Islington Avenue and Bloor Street West. Anchored by Islington subway station on Line 2 and the Islington Village BIA. The neighborhood retains its mid-century detached character with substantial mid-rise redevelopment along Bloor and Dundas.',
    buyerProfile: 'End-user families upgrading within Etobicoke, downsizers, and TTC subway-oriented professionals.',
  },
  'etobicoke|the-kingsway': {
    walkScore: 78,
    architecturalEra: 'Grand English Cottage, Tudor Revival, and Georgian Revival (~1912–1930s) — one of the most intact interwar planned suburbs in Canada',
    historyBlurb: 'The Kingsway was master-planned by developer Robert Home Smith between 1912 and 1930 as a "Garden Suburb" — modeled on English Garden City planning. The neighborhood retains its nearly-intact interwar English Cottage, Tudor Revival, and Georgian Revival housing stock, with restrictive architectural covenants keeping the character preserved. Consistently among Etobicoke\'s highest single-family prices.',
    buyerProfile: 'Established wealth, corporate executives, and long-tenured owner-occupiers valuing heritage character + top-tier public schools (Lambton-Kingsway JMS).',
  },
  'etobicoke|richview': {
    architecturalEra: 'Post-war detached and bungalow (1950s–1970s)',
    historyBlurb: 'Richview is a central Etobicoke neighborhood developed through the postwar decades along Eglinton Avenue West. Housing stock features detached homes on generous lots with mature tree canopy. The Eglinton Crosstown LRT (Line 5, opening imminent) is reshaping transit access along the Eglinton corridor.',
    buyerProfile: 'End-user families, downsizers, and LRT-corridor-oriented buyers.',
  },
  'etobicoke|new-toronto': {
    architecturalEra: 'Interwar and post-war worker\'s cottage + 2010s+ mid-rise infill',
    historyBlurb: 'New Toronto was an independent town from 1913 until amalgamated into Etobicoke in 1967. Originally an industrial worker\'s community along the Lake Shore Boulevard West corridor, the neighborhood has seen substantial post-2010 gentrification as Toronto\'s core prices pushed young professionals west. Retains historic worker\'s cottage character.',
    buyerProfile: 'Young professionals migrating from Toronto\'s core, first-time buyers, and end-user families valuing walkable-neighborhood character.',
  },

  // ─── GRIMSBY (all 6) ───

  'grimsby|grimsby-beach': {
    architecturalEra: 'Preserved 19th-century Painted Ladies (~1859–1900) + interwar and modern lakefront',
    historyBlurb: 'Grimsby Beach is one of Canada\'s best-preserved 19th-century religious camp-meeting communities — founded 1859 as a Methodist camp-meeting ground along the Lake Ontario shore. Its distinctive collection of small brightly-painted "gingerbread" cottages (Painted Ladies) has been preserved as a Heritage Conservation District. The surrounding streets combine heritage cottages with modern lakefront residential.',
    buyerProfile: 'Heritage-oriented end-users, second-home buyers, and downsizers valuing preserved character + lakefront access.',
  },
  'grimsby|casablanca': {
    architecturalEra: 'Modern waterfront condominium and townhouse (2000s–2020s)',
    historyBlurb: 'Casablanca is a modern waterfront community centered on the Grimsby waterfront and the Casablanca Boulevard corridor. Substantial condominium and townhouse redevelopment through the 2000s–2020s. Anchored by Casablanca Winery and easy QEW access.',
    buyerProfile: 'Downsizing empty-nesters, second-home buyers, and Toronto-adjacent professionals valuing Niagara wine-country + waterfront access.',
  },
  'grimsby|park-road': {
    architecturalEra: 'Post-war and modern detached',
    historyBlurb: 'Park Road is a central Grimsby residential neighborhood along the Park Road corridor between downtown Grimsby and Lake Ontario. Housing stock features post-war detached and modern subdivision inventory.',
    buyerProfile: 'End-user families and Toronto-migration downsizers.',
  },
  'grimsby|west-grimsby': {
    architecturalEra: 'Post-war and modern detached + escarpment estate',
    historyBlurb: 'West Grimsby extends up the Niagara Escarpment above downtown Grimsby. Housing stock combines post-war detached with newer escarpment-perched executive detached homes with lake and vineyard views.',
    buyerProfile: 'End-user executive families and Toronto downsizers valuing escarpment + wine-country character.',
  },
  'grimsby|mountain-estates': {
    architecturalEra: 'Executive detached on the Niagara Escarpment (1990s–2010s)',
    historyBlurb: 'Mountain Estates is an escarpment-perched executive subdivision in Grimsby developed through the 1990s and 2000s. Housing stock features generous-lot detached homes with dramatic Lake Ontario and Niagara wine-country views from the escarpment plateau.',
    buyerProfile: 'End-user executive families, wine-country second-home buyers, and Toronto-adjacent downsizers.',
  },
  'grimsby|vineland-estates': {
    architecturalEra: 'Modern estate detached (1990s–2020s) among Niagara wine country',
    historyBlurb: 'Vineland Estates references the Vineland wine-country zone at the west edge of Grimsby, adjacent to Vineland Estates Winery (one of Ontario\'s oldest and best-known estate wineries). Housing stock features estate-tier detached inventory on generous lots with vineyard adjacency.',
    buyerProfile: 'Wine-country lifestyle buyers, second-home households, and estate end-users.',
  },

  // ─── NIAGARA FALLS (all 6) ───

  'niagara-falls|stamford': {
    architecturalEra: 'Post-war detached and bungalow (1950s–1970s) + newer subdivision',
    historyBlurb: 'Stamford is a north Niagara Falls residential neighborhood, historically Stamford Township before amalgamation. Housing stock is dominated by mid-century detached and bungalow product with strong end-user demand from families targeting Niagara Falls schools.',
    buyerProfile: 'End-user families, first-time buyers, and Toronto-adjacent downsizers.',
  },
  'niagara-falls|chippawa': {
    architecturalEra: 'Historic village + post-war and modern detached',
    historyBlurb: 'Chippawa is a historic village at the confluence of the Welland River and Niagara River, absorbed into Niagara Falls in 1970. Site of the Battle of Chippawa (1814) during the War of 1812. Housing stock combines heritage cottages with mid-century and modern detached inventory.',
    buyerProfile: 'End-user families, heritage buyers, and river-access-oriented households.',
  },
  'niagara-falls|drummond-park': {
    architecturalEra: 'Post-war detached (1950s–1970s)',
    historyBlurb: 'Drummond Park is a central Niagara Falls residential neighborhood developed through the postwar decades along the Drummond Road corridor. Housing stock is dominated by mid-century detached product on modest-to-generous lots.',
    buyerProfile: 'End-user families, first-time buyers, and multi-generational households.',
  },
  'niagara-falls|mount-carmel': {
    architecturalEra: 'Post-war detached and modern subdivision',
    historyBlurb: 'Mount Carmel is a west Niagara Falls residential neighborhood. Housing stock combines post-war detached with newer subdivision inventory expanding westward through the 2000s and 2010s.',
    buyerProfile: 'End-user families and first-time buyers.',
  },
  'niagara-falls|dorchester': {
    architecturalEra: 'Post-war detached (1950s–1970s)',
    historyBlurb: 'Dorchester is a central Niagara Falls residential neighborhood along Dorchester Road. Housing stock features postwar detached homes on modest-to-generous lots.',
    buyerProfile: 'End-user families and first-time buyers.',
  },
  'niagara-falls|westlane': {
    architecturalEra: 'Post-war and modern detached',
    historyBlurb: 'Westlane is a west Niagara Falls residential neighborhood. Housing stock features post-war detached and newer subdivision inventory.',
    buyerProfile: 'End-user families and first-time buyers.',
  },

  // ─── WELLAND (all 6) ───

  'welland|cooks-mills': {
    architecturalEra: 'Historic mill village + rural detached',
    historyBlurb: 'Cook\'s Mills is a historic mill village in south Welland dating to the mid-1800s. Site of the Battle of Cook\'s Mills (1814) during the War of 1812. Housing character is rural with heritage cottages and modern detached inventory on generous lots.',
    buyerProfile: 'Rural end-users, heritage buyers, and Welland Canal-adjacent households.',
  },
  'welland|dain-city': {
    architecturalEra: 'Post-war detached and industrial-adjacent',
    historyBlurb: 'Dain City is a residential neighborhood in southeast Welland along the Welland Canal corridor, historically developed to support the canal-industrial workforce. Housing stock features post-war detached homes on modest-to-generous lots.',
    buyerProfile: 'First-time buyers, end-user households, and rural-adjacent buyers.',
  },
  'welland|crowland': {
    architecturalEra: 'Post-war detached and rural',
    historyBlurb: 'Crowland is a rural community south of Welland, historically Crowland Township before amalgamation with Welland in 1961. Housing character is rural with heritage properties and newer detached inventory on generous lots.',
    buyerProfile: 'Rural households, first-time buyers, and estate residents.',
  },
  'welland|chippawa-park': {
    architecturalEra: 'Post-war detached (1950s–1970s)',
    historyBlurb: 'Chippawa Park is a central Welland residential neighborhood along the Welland Recreational Canal corridor. Housing stock features postwar detached homes with canal + park access.',
    buyerProfile: 'End-user families and first-time buyers valuing canal-park character.',
  },
  'welland|welland-south': {
    architecturalEra: 'Post-war detached and rural residential',
    historyBlurb: 'Welland South is a southern Welland residential district along the Welland River and Welland Canal system. Housing stock combines post-war detached with newer subdivision inventory.',
    buyerProfile: 'End-user families, first-time buyers, and canal-adjacent households.',
  },
  'welland|east-welland': {
    architecturalEra: 'Post-war detached and modern subdivision',
    historyBlurb: 'East Welland is an east Welland residential neighborhood. Housing stock features post-war detached with newer subdivision expansion through the 2000s.',
    buyerProfile: 'End-user families and first-time buyers.',
  },

  // ─── FORT ERIE (all 6) ───

  'fort-erie|crystal-beach': {
    walkScore: 68,
    architecturalEra: 'Historic beach resort cottage (1890s–1950s) + modern lakefront residential',
    historyBlurb: 'Crystal Beach was one of Ontario\'s premier lakeshore resort destinations from the 1890s through the 1960s — the Crystal Beach Amusement Park (closed 1989) was famous for the Comet wooden roller coaster and drew half-million-plus annual visitors from Ontario and Western New York. Today Crystal Beach retains historic cottage character alongside modern lakefront residential redevelopment.',
    buyerProfile: 'Second-home buyers, lakefront end-users, and downsizers valuing preserved resort-town character.',
  },
  'fort-erie|ridgeway': {
    architecturalEra: 'Historic town Main Street (~1830–1900) + post-war residential',
    historyBlurb: 'Ridgeway is a historic town in central Fort Erie, founded in the 1820s. Site of the Battle of Ridgeway (1866) — the Fenian Raid engagement that hastened Confederation. Housing stock combines preserved heritage with post-war and modern detached inventory.',
    buyerProfile: 'End-user families, heritage buyers, and cross-border commuters to Buffalo NY.',
  },
  'fort-erie|stevensville': {
    architecturalEra: 'Rural village + rural detached',
    historyBlurb: 'Stevensville is a rural village in central Fort Erie along Highway 3, founded in the mid-1800s. Housing character is rural with heritage cottages and modern detached inventory.',
    buyerProfile: 'Rural end-users, first-time buyers, and Toronto-adjacent downsizers.',
  },
  'fort-erie|bridgeburg': {
    architecturalEra: 'Historic Main Street + Niagara River waterfront residential',
    historyBlurb: 'Bridgeburg is a historic district in central Fort Erie near the Peace Bridge to Buffalo NY. Housing stock combines heritage Main Street with river-adjacent residential.',
    buyerProfile: 'End-user households, cross-border-commuting families, and Peace-Bridge-adjacent professionals.',
  },
  'fort-erie|black-creek': {
    architecturalEra: 'Rural residential and lakefront',
    historyBlurb: 'Black Creek is a lakefront neighborhood along Lake Erie in east Fort Erie. Housing stock combines heritage lakefront cottages with newer detached inventory.',
    buyerProfile: 'Second-home buyers, retirees, and lakefront end-users.',
  },
  'fort-erie|garrison-village': {
    architecturalEra: 'Post-war residential and modern subdivision',
    historyBlurb: 'Garrison Village is a residential neighborhood in central Fort Erie, referencing the historic Fort Erie garrison (site of the 1814 Siege of Fort Erie during the War of 1812). Housing stock is dominated by mid-century and modern detached product.',
    buyerProfile: 'End-user families and first-time buyers.',
  },

  // ─── OTTAWA (all 6) ───

  'ottawa|westboro': {
    walkScore: 91,
    transitScore: 82,
    bikeScore: 94,
    transitStations: [
      { name: 'Westboro Station', lines: ['O-Train Line 1 · Confederation Line'] },
      { name: 'Tunney\'s Pasture Station', lines: ['O-Train Line 1 · Confederation Line'] },
    ],
    notableSpots: [
      { name: 'Westboro Beach', kind: 'park' },
      { name: 'Richmond Road BIA main strip', kind: 'shop' },
      { name: 'MEC Ottawa flagship', kind: 'shop' },
      { name: 'Bridgehead Coffee (Westboro)', kind: 'cafe' },
    ],
    architecturalEra: 'Post-war detached and bungalow (1950s–1970s) + 2000s+ mid-rise and townhouse infill',
    historyBlurb: 'Westboro grew as a postwar Ottawa residential district and has been the primary target of Ottawa\'s post-2005 gentrification wave — Richmond Road between Kirkwood and Golden Avenue is now one of Canada\'s premier neighborhood retail strips. Westboro Beach along the Ottawa River is the neighborhood\'s signature natural amenity, and the Confederation Line LRT (opened 2019) anchors transit access.',
    buyerProfile: 'End-user professional families, downsizing empty-nesters, and Confederation-Line-oriented commuters. Very low investor share.',
  },
  'ottawa|the-glebe': {
    walkScore: 93,
    transitScore: 84,
    bikeScore: 96,
    transitStations: [
      { name: 'Lansdowne', lines: ['OC Transpo bus network'] },
      { name: 'Bank Street corridor', lines: ['OC Transpo Route 6 + others'] },
    ],
    notableSpots: [
      { name: 'Lansdowne Park + TD Place Stadium', kind: 'landmark' },
      { name: 'Rideau Canal (adjacent)', kind: 'park' },
      { name: 'Bank Street BIA main strip', kind: 'shop' },
      { name: 'Second Cup Bank Street', kind: 'cafe' },
    ],
    architecturalEra: 'Late-Victorian and Edwardian brick semi-detached and detached (~1880–1920)',
    historyBlurb: 'The Glebe is Ottawa\'s premier walkable urban neighborhood, developed as an Anglican Church land grant ("glebe" = church land) south of downtown between the 1880s and 1920. Housing stock is nearly intact Victorian and Edwardian brick, and Lansdowne Park anchors the south end with TD Place Stadium (home of the Ottawa Redblacks CFL and Ottawa 67\'s OHL teams). Bank Street between Fifth Avenue and the Queensway is one of Canada\'s premier neighborhood commercial corridors.',
    buyerProfile: 'Established professionals, government senior officials, and long-tenured owner-occupiers valuing heritage character + walkability.',
  },
  'ottawa|rockcliffe-park': {
    walkScore: 62,
    transitScore: 51,
    bikeScore: 82,
    notableSpots: [
      { name: '24 Sussex Drive (former PM residence)', kind: 'landmark' },
      { name: 'Rideau Hall (Governor General\'s residence)', kind: 'landmark' },
      { name: 'Rockcliffe Park Lookout', kind: 'park' },
    ],
    architecturalEra: 'Grand Georgian, Tudor Revival, and Modernist estate homes (~1900–1960)',
    historyBlurb: 'Rockcliffe Park is Ottawa\'s original wealthy residential enclave, developed as a private village in the late 19th century and remaining a distinct village until amalgamated into Ottawa in 2001. Home to Rideau Hall (the Governor General of Canada\'s official residence), 24 Sussex Drive (traditional Prime Minister\'s residence), and a substantial share of Ottawa\'s ambassadorial residences. Housing stock features grand estate homes on generous lots protected by strict architectural covenants.',
    buyerProfile: 'Diplomatic families, senior federal officials, established Canadian corporate leadership, and long-tenured heritage owners.',
  },
  'ottawa|centretown': {
    walkScore: 96,
    transitScore: 92,
    bikeScore: 91,
    transitStations: [
      { name: 'Parliament Station', lines: ['O-Train Line 1 · Confederation Line'] },
      { name: 'Rideau Station', lines: ['O-Train Line 1 · Confederation Line'] },
      { name: 'Lyon Station', lines: ['O-Train Line 1 · Confederation Line'] },
    ],
    notableSpots: [
      { name: 'Parliament Hill', kind: 'landmark' },
      { name: 'Rideau Canal', kind: 'landmark' },
      { name: 'Byward Market', kind: 'shop' },
      { name: 'Elgin Street BIA main strip', kind: 'shop' },
    ],
    architecturalEra: 'Late-Victorian rowhouse + Edwardian apartment (~1880–1930) + modern high-rise condominium',
    historyBlurb: 'Centretown is Ottawa\'s downtown residential district — the streets immediately south of Parliament Hill between Bronson Avenue and the Rideau Canal. Housing stock combines preserved late-Victorian rowhouse, Edwardian apartment stock, and modern high-rise condominium. The Confederation Line LRT anchors transit access, and Byward Market (immediately east) is one of Canada\'s oldest continuously-operating farmers\' markets (established 1826).',
    buyerProfile: 'Federal public servants, young professionals, downtown-oriented empty-nesters, and diplomatic staff.',
  },
  'ottawa|old-ottawa-south': {
    walkScore: 84,
    transitScore: 75,
    bikeScore: 92,
    notableSpots: [
      { name: 'Bank Street BIA (Old Ottawa South)', kind: 'shop' },
      { name: 'Windsor Park', kind: 'park' },
      { name: 'Brewer Park', kind: 'park' },
    ],
    architecturalEra: 'Late-Victorian and Edwardian brick semi-detached (~1890–1920)',
    historyBlurb: 'Old Ottawa South sits south of the Rideau Canal between Bank Street and Brewer Park, developed as a streetcar suburb between the 1890s and 1920. Housing stock is nearly intact Victorian and Edwardian brick, and Bank Street south of the canal serves as a walkable neighborhood commercial spine. Carleton University sits at the west edge, driving academic + student-family demand.',
    buyerProfile: 'Academic families, government senior professionals, and long-tenured owner-occupiers.',
  },
  'ottawa|hintonburg': {
    walkScore: 91,
    transitScore: 84,
    bikeScore: 94,
    notableSpots: [
      { name: 'Wellington West BIA main strip', kind: 'shop' },
      { name: 'Parkdale Market', kind: 'shop' },
      { name: 'Somerset Street West BIA', kind: 'shop' },
    ],
    architecturalEra: 'Worker\'s cottage and semi-detached (~1890–1930) with post-2010 heritage-oriented gentrification',
    historyBlurb: 'Hintonburg developed as a worker\'s community around the Ottawa lumber and rail-yard economy in the late 19th century, and has been the primary target of Ottawa\'s post-2010 heritage-oriented gentrification wave. The Wellington West BIA between Holland Avenue and Somerset Street West has emerged as one of Canada\'s premier walkable neighborhood commercial strips, alongside a substantial Vietnamese and East African immigrant business cluster.',
    buyerProfile: 'Young professionals migrating from suburban Ottawa for walkability, creative-industry households, and first-time buyers.',
  },

  // ─── KANATA (all 6) ───

  'kanata|kanata-lakes': {
    architecturalEra: 'Executive detached and townhouse (1990s–2010s) around Kanata Golf Course',
    historyBlurb: 'Kanata Lakes is a north Kanata master-planned community developed through the 1990s and 2000s around the Kanata Golf and Country Club. Housing stock features executive detached homes on generous lots + integrated townhouse product. Kanata\'s Silicon Valley North tech corridor drives professional household demand.',
    buyerProfile: 'End-user tech professional families (Kanata hosts Nokia, Ericsson, Ciena, Ross Video and dozens of smaller tech HQs), and corporate relocators.',
  },
  'kanata|beaverbrook': {
    architecturalEra: 'Post-war detached (1960s–1980s) — Kanata\'s original master-planned neighborhood',
    historyBlurb: 'Beaverbrook was Kanata\'s original master-planned residential community, developed by Bill Teron beginning in 1963 as one of Canada\'s earliest greenfield planned suburbs. The Teron plan emphasized integrated parks, curvilinear streets, and community centres — a model widely studied by Canadian planners. Housing stock is dominated by mid-century detached homes on generous lots.',
    buyerProfile: 'End-user families, downsizers, and heritage-of-planning-oriented buyers.',
  },
  'kanata|bridlewood': {
    architecturalEra: 'Executive detached and townhouse (1980s–2000s)',
    historyBlurb: 'Bridlewood is a west Kanata residential community developed through the 1980s and 1990s. Housing stock features executive detached with integrated townhouse product and easy Highway 417 access.',
    buyerProfile: 'End-user tech-professional families and Highway 417 commuters.',
  },
  'kanata|glen-cairn': {
    architecturalEra: 'Post-war detached (1970s–1990s)',
    historyBlurb: 'Glen Cairn is a central Kanata residential neighborhood developed through the 1970s and 1980s. Housing stock features detached homes on modest-to-generous lots with mature tree canopy.',
    buyerProfile: 'End-user families, first-time buyers, and Kanata tech-corridor commuters.',
  },
  'kanata|katimavik-hazeldean': {
    architecturalEra: 'Post-war and modern detached (1970s–2000s)',
    historyBlurb: 'Katimavik-Hazeldean is a southwest Kanata residential neighborhood combining two adjacent planned subdivisions. "Katimavik" is an Inuktitut word meaning "meeting place." Housing stock spans postwar and modern detached with townhouse infill.',
    buyerProfile: 'End-user families, first-time buyers, and multi-generational households.',
  },
  'kanata|morgan-s-grant': {
    architecturalEra: 'New-build executive detached and townhouse (2000s–2010s)',
    historyBlurb: 'Morgan\'s Grant is a north Kanata greenfield subdivision developed through the 2000s and 2010s. Housing stock is nearly entirely new-build executive detached with integrated townhouse product.',
    buyerProfile: 'End-user tech-professional families and Kanata-corridor upgraders.',
  },

  // ─── NEPEAN (all 6) ───

  'nepean|barrhaven': {
    architecturalEra: 'New-build detached and townhouse (1990s–2020s) — Ottawa\'s largest suburban growth area',
    historyBlurb: 'Barrhaven is Ottawa\'s largest suburban growth area, developed on former farmland since the 1990s. Population grew from ~15,000 in 1990 to over 100,000 by the 2020s. Housing stock is dominated by new-build detached and townhouse product with the Trillium Line LRT extension (Line 2, opened 2025) providing direct transit access to central Ottawa.',
    buyerProfile: 'First-time buyers, young families, and multi-generational households targeting Ottawa\'s newest greenfield inventory.',
  },
  'nepean|bells-corners': {
    architecturalEra: 'Post-war detached and bungalow (1950s–1970s) + newer commercial + residential infill',
    historyBlurb: 'Bells Corners was one of Nepean Township\'s original crossroads settlements at the intersection of Robertson Road and Moodie Drive. Postwar residential development transformed it into a mid-century Ottawa suburban district. Home to Nortel\'s former Carling Campus (now the Department of National Defence headquarters) and substantial federal-employment concentration.',
    buyerProfile: 'End-user federal-employee families and first-time buyers.',
  },
  'nepean|crystal-beach': {
    architecturalEra: 'Interwar and post-war lakefront cottage-conversion + newer detached',
    historyBlurb: 'Crystal Beach (Ottawa, not Fort Erie) is a lakefront neighborhood along the Ottawa River in west Nepean. Historically developed as a summer cottage community in the interwar and postwar decades, it has since transitioned to year-round residential.',
    buyerProfile: 'End-user households, downsizers, and river-oriented families.',
  },
  'nepean|bayshore': {
    architecturalEra: 'Post-war detached + high-rise apartment + 2010s+ mid-rise infill',
    historyBlurb: 'Bayshore is a west Nepean neighborhood along the Ottawa River anchored by Bayshore Shopping Centre (opened 1973). Housing stock combines postwar detached, high-rise apartment, and newer mid-rise redevelopment.',
    buyerProfile: 'End-user families, downsizers, and Bayshore-Shopping-Centre-adjacent professionals.',
  },
  'nepean|centrepointe': {
    architecturalEra: 'Post-war detached and townhouse (1970s–1990s)',
    historyBlurb: 'Centrepointe is a central Nepean residential neighborhood developed through the 1970s and 1980s around Centrepointe Theatre (Ottawa\'s premier community performing-arts venue) and Ben Franklin Place (former Nepean city hall).',
    buyerProfile: 'End-user families, downsizers, and central-Nepean-oriented professionals.',
  },
  'nepean|manordale': {
    architecturalEra: 'Post-war detached and bungalow (1960s–1980s)',
    historyBlurb: 'Manordale is a south Nepean residential neighborhood developed through the postwar decades. Housing stock features detached and bungalow product on modest-to-generous lots with mature tree canopy.',
    buyerProfile: 'End-user families, first-time buyers, and downsizers.',
  },

  // ─── ORLEANS (all 6) ───

  'orleans|avalon': {
    architecturalEra: 'New-build detached and townhouse (2000s–2020s)',
    historyBlurb: 'Avalon is Orleans\' largest new-build residential community, developed through the 2000s and 2010s as Orleans expanded rapidly on former east Ottawa farmland. Housing stock is nearly entirely new-build detached and townhouse with modern floorplans.',
    buyerProfile: 'First-time buyers, young families, and francophone households — Orleans has one of Ontario\'s largest concentrations of French-language residents.',
  },
  'orleans|convent-glen': {
    architecturalEra: 'Post-war detached (1970s–1990s)',
    historyBlurb: 'Convent Glen is one of Orleans\' original planned residential communities, developed through the 1970s and 1980s. Housing stock features postwar detached homes on generous lots with mature tree canopy.',
    buyerProfile: 'End-user families, downsizers, and francophone households.',
  },
  'orleans|fallingbrook': {
    architecturalEra: 'Executive detached (1990s–2010s)',
    historyBlurb: 'Fallingbrook is an east Orleans executive residential community developed through the 1990s and 2000s. Housing stock features executive detached homes on generous lots with strong end-user demand from francophone professional families.',
    buyerProfile: 'End-user executive families, francophone households, and Orleans corridor upgraders.',
  },
  'orleans|chapel-hill': {
    architecturalEra: 'Post-war and modern detached (1980s–2000s)',
    historyBlurb: 'Chapel Hill is a central Orleans residential neighborhood developed through the 1980s and 1990s. Housing stock features detached homes with integrated schools and community centres.',
    buyerProfile: 'End-user families and francophone-Canadian households.',
  },
  'orleans|queenswood-heights': {
    architecturalEra: 'Post-war detached (1970s–1990s)',
    historyBlurb: 'Queenswood Heights is a north Orleans residential neighborhood along the Ottawa River corridor. Housing stock features postwar detached homes on generous lots with mature landscaping.',
    buyerProfile: 'End-user families, downsizers, and river-oriented households.',
  },
  'orleans|cardinal-creek': {
    architecturalEra: 'New-build detached and townhouse (2010s–2020s)',
    historyBlurb: 'Cardinal Creek is Orleans\' newest greenfield residential subdivision, developed through the 2010s and 2020s at the east edge of Ottawa\'s residential surface. Housing stock is dominated by modern detached and townhouse product.',
    buyerProfile: 'First-time buyers, young families, and francophone households targeting Orleans\' newest inventory.',
  },

  // ─── KITCHENER (all 6) ───

  'kitchener|downtown-kitchener': {
    walkScore: 89,
    transitScore: 76,
    transitStations: [
      { name: 'Kitchener Central Station (LRT)', lines: ['ION Line 1'] },
      { name: 'Kitchener GO / VIA Rail Station', lines: ['GO Transit Kitchener line', 'VIA Rail Corridor'] },
    ],
    notableSpots: [
      { name: 'Victoria Park', kind: 'park' },
      { name: 'King Street BIA main strip', kind: 'shop' },
      { name: 'Communitech Hub', kind: 'landmark' },
    ],
    architecturalEra: 'Late-Victorian and Edwardian brick + 2010s+ high-rise condominium redevelopment',
    historyBlurb: 'Downtown Kitchener has been the primary target of Kitchener\'s post-2010 tech-led revitalization — the Communitech Hub in the former Lang Tannery building has anchored the growth of the Kitchener-Waterloo tech ecosystem. The ION LRT (opened 2019) connects downtown Kitchener directly to Uptown Waterloo. Housing stock combines preserved Victorian brick with substantial new-build high-rise condominium activity.',
    buyerProfile: 'Young tech-professional buyers, first-time buyers, and downtown-oriented downsizers.',
  },
  'kitchener|doon': {
    architecturalEra: 'Post-war detached (1970s–1990s) + newer subdivision',
    historyBlurb: 'Doon is a south Kitchener residential neighborhood, historically Doon Township. Home to Conestoga College\'s primary Doon campus, which drives student-rental and academic-family demand. Housing stock combines mid-century detached with newer subdivision inventory.',
    buyerProfile: 'End-user families, first-time buyers, and Conestoga College-adjacent investors.',
  },
  'kitchener|forest-heights': {
    architecturalEra: 'Post-war detached (1970s–1990s)',
    historyBlurb: 'Forest Heights is a west Kitchener residential neighborhood developed through the 1970s and 1980s. Housing stock features detached homes on generous lots with mature tree canopy.',
    buyerProfile: 'End-user families and Kitchener tech-corridor commuters.',
  },
  'kitchener|stanley-park': {
    architecturalEra: 'Post-war detached (1960s–1980s)',
    historyBlurb: 'Stanley Park is a central-east Kitchener residential neighborhood developed through the postwar decades. Housing stock features detached homes on modest-to-generous lots.',
    buyerProfile: 'End-user families and first-time buyers.',
  },
  'kitchener|country-hills': {
    architecturalEra: 'Post-war and modern detached (1980s–2000s)',
    historyBlurb: 'Country Hills is a south Kitchener residential neighborhood developed through the 1980s and 1990s. Housing stock features detached homes on generous lots with mature landscaping.',
    buyerProfile: 'End-user families and Kitchener corridor upgraders.',
  },
  'kitchener|huron-south': {
    architecturalEra: 'New-build detached and townhouse (2000s–2020s)',
    historyBlurb: 'Huron South is a southwest Kitchener greenfield subdivision developed through the 2000s and 2010s. Housing stock is dominated by modern detached and townhouse product.',
    buyerProfile: 'First-time buyers and upgrading families targeting Kitchener\'s newer inventory.',
  },

  // ─── WATERLOO (all 6) ───

  'waterloo|uptown-waterloo': {
    walkScore: 92,
    transitScore: 84,
    bikeScore: 88,
    transitStations: [
      { name: 'Waterloo Public Square (LRT)', lines: ['ION Line 1'] },
      { name: 'University of Waterloo (LRT)', lines: ['ION Line 1'] },
    ],
    notableSpots: [
      { name: 'Uptown Waterloo BIA', kind: 'shop' },
      { name: 'Waterloo Public Square', kind: 'park' },
      { name: 'Waterloo Park', kind: 'park' },
    ],
    architecturalEra: 'Preserved Victorian and Edwardian brick + 2010s+ high-rise condominium',
    historyBlurb: 'Uptown Waterloo centres on King Street between Erb Street and Bridgeport Road — the historic heart of Waterloo and the primary retail spine of Waterloo Region. The Uptown Waterloo BIA is anchored by the University of Waterloo and Wilfrid Laurier University (both a short walk north). ION LRT (opened 2019) anchors transit access. Substantial post-2015 high-rise condominium redevelopment.',
    buyerProfile: 'Young tech-professional buyers, university faculty families, and downtown-oriented downsizers.',
  },
  'waterloo|beechwood': {
    architecturalEra: 'Post-war detached (1960s–1980s)',
    historyBlurb: 'Beechwood is a central-west Waterloo residential neighborhood developed through the postwar decades, adjacent to the University of Waterloo and Wilfrid Laurier University campuses. Housing stock features detached homes on modest-to-generous lots with strong academic-family demand.',
    buyerProfile: 'University faculty families, end-user professionals, and student-rental investors.',
  },
  'waterloo|westmount': {
    architecturalEra: 'Post-war detached (1950s–1970s)',
    historyBlurb: 'Westmount is a west Waterloo residential neighborhood developed through the postwar decades. Housing stock features mid-century detached homes on generous lots with mature tree canopy.',
    buyerProfile: 'End-user families and downsizers valuing lot size + Waterloo school access.',
  },
  'waterloo|lakeshore': {
    architecturalEra: 'Post-war detached and modern subdivision',
    historyBlurb: 'Lakeshore is a north Waterloo residential neighborhood along the Conestogo Lake / Grand River corridor. Housing stock combines post-war detached with newer subdivision inventory.',
    buyerProfile: 'End-user families and river-oriented households.',
  },
  'waterloo|university-heights': {
    architecturalEra: 'Post-war detached and student-rental conversion (1960s–1990s)',
    historyBlurb: 'University Heights is a central Waterloo residential neighborhood immediately adjacent to the University of Waterloo campus. Housing stock combines detached homes with substantial student-rental conversion activity, driven by University of Waterloo enrolment growth through the 2000s and 2010s.',
    buyerProfile: 'End-user families, academic households, and student-rental investors targeting Waterloo\'s ~40,000-student university market.',
  },
  'waterloo|lincoln-heights': {
    architecturalEra: 'Post-war detached (1960s–1980s)',
    historyBlurb: 'Lincoln Heights is a central Waterloo residential neighborhood developed through the postwar decades. Housing stock features detached homes on generous lots with mature landscaping.',
    buyerProfile: 'End-user families, downsizers, and Waterloo tech-corridor commuters.',
  },

  // ─── CAMBRIDGE (all 6) ───

  'cambridge|galt': {
    walkScore: 78,
    architecturalEra: 'Late-Victorian brick + Georgian Revival + modern infill (~1850–1920)',
    historyBlurb: 'Galt is Cambridge\'s original core, founded in 1816 and named after Scottish novelist John Galt. Historic Downtown Galt along Main Street features one of Ontario\'s best-preserved 19th-century commercial main streets, built primarily of dressed local limestone. Cambridge was formed in 1973 by amalgamating Galt, Preston, and Hespeler.',
    buyerProfile: 'End-user families valuing heritage character, first-time buyers, and downtown-oriented professionals.',
  },
  'cambridge|preston': {
    architecturalEra: 'Heritage Main Street + post-war and modern detached',
    historyBlurb: 'Preston is a central Cambridge district, historically an independent town founded in the 1820s by Mennonite settlers. Housing stock combines preserved heritage with mid-century and modern detached inventory. Preston Auditorium and King Street corridor anchor the district.',
    buyerProfile: 'End-user families, first-time buyers, and heritage-oriented households.',
  },
  'cambridge|hespeler': {
    architecturalEra: 'Preserved 19th-century mill village + post-war residential',
    historyBlurb: 'Hespeler is a north Cambridge district, historically an independent town founded in the 1830s along the Speed River. The preserved Historic Downtown Hespeler features 19th-century mill-town architecture including the Hespeler Furniture Company building. Housing character combines heritage with post-war and modern detached.',
    buyerProfile: 'End-user families, heritage buyers, and first-time buyers.',
  },
  'cambridge|blair': {
    architecturalEra: 'Historic rural hamlet + newer detached',
    historyBlurb: 'Blair is a small historic hamlet in southwest Cambridge along the Grand River. Housing character is rural with heritage cottages and newer detached inventory on generous lots.',
    buyerProfile: 'Rural end-users, first-time buyers, and Grand-River-oriented households.',
  },
  'cambridge|west-galt': {
    architecturalEra: 'Late-Victorian and Edwardian brick residential (~1870–1920)',
    historyBlurb: 'West Galt is a residential district in west Cambridge along the west bank of the Grand River. Housing stock features preserved Victorian and Edwardian brick homes with strong heritage character and Grand River trail access.',
    buyerProfile: 'End-user families valuing heritage + river access, plus long-tenured owner-occupiers.',
  },
  'cambridge|east-galt': {
    architecturalEra: 'Late-Victorian and Edwardian residential (~1870–1920)',
    historyBlurb: 'East Galt is a residential district in east Cambridge across the Grand River from downtown Galt. Housing stock features preserved 19th and early-20th-century detached homes with heritage character.',
    buyerProfile: 'End-user families, heritage buyers, and downtown-Galt-adjacent professionals.',
  },

  // ─── GUELPH (all 6) ───

  'guelph|downtown-guelph': {
    walkScore: 92,
    architecturalEra: 'Preserved 19th-century limestone commercial + surrounding Victorian residential',
    historyBlurb: 'Downtown Guelph was founded in 1827 by John Galt (the same John Galt who founded Galt/Cambridge) as a planned town — one of Canada\'s earliest examples of intentional urban planning. The downtown features one of Ontario\'s best-preserved 19th-century limestone commercial main streets, and is anchored by the historic Church of Our Lady Immaculate. The Guelph downtown revival through the 2010s has been notable.',
    buyerProfile: 'Young professionals, University of Guelph faculty, downtown-oriented downsizers, and first-time buyers.',
  },
  'guelph|old-university': {
    architecturalEra: 'Late-Victorian and Edwardian detached (~1880–1920)',
    historyBlurb: 'Old University is a residential neighborhood immediately south of the University of Guelph campus, developed as a faculty and professional community in the late 19th and early 20th centuries. Housing stock is nearly intact Victorian and Edwardian brick with strong end-user demand from academic families.',
    buyerProfile: 'University of Guelph faculty families, academic households, and long-tenured owner-occupiers.',
  },
  'guelph|exhibition-park': {
    architecturalEra: 'Interwar and post-war detached',
    historyBlurb: 'Exhibition Park is a central Guelph residential neighborhood surrounding Exhibition Park itself — a 20-acre park hosting the Guelph Exhibition (agricultural fair) since 1854. Housing stock combines interwar and postwar detached homes on generous lots.',
    buyerProfile: 'End-user families and downsizers valuing park + heritage character.',
  },
  'guelph|kortright-hills': {
    architecturalEra: 'Executive detached (1990s–2010s)',
    historyBlurb: 'Kortright Hills is a west Guelph executive residential community developed through the 1990s and 2000s. Housing stock features generous-lot detached homes with mature landscaping and easy access to the University of Guelph.',
    buyerProfile: 'End-user executive families, university faculty households, and corporate relocators.',
  },
  'guelph|westminster-woods': {
    architecturalEra: 'Post-war and modern detached (1980s–2000s)',
    historyBlurb: 'Westminster Woods is a south Guelph residential neighborhood developed through the 1980s and 1990s. Housing stock features detached homes on generous lots with mature tree canopy.',
    buyerProfile: 'End-user families and Guelph corridor upgraders.',
  },
  'guelph|pine-ridge': {
    architecturalEra: 'New-build detached (2000s–2010s)',
    historyBlurb: 'Pine Ridge is a Guelph residential neighborhood developed through the 2000s and 2010s. Housing stock features modern detached inventory with integrated parks and community centres.',
    buyerProfile: 'First-time and upgrading families and academic households.',
  },

  // ─── LONDON (all 6) ───

  'london|old-north': {
    walkScore: 82,
    architecturalEra: 'Late-Victorian, Edwardian, and Georgian Revival (~1880–1930) — heritage character',
    historyBlurb: 'Old North is one of London\'s original wealthy residential neighborhoods, developed north of downtown London through the late 19th and early 20th centuries. Housing stock features grand Victorian, Queen Anne, and Georgian Revival detached homes on generous lots. Old North sits immediately west of Western University (University of Western Ontario) and Sunningdale, making it a primary target for university faculty and healthcare professional families.',
    buyerProfile: 'Established professionals, Western University faculty, LHSC healthcare families, and long-tenured heritage owners.',
  },
  'london|wortley-village': {
    walkScore: 91,
    notableSpots: [
      { name: 'Wortley Village BIA main strip', kind: 'shop' },
      { name: 'Old South Historic District', kind: 'landmark' },
    ],
    architecturalEra: 'Preserved late-Victorian and Edwardian brick (~1890–1920)',
    historyBlurb: 'Wortley Village (part of the broader Old South Historic District) is London\'s premier walkable heritage neighborhood, developed as a streetcar suburb between the 1890s and 1920. Wortley Road between Baseline Road and Byron Avenue is one of Canada\'s most preserved neighborhood commercial main streets, and Old South was named "Canada\'s Best Neighbourhood" by the Canadian Institute of Planners in 2013. Housing stock is nearly intact Victorian and Edwardian brick.',
    buyerProfile: 'End-user professional families, downtown-oriented downsizers, and heritage-motivated buyers.',
  },
  'london|byron': {
    walkScore: 70,
    transitScore: 36,
    bikeScore: 55,
    architecturalEra: 'Post-war and modern detached (1960s–2000s)',
    historyBlurb: 'Byron is a west London residential neighborhood along the Thames River, historically an independent village until amalgamated into London in 1961. Housing stock combines post-war detached with newer executive subdivision inventory and Thames River trail access.',
    buyerProfile: 'End-user families and river-oriented households.',
  },
  'london|westmount': {
    walkScore: 72,
    transitScore: 45,
    architecturalEra: 'Post-war detached (1960s–1980s)',
    historyBlurb: 'Westmount is a west London residential neighborhood anchored by Westmount Shopping Centre (opened 1973). Housing stock features detached homes on generous lots with mature tree canopy.',
    buyerProfile: 'End-user families, downsizers, and west-London-oriented professionals.',
  },
  'london|masonville': {
    walkScore: 33,
    transitScore: 57,
    bikeScore: 50,
    architecturalEra: 'Executive detached (1970s–2000s)',
    historyBlurb: 'Masonville is a north London executive residential neighborhood adjacent to Western University and anchored by Masonville Place shopping centre. Housing stock features generous-lot detached homes with strong demand from Western faculty and Ivey business school families.',
    buyerProfile: 'End-user executive families, Western University faculty, and Ivey business school households.',
  },
  'london|sunningdale': {
    architecturalEra: 'Executive detached (1980s–2010s)',
    historyBlurb: 'Sunningdale is a northwest London executive residential community developed through the 1980s and 1990s along the Sunningdale Golf and Country Club corridor. Housing stock features generous-lot detached homes and Sunningdale has one of London\'s highest single-family price points.',
    buyerProfile: 'Established professional families, Western faculty, healthcare executives, and corporate relocators.',
  },

  // ─── WINDSOR (all 6) ───

  'windsor|walkerville': {
    walkScore: 86,
    notableSpots: [
      { name: 'Walkerville BIA main strip', kind: 'shop' },
      { name: 'Willistead Manor', kind: 'landmark' },
    ],
    architecturalEra: 'Preserved late-Victorian, Edwardian, and Tudor Revival (~1890–1930)',
    historyBlurb: 'Walkerville was founded in 1858 as a company town for Hiram Walker & Sons Distillery (makers of Canadian Club whisky) and remained an independent municipality until amalgamated into Windsor in 1935. The neighborhood retains extraordinary heritage character — including Willistead Manor (the Walker family mansion, now a Windsor museum). Housing stock is nearly intact Victorian, Edwardian, and Tudor Revival brick.',
    buyerProfile: 'Heritage-oriented end-users, established professionals, and downsizers.',
  },
  'windsor|riverside': {
    walkScore: 56,
    transitScore: 32,
    bikeScore: 48,
    notableSpots: [
      { name: "Schiller", kind: "landmark" },
      { name: "Dante", kind: "landmark" },
      { name: "Afghanistan & Peacekeepers Memorial", kind: "landmark" },
      { name: "Reverend Samuel Francis Smith Flagpole", kind: "landmark" },
      { name: "Cenotaph", kind: "landmark" },
      { name: "Ralph Wilson Gateway & Trail", kind: "landmark" }
    ],
    architecturalEra: 'Post-war and interwar detached along the Detroit River',
    historyBlurb: 'Riverside is an east Windsor lakefront neighborhood along the Detroit River, historically an independent town until amalgamated into Windsor in 1966. Housing stock combines interwar and postwar detached homes with dramatic Detroit skyline views across the river.',
    buyerProfile: 'End-user families, waterfront-oriented professionals, and cross-border commuters to Detroit metro.',
  },
  'windsor|sandwich': {
    walkScore: 41,
    transitScore: 46,
    bikeScore: 57,
    transitStations: [
      { name: "Hotel Dieu Grace Healthcare", lines: [
        "Windsor Transit"
      ] },
      { name: "Fort / McKinstry (WB)" },
      { name: "Wyandotte at Randolph" },
      { name: "Tecumseh Rd. W. & Northway" },
      { name: "Tecumseh Rd W & Northway" }
    ],
    notableSpots: [
      { name: "The North Wall", kind: "landmark" },
      { name: "College Avenue Bikeway", kind: "park" },
      { name: "Ernest Atkinson Park", kind: "park" },
      { name: "Maurice Belanger Park", kind: "park" },
      { name: "Mic Mac Park", kind: "park" },
      { name: "Girardot", kind: "park" }
    ],
    architecturalEra: 'Historic town (~1797–1900) + post-war residential',
    historyBlurb: 'Sandwich is a west Windsor neighborhood, historically one of the oldest continuous European settlements in Ontario — the Sandwich village was founded in 1797. The Sandwich Historic District includes the Duff-Baby House (1798) and Mackenzie Hall. The University of Windsor sits at the north edge of the neighborhood.',
    buyerProfile: 'Heritage-oriented end-users, University of Windsor faculty and students, and long-tenured owner-occupiers.',
  },
  'windsor|south-walkerville': {
    walkScore: 68,
    transitScore: 42,
    bikeScore: 45,
    notableSpots: [
      { name: "Pooch’s", kind: "landmark" },
      { name: "Lanspeary Park", kind: "park" },
      { name: "Clay Park", kind: "park" },
      { name: "Stodgell Park", kind: "park" },
      { name: "Factoria Park", kind: "park" },
      { name: "Westcott Park", kind: "park" }
    ],
    architecturalEra: 'Interwar and post-war detached (~1920–1970)',
    historyBlurb: 'South Walkerville extends south from the historic Walkerville core toward Highway 401. Housing stock combines interwar detached with mid-century subdivision inventory.',
    buyerProfile: 'End-user families and heritage-adjacent professionals.',
  },
  'windsor|old-riverside': {
    architecturalEra: 'Interwar and early post-war detached along the Detroit River',
    historyBlurb: 'Old Riverside is a residential district in east Windsor along the Detroit River, retaining historic detached character from the pre-amalgamation Riverside town years.',
    buyerProfile: 'End-user families and heritage-oriented buyers valuing river access.',
  },
  'windsor|forest-glade': {
    walkScore: 58,
    transitScore: 41,
    bikeScore: 47,
    architecturalEra: 'Post-war detached (1960s–1980s)',
    historyBlurb: 'Forest Glade is an east Windsor residential neighborhood developed through the postwar decades. Housing stock features detached homes on generous lots.',
    buyerProfile: 'End-user families and first-time buyers.',
  },

  // ─── BARRIE (all 6) ───

  'barrie|downtown-barrie': {
    walkScore: 84,
    notableSpots: [
      { name: 'Kempenfelt Bay waterfront', kind: 'park' },
      { name: 'Historic Downtown Barrie BIA', kind: 'shop' },
      { name: 'Sadlon Arena', kind: 'landmark' },
    ],
    architecturalEra: 'Preserved late-Victorian brick + 2010s+ waterfront condominium',
    historyBlurb: 'Downtown Barrie centres on Dunlop Street along Kempenfelt Bay — a dramatic natural harbour on Lake Simcoe. The historic downtown features preserved 19th-century commercial brick, and Kempenfelt Bay waterfront has been the target of substantial post-2010 condominium redevelopment. Barrie GO Station (Barrie line) provides direct commuter access to Toronto Union Station.',
    buyerProfile: 'GO commuters, downtown-oriented downsizers, and waterfront-oriented end-users.',
  },
  'barrie|allandale': {
    architecturalEra: 'Historic railway village + post-war and modern detached',
    historyBlurb: 'Allandale is a south Barrie neighborhood, historically an independent town founded as a Grand Trunk Railway junction settlement in the 1850s and amalgamated into Barrie in 1897. Barrie South GO Station (originally Allandale Waterfront GO) anchors commuter access. Housing stock combines heritage properties with post-war and modern detached inventory.',
    buyerProfile: 'End-user families, GO commuters, and heritage-oriented buyers.',
  },
  'barrie|south-shore': {
    architecturalEra: 'Post-war lakefront cottage-conversion + modern waterfront residential',
    historyBlurb: 'South Shore is a south Barrie residential district along the southern shore of Kempenfelt Bay. Historically a summer cottage community, it transitioned to year-round residential through the postwar decades with substantial modern lakefront redevelopment through the 2000s and 2010s.',
    buyerProfile: 'End-user families, downsizers, and waterfront-oriented households.',
  },
  'barrie|innishore': {
    architecturalEra: 'Post-war and modern detached',
    historyBlurb: 'Innishore is a south Barrie residential neighborhood developed through the postwar decades along the Innisfil boundary. Housing stock features detached homes on generous lots.',
    buyerProfile: 'End-user families and Innisfil-boundary-oriented households.',
  },
  'barrie|painswick': {
    architecturalEra: 'Post-war and modern detached (1970s–2000s)',
    historyBlurb: 'Painswick is a south Barrie residential neighborhood developed through the 1970s and 1990s. Housing stock features detached homes with integrated schools and community centres.',
    buyerProfile: 'End-user families, first-time buyers, and Barrie South GO commuters.',
  },
  'barrie|sunnidale': {
    walkScore: 53,
    transitScore: 39,
    bikeScore: 32,
    transitStations: [
      { name: "Cundles at Sunnidale" },
      { name: "École Catholique" },
      { name: "Valley Drive" },
      { name: "Bayfield Mall" },
      { name: "Shelley Lane" }
    ],
    notableSpots: [
      { name: "Sunnidale Park", kind: "park" },
      { name: "Kearsey Park", kind: "park" },
      { name: "Sunnidale Dog Off Leash Recreation Area", kind: "park" }
    ],
    architecturalEra: 'Post-war and modern detached (1960s–2000s)',
    historyBlurb: 'Sunnidale is a west Barrie residential neighborhood along the Sunnidale Road corridor. Housing stock spans post-war detached with newer subdivision inventory.',
    buyerProfile: 'End-user families and first-time buyers.',
  },

  // ─── SUDBURY (all 6) ───

  'sudbury|new-sudbury': {
    architecturalEra: 'Post-war detached and bungalow (1950s–1980s) — Sudbury\'s primary postwar residential expansion',
    historyBlurb: 'New Sudbury is Sudbury\'s largest residential district, developed through the postwar decades as the city expanded northeast on former mining lands. Anchored by New Sudbury Centre (Sudbury\'s largest shopping mall) and Cambrian College. Housing stock is dominated by mid-century detached homes on generous lots.',
    buyerProfile: 'End-user families, first-time buyers, Cambrian College students and staff, and multi-generational Franco-Ontarian and Italian-Canadian households.',
  },
  'sudbury|downtown-sudbury': {
    walkScore: 82,
    architecturalEra: 'Late-Victorian and interwar commercial + surrounding residential',
    historyBlurb: 'Downtown Sudbury developed around the Canadian Pacific Railway junction in the 1880s and grew rapidly with the surrounding nickel mining industry (Inco, later Vale). Housing stock combines preserved commercial heritage with early 20th-century residential and modern mid-rise infill. Downtown Sudbury has been the target of ongoing revitalization since the early 2000s.',
    buyerProfile: 'Young professionals, downtown-oriented downsizers, and mining/healthcare workforce households.',
  },
  'sudbury|south-end': {
    architecturalEra: 'Post-war and modern detached (1950s–2000s)',
    historyBlurb: 'The South End is a large Sudbury residential district south of Ramsey Lake, developed through the postwar decades. Home to Health Sciences North (Sudbury\'s regional hospital) and Laurentian University at its south edge. Housing stock spans mid-century to modern detached inventory.',
    buyerProfile: 'End-user families, healthcare professionals, and Laurentian University faculty households.',
  },
  'sudbury|minnow-lake': {
    architecturalEra: 'Post-war lakefront cottage-conversion + modern detached',
    historyBlurb: 'Minnow Lake is a residential district in east Sudbury along the Minnow Lake shoreline, historically a lakefront cottage community that transitioned to year-round residential through the postwar decades. Housing stock features detached homes with lake and trail access.',
    buyerProfile: 'End-user families, downsizers, and lake-oriented households.',
  },
  'sudbury|copper-cliff': {
    architecturalEra: 'Company-town workers\' cottages (~1900–1950) + post-war residential',
    historyBlurb: 'Copper Cliff was founded in 1901 as a company town for the Canadian Copper Company (which became International Nickel Company / Inco / Vale) — one of Canada\'s most storied mining company towns. The famous Copper Cliff Smelter and the 380-metre Superstack (one of the tallest chimneys in the world) define the skyline. Housing stock is dominated by original company-town workers\' cottages alongside post-war residential expansion.',
    buyerProfile: 'End-user Vale/mining-industry households, heritage buyers, and multi-generational owner-occupiers with mining industry family history.',
  },
  'sudbury|lively': {
    architecturalEra: 'Post-war company-town detached + rural residential',
    historyBlurb: 'Lively is a residential community in west Sudbury (former Walden), historically a mining company town developed for Inco workers in the postwar decades. Housing stock features detached homes on generous lots with rural character, surrounded by the Killarney and Kilcoy conservation lands.',
    buyerProfile: 'End-user families, mining industry households, and outdoor-recreation-oriented households.',
  },

  // ─── ST. CATHARINES (all 6) ───

  'st-catharines|grapeview': {
    architecturalEra: 'Post-war and modern detached (1960s–2000s) among Niagara wine country',
    historyBlurb: 'Grapeview is a south St. Catharines residential neighborhood along the escarpment corridor, adjacent to Niagara wine-country vineyards. Housing stock features post-war and newer detached inventory with strong end-user demand from wine-industry and Brock University-adjacent professionals.',
    buyerProfile: 'End-user families, wine-industry households, and Brock University faculty.',
  },
  'st-catharines|port-dalhousie': {
    walkScore: 76,
    notableSpots: [
      { name: 'Port Dalhousie Pier + Lighthouse', kind: 'landmark' },
      { name: 'Lakeside Park Carousel', kind: 'park' },
      { name: 'Port Dalhousie BIA main strip', kind: 'shop' },
    ],
    architecturalEra: 'Historic port village (~1830–1900) + interwar cottage + modern waterfront',
    historyBlurb: 'Port Dalhousie was founded in 1826 as the Lake Ontario terminus of the original Welland Canal, and remained an independent town until amalgamated into St. Catharines in 1961. Historic Port Dalhousie retains its 19th-century harbour village character, and the Lakeside Park Carousel (1898) is one of the oldest continuously-operating carousels in North America. Waterfront condominium redevelopment has been substantial through the 2010s.',
    buyerProfile: 'Heritage buyers, downsizing empty-nesters, waterfront-oriented professionals, and Toronto-adjacent second-home buyers.',
  },
  'st-catharines|glenridge': {
    architecturalEra: 'Interwar and post-war detached (~1920–1970) — St. Catharines\' established residential district',
    historyBlurb: 'Glenridge is a south-central St. Catharines residential district anchored by Brock University at its south edge. Housing stock combines interwar and postwar detached homes on generous lots with mature tree canopy. Strong end-user demand from Brock faculty and healthcare-professional families.',
    buyerProfile: 'End-user families, Brock University faculty, and healthcare professionals.',
  },
  'st-catharines|martindale': {
    architecturalEra: 'Post-war and modern detached (1960s–2000s)',
    historyBlurb: 'Martindale is a west St. Catharines residential neighborhood along the Twelve Mile Creek corridor. Housing stock features detached homes on generous lots with mature landscaping.',
    buyerProfile: 'End-user families and first-time buyers.',
  },
  'st-catharines|western-hill': {
    architecturalEra: 'Post-war detached and bungalow (1950s–1970s)',
    historyBlurb: 'Western Hill is a west-central St. Catharines residential neighborhood developed through the postwar decades. Housing stock features mid-century detached homes on modest-to-generous lots.',
    buyerProfile: 'End-user families, first-time buyers, and Brock University-adjacent households.',
  },
  'st-catharines|old-town': {
    architecturalEra: 'Preserved late-Victorian brick (~1850–1900) + surrounding heritage residential',
    historyBlurb: 'Old Town St. Catharines centres on St. Paul Street between Ontario Street and Geneva Street — the historic commercial heart of the city, dating to the 1810s. Housing stock combines preserved 19th-century commercial + residential brick with modern mid-rise infill. St. Catharines was founded around the original Welland Canal alignment and grew as the primary Niagara Peninsula industrial city through the late 19th and 20th centuries.',
    buyerProfile: 'Downtown-oriented professionals, heritage buyers, and downsizing empty-nesters.',
  },

  // ─── NIAGARA-ON-THE-LAKE (all 6) ───

  'niagara-on-the-lake|old-town': {
    walkScore: 82,
    notableSpots: [
      { name: 'Queen Street heritage main strip', kind: 'shop' },
      { name: 'Fort George National Historic Site', kind: 'landmark' },
      { name: 'Shaw Festival Theatre', kind: 'landmark' },
      { name: 'Prince of Wales Hotel', kind: 'landmark' },
    ],
    architecturalEra: 'Preserved Georgian and Regency brick (~1815–1860) — one of the most intact post-War-of-1812 heritage streetscapes in Canada',
    historyBlurb: 'Old Town Niagara-on-the-Lake was the original capital of Upper Canada (1792–1797) and was burned by American forces during the War of 1812 in 1813. The town was rebuilt in the 1810s and 1820s in Georgian and Regency brick — housing stock is nearly intact from that period. Queen Street between Mississagua and King is one of the most-preserved heritage commercial main streets in Canada. Home to Fort George National Historic Site and the annual Shaw Festival theatre season.',
    buyerProfile: 'Ultra-wealthy heritage buyers, second-home purchasers from GTA + US, Shaw Festival patrons, and long-tenured heritage owners.',
  },
  'niagara-on-the-lake|virgil': {
    architecturalEra: 'Rural village + agricultural + modern rural residential',
    historyBlurb: 'Virgil is a small village in central Niagara-on-the-Lake, historically an agricultural service community for the surrounding wine-country vineyards and orchards. Housing character is rural with heritage cottages and modern rural detached inventory.',
    buyerProfile: 'Wine-industry households, agricultural workforce, and rural end-users.',
  },
  'niagara-on-the-lake|st-davids': {
    architecturalEra: 'Historic hamlet + rural detached',
    historyBlurb: 'St. Davids is a small historic community in central Niagara-on-the-Lake, founded in the 1780s by Loyalist settler Major David Secord (brother of James Secord, husband of Laura Secord). The village retains 19th-century Main Street character alongside modern rural residential inventory.',
    buyerProfile: 'Heritage buyers, wine-industry households, and estate residents.',
  },
  'niagara-on-the-lake|queenston': {
    architecturalEra: 'Historic Loyalist village + rural residential',
    historyBlurb: 'Queenston is a small historic village at the base of the Niagara Escarpment along the Niagara River, founded in the 1780s by Loyalist settlers. Site of the Battle of Queenston Heights (1812), one of the pivotal War of 1812 engagements, marked by Brock\'s Monument to Major-General Sir Isaac Brock. Housing stock features preserved heritage homes and modern rural detached.',
    buyerProfile: 'Heritage buyers, history-oriented end-users, and rural households.',
  },
  'niagara-on-the-lake|glendale': {
    architecturalEra: 'Modern rural residential + agricultural',
    historyBlurb: 'Glendale is a rural residential district in central Niagara-on-the-Lake near the QEW interchange and Niagara College\'s Niagara-on-the-Lake campus. Housing character combines rural detached with modern subdivision inventory near the college.',
    buyerProfile: 'End-user families, Niagara College-adjacent professionals, and QEW-commuter households.',
  },
  'niagara-on-the-lake|garrison-village': {
    architecturalEra: 'Modern executive detached (1990s–2010s)',
    historyBlurb: 'Garrison Village is a modern executive residential community in central Niagara-on-the-Lake, developed through the 1990s and 2000s. The neighborhood is named for the Fort George garrison history and offers proximity to Old Town heritage character while providing modern housing stock.',
    buyerProfile: 'End-user executive families, second-home buyers seeking newer inventory near Old Town, and Shaw Festival patrons.',
  },
};

export function getNeighborhoodExtras(citySlug: string, neighborhoodSlug: string): NeighborhoodExtras | null {
  return NEIGHBORHOOD_EXTRAS[`${citySlug}|${neighborhoodSlug}`] ?? null;
}

export function hasCuratedNeighborhood(citySlug: string, neighborhoodSlug: string): boolean {
  return `${citySlug}|${neighborhoodSlug}` in NEIGHBORHOOD_EXTRAS;
}

// Flagship tier = has AT LEAST ONE structured signal beyond the era/history/
// buyer-profile trio. Presence of any of these fields marks the entry as
// meaningfully richer than a generic template and safe to index. Standard-
// tier entries render for users but get noindex,follow so Google can't
// treat them as a site-wide thin-content pattern. As each standard entry
// is upgraded (add walkScore + transitStations + notableSpots or schools),
// it automatically becomes indexable — no separate flag to manage.
export function isFlagshipNeighborhoodTier(extras: NeighborhoodExtras | null): boolean {
  if (!extras) return false;
  return Boolean(
    typeof extras.walkScore === 'number' ||
    (extras.transitStations && extras.transitStations.length > 0) ||
    (extras.notableSpots && extras.notableSpots.length > 0) ||
    (extras.notableSchools && extras.notableSchools.length > 0),
  );
}

/** Minimum characters of curated history prose before a page carries enough of
 *  its own words to stand as an indexable document. Roughly 40 words. */
const MIN_HISTORY_CHARS = 260;

/**
 * Indexability gate for neighbourhood pages.
 *
 * Flagship tier alone proved insufficient: pages like
 * /real-estate/ottawa/neighborhood/rockcliffe-park cleared the structured-signal
 * bar (they have a Walk Score and notable places) yet were still reported as
 * "Crawled – currently not indexed", because a handful of chips and scores sit
 * inside an otherwise identical template. Requiring substantive curated prose on
 * top of the structured signals is what actually separates a document from a
 * layout. Entries that fail this gate render for users as noindex,follow.
 */
export function isIndexableNeighborhood(extras: NeighborhoodExtras | null): boolean {
  if (!isFlagshipNeighborhoodTier(extras)) return false;
  return (extras?.historyBlurb?.length ?? 0) >= MIN_HISTORY_CHARS;
}
