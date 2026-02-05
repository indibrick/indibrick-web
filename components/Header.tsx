'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, Building, Home, Hammer, Calculator, Zap, ChevronDown, Info,
  DollarSign, Wallet, Lock, Shield, Percent, RefreshCw, TrendingUp, PieChart, TrendingDown,
  AlertTriangle, Phone, Sun
} from 'lucide-react';
import { CITIES } from '../data/cityData';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  
  const currentPath = usePathname() || '';
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);

  // 1. MAIN LINKS
  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Services', path: '/services', icon: Hammer },
    { name: 'Rates', path: '/rates', icon: TrendingDown },
    { name: 'Listings', path: '/listings', icon: Building },
  ];

  // 2. TOOLS SECTIONS
  const toolsSections = [
    {
      title: "Real Estate & Mortgages",
      items: [
        { name: 'Mortgage Payment', path: '/mortgage-payment-calculator', icon: Calculator },
        { name: 'Affordability', path: '/affordability-calculator', icon: Wallet },
        { name: 'Reverse Mortgage (55+)', path: '/reverse-mortgage-calculator', icon: Sun },
        { name: 'Land Transfer Tax', path: '/land-transfer-tax-calculator-ontario', icon: Zap },
        { name: 'Penalty Estimator', path: '/mortgage-penalty-calculator', icon: AlertTriangle },
        { name: 'Closing Costs', path: '/closing-costs-calculator', icon: DollarSign },
        { name: 'Down Payment', path: '/down-payment-calculator', icon: PieChart },
        { name: 'Renewal Estimator', path: '/mortgage-renewal-calculator', icon: RefreshCw },
        { name: 'Refinance / Equity', path: '/refinance-calculator', icon: TrendingUp },
        { name: 'Trigger Rate', path: '/trigger-rate-calculator', icon: Percent },
      ]
    },
    {
      title: "Wealth Strategy",
      items: [
        { name: 'Smith Maneuver', path: '/tools/smith-maneuver-calculator', icon: RefreshCw },
        { name: 'Universal Life (Tax)', path: '/tools/universal-life-calculator', icon: Lock },
        { name: 'Segregated Funds', path: '/tools/segregated-fund-calculator', icon: Shield },
      ]
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const handleSecretClick = () => {
    const now = Date.now();
    if (now - lastClickTime.current > 1000) {
      clickCount.current = 1;
    } else {
      clickCount.current += 1;
    }
    lastClickTime.current = now;
    if (clickCount.current === 5) {
      window.location.href = '/portal-x-99';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-24">
          
          {/* BRANDING */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 100 100" className="w-12 h-12 text-black group-hover:opacity-80 transition" fill="currentColor"><rect x="10" y="5" width="80" height="18" rx="2" /><rect x="10" y="28" width="38" height="18" rx="2" /><rect x="52" y="28" width="38" height="18" rx="2" /><rect x="10" y="51" width="80" height="18" rx="2" /><rect x="10" y="74" width="38" height="18" rx="2" /><rect x="52" y="74" width="38" height="18" rx="2" /></svg>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tighter text-black uppercase leading-none">INDIBRICK</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">The Ecosystem</span>
              </div>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden xl:flex space-x-8 items-center">
            
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors hover:text-black ${
                  isActive(link.path) ? 'text-black border-b-2 border-black pb-1' : 'text-gray-400'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* TOOLS DROPDOWN */}
            <div 
              className="relative group"
              onMouseEnter={() => setIsToolsOpen(true)}
              onMouseLeave={() => setIsToolsOpen(false)}
            >
              <Link
                href="/tools"
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors hover:text-black flex items-center gap-1 ${
                  isActive('/tools') ? 'text-black border-b-2 border-black pb-1' : 'text-gray-400'
                }`}
              >
                Tools <ChevronDown size={14} />
              </Link>
              {isToolsOpen && (
                <div className="absolute top-full -left-20 pt-4 animate-fade-in w-[340px]">
                  <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden">
                    {toolsSections.map((section, idx) => (
                      <div key={idx} className={idx > 0 ? "border-t border-gray-100" : ""}>
                         <div className="px-6 py-3 bg-gray-50/80">
                           <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{section.title}</span>
                         </div>
                         <div className="grid grid-cols-1 gap-1 p-2">
                           {section.items.map((tool) => (
                             <Link
                               key={tool.path}
                               href={tool.path}
                               onClick={() => setIsToolsOpen(false)}
                               className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-black transition group/item"
                             >
                                <tool.icon size={14} className="text-gray-300 group-hover/item:text-black transition" /> 
                                {tool.name}
                             </Link>
                           ))}
                         </div>
                      </div>
                    ))}
                    <Link href="/tools" onClick={() => setIsToolsOpen(false)} className="block text-center px-6 py-4 bg-black text-white hover:bg-gray-800 text-[10px] font-black uppercase tracking-widest transition">
                      All Calculators
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* CTA BUTTONS (UPDATED) */}
          <div className="flex items-center gap-3">
             {/* Secondary Button: Contact */}
             <Link href="/contact" className="hidden sm:flex items-center gap-2 bg-white text-black border-2 border-black px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition">
              <Phone size={14} /> Talk to Advisor
            </Link>

            {/* Primary Button: Pre-Approval */}
            <a href="https://gopineapple.ca/muditchhura/preapproval" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition shadow-xl">
              <Zap size={14} /> Pre-Approval
            </a>

            <button onClick={() => setIsOpen(!isOpen)} className="xl:hidden text-black focus:outline-none">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="xl:hidden bg-white border-t border-gray-100 py-8 px-6 shadow-2xl absolute w-full animate-fade-in max-h-[85vh] overflow-y-auto">
          <nav className="flex flex-col space-y-8">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.path} onClick={() => setIsOpen(false)} className={`text-xl font-black uppercase tracking-tighter flex items-center gap-4 ${isActive(link.path) ? 'text-black' : 'text-gray-400'}`}>
                {link.icon && <link.icon size={24} />} {link.name}
              </Link>
            ))}
            
            <div className="space-y-4 pt-4 border-t border-gray-100">
               <Link href="/tools" onClick={() => setIsOpen(false)} className="text-xl font-black uppercase tracking-tighter flex items-center gap-4 text-black">
                  <Calculator size={24} /> Tools
               </Link>
               {toolsSections.map((sec, i) => (
                 <div key={i} className="space-y-3 pl-4 border-l-2 border-gray-100 ml-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{sec.title}</p>
                    {sec.items.map((tool) => (
                      <Link key={tool.path} href={tool.path} onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-sm font-bold text-gray-600 uppercase tracking-wide py-1">
                         <tool.icon size={16} /> {tool.name}
                      </Link>
                    ))}
                 </div>
               ))}
            </div>

            {/* MOBILE CTA GRID */}
            <div className="grid grid-cols-2 gap-4">
              <Link href="/contact" onClick={() => setIsOpen(false)} className="bg-white border-2 border-black text-black text-center py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                <Phone size={16} /> Contact
              </Link>
              <a href="https://gopineapple.ca/muditchhura/preapproval" target="_blank" rel="noopener noreferrer" className="bg-black text-white text-center py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                 <Zap size={16} /> Apply Now
              </a>
            </div>

          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;