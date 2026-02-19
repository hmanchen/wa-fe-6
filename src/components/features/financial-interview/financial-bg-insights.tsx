"use client";

import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lightbulb,
  DollarSign,
  PiggyBank,
  TrendingUp,
  Home,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FinancialHealthScore } from "@/types/financial-interview";

function fmtDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function FinancialBgInsights({
  healthScore,
  onContinue,
  isSubmitting,
}: {
  healthScore?: FinancialHealthScore | null;
  onContinue: () => void | Promise<void>;
  isSubmitting?: boolean;
}) {
  if (!healthScore) {
    return (
      <div className="flex items-center justify-center rounded-b-xl border border-t-0 p-12">
        <p className="text-sm text-muted-foreground">Loading insights...</p>
      </div>
    );
  }

  const { netWorth, taxBuckets, insights, categories } = healthScore;
  const total = healthScore.totalScore;

  const netWorthBars = [
    { label: "Retirement", value: netWorth.breakdown.retirement, color: "bg-blue-500", icon: PiggyBank },
    { label: "Investments", value: netWorth.breakdown.investments, color: "bg-emerald-500", icon: TrendingUp },
    { label: "Savings", value: netWorth.breakdown.savings, color: "bg-amber-500", icon: Coins },
    { label: "Real Estate", value: netWorth.breakdown.realEstate, color: "bg-violet-500", icon: Home },
    { label: "Other", value: netWorth.breakdown.other, color: "bg-gray-400", icon: DollarSign },
  ];

  const maxBarValue = Math.max(...netWorthBars.map((b) => b.value), 1);

  return (
    <div className="space-y-6 rounded-b-xl border border-t-0 p-6">
      {/* Net Worth Snapshot */}
      <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-background p-5 dark:from-slate-900/30">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Net Worth</p>
            <p className="text-3xl font-black">{fmtDollars(netWorth.total)}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative flex size-20 items-center justify-center">
              <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
                <circle
                  cx="18" cy="18" r="16" fill="none" strokeWidth="2.5"
                  strokeDasharray={`${(total / (healthScore.maxPossibleScore || 100)) * 100.5} 100.5`}
                  strokeLinecap="round"
                  className={cn(
                    total < 30 ? "text-red-500" :
                    total < 60 ? "text-amber-500" : "text-green-500"
                  )}
                  stroke="currentColor"
                />
              </svg>
              <span className="absolute text-lg font-black">{total}</span>
            </div>
            <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">Health Score</span>
          </div>
        </div>
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

      {/* Tax Bucket Distribution */}
      <div className="rounded-xl border p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Tax Bucket Distribution
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Tax-Deferred", amount: taxBuckets.taxDeferred, desc: "401k, IRA, 403b", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
            { label: "Tax-Free", amount: taxBuckets.taxFree, desc: "Roth IRA, HSA", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
            { label: "Taxable", amount: taxBuckets.taxable, desc: "Brokerage, Cash, CDs", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
          ].map((bucket) => (
            <div key={bucket.label} className={cn("rounded-lg p-3", bucket.color)}>
              <p className="text-xs font-semibold">{bucket.label}</p>
              <p className="text-xl font-bold">{fmtDollars(bucket.amount)}</p>
              <p className="text-[10px] opacity-70">{bucket.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category factor breakdown */}
      <div className="rounded-xl border p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Score Breakdown
        </p>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {(["retirement", "education", "tax", "protection", "estate"] as const).map((key) => {
            const cat = categories[key];
            if (!cat || cat.score === null || cat.score === undefined) return null;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold capitalize">{key}</p>
                  <span className="text-xs font-bold">{cat.score}/{cat.maxScore}</span>
                </div>
                {cat.factors.map((f) => (
                  <div key={f.label} className="flex items-center gap-1.5">
                    <div className={cn("size-1.5 rounded-full", f.met ? "bg-green-500" : "bg-muted-foreground/30")} />
                    <span className={cn("text-[11px]", f.met ? "text-foreground" : "text-muted-foreground")}>
                      {f.label}
                    </span>
                    <span className="ml-auto text-[10px] font-medium text-muted-foreground">
                      {f.points}/{f.maxPoints}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths and Gaps */}
      <div className="grid gap-4 sm:grid-cols-2">
        {insights.strengths.length > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-900/50 dark:bg-green-950/10">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-3.5" /> What You&apos;re Doing Well
            </p>
            <div className="space-y-2">
              {insights.strengths.map((s, i) => (
                <div key={i} className="rounded-lg bg-white/80 p-2.5 dark:bg-green-950/20">
                  <p className="text-xs font-semibold">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {insights.gaps.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/10">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-3.5" /> Areas That Need Attention
            </p>
            <div className="space-y-2">
              {insights.gaps.map((g, i) => (
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
        <p className="text-sm leading-relaxed text-foreground">{insights.summary}</p>
      </div>

      {/* Advisor Hints */}
      {insights.advisorHints.length > 0 && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-5 dark:border-purple-900/50 dark:bg-purple-950/10">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-purple-700 dark:text-purple-400">
            <Lightbulb className="size-3.5" /> Advisor Hints
          </p>
          <ul className="space-y-1.5 text-sm text-foreground">
            {insights.advisorHints.map((hint, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-0.5 text-purple-400">•</span>
                <span>{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
