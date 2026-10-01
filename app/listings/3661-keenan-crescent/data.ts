// 3661 Keenan Crescent, Mississauga (Malton) — MLS W13835718
//
// Every figure here is transcribed from the TRREB listing as published on
// REALTOR.ca. Nothing is estimated or inferred. If the listing changes, this
// file is the only place that needs editing.
//
// Listing brokerage: SUTTON GROUP QUANTUM REALTY INC.
// IndiBrick is NOT the listing brokerage. This page exists because Diana Gee
// (listing agent) and Mudit Chhura (mortgage) are hosting the open house
// together, and the attribution block at the bottom of the page says so.

export const LISTING = {
  mls: 'W13835718',
  addressLine: '3661 Keenan Crescent',
  municipality: 'Mississauga (Malton)',
  province: 'Ontario',
  postalCode: 'L4T 3M1',
  crossStreets: 'Steeles Avenue East & Goreway Drive',
  price: 799900,
  beds: 3,
  baths: 2,
  sqftRange: '1,100 – 1,500',
  propertyType: 'Single Family',
  buildingType: 'House',
  style: 'Detached — 3-level backsplit',
  title: 'Freehold',
  lotSize: '37.3 × 120 ft',
  frontage: '37 ft 3 in',
  depth: '120 ft',
  annualTaxes: 5134.95,
  parkingType: 'Garage',
  parkingSpaces: 3,
  basement: 'Finished',
  foundation: 'Poured concrete',
  exterior: 'Brick and vinyl siding',
  heating: 'Forced air (natural gas)',
  cooling: 'Central air conditioning',
  water: 'Municipal',
  sewer: 'Sanitary sewer',
  fencing: 'Fully fenced',
  lat: 43.730616,
  lng: -79.6445156,
} as const;

export const OPEN_HOUSE = {
  // From the listing's own Event structured data: 2026-10-03T14:00 to 16:00.
  dateLabel: 'Saturday, October 3',
  timeLabel: '2:00 – 4:00 PM',
  startIso: '2026-10-03T14:00:00-04:00',
  endIso: '2026-10-03T16:00:00-04:00',
} as const;

// Verbatim from the listing. The trailing TRREB reference number is dropped
// because it is a data-feed artefact, not part of the agent's copy.
export const DESCRIPTION = `Welcome to 3661 Keenan Crescent — offered for sale for the first time in 50 years! Owned by the same family since 1976 and enjoyed by only two occupants, this immaculately maintained 3-level backsplit reflects true pride of ownership. Set on a private ravine lot with no neighbours directly behind, this home offers a peaceful backyard setting in a convenient, centrally located neighbourhood. Move in and enjoy it as-is, or make it your own — a blank canvas offering the opportunity to bring your personal style and vision to a solid home with great bones. Original hardwood flooring is preserved beneath much of the carpeting. The kitchen and bathrooms were renovated in 2015, with updated roof (2022), furnace (2022), air conditioner (2022) and hot water tank (2026). All appliances are owned. Conveniently located close to schools, parks, shopping and transit, with easy access to Malton GO, Pearson Airport and major highways including the 401, 427 and 407.`;

export const HIGHLIGHTS = [
  { label: 'First time offered in 50 years', detail: 'Same family since 1976, only two occupants.' },
  { label: 'Private ravine lot', detail: 'No neighbours directly behind the property.' },
  { label: 'Hardwood under the carpet', detail: 'Original flooring preserved beneath much of it.' },
  { label: 'Kitchen and baths renovated', detail: 'Both updated in 2015.' },
  { label: 'Mechanicals already done', detail: 'Roof, furnace and A/C in 2022. Hot water tank in 2026.' },
  { label: 'Every appliance owned', detail: 'No rental equipment on the property.' },
] as const;

