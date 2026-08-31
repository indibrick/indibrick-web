// Marketing landing data for the four featured pre-construction /
// new-build communities under /listings. Each entry drives one
// dedicated SEO+AEO landing page rendered by
// components/marketing/DevelopmentLanding.tsx.
//
// Data is pulled from the builders' OFFICIAL sales pages (linked
// under `sources` on each record). If numbers change we update
// here — never fabricate pricing or square footage.

export interface DevelopmentFaq {
  q: string;
  a: string;
}

export interface DevelopmentBullet {
  title: string;
  body: string;
}

export interface DevelopmentCollection {
  name: string;
  homeType: string;                 // "36' Detached", "Freehold Townhome"
  bedrooms: string;                 // "3-5"
  bathrooms?: string;               // "2-4"
  sqft?: string;                    // "1,820 - 2,800"
  startingPrice?: string;           // "$835,389" — leave blank if TBD
  garage?: string;                  // "2-car"
  storeys?: string;                 // "2"
  note?: string;                    // e.g. "Currently sold out"
}

export interface DevelopmentData {
  slug: string;                     // /listings/<slug>
  name: string;
  tagline: string;
  builderOrDeveloper?: string;
  city: string;
  region: string;
  address?: string;                 // sales-office / community address
  status: 'Registering' | 'Selling' | 'Coming Soon' | 'Move-In Ready';
  estimatedOccupancy?: string;
  priceRange?: string;              // headline "$599,990 - $799,999"

  // Direct-answer opener (AEO) — kept short + fact-dense.
  aeoAnswer: string;

  overview: string[];               // 2-4 paragraphs
  highlights: DevelopmentBullet[];
  location: DevelopmentBullet[];
  collections: DevelopmentCollection[];
  incentives?: string[];            // e.g. "$0 Development Charges"
  faq: DevelopmentFaq[];

  // Unsplash CDN images — swap for builder-supplied when available.
  heroImageUrl: string;
  galleryImages: string[];

  // SEO
  metaTitle: string;
  metaDescription: string;
  keywords: string[];

  // Where the facts came from — rendered on-page as a citations block.
  sources: Array<{ label: string; url: string }>;
}

// Real builder-supplied imagery pulled from each community's official
// sales site. Hotlinked from the builder's own CDN — same images
// they use in their marketing. If a URL changes on the builder side,
// swap it here.
//
// Trade-off note: hotlinking is industry-standard for realtor +
// mortgage broker marketing pages, but two risks apply — (1) the
// builder can rotate URLs and break our images, and (2) some CDNs
// may block hotlink referers under aggressive settings. Fallback
// path: download the images locally to /public and swap the URLs.
const MIRA_IMG = {
  exteriorHero:  'https://miratownsbarrie.ca/wp-content/uploads/2025/07/Exterior3-scaled.jpeg',
  exteriorAlt:   'https://miratownsbarrie.ca/wp-content/uploads/2025/07/Exterior1-scaled.jpeg',
  townhomes:     'https://miratownsbarrie.ca/wp-content/uploads/2025/07/mira-town-homes.webp',
  designRender:  'https://miratownsbarrie.ca/wp-content/uploads/2025/07/B2BTown-Mira-1024x935-1.jpg',
  sitePlan:      'https://miratownsbarrie.ca/wp-content/uploads/2025/07/Mira-Town-Site-Plan.jpg',
  features:      'https://miratownsbarrie.ca/wp-content/uploads/2025/07/Features.jpg',
};

const VICINITY_IMG = {
  amberleeExterior: 'https://prodmh.b-cdn.net//dfsmedia/a2b99d47a71047839a5a4241f44710ce/21155-50420/modern-seatonwhitevale-amberlee-jpg',
  summerSavings:    'https://prodmh.b-cdn.net//dfsmedia/a2b99d47a71047839a5a4241f44710ce/155063-50420/26059-gta-vicinity-summer-savings-event-multiblock-2050x1600',
  familyForest:     'https://prodmh.b-cdn.net//dfsmedia/a2b99d47a71047839a5a4241f44710ce/67701-50420/gtl-vicinitywest-multiblock2',
  amenityCoffee:    'https://prodmh.b-cdn.net//dfsmedia/a2b99d47a71047839a5a4241f44710ce/25325-50420/gtl-vicinity-amenityblock2-2050x1600-jpg',
  sitePlan:         'https://prodmh.b-cdn.net//dfsmedia/a2b99d47a71047839a5a4241f44710ce/131896-50420/mattamy-sp-web-1800x1200-vicinity',
  sitePlanWest:     'https://prodmh.b-cdn.net//dfsmedia/a2b99d47a71047839a5a4241f44710ce/154453-50420/mattamy-sp-web-1800x1200-vicinity-west',
  kitchen:          'https://prodmh.b-cdn.net//dfsmedia/a2b99d47a71047839a5a4241f44710ce/50545-50420/gtl-simcoemarket-features-kitchen',
};

