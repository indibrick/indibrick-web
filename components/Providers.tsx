'use client';

import React from 'react';
import { RateProvider } from '../RateContext';
import { AdminProvider } from '../AdminContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RateProvider>
      <AdminProvider>
        {children}
      </AdminProvider>
    </RateProvider>
  );
}