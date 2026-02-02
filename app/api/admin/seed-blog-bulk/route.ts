import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

// --- 1. GENERAL KNOWLEDGE TOPICS (Updated to 2026) ---
const EDUCATIONAL_TOPICS = [
  // MORTGAGES (30)
  { title: "Fixed vs Variable Rates: 2026 Guide", cat: "Mortgage", slug: "fixed-vs-variable-2026" },
  { title: "How the Stress Test Affects Your Buying Power in 2026", cat: "Mortgage", slug: "stress-test-2026" },
  { title: "High Ratio vs Conventional Mortgages", cat: "Mortgage", slug: "high-ratio-vs-conventional" },
  { title: "The Hidden Cost of Breaking a Fixed Mortgage", cat: "Mortgage", slug: "ird-penalty-explained" },
  { title: "Mortgage Pre-Approval Checklist 2026", cat: "Mortgage", slug: "pre-approval-checklist-2026" },
  { title: "Self-Employed Mortgage Qualification Guide", cat: "Mortgage", slug: "self-employed-mortgage-guide" },
  { title: "New to Canada Mortgage Programs 2026", cat: "Mortgage", slug: "new-to-canada-mortgages-2026" },
  { title: "Understanding Mortgage Amortization: 25 vs 30 Years", cat: "Mortgage", slug: "amortization-explained" },
  { title: "What is Mortgage Default Insurance (CMHC)?", cat: "Mortgage", slug: "cmhc-insurance-explained" },
  { title: "Bridge Financing: Buying Before You Sell", cat: "Mortgage", slug: "bridge-financing-guide" },
  { title: "Private Mortgages: 2026 Market Guide", cat: "Mortgage", slug: "private-mortgage-guide-2026" },
  { title: "B-Lender Mortgages: Rates and Fees", cat: "Mortgage", slug: "b-lender-guide" },
  { title: "Refinancing to Consolidate Debt in 2026", cat: "Mortgage", slug: "refinance-debt-consolidation-2026" },
  { title: "The Smith Manoeuvre: Tax Deductible Mortgages", cat: "Mortgage", slug: "smith-manoeuvre-basics" },
  { title: "Collateral vs Standard Charge Mortgages", cat: "Mortgage", slug: "collateral-mortgage-explained" },
  { title: "How Credit Scores Impact Mortgage Rates", cat: "Mortgage", slug: "credit-score-mortgage-impact" },
  { title: "Gifted Down Payments: Rules and Letters", cat: "Mortgage", slug: "gifted-down-payment-rules" },
  { title: "Purchase Plus Improvements Program", cat: "Mortgage", slug: "purchase-plus-improvements" },
  { title: "Reverse Mortgages for Seniors 2026", cat: "Mortgage", slug: "reverse-mortgage-guide-2026" },
  { title: "Renewing Your Mortgage: Don't Sign the First Offer", cat: "Mortgage", slug: "mortgage-renewal-tips" },

  // INSURANCE & WEALTH (30)
  { title: "Term vs Whole Life Insurance: 2026 Comparison", cat: "Insurance", slug: "term-vs-whole-life-2026" },
  { title: "Universal Life Insurance for Business Owners", cat: "Insurance", slug: "universal-life-business" },
  { title: "Critical Illness Insurance: Do You Need It?", cat: "Insurance", slug: "critical-illness-guide" },
  { title: "Mortgage Protection Plan vs Personal Life Insurance", cat: "Insurance", slug: "mpp-vs-life-insurance" },
  { title: "Segregated Funds vs Mutual Funds: 2026 Outlook", cat: "Investment", slug: "seg-funds-vs-mutual-funds-2026" },
  { title: "How to Bypass Probate Fees in Ontario", cat: "Investment", slug: "bypass-probate-ontario" },
  { title: "Corporate Insured Retirement Plans (IRP)", cat: "Investment", slug: "corporate-irp-explained" },
  { title: "Tax-Free Growth with Universal Life", cat: "Investment", slug: "tax-free-growth-ul" },
  { title: "Estate Planning Checklist for Homeowners", cat: "Investment", slug: "estate-planning-checklist" },
  { title: "Protecting Your Estate from Creditors", cat: "Investment", slug: "creditor-protection-seg-funds" },
  { title: "The Capital Dividend Account (CDA) Strategy", cat: "Investment", slug: "cda-strategy-explained" },
  { title: "Key Person Insurance for Corporations", cat: "Insurance", slug: "key-person-insurance" },
  { title: "Disability Insurance for Self-Employed", cat: "Insurance", slug: "disability-insurance-guide" },
  { title: "Leveraged Investing: Borrowing to Invest", cat: "Investment", slug: "leveraged-investing-risks" },
  { title: "TFSA vs RRSP for Down Payments 2026", cat: "Investment", slug: "tfsa-vs-rrsp-homebuyer-2026" },

  // REAL ESTATE & PRE-CON (20)
  { title: "Pre-Construction Closing Costs Explained", cat: "Real Estate", slug: "pre-con-closing-costs" },
  { title: "The Risks of Assignment Sales in 2026", cat: "Real Estate", slug: "assignment-sale-risks-2026" },
  { title: "HST Rebates for Investors", cat: "Real Estate", slug: "hst-rebate-investors" },
  { title: "Tarion Warranty: What is Covered?", cat: "Real Estate", slug: "tarion-warranty-guide" },
  { title: "Buying a Condo: Status Certificates", cat: "Real Estate", slug: "status-certificate-explained" },
  { title: "Land Transfer Tax Rebates 2026", cat: "Real Estate", slug: "ltt-rebate-guide-2026" },
  { title: "The 10-Day Cooling Off Period", cat: "Real Estate", slug: "cooling-off-period-explained" },
  { title: "Investing in Student Housing 2026", cat: "Real Estate", slug: "student-housing-investment-2026" },
  { title: "Commercial Property Classes in Ontario", cat: "Commercial", slug: "commercial-property-classes" },
  { title: "Cap Rates Explained for Investors", cat: "Commercial", slug: "cap-rates-explained" },

  // LEGAL & CLOSING (20)
  { title: "Closing Day 2026: What Happens?", cat: "Legal", slug: "closing-day-walkthrough-2026" },
  { title: "Title Insurance: Why It Is Mandatory", cat: "Legal", slug: "title-insurance-explained" },
  { title: "Joint Tenancy vs Tenants in Common", cat: "Legal", slug: "joint-tenancy-vs-common" },
  { title: "Statement of Adjustments Explained", cat: "Legal", slug: "statement-adjustments-guide" },
  { title: "Non-Resident Speculation Tax (NRST) Update", cat: "Legal", slug: "nrst-tax-guide-2026" },
  { title: "Power of Attorney for Real Estate", cat: "Legal", slug: "poa-real-estate" },
  { title: "Agreement of Purchase and Sale Clauses", cat: "Legal", slug: "aps-clauses-guide" },
  { title: "Spousal Consent in Real Estate", cat: "Legal", slug: "spousal-consent-matrimonial" },
  { title: "Understanding Liens and Encumbrances", cat: "Legal", slug: "property-liens-explained" },
  { title: "The Role of a Real Estate Lawyer", cat: "Legal", slug: "real-estate-lawyer-role" }
];

