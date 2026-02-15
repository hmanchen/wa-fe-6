"use client";

import { Info, Lightbulb, TrendingUp, DollarSign, PiggyBank, Landmark, BarChart3, Send } from "lucide-react";

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
