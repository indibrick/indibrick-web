'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle, DollarSign, User, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { LeadService } from '../../services/LeadService';

type Step = 'AGE' | 'MORTGAGE' | 'VALUE' | 'RESULT';

export default function ReverseMortgageCalculator() {
  const [step, setStep] = useState<Step>('AGE');
  const [isOver55, setIsOver55] = useState<boolean | null>(null);
  const [mortgage, setMortgage] = useState<string>('');
  const [value, setValue] = useState<string>('');
  
  const calculateResult = () => {
    const mortVal = parseFloat(mortgage.replace(/,/g, '')) || 0;
    const propVal = parseFloat(value.replace(/,/g, '')) || 0;
    const maxLoan = propVal * 0.55; // 55% LTV Rule
    const cashAvailable = maxLoan - mortVal;
    
    return { qualified: cashAvailable > 0 && isOver55, maxLoan, cashAvailable, mortVal, propVal };
  };

  const result = calculateResult();
  const format = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 relative overflow-hidden border border-gray-100 min-h-[500px] flex flex-col justify-center">
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 h-2 bg-gray-100 w-full">
         <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: step === 'AGE' ? '25%' : step === 'MORTGAGE' ? '50%' : step === 'VALUE' ? '75%' : '100%' }}></div>
      </div>

      {step === 'AGE' && (
        <div className="animate-fade-in text-center">
           <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6"><User size={40} /></div>
           <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">Are you over 55?</h3>
           <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setIsOver55(true); setStep('MORTGAGE'); }} className="py-6 rounded-2xl border-2 border-orange-500 bg-orange-500 text-white font-black uppercase hover:bg-orange-600 transition">Yes</button>
              <button onClick={() => { setIsOver55(false); setStep('RESULT'); }} className="py-6 rounded-2xl border-2 border-gray-200 text-gray-500 font-black uppercase hover:border-black hover:text-black transition">No</button>
           </div>
        </div>
      )}

      {step === 'MORTGAGE' && (
        <div className="animate-fade-in">
           <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">Current Mortgage?</h3>
           <input type="number" value={mortgage} onChange={(e) => setMortgage(e.target.value)} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-2xl font-bold mb-6" placeholder="0" />
           <button onClick={() => setStep('VALUE')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase hover:bg-slate-800 transition">Next <ArrowRight size={18} /></button>
        </div>
      )}

      {step === 'VALUE' && (
        <div className="animate-fade-in">
           <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">Property Value?</h3>
           <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-2xl font-bold mb-6" placeholder="500000" />
           <button onClick={() => setStep('RESULT')} disabled={!value} className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black uppercase hover:bg-orange-600 transition">Calculate <RefreshCw size={18} /></button>
        </div>
      )}

      {step === 'RESULT' && (
        <div className="animate-fade-in text-center">
           {result.qualified ? (
             <>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1 rounded-full text-[10px] font-black uppercase mb-6"><CheckCircle size={14} /> Qualified</div>
                <h3 className="text-4xl font-black text-slate-900 mb-2">{format(result.cashAvailable)}</h3>
                <p className="text-sm font-bold text-orange-600 uppercase mb-8">Tax-Free Cash Available</p>
                <div className="bg-gray-50 p-4 rounded-xl mb-6 text-sm text-left space-y-2">
                   <div className="flex justify-between"><span>Max Loan (55%):</span> <span className="font-bold">{format(result.maxLoan)}</span></div>
                   <div className="flex justify-between"><span>Payoff Mortgage:</span> <span className="font-bold text-red-500">-{format(result.mortVal)}</span></div>
                </div>
                {/* UPDATED LINK: SCROLLS TO BOTTOM FORM */}
                <a href="#quote" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase hover:bg-slate-800 transition block shadow-xl">
                   Claim This Offer
                </a>
             </>
           ) : (
             <>
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={40} /></div>
                <h3 className="text-2xl font-black uppercase text-slate-900 mb-4">{!isOver55 ? "Age Requirement" : "Insufficient Equity"}</h3>
                <p className="text-gray-500 mb-8">{!isOver55 ? "Must be 55+." : `Mortgage exceeds 55% limit.`}</p>
                <Link href={!isOver55 ? "/rates" : "/bad-credit-private-mortgages"} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase hover:bg-slate-800 transition block">Explore Other Options</Link>
                <button onClick={() => setStep('AGE')} className="mt-4 text-xs underline text-gray-400">Restart</button>
             </>
           )}
        </div>
      )}
    </div>
  );
}