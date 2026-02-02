
import React from 'react';

export default function TermsPage() {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-black mb-8 uppercase tracking-tighter">Terms and Conditions</h1>
        
        <div className="prose max-w-none text-gray-700 space-y-6">
          <p className="font-bold">Effective Date: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4 uppercase">1. Service Description</h2>
            <p>
              IndiBrick.ca is a digital platform providing information about real estate and mortgage services in Ontario. Mudit Chhura is a licensed Mortgage Agent (M25003057) with Pineapple (Brokerage License 12830). All mortgage advisory services are provided through the brokerage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4 uppercase">2. Partner Referrals</h2>
            <p>
              IndiBrick connects users with third-party professionals, including real estate agents, lawyers, and contractors. IndiBrick and Mudit Chhura do not provide these third-party services directly and are not responsible for the performance, warranties, or conduct of these partners. Users are encouraged to perform their own due diligence.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4 uppercase">3. Pre-Construction Advertising</h2>
            <p>
              Pre-construction projects are advertised in compliance with Ontario regulations. IndiBrick acts as an educational and financing hub. All project details, floor plans, and pricing are provided by builder partners and are subject to change without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4 uppercase">4. No Financial Advice</h2>
            <p>
              The content on this website is for informational purposes only and does not constitute financial, legal, or investment advice. Always consult with a licensed professional before making significant financial decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4 uppercase">5. Liability</h2>
            <p>
              IndiBrick is not liable for any losses or damages arising from the use of this website or the services provided by third-party partners referred through our network.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
