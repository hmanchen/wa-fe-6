"use client";

import { API_BASE_URL } from "@/lib/config";
import { useEffect, useState, useRef, useMemo } from "react";
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
  Bug,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { FinancialHealthScore } from "@/types/financial-interview";
import { apiClient } from "@/lib/api/client";

/* eslint-disable @typescript-eslint/no-explicit-any */

function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function deepConvertKeys(obj: any, converter: (s: string) => string): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => deepConvertKeys(item, converter));
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[converter(key)] = deepConvertKeys(value, converter);
    }
    return result;
  }
  return obj;
}

interface DebugLog {
  label: string;
  url: string;
  method: string;
  input?: any;
  rawResponse?: any;
  transformedResponse?: any;
  error?: string;
  timestamp: string;
  durationMs?: number;
}

function fmtDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function severityWeight(sev?: string): number {
  const norm = (sev ?? "INFO").toUpperCase();
  if (norm === "CRITICAL") return 0;
  if (norm === "HIGH") return 1;
  if (norm === "MEDIUM") return 2;
  if (norm === "LOW") return 3;
  return 4;
}

function scoreColorClass(score: number, max: number): string {
  if (max <= 0) return "bg-muted";
  const pct = (score / max) * 100;
  if (pct < 33) return "bg-red-500";
  if (pct < 66) return "bg-amber-500";
  return "bg-green-500";
}

function totalScoreRingClass(score: number): string {
  if (score < 40) return "text-red-500";
  if (score < 60) return "text-orange-500";
  if (score < 75) return "text-amber-500";
  return "text-green-500";
}

type NormalizedCategory = {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  weightLabel?: string;
  goalConnection?: string | null;
  factors: Array<{
    id?: string;
    label: string;
    points: number;
    maxPoints: number;
    met: boolean;
    notApplicable?: boolean;
  }>;
  subsections?: Array<{
    id: string;
    label: string;
    score: number;
    maxScore: number;
    factors: Array<{
      id?: string;
      label: string;
      points: number;
      maxPoints: number;
      met: boolean;
      notApplicable?: boolean;
    }>;
  }>;
};

type NormalizedGap = {
  title: string;
  detail: string;
  severity: string;
  goalLinked: boolean;
  connectedGoal?: string;
  connectedGoalRank?: number;
};

