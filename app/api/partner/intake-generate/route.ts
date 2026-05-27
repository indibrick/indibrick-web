import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Partner-side AI intake — structured form in, prose summary + tailored doc checklist out.
 *
 * Called by app/partner/page.tsx when the agent hits "Generate" on the intake form.
 * NOTHING is emailed yet. The agent reviews/edits in the UI and then POSTs to
 * /api/partner/intake-send to actually save and notify the client.
 *
 * This endpoint:
 *   1. Performs RAG retrieval against `knowledge_base` (B-20 rules, lender programs)
 *   2. Asks Gemini for an underwriter-grade prose summary + tailored document checklist
 *      shaped to the goal (Purchase / Refi / Renewal), employment type, and credit band
 *   3. Falls back to a hand-built checklist if AI fails so the agent never sees an empty result
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const { formData, financials, leadId, clientName, agentName } = await req.json();

    if (!formData) {
      return NextResponse.json({ error: 'Missing formData' }, { status: 400 });
    }

    // =================================================================
    // RAG: pull relevant brokerage-trained knowledge for the prompt context
    // =================================================================
    let retrievedContext = '';
    if (apiKey && adminDb) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
        const searchPhrase = `${formData.goal} mortgage ${formData.empType} ${formData.creditScore} credit ${formData.hasRentalIncome === 'Yes' ? 'rental income' : ''}`;
        const embeddingResult = await embeddingModel.embedContent(searchPhrase);
        const vector = embeddingResult.embedding.values.slice(0, 768);
        const vectorQuery = adminDb
          .collection('knowledge_base')
          .findNearest('embedding', FieldValue.vector(vector), { limit: 3, distanceMeasure: 'COSINE' });
        const searchResults = await vectorQuery.get();
        retrievedContext = searchResults.docs.map((d) => d.data().text).join('\n\n');
      } catch (e) {
        console.warn('RAG retrieval skipped', e);
      }
    }

    // =================================================================
    // ASK GEMINI for a summary + checklist tailored to this exact file
    // =================================================================
    let aiSummary = '';
    let aiChecklist: string[] = [];

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const prompt = `
You are an elite Canadian mortgage underwriter at IndiBrick Financial (Ontario, brokered via Pineapple Lic #12830).
An agent has just finished phone intake with a client and submitted this structured data:

CLIENT: ${clientName || 'Unknown'}
GOAL: ${formData.goal}${formData.goal === 'Purchase' ? ` | FTHB: ${formData.fthb}` : ''}

SUBJECT PROPERTY
- Address: ${formData.subjectAddress || '(not provided)'}
- ${formData.goal === 'Purchase' ? 'Purchase price' : 'Estimated market value'}: $${formData.propertyValue || 0}
- Annual property taxes: $${formData.propertyTaxes || 0}
- Generates rental income: ${formData.hasRentalIncome}${formData.hasRentalIncome === 'Yes' ? ` ($${formData.monthlyRent}/mo, basement ${formData.basementStatus})` : ''}

${formData.goal === 'Purchase'
  ? `DOWN PAYMENT
- Amount: $${formData.downPayment || 0}
- Source: ${formData.downPaymentSource || 'Savings'}`
  : `EXISTING MORTGAGE
