import { Property, MarketStat, Service, Testimonial, Lead, Partner, MortgageRate, NewsArticle } from './types';

export const PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Modern Detached Home',
    price: 1250000,
    address: '123 Maple Drive',
    city: 'Brampton',
    bedrooms: 4,
    bathrooms: 3,
    type: 'Detached',
    purpose: 'Sale',
    imageUrl: 'https://picsum.photos/seed/home1/800/600',
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Luxury Condo Suite',
    price: 650000,
    address: '45 Bay Street',
    city: 'Toronto',
    bedrooms: 2,
    bathrooms: 2,
    type: 'Condo',
    purpose: 'Sale',
    imageUrl: 'https://picsum.photos/seed/home2/800/600',
    isFeatured: true,
  },
  {
    id: '3',
    title: 'Pre-Con Townhouse',
    price: 950000,
    address: '88 Future Way',
    city: 'Mississauga',
    bedrooms: 3,
    bathrooms: 3,
    type: 'Townhouse',
    purpose: 'Pre-Construction',
    imageUrl: 'https://picsum.photos/seed/home3/800/600',
    isFeatured: true,
  },
  {
    id: '4',
    title: 'Investment Semi',
    price: 899000,
    address: '22 Investor Lane',
    city: 'Vaughan',
    bedrooms: 3,
    bathrooms: 2,
    type: 'Semi-Detached',
    purpose: 'Sale',
    imageUrl: 'https://picsum.photos/seed/home4/800/600',
    isFeatured: false,
  },
  {
    id: '5',
    title: 'Downtown Rental',
    price: 2800,
    address: '101 King St W',
    city: 'Toronto',
    bedrooms: 1,
    bathrooms: 1,
    type: 'Condo',
    purpose: 'Rent',
    imageUrl: 'https://picsum.photos/seed/home5/800/600',
    isFeatured: false,
  },
];

export const MARKET_STATS: MarketStat[] = [
  { month: 'Jan', avgPrice: 980000, avgRent: 2400 },
  { month: 'Feb', avgPrice: 995000, avgRent: 2450 },
  { month: 'Mar', avgPrice: 1020000, avgRent: 2500 },
  { month: 'Apr', avgPrice: 1050000, avgRent: 2550 },
  { month: 'May', avgPrice: 1040000, avgRent: 2600 },
  { month: 'Jun', avgPrice: 1080000, avgRent: 2650 },
];

export const SERVICES: Service[] = [
  {
    id: 'mortgage',
    title: 'Mortgage Financing',
    description: 'Get pre-approved, refinance, or renew with Mudit Chhura, Mortgage Agent Level 1.',
    iconName: 'BadgeDollarSign',
    link: '/services',
  },
  {
    id: 'commercial',
    title: 'Commercial Lending',
    description: 'Capital solutions for multi-family, industrial, retail, and land development projects.',
    iconName: 'Building',
    link: '/commercial-lending',
  },
  {
    id: 'renovation',
    title: 'Renovation Financing',
    description: 'Purchase Plus Improvements and trusted contractor quotes.',
    iconName: 'HardHat',
    link: '/renovation-financing',
  },
  {
    id: 'realtor',
    title: 'Partner Realtor Network',
    description: 'Connect with our trusted Real Estate partners for buying or selling.',
    iconName: 'Users',
    link: '/services',
  },
  {
    id: 'precon',
    title: 'Pre-Construction Access',
    description: 'Exclusive access to pricing and floor plans via our partner network.',
    iconName: 'Building2',
    link: '/pre-construction',
  },
  {
    id: 'legal',
    title: 'Legal Professionals',
    description: 'Referrals to trusted Real Estate Lawyers to close your transaction securely.',
    iconName: 'Hammer',
    link: '/services',
  },
];

export const TESTIMONIALS: Testimonial[] = [];

export const MOCK_LEADS: Lead[] = [
  { 
    id: '1', 
    name: 'John Doe', 
    email: 'john@example.com', 
    phone: '555-1234', 
    serviceNeeded: 'Mortgage Only', 
    city: 'Toronto', 
    consent: true, 
    status: 'New', 
    date: '2023-10-25',
    pageSource: 'https://indibrick.ca/',
    userAgent: 'Mozilla/5.0'
  },
];

export const PARTNERS: Partner[] = [
  {
    id: 'sarah-connor',
    name: 'Sarah Connor',
    role: 'Sales Representative',
    brokerage: 'ReMax Reality Inc.',
    imageUrl: 'https://picsum.photos/seed/sarah/200/200',
    email: 'sarah@example.com',
    phone: '(416) 555-9999'
  },
  {
    id: 'john-smith',
    name: 'John Smith',
    role: 'Real Estate Lawyer',
    brokerage: 'Smith Law PC',
    imageUrl: 'https://picsum.photos/seed/john/200/200',
    email: 'john@law.com',
    phone: '(905) 555-8888'
  }
];

export const MORTGAGE_RATES: MortgageRate[] = [
  { id: '1', term: '3-Year Fixed', rate: 4.79, type: 'Fixed' },
  { id: '2', term: '5-Year Fixed', rate: 4.49, type: 'Fixed' },
  { id: '3', term: '5-Year Variable', rate: 5.55, type: 'Variable' },
];

export const MOCK_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'Bank of Canada Holds Rates Steady',
    source: 'Financial Post',
    date: '2023-10-25',
    url: '#',
    status: 'approved',
    summary: 'The central bank maintains the overnight rate target, signaling a potential end to the hiking cycle as inflation indicators moderate.'
  },
  {
    id: '2',
    title: 'GTA Condo Market Sees Shift in Q4',
    source: 'Real Estate Board',
    date: '2023-10-20',
    url: '#',
    status: 'approved',
    summary: 'Inventory levels rise across downtown Toronto, creating new opportunities for buyers to negotiate price and conditions.'
  },
  {
    id: '3',
    title: 'New Commercial Lending Guidelines for 2024',
    source: 'CMHC',
    date: '2023-10-15',
    url: '#',
    status: 'approved',
    summary: 'Updated MLI Select criteria will favor energy-efficient multi-residential projects, offering lower premiums and higher LTV ratios.'
  },
  {
    id: '4',
    title: 'Ontario Housing Supply Action Plan Update',
    source: 'Government of Ontario',
    date: '2023-11-01',
    url: '#',
    status: 'approved',
    summary: 'New legislation introduced to streamline approvals for purpose-built rentals and affordable housing developments near transit stations.'
  }
];