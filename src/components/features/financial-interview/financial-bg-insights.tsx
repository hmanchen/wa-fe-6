"use client";

import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
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
    <div className="space-y-4 rounded-b-xl border border-t-0 p-5">
      {/* ── Two-column layout: narrow left (data) / wide right (AI) ── */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,5fr)]">

        {/* ════ LEFT COLUMN: Compact numbers ════ */}
        <div className="space-y-3">
          {/* Net Worth + Health Score — single compact card */}
          <div className="rounded-lg border bg-gradient-to-br from-slate-50 to-background p-3 dark:from-slate-900/30">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Net Worth</p>
                <p className="text-xl font-black leading-tight">{fmtDollars(netWorth.total)}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative flex size-12 items-center justify-center">
                  <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/30" />
                    <circle
                      cx="18" cy="18" r="16" fill="none" strokeWidth="3"
                      strokeDasharray={`${(total / (healthScore.maxPossibleScore || 100)) * 100.5} 100.5`}
                      strokeLinecap="round"
                      className={cn(
                        total < 30 ? "text-red-500" :
                        total < 60 ? "text-amber-500" : "text-green-500"
                      )}
                      stroke="currentColor"
                    />
                  </svg>
                  <span className="absolute text-xs font-black">{total}</span>
                </div>
                <span className="text-[8px] font-medium text-muted-foreground">Score</span>
              </div>
            </div>
            <div className="space-y-1">
              {netWorthBars.map((bar) => (
                <div key={bar.label} className="flex items-center gap-1.5">
                  <span className="w-14 truncate text-[10px] text-muted-foreground">{bar.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", bar.color)}
                      style={{ width: `${(bar.value / maxBarValue) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-[10px] font-medium">{fmtDollars(bar.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Buckets — inline row */}
          <div className="rounded-lg border p-3">
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Tax Buckets
            </p>
            <div className="space-y-1.5">
              {[
                { label: "Deferred", amount: taxBuckets.taxDeferred, color: "text-blue-600 dark:text-blue-400" },
                { label: "Tax-Free", amount: taxBuckets.taxFree, color: "text-green-600 dark:text-green-400" },
                { label: "Taxable", amount: taxBuckets.taxable, color: "text-amber-600 dark:text-amber-400" },
              ].map((b) => (
                <div key={b.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{b.label}</span>
                  <span className={cn("text-[11px] font-bold", b.color)}>{fmtDollars(b.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Score Breakdown — compact list */}
          <div className="rounded-lg border p-3">
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Score Breakdown
            </p>
            <div className="space-y-2">
              {(["retirement", "education", "tax", "protection", "estate"] as const).map((key) => {
                const cat = categories[key];
                if (!cat || cat.score === null || cat.score === undefined) return null;
                const pct = cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="mb-0.5 flex items-center justify-between">
                      <span className="text-[10px] font-medium capitalize">{key}</span>
                      <span className="text-[10px] font-bold">{cat.score}/{cat.maxScore}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ════ RIGHT COLUMN: AI Insights (primary focus) ════ */}
        <div className="space-y-4">
          {/* AI Summary */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/50 dark:bg-blue-950/10">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
              <Info className="size-4" /> Summary
            </p>
            <p className="text-sm leading-relaxed text-foreground">{insights.summary}</p>
          </div>

          {/* Strengths & Gaps side-by-side within the right column */}
          <div className="grid gap-4 sm:grid-cols-2">
            {insights.strengths.length > 0 && (
              <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-900/50 dark:bg-green-950/10">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
                  <CheckCircle2 className="size-4" /> What You&apos;re Doing Well
                </p>
                <div className="space-y-2">
                  {insights.strengths.map((s, i) => (
                    <div key={i} className="rounded-lg bg-white/80 p-2.5 dark:bg-green-950/20">
                      <p className="text-xs font-semibold">{s.title}</p>
                      <p className="text-[11px] leading-snug text-muted-foreground">{s.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {insights.gaps.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/10">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="size-4" /> Areas That Need Attention
                </p>
                <div className="space-y-2">
                  {insights.gaps.map((g, i) => (
                    <div key={i} className="rounded-lg bg-white/80 p-2.5 dark:bg-amber-950/20">
                      <p className="text-xs font-semibold">{g.title}</p>
                      <p className="text-[11px] leading-snug text-muted-foreground">{g.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
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
