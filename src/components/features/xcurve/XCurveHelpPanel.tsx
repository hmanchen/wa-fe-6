"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

type XCurveHelpCaseData = {
  coverageGap: number;
  incomeI: number;
  multiplierYears: number;
  retirementAge: number;
  crossingPointAge: number | null;
  monthlyRetirementGap: number;
  primaryClientName: string;
};

type XCurveHelpPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  caseData: XCurveHelpCaseData;
};

type SectionId = "section1" | "section2" | "section3" | "section4" | "section5";

const SECTION_COLORS: Record<SectionId, string> = {
  section1: "#1F5C99",
  section2: "#FF9900",
  section3: "#0D3B6E",
  section4: "#2E7D32",
  section5: "#6B7280",
};

function money(value: number): string {
  return `$${Math.round(Math.max(0, value)).toLocaleString()}`;
}

function estMoney(value: number): string {
  return `~$${Math.round(Math.max(0, value)).toLocaleString()}`;
}

function SectionBlock({
  id,
  number,
  icon,
  title,
  expanded,
  onToggle,
  children,
}: {
  id: SectionId;
  number: number;
  icon: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white" style={{ borderLeftWidth: "4px", borderLeftColor: SECTION_COLORS[id] }}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
            {number}
          </span>
          <span className="text-sm font-bold text-[#111827]">{icon} {title}</span>
        </div>
        {expanded ? <ChevronUp className="size-4 text-slate-500" /> : <ChevronDown className="size-4 text-slate-500" />}
      </button>
      <div className={`grid transition-all duration-300 ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="space-y-3 px-3 pb-3 text-[13px] leading-relaxed text-[#374151]">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function XCurveHelpPanel({ isOpen, onClose, caseData }: XCurveHelpPanelProps) {
  const [expanded, setExpanded] = useState<Record<SectionId, boolean>>({
    section1: true,
    section2: false,
    section3: false,
    section4: false,
    section5: false,
  });

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const crossingText = useMemo(() => {
    if (caseData.crossingPointAge === null) return "Age beyond 90";
    return `Age ${Math.round(caseData.crossingPointAge)}`;
  }, [caseData.crossingPointAge]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/35" onClick={onClose}>
      <aside
        className="ml-auto flex h-full w-full flex-col bg-white shadow-2xl sm:w-[480px]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Understanding the Financial X Curve"
      >
        <header className="flex items-start justify-between bg-[#0D3B6E] px-4 py-3 text-white">
          <div>
            <h3 className="text-base font-bold">📊 Understanding the Financial X Curve</h3>
            <p className="text-xs text-slate-100">A plain-English guide to every number on this screen</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10" aria-label="Close help panel">
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-white p-3">
          <div className="space-y-3">
            <SectionBlock
              id="section1"
              number={1}
              icon="📈"
              title="WHAT IS THE X CURVE?"
              expanded={expanded.section1}
              onToggle={() => setExpanded((prev) => ({ ...prev, section1: !prev.section1 }))}
            >
              <p>The X Curve shows two things happening at the same time throughout your lifetime — and where they cross.</p>
              <p><strong>THE RED LINE — Your Financial Responsibility</strong><br />This line starts high and goes down over time. It represents everything your family depends on you for: your mortgage, your income, your children&apos;s education, your debts. As you get older, you pay off the mortgage, the kids grow up, and your debts shrink. Your responsibility naturally decreases.</p>
              <p><strong>THE GREEN LINE — Your Money and Savings</strong><br />This line starts low and goes up over time. It represents everything you have saved and invested: your 401k, your savings accounts, your investments. As you keep working and saving, this grows.</p>
              <p><strong>THE CROSSING POINT</strong><br />At some point, these two lines cross. That is the moment your accumulated wealth exceeds your remaining financial responsibility. After that point, your money is working harder than you need it to.</p>
              <p><strong>WHY THIS MATTERS</strong><br />The gap between the red line and the green line TODAY is your protection gap — the amount your family would be short if something happened to you right now. The goal of financial planning is to close that gap as quickly as possible.</p>
            </SectionBlock>

            <SectionBlock
              id="section2"
              number={2}
              icon="🧾"
              title="THE LEFT PANEL: YOUR CURRENT EXPENSES"
              expanded={expanded.section2}
              onToggle={() => setExpanded((prev) => ({ ...prev, section2: !prev.section2 }))}
            >
              <p>The checklist on the left shows your major financial obligations today — the things the green line needs to eventually replace.</p>
              <p><strong>WHERE EACH VALUE COMES FROM:</strong></p>
              <p>✓ Housing (PITI)<br />This is your actual monthly mortgage payment including Principal, Interest, Property Taxes, and Insurance — exactly as you entered it in Financial Background → Real Estate.<br /><span className="text-[11px] text-[#9CA3AF]">From: Financial Background → Real Estate</span></p>
              <p>✓ Food / Groceries<br />From the amount entered in Financial Background → Monthly Expenses → Food/Groceries category.<br /><span className="text-[11px] text-[#9CA3AF]">From: Financial Background → Monthly Expenses</span></p>
              <p>✓ Childcare / Education<br />From Financial Background → Monthly Expenses → Childcare/Education category.<br /><span className="text-[11px] text-[#9CA3AF]">From: Financial Background → Monthly Expenses</span></p>
              <p>✓ Transportation<br />From Financial Background → Monthly Expenses → Transportation category.<br /><span className="text-[11px] text-[#9CA3AF]">From: Financial Background → Monthly Expenses</span></p>
              <p>⚠ Healthcare — Not Captured<br />Healthcare expenses were not entered in Monthly Expenses. Enter them for a more complete picture.</p>
              <p>✓ Debts — $X total<br />The total outstanding balance of all debts entered in Financial Background → Debts &amp; Liabilities. (Auto loan + credit cards + student loans, etc.) This is a TOTAL BALANCE, not a monthly payment.<br /><span className="text-[11px] text-[#9CA3AF]">From: Financial Background → Debts &amp; Liabilities</span></p>
              <p>✓ Mortgage — $X<br />The current outstanding balance on your primary home mortgage — from Financial Background → Real Estate → Mortgage balance field.<br /><span className="text-[11px] text-[#9CA3AF]">From: Financial Background → Real Estate</span></p>
              <p><strong>THE MILESTONES ✓</strong><br />The checkmarks below show key financial milestones in your timeline — when your mortgage will be paid off, when your children reach independence, when you become debt-free, and when your passive income target is reached.</p>
              <p><strong>HOW THESE MILESTONES ARE CALCULATED:</strong><br />&quot;Mortgage off by age X&quot; — calculated from your current age plus the remaining term on your mortgage as entered in the Real Estate section.</p>
              <p>&quot;Consumer debt-free by age X&quot; — estimated from your current debt balances and monthly payments.</p>
              <p>&quot;$X/mo passive&quot; — your target monthly retirement income, equal to your current total monthly expenses.</p>
            </SectionBlock>

            <SectionBlock
              id="section3"
              number={3}
              icon="🛡️"
              title="DIME ANALYSIS: YOUR LIFE INSURANCE NEED"
              expanded={expanded.section3}
              onToggle={() => setExpanded((prev) => ({ ...prev, section3: !prev.section3 }))}
            >
              <p>DIME stands for Debt, Income, Mortgage, Education. It is a financial planning framework used by insurance professionals to estimate how much life insurance a family needs. Each letter represents a different financial risk your family faces.</p>
              <p><strong>D — DEBT</strong><br />What it is: Every outstanding debt your family would need to pay off immediately.</p>
              <p>Where it comes from: All entries in Financial Background → Debts &amp; Liabilities.<br />Auto loans + Credit cards + Student loans + Medical debt + Personal loans = D total</p>
              <p>Why it matters: If you pass away, your family inherits your debts. Life insurance ensures they can pay them off immediately without financial strain.</p>
              <p><strong>I — INCOME REPLACEMENT</strong><br />What it is: The amount needed to replace your income for your family for a set number of years.</p>
              <p>Where it comes from:<br />Your household annual income × your chosen income replacement multiplier (in years).</p>
              <p>Annual income comes from: Financial Background → Employment &amp; Income → Total household income.</p>
              <p>The multiplier (number of years) is selected on the Income Replacement Risk screen. It auto-selects based on your youngest child&apos;s age — specifically, the number of years until that child reaches financial independence at approximately age 22.</p>
              <p>Example: If your youngest child is age 6, they reach independence in 16 years. So: $365,000/yr × 16 years = $5,840,000</p>
              <p>Why it matters: This is almost always the largest part of the DIME calculation. Your income funds everything — the mortgage, the groceries, the school fees, the retirement savings. Without it, your family&apos;s entire financial plan collapses.</p>
              <p><strong>M — MORTGAGE</strong><br />What it is: The remaining balance on your primary home mortgage.</p>
              <p>Where it comes from: Financial Background → Real Estate → Mortgage balance field.</p>
              <p>Why it matters: Your family should be able to stay in their home if something happens to you. Life insurance can pay off the mortgage entirely.</p>
              <p><strong>E — EDUCATION</strong><br />What it is: The estimated total cost of college for your children, less any savings already set aside.</p>
              <p>Where it comes from: Calculated using:<br />• Your children&apos;s current ages (from case setup)<br />• Years until each child starts college (at age 18)<br />• Current average 4-year college cost<br />• A 5% annual tuition inflation rate applied over the years until enrollment<br />• Less any existing 529 Plan savings entered in Financial Background → College Savings</p>
              <p>Example: If your child is age 6, college starts in 12 years. Current 4-year cost: ~$38,000/yr. Inflated at 5% for 12 years = ~$68,000/yr. Total 4-year need: ~$272,000. Less 529 savings = net E component.</p>
              <p>Why it matters: Your children&apos;s education funding is at risk if your income disappears. Life insurance ensures their education is funded no matter what.</p>
              <p><strong>ESTATE / PROBATE</strong><br />What it is: The estimated cost of probate court — the legal process that distributes your assets after you pass away, IF you do not have a trust.</p>
              <p>Where it comes from: Estimated as approximately 3% of your gross estate value (the total value of everything you own). This is the typical rate for states like Tennessee, Georgia, and California. If you have a Revocable Living Trust in place (entered in Protection &amp; Estate), this cost drops to $0 — trusts bypass probate entirely.</p>
              <p><strong>THE DIME MATH</strong></p>
              <div className="rounded bg-slate-100 p-2 font-mono text-xs text-slate-700">
                GROSS RISK = D + I + M + E + Probate Cost<br />
                MINUS Existing Assets = NET RISK<br />
                MINUS Existing Life Insurance = COVERAGE GAP
              </div>
              <p>The Coverage Gap is the dollar amount of additional life insurance your family needs right now.</p>
            </SectionBlock>

            <SectionBlock
              id="section4"
              number={4}
              icon="🌅"
              title="RETIREMENT PROJECTION"
              expanded={expanded.section4}
              onToggle={() => setExpanded((prev) => ({ ...prev, section4: !prev.section4 }))}
            >
              <p>This section answers the question: &quot;IF YOU OUTLIVE YOUR SAVINGS — will you have enough money to live comfortably through retirement?&quot;</p>
              <p><strong>YOUR ESTIMATED RETIREMENT EXPENSES</strong><br />These are your projected monthly living costs during retirement. Most categories come directly from what you entered in Financial Background → Monthly Expenses. Some use estimates when not entered:</p>
              <p>Food / Groceries → from your Monthly Expenses entry<br />Utilities → from your Monthly Expenses entry<br />Transportation → from your Monthly Expenses entry<br />Other (miscellaneous) → from your Monthly Expenses entry (or estimated at ~$400/mo minimum if blank)</p>
              <p>Insurance Premiums → estimated at $600/mo (covers health insurance in retirement — enter actual amount in Monthly Expenses for a more precise figure)</p>
              <p>Medical / Healthcare → estimated at $1,000/mo (typical for retirees not yet on Medicare, or for supplemental costs after Medicare — enter actual amount if known)</p>
              <p>Housing (blended average) → calculated over the full 30-year retirement period:<br />• While mortgage is active: your full PITI<br />• After mortgage payoff: taxes + insurance only (estimated at 12% of PITI)<br />• The two phases are blended into one monthly average across all 30 retirement years.</p>
              <p><strong>THE RETIREMENT INCOME MATH</strong></p>
              <p><strong>HOW PROJECTED WEALTH AT RETIREMENT IS CALCULATED:</strong><br />Start with your current total assets today. Add your estimated annual savings rate (calculated from your income minus expenses). Compound both at an assumed 6% annual growth rate over the years until your retirement goal age. Then subtract your estimated remaining mortgage balance at retirement (if mortgage not yet paid). The result is your estimated total wealth at retirement.</p>
              <p><strong>HOW 401k WITHDRAWAL IS CALCULATED:</strong><br />Uses the widely accepted &quot;4% Rule&quot; — a guideline suggesting you can withdraw 4% of your retirement savings per year without running out of money over a 30-year retirement. 401k Withdrawal = Projected 401k balance × 4%. This is an estimate — not a guarantee.</p>
              <p><strong>HOW SOCIAL SECURITY IS INCLUDED:</strong><br />Uses the monthly benefit estimate you entered in Financial Background → Investments &amp; Assets → Social Security Estimate. Important: Social Security cannot be claimed before age 62. If your retirement goal is before age 62, there will be an income gap in the early years of retirement until SS begins.</p>
              <p><strong>THE RETIREMENT GAP:</strong><br />Annual Need (expenses × 12) − Total Annual Income (401k withdrawal + SS) = Annual Gap (or surplus) ÷ 12 = Monthly Gap</p>
              <p>If the gap is positive, your projected income falls short of your projected needs — meaning you need additional savings, a later retirement, or reduced expenses to close the gap.</p>
              <p><strong>IMPORTANT NOTES ABOUT ALL PROJECTIONS</strong><br />All numbers in the Retirement Projection are estimates based on:<br />• Information you provided today<br />• Assumed investment growth of 6% per year<br />• Assumed 5% college cost inflation<br />• Assumed 3% probate rate by state<br />• The 4% safe withdrawal rule<br />• National average cost benchmarks where specific data was not provided</p>
              <p>Actual outcomes will differ based on market conditions, tax law changes, health, spending patterns, and many other factors. This is not a retirement plan and does not constitute investment or financial advice.</p>
            </SectionBlock>

            <SectionBlock
              id="section5"
              number={5}
              icon="🔢"
              title="YOUR KEY NUMBERS AT A GLANCE"
              expanded={expanded.section5}
              onToggle={() => setExpanded((prev) => ({ ...prev, section5: !prev.section5 }))}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded border border-slate-200 bg-slate-50 p-2">
                  <p className="text-[11px] text-[#9CA3AF]">What we need to protect your family</p>
                  <p className="text-xs text-slate-600">Coverage Gap</p>
                  <p className="text-sm font-bold text-[#0D3B6E]">{money(caseData.coverageGap)}</p>
                  <p className="mt-1 text-xs text-slate-600">Largest component: Income ({money(caseData.incomeI)}, {caseData.multiplierYears} yrs)</p>
                </div>
                <div className="rounded border border-slate-200 bg-slate-50 p-2">
                  <p className="text-[11px] text-[#9CA3AF]">What retirement looks like</p>
                  <p className="text-xs text-slate-600">Retirement Goal: Age {caseData.retirementAge}</p>
                  <p className="text-xs text-slate-600">Crossing Point: {crossingText}</p>
                  <p className="text-xs text-slate-600">Monthly Gap at retire: {estMoney(caseData.monthlyRetirementGap)}/mo</p>
                </div>
              </div>
              {caseData.monthlyRetirementGap > 0 ? (
                <p>Additional savings or SS income could close this gap.</p>
              ) : null}
              {caseData.crossingPointAge !== null && caseData.crossingPointAge < caseData.retirementAge ? (
                <p>✅ Your savings will exceed your responsibilities by age {Math.round(caseData.crossingPointAge)} — before your retirement goal of age {caseData.retirementAge}. Strong trajectory.</p>
              ) : (
                <p>⚠️ Your savings are projected to exceed your responsibilities at {crossingText.toLowerCase()} — after your retirement goal of age {caseData.retirementAge}. Accelerating savings now can help close this gap.</p>
              )}
              <p className="text-[11px] text-[#9CA3AF]">For {caseData.primaryClientName || "this client"}: these values are pulled live from the current case and refresh when calculations update.</p>
            </SectionBlock>
          </div>
        </div>

        <footer className="flex items-center justify-between border-t bg-white px-4 py-3">
          <p className="text-[11px] text-slate-500">📋 All projections are estimates. Not financial or investment advice.</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </footer>
      </aside>
    </div>
  );
}