- Lender: ${formData.currentLender || 'Unknown'}
- Balance: $${formData.currentBalance || 0}
- Rate: ${formData.currentRate || 'Unknown'}%
- Renewal/Maturity: ${formData.renewalDate || 'Unknown'}`}

APPLICANTS (${formData.numApplicants}), credit ${formData.creditScore}
- Applicant 1: ${formData.empType}, income $${formData.annualIncome || 0}/yr${formData.empType.startsWith('Self-Employed') ? ` (Line 15000 last yr: $${formData.incomeYear1 || 0}, prior yr: $${formData.incomeYear2 || 0})` : ''}
${formData.numApplicants !== '1' ? `- Applicant 2: ${formData.coEmpType}, income $${formData.coAnnualIncome || 0}/yr${formData.coEmpType.startsWith('Self-Employed') ? ` (Line 15000 last yr: $${formData.coIncomeYear1 || 0}, prior yr: $${formData.coIncomeYear2 || 0})` : ''}` : ''}

LIABILITIES
- Monthly consumer debt payments: $${formData.monthlyDebtPayments || 0}${formData.substantialDebts ? ` (${formData.substantialDebts})` : ''}
- Other properties owned: ${(formData.otherPropertiesList || []).length}
${(formData.otherPropertiesList || []).map((p: any, i: number) => `  Property ${i + 1}: ${p.address} | value $${p.value || 0} | balance $${p.balance || 0} | rent $${p.rent || 0}/mo | payment $${p.payment || 0}/mo`).join('\n')}

PRE-COMPUTED METRICS (already calculated in code, you can reference them)
- LTV ~${(() => {
            const pv = Number(formData.propertyValue || 0);
            const mtg = formData.goal === 'Purchase' ? Math.max(0, pv - Number(formData.downPayment || 0)) : Number(formData.currentBalance || 0);
            return pv > 0 ? ((mtg / pv) * 100).toFixed(1) : 'N/A';
          })()}%
- Mortgage required: $${formData.goal === 'Purchase' ? Math.max(0, Number(formData.propertyValue || 0) - Number(formData.downPayment || 0)) : Number(formData.currentBalance || 0)}

KNOWLEDGE BASE (apply strictly):
${retrievedContext || 'Standard Canadian B-20 rules. CMHC insurance required when LTV > 80% (Purchase only, max $1.5M). Self-employed needs 2 years T1 Generals or NoAs. Rental income offset typical at 50% (some lenders 80%).'}

OUTPUT JSON ONLY (no markdown), shape:
{
  "summary": "A clean, client-readable recap of the information collected, used so the CLIENT can confirm it is accurate. Use EXACTLY these five labelled sections, each starting on its own line, in this order:\\nPURPOSE: <goal + subject property address + purchase price or market value + down payment OR current mortgage details>\\nPROFILE: <number of applicants, first-time buyer status, and the rental situation on the subject property>\\nPROPERTIES: <list EVERY property on file, each as its own line beginning with '- '. FIRST the SUBJECT property with its full street address and value/price, THEN one line per additional property owned showing its full street address, estimated value, mortgage balance, and monthly rent. If there are no additional properties, write a single line '- Subject property only.'>\\nINCOME: <employment type(s) and stated income for each applicant>\\nCREDIT: <estimated credit score range and total monthly debt payments>\\nWrite it factually in plain text as a data recap (no risk assessment, no lender recommendation, no LTV/GDS/TDS — those are handled separately). ALWAYS write out every street address verbatim so the client can confirm it; never collapse multiple properties into a count.",
  "checklist": ["10-14 tailored document requirements as plain strings. ALWAYS include '2 pieces of Photo ID (no Ontario Health Cards)' first. Add docs specific to: the goal, the employment type (T4 vs Self-Employed vs Hourly), rental income, co-applicants, other properties owned, refi/renewal extras like mortgage statement and property tax bill."]
}`;

        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text());
        if (typeof parsed.summary === 'string') aiSummary = parsed.summary.trim();
        if (Array.isArray(parsed.checklist)) aiChecklist = parsed.checklist.filter((s: any) => typeof s === 'string' && s.trim());
      } catch (e) {
        console.warn('AI summary/checklist generation failed; falling back to deterministic checklist', e);
      }
    }

    // =================================================================
    // FALLBACK CHECKLIST — guarantees the agent never sees an empty list
    // =================================================================
    if (aiChecklist.length === 0) {
      const cl = ['2 pieces of Photo ID (no Ontario Health Cards)'];
      // Income docs by employment type
      const empBlock = (emp: string, label: string) => {
        if (emp.startsWith('T4')) cl.push(`${label}: Most recent paystub (within 30 days)`, `${label}: 2024 T4 + 2024 Notice of Assessment`, `${label}: Employment Letter (signed, dated within 60 days)`);
        else if (emp.startsWith('Self-Employed')) cl.push(`${label}: T1 General + Statement of Business Activities (last 2 years)`, `${label}: Notices of Assessment (last 2 years)`, `${label}: Business license OR HST registration OR Articles of Incorporation`);
        else if (emp.startsWith('Hourly')) cl.push(`${label}: Last 4 weeks of paystubs`, `${label}: 2024 T4 + 2024 NoA`, `${label}: Employment Letter detailing guaranteed hours`);
      };
      empBlock(formData.empType, 'Applicant 1');
      if (formData.numApplicants !== '1') empBlock(formData.coEmpType, 'Applicant 2');

      // Down payment proof (Purchase only)
      if (formData.goal === 'Purchase') {
        cl.push('90-day history of all bank/investment accounts holding the down payment (full statements, no screenshots)');
        if (formData.downPaymentSource === 'Gift') cl.push('Signed gift letter + proof of donor deposit');
        if (formData.downPaymentSource === 'RRSP HBP') cl.push('RRSP withdrawal confirmation under Home Buyer\'s Plan');
        if (formData.downPaymentSource === 'Sale of Property') cl.push('Sale agreement + mortgage payout statement for the property being sold');
      }

      // Existing mortgage docs (Refi / Renewal)
      if (formData.goal !== 'Purchase') {
        cl.push('Most recent mortgage statement (showing balance + maturity date)', 'Annual property tax bill', 'Insurance policy declaration page');
      }

      // Subject property
      cl.push('Purchase & Sale Agreement (signed) + MLS listing', 'Property tax bill (or estimated tax assessment)');
      if (formData.hasRentalIncome === 'Yes') cl.push('Signed lease agreement(s) covering rental income claimed');

      // Other properties
      if ((formData.otherPropertiesList || []).length > 0) {
        cl.push('For each rental/secondary property owned: mortgage statement, property tax bill, lease agreement');
      }

      aiChecklist = cl;
    }

    // =================================================================
    // FALLBACK SUMMARY — bullet-proof string if AI didn't return one
    // =================================================================
    if (!aiSummary) {
      const pv = Number(formData.propertyValue || 0);
      const otherList = (formData.otherPropertiesList || []) as any[];
      const purposeLine = formData.goal === 'Purchase'
        ? `${formData.goal} of ${formData.subjectAddress || 'subject property'} at $${pv.toLocaleString()}, down payment $${Number(formData.downPayment || 0).toLocaleString()} (${formData.downPaymentSource}).`
        : `${formData.goal} on ${formData.subjectAddress || 'subject property'} valued at $${pv.toLocaleString()}; current mortgage $${Number(formData.currentBalance || 0).toLocaleString()} with ${formData.currentLender || 'current lender'} at ${formData.currentRate || 'N/A'}% (renews ${formData.renewalDate || 'N/A'}).`;
      const incomeLine = formData.numApplicants === '1'
        ? `Applicant 1: ${formData.empType}, $${Number(formData.annualIncome || 0).toLocaleString()}/yr.`
        : `Applicant 1: ${formData.empType}, $${Number(formData.annualIncome || 0).toLocaleString()}/yr. Applicant 2: ${formData.coEmpType}, $${Number(formData.coAnnualIncome || 0).toLocaleString()}/yr.`;
      // List the subject property first, then every additional property with its full address.
      const propertyLines = [
        `- Subject: ${formData.subjectAddress || '(address not provided)'} — ${formData.goal === 'Purchase' ? 'price' : 'value'} $${pv.toLocaleString()}${formData.hasRentalIncome === 'Yes' ? `, rent $${Number(formData.monthlyRent || 0).toLocaleString()}/mo` : ''}`,
        ...otherList.map((p: any, i: number) => `- Property ${i + 1}: ${p.address || '(address not provided)'} — value $${Number(p.value || 0).toLocaleString()}, balance $${Number(p.balance || 0).toLocaleString()}, rent $${Number(p.rent || 0).toLocaleString()}/mo`),
      ];
      aiSummary = [
        `PURPOSE: ${purposeLine}`,
        `PROFILE: ${formData.numApplicants} applicant(s)${formData.goal === 'Purchase' ? `, first-time buyer: ${formData.fthb}` : ''}${formData.hasRentalIncome === 'Yes' ? `, subject earns $${Number(formData.monthlyRent || 0).toLocaleString()}/mo rent` : ''}.`,
        `PROPERTIES:\n${propertyLines.join('\n')}`,
        `INCOME: ${incomeLine}`,
        `CREDIT: Estimated score ${formData.creditScore}; monthly consumer debt $${Number(formData.monthlyDebtPayments || 0).toLocaleString()}${formData.substantialDebts ? ` (${formData.substantialDebts})` : ''}.`,
      ].join('\n');
    }

    return NextResponse.json({
      summary: aiSummary,
      checklist: aiChecklist,
      financials,
      agentName,
      leadId,
    });
  } catch (error: any) {
    console.error('intake-generate error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
