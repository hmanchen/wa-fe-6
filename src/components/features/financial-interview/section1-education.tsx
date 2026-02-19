"use client";

import {
  Info,
  Lightbulb,
  TrendingUp,
  DollarSign,
  PiggyBank,
  Landmark,
  BarChart3,
  Send,
  Shield,
  GraduationCap,
  Building,
  Home,
  Bitcoin,
  Award,
  Briefcase,
  Wallet,
  Receipt,
} from "lucide-react";

// ── Step-specific educational content ────────────────────────

interface EducationItem {
  icon: React.ReactNode;
  title: string;
  points: string[];
}

const STEP_EDUCATION: Record<string, EducationItem[]> = {
  background: [
    {
      icon: <Info className="size-3.5 text-blue-500" />,
      title: "Why this matters",
      points: [
        "Employment history reveals income trajectory and benefits eligibility",
        "Years in country affects Social Security / CPP benefits calculation",
        "401k decisions at job changes can significantly impact retirement",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Key talking points",
      points: [
        "Ask about employer match — free money left on the table?",
        "Old 401k rolled over or still with previous employer?",
        "Is the client maximizing their contribution ($23,500 for 2026)?",
        "Catch-up contribution available if 50+",
      ],
    },
  ],
  income: [
    {
      icon: <Wallet className="size-3.5 text-green-600" />,
      title: "Income — the foundation of every plan",
      points: [
        "Annual salary is the starting point for needs analysis, insurance amounts, and retirement projections",
        "Include base salary, bonuses, commissions, and any side income",
        "Dual-income households have higher replacement needs but also more flexibility",
        "Pay frequency affects cash flow planning (bi-weekly = 26 paychecks, not 24)",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Advisor tips",
      points: [
        "Ask about expected salary growth — promotions, job changes coming?",
        "Bonus/commission income: is it reliable or variable?",
        "Side income (rental, freelance) may not have employer benefits — factor that in",
      ],
    },
  ],
  expenses: [
    {
      icon: <Receipt className="size-3.5 text-orange-500" />,
      title: "Monthly expenses — where the money goes",
      points: [
        "Total monthly expenses determine the income replacement need",
        "Housing is typically 25-35% of gross income — is the client overextended?",
        "Income minus expenses = surplus available for savings, insurance, and investments",
        "Lifestyle inflation: expenses often rise faster than income",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Key insights",
      points: [
        "If expenses are close to income, the client is vulnerable — even small disruptions hurt",
        "Look for easy wins: subscriptions, dining out, unused memberships",
        "The expense total feeds directly into DIME/FIME analysis and insurance needs",
        "Ask: 'If income stopped tomorrow, how many months could you cover these expenses?'",
      ],
    },
  ],
  retirement401k: [
    {
      icon: <Landmark className="size-3.5 text-blue-600" />,
      title: "401(k) — the cornerstone of retirement savings",
      points: [
        "Tax-deferred growth — contributions reduce taxable income",
        "2026 limit: $23,500 ($31,000 if 50+)",
        "Employer match is FREE MONEY — not maximizing match = leaving money on the table",
        "Typical employer match: 3-6% of salary",
        "Early withdrawal before 59½: 10% penalty + income tax",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Critical questions",
      points: [
        "Is the client getting the FULL employer match? If not, increase contribution immediately",
        "Old 401(k) sitting with a previous employer? May have high fees — consider rolling to IRA",
        "Roth 401(k) option available? Great for younger clients in lower tax brackets",
        "Target-date fund vs. self-directed — is the allocation appropriate for their age?",
        "Loans against 401(k)? Reduces growth and creates risk if leaving employer",
      ],
    },
  ],
  hsa: [
    {
      icon: <TrendingUp className="size-3.5 text-green-500" />,
      title: "HSA — Triple tax advantage",
      points: [
        "Contributions are tax-deductible (pre-tax)",
        "Growth is tax-free",
        "Withdrawals for qualified medical expenses are tax-free",
        "2026 limits: $4,300 individual / $8,550 family",
        "After 65, can withdraw for any purpose (taxed as income)",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Advisor tips",
      points: [
        "HSA is the only triple-tax-advantaged account",
        "Best strategy: max out HSA, pay medical from pocket, let HSA grow",
        "Receipts can be reimbursed years later — keep all receipts",
      ],
    },
  ],
  ira: [
    {
      icon: <Landmark className="size-3.5 text-indigo-500" />,
      title: "Traditional IRA basics",
      points: [
        "Contributions may be tax-deductible depending on income & employer plan",
        "2026 limit: $7,000 ($8,000 if 50+)",
        "Grows tax-deferred — pay taxes on withdrawal",
        "RMDs start at age 73",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Advisor tips",
      points: [
        "If income too high for Roth, consider backdoor Roth conversion",
        "SEP IRA for self-employed: up to $69,000 (2026)",
        "SIMPLE IRA: smaller employers, lower limits",
      ],
    },
  ],
  rothIra: [
    {
      icon: <DollarSign className="size-3.5 text-emerald-500" />,
      title: "Roth IRA — Tax-free growth",
      points: [
        "Contributions with after-tax dollars",
        "All growth and qualified withdrawals are TAX FREE",
        "No RMDs — can pass to heirs tax-free",
        "2026 limit: $7,000 ($8,000 if 50+)",
        "Income limits: phase-out starts at $150k single / $236k married",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Why Roth is powerful",
      points: [
        "Pay taxes now at known rate vs. unknown future rates",
        "Tax diversification in retirement",
        "Backdoor Roth: contribute to Traditional IRA then convert",
      ],
    },
  ],
  pension: [
    {
      icon: <Shield className="size-3.5 text-rose-500" />,
      title: "Pension / Defined Benefit Plan",
      points: [
        "Guaranteed lifetime income — one of the most valuable benefits",
        "Benefit based on salary, years of service, and plan formula",
        "Most plans offer lump-sum vs. annuity payout choice at retirement",
        "Vesting schedule determines when benefits are fully owned",
        "PBGC insures private-sector pensions (up to limits)",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Advisor tips",
      points: [
        "Lump sum vs. annuity — major decision, run the numbers both ways",
        "Consider spouse survivor benefits if married",
        "Is the client close to a vesting cliff? Leaving early could forfeit benefits",
        "Factor pension income into Social Security coordination strategy",
      ],
    },
  ],
  plan403b457b: [
    {
      icon: <Briefcase className="size-3.5 text-sky-500" />,
      title: "403(b) & 457(b) Plans",
      points: [
        "403(b): for teachers, hospitals, non-profits — works like a 401(k)",
        "457(b): for state/local government — no 10% early withdrawal penalty",
        "Can contribute to BOTH a 403(b) and 457(b) simultaneously ($47,000+ total)",
        "2026 limit: $23,500 each ($31,000 if 50+)",
        "457(b) is especially powerful: no early withdrawal penalty at separation from service",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Key opportunity",
      points: [
        "Dual contributions: if employer offers both, max out BOTH plans",
        "457(b) funds accessible penalty-free once you leave the employer (any age)",
        "Check if the 403(b) has high-fee annuity sub-accounts — common problem",
        "15-year service catch-up may allow extra contributions beyond age 50 catch-up",
      ],
    },
  ],
  brokerage: [
    {
      icon: <BarChart3 className="size-3.5 text-violet-500" />,
      title: "Brokerage accounts",
      points: [
        "No contribution limits — flexible access",
        "Capital gains tax on profits (short-term vs long-term)",
        "No tax advantage — but provides liquidity",
        "Good for goals before retirement age (59½)",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Things to discuss",
      points: [
        "Tax-loss harvesting opportunities",
        "Asset location strategy (tax-efficient placement)",
        "Diversification across account types is key",
      ],
    },
  ],
  cd: [
    {
      icon: <Landmark className="size-3.5 text-teal-500" />,
      title: "Certificates of Deposit (CDs)",
      points: [
        "FDIC-insured up to $250,000 per institution",
        "Fixed interest rate — guaranteed return",
        "Early withdrawal penalties vary (typically 3–12 months of interest)",
        "CD laddering strategy can provide liquidity + higher rates",
        "Current rates are historically elevated — good time to lock in",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Advisor tips",
      points: [
        "Are CDs maturing soon? Great opportunity to reallocate",
        "Compare CD rates to high-yield savings and treasuries",
        "Discuss whether funds should be redeployed for growth or protection",
      ],
    },
  ],
  bonds: [
    {
      icon: <Landmark className="size-3.5 text-orange-500" />,
      title: "Bond holdings",
      points: [
        "Municipal bonds: interest is federal tax-free (often state tax-free too)",
        "US Treasury / I-Bonds: state-tax exempt, inflation-protected (I-Bonds)",
        "Corporate bonds: higher yield but taxable and carry credit risk",
        "Bond funds / ETFs: diversified, liquid, but prices fluctuate with rates",
        "Bonds provide stability and income — essential in a diversified portfolio",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Advisor tips",
      points: [
        "Municipal bonds are especially valuable for clients in high tax brackets",
        "I-Bond purchase limit: $10,000/year per SSN (+ $5,000 via tax refund)",
        "Duration matters: longer-term bonds are more sensitive to rate changes",
        "Consider bond ladder strategy for predictable income",
      ],
    },
  ],
  annuity: [
    {
      icon: <Shield className="size-3.5 text-purple-500" />,
      title: "Annuities",
      points: [
        "Fixed annuity: guaranteed rate, principal protected — like a CD with tax deferral",
        "Variable annuity: invested in sub-accounts, market risk, higher fees",
        "Fixed Indexed: tracks an index with downside protection, cap on gains",
        "Immediate annuity: converts lump sum to guaranteed income stream NOW",
        "Tax-deferred growth (no annual tax on gains until withdrawal)",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Critical review points",
      points: [
        "Check surrender charges — are they still in the penalty period?",
        "Review fees: variable annuities often have 2-3%+ annual costs",
        "1035 exchange: can swap to a better annuity without tax consequences",
        "Annuities inside IRAs provide NO extra tax benefit — a common mistake",
      ],
    },
  ],
  equityComp: [
    {
      icon: <Award className="size-3.5 text-amber-600" />,
      title: "Equity compensation",
      points: [
        "Stock Options (ISOs vs. NSOs): different tax treatment at exercise",
        "RSUs: taxed as ordinary income when they vest — no choice in timing",
        "ESPP: typically 15% discount on company stock — almost free money",
        "Concentration risk: too much wealth in one stock is dangerous",
        "Unvested equity is a 'golden handcuff' — factor into career decisions",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Planning opportunities",
      points: [
        "Diversification plan: systematic selling of vested shares",
        "ISOs: AMT implications — exercise strategy matters enormously",
        "RSU tax withholding is often insufficient — plan for tax bill",
        "ESPP: max out if offered — 15% guaranteed return on 6-month lookback",
        "Consider 10b5-1 plan for systematic, compliant selling",
      ],
    },
  ],
  education529: [
    {
      icon: <GraduationCap className="size-3.5 text-blue-600" />,
      title: "529 Education Savings",
      points: [
        "Tax-free growth & withdrawals for qualified education expenses",
        "No federal limit on contributions (subject to gift tax over $18,000/year)",
        "Many states offer tax deduction for contributions to in-state plan",
        "Can be used for K-12 tuition (up to $10,000/year) and college",
        "SECURE 2.0: unused 529 funds can roll to Roth IRA (up to $35,000, conditions apply)",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Advisor tips",
      points: [
        "Superfunding: 5-year gift tax averaging allows up to $90,000 at once",
        "Compare in-state vs. out-of-state plans for best fund options & fees",
        "Grandparent-owned 529s no longer impact financial aid (as of 2024 FAFSA)",
        "Don't over-fund — penalties on non-qualified withdrawals (10% + income tax on gains)",
      ],
    },
  ],
  realEstate: [
    {
      icon: <Home className="size-3.5 text-stone-500" />,
      title: "Real estate investments",
      points: [
        "Primary home equity: often the largest single asset — but illiquid",
        "Rental properties: cash flow + appreciation + tax benefits (depreciation)",
        "1031 exchange: defer capital gains by rolling into like-kind property",
        "Real estate provides inflation hedge and portfolio diversification",
        "Consider property management costs, vacancy, and maintenance reserves",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Key considerations",
      points: [
        "Debt-to-equity ratio on investment properties — overleveraged?",
        "Cash-on-cash return vs. other investment opportunities",
        "Estate planning: property in multiple states creates probate complexity",
        "REITs as alternative for real estate exposure without management burden",
      ],
    },
  ],
  crypto: [
    {
      icon: <Bitcoin className="size-3.5 text-orange-500" />,
      title: "Cryptocurrency / Digital assets",
      points: [
        "Highly volatile — position sizing is critical (most advisors suggest <5% of portfolio)",
        "Tax treatment: IRS treats crypto as property — every sale/trade is a taxable event",
        "Short-term gains (held <1 year) taxed at ordinary income rates",
        "Long-term gains (held >1 year) taxed at lower capital gains rates",
        "Lost/stolen crypto may be deductible — keep records of all transactions",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Advisor tips",
      points: [
        "Ensure client is tracking cost basis — tools like CoinTracker can help",
        "Tax-loss harvesting: wash-sale rules currently don't apply to crypto",
        "Self-custody wallets: important to document seed phrase in estate plan",
        "Consider if crypto fits the client's risk tolerance and time horizon",
      ],
    },
  ],
  cashOnHand: [
    {
      icon: <DollarSign className="size-3.5 text-green-600" />,
      title: "Cash reserves & emergency fund",
      points: [
        "Recommended: 3–6 months of expenses as emergency fund",
        "Self-employed or single income? Aim for 6–12 months",
        "Keep emergency fund liquid (high-yield savings, not invested)",
        "Excess cash beyond emergency fund may lose value to inflation",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Key questions",
      points: [
        "Is the emergency fund sufficient for the family's risk profile?",
        "Is excess cash sitting idle that could be better deployed?",
        "Does the client have upcoming large expenses (home, education)?",
      ],
    },
  ],
  socialSecurity: [
    {
      icon: <Building className="size-3.5 text-blue-700" />,
      title: "Social Security / CPP",
      points: [
        "Need 40 credits (10 years of work) to qualify for benefits",
        "Benefit based on highest 35 years of earnings",
        "Claiming at 62: ~30% permanent reduction vs. full retirement age",
        "Delaying to 70: ~8% increase per year after FRA — guaranteed return",
        "Spousal benefit: up to 50% of higher earner's FRA benefit",
      ],
    },
    {
      icon: <Lightbulb className="size-3.5 text-amber-500" />,
      title: "Claiming strategy",
      points: [
        "Run a breakeven analysis: early vs. FRA vs. delayed claiming",
        "Married couples: coordinate claiming for maximum lifetime benefit",
        "Survivor benefit: the higher earner delaying helps the surviving spouse",
        "If still working before FRA, earnings test may reduce benefits temporarily",
        "my Social Security account (ssa.gov) has personalized estimates — ask if client has checked",
      ],
    },
  ],
  systematic: [
    {
      icon: <PiggyBank className="size-3.5 text-pink-500" />,
      title: "Systematic investing",
      points: [
        "Dollar-cost averaging reduces timing risk",
        "Consistent investing builds wealth over time",
        "Automate to remove emotional decisions",
      ],
    },
  ],
  fundsAbroad: [
    {
      icon: <Send className="size-3.5 text-cyan-500" />,
      title: "International considerations",
      points: [
        "Regular remittances affect disposable income",
        "FBAR reporting if foreign accounts exceed $10,000",
        "FATCA filing requirements for foreign assets",
        "Consider this in the overall cash flow analysis",
      ],
    },
  ],
};

// ── Component ────────────────────────────────────────────────

interface Section1EducationProps {
  /** Which step within Section 1 we're on */
  activeStep: string;
}

export function Section1Education({ activeStep }: Section1EducationProps) {
  const items = STEP_EDUCATION[activeStep] ?? STEP_EDUCATION.background;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="size-1.5 rounded-full bg-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Session Guide
        </h3>
      </div>

      {items.map((item, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            {item.icon}
            <span className="text-xs font-medium">{item.title}</span>
          </div>
          <ul className="space-y-1 pl-5">
            {item.points.map((pt, j) => (
              <li
                key={j}
                className="text-xs leading-relaxed text-muted-foreground before:absolute before:-ml-3 before:content-['•']"
                style={{ position: "relative" }}
              >
                {pt}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
