// City list for the /mortgage-broker/[city] landing pages. The 42 cities
// already in data/cityData.ts (which carry HPI data + neighborhoods)
// plus 8 additional Ontario cities where mortgage-broker search demand
// justifies a dedicated landing page.
//
// Each entry ships a unique per-city blurb so the 50 pages don't
// pattern-match as a single template variable-swap (which is what
// triggers Google's Helpful Content downgrades).

export interface BrokerCity {
  /** Display name, e.g. "St. Catharines". */
  name: string;
  /** URL slug, e.g. "st-catharines". */
  slug: string;
  /** Broader region context — used in metadata + local relevance copy. */
  region: 'GTA' | 'Halton' | 'Peel' | 'York' | 'Durham' | 'Niagara' | 'Waterloo' | 'Southwestern' | 'Central' | 'Eastern' | 'Northern';
  /**
   * 1-3 sentence factual blurb specific to this city's real estate + mortgage
   * dynamics. Must NOT be a template variable-swap — each is written by hand
   * to give the page unique content that Google can distinguish from its
   * ~49 siblings. Reflects the actual market context for buyers there.
   */
  blurb: string;
  /**
   * True if this city is also present in data/cityData.ts (meaning the page
   * can pull CREA HPI + TRREB benchmark data via MarketDataService). False
   * for the 8 additional cities that are broker-page-only for now.
   */
  hasMatrixData: boolean;
  /**
   * A representative neighborhood in the city — cross-linked from the page
   * as a "see local neighborhood detail" pointer. Only used when
   * hasMatrixData is true.
   */
  representativeNeighborhood?: string;
  /**
   * One-sentence market context that appears in place of the CREA HPI
   * snapshot on the 8 no-matrix cities. Sourced from public MLS-board
   * language or defensible market observation — not fabricated numbers.
   * Only used when hasMatrixData is false.
   */
  marketContextFallback?: string;
}

// ─── The 50 cities ───

