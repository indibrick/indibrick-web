'use client';

import React from 'react';
import Image from 'next/image'; 
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import { 
  ShieldCheck, Award, TrendingUp, Users, 
  Banknote, Heart, Linkedin, ArrowRight, Zap 
} from 'lucide-react';

export default function AboutPage() {

  // --- AEO: ORGANIZATION SCHEMA ---
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "IndiBrick",
    "url": "https://indibrick.ca",
    "founders": [
      { "@type": "Person", "name": "Saad Shaikh", "jobTitle": "Co-Founder" },
      { "@type": "Person", "name": "Mudit Chhura", "jobTitle": "Co-Founder" }
    ],
    "parentOrganization": {
      "@type": "Organization",
      "name": "Dream Home + Life",
      "founder": { "@type": "Person", "name": "Vikas Sharma" },
      "employees": [
        { "@type": "Person", "name": "Amit Nagpal", "jobTitle": "Mortgage Agent Level 2 & Underwriter" },
        { "@type": "Person", "name": "Vignesh Karthikeyan", "jobTitle": "Investment & Insurance Specialist" }
      ]
    }
  };

  // Shared Button Style
  const linkedinButtonStyle = "inline-flex items-center justify-center gap-3 bg-[#0077b5] text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#005e93] transition shadow-lg hover:shadow-xl w-full md:w-auto";

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900">
      <JsonLd data={aboutSchema} />

      {/* --- 1. HERO --- */}
      <section className="pt-32 pb-20 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
        <div className="container mx-auto max-w-6xl relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-tight">
            The Perfect <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Combination.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed">
            Where 22+ years of financial mastery meets next-generation technology.
          </p>
        </div>
      </section>

      {/* --- 2. DREAM HOME + LIFE (THE FOUNDATION) --- */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
           
           {/* BRAND HEADER */}
           <div className="text-center mb-16">
              <div className="inline-flex items-center gap-4 bg-white border border-gray-200 px-8 py-4 rounded-full shadow-xl mb-8 animate-fade-in-up">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-100">
                     <Image src="/logo-in.jpg" fill alt="Dream Home + Life Logo" className="object-cover" />
                  </div>
                  <span className="font-black text-2xl text-slate-900 tracking-tight uppercase">Dream Home + Life</span>
              </div>
              
              <div className="max-w-3xl mx-auto">
                 <h2 className="text-3xl font-bold text-slate-900 mb-6">Holistic Wealth Management</h2>
                 <p className="text-gray-500 text-lg leading-relaxed">
                    We are the foundation. Dream Home + Life is a premier financial advisory firm housing experienced Mortgage Advisors and <strong>Licensed Insurance & Investment Specialists</strong>. We don't just secure your debt; we protect your assets and grow your net worth.
                 </p>
              </div>
           </div>

           {/* LEADERSHIP GRID */}
           <div className="space-y-8">
              
              {/* A. VIKAS SHARMA (PRINCIPAL) */}
              <div className="bg-gray-50 rounded-[3rem] p-8 md:p-12 border border-gray-200 shadow-sm">
                  <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="w-full md:w-1/3 relative">
                        <div className="aspect-[4/5] bg-white rounded-[2rem] overflow-hidden shadow-2xl relative border-4 border-white">
                          <Image src="/vikas-in.jpg" fill alt="Vikas Sharma" className="object-cover" priority />
                        </div>
                        <div className="absolute -bottom-6 -right-4 bg-black text-white p-4 rounded-xl shadow-lg">
                          <p className="text-2xl font-black">22+</p>
                          <p className="text-[10px] font-bold uppercase text-gray-400">Years Exp.</p>
                        </div>
                    </div>
                    <div className="w-full md:w-2/3">
                        <h3 className="text-4xl font-black text-slate-900 mb-2">Vikas Sharma</h3>
                        <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-6">Broker & Owner</p>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                          Vikas is the architect of the advisory model. Having worked across major <strong>Banks</strong> and independent <strong>Brokerages</strong> for over two decades, he possesses the rare "Insider Knowledge" required to navigate complex approvals. His philosophy is simple: <strong>Advice over Sales.</strong>
                        </p>
                        <a href="https://www.linkedin.com/in/vikas-sharma-3ba675348/" target="_blank" rel="noopener noreferrer" className={linkedinButtonStyle}>
                          <Linkedin size={18} /> Connect on LinkedIn
                        </a>
                    </div>
                  </div>
              </div>

              {/* B. EXECUTIVE TEAM (AMIT & VIGNESH) */}
              <div className="grid md:grid-cols-2 gap-8">
                  
                  {/* Amit Nagpal */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 hover:shadow-xl transition group flex flex-col">
                      <div className="flex items-center gap-6 mb-6">
                          <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden relative border-4 border-white shadow-md shrink-0">
                              <Image src="/amit-in.jpg" fill alt="Amit Nagpal" className="object-cover" />
                          </div>
                          <div>
                              <h4 className="text-2xl font-black text-slate-900">Amit Nagpal</h4>
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Mortgage Agent L2 & Underwriter</p>
                          </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-grow">
                          Specializing in complex deal structuring and underwriting. Amit ensures that every file is meticulously prepared to meet lender guidelines, securing approvals for even the most challenging scenarios.
                      </p>
                      <a href="https://www.linkedin.com/in/hramitnagpal/" target="_blank" rel="noopener noreferrer" className={linkedinButtonStyle}>
                          <Linkedin size={18} /> Connect on LinkedIn
                      </a>
                  </div>

                  {/* Vignesh Karthikeyan */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 hover:shadow-xl transition group flex flex-col">
                      <div className="flex items-center gap-6 mb-6">
                          <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden relative border-4 border-white shadow-md shrink-0">
                              <Image src="/vignesh-in.jpg" fill alt="Vignesh Karthikeyan" className="object-cover" />
                          </div>
                          <div>
                              <h4 className="text-2xl font-black text-slate-900">Vignesh Karthikeyan</h4>
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Investment & Insurance Specialist</p>
                          </div>
                      </div>  
                      <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-grow">
                          Leading the wealth protection division. Vignesh designs comprehensive insurance and investment strategies (Segregated Funds, Life Insurance) to secure your family's financial future alongside your real estate assets.
                      </p>
                      <a href="https://www.linkedin.com/in/doctroffinance/" target="_blank" rel="noopener noreferrer" className={linkedinButtonStyle}>
                          <Linkedin size={18} /> Connect on LinkedIn
                      </a>
                  </div>

              </div>

           </div>
        </div>
      </section>

      {/* --- 3. INDIBRICK (THE TECHNOLOGY) --- */}
      <section className="py-24 px-6 bg-slate-900 text-white relative">
         <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
               <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 mb-6">
                  <Zap className="text-yellow-400 fill-yellow-400" size={20} />
                  <span className="font-black text-xl tracking-widest uppercase">IndiBrick Platform</span>
               </div>
               <h2 className="text-4xl font-black mb-4">The Digital Engine</h2>
               <p className="text-gray-400 max-w-2xl mx-auto">
                  Built to modernize the Dream Home + Life experience. IndiBrick powers the instant approvals, secure document handling, and partner ecosystem.
               </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               
               {/* SAAD */}
               <div className="bg-white text-slate-900 p-8 rounded-[2.5rem] relative overflow-hidden group hover:shadow-2xl transition duration-300">
                  <div className="relative z-10 flex flex-col h-full">
                     <div className="flex items-center gap-6 mb-6">
                        <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden relative border-2 border-gray-100">
                           <Image src="/saad-in.jpg" fill alt="Saad Shaikh" className="object-cover" />
                        </div>
                        <div>
                           <h4 className="text-2xl font-black">Saad Shaikh</h4>
                           <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Co-Founder</p>
                        </div>
                     </div>
                     <p className="text-gray-600 leading-relaxed mb-8 flex-grow">
                        Driving the strategic vision. Saad focuses on simplifying complex real estate workflows into a seamless digital experience, ensuring transparency at every step.
                     </p>
                     <a href="https://www.linkedin.com/in/saad3105/" target="_blank" rel="noopener noreferrer" className={linkedinButtonStyle}>
                        <Linkedin size={18} /> Connect on LinkedIn
                     </a>
                  </div>
               </div>

               {/* MUDIT */}
               <div className="bg-white text-slate-900 p-8 rounded-[2.5rem] relative overflow-hidden group hover:shadow-2xl transition duration-300">
                  <div className="relative z-10 flex flex-col h-full">
                     <div className="flex items-center gap-6 mb-6">
                        <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden relative border-2 border-gray-100">
                           <Image src="/mudit-in.jpg" fill alt="Mudit Chhura" className="object-cover" />
                        </div>
                        <div>
                           <h4 className="text-2xl font-black">Mudit Chhura</h4>
                           <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Co-Founder</p>
                        </div>
                     </div>
                     <p className="text-gray-600 leading-relaxed mb-8 flex-grow">
                        Leading platform development and partner relationships. Mudit bridges the gap between technology and people, ensuring Realtors and Lawyers have the tools to succeed.
                     </p>
                     <a href="https://www.linkedin.com/in/muditchhura" target="_blank" rel="noopener noreferrer" className={linkedinButtonStyle}>
                        <Linkedin size={18} /> Connect on LinkedIn
                     </a>
                  </div>
               </div>

            </div>
         </div>
      </section>

      {/* --- 4. CTA --- */}
      <section className="py-24 px-6 bg-gray-50 text-center">
         <div className="container mx-auto max-w-4xl">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 text-slate-900">
               Experience the Difference.
            </h2>
            <div className="bg-white text-slate-900 p-8 rounded-[2rem] max-w-lg mx-auto text-left shadow-2xl border border-gray-200">
               <LeadForm title="Contact The Team" subtitle="Start your journey with Dream Home + Life." type="General Inquiry" />
            </div>
         </div>
      </section>

    </div>
  );
}