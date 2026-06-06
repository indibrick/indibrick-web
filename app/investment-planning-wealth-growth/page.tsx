import React from 'react';
import LeadForm from '../../components/LeadForm';
import { TrendingUp, ShieldCheck, Users, PieChart } from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Investment Planning & Wealth Growth Services in Canada',
  description: 'Professional investment planning and long-term wealth growth services. Connect with licensed advisors to explore structured investment solutions.',
  slug: '/investment-planning-wealth-growth',
  keywords: ['investment planning Canada', 'wealth growth services', 'long-term investments', 'licensed advisors Canada'],
});

export default function InvestmentPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-black text-white py-24 md:py-32 relative overflow-hidden border-b border-white/10">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8">
              <TrendingUp size={14} /> Wealth Strategy
            </div>
            <h1 className="text-5xl md:text-8xl font-black mb-8 leading-tight tracking-tighter uppercase">
              Investment Planning & <br /> Wealth Growth Services
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed max-w-2xl font-medium">
              We help Canadians move beyond basic savings. Access structured investment planning designed for long-term compounding and stability.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          
          {/* Left Column: Content */}
          <div className="space-y-12">
            
            {/* Value Proposition */}
            <div>
              <h2 className="text-3xl font-black text-black mb-6 uppercase tracking-tight">Build Long-Term Wealth With Structured Investment Planning</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                True wealth building requires more than just picking stocks; it requires a strategy. We focus on creating comprehensive investment roadmaps that prioritize long-term growth, asset stability, and estate efficiency. Whether you are accumulating capital for retirement or preserving wealth for the next generation, our approach is disciplined and goal-oriented.
              </p>
            </div>

            {/* Services Offered */}
            <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100">
              <h2 className="text-2xl font-black text-black mb-8 uppercase tracking-tight">How We Help Clients Build Wealth</h2>
              <ul className="space-y-6">
                {[
                  'Long-term investment planning',
                  'Market-linked investment solutions',
                  'Risk-managed portfolio structuring',
                  'Estate-conscious investment strategies'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="bg-black text-white p-2 rounded-lg"><PieChart size={16} /></div>
                    <span className="font-bold text-gray-800">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Advisor Positioning (Mandatory) */}
            <div className="border-l-4 border-black pl-8 py-2">
              <h2 className="text-xl font-black text-black mb-4 uppercase tracking-tight flex items-center gap-2">
                <Users size={20} /> Work With Our In-House Licensed Investment Advisors
              </h2>
              <p className="text-gray-600 font-medium leading-relaxed">
                Our in-house licensed advisors help clients understand investment options, assess risk tolerance, and structure long-term plans aligned with their financial goals.
              </p>
            </div>

            {/* Compliance Disclosure */}
            <div className="bg-gray-100 p-6 rounded-2xl">
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-gray-400 shrink-0" size={20} />
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-relaxed">
                  DISCLOSURE: Investment solutions are provided by licensed professionals. All discussions begin with education and suitability review. Investment returns are not guaranteed.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Lead Form */}
          <div className="lg:sticky lg:top-24 h-fit">
            <LeadForm 
              type="Investment"
              title="Start Your Investment Plan"
              subtitle="Connect with a licensed advisor to review your portfolio options."
            />
          </div>

        </div>
      </section>
    </div>
  );
}