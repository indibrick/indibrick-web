import React from 'react';
import { Metadata } from 'next';
import { Mail, Phone, MapPin, Clock, MessageSquare, Shield, Star } from 'lucide-react';
import JsonLd from '../../components/JsonLd';
import GamifiedContactForm from '../../components/GamifiedContactForm';

// --- SEO & AEO METADATA ---
export const metadata: Metadata = {
  title: 'Contact Mortgage Advisor Vaughan | Indibrick & Pineapple Financial',
  description: 'Speak directly with a Senior Mortgage Strategist in Vaughan, Ontario. Get approved in 24 hours. Located at 60 Pippin Road. Specialists in Private Lending and Self-Employed.',
  keywords: ['Mortgage Broker Vaughan', 'Indibrick Financial Contact', 'Private Lender Contact Ontario', 'Mortgage Renewal Advice', 'Speak to Mortgage Agent'],
};

// --- UPDATED CONTACT INFO ---
const CONTACT_INFO = [
  {
    icon: Phone,
    label: "Direct Line",
    value: "+1 (437) 241-6392",
    link: "tel:+14372416392",
    sub: "Available 9am - 9pm"
  },
  {
    icon: Mail,
    label: "Email Support",
    value: "sales@indibrick.ca",
    link: "mailto:sales@indibrick.ca",
    sub: "Response in < 1 Hour"
  },
  {
    icon: MapPin,
    label: "Head Office",
    value: "60 Pippin Road, Unit 34, Vaughan, ON",
    link: "https://www.google.com/maps/search/?api=1&query=60+Pippin+Road+Unit+34+Vaughan+ON",
    sub: "By Appointment Only"
  }
];

export default function ContactPage() {
  
  // --- UPDATED SCHEMA.ORG ---
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Indibrick Financial",
    "image": "https://indibrick.ca/logo.png",
    "telephone": "+14372416392",
    "email": "sales@indibrick.ca",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "60 Pippin Road, Unit 34",
      "addressLocality": "Vaughan",
      "addressRegion": "ON",
      "postalCode": "L4K 4M8",
      "addressCountry": "CA"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
      ],
      "opens": "09:00",
      "closes": "21:00"
    },
    "priceRange": "$$"
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={contactSchema} />

      {/* --- 1. HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-6 bg-slate-900 text-white overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/4"></div>

        <div className="container mx-auto max-w-6xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Value Prop */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-blue-300">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live Advisor Status
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-none">
              Let's Build <br/> Your Strategy.
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-10 max-w-lg">
              Stop guessing with online calculators. Speak to a human who understands <strong>Canadian Real Estate</strong>, tax strategy, and private lending.
            </p>
            
            <div className="flex flex-col gap-6">
              {CONTACT_INFO.map((item, idx) => (
                <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition group">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-xl font-bold text-white">{item.value}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{item.sub}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Right: The Gamified Form */}
          <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-[2.5rem] blur-xl opacity-50"></div>
             <GamifiedContactForm />
          </div>

        </div>
      </section>

      {/* --- 2. TRUST & AUTHORITY --- */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <Shield className="w-10 h-10 text-black mb-6" />
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Fiduciary Standard</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                   Unlike bank employees, we work for <strong>you</strong>. We have a legal obligation to find you the best rate and terms available in the market.
                </p>
             </div>
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <Clock className="w-10 h-10 text-black mb-6" />
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Speed is Capital</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                   In a hot market, 24 hours can cost you the deal. We issue <strong>Commitment Letters</strong> same-day for qualified files.
                </p>
             </div>
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <Star className="w-10 h-10 text-black mb-6" />
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Network Access</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                   Access to 50+ lenders including Big 6 Banks, Credit Unions, B-Lenders, and <strong>Exclusive Private Capital</strong> not found online.
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* --- 3. FAQ SECTION --- */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-black uppercase tracking-tight mb-4">Common Questions</h2>
              <p className="text-gray-500">Answers to help your research process.</p>
           </div>
           
           <div className="grid gap-4">
              {[
                { q: "How fast can I get a pre-approval?", a: "We can typically issue a verifiable Pre-Approval letter within 4 to 24 hours after receiving your income documents (Paystub/T4)." },
                { q: "Do you charge a fee for your services?", a: "For standard residential mortgages (A-Lending), our service is 100% free for you. The lender pays us. Fees only apply for complex Commercial or Private lending scenarios, disclosed upfront." },
                { q: "Can you help with bad credit?", a: "Yes. We specialize in B-Lending and Private Mortgages. If you have at least 20% equity in your home, we can likely get you approved regardless of credit score." }
              ].map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-2xl p-6 hover:border-black transition cursor-default">
                   <h4 className="font-bold text-lg mb-2 flex items-center gap-3"><MessageSquare size={16} className="text-blue-600"/> {faq.q}</h4>
                   <p className="text-gray-500 text-sm leading-relaxed pl-7">{faq.a}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

    </div>
  );
}