const MIDHURST_IMG = {
  // Brookfield
  hero:            'https://edge.sitecorecloud.io/097dc95ddd47-brookfieldr25d6-prodb938-e22e/media/project/brp/brp/ontario/greater-toronto-area/midhurst/midhurst-valley/community---neighbourhood---subdivision-pages/midhurst_rendering_footer.jpg',
  parkRendering:   'https://edge.sitecorecloud.io/097dc95ddd47-brookfieldr25d6-prodb938-e22e/media/project/brp/brp/ontario/greater-toronto-area/midhurst/midhurst-valley/community---neighbourhood---subdivision-pages/midhurst_rendering_park2.jpg',
  hillFarm:        'https://edge.sitecorecloud.io/097dc95ddd47-brookfieldr25d6-prodb938-e22e/media/project/brp/brp/ontario/greater-toronto-area/midhurst/midhurst-valley/amenity-photos/midhurst-valley-barrie-hill-farm.jpg',
  walkingTrail:    'https://edge.sitecorecloud.io/097dc95ddd47-brookfieldr25d6-prodb938-e22e/media/project/brp/brp/ontario/greater-toronto-area/midhurst/midhurst-valley/amenity-photos/midhurst-valley-walking-trail.jpg',
  countryClub:     'https://edge.sitecorecloud.io/097dc95ddd47-brookfieldr25d6-prodb938-e22e/media/project/brp/brp/ontario/greater-toronto-area/midhurst/midhurst-valley/amenity-photos/midhurst-valley-barrie-country-club-building.jpg',
  golfClub:        'https://edge.sitecorecloud.io/097dc95ddd47-brookfieldr25d6-prodb938-e22e/media/project/brp/brp/ontario/greater-toronto-area/midhurst/midhurst-valley/amenity-photos/midhurst-valley-vespra-hills-golf-club.jpg',
  lot84:           'https://edge.sitecorecloud.io/097dc95ddd47-brookfieldr25d6-prodb938-e22e/media/project/brp/brp/ontario/greater-toronto-area/midhurst/midhurst-valley/inventory-homes/lot-84/lot-84-exterior.png',
  lot150:          'https://edge.sitecorecloud.io/097dc95ddd47-brookfieldr25d6-prodb938-e22e/media/project/brp/brp/ontario/greater-toronto-area/midhurst/midhurst-valley/inventory-homes/lot-150/lot-150-exterior.png',
  // Geranium
  spruceCalypso:   'https://www.geranium.com/midhurst-valley/wp-content/uploads/sites/13/2024/05/spruce-calypso.jpg',
  daffodilSimcoe:  'https://www.geranium.com/midhurst-valley/wp-content/uploads/sites/13/2024/05/48-Daffodil-Simcoe-1334x803.jpg',
  daffodilViolet:  'https://www.geranium.com/midhurst-valley/wp-content/uploads/sites/13/2024/05/36-Daffodil-Violet-1334x803.jpg',
  winterNeighborhood:'https://www.geranium.com/midhurst-valley/wp-content/uploads/sites/13/2021/12/neighbourhood-winter.jpg',
  winterGallery:   'https://www.geranium.com/midhurst-valley/wp-content/uploads/sites/13/2021/12/gallery-winter.jpg',
};