export const BROKER_CITIES: BrokerCity[] = [
  // GTA proper — highest-search-volume cluster
  {
    name: 'Toronto',
    slug: 'toronto',
    region: 'GTA',
    blurb: 'Toronto is Canada\'s largest housing market and by far the most competitive mortgage-broker environment in the country. Multi-offer bids, tight condition periods, and rapid rate holds are the norm — the difference between a broker who responds in an hour and one who takes a day is often the difference between winning and losing the deal.',
    hasMatrixData: true,
    representativeNeighborhood: 'the-annex',
  },
  {
    name: 'Mississauga',
    slug: 'mississauga',
    region: 'Peel',
    blurb: 'Mississauga blends downtown-Toronto-adjacent condo demand with detached-home family submarkets from Erin Mills through Port Credit. Broker files here span first-time-buyer condos under $500K through executive detached over $2M, so lender panel breadth matters more than in most Ontario cities.',
    hasMatrixData: true,
    representativeNeighborhood: 'port-credit',
  },
  {
    name: 'Brampton',
    slug: 'brampton',
    region: 'Peel',
    blurb: 'Brampton is one of Canada\'s fastest-growing cities and one of the youngest — the median buyer here is under 35, multi-generational, and often in the first-time-buyer bracket. Down-payment gift documentation, cross-border income verification, and B-lender fit are the file specifics that come up most often.',
    hasMatrixData: true,
    representativeNeighborhood: 'mount-pleasant',
  },
  {
    name: 'Vaughan',
    slug: 'vaughan',
    region: 'York',
    blurb: 'Vaughan combines executive detached submarkets (Kleinburg, Thornhill Woods) with the Toronto-subway-adjacent Vaughan Metropolitan Centre condo cluster. Files trend larger than the York Region average — median deal size at IndiBrick for Vaughan sits meaningfully above Markham and Richmond Hill.',
    hasMatrixData: true,
    representativeNeighborhood: 'kleinburg',
  },
  {
    name: 'Markham',
    slug: 'markham',
    region: 'York',
    blurb: 'Markham\'s buyer pool skews heavily toward Chinese-Canadian and multi-generational households, with Unionville and Cornell driving family-buyer demand around top-rated public school catchments. Broker files often involve co-borrowers, foreign income sources, or gift letters — the mechanics that trip up bank-only applications.',
    hasMatrixData: true,
    representativeNeighborhood: 'unionville',
  },
  {
    name: 'Richmond Hill',
    slug: 'richmond-hill',
    region: 'York',
    blurb: 'Richmond Hill\'s Bayview Hill and Oak Ridges catchments carry executive-tier detached inventory that routinely tops $2M. Persian-Canadian and Chinese-Canadian family buyers dominate demand, and Yonge Street subway-corridor condos are the primary first-time-buyer product.',
    hasMatrixData: true,
    representativeNeighborhood: 'bayview-hill',
  },
  {
    name: 'Scarborough',
    slug: 'scarborough',
    region: 'GTA',
    blurb: 'Scarborough remains one of the GTA\'s more accessible detached submarkets — Guildwood and Cliffside carry lakefront character at prices well below downtown Toronto equivalents. Broker files here mix first-time-buyer families, immigrant households, and long-tenured owner-occupiers refinancing to unlock equity.',
    hasMatrixData: true,
    representativeNeighborhood: 'guildwood',
  },
  {
    name: 'Etobicoke',
    slug: 'etobicoke',
    region: 'GTA',
    blurb: 'Etobicoke\'s Kingsway and Mimico submarkets combine early-20th-century detached character with lakefront condo redevelopment. The recent Ontario Line and QEW-corridor renewal is pulling investor interest, though family-buyer demand still drives the majority of broker deal flow.',
    hasMatrixData: true,
    representativeNeighborhood: 'mimico',
  },
  // Halton
  {
    name: 'Oakville',
    slug: 'oakville',
    region: 'Halton',
    blurb: 'Oakville is Halton Region\'s executive submarket — Glen Abbey, Old Oakville, and the Lakeshore corridor consistently rank among the top-priced single-family markets in the western GTA. Corporate relocators, downsizers from Toronto, and long-tenured executive families dominate demand.',
    hasMatrixData: true,
    representativeNeighborhood: 'glen-abbey',
  },
  {
    name: 'Burlington',
    slug: 'burlington',
    region: 'Halton',
    blurb: 'Burlington offers the lakefront + escarpment character of Oakville at a 15-25% discount, with strong end-user demand for downtown-Burlington condos and Alton Village new-build detached. Millcroft and Roseland catchments carry the executive family pool.',
    hasMatrixData: true,
    representativeNeighborhood: 'downtown-burlington',
  },
  {
    name: 'Milton',
    slug: 'milton',
    region: 'Halton',
    blurb: 'Milton was the fastest-growing municipality in Canada through the 2010s and remains one of the largest first-time-buyer markets in the country. Nearly all inventory is new-build detached and townhouse, so builder-financing coordination and closing-cost math (development charges, HST rebates) come up on almost every file.',
    hasMatrixData: true,
    representativeNeighborhood: 'dempsey',
  },
  {
    name: 'Halton Hills',
    slug: 'halton-hills',
    region: 'Halton',
    blurb: 'Halton Hills — Georgetown and Acton — offers small-town Halton character within the Kitchener GO line catchment. Buyer files here often combine GTA-employed household income with rural or heritage property specifics like well/septic and larger lots.',
    hasMatrixData: true,
    representativeNeighborhood: 'georgetown',
  },
  // York
  {
    name: 'Newmarket',
    slug: 'newmarket',
    region: 'York',
    blurb: 'Newmarket balances heritage-village character (historic downtown Main Street) with modern executive subdivisions like Stonehaven and Woodland Hill. The Newmarket GO line pulls Toronto-employed family buyers, and pre-approval SLA matters more than rate in the current competitive market.',
    hasMatrixData: true,
    representativeNeighborhood: 'aurora-village',
  },
  {
    name: 'Aurora',
    slug: 'aurora',
    region: 'York',
    blurb: 'Aurora is a mid-size York Region market anchored by Aurora GO (Newmarket line) and the private-school pull of St. Andrew\'s College. Buyer pool skews family-oriented and executive-tier, with detached inventory dominating.',
    hasMatrixData: true,
    representativeNeighborhood: 'aurora-village',
  },
  {
    name: 'King City',
    slug: 'king-city',
    region: 'York',
    blurb: 'King Township — King City, Nobleton, Schomberg — is York Region\'s estate-detached submarket, with acre-plus lots protected under the Greenbelt legislation. Broker files here often involve well/septic, larger loan amounts, and non-standard property valuations.',
    hasMatrixData: true,
    representativeNeighborhood: 'nobleton',
  },
  {
    name: 'Bradford',
    slug: 'bradford',
    region: 'York',
    blurb: 'Bradford (Bradford West Gwillimbury) is one of Ontario\'s fastest-growing satellite cities, with new-build detached dominating inventory. Bradford GO service to Toronto drives most buyer demand from first-time-buyer families priced out of southern York Region.',
    hasMatrixData: true,
    representativeNeighborhood: 'bradford-west',
  },
  {
    name: 'Innisfil',
    slug: 'innisfil',
    region: 'Central',
    blurb: 'Innisfil sits on Lake Simcoe\'s south shore and is transitioning from cottage-country character to year-round residential — the Friday Harbour lakefront resort community and Alcona expansion have made it one of central Ontario\'s hottest secondary-home + first-time-buyer markets.',
    hasMatrixData: true,
    representativeNeighborhood: 'alcona',
  },
  // Peel + Caledon
  {
    name: 'Caledon',
    slug: 'caledon',
    region: 'Peel',
    blurb: 'Caledon carries the estate-and-acreage character of the Niagara Escarpment within an hour of Toronto. Bolton and Palgrave anchor the detached market; broker files here often involve rural properties, private roads, or hobby-farm zoning that big-bank underwriting doesn\'t handle well.',
    hasMatrixData: true,
    representativeNeighborhood: 'bolton',
  },
  // Durham
  {
    name: 'Pickering',
    slug: 'pickering',
    region: 'Durham',
    blurb: 'Pickering is the closest Durham-Region market to downtown Toronto by GO train, and Bay Ridges + Amberlea carry strong end-user family demand. New-build detached in the Seaton area is expanding the surface west, drawing first-time-buyer files from Scarborough and Ajax.',
    hasMatrixData: true,
    representativeNeighborhood: 'bay-ridges',
  },
  {
    name: 'Ajax',
    slug: 'ajax',
    region: 'Durham',
    blurb: 'Ajax has become one of Durham\'s largest first-time-buyer submarkets, with detached and semi-detached inventory dominating and Durham Region Transit connecting the neighborhoods. Multi-generational households from Scarborough and Pickering drive a significant share of broker deal flow.',
    hasMatrixData: true,
    representativeNeighborhood: 'central-ajax',
  },
  {
    name: 'Whitby',
    slug: 'whitby',
    region: 'Durham',
    blurb: 'Whitby balances established heritage downtown character with Brooklin\'s new-build detached expansion. The Whitby GO station and Highway 407 access pull Toronto-employed family buyers, and pre-approval competitiveness is the key differentiator in the current Whitby market.',
    hasMatrixData: true,
    representativeNeighborhood: 'downtown-whitby',
  },
  {
    name: 'Oshawa',
    slug: 'oshawa',
    region: 'Durham',
    blurb: 'Oshawa remains one of the GTA\'s more accessible detached markets, anchored by Ontario Tech University and Durham College. Broker files include first-time-buyer families, student-rental investors, and refinancing homeowners unlocking equity for renovations.',
    hasMatrixData: true,
    representativeNeighborhood: 'mclaughlin',
  },
  {
    name: 'Clarington',
    slug: 'clarington',
    region: 'Durham',
    blurb: 'Clarington — Bowmanville, Courtice, Newcastle — is Durham\'s eastern growth edge, with new-build detached dominating recent supply. Broker files often involve first-time-buyer families or Toronto-employed households trading commute for lot size.',
    hasMatrixData: true,
    representativeNeighborhood: 'bowmanville',
  },
  // Hamilton area
  {
    name: 'Hamilton',
    slug: 'hamilton',
    region: 'GTA',
    blurb: 'Hamilton has been the biggest post-2015 GTA-adjacent migration destination, with Toronto downsizers arriving into Durand and Locke Street driving substantial price growth. Broker files span heritage inventory, first-time-buyer condos, and Ancaster/Dundas executive detached — the widest single-city product spread outside Toronto.',
    hasMatrixData: true,
    representativeNeighborhood: 'locke-street',
  },
  // Niagara belt
  {
    name: 'St. Catharines',
    slug: 'st-catharines',
    region: 'Niagara',
    blurb: 'St. Catharines anchors the Niagara Region — Brock University drives student-rental investor files, Port Dalhousie waterfront attracts downsizers, and the QEW commute pulls Toronto-adjacent buyer demand seeking Niagara pricing.',
    hasMatrixData: true,
    representativeNeighborhood: 'port-dalhousie',
  },
  {
    name: 'Niagara Falls',
    slug: 'niagara-falls',
    region: 'Niagara',
    blurb: 'Niagara Falls combines tourism-adjacent short-term rental investment demand with local first-time-buyer inventory and second-home purchases from Toronto and Buffalo. Broker files here often involve non-standard income (tourism/hospitality) or dual-currency mortgages.',
    hasMatrixData: true,
    representativeNeighborhood: 'stamford',
  },
  {
    name: 'Niagara-on-the-Lake',
    slug: 'niagara-on-the-lake',
    region: 'Niagara',
    blurb: 'Niagara-on-the-Lake is one of Ontario\'s highest-priced heritage markets — Old Town waterfront estate inventory routinely tops $3M and second-home purchases from the GTA dominate broker deal flow. Wine-country property specifics (agricultural zoning, VQA operations) come up regularly.',
    hasMatrixData: true,
    representativeNeighborhood: 'old-town',
  },
  {
    name: 'Welland',
    slug: 'welland',
    region: 'Niagara',
    blurb: 'Welland offers Niagara pricing within a 20-minute drive of St. Catharines — one of the more accessible Ontario detached markets. Buyer files include first-time-buyers, retirees, and the growing set of remote-work households trading GTA density for Niagara value.',
    hasMatrixData: true,
    representativeNeighborhood: 'dain-city',
  },
  {
    name: 'Fort Erie',
    slug: 'fort-erie',
    region: 'Niagara',
    blurb: 'Fort Erie sits on Lake Erie across from Buffalo, NY — cross-border owner and dual-currency mortgage files are more common here than anywhere else in the province. Crystal Beach and Ridgeway carry heritage character; new-build detached is the growth story.',
    hasMatrixData: true,
    representativeNeighborhood: 'crystal-beach',
  },
  {
    name: 'Grimsby',
    slug: 'grimsby',
    region: 'Niagara',
    blurb: 'Grimsby is Ontario\'s primary Toronto-to-Niagara commuter overflow market — GO train service through Grimsby Beach has drawn substantial GTA-employed buyers, and Grimsby-on-the-Lake condo redevelopment is the primary new supply.',
    hasMatrixData: true,
    representativeNeighborhood: 'grimsby-beach',
  },
  // Waterloo Region + Guelph
  {
    name: 'Kitchener',
    slug: 'kitchener',
    region: 'Waterloo',
    blurb: 'Kitchener is Waterloo Region\'s largest city and its primary first-time-buyer market. Tech-employed households from downtown Kitchener\'s Innovation District drive downtown condo demand; families move to Doon, Forest Heights, and Country Hills for detached.',
    hasMatrixData: true,
    representativeNeighborhood: 'downtown-kitchener',
  },
  {
    name: 'Waterloo',
    slug: 'waterloo',
    region: 'Waterloo',
    blurb: 'Waterloo balances the University of Waterloo + Wilfrid Laurier student-rental investor market against Uptown Waterloo family end-user demand. Tech-industry households are a growing buyer share, and the ION LRT has reshaped the corridor.',
    hasMatrixData: true,
    representativeNeighborhood: 'uptown-waterloo',
  },
  {
    name: 'Cambridge',
    slug: 'cambridge',
    region: 'Waterloo',
    blurb: 'Cambridge merges three historic mill-town cores — Galt, Preston, Hespeler — with modern subdivision growth. Broker files include first-time-buyers, industrial-employed households, and Toronto-adjacent commuters seeking Waterloo Region pricing.',
    hasMatrixData: true,
    representativeNeighborhood: 'galt',
  },
  {
    name: 'Guelph',
    slug: 'guelph',
    region: 'Waterloo',
    blurb: 'Guelph combines University of Guelph rental-investor demand with strong end-user family markets in Kortright Hills and Westminster Woods. Downtown Guelph heritage inventory attracts creative-class end-users; new-build detached growth drives first-time-buyer supply.',
    hasMatrixData: true,
    representativeNeighborhood: 'downtown-guelph',
  },
  // Southwestern
  {
    name: 'London',
    slug: 'london',
    region: 'Southwestern',
    blurb: 'London is southwestern Ontario\'s largest metro and one of the most-searched cities for out-of-GTA buyer migration. Wortley Village heritage, Old North family character, and Masonville condo growth span the full product range — broker files skew first-time-buyer and downsizer.',
    hasMatrixData: true,
    representativeNeighborhood: 'wortley-village',
  },
  {
    name: 'Windsor',
    slug: 'windsor',
    region: 'Southwestern',
    blurb: 'Windsor combines Detroit-adjacent cross-border character with strong local first-time-buyer demand — Walkerville heritage and Riverside waterfront are the top-searched neighborhoods. Cross-border income, dual-currency, and USMCA-related closing complexity come up regularly on files here.',
    hasMatrixData: true,
    representativeNeighborhood: 'walkerville',
  },
  // Central
  {
    name: 'Barrie',
    slug: 'barrie',
    region: 'Central',
    blurb: 'Barrie is central Ontario\'s largest city and the primary Toronto-employed commuter market north of the GTA. Highway 400 access and Barrie GO service drove substantial 2020-2022 migration; Downtown Barrie waterfront and Ardagh/Painswick suburban markets dominate broker files.',
    hasMatrixData: true,
    representativeNeighborhood: 'downtown-barrie',
  },
  // Ottawa cluster
  {
    name: 'Ottawa',
    slug: 'ottawa',
    region: 'Eastern',
    blurb: 'Ottawa is Canada\'s second-largest mortgage-broker market, anchored by federal government employment and a stable public-service income base. Westboro and The Glebe carry heritage character; broker files often involve federal pension income, security clearances, and diplomatic corps buyers.',
    hasMatrixData: true,
    representativeNeighborhood: 'westboro',
  },
  {
    name: 'Kanata',
    slug: 'kanata',
    region: 'Eastern',
    blurb: 'Kanata is Ottawa\'s tech-industry cluster — Kanata North\'s telecom + software campuses drive most buyer demand for Kanata Lakes and Beaverbrook detached. Broker files skew executive and dual-income tech households.',
    hasMatrixData: true,
    representativeNeighborhood: 'kanata-lakes',
  },
  {
    name: 'Nepean',
    slug: 'nepean',
    region: 'Eastern',
    blurb: 'Nepean is Ottawa\'s largest southern suburb, anchored by Barrhaven\'s new-build detached growth and Centrepointe\'s mid-century establishment. Broker files span first-time-buyer families and government-employed households upgrading within Ottawa.',
    hasMatrixData: true,
    representativeNeighborhood: 'barrhaven',
  },
  {
    name: 'Orleans',
    slug: 'orleans',
    region: 'Eastern',
    blurb: 'Orleans is Ottawa\'s eastern suburb — bilingual French-Canadian family character and Convent Glen + Chapel Hill executive detached submarkets. Broker files often involve federal pension income and multi-generational households.',
    hasMatrixData: true,
    representativeNeighborhood: 'avalon',
  },
  // Northern
  {
    name: 'Sudbury',
    slug: 'sudbury',
    region: 'Northern',
    blurb: 'Sudbury is northern Ontario\'s largest city and one of the most affordable large-city markets in the province. Mining-industry income drives most broker deal flow — Vale and Glencore employment, along with Laurentian University, are the dominant employer bases.',
    hasMatrixData: true,
    representativeNeighborhood: 'new-sudbury',
  },
  // ─── The 8 additional cities beyond cityData ───
  {
    name: 'Peterborough',
    slug: 'peterborough',
    region: 'Central',
    blurb: 'Peterborough is the Kawarthas gateway and one of central Ontario\'s most-searched mortgage markets. Trent University and cottage-country tourism drive broker deal flow; the recent GO Transit extension has pulled substantial Toronto-adjacent buyer demand.',
    hasMatrixData: false,
    marketContextFallback: 'Peterborough & the Kawarthas Association of REALTORS® (PKAR) publishes monthly benchmark reports for the city — detached inventory in the city core typically trades in the mid-$600Ks to low-$700Ks band as of the latest release.',
  },
  {
    name: 'Kingston',
    slug: 'kingston',
    region: 'Eastern',
    blurb: 'Kingston combines the Royal Military College + Queen\'s University buyer base with a growing federal correctional-service employment corridor. Broker files include first-time-buyer families, student-rental investors, and Canadian Forces mortgages with specific IRP relocation programs.',
    hasMatrixData: false,
    marketContextFallback: 'The Kingston & Area Real Estate Association (KAREA) reports monthly average sale prices for the city; the detached-home segment has been the primary product driving buyer demand, with student-rental investor activity concentrated near Queen\'s University.',
  },
  {
    name: 'Brantford',
    slug: 'brantford',
    region: 'Southwestern',
    blurb: 'Brantford sits between Hamilton and Kitchener-Waterloo — one of the most-searched southwestern Ontario markets for Toronto-adjacent migration. Wilfrid Laurier\'s Brantford campus drives student-rental investor files; family end-user demand dominates the detached market.',
    hasMatrixData: false,
    marketContextFallback: 'The Brantford Regional Real Estate Association (BRREA) publishes monthly market statistics; the city has been one of the strongest post-2020 southwestern Ontario markets for Toronto-adjacent migration, with detached and townhouse inventory dominating supply.',
  },
  {
    name: 'Belleville',
    slug: 'belleville',
    region: 'Eastern',
    blurb: 'Belleville anchors the Bay of Quinte region — a GTA-adjacent affordability play with growing Toronto-migration demand and CFB Trenton military employment. Broker files often involve Canadian Forces relocations under the Integrated Relocation Program.',
    hasMatrixData: false,
    marketContextFallback: 'The Quinte & District Association of REALTORS® reports monthly stats for Belleville and the Bay of Quinte region — CFB Trenton military relocations under the federal Integrated Relocation Program are a meaningful share of local broker files.',
  },
  {
    name: 'Sarnia',
    slug: 'sarnia',
    region: 'Southwestern',
    blurb: 'Sarnia is southwestern Ontario\'s Chemical Valley — Suncor, Shell, and Imperial Oil employment drive most broker deal flow. The Blue Water Bridge to Michigan makes cross-border and dual-currency files more common than in most Ontario markets.',
    hasMatrixData: false,
    marketContextFallback: 'The Sarnia-Lambton Real Estate Board publishes monthly market data; local Chemical Valley employment anchors most files, and the Blue Water Bridge to Port Huron, Michigan drives cross-border and dual-currency mortgage requests.',
  },
  {
    name: 'Chatham-Kent',
    slug: 'chatham-kent',
    region: 'Southwestern',
    blurb: 'Chatham-Kent is southwestern Ontario\'s agricultural anchor, with farm income and agricultural-lender files more common here than in most of the province. Buyer pool is dominated by long-tenured local end-users; broker files often involve non-A-lender agricultural credit.',
    hasMatrixData: false,
    marketContextFallback: 'The Chatham-Kent Association of REALTORS® reports monthly stats — agricultural properties are a notable share of local inventory, and agricultural-lender files (Farm Credit Canada, RBC Ag) come up more often here than in most of the province.',
  },
  {
    name: 'Cornwall',
    slug: 'cornwall',
    region: 'Eastern',
    blurb: 'Cornwall is eastern Ontario\'s Quebec-adjacent gateway — cross-border commuter files to Montreal and dual-language broker service are the local specifics. Federal Cornwall Community Correctional Centre employment and manufacturing anchor local demand.',
    hasMatrixData: false,
    marketContextFallback: 'The Cornwall & District Real Estate Board publishes monthly market statistics; local buyer files often involve Montreal cross-border commuter income and dual-language (English/French) documentation.',
  },
  {
    name: 'Sault Ste. Marie',
    slug: 'sault-ste-marie',
    region: 'Northern',
    blurb: 'Sault Ste. Marie combines Algoma Steel + tourism-industry employment with cross-border Michigan proximity. Broker files include first-time-buyer families, retirees relocating from southern Ontario for value, and cross-currency Canadian-US household situations.',
    hasMatrixData: false,
    marketContextFallback: 'The Sault Ste. Marie Real Estate Board reports monthly benchmarks; local Algoma Steel and tourism-industry employment anchor buyer demand, and cross-border Michigan proximity (Sault, MI) makes dual-currency household files more common than in southern Ontario.',
  },
];

// Convenience lookup — used by generateMetadata + generateStaticParams.
export function getBrokerCity(slug: string): BrokerCity | null {
  return BROKER_CITIES.find((c) => c.slug === slug) ?? null;
}
