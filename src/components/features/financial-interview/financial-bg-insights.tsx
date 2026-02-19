"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  Shield,
  PiggyBank,
  TrendingUp,
  Home,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PersonFinancialBackground } from "@/types/financial-interview";

// ── Types ────────────────────────────────────────────────────

interface HealthScore {
  total: number;
  retirement: number | null;
  education: number | null;
  tax: number | null;
  protection: number | null;
  estate: number | null;
}

interface InsightCard {
  type: "strength" | "gap";
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ── Net worth computation ────────────────────────────────────

interface NetWorthBreakdown {
  retirement: number;
  investments: number;
  savings: number;
  realEstate: number;
  other: number;
  total: number;
}

function computeNetWorth(d: PersonFinancialBackground): NetWorthBreakdown {
  const retirement =
    (d.retirement401k?.currentBalance ?? 0) +
    (d.ira?.currentBalance ?? 0) +
    (d.rothIRA?.currentBalance ?? 0) +
    (d.plan403b457b?.currentBalance ?? 0);

  const investments =
    (d.brokerage?.currentValue ?? 0) +
    (d.bonds?.municipalBondValue ?? 0) +
    (d.bonds?.treasuryBondValue ?? 0) +
    (d.bonds?.corporateBondValue ?? 0) +
    (d.bonds?.bondFundValue ?? 0) +
    (d.annuity?.currentValue ?? 0) +
    (d.equityCompensation?.vestedOptionsValue ?? 0) +
    (d.equityCompensation?.vestedRSUValue ?? 0) +
    (d.crypto?.totalValue ?? 0);

  const savings =
    (d.cashOnHand?.checkingBalance ?? 0) +
    (d.cashOnHand?.savingsBalance ?? 0) +
    (d.hsa?.currentBalance ?? 0) +
    (d.cd?.totalValue ?? 0);

  const realEstate = d.realEstate?.primaryHomeEquity ?? 0;

  const other =
    (d.systematicInvestments?.currentValue ?? 0) +
    (d.education529?.totalBalance ?? 0);

  return { retirement, investments, savings, realEstate, other, total: retirement + investments + savings + realEstate + other };
}

// ── Insight generation ───────────────────────────────────────

function generateInsights(d: PersonFinancialBackground): InsightCard[] {
  const cards: InsightCard[] = [];
  const salary = d.income?.annualSalary ?? 0;
  const expenses = computeMonthlyExpenses(d);

  if (d.retirement401k?.currentBalance && d.retirement401k.currentBalance > 0) {
    cards.push({ type: "strength", title: "Active 401(k)", detail: "You're contributing to your employer plan — keep maximizing the match.", icon: CheckCircle2 });
  } else if (salary > 0) {
    cards.push({ type: "gap", title: "No 401(k) contribution detected", detail: "If available, consider contributing to capture employer match — it's free money.", icon: AlertTriangle });
  }

  if (d.rothIRA?.currentBalance && d.rothIRA.currentBalance > 0) {
    cards.push({ type: "strength", title: "Roth IRA in place", detail: "Tax-free growth is a powerful long-term strategy.", icon: CheckCircle2 });
  } else {
    cards.push({ type: "gap", title: "No Roth IRA", detail: "Consider opening a Roth IRA for tax diversification in retirement.", icon: AlertTriangle });
  }

  const cashOnHand = (d.cashOnHand?.checkingBalance ?? 0) + (d.cashOnHand?.savingsBalance ?? 0);
  if (expenses > 0 && cashOnHand >= expenses * 3) {
    cards.push({ type: "strength", title: "Healthy emergency fund", detail: `You have ~${Math.round(cashOnHand / expenses)} months of expenses in liquid savings.`, icon: PiggyBank });
  } else if (expenses > 0) {
    cards.push({ type: "gap", title: "Emergency fund gap", detail: "Aim for 3-6 months of expenses in liquid, accessible savings.", icon: AlertTriangle });
  }

  const hasPreTax = !!(d.retirement401k?.currentBalance || d.ira?.currentBalance);
  const hasRoth = !!d.rothIRA?.currentBalance;
  const hasTaxable = !!(d.brokerage?.currentValue || cashOnHand > 0);
  const buckets = [hasPreTax, hasRoth, hasTaxable].filter(Boolean).length;
  if (buckets >= 3) {
    cards.push({ type: "strength", title: "Great tax diversification", detail: "You have pre-tax, Roth, and taxable buckets — excellent flexibility.", icon: Shield });
  } else if (buckets === 1) {
    cards.push({ type: "gap", title: "Tax concentration risk", detail: "Most assets are in one tax bucket. Diversifying creates more options in retirement.", icon: AlertTriangle });
  }

  if (d.education529?.totalBalance && d.education529.totalBalance > 0) {
    cards.push({ type: "strength", title: "529 education savings", detail: "You're building tax-advantaged education funding.", icon: CheckCircle2 });
  }

  if (d.hsa?.currentBalance && d.hsa.currentBalance > 0) {
    cards.push({ type: "strength", title: "HSA account active", detail: "Triple tax advantage — contributions, growth, and qualified withdrawals are all tax-free.", icon: CheckCircle2 });
  }

  if (d.realEstate?.primaryHomeEquity && d.realEstate.primaryHomeEquity > 0) {
    cards.push({ type: "strength", title: "Real estate equity", detail: "Home equity adds stability to your net worth.", icon: Home });
  }

  return cards;
}

function computeMonthlyExpenses(d: PersonFinancialBackground): number {
  const e = d.monthlyExpenses ?? {};
  return (e.housing ?? 0) + (e.utilities ?? 0) + (e.transportation ?? 0) +
    (e.groceries ?? 0) + (e.insurance ?? 0) + (e.childcare ?? 0) +
    (e.entertainment ?? 0) + (e.diningOut ?? 0) + (e.subscriptions ?? 0) + (e.otherExpenses ?? 0);
}

function generateAISummary(d: PersonFinancialBackground, nw: NetWorthBreakdown): string {
  const salary = d.income?.annualSalary ?? 0;
  const expenses = computeMonthlyExpenses(d);
  const surplus = salary > 0 ? Math.round(salary / 12) - expenses : 0;

  const parts: string[] = [];

  if (nw.total > 0) {
    parts.push(`Total estimated net worth is $${nw.total.toLocaleString()}.`);
  }
  if (salary > 0) {
    parts.push(`Annual household income is $${salary.toLocaleString()}.`);
  }
  if (expenses > 0) {
    parts.push(`Monthly expenses total $${expenses.toLocaleString()}, leaving ${surplus >= 0 ? `a surplus of $${surplus.toLocaleString()}` : `a deficit of $${Math.abs(surplus).toLocaleString()}`} per month.`);
  }

  if (nw.retirement > 0 && salary > 0) {
    const ratio = nw.retirement / salary;
    if (ratio >= 3) parts.push("Retirement savings are tracking well relative to income.");
    else parts.push("Consider increasing retirement contributions to build a stronger runway.");
  }

  if (parts.length === 0) {
    return "Enter financial data in the form to see a personalized summary.";
  }

  return parts.join(" ");
}

// ── Dollar formatter ─────────────────────────────────────────

function fmtDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

// ── Component ────────────────────────────────────────────────

export function FinancialBgInsights({
  data,
  healthScore,
  onContinue,
  isSubmitting,
}: {
  data: PersonFinancialBackground;
  healthScore: HealthScore;
  onContinue: () => void | Promise<void>;
  isSubmitting?: boolean;
}) {
  const netWorth = useMemo(() => computeNetWorth(data), [data]);
  const insights = useMemo(() => generateInsights(data), [data]);
  const aiSummary = useMemo(() => generateAISummary(data, netWorth), [data, netWorth]);

  const strengths = insights.filter((i) => i.type === "strength");
  const gaps = insights.filter((i) => i.type === "gap");

  const netWorthBars = [
    { label: "Retirement", value: netWorth.retirement, color: "bg-blue-500", icon: PiggyBank },
    { label: "Investments", value: netWorth.investments, color: "bg-emerald-500", icon: TrendingUp },
    { label: "Savings", value: netWorth.savings, color: "bg-amber-500", icon: Coins },
    { label: "Real Estate", value: netWorth.realEstate, color: "bg-violet-500", icon: Home },
    { label: "Other", value: netWorth.other, color: "bg-gray-400", icon: DollarSign },
  ];

  const maxBarValue = Math.max(...netWorthBars.map((b) => b.value), 1);

  return (
    <div className="space-y-6 rounded-b-xl border border-t-0 p-6">
      {/* ── Net Worth Snapshot ── */}
      <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-background p-5 dark:from-slate-900/30">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Net Worth</p>
            <p className="text-3xl font-black">{fmtDollars(netWorth.total)}</p>
          </div>
          {/* Health score circle */}
          <div className="flex flex-col items-center">
            <div className="relative flex size-20 items-center justify-center">
              <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
                <circle
                  cx="18" cy="18" r="16" fill="none" strokeWidth="2.5"
                  strokeDasharray={`${(healthScore.total / 100) * 100.5} 100.5`}
                  strokeLinecap="round"
                  className={cn(
                    healthScore.total < 30 ? "text-red-500" :
                    healthScore.total < 60 ? "text-amber-500" : "text-green-500"
                  )}
                  stroke="currentColor"
                />
              </svg>
              <span className="absolute text-lg font-black">{healthScore.total}</span>
            </div>
            <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">Health Score</span>
          </div>
        </div>

        {/* Category bars */}
        <div className="space-y-2">
          {netWorthBars.map((bar) => {
            const Icon = bar.icon;
            return (
              <div key={bar.label} className="flex items-center gap-3">
                <Icon className="size-4 text-muted-foreground" />
                <span className="w-20 text-xs text-muted-foreground">{bar.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all", bar.color)}
                    style={{ width: `${(bar.value / maxBarValue) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right text-xs font-medium">{fmtDollars(bar.value)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tax bucket preview */}
      <div className="rounded-xl border p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Tax Bucket Distribution
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Tax-Deferred", amount: (data.retirement401k?.currentBalance ?? 0) + (data.ira?.currentBalance ?? 0) + (data.plan403b457b?.currentBalance ?? 0), desc: "401k, IRA, 403b", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
            { label: "Tax-Free", amount: (data.rothIRA?.currentBalance ?? 0) + (data.hsa?.currentBalance ?? 0), desc: "Roth IRA, HSA", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
            { label: "Taxable", amount: (data.brokerage?.currentValue ?? 0) + (data.cashOnHand?.checkingBalance ?? 0) + (data.cashOnHand?.savingsBalance ?? 0) + (data.cd?.totalValue ?? 0), desc: "Brokerage, Cash, CDs", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
          ].map((bucket) => (
            <div key={bucket.label} className={cn("rounded-lg p-3", bucket.color)}>
              <p className="text-xs font-semibold">{bucket.label}</p>
              <p className="text-xl font-bold">{fmtDollars(bucket.amount)}</p>
              <p className="text-[10px] opacity-70">{bucket.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths and gaps */}
      <div className="grid gap-4 sm:grid-cols-2">
        {strengths.length > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-900/50 dark:bg-green-950/10">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-3.5" /> What You&apos;re Doing Well
            </p>
            <div className="space-y-2">
              {strengths.map((s, i) => (
                <div key={i} className="rounded-lg bg-white/80 p-2.5 dark:bg-green-950/20">
                  <p className="text-xs font-semibold">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {gaps.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/10">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-3.5" /> Areas That Need Attention
            </p>
            <div className="space-y-2">
              {gaps.map((g, i) => (
                <div key={i} className="rounded-lg bg-white/80 p-2.5 dark:bg-amber-950/20">
                  <p className="text-xs font-semibold">{g.title}</p>
                  <p className="text-[11px] text-muted-foreground">{g.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Summary */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/50 dark:bg-blue-950/10">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
          <Info className="size-3.5" /> Summary
        </p>
        <p className="text-sm leading-relaxed text-foreground">{aiSummary}</p>
      </div>

      {/* Continue button */}
      <div className="flex justify-end">
        <Button size="lg" className="gap-2 px-8" onClick={onContinue} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Continue to Life Insurance & Trust"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