export const DEVELOPMENTS: DevelopmentData[] = [
  // ─── MIRA TOWNS by Dunsire Developments ─────────────────────────────
  {
    slug: 'mira-dunsire',
    name: 'MIRA Towns by Dunsire',
    tagline: 'Freehold townhomes steps from Barrie South GO — Vista, Metro, and Legacy collections',
    builderOrDeveloper: 'Dunsire Developments',
    city: 'Barrie',
    region: 'Innis Shore, South Barrie',
    address: '700 Mapleview Drive East, Barrie, ON L4N 0M2',
    status: 'Coming Soon',
    estimatedOccupancy: '2028',
    priceRange: '$599,990 – $799,999',
    aeoAnswer:
      'MIRA Towns by Dunsire Developments is a new freehold-townhome community at 700 Mapleview Drive East in South Barrie, launching in three collections — Vista, Metro, and Legacy — with 2-to-5-bedroom homes priced from $599,990 to $799,999 and estimated occupancy in 2028. The site is steps from Barrie South GO Station and minutes from Highway 400.',
    overview: [
      'MIRA Towns is a new 800-home master-planned townhome community by Dunsire Developments in South Barrie\'s Innis Shore neighbourhood, released in multiple phases with launch pricing from $599,990.',
      'The site sits at 700 Mapleview Drive East — steps from the Barrie South GO Station (direct service to Toronto Union), minutes from Highway 400, and within walking distance of Park Place shopping, Georgian Mall, and multiple schools including Mapleview Heights ES and Georgian College.',
      'Three home collections span the community: Vista (entry family towns), Metro (contemporary 3-storey towns), and Legacy (larger towns with optional secondary suites — useful for multi-generational living or rental income). Every home is freehold with no condo fees for the first two years.',
      'Registrations are open. Priority buyers on our list receive floor plans, the site plan, and platinum pricing ahead of the public release — the form below secures your spot.',
    ],
    highlights: [
      { title: 'Freehold, no condo fees', body: 'Full land + building ownership. No condo fees for the first two years. Legacy models include optional secondary suites for rental income or in-law setups.' },
      { title: 'Steps to Barrie South GO', body: 'Direct GO Train service to Toronto Union — one of the strongest transit-adjacent commuter positions of any Barrie new-build community.' },
      { title: '$0 Development Charges', body: 'Launch incentive: development charges paid by the builder. Assignments available.' },
      { title: 'Standard finishes upgraded', body: '9-foot main-floor ceilings, quartz countertops, oversized windows, energy-efficient construction, open-concept layouts.' },
    ],
    location: [
      { title: 'Barrie South GO Station', body: 'Steps from the community. Direct service to Toronto Union — the fastest commuter option in Simcoe County.' },
      { title: 'Highway 400', body: 'Minutes to the 400 interchange — south to the GTA, north to cottage country.' },
      { title: 'Retail + services', body: 'Park Place, Georgian Mall, and the College Boulevard corridor within a short drive.' },
      { title: 'Lake Simcoe waterfront', body: 'Barrie Waterfront, Centennial Park, and the Innisfil shoreline all within 10 minutes.' },
      { title: 'Schools + campus', body: 'Mapleview Heights Elementary, multiple secondary options, and Georgian College\'s Barrie campus within the local orbit.' },
    ],
    collections: [
      { name: 'Vista', homeType: 'Freehold Townhome', bedrooms: '2-3', bathrooms: '2.5', storeys: '2', note: 'Entry family townhomes' },
      { name: 'Metro', homeType: 'Freehold Townhome', bedrooms: '3-4', bathrooms: '2.5-3', storeys: '3', note: 'Contemporary 3-storey towns' },
      { name: 'Legacy', homeType: 'Freehold Townhome', bedrooms: '4-5', bathrooms: '3-4', storeys: '3', note: 'Optional secondary suite (in-law / rental income)' },
    ],
    incentives: [
      '$0 Development Charges',
      'Extended Deposit structure',
      'Assignments allowed',
      'No condo fees for the first two years',
    ],
    faq: [
      { q: 'Where is MIRA Towns located?', a: 'MIRA Towns is at 700 Mapleview Drive East, Barrie, ON L4N 0M2 — in the Innis Shore neighbourhood of South Barrie, steps from the Barrie South GO Station and minutes from Highway 400.' },
      { q: 'What are the price ranges?', a: 'Launch pricing spans $599,990 to $799,999 depending on collection (Vista / Metro / Legacy) and floor plan. Priority buyers on our list see phase pricing before public release.' },
      { q: 'When can I move in?', a: 'MIRA Towns is a pre-construction community with estimated occupancy in 2028. Exact closing dates are confirmed at signing based on the lot and phase.' },
      { q: 'What\'s the difference between Vista, Metro, and Legacy?', a: 'Vista is the entry-tier 2-storey townhome collection. Metro is the contemporary 3-storey townhome. Legacy is the largest townhome with an optional secondary suite — great for rental income, multi-generational living, or a mortgage helper.' },
      { q: 'Are the homes freehold or condo?', a: 'MIRA Towns are freehold — you own the land and the building outright. There are no condo fees for the first two years. A small common-elements fee may apply for private community amenities; the disclosure statement documents any specifics.' },
      { q: 'What incentives are being offered?', a: 'At launch: $0 Development Charges paid by the builder, extended deposit terms, and assignments allowed. Incentives are phase-specific — the priority list gets the latest incentive schedule.' },
      { q: 'Can I use a HELOC on my existing home to fund the deposit?', a: 'Yes — deposit financing via a HELOC on your current home is one of the most common paths for pre-construction buyers. Our mortgage team can arrange the deposit financing and secure a long rate hold; the lead form below routes you to a licensed FSRA broker.' },
    ],
    heroImageUrl: MIRA_IMG.exteriorHero,
    galleryImages: [MIRA_IMG.exteriorAlt, MIRA_IMG.townhomes, MIRA_IMG.designRender, MIRA_IMG.features],
    metaTitle: 'MIRA Towns by Dunsire — Freehold Townhomes at 700 Mapleview Dr E, South Barrie',
    metaDescription:
      'MIRA Towns by Dunsire Developments — freehold townhomes at 700 Mapleview Dr E, South Barrie, steps from Barrie South GO. Vista, Metro, and Legacy collections from $599,990. Register for priority pricing.',
    keywords: [
      'MIRA Towns Barrie',
      'MIRA Dunsire Developments',
      'MIRA Towns 700 Mapleview',
      'freehold townhomes South Barrie',
      'Barrie South GO townhomes',
      'Dunsire Developments Barrie',
      'Vista Metro Legacy townhomes Barrie',
      'pre-construction townhomes Innis Shore',
    ],
    sources: [
      { label: 'MIRA Towns official site — miratownsbarrie.ca', url: 'https://miratownsbarrie.ca/' },
      { label: 'Dunsire Developments — miratowns.ca', url: 'https://miratowns.ca/' },
    ],
  },

  // ─── VICINITY by Mattamy Homes ──────────────────────────────────────
  {
    slug: 'vicinity-mattamy',
    name: 'Vicinity by Mattamy Homes',
    tagline: 'Master-planned Mattamy community at 620 Lockhart Rd — detached homes + townhomes in South Barrie',
    builderOrDeveloper: 'Mattamy Homes',
    city: 'Barrie',
    region: 'South Barrie',
    address: '620 Lockhart Rd, Barrie, ON L7S 1G9',
    status: 'Selling',
    priceRange: 'Up to $40,000 in current savings on select homes',
    aeoAnswer:
      'Vicinity by Mattamy Homes is a master-planned community at 620 Lockhart Road in South Barrie featuring detached homes and freehold townhomes from 1,349 to 2,768 square feet, with 3–4 bedrooms, 2–3 storeys, and 40 floor plans across the community. Mattamy is currently offering up to $40,000 in savings on select detached and townhome models. A companion community, Vicinity West, is planned at McKay Road West and Veterans Drive.',
    overview: [
      'Vicinity is Mattamy Homes\' flagship South Barrie community — a master-planned neighborhood at 620 Lockhart Road offering detached homes and freehold townhomes across 40 distinct floor plans. Mattamy is Canada\'s largest privately-owned home builder, in business since 1978.',
      'The community sits close to Tyndale Park, Johnson\'s Beach, and local golf courses, with quick access to Highway 400 and the Barrie South GO Station. Homes are positioned as "modern family living connected to nature" — walking trails, ravines, and Lake Simcoe are all part of the immediate surroundings.',
      'A second community, Vicinity West, is planned at McKay Road West and Veterans Drive, giving buyers two site options within the same Mattamy master-plan footprint.',
      'Mattamy is currently offering up to $40,000 in savings on select detached and townhome models. Register below and we\'ll send you the current inventory, the released price sheet, and quick-move-in availability.',
    ],
    highlights: [
      { title: 'Canada\'s largest private homebuilder', body: 'Mattamy Homes has been building since 1978 with more than 45 years and 100,000+ homes delivered across North America.' },
      { title: '40 floor plans to choose from', body: 'One of the widest floor-plan libraries of any active South Barrie community — 3-bed towns through 4-bed detached with 2-car garages.' },
      { title: 'Up to $40,000 in current savings', body: 'Active launch incentive on select detached and townhome models. Incentive applies to signed contracts during the current release window.' },
      { title: 'Nature-adjacent master plan', body: 'Tyndale Park, walking trails, ravines, and Johnson\'s Beach are all within walking distance. Highway 400 and Barrie South GO both close.' },
    ],
    location: [
      { title: '620 Lockhart Rd, Barrie', body: 'South Barrie address off Yonge Street. Positioned in one of the fastest-growing new-build corridors in Ontario.' },
      { title: 'Barrie South GO', body: 'Direct GO Train service to Toronto Union — the transit backbone for hybrid GTA workers living in South Barrie.' },
      { title: 'Highway 400', body: 'Direct access to the 400 for driving south to Vaughan / North York or north to cottage country.' },
      { title: 'Lake Simcoe + parks', body: 'Johnson\'s Beach, Tyndale Park, and the Innisfil / Barrie waterfront all within a short drive.' },
      { title: 'Vicinity West companion site', body: 'A second Mattamy community at McKay Road West and Veterans Drive expands the footprint.' },
    ],
    collections: [
      { name: 'Freehold Townhome', homeType: 'Townhome', bedrooms: '3-4', bathrooms: '2.5-3.5', sqft: '1,349 - 2,000', storeys: '2-3', garage: '1-car' },
      { name: 'Amberlee (Detached)', homeType: 'Detached', bedrooms: '3', bathrooms: '2.5', sqft: '1,808', storeys: '2', garage: '2-car', note: 'Popular detached model' },
      { name: 'Larger Detached', homeType: 'Detached', bedrooms: '3-4', bathrooms: '2.5-3.5', sqft: 'up to 2,768', storeys: '2-3', garage: '2-car' },
    ],
    incentives: [
      'Up to $40,000 in current savings on select detached homes and townhomes',
      'Quick-move-in inventory available',
    ],
    faq: [
      { q: 'Where is Vicinity by Mattamy Homes located?', a: 'Vicinity is at 620 Lockhart Rd, Barrie, ON L7S 1G9 — in South Barrie off Yonge Street. Vicinity West is a companion Mattamy community at McKay Road West and Veterans Drive.' },
      { q: 'What home types are available?', a: 'Vicinity offers freehold townhomes and detached single-family homes across 40 floor plans. Homes range from 1,349 to 2,768 sq ft with 3-4 bedrooms, 2-3 full bathrooms plus a half bath, 2-3 storeys, and 1-2 car garages.' },
      { q: 'What\'s the current pricing?', a: 'Mattamy releases pricing per phase. Current promotion: up to $40,000 in savings on select detached and townhome models. Register below for the current price sheet and quick-move-in inventory.' },
      { q: 'When are the sales office hours?', a: 'Mon–Thu 12pm–8pm, Sat–Sun 11am–6pm. Closed Fridays. Sales phone: 249-388-3157.' },
      { q: 'Are the homes freehold?', a: 'Yes — Vicinity homes are freehold. You own both the land and the building outright. Any private common elements (parks, trails) with an annual POTL fee are disclosed at signing.' },
      { q: 'How does the commute to Toronto compare?', a: 'Via Highway 400: typically 60-90 minutes to downtown depending on traffic. Via the Barrie South GO Train: ~90 minutes to Toronto Union with predictable, traffic-free timing.' },
      { q: 'What\'s Vicinity West?', a: 'Vicinity West is Mattamy\'s companion South Barrie community at McKay Road West and Veterans Drive. Same builder, adjacent master-plan footprint — expands the floor-plan and price-point options for buyers registered on the Vicinity list.' },
    ],
    heroImageUrl: VICINITY_IMG.amberleeExterior,
    galleryImages: [VICINITY_IMG.familyForest, VICINITY_IMG.amenityCoffee, VICINITY_IMG.kitchen, VICINITY_IMG.sitePlan],
    metaTitle: 'Vicinity by Mattamy Homes — 620 Lockhart Rd, South Barrie New Homes',
    metaDescription:
      'Vicinity by Mattamy Homes at 620 Lockhart Rd, South Barrie. Freehold townhomes + detached homes, 1,349 – 2,768 sq ft, 40 floor plans. Up to $40,000 in current savings. Register for pricing.',
    keywords: [
      'Vicinity Mattamy Homes',
      'Vicinity Barrie',
      'Mattamy Homes Barrie',
      '620 Lockhart Rd',
      'Vicinity West Barrie',
      'South Barrie new homes',
      'Mattamy Vicinity floor plans',
      'Barrie freehold townhomes',
      'Amberlee Mattamy',
    ],
    sources: [
      { label: 'Vicinity Barrie — Mattamy Homes official', url: 'https://mattamyhomes.com/ontario/simcoe/barrie/vicinity' },
    ],
  },

  // ─── South Barrie New Homes hub ─────────────────────────────────────
  {
    slug: 'south-barrie',
    name: 'South Barrie New Homes',
    tagline: 'Active pre-construction + new-build communities in South Barrie — MIRA Towns, Vicinity, and more',
    city: 'South Barrie',
    region: 'Simcoe County',
    status: 'Selling',
    priceRange: 'From $599,990 (townhomes) to $1M+ (detached)',
    aeoAnswer:
      'South Barrie is one of Ontario\'s most active new-build housing markets in 2026. Two anchor communities are MIRA Towns by Dunsire (700 Mapleview Dr E, freehold townhomes from $599,990, occupancy 2028) and Vicinity by Mattamy Homes (620 Lockhart Rd, detached homes and townhomes 1,349–2,768 sq ft with up to $40,000 in current savings). Both sit near the Barrie South GO Station and Highway 400.',
    overview: [
      'South Barrie has become one of Ontario\'s most active pre-construction and new-build corridors. Highway 400 connects it directly to the GTA, the Barrie South GO Station offers a predictable 90-minute train ride to Toronto Union, and Lake Simcoe puts recreation five minutes from every subdivision.',
      'Two of the largest active communities are MIRA Towns by Dunsire Developments (700 Mapleview Drive East, 800 freehold townhomes launching from $599,990 with 2028 occupancy) and Vicinity by Mattamy Homes (620 Lockhart Road, detached + townhomes with up to $40,000 in current savings). Both are within the Innis-Shore / Mapleview / Lockhart corridor.',
      'We track every active South Barrie community. Register below and we\'ll send you a shortlist matched to your budget, home type, and timeline — including MIRA, Vicinity, Vicinity West, and any other current release.',
    ],
    highlights: [
      { title: 'Barrie South GO Train', body: 'Direct service to Toronto Union — 90 minutes, no traffic risk. The backbone for hybrid GTA commuters buying in Simcoe County.' },
      { title: 'Multiple active builders', body: 'Mattamy, Dunsire, and several other Ontario builders have concurrent releases in the corridor.' },
      { title: 'Highway 400', body: 'Direct 400 access south to the GTA + north to cottage country.' },
      { title: 'Lake Simcoe recreation', body: 'Johnson\'s Beach, Innisfil waterfront, and Friday Harbour resort all within 5–15 minutes.' },
      { title: 'Family infrastructure', body: 'Public + Catholic school boards, RVH hospital, Georgian College, and Park Place / Georgian Mall retail all within the city.' },
    ],
    location: [
      { title: 'Barrie South GO Station', body: 'Direct 90-minute GO Train ride to Toronto Union. MIRA Towns sits steps from the station; Vicinity is a short drive.' },
      { title: 'Highway 400 corridor', body: 'One interchange connects to the entire 400-series network — south to the GTA, north to Muskoka.' },
      { title: 'Innisfil + Lake Simcoe', body: 'Barrie Waterfront, Innisfil Beach Park, Friday Harbour, and Big Bay Point shoreline all reachable in under 20 minutes.' },
      { title: 'Barrie regional hub', body: 'Park Place, Georgian Mall, RVH hospital, and downtown Barrie all within 10 minutes.' },
    ],
    collections: [
      { name: 'MIRA Towns by Dunsire', homeType: 'Freehold Townhome', bedrooms: '2-5', sqft: 'Vista/Metro/Legacy collections', startingPrice: '$599,990', note: '800 units, 700 Mapleview Dr E, occupancy 2028' },
      { name: 'Vicinity by Mattamy Homes', homeType: 'Detached + Townhome', bedrooms: '3-4', sqft: '1,349 - 2,768', note: '40 floor plans, 620 Lockhart Rd, up to $40k current savings' },
      { name: 'Vicinity West by Mattamy', homeType: 'Detached + Townhome', bedrooms: '3-4', sqft: '—', note: 'Companion Mattamy community at McKay Rd W + Veterans Dr' },
    ],
    faq: [
      { q: 'What are the biggest new-build communities in South Barrie right now?', a: 'The two largest active communities are MIRA Towns by Dunsire Developments (700 Mapleview Drive East, freehold townhomes from $599,990) and Vicinity by Mattamy Homes (620 Lockhart Road, detached homes and townhomes with up to $40,000 in current savings). Vicinity West at McKay Road West and Veterans Drive is a companion Mattamy site.' },
      { q: 'What are the price ranges for new homes in South Barrie?', a: 'Freehold townhomes typically start in the high $500s (MIRA Towns launches from $599,990). Detached homes at Vicinity range up to 2,768 sq ft — pricing varies by phase and model. Both communities offer active incentives; register for the current sheet.' },
      { q: 'How do I commute to Toronto from South Barrie?', a: 'The Barrie South GO Train (direct service to Toronto Union) is the most predictable option — approximately 90 minutes with no traffic risk. Highway 400 offers the fastest drive at 60-90 minutes into downtown, depending on time of day.' },
      { q: 'Which builders are most active in South Barrie?', a: 'Mattamy Homes (Vicinity + Vicinity West) and Dunsire Developments (MIRA Towns) are two of the most active in 2026. Both are established Ontario builders with Tarion warranty coverage.' },
      { q: 'What\'s the difference between platinum, VIP, and public pricing?', a: 'Builders release pre-construction units in tiers. Platinum access goes to top brokerages first, VIP registrants second (buyers on a priority list), and the general public last. Being on a priority list often saves 5-10% versus public pricing on the same unit — that\'s the value of registering below.' },
    ],
    heroImageUrl: MIRA_IMG.exteriorHero,
    galleryImages: [VICINITY_IMG.amberleeExterior, VICINITY_IMG.familyForest, MIRA_IMG.townhomes, VICINITY_IMG.kitchen],
    metaTitle: 'South Barrie New Homes 2026 — MIRA Towns, Vicinity + Every Active Community',
    metaDescription:
      'Every active new-build community in South Barrie: MIRA Towns by Dunsire (from $599,990), Vicinity by Mattamy Homes (up to $40k savings), Vicinity West, and more. Register for a matched shortlist.',
    keywords: [
      'South Barrie new homes',
      'South Barrie pre-construction',
      'new homes Barrie 2026',
      'MIRA Towns Barrie',
      'Vicinity Mattamy Barrie',
      'Barrie South GO homes',
      'Innis Shore Barrie',
      'Mapleview Drive East new homes',
    ],
    sources: [
      { label: 'MIRA Towns — miratownsbarrie.ca', url: 'https://miratownsbarrie.ca/' },
      { label: 'Vicinity — Mattamy Homes', url: 'https://mattamyhomes.com/ontario/simcoe/barrie/vicinity' },
    ],
  },

  // ─── Midhurst Valley ────────────────────────────────────────────────
  {
    slug: 'midhurst-valley',
    name: 'Midhurst Valley',
    tagline: 'Master-planned community in Springwater — Brookfield, Geranium, and partner builders',
    builderOrDeveloper: 'Brookfield Residential + Geranium Homes',
    city: 'Midhurst (Springwater Township)',
    region: 'Simcoe County — north of Barrie',
    address: '1296 Carson Rd, Barrie, ON L4M 4S5 (Geranium sales) · Periwinkle / Sweet Cicely / Sassafras streets',
    status: 'Selling',
    estimatedOccupancy: '2027 (Evergreen Collection)',
    priceRange: '$649,549 – $1,044,990 (across collections + quick move-in inventory)',
    aeoAnswer:
      'Midhurst Valley is a master-planned community in Midhurst (Springwater Township), just north of Barrie, built by a consortium of Brookfield Residential, Geranium Homes, CountryWide, and Sundance. It offers 25\' semi-detached homes from $649,549, 36\' detached homes from $835,389, and Geranium\'s new Evergreen Collection from the high $600s with anticipated 2027 closings. 44\' detached homes are currently sold out.',
    overview: [
      'Midhurst Valley is one of Simcoe County\'s highest-profile master-planned communities, located in the village of Midhurst in Springwater Township — immediately north of the City of Barrie. It\'s roughly 45 minutes north of Toronto via Highway 400 and 5 minutes north of RVH hospital.',
      'Four builders anchor the community: Brookfield Residential leads with 25\' semi-detached and 36\' + 44\' detached collections, and Geranium Homes has launched the Evergreen Collection (a limited release from the high $600s with 2027 closings). CountryWide Homes and Sundance Homes round out the builder consortium.',
      'The neighborhood is planned around parks, a comprehensive trail system, and serene ponds — two parks are already completed. Springwater Provincial Park, Lake Simcoe, and Snow / Horseshoe Valley are all within the immediate driving orbit.',
      'Both Brookfield and Geranium have quick-move-in homes available now (30-60 day closings) alongside their new-release pre-construction inventory.',
    ],
    highlights: [
      { title: 'Four-builder master plan', body: 'Brookfield Residential, Geranium Homes, CountryWide, and Sundance Homes — one of the deepest builder benches of any Simcoe County community.' },
      { title: 'Estate-lot feel', body: '25\', 36\', and 44\' frontages on wider lots than typical South-Barrie tract subdivisions. Estate character with modern master-plan amenities.' },
      { title: 'Parks + trails already built', body: 'Two completed parks and a comprehensive trail system — infrastructure ahead of the last phase releases.' },
      { title: 'Springwater location', body: 'Midhurst has been a Simcoe County prestige address for decades; the natural setting and rolling terrain differentiate it from flat subdivision layouts.' },
    ],
    location: [
      { title: 'North of Barrie', body: '5-10 minutes to downtown Barrie, RVH Hospital, and the Allandale + Barrie South GO Stations.' },
      { title: 'Highway 400 + 27', body: 'Direct 400 and 27 access — south to the GTA, north to cottage country and Muskoka.' },
      { title: 'GO Train option', body: 'Barrie South and Allandale GO stations both reachable — direct service to Toronto Union.' },
      { title: 'Springwater Provincial Park', body: 'Provincial park + Springwater rolling landscape immediately surround the community.' },
      { title: 'Lake Simcoe', body: 'Ontario\'s cottage-country gateway lake is a short drive south — Innisfil and Barrie waterfronts within 15-20 minutes.' },
    ],
    collections: [
      { name: '25\' Semi-Detached (Brookfield)', homeType: 'Semi-Detached', bedrooms: '3', bathrooms: '3-4', sqft: '1,340 - 2,020', startingPrice: '$649,549', storeys: '2', garage: '1-car' },
      { name: '36\' Detached (Brookfield)', homeType: 'Detached', bedrooms: '3-5', bathrooms: '2-4', sqft: '1,820 - 2,800', startingPrice: '$835,389', storeys: '2', garage: '2-car' },
      { name: '44\' Detached (Brookfield)', homeType: 'Detached', bedrooms: '3', bathrooms: '3-4', sqft: '2,190 - 3,350', storeys: '2', garage: '2+ car', note: 'Currently sold out — register for waitlist' },
      { name: 'Evergreen Collection (Geranium)', homeType: 'Semi-Detached + Detached', bedrooms: '3-5', sqft: 'from high $600s', startingPrice: 'from high $600s', note: 'New limited release; 2027 closings' },
    ],
    faq: [
      { q: 'Where is Midhurst Valley located?', a: 'Midhurst Valley is in Midhurst (Minesing), Ontario, in Springwater Township — immediately north of the City of Barrie. Approximate street network includes Periwinkle Road, Sweet Cicely Street, Sassafras Road, and Carson Road (1296 Carson Rd is the Geranium sales office).' },
      { q: 'Who are the builders?', a: 'Midhurst Valley is a multi-builder master-planned community. Brookfield Residential leads with the 25\' semi-detached and 36\' + 44\' detached collections; Geranium Homes has launched the new Evergreen Collection; CountryWide Homes and Sundance Homes are also part of the consortium.' },
      { q: 'What are the current prices?', a: 'Brookfield: 25\' semis from $649,549, 36\' detached from $835,389, 44\' detached currently sold out. Geranium\'s new Evergreen Collection starts from the high $600s. Quick-move-in homes range up to about $1,044,990 depending on lot and finishes.' },
      { q: 'When are homes ready to move in?', a: 'Geranium\'s Evergreen Collection has anticipated 2027 closings. Both Brookfield and Geranium have quick-move-in homes available now with 30-60 day closings.' },
      { q: 'Are the homes freehold?', a: 'Yes — Midhurst Valley homes are freehold. You own both the land and the building. Any private common elements (parks, trails) with a small POTL fee are disclosed at signing.' },
      { q: 'How\'s the commute to Toronto?', a: 'Midhurst is approximately 45 minutes north of Toronto via Highway 400 (traffic dependent). The Barrie South and Allandale GO stations are both a short drive south, offering direct GO Train service to Toronto Union in about 90 minutes.' },
      { q: 'Is Midhurst Valley a good long-term investment?', a: 'Midhurst has been a Simcoe County prestige address for decades. Homes on estate-lot frontages have historically held value better than tract subdivisions. That said, real-estate returns depend on macro conditions and no builder or broker can guarantee appreciation.' },
    ],
    heroImageUrl: MIDHURST_IMG.hero,
    galleryImages: [MIDHURST_IMG.parkRendering, MIDHURST_IMG.spruceCalypso, MIDHURST_IMG.walkingTrail, MIDHURST_IMG.hillFarm, MIDHURST_IMG.lot84, MIDHURST_IMG.winterNeighborhood],
    metaTitle: 'Midhurst Valley — New Homes in Springwater by Brookfield + Geranium',
    metaDescription:
      'Midhurst Valley — master-planned community in Springwater (north of Barrie). 25\' semis from $649,549, 36\' detached from $835,389, and Geranium\'s Evergreen Collection from the high $600s. Register for pricing + plans.',
    keywords: [
      'Midhurst Valley',
      'Midhurst Valley Springwater',
      'Brookfield Residential Midhurst',
      'Geranium Homes Midhurst',
      'Midhurst Valley Evergreen Collection',
      'new homes north of Barrie',
      'Springwater new construction',
      'Midhurst pre-construction 2027',
      '1296 Carson Rd Barrie',
    ],
    sources: [
      { label: 'Brookfield Residential — Midhurst Valley', url: 'https://www.brookfieldresidential.com/new-homes/ontario/greater-toronto-area/midhurst/midhurst-valley' },
      { label: 'Geranium Homes — Midhurst Valley', url: 'https://www.geranium.com/midhurst-valley/' },
    ],
  },
];

export function getDevelopmentBySlug(slug: string): DevelopmentData | null {
  return DEVELOPMENTS.find(d => d.slug === slug) || null;
}
