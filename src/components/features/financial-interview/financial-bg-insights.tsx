"use client";

import { useEffect, useState } from "react";
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
  Loader2,
  RefreshCw,
  Banknote,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FinancialHealthScore } from "@/types/financial-interview";
import { computeFullAnalysis } from "@/lib/api/presentation-flow";

function fmtDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function FinancialBgInsights({
  caseId,
  healthScore,
  onContinue,
  isSubmitting,
}: {
  caseId: string;
  healthScore?: FinancialHealthScore | null;
  onContinue: () => void | Promise<void>;
  isSubmitting?: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fullAnalysis, setFullAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const runFullAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const result = await computeFullAnalysis(caseId);
      setFullAnalysis(result);
    } catch (err: any) {
      setAnalysisError(err.message || "Full analysis failed");
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      runFullAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  if (!healthScore) {
    return (
      <div className="flex items-center justify-center rounded-b-xl border border-t-0 p-12">
        <p className="text-sm text-muted-foreground">Loading insights...</p>
      </div>
    );
  }

  const { netWorth, taxBuckets, insights, categories } = healthScore;
  const total = healthScore.totalScore;

  const fa = fullAnalysis;
  const cashFlow = fa?.cashFlow;
  const debtService = fa?.debtService;
  const netWorthFull = fa?.netWorth;
  const recMode = fa?.recommendationMode;

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
          {/* Full Analysis Status Bar */}
          <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-4 py-2">
            {analysisLoading ? (
              <>
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Running full computation engine (net worth, cash flow, debt analysis)...</span>
              </>
            ) : analysisError ? (
              <>
                <AlertTriangle className="size-4 text-amber-500" />
                <span className="flex-1 text-xs text-amber-600">{analysisError}</span>
                <Button size="sm" variant="ghost" onClick={runFullAnalysis} className="h-6 gap-1 px-2 text-xs">
                  <RefreshCw className="size-3" /> Retry
                </Button>
              </>
            ) : fa ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-xs text-emerald-600">Full analysis complete — 8 engines processed</span>
                <Button size="sm" variant="ghost" onClick={runFullAnalysis} className="ml-auto h-6 gap-1 px-2 text-xs">
                  <RefreshCw className="size-3" /> Re-run
                </Button>
              </>
            ) : null}
          </div>

          {/* Cash Flow + Debt Summary (from full analysis) */}
          {fa && (cashFlow || debtService) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {cashFlow && (
                <div className={cn(
                  "rounded-lg border p-3",
                  cashFlow.status === "deficit" ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20" : "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                )}>
                  <div className="mb-1 flex items-center gap-1.5">
                    <Banknote className="size-3.5 text-muted-foreground" />
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Cash Flow</p>
                  </div>
                  <p className={cn("text-lg font-black", cashFlow.status === "deficit" ? "text-red-600" : "text-emerald-600")}>
                    {fmtDollars(Math.abs(cashFlow.monthlySurplusOrDeficit ?? 0))}{cashFlow.status === "deficit" ? " deficit" : " surplus"}
                  </p>
                  <div className="mt-1.5 space-y-0.5 text-[10px] text-muted-foreground">
                    <div className="flex justify-between"><span>Gross Income</span><span>{fmtDollars(cashFlow.monthlyGrossIncome ?? 0)}/mo</span></div>
                    <div className="flex justify-between"><span>Take-Home</span><span>{fmtDollars(cashFlow.monthlyNetTakeHome ?? 0)}/mo</span></div>
                    <div className="flex justify-between"><span>Total Expenses</span><span>{fmtDollars(cashFlow.totalMonthlyExpenses ?? 0)}/mo</span></div>
                  </div>
                  {cashFlow.warnings?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {cashFlow.warnings.slice(0, 2).map((w: string, i: number) => (
                        <p key={i} className="text-[10px] font-medium text-red-600 dark:text-red-400">⚠ {w}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {debtService && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                  <div className="mb-1 flex items-center gap-1.5">
                    <CreditCard className="size-3.5 text-muted-foreground" />
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Debt Analysis</p>
                  </div>
                  <p className="text-lg font-black text-amber-600">{fmtDollars(debtService.totalConsumerDebt ?? 0)}</p>
                  <div className="mt-1.5 space-y-0.5 text-[10px] text-muted-foreground">
                    <div className="flex justify-between"><span>Monthly Minimum</span><span>{fmtDollars(debtService.totalMonthlyMinimum ?? 0)}/mo</span></div>
                    <div className="flex justify-between"><span>Annual Interest</span><span className="font-semibold text-red-500">{fmtDollars(debtService.totalAnnualInterest ?? 0)}/yr</span></div>
                    {debtService.debtFreeMonths != null && (
                      <div className="flex justify-between"><span>Debt-free in</span><span>{debtService.debtFreeMonths} months</span></div>
                    )}
                    {debtService.isDebtEmergency && (
                      <p className="mt-1 text-[10px] font-bold text-red-600">🚨 DEBT EMERGENCY — interest exceeds retirement savings</p>
                    )}
                  </div>
                  {debtService.warnings?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {debtService.warnings.slice(0, 2).map((w: string, i: number) => (
                        <p key={i} className="text-[10px] font-medium text-amber-700 dark:text-amber-400">⚠ {w}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recommendation Mode */}
          {recMode && (
            <div className={cn(
              "rounded-lg border px-4 py-2.5",
              recMode.mode === "phased" ? "border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/10" : "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/10"
            )}>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  recMode.mode === "phased" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                )}>
                  {recMode.mode === "phased" ? "Phased Mode" : "Standard 3-Tier"}
                </span>
                <span className="text-xs text-muted-foreground">{recMode.reason}</span>
              </div>
            </div>
          )}

          {/* Red Flags from full net worth */}
          {netWorthFull?.redFlags?.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50/30 p-3 dark:border-red-900 dark:bg-red-950/10">
              <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-red-500">Red Flags</p>
              <div className="space-y-1">
                {netWorthFull.redFlags.map((f: string, i: number) => (
                  <p key={i} className="text-[11px] text-red-700 dark:text-red-300">• {f}</p>
                ))}
              </div>
            </div>
          )}

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
          {isSubmitting ? "Saving..." : "Continue to Financial Home"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