// --- 2. CONTENT GENERATOR (2026 CONTEXT) ---
function generateContent(title: string, category: string) {
  return `
    <p class="lead"><strong>Executive Summary:</strong> ${title} is a critical concept for Canadian homeowners and investors in 2026. Understanding this can save you thousands in interest, taxes, or legal fees.</p>
    
    <h3>Why This Matters in 2026</h3>
    <p>The economic landscape of 2026 brings new challenges and opportunities for ${category.toLowerCase()} planning. Whether you are entering the market or restructuring your portfolio, the rules have evolved.</p>
    
    <h3>Key Components</h3>
    <ul>
      <li><strong>Regulation:</strong> How current federal and provincial mandates impact this topic.</li>
      <li><strong>Financial Impact:</strong> The direct effect on your monthly cash flow and net worth in today's rate environment.</li>
      <li><strong>Strategy:</strong> How IndiBrick advisors structure this for maximum benefit.</li>
    </ul>

    <h3>IndiBrick Strategy</h3>
    <p>We don't just look at the transaction; we look at the lifecycle. For ${title}, we recommend a personalized review of your portfolio to ensure alignment with 2026 market conditions.</p>

    <h3>Next Steps</h3>
    <p>Don't rely on outdated advice. <a href="/contact">Book a strategy call</a> with our specialized ${category} team today.</p>
  `;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('key');
  const secret = process.env.NEXT_PUBLIC_ADMIN_OTP;

  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
  }

  try {
    const generatedPosts = [];
    
    for (const topic of EDUCATIONAL_TOPICS) {
      const post = {
        id: topic.slug,
        title: topic.title,
        slug: topic.slug,
        category: topic.cat,
        author: "IndiBrick Intelligence",
        date: new Date().toISOString(),
        excerpt: `A comprehensive guide to ${topic.title}. Expert analysis on ${topic.cat} strategy for Ontario residents in 2026.`,
        imageUrl: `https://source.unsplash.com/800x600/?${topic.cat.toLowerCase()},finance`,
        content: generateContent(topic.title, topic.cat),
        status: 'published'
      };
      
      await setDoc(doc(db, "posts", post.slug), post);
      generatedPosts.push(post.title);
    }

    return NextResponse.json({ 
      success: true, 
      count: generatedPosts.length,
      message: "Knowledge Base (2026 Edition) Populated Successfully",
      sample: generatedPosts.slice(0, 5) 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}