import React from 'react';
import Link from 'next/link';
import {
  MapPin, Bed, Bath, Ruler, Car, CalendarDays, Clock,
  TreePine, Home, Flame, Wind, Droplets, Shield, Phone, Trees,
  Plane, Train, Landmark, School, ShoppingBag, Calculator,
} from 'lucide-react';
import LeadForm from '../../../components/LeadForm';
import JsonLd from '../../../components/JsonLd';
import PhotoGallery from '../../../components/listing/PhotoGallery';
import MortgageQualifierCalc from '../../../components/calc/MortgageQualifierCalc';
import { buildMetadata } from '../../../lib/buildMetadata';
import { LISTING, OPEN_HOUSE, DESCRIPTION, HIGHLIGHTS, ROOMS, PHOTOS } from './data';

const BROKERAGE = 'Sutton Group Quantum Realty Inc., Brokerage';
const FULL_ADDRESS = `${LISTING.addressLine}, ${LISTING.municipality}, ${LISTING.province} ${LISTING.postalCode}`;

const cad = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

export const metadata = buildMetadata({
  title: '3661 Keenan Crescent, Mississauga (Malton) — Open House October 3',
  description:
    'Three-bedroom detached backsplit on a ravine lot in Malton, offered for the first time in 50 years. $799,900. Open house Friday October 3, 2 to 4 PM. Photos, room sizes and a mortgage qualifier.',
  slug: '/listings/3661-keenan-crescent',
  image: PHOTOS[0].src,
  keywords: [
    'Malton homes for sale', '3661 Keenan Crescent', 'Mississauga backsplit',
    'Malton open house', 'ravine lot Mississauga', 'W13835718',
  ],
});