export function FinancialBgInsights({
  caseId,
  healthScore: healthScoreProp,
  clientState,
  onContinue,
  isSubmitting,
}: {
  caseId: string;
  healthScore?: FinancialHealthScore | null;
  clientState?: string;
  onContinue: () => void | Promise<void>;
  isSubmitting?: boolean;
}) {
  const [fullAnalysis, setFullAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [freshHealthScore, setFreshHealthScore] = useState<FinancialHealthScore | null>(null);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [debugOpen, setDebugOpen] = useState(false);
  const hasRun = useRef(false);

  const healthScore = freshHealthScore ?? healthScoreProp ?? null;

  const addDebugLog = (log: DebugLog) => {
    setDebugLogs((prev) => [...prev, log]);
  };

  const fetchHealthScore = async () => {
    const hsUrl = `${API_BASE_URL}/api/v1/cases/${caseId}/financial-health-score/`;
    const start = Date.now();

    try {
      const { data } = await apiClient.get<any>(
        `/cases/${caseId}/financial-health-score/`
      );
      const elapsed = Date.now() - start;
      const rawExtracted = data?.data ?? data;
      const transformed = deepConvertKeys(rawExtracted, toCamelCase) as FinancialHealthScore;
      setFreshHealthScore(transformed);

      addDebugLog({
        label: "Health Score (fresh fetch)",
        url: hsUrl,
        method: "GET",
        rawResponse: rawExtracted,
        transformedResponse: transformed,
        timestamp: new Date().toISOString(),
        durationMs: elapsed,
      });
    } catch (err: any) {
      const elapsed = Date.now() - start;
      addDebugLog({
        label: "Health Score (fresh fetch)",
        url: hsUrl,
        method: "GET",
        error: err.message || "Health score fetch failed",
        timestamp: new Date().toISOString(),
        durationMs: elapsed,
      });
    }
  };

  const runFullAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);

    const fullUrl = `${API_BASE_URL}/api/v1/compute/financial/full-analysis`;
    const resolvedState = clientState || "unknown";
    const inputPayload = { case_id: caseId, state: resolvedState };
    const start = Date.now();

    try {
      const { data } = await apiClient.post<any>(
        "/compute/financial/full-analysis",
        inputPayload
      );
      const elapsed = Date.now() - start;
      const rawExtracted = data?.data ?? data;
      const transformed = deepConvertKeys(rawExtracted, toCamelCase);
      setFullAnalysis(transformed);

      addDebugLog({
        label: "Full Analysis",
        url: fullUrl,
        method: "POST",
        input: inputPayload,
        rawResponse: rawExtracted,
        transformedResponse: transformed,
        timestamp: new Date().toISOString(),
        durationMs: elapsed,
      });
    } catch (err: any) {
      const elapsed = Date.now() - start;
      const msg = err.message || "Full analysis failed";
      setAnalysisError(msg);
      addDebugLog({
        label: "Full Analysis",
        url: fullUrl,
        method: "POST",
        input: inputPayload,
        error: msg,
        timestamp: new Date().toISOString(),
        durationMs: elapsed,
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (caseId && !hasRun.current) {
      hasRun.current = true;
      fetchHealthScore();
      runFullAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  if (!healthScore) {
    return (
      <div className="space-y-4 rounded-b-xl border border-t-0 p-5">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="mr-2 size-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading insights — fetching health score &amp; running analysis...</p>
        </div>

        {/* Debug Panel still visible during loading */}
        <div className="rounded-lg border border-dashed border-orange-300 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/10">
          <button
            onClick={() => setDebugOpen((p) => !p)}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400"
          >
            <Bug className="size-4" />
            Debug: API Calls ({debugLogs.length})
            {debugOpen ? <ChevronUp className="ml-auto size-4" /> : <ChevronDown className="ml-auto size-4" />}
          </button>
          {debugOpen && (
            <div className="space-y-3 px-4 pb-4">
              {debugLogs.length === 0 && (
                <p className="text-xs text-muted-foreground">No API calls logged yet.</p>
              )}
              {debugLogs.map((log, idx) => (
                <div key={idx} className="rounded-lg border bg-white p-3 dark:bg-slate-900">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold",
                      log.method === "POST" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    )}>
                      {log.method}
                    </span>
                    <span className="text-xs font-semibold">{log.label}</span>
                    {log.error && <span className="text-[10px] font-bold text-red-500">ERROR</span>}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">URL</p>
                    <pre className="mt-0.5 overflow-x-auto rounded bg-slate-100 p-2 text-[11px] dark:bg-slate-800">{log.url}</pre>
                  </div>
                  {log.error && (
                    <pre className="mt-1 rounded bg-red-50 p-2 text-[11px] text-red-700 dark:bg-red-950/30">{log.error}</pre>
                  )}
                  {log.rawResponse && (
                    <div className="mt-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Raw Response</p>
                      <pre className="mt-0.5 max-h-40 overflow-auto rounded bg-slate-100 p-2 text-[11px] dark:bg-slate-800">
                        {JSON.stringify(log.rawResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const hsAny = healthScore as any;
  const fa = fullAnalysis as any;
  const goalAware = hsAny?.goalAware ?? false;
  const goalSummary = hsAny?.goalSummary ?? null;
  const total = Number(healthScore.totalScore ?? 0);
  const maxScore = Number(healthScore.maxPossibleScore ?? 100);
  const pctTotal = maxScore > 0 ? (total / maxScore) * 100 : 0;

  const categorySource = hsAny?.categories ?? {};
  const normalizedCategories: NormalizedCategory[] = useMemo(() => {
    const weightedOrder = [
      { key: "protection", label: "Protection", fallbackMax: 30 },
      { key: "retirement", label: "Retirement", fallbackMax: 25 },
      { key: "debtHealth", label: "Debt Health", fallbackMax: 20 },
      { key: "debt_health", label: "Debt Health", fallbackMax: 20 },
      { key: "tax", label: "Tax Efficiency", fallbackMax: 15 },
      { key: "estate", label: "Estate Planning", fallbackMax: 10 },
    ];

    const oldOrder = [
      { key: "protection", label: "Protection", fallbackMax: 20 },
      { key: "retirement", label: "Retirement", fallbackMax: 20 },
      { key: "education", label: "Education/Systematic", fallbackMax: 20 },
      { key: "tax", label: "Tax", fallbackMax: 20 },
      { key: "estate", label: "Estate", fallbackMax: 20 },
    ];

    const tryList = goalAware ? weightedOrder : [...weightedOrder, ...oldOrder];
    const output: NormalizedCategory[] = [];
    const seen = new Set<string>();

    for (const item of tryList) {
      const raw = categorySource[item.key];
      if (!raw || seen.has(item.label)) continue;
      const score = Number(raw?.score ?? 0);
      const catMax = Number(raw?.maxScore ?? raw?.max_score ?? item.fallbackMax);
      const factors = Array.isArray(raw?.factors)
        ? raw.factors.map((f: any) => ({
            id: f?.id ?? f?.factorId ?? f?.factor_id ?? undefined,
            label: String(f?.label ?? ""),
            points: Number(f?.points ?? 0),
            maxPoints: Number(f?.maxPoints ?? f?.max_points ?? 0),
            met: Boolean(f?.met),
            notApplicable: Boolean(f?.notApplicable ?? f?.not_applicable),
          }))
        : [];
      const subsections = Array.isArray(raw?.subsections)
        ? raw.subsections.map((s: any) => ({
            id: String(s?.id ?? ""),
            label: String(s?.label ?? "Section"),
            score: Number(s?.score ?? 0),
            maxScore: Number(s?.maxScore ?? s?.max_score ?? 25),
            factors: Array.isArray(s?.factors)
              ? s.factors.map((f: any) => ({
                  id: f?.id ?? f?.factorId ?? f?.factor_id ?? undefined,
                  label: String(f?.label ?? ""),
                  points: Number(f?.points ?? 0),
                  maxPoints: Number(f?.maxPoints ?? f?.max_points ?? 0),
                  met: Boolean(f?.met),
                  notApplicable: Boolean(f?.notApplicable ?? f?.not_applicable),
                }))
              : [],
          }))
        : [];
      output.push({
        key: item.key,
        label: item.label,
        score,
        maxScore: catMax,
        weightLabel: raw?.weightLabel ?? raw?.weight_label ?? `${catMax}%`,
        goalConnection: raw?.goalConnection ?? raw?.goal_connection ?? null,
        factors,
        subsections,
      });
      seen.add(item.label);
    }

    return output;
  }, [categorySource, goalAware]);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const toggleCategory = (key: string) =>
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));

  const netWorth = hsAny?.netWorth ?? {};
  const assets = Number(netWorth?.totalAssets ?? netWorth?.total_assets ?? netWorth?.total ?? 0);
  const liabilities = Number(netWorth?.totalLiabilities ?? netWorth?.total_liabilities ?? 0);
  const netWorthVal = Number(netWorth?.netWorth ?? netWorth?.net_worth ?? netWorth?.total ?? assets - liabilities);
  const netWorthBars = [
    { label: "Retirement", value: Number(netWorth?.breakdown?.retirement ?? 0), color: "bg-blue-500", icon: PiggyBank },
    { label: "Investments", value: Number(netWorth?.breakdown?.investments ?? 0), color: "bg-emerald-500", icon: TrendingUp },
    { label: "Savings", value: Number(netWorth?.breakdown?.savings ?? 0), color: "bg-amber-500", icon: Coins },
    { label: "Real Estate", value: Number(netWorth?.breakdown?.realEstate ?? 0), color: "bg-violet-500", icon: Home },
    { label: "Other", value: Number(netWorth?.breakdown?.other ?? 0), color: "bg-gray-400", icon: DollarSign },
  ];
  const maxBarValue = Math.max(...netWorthBars.map((b) => b.value), 1);

  const taxBuckets = hsAny?.taxBuckets ?? hsAny?.goalTaxBucket ?? {};
  const taxDeferred = Number(taxBuckets?.taxDeferred ?? taxBuckets?.tax_deferred_pct ?? 0);
  const taxFree = Number(taxBuckets?.taxFree ?? taxBuckets?.tax_free_pct ?? 0);
  const taxable = Number(taxBuckets?.taxable ?? taxBuckets?.taxable_pct ?? 0);

  const hiddenMoney =
    hsAny?.hiddenMoney ??
    fa?.hiddenMoney ??
    hsAny?.hidden_money ??
    fa?.hidden_money ??
    null;
  const hiddenSources = hiddenMoney?.sources ?? [];
  const hiddenRedirect = Number(
    hiddenMoney?.totalMonthlyRedirectable ?? hiddenMoney?.total_monthly_redirectable ?? 0
  );
  const unallocatedSurplus = Number(
    hiddenMoney?.unallocatedSurplus ?? hiddenMoney?.unallocated_surplus ?? 0
  );
  const showHiddenMoney = hiddenRedirect > 0 || unallocatedSurplus > 0;

  const cashFlow = fa?.cashFlow ?? hsAny?.cashFlow ?? hsAny?.cash_flow ?? null;
  const goalAllocations =
    fa?.goalAllocations ?? hsAny?.goalAllocations ?? hsAny?.goal_allocations ?? [];

  const insights = hsAny?.insights ?? {
    summary: "",
    strengths: [],
    gaps: [],
    advisorHints: [],
  };

  const goalRules = hsAny?.goalRules ?? hsAny?.goal_rules ?? [];
  const redFlagBase = (netWorth?.redFlags ?? netWorth?.red_flags ?? []) as any[];
  const gapBase = (insights?.gaps ?? []) as any[];

  const goalRankMap = new Map<string, number>();
  const rankedGoals = (goalSummary?.goalsRanking ?? goalSummary?.goals_ranking ?? []) as any[];
  for (const g of rankedGoals) {
    goalRankMap.set(String(g.goalId ?? g.goal_id ?? ""), Number(g.rank ?? 99));
  }

  const redFlagsMerged: NormalizedGap[] = [
    ...redFlagBase.map((x: any) => ({
      title: String(x?.title ?? x?.label ?? x ?? "Red Flag"),
      detail: String(x?.detail ?? x?.message ?? x ?? ""),
      severity: String(x?.severity ?? "HIGH").toUpperCase(),
      goalLinked: Boolean(x?.goalLinked ?? x?.goal_linked),
      connectedGoal: x?.goalConnection ?? x?.goal_connection,
      connectedGoalRank: goalRankMap.get(String(x?.goalId ?? x?.goal_id ?? "")),
    })),
    ...goalRules.map((x: any) => ({
      title: String(x?.title ?? x?.rule ?? "Goal Rule"),
      detail: String(x?.detail ?? x?.message ?? ""),
      severity: String(x?.severity ?? "HIGH").toUpperCase(),
      goalLinked: true,
      connectedGoal: x?.goalConnection ?? x?.goal_connection,
      connectedGoalRank: goalRankMap.get(String(x?.goalId ?? x?.goal_id ?? "")),
    })),
    ...gapBase.map((x: any) => ({
      title: String(x?.title ?? "Gap"),
      detail: String(x?.detail ?? ""),
      severity: String(x?.severity ?? "MEDIUM").toUpperCase(),
      goalLinked: Boolean(x?.goalLinked ?? x?.goal_linked),
      connectedGoal: x?.goalConnection ?? x?.goal_connection,
      connectedGoalRank: goalRankMap.get(String(x?.goalId ?? x?.goal_id ?? "")),
    })),
  ].sort((a, b) => {
    if (a.goalLinked && !b.goalLinked) return -1;
    if (!a.goalLinked && b.goalLinked) return 1;
    if (a.goalLinked && b.goalLinked) {
      return (a.connectedGoalRank ?? 99) - (b.connectedGoalRank ?? 99);
    }
    return severityWeight(a.severity) - severityWeight(b.severity);
  });

  const attentionSorted: NormalizedGap[] = gapBase
    .map((g: any) => ({
      title: String(g?.title ?? "Gap"),
      detail: String(g?.detail ?? ""),
      severity: String(g?.severity ?? "MEDIUM").toUpperCase(),
      goalLinked: Boolean(g?.goalLinked ?? g?.goal_linked),
      connectedGoal: g?.goalConnection ?? g?.goal_connection,
      connectedGoalRank: goalRankMap.get(String(g?.goalId ?? g?.goal_id ?? "")),
    }))
    .sort((a, b) => {
      if (a.goalLinked && !b.goalLinked) return -1;
      if (!a.goalLinked && b.goalLinked) return 1;
      if (a.goalLinked && b.goalLinked) {
        return (a.connectedGoalRank ?? 99) - (b.connectedGoalRank ?? 99);
      }
      return severityWeight(a.severity) - severityWeight(b.severity);
    });

  const strengthItems = (insights?.strengths ?? []) as any[];
  const advisorHints = (insights?.advisorHints ?? insights?.advisor_hints ?? []) as string[];
  const [advisorHintsOpen, setAdvisorHintsOpen] = useState(true);
  const isAgentView = true;
  const renderFactorRow = (
    f: {
      id?: string;
      label: string;
      points: number;
      maxPoints: number;
      met: boolean;
      notApplicable?: boolean;
    },
    key: string
  ) => {
    const factorId = String(f.id ?? "");
    const normalizedId = factorId.replace(/^(primary|spouse)_/, "");
    const isSpouseInsured = normalizedId === "spouse_insured";
    const isDisabilityInsurance = normalizedId === "disability_insurance";
    const isMinor = !f.met && (f.maxPoints ?? 0) <= 2;
    const isNA = Boolean(f.notApplicable);
    const spouseIsGreen = isSpouseInsured && f.points >= f.maxPoints;
    const spouseIsAmber = isSpouseInsured && f.points > 0 && f.points < f.maxPoints;
    const spouseIsRed = isSpouseInsured && f.points <= 0;
    const disabilityIsGreen = isDisabilityInsurance && f.points >= f.maxPoints;
    const disabilityIsAmber = isDisabilityInsurance && f.points > 0 && f.points < f.maxPoints;
    const disabilityIsRed = isDisabilityInsurance && f.points <= 0;
    const marker = isNA
      ? "•"
      : spouseIsGreen
      ? "✅"
      : spouseIsAmber
      ? "⚠️"
      : spouseIsRed
      ? "❌"
      : disabilityIsGreen
      ? "✅"
      : disabilityIsAmber
      ? "⚠️"
      : disabilityIsRed
      ? "❌"
      : f.met
      ? "✅"
      : isMinor
      ? "⚠️"
      : "❌";
    const textClass = isNA
      ? "text-muted-foreground"
      : spouseIsGreen
      ? "text-green-700 dark:text-green-300"
      : spouseIsAmber
      ? "text-amber-700 dark:text-amber-300"
      : spouseIsRed
      ? "text-red-700 dark:text-red-300"
      : disabilityIsGreen
      ? "text-green-700 dark:text-green-300"
      : disabilityIsAmber
      ? "text-amber-700 dark:text-amber-300"
      : disabilityIsRed
      ? "text-red-700 dark:text-red-300"
      : f.met
      ? "text-green-700 dark:text-green-300"
      : isMinor
      ? "text-amber-700 dark:text-amber-300"
      : "text-red-700 dark:text-red-300";
    return (
      <div key={key} className="flex items-start justify-between gap-3 text-xs">
        <div className={cn("leading-snug", textClass)}>
          <span>{marker} {f.label}</span>
          {normalizedId === "coverage_adequate" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground"
                    aria-label="How Coverage Adequate is calculated"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-2.5 text-[11px] leading-relaxed">
                  Coverage Adequate compares your current life insurance with recommended coverage.
                  Recommended coverage includes income replacement, debts, children&apos;s education needs,
                  major future liabilities, and a final-expense buffer. The shown value is:
                  current coverage of recommended coverage.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {normalizedId === "employer_match_captured" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground"
                    aria-label="How employer match captured is calculated"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-2.5 text-[11px] leading-relaxed">
                  This factor uses your 401(k) match inputs to check whether you are fully capturing employer match.
                  Under-utilization is flagged, while contributions above match threshold are shown as a strength
                  with guidance to consider tax-diversified options like IUL.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {normalizedId === "savings_ratio" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground"
                    aria-label="How savings ratio is calculated"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-2.5 text-[11px] leading-relaxed">
                  Savings ratio = retirement assets divided by annual income.
                  It is compared to an age-based target multiple (for example age 35 = 2.0x).
                  Scoring rule: 5 points if ratio meets/exceeds target, 3 points if ratio is at least
                  50% of target, otherwise 0 points.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {normalizedId === "spouse_insured" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground"
                    aria-label="How Spouse/partner insured is calculated"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-2.5 text-[11px] leading-relaxed">
                  Spouse/partner insured is scored equally for both partners:
                  6/6 if both are insured, 3/6 if only one is insured, and
                  0/6 if neither is insured.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {normalizedId === "living_benefits" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground"
                    aria-label="How Living Benefits is calculated"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-2.5 text-[11px] leading-relaxed">
                  Living Benefits is met when a life insurance policy includes a living benefits rider,
                  typically covering critical, chronic, and terminal illness access.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {normalizedId === "disability_insurance" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground"
                    aria-label="How Disability insurance is calculated"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-2.5 text-[11px] leading-relaxed">
                  Disability insurance scoring: 5/5 if disability coverage exists,
                  2.5/5 when no disability policy exists but living benefits rider is present,
                  and 0/5 when neither is present. If both disability and living benefits are present,
                  a red-flag overlap warning may be shown.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {normalizedId === "ltc_consideration" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground"
                    aria-label="How Long-term care planning is scored"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-2.5 text-[11px] leading-relaxed">
                  Long-term care planning is treated as optional in this score
                  and does not reduce your overall rating.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {normalizedId === "umbrella_liability" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground"
                    aria-label="How Umbrella liability policy is scored"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-2.5 text-[11px] leading-relaxed">
                  Umbrella liability policy is treated as optional in this score
                  and does not reduce your overall rating.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {normalizedId === "coverage_gap_severity" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground"
                    aria-label="How Coverage gap status is scored"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-2.5 text-[11px] leading-relaxed">
                  Coverage gap status is shown for context but treated as optional
                  in this score and does not reduce your overall rating.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="shrink-0 font-semibold">
          {f.points}/{f.maxPoints}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4 rounded-b-xl border border-t-0 p-5">
      {goalAware && goalSummary && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                🎯 This analysis is personalized to your goals
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {rankedGoals.slice(0, 5).map((g: any, i: number) => (
                  <span key={i} className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                    #{g.rank ?? i + 1} {g.label ?? g.goal_id ?? g.goalId}
                  </span>
                ))}
              </div>
              {(goalSummary?.riskProfile || goalSummary?.retirementTargetAge || goalSummary?.risk_profile || goalSummary?.retirement_target_age) && (
                <p className="mt-2 text-xs text-blue-700/80 dark:text-blue-300/80">
                  Risk Profile: {goalSummary?.riskProfile ?? goalSummary?.risk_profile ?? "—"} | Retirement: Age {goalSummary?.retirementTargetAge ?? goalSummary?.retirement_target_age ?? "—"}
                </p>
              )}
            </div>
            {insights?.summary && (
              <div className="rounded-lg border border-blue-200/70 bg-white/70 p-3 lg:max-w-md dark:border-blue-900/60 dark:bg-blue-950/30">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  <Info className="size-3.5" /> Summary
                </p>
                <p className="text-xs leading-relaxed text-blue-900/90 dark:text-blue-100/90">{insights.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,3fr)]">
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex size-28 items-center justify-center">
                <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/30" />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${pctTotal} 100.5`}
                    strokeLinecap="round"
                    className={totalScoreRingClass(total)}
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="text-3xl font-black">{total}</p>
                  <p className="text-xs text-muted-foreground">/ {maxScore}</p>
                </div>
              </div>
              <p className="text-sm font-semibold">Financial Health Score</p>
              {goalAware && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  Personalized to your goals
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Category Breakdown
            </p>
            <div className="space-y-3">
              {normalizedCategories.map((cat) => {
                const widthPct = cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0;
                return (
                  <div key={cat.key} className="space-y-1.5">
                    <button
                      className="flex w-full items-center justify-between gap-2 text-left"
                      onClick={() => toggleCategory(cat.key)}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">{cat.label}</span>
                        {cat.goalConnection && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            {cat.goalConnection}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{cat.score}/{cat.maxScore}</span>
                        {expandedCategories[cat.key] ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </div>
                    </button>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", scoreColorClass(cat.score, cat.maxScore))}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {cat.weightLabel ?? `${Math.round((cat.maxScore / 100) * 100)}%`}
                    </p>

                    {expandedCategories[cat.key] && (cat.factors.length > 0 || (cat.subsections?.length ?? 0) > 0) && (
                      <div className="mt-2 space-y-1 rounded-lg border bg-muted/20 p-2.5">
                        {(cat.subsections ?? []).length > 0 && (
                          <div className="space-y-2">
                            {(cat.subsections ?? []).map((section) => (
                              <div key={`${cat.key}_${section.id}`} className="rounded-md border bg-background/70 p-2.5">
                                <div className="mb-1.5 flex items-center justify-between text-xs">
                                  <span className="font-semibold">{section.label}</span>
                                  <span className="font-semibold">{section.score}/{section.maxScore}</span>
                                </div>
                                <div className="space-y-1">
                                  {section.factors.map((f, idx) =>
                                    renderFactorRow(f, `${cat.key}_${section.id}_${idx}`)
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {cat.factors.map((f, idx) =>
                          renderFactorRow(f, `${cat.key}_${idx}`)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {showHiddenMoney && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">💰 Hidden Money Found</p>
              <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-200/90">
                We found {fmtDollars(hiddenRedirect + unallocatedSurplus)}/month already in your finances that could work harder for you.
              </p>
              <div className="mt-3 space-y-2">
                {hiddenSources.map((s: any, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-3 rounded-lg border bg-white/80 p-3 dark:bg-emerald-950/20">
                    <div>
                      <p className="text-sm font-semibold">{s.source ?? "Source"}</p>
                      <p className="text-xs text-muted-foreground">{s.detail ?? s.description ?? ""}</p>
                    </div>
                    <p className="text-sm font-bold">{fmtDollars(Number(s.amountMonthly ?? s.amount_monthly ?? 0))}/mo</p>
                  </div>
                ))}
                {unallocatedSurplus > 0 && (
                  <div className="flex items-start justify-between gap-3 rounded-lg border bg-white/80 p-3 dark:bg-emerald-950/20">
                    <div>
                      <p className="text-sm font-semibold">Unallocated monthly surplus</p>
                      <p className="text-xs text-muted-foreground">
                        {goalAware ? "Not directed toward any of your stated financial goals." : "Not directed toward specific financial objectives."}
                      </p>
                    </div>
                    <p className="text-sm font-bold">{fmtDollars(unallocatedSurplus)}/mo</p>
                  </div>
                )}
              </div>
              <p className="mt-3 text-base font-black text-emerald-700 dark:text-emerald-300">
                TOTAL AVAILABLE: {fmtDollars(hiddenRedirect + unallocatedSurplus)}/month
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-4 py-2">
            {analysisLoading ? (
              <>
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Running full computation engine...</span>
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
                <span className="text-xs text-emerald-600">Full analysis complete</span>
                <Button size="sm" variant="ghost" onClick={runFullAnalysis} className="ml-auto h-6 gap-1 px-2 text-xs">
                  <RefreshCw className="size-3" /> Re-run
                </Button>
              </>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Net Worth</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Total Assets</span><span className="font-semibold text-foreground">{fmtDollars(assets)}</span></div>
                <div className="flex justify-between"><span>Total Liabilities</span><span className="font-semibold text-foreground">{fmtDollars(liabilities)}</span></div>
                <div className="mt-1 flex justify-between border-t pt-1.5"><span className="font-bold">Net Worth</span><span className="text-sm font-black text-foreground">{fmtDollars(netWorthVal)}</span></div>
              </div>
              <div className="mt-3 space-y-1">
                {netWorthBars.map((bar) => (
                  <div key={bar.label} className="flex items-center gap-1.5">
                    <span className="w-16 truncate text-[10px] text-muted-foreground">{bar.label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className={cn("h-full rounded-full", bar.color)} style={{ width: `${(bar.value / maxBarValue) * 100}%` }} />
                    </div>
                    <span className="w-12 text-right text-[10px] font-medium">{fmtDollars(bar.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Tax Buckets</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Tax Deferred</span><span className="font-semibold">{taxDeferred > 1 ? `${taxDeferred}%` : fmtDollars(taxDeferred)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax Free</span><span className="font-semibold">{taxFree > 1 ? `${taxFree}%` : fmtDollars(taxFree)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Taxable</span><span className="font-semibold">{taxable > 1 ? `${taxable}%` : fmtDollars(taxable)}</span></div>
              </div>
            </div>
          </div>

          {cashFlow && (
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Monthly Cash Flow</p>
              <p className="text-sm text-muted-foreground">
                {fmtDollars(Number(cashFlow.monthlyGrossIncome ?? cashFlow.monthly_gross_income ?? 0))} gross →
                {" "}
                {fmtDollars(Number(cashFlow.monthlyNetTakeHome ?? cashFlow.monthly_net_take_home ?? 0))} net
              </p>

              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between"><span>Fixed Expenses</span><span>{fmtDollars(Number(cashFlow.totalMonthlyExpenses ?? cashFlow.total_monthly_expenses ?? 0))}/mo</span></div>
                <div className="flex justify-between"><span>Surplus / Deficit</span><span className="font-semibold">{fmtDollars(Number(cashFlow.monthlySurplusOrDeficit ?? cashFlow.monthly_surplus_or_deficit ?? 0))}/mo</span></div>
              </div>

              {Array.isArray(goalAllocations) && goalAllocations.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Where Your Money Goes</p>
                  {goalAllocations.map((a: any, i: number) => {
                    const amount = Number(a.amountMonthly ?? a.amount_monthly ?? 0);
                    const pct = Number(a.percent ?? a.percentage ?? 0);
                    const status = String(a.status ?? "");
                    const cls = status === "opportunity" ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20" : "border-border bg-muted/20";
                    return (
                      <div key={i} className={cn("rounded-lg border p-2", cls)}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium">{a.label ?? a.name ?? "Allocation"}</span>
                          <span>{fmtDollars(amount)}/mo {pct ? `(${pct}%)` : ""}</span>
                        </div>
                        {a.goalConnected && (
                          <p className="mt-1 text-[11px] text-primary">🎯 {a.goalLabel ?? a.goal_label ?? "Goal-linked"}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {redFlagsMerged.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50/30 p-4 dark:border-red-900/50 dark:bg-red-950/10">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-500">Red Flags</p>
              <div className="space-y-2">
                {redFlagsMerged.map((f, i) => (
                  <div key={i} className="rounded-lg bg-white/80 p-2.5 dark:bg-red-950/20">
                    <p className="text-xs font-semibold">
                      {f.severity === "CRITICAL" ? "🔴" : f.severity === "HIGH" ? "🟠" : f.severity === "MEDIUM" ? "🟡" : "🔵"} {f.title}
                    </p>
                    <p className="text-[11px] leading-snug text-muted-foreground">{f.detail}</p>
                    {f.goalLinked && f.connectedGoal && (
                      <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        🎯 {f.connectedGoal}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {strengthItems.length > 0 && (
              <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-900/50 dark:bg-green-950/10">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
                  <CheckCircle2 className="size-4" /> What You&apos;re Doing Well
                </p>
                <div className="space-y-2">
                  {strengthItems.map((s: any, i: number) => (
                    <div key={i} className="rounded-lg bg-white/80 p-2.5 dark:bg-green-950/20">
                      <p className="text-xs font-semibold">{s.title}</p>
                      <p className="text-[11px] leading-snug text-muted-foreground">{s.detail}</p>
                      {(s.goalConnection ?? s.goal_connection) && (
                        <p className="mt-1 text-[11px] text-primary">🎯 {(s.goalConnection ?? s.goal_connection)}</p>
                      )}
                      {(s.warning ?? s.gapNote ?? s.gap_note) && (
                        <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">⚠️ {s.warning ?? s.gapNote ?? s.gap_note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attentionSorted.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/10">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="size-4" /> Areas That Need Attention
                </p>
                <div className="space-y-2">
                  {attentionSorted.map((g, i) => (
                    <div key={i} className="rounded-lg bg-white/80 p-2.5 dark:bg-amber-950/20">
                      <p className="text-xs font-semibold">
                        {g.severity === "CRITICAL" ? "🔴" : g.severity === "HIGH" ? "🟠" : g.severity === "MEDIUM" ? "🟡" : "🔵"} {g.title}
                      </p>
                      <p className="text-[11px] leading-snug text-muted-foreground">{g.detail}</p>
                      {g.goalLinked && g.connectedGoal && (
                        <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          🎯 {g.connectedGoal}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isAgentView && advisorHints.length > 0 && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900/50 dark:bg-violet-950/10">
              <button
                onClick={() => setAdvisorHintsOpen((p) => !p)}
                className="flex w-full items-center gap-2 text-left"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300">
                  💡 Advisor Notes
                </p>
                <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                  Agent only
                </span>
                {advisorHintsOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
              {advisorHintsOpen && (
                <ul className="mt-2 space-y-1.5">
                  {advisorHints.map((h, i) => (
                    <li key={i} className="text-xs text-violet-800 dark:text-violet-200">• {h}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Debug Panel ── */}
      <div className="rounded-lg border border-dashed border-orange-300 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/10">
        <button
          onClick={() => setDebugOpen((p) => !p)}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400"
        >
          <Bug className="size-4" />
          Debug: API Calls ({debugLogs.length})
          {debugOpen ? <ChevronUp className="ml-auto size-4" /> : <ChevronDown className="ml-auto size-4" />}
        </button>
        {debugOpen && (
          <div className="space-y-3 px-4 pb-4">
            {debugLogs.length === 0 && (
              <p className="text-xs text-muted-foreground">No API calls logged yet.</p>
            )}
            {debugLogs.map((log, idx) => (
              <div key={idx} className="rounded-lg border bg-white p-3 dark:bg-slate-900">
                <div className="mb-2 flex items-center gap-2">
                  <span className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-bold",
                    log.method === "POST" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                  )}>
                    {log.method}
                  </span>
                  <span className="text-xs font-semibold text-foreground">{log.label}</span>
                  {log.durationMs != null && (
                    <span className="text-[10px] text-muted-foreground">({log.durationMs}ms)</span>
                  )}
                  {log.error && <span className="text-[10px] font-bold text-red-500">ERROR</span>}
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">URL</p>
                    <pre className="mt-0.5 overflow-x-auto rounded bg-slate-100 p-2 text-[11px] dark:bg-slate-800">
                      {log.url}
                    </pre>
                  </div>

                  {log.input && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Input Payload</p>
                      <pre className="mt-0.5 max-h-40 overflow-auto rounded bg-slate-100 p-2 text-[11px] dark:bg-slate-800">
                        {JSON.stringify(log.input, null, 2)}
                      </pre>
                    </div>
                  )}

                  {log.error && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-red-500">Error</p>
                      <pre className="mt-0.5 overflow-x-auto rounded bg-red-50 p-2 text-[11px] text-red-700 dark:bg-red-950/30 dark:text-red-300">
                        {log.error}
                      </pre>
                    </div>
                  )}

                  {log.rawResponse && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Raw Response from Backend</p>
                      <pre className="mt-0.5 max-h-60 overflow-auto rounded bg-slate-100 p-2 text-[11px] dark:bg-slate-800">
                        {JSON.stringify(log.rawResponse, null, 2)}
                      </pre>
                    </div>
                  )}

                  {log.transformedResponse && log.rawResponse !== log.transformedResponse && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Transformed (camelCase) — Used by UI</p>
                      <pre className="mt-0.5 max-h-60 overflow-auto rounded bg-slate-100 p-2 text-[11px] dark:bg-slate-800">
                        {JSON.stringify(log.transformedResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