export const ROOMS = [
  {
    level: 'Main level',
    rooms: [
      { name: 'Kitchen', metric: '4.27 m × 3.60 m', imperial: '14\'0" × 11\'9"' },
      { name: 'Living room', metric: '7.94 m × 3.52 m', imperial: '26\'0" × 11\'6"' },
      { name: 'Dining room', metric: '7.94 m × 3.52 m', imperial: '26\'0" × 11\'6"' },
    ],
  },
  {
    level: 'Second level',
    rooms: [
      { name: 'Primary bedroom', metric: '3.88 m × 2.83 m', imperial: '12\'8" × 9\'3"' },
      { name: 'Bedroom 2', metric: '4.17 m × 2.65 m', imperial: '13\'8" × 8\'8"' },
      { name: 'Bedroom 3', metric: '3.20 m × 2.71 m', imperial: '10\'5" × 8\'10"' },
    ],
  },
  {
    level: 'Basement',
    rooms: [
      { name: 'Family room', metric: '6.25 m × 4.39 m', imperial: '20\'6" × 14\'4"' },
      { name: 'Furnace room', metric: '4.52 m × 2.61 m', imperial: '14\'9" × 8\'6"' },
    ],
  },
] as const;

// Captions written from the photographs themselves, in listing order.
export const PHOTOS: { src: string; caption: string }[] = [
  { src: '/keenan/keenan-1.jpg', caption: 'Front elevation from the street' },
  { src: '/keenan/keenan-2.jpg', caption: 'Driveway and attached garage' },
  { src: '/keenan/keenan-3.jpg', caption: 'Interlock front patio and seating area' },
  { src: '/keenan/keenan-4.jpg', caption: 'Front entry looking in' },
  { src: '/keenan/keenan-5.jpg', caption: 'Entry hall toward the front door' },
  { src: '/keenan/keenan-6.jpg', caption: 'Living room' },
  { src: '/keenan/keenan-7.jpg', caption: 'Living room toward the dining archway' },
  { src: '/keenan/keenan-8.jpg', caption: 'Dining room and stairs to the upper level' },
  { src: '/keenan/keenan-9.jpg', caption: 'Combined living and dining, full length' },
  { src: '/keenan/keenan-10.jpg', caption: 'Kitchen with eat-in breakfast area' },
  { src: '/keenan/keenan-11.jpg', caption: 'Kitchen and the side entrance' },
  { src: '/keenan/keenan-12.jpg', caption: 'Kitchen counters and double sink' },
  { src: '/keenan/keenan-13.jpg', caption: 'Kitchen looking through to the hall' },
  { src: '/keenan/keenan-14.jpg', caption: 'Kitchen with full-height cabinetry' },
  { src: '/keenan/keenan-15.jpg', caption: 'Stairs, fitted with a chair lift' },
  { src: '/keenan/keenan-16.jpg', caption: 'Primary bedroom' },
  { src: '/keenan/keenan-17.jpg', caption: 'Primary bedroom, second view' },
  { src: '/keenan/keenan-18.jpg', caption: 'Second bedroom' },
  { src: '/keenan/keenan-19.jpg', caption: 'Third bedroom' },
  { src: '/keenan/keenan-20.jpg', caption: 'Four-piece bathroom with grab bars' },
  { src: '/keenan/keenan-21.jpg', caption: 'Lower-level family room' },
  { src: '/keenan/keenan-22.jpg', caption: 'Family room with built-in shelving' },
  { src: '/keenan/keenan-23.jpg', caption: 'Lower-level three-piece bathroom' },
  { src: '/keenan/keenan-24.jpg', caption: 'Side entrance' },
  { src: '/keenan/keenan-25.jpg', caption: 'Side walkway and garden beds' },
  { src: '/keenan/keenan-26.jpg', caption: 'Rear yard, fully fenced' },
  { src: '/keenan/keenan-27.jpg', caption: 'Rear yard backing onto the treeline' },
  { src: '/keenan/keenan-28.jpg', caption: 'Rear elevation' },
];
