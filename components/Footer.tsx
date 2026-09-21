'use client';

import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 pt-20 pb-10">
      <div className="container mx-auto px-6">
         
         {/* Top Section: Brand & Navigation */}
         <div className="grid md:grid-cols-4 gap-12 mb-16 border-b border-slate-800 pb-12">
            
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center gap-2 mb-6">
                  <svg viewBox="0 0 100 100" className="w-10 h-10 text-white" fill="currentColor">
                     <rect x="10" y="5" width="80" height="18" rx="2" />
                     <rect x="10" y="28" width="38" height="18" rx="2" />
                     <rect x="52" y="28" width="38" height="18" rx="2" />
                     <rect x="10" y="51" width="80" height="18" rx="2" />
                     <rect x="10" y="74" width="38" height="18" rx="2" />
                     <rect x="52" y="74" width="38" height="18" rx="2" />
                  </svg>
                  <div>
                     <span className="text-2xl font-black uppercase tracking-tighter block leading-none">IndiBrick</span>
                     <span className="text-[10px] text-gray-400 uppercase tracking-[0.3em]">The Ecosystem</span>
                  </div>
               </div>
               <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
                  Ontario's first integrated Real Estate Operating System. We unify Mortgages, Insurance, and Wealth Strategy into one seamless platform.
               </p>
               
               {/* SOCIAL LINKS (UPDATED) */}
               <div className="flex gap-4">
                  <a 
                    href="https://www.instagram.com/indibrick.ca" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white hover:text-black transition"
                    aria-label="Instagram"
                  >
                    <Instagram size={18}/>
                  </a>
                  <a 
                    href="https://www.linkedin.com/company/indibrick/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white hover:text-black transition"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={18}/>
                  </a>
                  <a 
                    href="https://www.facebook.com/profile.php?id=61564971482267" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white hover:text-black transition"
                    aria-label="Facebook"
                  >
                    <Facebook size={18}/>
                  </a>
               </div>
            </div>

            {/* Quick Links */}
            <div>
               <h4 className="font-black uppercase tracking-widest text-xs mb-6 text-gray-500">Platform</h4>
               <ul className="space-y-4 text-sm font-medium text-gray-300">
                  <li><Link href="/rates" className="hover:text-white transition">Live Rates</Link></li>
                  <li><Link href="/services" className="hover:text-white transition">Services Hub</Link></li>
                  <li><Link href="/tools" className="hover:text-white transition">Calculators</Link></li>
                  <li><Link href="/renewal-rescue" className="hover:text-white transition">Renewal Rescue</Link></li>
                  <li><Link href="/refi-payout-plan" className="hover:text-white transition">Refi Payout Plan</Link></li>
                  <li><Link href="/six-minute-approval" className="hover:text-white transition">Approval Snapshot</Link></li>
                  <li><Link href="/blog" className="hover:text-white transition">Market News</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition">Contact Advisor</Link></li>
               </ul>
            </div>

            {/* Contact Info */}
            <div>
               <h4 className="font-black uppercase tracking-widest text-xs mb-6 text-gray-500">Head Office</h4>
               <ul className="space-y-4 text-sm font-medium text-gray-300">
                  <li className="flex items-start gap-3">
                     <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
                     <span>60 Pippin Road, Unit 34,<br/>Vaughan, ON L4K 4M8</span>
                  </li>
                  <li className="flex items-center gap-3">
                     <Phone size={18} className="text-blue-500 shrink-0" />
                     <a href="tel:+14372416392">+1 (437) 241-6392</a>
                  </li>
                  <li className="flex items-center gap-3">
                     <Mail size={18} className="text-blue-500 shrink-0" />
                     <a href="mailto:sales@indibrick.ca">{'sales' + '@' + 'indibrick.ca'}</a>
                  </li>
               </ul>
            </div>
         </div>

         {/* Bottom Section: Disclaimer & Copyright */}
         <div className="flex flex-col md:flex-row justify-between items-end gap-8 text-[10px] text-gray-500">
            <div className="max-w-4xl">
               <p className="mb-2 uppercase tracking-wider font-bold text-gray-300">Partnered with Dream Home + Life</p>
               <p className="leading-relaxed border-l-2 border-slate-700 pl-4">
                  <strong>IndiBrick.ca</strong> is a marketing platform partnered exclusively with <strong>Dream Home + Life</strong> for mortgage and Life Insurance/Investment advisory services. 
                  <br className="mb-2 block"/>
                  All other services (Real Estate Acquisition, Legal, Renovations) are provided through vetted third-party partners. 
                  Mortgages are processed through Pineapple Financial (LIC #12830).
               </p>
            </div>
            <div className="flex items-center gap-6 shrink-0">
               <Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
               <Link href="/terms-and-conditions" className="hover:text-white transition">Terms</Link>
               <span>&copy; {currentYear} IndiBrick</span>
            </div>
         </div>
      </div>
    </footer>
  );
}