'use client';

import React from 'react';
import { RateProvider } from '../RateContext';
import { AdminProvider } from '../AdminContext';
import { ToastProvider } from './ui/ToastProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RateProvider>
      <AdminProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AdminProvider>
    </RateProvider>
  );
}