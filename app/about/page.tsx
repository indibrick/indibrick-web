'use client';

import React from 'react';
import Image from 'next/image'; 
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import { Linkedin, Users } from 'lucide-react';

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
    "employees": [
       { "@type": "Person", "name": "Vikas Sharma", "jobTitle": "Broker" },
       { "@type": "Person", "name": "Amit Nagpal", "jobTitle": "Mortgage Agent Level 2" },
       { "@type": "Person", "name": "Nitish Gupta", "jobTitle": "Mortgage Agent Level 1" }
    ]
  };

  // Shared Styles for Consistency
  const cardStyle = "bg-white p-8 rounded-[2.5rem] border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col h-full group";
  const imageContainerStyle = "w-24 h-24 bg-gray-100 rounded-full overflow-hidden relative border-4 border-white shadow-md shrink-0 mb-6";
  const nameStyle = "text-2xl font-black text-slate-900";
  const roleStyle = "text-xs font-bold text-blue-600 uppercase tracking-widest mt-1 mb-6";
  const textStyle = "text-gray-600 text-sm leading-relaxed mb-8 flex-grow";
  const linkedinButtonStyle = "mt-auto inline-flex items-center justify-center gap-3 bg-[#0077b5] text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#005e93] transition shadow-md hover:shadow-lg w-full";

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
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
            Where next-generation technology meets 22+ years of financial mastery.
          </p>
        </div>
      </section>

      {/* --- 2. UNIFIED TEAM GRID --- */}
      <section className="py-24 px-6">
         <div className="container mx-auto max-w-7xl">
            
            {/* Header */}
            <div className="text-center mb-16">
               <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-gray-200 shadow-sm mb-6">
                  <Users className="text-blue-600" size={20} />
                  <span className="font-black text-xl tracking-widest uppercase text-slate-900">Leadership & Partners</span>
               </div>
               <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                  Building the operating system for modern real estate in Ontario.
               </p>
            </div>

            {/* THE GRID */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

               {/* 1. MUDIT */}
               <div className={cardStyle}>
                  <div className={imageContainerStyle}>
                     <Image src="/mudit-in.jpg" fill alt="Mudit Chhura" className="object-cover" />
                  </div>
                  <div>
                     <h4 className={nameStyle}>Mudit Chhura</h4>
                     <p className={roleStyle}>Co-Founder, Indibrick</p>
                  </div>
                  <p className={textStyle}>
                     Leading platform development and partner relationships. Mudit bridges the gap between technology and people, ensuring Realtors and Lawyers have the tools to succeed.
                  </p>
                  <a href="https://www.linkedin.com/in/muditchhura" target="_blank" rel="noopener noreferrer" className={linkedinButtonStyle}>
                     <Linkedin size={18} /> LinkedIn
                  </a>
               </div>
               
               {/* 2. SAAD */}
               <div className={cardStyle}>
                  <div className={imageContainerStyle}>
                     <Image src="/saad-in.jpg" fill alt="Saad Shaikh" className="object-cover" />
                  </div>
                  <div>
                     <h4 className={nameStyle}>Saad Shaikh</h4>
                     <p className={roleStyle}>Co-Founder, Indibrick</p>
                  </div>
                  <p className={textStyle}>
                     Driving the strategic vision. Saad focuses on simplifying complex real estate workflows into a seamless digital experience, ensuring transparency at every step of the user journey.
                  </p>
                  <a href="https://www.linkedin.com/in/saad3105/" target="_blank" rel="noopener noreferrer" className={linkedinButtonStyle}>
                     <Linkedin size={18} /> LinkedIn
                  </a>
               </div>

               {/* 3. VIKAS */}
               <div className={cardStyle}>
                  <div className={imageContainerStyle}>
                     <Image src="/vikas-in.jpg" fill alt="Vikas Sharma" className="object-cover" />
                  </div>
                  <div>
                     <h4 className={nameStyle}>Vikas Sharma</h4>
                     <p className={roleStyle}>Broker</p>
                  </div>
                  <p className={textStyle}>
                     <strong className="text-blue-600 block mb-2">Part of Dream Home + Life</strong>
                     With over 22 years of experience across major Banks and Brokerages, Vikas provides the "Insider Knowledge" required to navigate complex approvals. His philosophy: Advice over Sales.
                  </p>
                  <a href="https://www.linkedin.com/in/vikas-sharma-3ba675348/" target="_blank" rel="noopener noreferrer" className={linkedinButtonStyle}>
                     <Linkedin size={18} /> LinkedIn
                  </a>
               </div>

               {/* 4. AMIT */}
               <div className={cardStyle}>
                  <div className={imageContainerStyle}>
                     <Image src="/amit-in.jpg" fill alt="Amit Nagpal" className="object-cover" />
                  </div>
                  <div>
                     <h4 className={nameStyle}>Amit Nagpal</h4>
                     <p className={roleStyle}>Mortgage Agent L2/Underwriter</p>
                  </div>
                  <p className={textStyle}>
                     <strong className="text-blue-600 block mb-2">Part of Dream Home + Life</strong>
                     Specializing in complex deal structuring and underwriting. Amit ensures that every file is meticulously prepared to meet lender guidelines and secure approvals for challenging scenarios.
                  </p>
                  <a href="https://www.linkedin.com/in/hramitnagpal/" target="_blank" rel="noopener noreferrer" className={linkedinButtonStyle}>
                     <Linkedin size={18} /> LinkedIn
                  </a>
               </div>

               {/* 5. NITISH */}
               <div className={cardStyle}>
                  <div className={imageContainerStyle}>
                     <Image src="/nitish.jpg" fill alt="Nitish Gupta" className="object-cover" />
                  </div>
                  <div>
                     <h4 className={nameStyle}>Nitish Gupta</h4>
                     <p className={roleStyle}>Mortgage Agent Level 1</p>
                  </div>
                  <p className={textStyle}>
                     <strong className="text-blue-600 block mb-2">Part of Dream Home + Life</strong>
                     An ex-banker with 6 years of experience with major financial institutions, now working as a mortgage agent with Dream Home + Life, Nitish supports Indibrick in business development, bringing deep institutional knowledge to complex files.
                  </p>
                  <a href="https://www.linkedin.com/in/nitish-g-74a5b139/" target="_blank" rel="noopener noreferrer" className={linkedinButtonStyle}>
                     <Linkedin size={18} /> LinkedIn
                  </a>
               </div>
               
               {/* 6. SANA KHAN */}
               <div className={cardStyle}>
                  <div className={imageContainerStyle}>
                     <Image src="/sana-in.jpg" fill alt="Sana Khan" className="object-cover" />
                  </div>
                  <div>
                     <h4 className={nameStyle}>Sana Khan</h4>
                     <p className={roleStyle}>Content Creation Lead</p>
                  </div>
                  <p className={textStyle}>
                     <strong className="text-blue-600 block mb-2">Indibrick Team</strong>
                     Driving the digital narrative. Sana curates high-impact content that bridges the gap between complex financial data and user engagement, amplifying Indibrick's market presence.
                  </p>
                  <a href="https://www.linkedin.com/in/sana-k-a54b6b389/" target="_blank" rel="noopener noreferrer" className={linkedinButtonStyle}>
                     <Linkedin size={18} /> LinkedIn
                  </a>
               </div>

            </div>
         </div>
      </section>

      {/* --- 3. CTA --- */}
      <section className="py-24 px-6 bg-slate-900 text-center text-white">
         <div className="container mx-auto max-w-4xl">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8">
               Ready to start?
            </h2>
            <div className="bg-white text-slate-900 p-8 rounded-[2rem] max-w-lg mx-auto text-left shadow-2xl border border-gray-200">
               <LeadForm title="Contact Us" subtitle="Get in touch with the team." type="General Inquiry" />
            </div>
         </div>
      </section>

    </div>
  );
}