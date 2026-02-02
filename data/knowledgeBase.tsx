import React from 'react';
import { Article } from '../types';

export const KNOWLEDGE_BASE: Article[] = [
  // --- Category 1: Niche Borrower Personas ---
  {
    id: '1',
    category: 'Niche Borrower Personas',
    slug: 'self-employed-mortgage-ontario',
    title: 'Can I get a mortgage if I am Self-Employed in Ontario?',
    snippet: 'Yes, self-employed professionals in Ontario can qualify for a mortgage through "Stated Income" programs or by using their business bank statements to prove cash flow, even if their personal tax returns show a lower net income to minimize taxes.',
    content: (
      <div className="space-y-4">
        <p>
          Being self-employed often means you write off expenses to lower your taxable income. While this is great for tax season, it can make qualifying for a traditional bank mortgage difficult. 
          However, specialized lenders understand that your "Net Income" on line 15000 of your NOA doesn't reflect your true ability to pay a mortgage.
        </p>
        <h3 className="text-xl font-bold mt-4">Stated Income Mortgages</h3>
        <p>
          These programs allow you to "state" your reasonable income based on your industry and tenure. You typically need to provide:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Business registration for at least 2 years.</li>
          <li>Clean credit history (650+ typically).</li>
          <li>At least 10% down payment (Insured) or 20% (Uninsured).</li>
        </ul>
        <p>
          If you are incorporated, we can also look at your corporate financial statements to "add back" expenses to boost your qualifying income.
        </p>
      </div>
    ),
    faqs: [
      { question: 'What is the minimum down payment for self-employed?', answer: 'You can buy with as little as 5% down if you have traditional T4-style income from your own company. For stated income programs, the minimum is typically 10%.' },
      { question: 'Are rates higher for self-employed mortgages?', answer: 'Not necessarily. If you have clean credit and qualify for an insured program (default insurance), you can get competitive "A" lender rates.' },
      { question: 'Do I need 2 years of tax returns?', answer: 'Most lenders prefer a 2-year history to establish income stability, but exceptions exist for professionals like doctors or IT contractors with strong contracts.' }
    ]
  },

  // --- Category 2: Hyper-Local Geo-Targeting ---
  {
    id: '2',
    category: 'Local Mortgage Guides',
    slug: 'toronto-mortgage-broker-condo-vs-house',
    title: 'Toronto Mortgage Broker Guide: Buying Condos vs. Houses',
    snippet: 'When financing a condo in Toronto, lenders factor in 50% of the monthly maintenance fees into your debt ratios, which significantly reduces your purchasing power compared to buying a freehold house with the same mortgage payment.',
    content: (
      <div className="space-y-4">
        <p>
          The Toronto market is unique. A $600,000 mortgage on a freehold house is easier to qualify for than a $600,000 mortgage on a condo with $800/month fees.
        </p>
        <h3 className="text-xl font-bold mt-4">The "Condo Fee" Hit</h3>
        <p>
          Lenders view maintenance fees as a fixed liability. Every $100 in maintenance fees reduces your mortgage qualification amount by approximately $10,000 to $15,000.
        </p>
        <h3 className="text-xl font-bold mt-4">Status Certificates</h3>
        <p>
          For condos, the lender will also require a review of the Status Certificate. If the reserve fund is low or there are pending special assessments, the lender may refuse to finance the building entirely.
        </p>
      </div>
    ),
    faqs: [
      { question: 'Do condo fees affect my mortgage approval?', answer: 'Yes, 50% of your monthly condo fee is added to your debt obligations, lowering the total mortgage amount you qualify for.' },
      { question: 'Is it harder to finance a condo in Toronto?', answer: 'It is slightly more complex due to the Status Certificate review. Lenders want to ensure the condo corporation is financially healthy.' },
      { question: 'What is the minimum down payment for a Toronto condo?', answer: '5% on the first $500,000 and 10% on the portion between $500,000 and $999,999. Properties over $1M require 20% down.' }
    ]
  },

  // --- Category 3: Property Types ---
  {
    id: '3',
    category: 'Property Types',
    slug: 'financing-duplex-conversion',
    title: 'How do I finance a Duplex Conversion in Ontario?',
    snippet: 'You can finance a duplex conversion using a "Purchase Plus Improvements" mortgage to borrow renovation costs upfront, or use a specialized rental offset program that counts potential rental income from the second unit to help you qualify.',
    content: (
      <div className="space-y-4">
        <p>
          Converting a single-family home into a legal duplex is one of the best ways to build equity and offset your mortgage payments.
        </p>
        <h3 className="text-xl font-bold mt-4">Legal vs. Illegal Units</h3>
        <p>
          Financing is easier if the unit is legal (retrofitted to fire code, separate entrance, proper egress). Some lenders will recognize income from "non-conforming" (illegal) suites, but typically only 50% of it, whereas legal suites can often use 100% rental offset.
        </p>
        <h3 className="text-xl font-bold mt-4">Purchase Plus Improvements</h3>
        <p>
          This program allows you to borrow the money for the renovation (e.g., $40,000 to put in a kitchen and fire separation) along with your mortgage. The funds are held in trust and released once the work is complete.
        </p>
      </div>
    ),
    faqs: [
      { question: 'Can I use projected rental income to qualify?', answer: 'Yes, many lenders allow you to use a "Market Rent Appraisal" to determine probable income and use that to help you qualify for the mortgage.' },
      { question: 'How much does it cost to legalize a basement?', answer: 'It varies by city, but typically ranges from $30,000 to $70,000 depending on existing plumbing, height, and egress windows.' },
      { question: 'Do I need a 20% down payment for a duplex?', answer: 'If you are living in one of the units (owner-occupied), you can put as little as 5-10% down. If it is purely an investment property, you need 20%.' }
    ]
  },

  // --- Category 4: Renovation (Purchase Plus) ---
  {
    id: '4',
    category: 'Renovation Financing',
    slug: 'purchase-plus-improvements-guide',
    title: 'Purchase Plus Improvements: The Complete Guide',
    snippet: 'The Purchase Plus Improvements program allows homebuyers to add up to $40,000 (or 20% of the purchase price) to their mortgage to fund renovations immediately after closing, allowing you to pay for upgrades at mortgage interest rates.',
    content: (
      <div className="space-y-4">
        <p>
          Don't let an outdated kitchen or bad flooring stop you from buying a solid house. This program gives you the cash to fix it.
        </p>
        <h3 className="text-xl font-bold mt-4">How It Works</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Get Quotes:</strong> Before your mortgage closes, you need firm quotes from contractors for the work.</li>
          <li><strong>Approval:</strong> The lender approves the "As-Improved" value of the home.</li>
          <li><strong>Closing:</strong> You buy the house. The reno funds are held by your lawyer.</li>
          <li><strong>Work:</strong> You complete the work (usually within 90 days).</li>
          <li><strong>Release:</strong> An appraiser confirms the work is done, and the lawyer releases the funds to you.</li>
        </ol>
      </div>
    ),
    faqs: [
      { question: 'Can I do the work myself?', answer: 'Generally, no. Lenders require quotes from professional contractors to ensure the work adds value to the property.' },
      { question: 'What renovations are eligible?', answer: 'Permanent improvements like kitchens, bathrooms, flooring, windows, and roofing. Chattels like appliances or furniture are not eligible.' },
      { question: 'Is the interest rate higher?', answer: 'No, you get the same competitive mortgage rate on the renovation portion as you do on the main mortgage.' }
    ]
  },

  // --- Category 5: Legal & Closing ---
  {
    id: '5',
    category: 'Legal & Closing',
    slug: 'land-transfer-tax-ontario',
    title: 'How is Land Transfer Tax Calculated in Ontario?',
    snippet: 'Ontario Land Transfer Tax is a progressive tax ranging from 0.5% to 2.5% of the property value. If you buy in Toronto, you must pay a Municipal Land Transfer Tax (MLTT) in addition to the provincial tax, effectively doubling the cost.',
    content: (
      <div className="space-y-4">
        <p>
          Land Transfer Tax (LTT) is often the largest closing cost for buyers. It must be paid in cash on closing day—it cannot be added to your mortgage.
        </p>
        <h3 className="text-xl font-bold mt-4">First-Time Buyer Rebates</h3>
        <p>
          Fortunately, first-time buyers get relief:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Ontario Rebate:</strong> Up to $4,000 off the tax.</li>
          <li><strong>Toronto Rebate:</strong> Up to $4,475 off the municipal tax.</li>
        </ul>
        <p>
          This means if you buy a home for under $368,000 in Ontario (outside Toronto), you pay zero LTT.
        </p>
      </div>
    ),
    faqs: [
      { question: 'Who qualifies as a first-time buyer?', answer: 'You cannot have owned a home anywhere in the world previously. If you have a spouse, they must also not have owned a home while you were their spouse.' },
      { question: 'When do I pay the tax?', answer: 'Your lawyer collects it from you a few days before closing and remits it to the government on closing day.' },
      { question: 'Is LTT applicable on pre-construction condos?', answer: 'Yes, and it is calculated on the final price including HST.' }
    ]
  },

  // --- Category 6: Comparisons ---
  {
    id: '6',
    category: 'Comparisons',
    slug: 'fixed-vs-variable-rate-2025',
    title: 'Fixed vs. Variable Rate: Which is Better in 2025?',
    snippet: 'Choosing between Fixed and Variable depends on your risk tolerance. Variable rates save money when the Bank of Canada cuts rates, while Fixed rates provide budget certainty and protection against inflation spikes.',
    content: (
      <div className="space-y-4">
        <p>
          The age-old debate. In 2025, the economic landscape suggests volatility, making the choice crucial.
        </p>
        <h3 className="text-xl font-bold mt-4">The Variable Strategy</h3>
        <p>
          Historically, variable rates have outperformed fixed rates over the long term. If we are in a declining rate environment, a variable mortgage allows your interest costs to drop instantly. However, if inflation spikes, your payments or interest costs rise.
        </p>
        <h3 className="text-xl font-bold mt-4">The Fixed Strategy</h3>
        <p>
          Fixed rates are priced based on the bond market (future expectations). They are "insurance" against rate hikes. If you are on a tight budget and cannot afford a payment increase, fixed is the safe harbour.
        </p>
      </div>
    ),
    faqs: [
      { question: 'Can I switch from variable to fixed?', answer: 'Yes, most lenders allow you to lock in a variable mortgage to a fixed term at any time without penalty.' },
      { question: 'What is the penalty to break a fixed mortgage?', answer: 'Fixed mortgages carry an Interest Rate Differential (IRD) penalty, which can be thousands of dollars. Variable mortgages usually only cost 3 months of interest to break.' },
      { question: 'Why is the variable rate sometimes higher than fixed?', answer: 'In an inverted yield curve environment, short-term money costs more than long-term money, causing variable rates to temporarily exceed fixed rates.' }
    ]
  },

  // --- Category 7: Tools & Triggers ---
  {
    id: '7',
    category: 'Tools & Analytics',
    slug: 'trigger-rate-calculator-explanation',
    title: 'What is a Trigger Rate and How Do I Calculate It?',
    snippet: 'Your trigger rate is the interest rate at which your fixed monthly payment on a variable mortgage no longer covers any principal, covering only the interest. If rates rise above this, your balance may start to grow (negative amortization).',
    content: (
      <div className="space-y-4">
        <p>
          This became a hot topic when the Bank of Canada raised rates rapidly. If you have a variable mortgage with fixed payments (VRM), your payment doesn't change when rates go up—instead, less money goes to principal and more to interest.
        </p>
        <h3 className="text-xl font-bold mt-4">The Trigger Point</h3>
        <p>
          Eventually, you hit a point where 100% of your payment is Interest. This is the Trigger Rate.
        </p>
        <h3 className="text-xl font-bold mt-4">The Trigger Point</h3>
        <p>
          If rates keep rising past the Trigger Rate, the bank isn't getting enough money to cover the interest owed. The unpaid interest is added to your loan balance. This is called the "Trigger Point," and the bank will likely call you to increase your payments or make a lump sum payment.
        </p>
      </div>
    ),
    faqs: [
      { question: 'How do I know my trigger rate?', answer: 'You can check your original mortgage documents or use our Trigger Rate Calculator in the Tools section.' },
      { question: 'What happens if I hit my trigger rate?', answer: 'Typically, your lender will contact you. You may need to increase your monthly payment, make a lump sum payment, or switch to a fixed rate.' },
      { question: 'Do adjustable rate mortgages (ARM) have trigger rates?', answer: 'No. With an ARM, your payment automatically increases every time the Prime rate goes up, so you always cover the interest.' }
    ]
  }
];
