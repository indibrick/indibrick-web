import ApplyWizard from '../../components/ApplyWizard';
import TrustedFormScript from '../../components/TrustedFormScript';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Get Your Mortgage Options in 90 Seconds',
  description: 'See what you qualify for instantly. No hard credit check. No obligation. A licensed Canadian mortgage advisor will call you within 1 business hour.',
  slug: '/apply',
  keywords: ['Mortgage Pre-Approval', 'Canadian Mortgage Options', 'No Credit Check Mortgage', 'Mortgage Wizard'],
});

export default function ApplyPage() {
  return (
    <div className="relative bg-slate-900 min-h-screen text-white pt-28 md:pt-32 pb-20 px-6 overflow-hidden">
      <TrustedFormScript />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/4 pointer-events-none"></div>

      <div className="container mx-auto max-w-3xl relative z-10">
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 leading-tight">
            Get Your Mortgage Options in <span className="text-blue-400">90 Seconds.</span>
          </h1>
          <p className="text-base md:text-lg text-gray-300 max-w-xl mx-auto font-medium">
            No hard credit check. No obligation. See what you qualify for instantly.
          </p>
        </div>

        <ApplyWizard />
      </div>
    </div>
  );
}
