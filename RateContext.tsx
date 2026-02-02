
'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { MortgageRate } from './types';
import { MORTGAGE_RATES as INITIAL_RATES } from './constants';
import { ContentService } from './services/ContentService';

interface RateContextType {
  rates: MortgageRate[];
  refreshRates: () => Promise<void>;
}

const RateContext = createContext<RateContextType | undefined>(undefined);

export const RateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rates, setRates] = useState<MortgageRate[]>(INITIAL_RATES);

  const refreshRates = async () => {
    const fetchedRates = await ContentService.fetchRates();
    // Sort simply to ensure fixed comes before variable usually
    const sorted = fetchedRates.sort((a,b) => a.term.localeCompare(b.term));
    setRates(sorted);
  };

  useEffect(() => {
    refreshRates();
    // Optional: Poll for rate changes every 60 seconds
    const interval = setInterval(refreshRates, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <RateContext.Provider value={{ rates, refreshRates }}>
      {children}
    </RateContext.Provider>
  );
};

export const useRates = () => {
  const context = useContext(RateContext);
  if (!context) {
    throw new Error('useRates must be used within a RateProvider');
  }
  return context;
};
