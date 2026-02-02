'use client';
import React, { useState, useEffect } from 'react';
import { Save, Lock, Activity } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export default function RateManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [rates, setRates] = useState({
    insured_variable_5yr: '3.39',
    insured_fixed_5yr: '3.79',
    insured_fixed_3yr: '4.09',
    uninsured_fixed_5yr: '4.39',
    uninsured_variable_5yr: '4.59',
    b_lender: '4.79',
    private_1st: '5.49',
    second_mortgage: '4.99'
  });

  // Load current rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'mortgage_rates');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // Merge with defaults to prevent crashes if fields are missing
          setRates(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (e) {
        console.error("Error fetching rates", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/update-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates, adminKey: password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('✅ Rates Updated Live!');
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10">Loading Command Center...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        
        <div className="flex items-center gap-3 mb-8 border-b pb-6">
          <div className="bg-slate-900 text-white p-3 rounded-xl"><Activity /></div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Rate Command Center</h1>
            <p className="text-gray-500 text-xs uppercase tracking-widest">Update Global Pricing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {Object.entries(rates).map(([key, value]) => (
            <div key={key}>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                {key.replace(/_/g, ' ')} (%)
              </label>
              <input 
                type="text" 
                value={value as string}
                onChange={(e) => setRates({...rates, [key]: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-2xl">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
            <Lock size={12} /> Admin Password Required
          </label>
          <div className="flex gap-4">
            <input 
              type="password" 
              placeholder="Enter Secret Key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none"
            />
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wide flex items-center gap-2 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : <><Save size={18} /> Update Live</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}