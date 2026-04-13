"use client";

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

function fmtDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtExactDollars(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
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
  caseData,
  clientState,
  fullAnalysisData,
  disableAutoRefresh,
  onContinue,
  isSubmitting,
}: {
  caseId: string;
  healthScore?: FinancialHealthScore | null;
  caseData?: {
    riskProfile?: string;
    riskScore?: number;
  } | null;
  clientState?: string;
  fullAnalysisData?: any;
  disableAutoRefresh?: boolean;
  onContinue: () => void | Promise<void>;
  isSubmitting?: boolean;
}) {
  const [fullAnalysis, setFullAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [freshHealthScore, setFreshHealthScore] = useState<FinancialHealthScore | null>(null);
  const [expandedCashFlowSections, setExpandedCashFlowSections] = useState<{
    netTakeHome: boolean;
    expensesAndSurplus: boolean;
  }>({
    netTakeHome: false,
    expensesAndSurplus: false,
  });
  const [hiddenMoneyDerivationExpanded, setHiddenMoneyDerivationExpanded] = useState(false);
  const hasRun = useRef<string | null>(null);
  const activeRunToken = useRef(0);

  const healthScore = freshHealthScore ?? healthScoreProp ?? null;
  useEffect(() => {
    if (fullAnalysisData) {
      const payloadCaseId =
        String(fullAnalysisData?.caseId ?? fullAnalysisData?.case_id ?? "");
      if (payloadCaseId && payloadCaseId !== caseId) {
        return;
      }
      setFullAnalysis(fullAnalysisData);
    }
  }, [caseId, fullAnalysisData]);
  const toggleCashFlowSection = (section: "netTakeHome" | "expensesAndSurplus") =>
    setExpandedCashFlowSections((prev) => ({ ...prev, [section]: !prev[section] }));
  const toggleHiddenMoneyDerivation = () =>
    setHiddenMoneyDerivationExpanded((prev) => !prev);

  const fetchHealthScore = async (runToken: number) => {
    try {
      const { data } = await apiClient.get<any>(
        `/cases/${caseId}/financial-health-score/`
      );
      if (activeRunToken.current !== runToken) return;
      const rawExtracted = data?.data ?? data;
      const transformed = deepConvertKeys(rawExtracted, toCamelCase) as FinancialHealthScore;
      setFreshHealthScore(transformed);
    } catch {
      // Non-blocking: UI can still render with existing score payload.
    }
  };

  const runFullAnalysis = async (runToken: number) => {
    setAnalysisLoading(true);
    setAnalysisError(null);

    const resolvedState = clientState || "unknown";
    const inputPayload = { case_id: caseId, state: resolvedState };

    try {
      const { data } = await apiClient.post<any>(
        "/compute/financial/full-analysis",
        inputPayload
      );
      if (activeRunToken.current !== runToken) return;
      const rawExtracted = data?.data ?? data;
      const transformed = deepConvertKeys(rawExtracted, toCamelCase);
      setFullAnalysis(transformed);
    } catch (err: any) {
      if (activeRunToken.current !== runToken) return;
      const msg = err.message || "Full analysis failed";
      setAnalysisError(msg);
    } finally {
      if (activeRunToken.current === runToken) {
        setAnalysisLoading(false);
      }
    }
  };

  useEffect(() => {
    if (caseId && hasRun.current !== caseId) {
      hasRun.current = caseId;
      activeRunToken.current += 1;
      const runToken = activeRunToken.current;
      setFullAnalysis(null);
      setFreshHealthScore(null);
      setAnalysisError(null);
      // Always pull a fresh health score once on mount so factor rule updates
      // (for example asset-backed debt trajectory relief) are reflected immediately.
      fetchHealthScore(runToken);
      if (!disableAutoRefresh) {
        runFullAnalysis(runToken);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, disableAutoRefresh]);

  if (!healthScore) {
    return (
      <div className="space-y-4 rounded-b-xl border border-t-0 p-5">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="mr-2 size-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading insights — fetching health score &amp; running analysis...</p>
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
  const taxDeferred = Number(taxBuckets?.taxDeferred ?? taxBuckets?.tax_deferred ?? 0);
  const taxFree = Number(taxBuckets?.taxFree ?? taxBuckets?.tax_free ?? 0);
  const taxable = Number(taxBuckets?.taxable ?? taxBuckets?.tax_now ?? 0);
  const taxDeferredItems = (taxBuckets?.taxDeferredItems ?? taxBuckets?.tax_deferred_items ?? []) as Array<{ instrument?: string }>;
  const taxFreeItems = (taxBuckets?.taxFreeItems ?? taxBuckets?.tax_free_items ?? []) as Array<{ instrument?: string }>;
  const taxableItems = (taxBuckets?.taxableItems ?? taxBuckets?.taxable_items ?? []) as Array<{ instrument?: string }>;
  const taxTotal = Math.max(taxDeferred + taxFree + taxable, 0);
  const taxDeferredPct = taxTotal > 0 ? (taxDeferred / taxTotal) * 100 : 0;
  const taxFreePct = taxTotal > 0 ? (taxFree / taxTotal) * 100 : 0;
  const taxablePct = taxTotal > 0 ? (taxable / taxTotal) * 100 : 0;
  const formatBucketInstruments = (items: Array<{ instrument?: string }>): string => {
    const names = Array.from(new Set(items.map((i) => String(i?.instrument ?? "").trim()).filter(Boolean)));
    if (names.length === 0) return "No instruments recorded";
    const shown = names.slice(0, 3).join(", ");
    return names.length > 3 ? `${shown} +${names.length - 3} more` : shown;
  };

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
  const hiddenCalculationTrace = hiddenMoney?.calculationTrace ?? hiddenMoney?.calculation_trace ?? {};
  const hiddenRetirementTrace = hiddenMoney?.retirementTrace ?? hiddenMoney?.retirement_trace ?? {};
  const hiddenExcessAboveMatch = Number(
    hiddenRetirementTrace?.excessAboveMatchMonthly ??
      hiddenRetirementTrace?.excess_above_match_monthly ??
      hiddenCalculationTrace?.retirementExcessAboveMatchMonthly ??
      hiddenCalculationTrace?.retirement_excess_above_match_monthly ??
      0
  );
  const hiddenTaxableInvestmentMonthly = Number(
    hiddenCalculationTrace?.taxableInvestmentMonthly ??
      hiddenCalculationTrace?.taxable_investment_monthly ??
      0
  );
  const hiddenCoverageGap = Number(hiddenCalculationTrace?.coverageGap ?? hiddenCalculationTrace?.coverage_gap ?? 0);
  const hiddenUnclaimedMatchMonthly = Number(
    hiddenCalculationTrace?.unclaimedMatchMonthlyOpportunity ??
      hiddenCalculationTrace?.unclaimed_match_monthly_opportunity ??
      0
  );
  const hiddenSourceTotal = hiddenSources.reduce(
    (sum: number, s: any) => sum + Number(s?.amountMonthly ?? s?.monthly_amount ?? 0),
    0
  );
  const showHiddenMoneyFromHidden = hiddenRedirect > 0 || unallocatedSurplus > 0;
  const rolloverOpportunity =
    hsAny?.rolloverOpportunity ??
    hsAny?.rollover_opportunity ??
    null;
  const rolloverEligible = Boolean(rolloverOpportunity?.eligible);
  const rolloverAccounts = Number(
    rolloverOpportunity?.candidateAccounts ?? rolloverOpportunity?.candidate_accounts ?? 0
  );
  const rolloverBalance = Number(
    rolloverOpportunity?.totalBalance ?? rolloverOpportunity?.total_balance ?? 0
  );
  const rolloverBonusLowPct = Number(
    rolloverOpportunity?.bonusLowPct ?? rolloverOpportunity?.bonus_low_pct ?? 0
  );
  const rolloverBonusHighPct = Number(
    rolloverOpportunity?.bonusHighPct ?? rolloverOpportunity?.bonus_high_pct ?? 0
  );
  const rolloverBonusLowAmount = Number(
    rolloverOpportunity?.bonusLowAmount ?? rolloverOpportunity?.bonus_low_amount ?? 0
  );
  const rolloverBonusHighAmount = Number(
    rolloverOpportunity?.bonusHighAmount ?? rolloverOpportunity?.bonus_high_amount ?? 0
  );
  const rolloverState = String(rolloverOpportunity?.state ?? "").toUpperCase();
  const realEstateAnalysis = hsAny?.realEstateAnalysis ?? hsAny?.real_estate_analysis ?? null;
  const realEstatePrimary = realEstateAnalysis?.primary ?? {};
  const realEstateRentals = (
    realEstateAnalysis?.rentalProperties ?? realEstateAnalysis?.rental_properties ?? []
  ) as Array<any>;
  const totalMonthlyNetRentalIncome = Number(
    realEstateAnalysis?.totalMonthlyNetRentalIncome ??
      realEstateAnalysis?.total_monthly_net_rental_income ??
      0
  );
  const totalRentalEquity = Number(
    realEstateAnalysis?.totalRentalEquity ?? realEstateAnalysis?.total_rental_equity ?? 0
  );
  const realEstateConcentration = Number(
    realEstateAnalysis?.concentrationPctOfNetWorth ??
      realEstateAnalysis?.concentration_pct_of_net_worth ??
      0
  );
  const hasPrimaryProperty = Boolean(
    realEstateAnalysis?.hasPrimaryProperty ?? realEstateAnalysis?.has_primary_property
  );
  const shouldShowRealEstateAnalysis = Boolean(
    realEstateAnalysis &&
      (hasPrimaryProperty ||
        realEstateRentals.length > 0 ||
        totalRentalEquity > 0 ||
        totalMonthlyNetRentalIncome !== 0)
  );
  const shouldShowRentalPortfolio = realEstateRentals.length > 0;

  const cashFlow = fa?.cashFlow ?? hsAny?.cashFlow ?? hsAny?.cash_flow ?? null;
  const cashFlowGross = Number(cashFlow?.monthlyGrossIncome ?? cashFlow?.monthly_gross_income ?? 0);
  const cashFlowTaxes = Number(cashFlow?.monthlyEstimatedTaxes ?? cashFlow?.monthly_estimated_taxes ?? 0);
  const cashFlowRetirement = Number(
    cashFlow?.monthlyRetirementContributions ?? cashFlow?.monthly_retirement_contributions ?? 0
  );
  const cashFlowHealthInsurance = Number(
    cashFlow?.monthlyHealthInsurance ?? cashFlow?.monthly_health_insurance ?? 0
  );
  const cashFlowOtherDeductions = Number(
    cashFlow?.monthlyOtherDeductions ?? cashFlow?.monthly_other_deductions ?? 0
  );
  const cashFlowTotalDeductions = Number(cashFlow?.totalDeductions ?? cashFlow?.total_deductions ?? 0);
  const cashFlowNet = Number(cashFlow?.monthlyNetTakeHome ?? cashFlow?.monthly_net_take_home ?? 0);
  const cashFlowFixedExpenses = Number(cashFlow?.monthlyFixedExpenses ?? cashFlow?.monthly_fixed_expenses ?? 0);
  const cashFlowDebtService = Number(cashFlow?.monthlyDebtService ?? cashFlow?.monthly_debt_service ?? 0);
  const cashFlowDiscretionary = Number(cashFlow?.monthlyDiscretionary ?? cashFlow?.monthly_discretionary ?? 0);
  const cashFlowRemittances = Number(cashFlow?.monthlyRemittances ?? cashFlow?.monthly_remittances ?? 0);
  const cashFlowTotalExpenses = Number(
    cashFlow?.totalMonthlyExpenses ?? cashFlow?.total_monthly_expenses ?? 0
  );
  const cashFlowSurplus = Number(
    cashFlow?.monthlySurplusOrDeficit ?? cashFlow?.monthly_surplus_or_deficit ?? 0
  );
  const monthlyHousingPiti = Number(
    realEstatePrimary?.monthlyPayment ?? realEstatePrimary?.monthly_payment ?? 0
  );
  const otherFixedExpenses = Math.max(cashFlowFixedExpenses - monthlyHousingPiti, 0);
  const displayedUnallocatedSurplus = cashFlow
    ? Math.max(cashFlowSurplus, 0)
    : Math.max(unallocatedSurplus, 0);
  const displayedTotalAvailableCashFlow =
    hiddenRedirect + displayedUnallocatedSurplus;
  const showHiddenMoney =
    showHiddenMoneyFromHidden || displayedUnallocatedSurplus > 0;
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
  const riskProfileLabel =
    goalSummary?.riskProfile ??
    goalSummary?.risk_profile ??
    goalSummary?.riskTolerance ??
    goalSummary?.risk_tolerance ??
    caseData?.riskProfile ??
    "⚠ Not assessed";
  const riskScoreValue =
    goalSummary?.riskScore ??
    goalSummary?.risk_score ??
    caseData?.riskScore;
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
          {isNA ? "N/A" : `${f.points}/${f.maxPoints}`}
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
              {(riskProfileLabel || goalSummary?.retirementTargetAge || goalSummary?.retirement_target_age) && (
                <p className="mt-2 text-xs text-blue-700/80 dark:text-blue-300/80">
                  Risk Profile: {riskProfileLabel}
                  {riskScoreValue ? ` (${riskScoreValue}/20)` : ""}
                  {" "} | Retirement: Age {goalSummary?.retirementTargetAge ?? goalSummary?.retirement_target_age ?? "—"}
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
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">💰 Cash Flow Optimization Opportunities</p>
              <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-200/90">
                We found {fmtExactDollars(displayedTotalAvailableCashFlow)}/month of unallocated surplus already available in your plan.
              </p>
              <div className="mt-3 space-y-2">
                {hiddenSources.map((s: any, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-3 rounded-lg border bg-white/80 p-3 dark:bg-emerald-950/20">
                    <div>
                      <p className="text-sm font-semibold">{s.source ?? "Source"}</p>
                      <p className="text-xs text-muted-foreground">{s.detail ?? s.description ?? ""}</p>
                    </div>
                    <p className="text-sm font-bold">{fmtExactDollars(Number(s.amountMonthly ?? s.amount_monthly ?? 0))}/mo</p>
                  </div>
                ))}
                {displayedUnallocatedSurplus > 0 && (
                  <div className="flex items-start justify-between gap-3 rounded-lg border bg-white/80 p-3 dark:bg-emerald-950/20">
                    <div>
                      <p className="text-sm font-semibold">
                        Unallocated monthly surplus
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground"
                                aria-label="How unallocated surplus is calculated"
                              >
                                <Info className="size-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs p-2.5 text-[11px] leading-relaxed">
                              Unallocated surplus = max(monthly net take-home - [fixed expenses + debt payments + discretionary + remittances], 0).
                              It represents leftover cash flow not yet assigned to specific goals.
                              Values are monthly approximations from provided inputs.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {goalAware ? "Not directed toward any of your stated financial goals." : "Not directed toward specific financial objectives."}
                      </p>
                    </div>
                    <p className="text-sm font-bold">{fmtExactDollars(displayedUnallocatedSurplus)}/mo</p>
                  </div>
                )}
                {hiddenUnclaimedMatchMonthly > 0 && (
                  <div className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <div>
                      <p className="text-sm font-semibold">Unclaimed employer match (opportunity)</p>
                      <p className="text-xs text-muted-foreground">
                        This is potential employer match you may be missing. It is informational only and not counted in total available unallocated surplus.
                      </p>
                    </div>
                    <p className="text-sm font-bold">{fmtExactDollars(hiddenUnclaimedMatchMonthly)}/mo</p>
                  </div>
                )}
              </div>
              <div className="mt-3 rounded-lg border bg-white/70 p-3 text-xs dark:bg-emerald-950/20">
                <button
                  type="button"
                  onClick={toggleHiddenMoneyDerivation}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <p className="font-semibold text-foreground">How this unallocated surplus is derived</p>
                  {hiddenMoneyDerivationExpanded ? (
                    <ChevronUp className="size-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  )}
                </button>
                {hiddenMoneyDerivationExpanded && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">
                      Transparent monthly waterfall from gross income to unallocated surplus.
                    </p>
                    <div className="flex justify-between"><span>Gross household income</span><span>{fmtExactDollars(cashFlowGross)}/mo</span></div>
                    <div className="flex justify-between"><span>Estimated taxes</span><span>- {fmtExactDollars(cashFlowTaxes)}/mo</span></div>
                    <div className="flex justify-between"><span>Employee retirement contribution</span><span>- {fmtExactDollars(cashFlowRetirement)}/mo</span></div>
                    <div className="flex justify-between"><span>Health insurance</span><span>- {fmtExactDollars(cashFlowHealthInsurance)}/mo</span></div>
                    <div className="flex justify-between"><span>Other payroll deductions</span><span>- {fmtExactDollars(cashFlowOtherDeductions)}/mo</span></div>
                    <div className="flex justify-between border-t pt-1.5"><span>Net take-home</span><span>{fmtExactDollars(cashFlowNet)}/mo</span></div>
                    <div className="flex justify-between"><span>Mortgage / housing (PITI)</span><span>- {fmtExactDollars(monthlyHousingPiti)}/mo</span></div>
                    <div className="flex justify-between"><span>Other fixed expenses</span><span>- {fmtExactDollars(otherFixedExpenses)}/mo</span></div>
                    <div className="flex justify-between"><span>Monthly debt payments</span><span>- {fmtExactDollars(cashFlowDebtService)}/mo</span></div>
                    <div className="flex justify-between"><span>Discretionary spending</span><span>- {fmtExactDollars(cashFlowDiscretionary)}/mo</span></div>
                    <div className="flex justify-between"><span>Remittances</span><span>- {fmtExactDollars(cashFlowRemittances)}/mo</span></div>
                    <div className="flex justify-between border-t pt-1.5"><span>Total monthly expenses</span><span>- {fmtExactDollars(cashFlowTotalExpenses)}/mo</span></div>
                    <div className="flex justify-between">
                      <span>Unclaimed employer match opportunity (not included in total)</span>
                      <span>{fmtExactDollars(hiddenUnclaimedMatchMonthly)}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Unallocated surplus
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground"
                                aria-label="How unallocated surplus is calculated"
                              >
                                <Info className="size-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs p-2.5 text-[11px] leading-relaxed">
                              Unallocated surplus = max(monthly net take-home - [fixed expenses + debt payments + discretionary + remittances], 0).
                              It represents leftover cash flow not yet assigned to specific goals.
                              Values are monthly approximations from provided inputs.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                      <span>{fmtExactDollars(displayedUnallocatedSurplus)}/mo</span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5"><span>Excess above match (potentially redirectable)</span><span>{fmtExactDollars(hiddenExcessAboveMatch)}/mo</span></div>
                    <div className="flex justify-between"><span>Taxable investment contributions</span><span>{fmtExactDollars(hiddenTaxableInvestmentMonthly)}/mo</span></div>
                    <div className="flex justify-between"><span>Coverage gap used in rule check</span><span>{fmtExactDollars(hiddenCoverageGap)}</span></div>
                    <div className="flex justify-between"><span>Source line-items subtotal</span><span>{fmtExactDollars(hiddenSourceTotal)}/mo</span></div>
                    <div className="flex justify-between"><span>Redirectable from identified sources</span><span>{fmtExactDollars(hiddenRedirect)}/mo</span></div>
                    <div className="flex justify-between border-t pt-1.5 font-semibold">
                      <span>Total available cash flow (Redirectable + Surplus)</span>
                      <span>{fmtExactDollars(displayedTotalAvailableCashFlow)}/mo</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-3 text-base font-black text-emerald-700 dark:text-emerald-300">
                TOTAL AVAILABLE CASH FLOW: {fmtExactDollars(displayedTotalAvailableCashFlow)}/month
              </p>
            </div>
          )}
          {rolloverEligible && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900/50 dark:bg-violet-950/20">
              <p className="text-sm font-bold text-violet-700 dark:text-violet-300">
                🔄 Previous 401(k) Rollover Opportunity
              </p>
              <p className="mt-1 text-sm text-violet-900/90 dark:text-violet-200/90">
                You have {rolloverAccounts} previous 401(k) account{rolloverAccounts === 1 ? "" : "s"} with about{" "}
                {fmtDollars(rolloverBalance)} that may be rolled over to a new financial institution.
              </p>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated bonus range</span>
                  <span className="font-semibold">
                    {rolloverBonusLowPct.toFixed(0)}% - {rolloverBonusHighPct.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated bonus amount</span>
                  <span className="font-semibold">
                    {fmtDollars(rolloverBonusLowAmount)} - {fmtDollars(rolloverBonusHighAmount)}
                  </span>
                </div>
                {rolloverState && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">State considered</span>
                    <span className="font-semibold">{rolloverState}</span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Bonus estimates are approximate (typically 10%-25%) and depend on state and provider program terms.
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
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    activeRunToken.current += 1;
                    runFullAnalysis(activeRunToken.current);
                  }}
                  className="h-6 gap-1 px-2 text-xs"
                >
                  <RefreshCw className="size-3" /> Retry
                </Button>
              </>
            ) : fa ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-xs text-emerald-600">Full analysis complete</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    activeRunToken.current += 1;
                    runFullAnalysis(activeRunToken.current);
                  }}
                  className="ml-auto h-6 gap-1 px-2 text-xs"
                >
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
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Tax Buckets Distribution</p>
              <p className="mb-2 text-[11px] text-muted-foreground">
                Distribution of assets by tax treatment: pre-tax (tax deferred), tax-free, and taxable.
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Tax Deferred</span><span className="font-semibold">{fmtDollars(taxDeferred)} ({taxDeferredPct.toFixed(0)}%)</span></div>
                <p className="pl-0 text-[11px]">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Includes:</span>{" "}
                  <span className="text-blue-700 dark:text-blue-300">{formatBucketInstruments(taxDeferredItems)}</span>
                </p>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax Free</span><span className="font-semibold">{fmtDollars(taxFree)} ({taxFreePct.toFixed(0)}%)</span></div>
                <p className="pl-0 text-[11px]">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Includes:</span>{" "}
                  <span className="text-emerald-700 dark:text-emerald-300">{formatBucketInstruments(taxFreeItems)}</span>
                </p>
                <div className="flex justify-between"><span className="text-muted-foreground">Taxable</span><span className="font-semibold">{fmtDollars(taxable)} ({taxablePct.toFixed(0)}%)</span></div>
                <p className="pl-0 text-[11px]">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Includes:</span>{" "}
                  <span className="text-amber-700 dark:text-amber-300">{formatBucketInstruments(taxableItems)}</span>
                </p>
              </div>
            </div>
          </div>

          {shouldShowRealEstateAnalysis && (
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Real Estate & Mortgage Analysis
              </p>
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="mb-1 font-semibold">Primary Property</p>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Home equity</span><span className="font-semibold">{fmtDollars(Number(realEstatePrimary?.homeEquity ?? realEstatePrimary?.home_equity ?? 0))}</span></div>
                    <div className="flex justify-between"><span>Equity %</span><span className="font-semibold">{Number(realEstatePrimary?.equityPercentage ?? realEstatePrimary?.equity_percentage ?? 0).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>Housing cost ratio</span><span className="font-semibold">{Number(realEstatePrimary?.housingCostRatio ?? realEstatePrimary?.housing_cost_ratio ?? 0).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>LTV</span><span className="font-semibold">{Number(realEstatePrimary?.loanToValue ?? realEstatePrimary?.loan_to_value ?? 0).toFixed(1)}%</span></div>
                  </div>
                </div>
                {shouldShowRentalPortfolio && (
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="mb-1 font-semibold">Rental Portfolio</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>Net rental income</span><span className="font-semibold">{fmtDollars(totalMonthlyNetRentalIncome)}/mo</span></div>
                      <div className="flex justify-between"><span>Rental property equity</span><span className="font-semibold">{fmtDollars(totalRentalEquity)}</span></div>
                      <div className="flex justify-between"><span>Real estate concentration</span><span className="font-semibold">{realEstateConcentration.toFixed(1)}%</span></div>
                      <div className="flex justify-between"><span>Properties analyzed</span><span className="font-semibold">{realEstateRentals.length}</span></div>
                    </div>
                  </div>
                )}
              </div>
              {realEstateRentals.length > 0 && (
                <div className="mt-3 space-y-2">
                  {realEstateRentals.slice(0, 4).map((p: any, idx: number) => (
                    <div key={idx} className="rounded-lg border bg-muted/20 p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{p.label ?? "Property"}</p>
                        <span className="text-muted-foreground">DSCR {Number(p.debtServiceCoverageRatio ?? p.debt_service_coverage_ratio ?? 0).toFixed(2)}</span>
                      </div>
                      <p className="text-muted-foreground">
                        Net {fmtDollars(Number(p.monthlyNetIncome ?? p.monthly_net_income ?? 0))}/mo | Equity {fmtDollars(Number(p.equity ?? 0))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {cashFlow && (
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Monthly Cash Flow</p>
              <p className="text-sm text-muted-foreground">
                {fmtExactDollars(cashFlowGross)} gross → {fmtExactDollars(cashFlowNet)} net
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Values are estimated from the financial inputs provided and rounded to monthly approximations.
              </p>

              <div className="mt-3 rounded-lg border bg-muted/20 p-3 text-xs">
                <button
                  type="button"
                  onClick={() => toggleCashFlowSection("netTakeHome")}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <p className="font-semibold text-foreground">How net take-home is derived</p>
                  {expandedCashFlowSections.netTakeHome ? (
                    <ChevronUp className="size-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  )}
                </button>
                {expandedCashFlowSections.netTakeHome && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between"><span>Gross income</span><span>{fmtExactDollars(cashFlowGross)}</span></div>
                    <div className="flex justify-between"><span>Estimated taxes</span><span>- {fmtExactDollars(cashFlowTaxes)}</span></div>
                    <div className="flex justify-between"><span>Retirement contributions</span><span>- {fmtExactDollars(cashFlowRetirement)}</span></div>
                    <div className="flex justify-between"><span>Health insurance</span><span>- {fmtExactDollars(cashFlowHealthInsurance)}</span></div>
                    <div className="flex justify-between"><span>Other payroll deductions</span><span>- {fmtExactDollars(cashFlowOtherDeductions)}</span></div>
                    <div className="flex justify-between border-t pt-1.5"><span>Total deductions</span><span>- {fmtExactDollars(cashFlowTotalDeductions)}</span></div>
                    <div className="flex justify-between font-semibold"><span>Net take-home</span><span>{fmtExactDollars(cashFlowNet)}</span></div>
                  </div>
                )}
              </div>

              <div className="mt-3 rounded-lg border bg-muted/20 p-3 text-xs">
                <button
                  type="button"
                  onClick={() => toggleCashFlowSection("expensesAndSurplus")}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <p className="font-semibold text-foreground">How expenses and surplus are derived</p>
                  {expandedCashFlowSections.expensesAndSurplus ? (
                    <ChevronUp className="size-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  )}
                </button>
                {expandedCashFlowSections.expensesAndSurplus && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between"><span>Mortgage / housing (PITI)</span><span>{fmtExactDollars(monthlyHousingPiti)}/mo</span></div>
                    <div className="flex justify-between"><span>Other fixed expenses</span><span>{fmtExactDollars(otherFixedExpenses)}/mo</span></div>
                    <div className="flex justify-between"><span>Debt service</span><span>{fmtExactDollars(cashFlowDebtService)}/mo</span></div>
                    <div className="flex justify-between"><span>Discretionary spending</span><span>{fmtExactDollars(cashFlowDiscretionary)}/mo</span></div>
                    <div className="flex justify-between"><span>Remittances</span><span>{fmtExactDollars(cashFlowRemittances)}/mo</span></div>
                    <div className="flex justify-between border-t pt-1.5"><span>Total monthly expenses</span><span>{fmtExactDollars(cashFlowTotalExpenses)}/mo</span></div>
                    <div className="flex justify-between font-semibold">
                      <span>Surplus / Deficit (Net take-home - Total expenses)</span>
                      <span>{fmtExactDollars(cashFlowSurplus)}/mo</span>
                    </div>
                  </div>
                )}
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
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-500">What Needs Attention</p>
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
