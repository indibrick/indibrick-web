// app/embed/mortgage-calculator/page.tsx
import MortgageCalculator from '@/components/MortgageCalculator';

export default function MortgageCalculatorWidget() {
  return (
    <main className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      {/* 1. Load our existing calculator */}
      <MortgageCalculator />
      
      {/* 2. The Free Marketing Backlink */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500 font-medium">
          Powered by{' '}
          <a 
            href="https://indibrick.ca" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-bold transition-colors"
          >
            indibrick.ca
          </a>
        </p>
      </div>
    </main>
  );
}