export default function KeenanCrescentPage() {
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: FULL_ADDRESS,
    description: DESCRIPTION,
    image: PHOTOS.slice(0, 6).map((p) => `https://indibrick.ca${p.src}`),
    sku: LISTING.mls,
    category: 'Single Family > House',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CAD',
      price: String(LISTING.price),
      availability: 'https://schema.org/InStock',
      url: 'https://indibrick.ca/listings/3661-keenan-crescent',
    },
  };

  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `Open House — ${LISTING.addressLine}`,
    description: `Open house at ${FULL_ADDRESS}. Hosted by Diana Gee of ${BROKERAGE} with mortgage financing questions answered on site by IndiBrick.`,
    startDate: OPEN_HOUSE.startIso,
    endDate: OPEN_HOUSE.endIso,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    image: `https://indibrick.ca${PHOTOS[0].src}`,
    url: 'https://indibrick.ca/listings/3661-keenan-crescent',
    location: {
      '@type': 'Place',
      name: LISTING.addressLine,
      address: {
        '@type': 'PostalAddress',
        streetAddress: LISTING.addressLine,
        addressLocality: 'Mississauga',
        addressRegion: 'ON',
        postalCode: LISTING.postalCode,
        addressCountry: 'CA',
      },
      geo: { '@type': 'GeoCoordinates', latitude: LISTING.lat, longitude: LISTING.lng },
    },
    organizer: { '@type': 'Organization', name: BROKERAGE },
  };

  return (
    <div className="bg-white">
      <JsonLd data={productSchema} />
      <JsonLd data={eventSchema} />

      {/* ── Open house bar ─────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white pt-28 pb-5">
        <div className="container mx-auto px-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="inline-flex items-center gap-2 bg-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            <CalendarDays size={12} /> Open House
          </span>
          <span className="font-bold">{OPEN_HOUSE.dateLabel}</span>
          <span className="inline-flex items-center gap-2 text-gray-300">
            <Clock size={15} className="text-blue-400" /> {OPEN_HOUSE.timeLabel}
          </span>
          <span className="text-gray-400 text-sm">Come by, or book a private viewing below.</span>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white pb-14">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-10 items-end">
            <div className="lg:col-span-3">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 mb-5">
                <MapPin size={12} /> Malton · Mississauga
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-4">
                {LISTING.addressLine}
              </h1>
              <p className="text-gray-400 text-lg mb-7">
                {LISTING.municipality}, {LISTING.province} {LISTING.postalCode} · {LISTING.crossStreets}
              </p>
              <div className="flex flex-wrap items-baseline gap-5">
                <span className="text-4xl md:text-5xl font-black text-white tabular-nums">{cad(LISTING.price)}</span>
                <span className="text-sm text-gray-400 uppercase tracking-widest font-bold">
                  MLS&reg; {LISTING.mls}
                </span>
              </div>
            </div>
            <div className="lg:col-span-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PHOTOS[0].src}
                alt={`Front elevation of ${LISTING.addressLine}`}
                width={1600}
                height={1064}
                className="w-full rounded-xl shadow-2xl object-cover aspect-[3/2]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stat strip ─────────────────────────────────────────────── */}
      <section className="bg-slate-800 text-white border-t border-slate-700">
        <div className="container mx-auto px-6">
          <dl className="grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-700/70">
            {[
              { icon: Bed, label: 'Bedrooms', value: String(LISTING.beds) },
              { icon: Bath, label: 'Bathrooms', value: String(LISTING.baths) },
              { icon: Ruler, label: 'Square feet', value: LISTING.sqftRange },
              { icon: Car, label: 'Parking', value: `${LISTING.parkingSpaces} spaces` },
              { icon: TreePine, label: 'Lot', value: LISTING.lotSize },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="px-4 py-7 text-center">
                <Icon size={20} className="mx-auto text-blue-400 mb-3" />
                <dt className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-bold mb-1.5">{label}</dt>
                <dd className="font-black text-base tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Description + highlights ───────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6 grid lg:grid-cols-3 gap-14">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-7">About this home</h2>
            <p className="text-lg text-gray-700 leading-relaxed">{DESCRIPTION}</p>

            <div className="mt-10 border-l-4 border-blue-600 pl-6 py-1">
              <p className="text-sm text-gray-600 leading-relaxed">
                A backsplit puts the living space on three staggered levels rather than stacking it.
                Here that means the kitchen, living and dining run across the main floor, three bedrooms
                sit half a flight up, and the family room is down below with windows above grade.
              </p>
            </div>
          </div>

          <aside>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Worth knowing</h3>
            <ul className="space-y-6">
              {HIGHLIGHTS.map((h) => (
                <li key={h.label}>
                  <p className="font-bold text-slate-900 text-sm leading-snug">{h.label}</p>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{h.detail}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* ── Gallery ────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">
            Every room
          </h2>
          <p className="text-gray-500 mb-10">{PHOTOS.length} photographs. Tap any one to enlarge.</p>
          <PhotoGallery photos={PHOTOS} subject={LISTING.addressLine} />
        </div>
      </section>

      {/* ── Room dimensions ────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-10">Room sizes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {ROOMS.map((group) => (
              <div key={group.level} className="border-t-2 border-slate-900 pt-5">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-5">
                  {group.level}
                </h3>
                <dl className="space-y-4">
                  {group.rooms.map((room) => (
                    <div key={room.name} className="flex justify-between gap-4 items-baseline">
                      <dt className="text-sm text-gray-700">{room.name}</dt>
                      <dd className="text-sm font-bold text-slate-900 tabular-nums text-right shrink-0">
                        {room.imperial}
                        <span className="block text-[11px] font-medium text-gray-400">{room.metric}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Property details ───────────────────────────────────────── */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-black uppercase tracking-tight mb-12">Property details</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
            {[
              { icon: Home, title: 'Structure', rows: [['Style', LISTING.style], ['Title', LISTING.title], ['Exterior', LISTING.exterior], ['Foundation', LISTING.foundation], ['Basement', LISTING.basement]] },
              { icon: Flame, title: 'Mechanical', rows: [['Heating', LISTING.heating], ['Cooling', LISTING.cooling], ['Water', LISTING.water], ['Sewer', LISTING.sewer], ['Rentals', 'None — all owned']] },
              { icon: Trees, title: 'Lot', rows: [['Frontage', LISTING.frontage], ['Depth', LISTING.depth], ['Fencing', LISTING.fencing], ['Features', 'Ravine, landscaped'], ['Parking', `${LISTING.parkingType}, ${LISTING.parkingSpaces} spaces`]] },
              { icon: Shield, title: 'Costs & safety', rows: [['Annual taxes', cad(LISTING.annualTaxes)], ['Property type', LISTING.propertyType], ['Building type', LISTING.buildingType], ['Fire protection', 'Alarm, smoke detectors'], ['MLS®', LISTING.mls]] },
            ].map(({ icon: Icon, title, rows }) => (
              <div key={title}>
                <div className="flex items-center gap-2.5 mb-6">
                  <Icon size={17} className="text-blue-400" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">{title}</h3>
                </div>
                <dl className="space-y-3.5">
                  {rows.map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{k}</dt>
                      <dd className="text-sm text-gray-200">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-slate-700">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2.5">
              <Droplets size={15} className="text-blue-400" /> Appliances included
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed max-w-3xl">
              Refrigerator, dishwasher, freezer, microwave, washer, dryer, water heater, water meter and
              window coverings. All owned outright, with no rental contracts attached to the property.
            </p>
          </div>
        </div>
      </section>

      {/* ── Neighbourhood ──────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-3">
            Living in Malton
          </h2>
          <p className="text-gray-500 mb-12 max-w-2xl">
            Malton sits in Mississauga&apos;s northeast corner, bounded by Pearson to the south and the
            Brampton line to the north. It is one of the best-connected pockets in Peel Region.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Train, title: 'Malton GO', body: 'Kitchener line service into Union Station, with the station a short drive from the house.' },
              { icon: Plane, title: 'Pearson Airport', body: 'Canada’s largest employment node sits immediately south, a significant local employer.' },
              { icon: Landmark, title: 'Highways 401, 427, 407', body: 'All three are reachable within minutes, which is unusual even by GTA standards.' },
              { icon: ShoppingBag, title: 'Westwood Square', body: 'Everyday shopping, groceries and services concentrated at Goreway and Morning Star.' },
              { icon: School, title: 'Schools', body: 'Elementary and secondary options in the surrounding blocks, both public and Catholic.' },
              { icon: Trees, title: 'Parks', body: 'Paul Coffey Park and the Etobicoke Creek trail system are both close by.' },
              { icon: Shield, title: 'Hospital', body: 'Etobicoke General is the nearest hospital, just east across the city boundary.' },
              { icon: MapPin, title: 'Cross streets', body: LISTING.crossStreets + '. The lot backs onto a treed ravine edge.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="border-t-2 border-gray-100 pt-5">
                <Icon size={19} className="text-blue-600 mb-4" />
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mortgage qualifier ─────────────────────────────────────── */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-10">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 mb-5">
              <Calculator size={12} /> Before you offer
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">
              Do the ratios pass on this house?
            </h2>
            <p className="text-gray-600 leading-relaxed">
              This runs the same two tests a lender runs: how much of your income the housing costs
              consume, and how much your total debt consumes. The property taxes on this home are
              {' '}{cad(LISTING.annualTaxes)} a year, which is roughly{' '}
              {cad(Math.round(LISTING.annualTaxes / 12))} a month to enter below.
            </p>
          </div>
          <MortgageQualifierCalc />
        </div>
      </section>

      {/* ── The team ───────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-3">
            Who you&apos;ll meet
          </h2>
          <p className="text-gray-500 mb-12 max-w-2xl">
            Two sides of the same transaction, in the same room on open house day. One represents the
            seller. The other arranges the financing.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Diana — listing side */}
            <div className="border border-gray-200 rounded-xl p-8">
              <div className="flex items-start gap-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team/diana-gee.jpg"
                  alt="Diana Gee, Broker"
                  width={300}
                  height={400}
                  className="w-24 h-32 object-cover rounded-lg shrink-0 bg-gray-100"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">
                    Listing agent
                  </p>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Diana Gee</h3>
                  <p className="text-sm text-gray-600 mt-1">Broker, {BROKERAGE}</p>
                  <a
                    href="tel:+19058225000"
                    className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-slate-900 hover:text-blue-600 transition"
                  >
                    <Phone size={14} /> 905-822-5000
                  </a>
                </div>
              </div>
              <dl className="mt-7 pt-6 border-t border-gray-100 grid grid-cols-2 gap-5">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Designations</dt>
                  <dd className="text-sm text-gray-700">Certified Negotiation Expert<br />Accredited Senior Agent</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Languages</dt>
                  <dd className="text-sm text-gray-700">English<br />Cantonese</dd>
                </div>
              </dl>
              <p className="mt-6 text-xs text-gray-500 leading-relaxed">
                Co-listed with Emilio Alberto Espinosa, Broker, {BROKERAGE}.
              </p>
            </div>

            {/* Mudit — mortgage side */}
            <div className="border border-gray-200 rounded-xl p-8">
              <div className="flex items-start gap-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mudit-in.jpg"
                  alt="Mudit Chhura, Mortgage Agent"
                  width={800}
                  height={800}
                  className="w-24 h-32 object-cover rounded-lg shrink-0 bg-gray-100"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">
                    Mortgage financing
                  </p>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Mudit Chhura</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Mortgage Agent Level 2 (M25003057), IndiBrick · Pineapple Financial (Lic. 12830)
                  </p>
                  <a
                    href="tel:+14372416392"
                    className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-slate-900 hover:text-blue-600 transition"
                  >
                    <Phone size={14} /> 437-241-6392
                  </a>
                </div>
              </div>
              <div className="mt-7 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed">
                  On site to answer what the house actually costs to carry, what you would qualify for,
                  and what a lender will want to see before you write. Access to 50+ lenders, including
                  options for self-employed and new-to-Canada buyers.
                </p>
              </div>
              <p className="mt-6 text-xs text-gray-500 leading-relaxed">
                IndiBrick is not the listing brokerage and does not represent the seller.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Lead form ──────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-5">
                Can&apos;t make Friday?
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Book a private viewing, ask for the full feature sheet, or get a straight answer on
                financing before the open house. Whichever you need, this form reaches both of us.
              </p>
              <ul className="space-y-4 text-sm text-gray-300">
                <li className="flex gap-3">
                  <CalendarDays size={17} className="text-blue-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Open house:</strong> {OPEN_HOUSE.dateLabel}, {OPEN_HOUSE.timeLabel}</span>
                </li>
                <li className="flex gap-3">
                  <MapPin size={17} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>{FULL_ADDRESS}</span>
                </li>
                <li className="flex gap-3">
                  <Wind size={17} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>Showings outside open house hours are arranged through the listing brokerage.</span>
                </li>
              </ul>
            </div>
            <div>
              <LeadForm
                type="Realtor"
                title="3661 Keenan Crescent"
                subtitle="Private viewing, feature sheet, or a financing answer. Tell us which."
                ctaText="Send Request"
                sourcePage="keenan-crescent-open-house"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Compliance / attribution ───────────────────────────────── */}
      <section className="py-14 bg-gray-100 border-t border-gray-200">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 mb-5">
            Listing information and attribution
          </h2>
          <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
            <p>
              <strong className="text-slate-900">
                This property is listed by {BROKERAGE}
              </strong>{' '}
              under MLS&reg; number {LISTING.mls}. Diana Gee, Broker, is the listing representative,
              co-listed with Emilio Alberto Espinosa, Broker. IndiBrick and Pineapple Financial Inc.
              are not the listing brokerage, do not represent the seller, and make no representation
              as to the accuracy of the listing particulars.
            </p>
            <p>
              Listing data and photographs are sourced from the Toronto Regional Real Estate Board
              and are reproduced here with the listing brokerage&apos;s permission for the purpose of
              promoting the open house. Measurements and room sizes are as supplied by the listing
              brokerage and should be independently verified. Price and availability are subject to
              change without notice. All photographs are unaltered.
            </p>
            <p>
              Mortgage services are provided by Mudit Chhura, Mortgage Agent Level 2 (M25003057),
              through Pineapple Financial Inc., Brokerage Licence 12830. Any figures produced by the
              qualifier on this page are estimates for discussion only. They are not an approval, a
              commitment to lend, or a rate guarantee. Qualification is subject to a full application,
              lender underwriting, and credit review.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-x-8 gap-y-3 text-xs">
            <Link href="/listings" className="font-bold text-slate-900 hover:text-blue-600 transition">
              All listings
            </Link>
            <Link href="/tools/mortgage-qualifier" className="font-bold text-slate-900 hover:text-blue-600 transition">
              Mortgage qualifier
            </Link>
            <Link href="/rates" className="font-bold text-slate-900 hover:text-blue-600 transition">
              Today&apos;s rates
            </Link>
            <Link href="/contact" className="font-bold text-slate-900 hover:text-blue-600 transition">
              Contact
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
