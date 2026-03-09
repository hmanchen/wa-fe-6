"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  GoalsDiscoveryData,
  GoalOptionId,
  GoalRankingItem,
  PersonFinancialBackground,
  MajorPurchaseGoal,
  EducationPreference,
} from "@/types/financial-interview";

const GOAL_OPTIONS: { id: GoalOptionId; title: string; label: string; icon: string }[] = [
  { id: "retire_comfortably", title: "Retire Comfortably", label: "Retire comfortably by a target age", icon: "🌅" },
  { id: "protect_family", title: "Protect My Family", label: "Protect my family if something happens to me", icon: "🛡️" },
  { id: "pay_off_debt", title: "Pay Off Debt", label: "Become completely debt-free", icon: "⛓️" },
  { id: "fund_education", title: "Fund Children's Education", label: "Pay for my children's college education", icon: "🎓" },
  { id: "tax_free_retirement", title: "Tax-Free Retirement Income", label: "Build tax-free income for retirement", icon: "🐷" },
  { id: "protect_market_losses", title: "Protect Against Market Losses", label: "Protect my savings from market downturns", icon: "📉" },
  { id: "create_legacy", title: "Create a Legacy", label: "Leave an inheritance for my family", icon: "🌳" },
  { id: "emergency_cash_access", title: "Emergency Cash Access", label: "Always have accessible cash for emergencies", icon: "🛟" },
  { id: "generate_passive_income", title: "Generate Passive Income", label: "Build passive income streams", icon: "💸" },
  { id: "care_aging_parents", title: "Care for Aging Parents", label: "Support or care for aging parents", icon: "👵" },
  { id: "grow_wealth_aggressively", title: "Grow Wealth Aggressively", label: "Maximize investment growth", icon: "🚀" },
  { id: "start_grow_business", title: "Start or Grow a Business", label: "Start, buy, or grow a business", icon: "🏬" },
];

const FEAR_OPTIONS = [
  { id: "outliving_money", label: "Outliving my money", icon: "😟" },
  { id: "dying_too_young", label: "Dying too young and leaving my family struggling", icon: "💔" },
  { id: "market_crash", label: "A market crash wiping out my savings", icon: "📉" },
  { id: "job_loss", label: "Losing my job or income disruption", icon: "🏢" },
  { id: "disability_illness", label: "A disability or serious illness", icon: "🏥" },
  { id: "buried_in_debt", label: "Being buried in debt", icon: "💳" },
  { id: "children_future", label: "My children's financial future", icon: "👶" },
  { id: "too_much_taxes", label: "Paying too much in taxes", icon: "💰" },
  { id: "losing_home", label: "Losing my home", icon: "🏠" },
  { id: "burden_on_family", label: "Becoming a burden on my family", icon: "👴" },
  { id: "no_plan", label: "Not having a plan at all", icon: "🤷" },
  { id: "other", label: "Other", icon: "➕" },
] as const;

const TRIGGER_SUGGESTIONS = [
  "New baby",
  "Friend's illness",
  "Parent passed away",
  "Job change",
  "Market volatility",
  "Bought a house",
  "Got married",
  "Divorce",
  "Health scare",
  "Just thinking about the future",
];

function defaultGoalsDiscovery(): GoalsDiscoveryData {
  return {
    goalsRanking: [],
    retirementVision: {
      primaryRetirementAge: 65,
      spouseRetirementAge: 65,
      retirementConfidence: 5,
      socialSecurityExpectation: "not_sure",
      hasPension: false,
      pensionDetails: null,
    },
    riskProfile: {
      marketExperience: [],
    },
    specificGoals: {
      debtPayoff: { enabled: false },
      majorPurchases: [],
      educationPreferences: [],
      legacy: { type: "not_thought_about", specificAmount: null },
      otherGoals: "",
    },
    concerns: {
      financialFears: [],
      recentTrigger: "",
      peaceOfMind: "",
      otherFearText: "",
    },
  };
}

function normalizeGoalsDiscovery(
  value?: Partial<GoalsDiscoveryData>
): GoalsDiscoveryData {
  const base = defaultGoalsDiscovery();
  if (!value) return base;

  return {
    goalsRanking: value.goalsRanking ?? base.goalsRanking,
    retirementVision: {
      ...base.retirementVision,
      ...(value.retirementVision ?? {}),
    },
    riskProfile: {
      ...base.riskProfile,
      ...(value.riskProfile ?? {}),
      marketExperience:
        value.riskProfile?.marketExperience ?? base.riskProfile.marketExperience,
    },
    specificGoals: {
      ...base.specificGoals,
      ...(value.specificGoals ?? {}),
      debtPayoff:
        value.specificGoals?.debtPayoff ?? base.specificGoals.debtPayoff,
      majorPurchases:
        value.specificGoals?.majorPurchases ?? base.specificGoals.majorPurchases,
      educationPreferences:
        value.specificGoals?.educationPreferences ??
        base.specificGoals.educationPreferences,
      legacy: {
        ...base.specificGoals.legacy,
        ...(value.specificGoals?.legacy ?? {}),
      },
    },
    concerns: {
      ...base.concerns,
      ...(value.concerns ?? {}),
      financialFears: value.concerns?.financialFears ?? base.concerns.financialFears,
    },
  };
}

function sumMonthlyExpenses(bg?: PersonFinancialBackground): number {
  if (!bg?.monthlyExpenses) return 0;
  const e = bg.monthlyExpenses;
  return (
    (e.housing ?? 0) +
    (e.utilities ?? 0) +
    (e.transportation ?? 0) +
    (e.groceries ?? 0) +
    (e.insurance ?? 0) +
    (e.childcare ?? 0) +
    (e.entertainment ?? 0) +
    (e.diningOut ?? 0) +
    (e.subscriptions ?? 0) +
    (e.otherExpenses ?? 0)
  );
}

function listDebtOptions(bg?: PersonFinancialBackground): string[] {
  if (!bg?.debts) return [];
  const d = bg.debts;
  const out = new Set<string>();
  if ((d.mortgageBalance ?? 0) > 0) out.add("mortgage");
  if ((d.autoLoanBalance ?? 0) > 0) out.add("auto-loan");
  if ((d.studentLoanBalance ?? 0) > 0) out.add("student-loan");
  if ((d.creditCardBalance ?? 0) > 0) out.add("credit-card");
  if ((d.otherLoanBalance ?? 0) > 0) out.add("other-loan");
  for (const entry of d.entries ?? []) {
    out.add(entry.type);
  }
  return Array.from(out);
}

function yearsFromNow(currentAge: number | undefined, targetAge: number | undefined): number | null {
  if (!currentAge || !targetAge) return null;
  return targetAge - currentAge;
}

function toRankedGoals(goalIds: GoalOptionId[]): GoalRankingItem[] {
  return goalIds.map((goalId, idx) => ({
    rank: idx + 1,
    goalId,
    label: GOAL_OPTIONS.find((g) => g.id === goalId)?.title ?? goalId,
  }));
}

interface GoalsDiscoveryScreenProps {
  defaultValues?: GoalsDiscoveryData;
  primaryBackground?: PersonFinancialBackground;
  primaryName: string;
  spouseName?: string;
  primaryAge?: number;
  spouseAge?: number;
  onAutoSave: (data: Partial<GoalsDiscoveryData>) => Promise<void> | void;
  isSaving?: boolean;
  onBack: () => void;
  onNext: () => Promise<void> | void;
}

export function GoalsDiscoveryScreen({
  defaultValues,
  primaryBackground,
  primaryName,
  spouseName,
  primaryAge,
  spouseAge,
  onAutoSave,
  isSaving = false,
  onBack,
  onNext,
}: GoalsDiscoveryScreenProps) {
  const [data, setData] = useState<GoalsDiscoveryData>(() =>
    normalizeGoalsDiscovery(defaultValues)
  );
  const [pendingPatch, setPendingPatch] = useState<Partial<GoalsDiscoveryData>>({});
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saveTick, setSaveTick] = useState(0);

  const monthlyExpenses = useMemo(() => sumMonthlyExpenses(primaryBackground), [primaryBackground]);
  const debtOptions = useMemo(() => listDebtOptions(primaryBackground), [primaryBackground]);
  const childrenCount = primaryBackground?.income?.incomeSources?.length ? 0 : Math.max(0, primaryBackground?.monthlyExpenses?.childcare ? 1 : 0);
  const childIds = useMemo(() => Array.from({ length: childrenCount || 0 }).map((_, i) => `child_${i + 1}`), [childrenCount]);

  const selectedGoalIds = useMemo(
    () => data.goalsRanking.slice().sort((a, b) => a.rank - b.rank).map((g) => g.goalId),
    [data.goalsRanking]
  );
  const selectedSet = useMemo(() => new Set(selectedGoalIds), [selectedGoalIds]);
  const availableGoals = useMemo(() => GOAL_OPTIONS.filter((g) => !selectedSet.has(g.id)), [selectedSet]);

  useEffect(() => {
    if (defaultValues) {
      setData(normalizeGoalsDiscovery(defaultValues));
      setPendingPatch({});
    }
  }, [defaultValues]);

  const saveRef = useRef(onAutoSave);
  useEffect(() => {
    saveRef.current = onAutoSave;
  }, [onAutoSave]);

  const pendingSerialized = JSON.stringify(pendingPatch);
  const mounted = useRef(false);

  const triggerSave = useCallback(async () => {
    if (Object.keys(pendingPatch).length === 0) return;
    try {
      await saveRef.current(pendingPatch);
      setPendingPatch({});
      setSaveTick((v) => v + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save Goals & Discovery";
      setError(message);
      throw err;
    }
  }, [pendingPatch]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const id = window.setTimeout(() => {
      void triggerSave();
    }, 2500);
    return () => window.clearTimeout(id);
  }, [pendingSerialized, triggerSave]);

  const updateData = useCallback((patch: Partial<GoalsDiscoveryData>) => {
    setData((prev) => ({ ...prev, ...patch }));
    setPendingPatch((prev) => ({ ...prev, ...patch }));
    setError(null);
  }, []);

  const setGoalOrder = useCallback(
    (goalIds: GoalOptionId[]) => updateData({ goalsRanking: toRankedGoals(goalIds) }),
    [updateData]
  );

  const addGoal = useCallback(
    (goalId: GoalOptionId) => {
      if (selectedSet.has(goalId)) return;
      if (selectedGoalIds.length >= 5) {
        setError("You can only pick 5 priorities. Remove one to add another.");
        return;
      }
      setGoalOrder([...selectedGoalIds, goalId]);
    },
    [selectedGoalIds, selectedSet, setGoalOrder]
  );

  const removeGoal = useCallback(
    (goalId: GoalOptionId) => {
      setGoalOrder(selectedGoalIds.filter((id) => id !== goalId));
    },
    [selectedGoalIds, setGoalOrder]
  );

  const moveGoal = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= selectedGoalIds.length || from === to) return;
      const next = [...selectedGoalIds];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      setGoalOrder(next);
    },
    [selectedGoalIds, setGoalOrder]
  );

  const setRetirementVision = useCallback(
    (patch: Partial<GoalsDiscoveryData["retirementVision"]>) =>
      updateData({ retirementVision: { ...data.retirementVision, ...patch } }),
    [data.retirementVision, updateData]
  );

  const setRiskProfile = useCallback(
    (patch: Partial<GoalsDiscoveryData["riskProfile"]>) =>
      updateData({ riskProfile: { ...data.riskProfile, ...patch } }),
    [data.riskProfile, updateData]
  );

  const setSpecificGoals = useCallback(
    (patch: Partial<GoalsDiscoveryData["specificGoals"]>) =>
      updateData({ specificGoals: { ...data.specificGoals, ...patch } }),
    [data.specificGoals, updateData]
  );

  const setConcerns = useCallback(
    (patch: Partial<GoalsDiscoveryData["concerns"]>) =>
      updateData({ concerns: { ...data.concerns, ...patch } }),
    [data.concerns, updateData]
  );

  const validateBeforeNext = useCallback((): string | null => {
    if (data.goalsRanking.length < 3) {
      return "Please select at least 3 priorities to continue.";
    }
    if (!data.riskProfile.riskTolerance) {
      return "Please select a risk tolerance option.";
    }
    if (primaryAge && (data.retirementVision.primaryRetirementAge ?? 0) <= primaryAge) {
      return `${primaryName}'s target retirement age must be greater than current age (${primaryAge}).`;
    }
    if (
      spouseName &&
      spouseAge &&
      (data.retirementVision.spouseRetirementAge ?? 0) <= spouseAge
    ) {
      return `${spouseName}'s target retirement age must be greater than current age (${spouseAge}).`;
    }
    return null;
  }, [data, primaryAge, spouseAge, primaryName, spouseName]);

  const handleNext = useCallback(async () => {
    const validationError = validateBeforeNext();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      await triggerSave();
      await onNext();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to continue to next step";
      setError(message);
    }
  }, [onNext, triggerSave, validateBeforeNext]);

  const confidence = data.retirementVision.retirementConfidence ?? 5;
  const confidenceClass =
    confidence <= 3
      ? "text-red-600"
      : confidence <= 6
      ? "text-amber-600"
      : "text-green-600";

  return (
    <div className="space-y-4" onBlurCapture={() => void triggerSave()}>
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-lg font-bold">Goals & Discovery</h2>
        <p className="text-sm text-muted-foreground">
          Let&apos;s understand what matters most to you and your family.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <Accordion type="multiple" defaultValue={["goals", "retirement"]} className="space-y-3">
        <AccordionItem value="goals" className="rounded-xl border bg-card px-4">
          <AccordionTrigger>
            <div className="text-left">
              <p className="font-semibold">What Matters Most To You?</p>
              <p className="text-xs text-muted-foreground">Rank your top 5 financial priorities.</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Your Top 5 Priorities</p>
              {selectedGoalIds.length === 0 && (
                <p className="text-xs text-muted-foreground">Select goals below to build your top priorities list.</p>
              )}
              <div className="space-y-2">
                {selectedGoalIds.map((goalId, idx) => {
                  const goal = GOAL_OPTIONS.find((g) => g.id === goalId)!;
                  return (
                    <div
                      key={goalId}
                      className="flex items-center gap-2 rounded-md border bg-background p-2"
                      draggable
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragIndex == null) return;
                        moveGoal(dragIndex, idx);
                        setDragIndex(null);
                      }}
                    >
                      <GripVertical className="size-4 text-muted-foreground" />
                      <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {idx + 1}
                      </span>
                      <span className="text-sm">{goal.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{goal.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{goal.label}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => moveGoal(idx, idx - 1)}>
                          <ChevronUp className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => moveGoal(idx, idx + 1)}>
                          <ChevronDown className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => removeGoal(goalId)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Available Goals</p>
              <div className="grid gap-2 md:grid-cols-2">
                {availableGoals.map((goal) => (
                  <button
                    type="button"
                    key={goal.id}
                    onClick={() => addGoal(goal.id)}
                    className="rounded-md border bg-muted/40 p-3 text-left transition-colors hover:bg-muted"
                  >
                    <p className="text-sm font-medium">{goal.icon} {goal.title}</p>
                    <p className="text-xs text-muted-foreground">{goal.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="retirement" className="rounded-xl border bg-card px-4">
          <AccordionTrigger>
            <div className="text-left">
              <p className="font-semibold">Your Retirement Vision</p>
              <p className="text-xs text-muted-foreground">When do you want to retire and what does retirement look like?</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className={cn("grid gap-4", spouseName ? "md:grid-cols-2" : "md:grid-cols-1")}>
              <div className="rounded-lg border p-3">
                <Label className="text-xs">{primaryName}&apos;s Target Retirement Age</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Input
                    type="range"
                    min={45}
                    max={80}
                    step={1}
                    value={data.retirementVision.primaryRetirementAge ?? 65}
                    onChange={(e) => setRetirementVision({ primaryRetirementAge: Number(e.target.value) })}
                  />
                  <Input
                    type="number"
                    min={45}
                    max={80}
                    className="w-20"
                    value={data.retirementVision.primaryRetirementAge ?? 65}
                    onChange={(e) => setRetirementVision({ primaryRetirementAge: Number(e.target.value) })}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  That&apos;s {yearsFromNow(primaryAge, data.retirementVision.primaryRetirementAge) ?? "—"} years from now
                </p>
              </div>
              {spouseName && (
                <div className="rounded-lg border p-3">
                  <Label className="text-xs">{spouseName}&apos;s Target Retirement Age</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <Input
                      type="range"
                      min={45}
                      max={80}
                      step={1}
                      value={data.retirementVision.spouseRetirementAge ?? 65}
                      onChange={(e) => setRetirementVision({ spouseRetirementAge: Number(e.target.value) })}
                    />
                    <Input
                      type="number"
                      min={45}
                      max={80}
                      className="w-20"
                      value={data.retirementVision.spouseRetirementAge ?? 65}
                      onChange={(e) => setRetirementVision({ spouseRetirementAge: Number(e.target.value) })}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    That&apos;s {yearsFromNow(spouseAge, data.retirementVision.spouseRetirementAge) ?? "—"} years from now
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <Label className="text-xs">How much monthly income would you want in retirement?</Label>
                <Input
                  type="number"
                  min={0}
                  className="mt-2"
                  placeholder="0"
                  value={data.retirementVision.desiredMonthlyIncome ?? ""}
                  onChange={(e) =>
                    setRetirementVision({
                      desiredMonthlyIncome:
                        e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Your current monthly expenses are ${monthlyExpenses.toLocaleString()}.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => setRetirementVision({ desiredMonthlyIncome: monthlyExpenses })}
                >
                  Same as current expenses
                </Button>
              </div>
              <div className="rounded-lg border p-3">
                <Label className="text-xs">How confident are you that you&apos;ll retire when you want?</Label>
                <Input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                  value={confidence}
                  onChange={(e) => setRetirementVision({ retirementConfidence: Number(e.target.value) })}
                />
                <p className={cn("mt-2 text-2xl font-bold", confidenceClass)}>{confidence}/10</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <Label className="text-xs">What do you expect from Social Security?</Label>
                <div className="mt-2 grid gap-2">
                  {[
                    { key: "full_benefits", label: "Full benefits" },
                    { key: "reduced_benefits", label: "Reduced benefits" },
                    { key: "no_social_security", label: "No Social Security" },
                    { key: "not_sure", label: "Not sure" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setRetirementVision({ socialSecurityExpectation: opt.key as GoalsDiscoveryData["retirementVision"]["socialSecurityExpectation"] })}
                      className={cn(
                        "rounded-md border p-2 text-left text-xs",
                        data.retirementVision.socialSecurityExpectation === opt.key
                          ? "border-primary bg-primary/5"
                          : "bg-muted/30"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <Label className="text-xs">Do you or your spouse have a pension from any employer?</Label>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant={data.retirementVision.hasPension ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRetirementVision({ hasPension: true, pensionDetails: data.retirementVision.pensionDetails ?? { who: "primary" } })}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={data.retirementVision.hasPension === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRetirementVision({ hasPension: false, pensionDetails: null })}
                  >
                    No
                  </Button>
                </div>
                {data.retirementVision.hasPension && (
                  <div className="mt-3 grid gap-2">
                    <Select
                      value={data.retirementVision.pensionDetails?.who ?? "primary"}
                      onValueChange={(v) =>
                        setRetirementVision({
                          pensionDetails: {
                            ...(data.retirementVision.pensionDetails ?? { who: "primary" }),
                            who: v as "primary" | "spouse" | "both",
                          },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Whose pension?" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Estimated monthly pension amount"
                      value={data.retirementVision.pensionDetails?.estimatedMonthlyAmount ?? ""}
                      onChange={(e) =>
                        setRetirementVision({
                          pensionDetails: {
                            ...(data.retirementVision.pensionDetails ?? { who: "primary" }),
                            estimatedMonthlyAmount:
                              e.target.value === "" ? undefined : Number(e.target.value),
                          },
                        })
                      }
                    />
                    <Input
                      type="number"
                      min={45}
                      max={80}
                      placeholder="Pension start age"
                      value={data.retirementVision.pensionDetails?.startAge ?? ""}
                      onChange={(e) =>
                        setRetirementVision({
                          pensionDetails: {
                            ...(data.retirementVision.pensionDetails ?? { who: "primary" }),
                            startAge: e.target.value === "" ? undefined : Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="risk" className="rounded-xl border bg-card px-4">
          <AccordionTrigger>
            <div className="text-left">
              <p className="font-semibold">Your Risk Comfort Level</p>
              <p className="text-xs text-muted-foreground">Understanding how you feel about risk helps tailor recommendations.</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div>
              <Label className="text-xs">How would you describe your approach to investing?</Label>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {[
                  { id: "conservative", title: "Conservative", desc: "Safety over growth." },
                  { id: "moderate", title: "Moderate", desc: "Balanced growth and stability." },
                  { id: "aggressive", title: "Aggressive", desc: "Maximum growth, can handle swings." },
                ].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setRiskProfile({ riskTolerance: o.id as GoalsDiscoveryData["riskProfile"]["riskTolerance"] })}
                    className={cn(
                      "rounded-lg border p-3 text-left",
                      data.riskProfile.riskTolerance === o.id ? "border-primary bg-primary/5" : "bg-muted/30"
                    )}
                  >
                    <p className="text-sm font-semibold">{o.title}</p>
                    <p className="text-xs text-muted-foreground">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">When will you need to use your invested money?</Label>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {[
                  { id: "short_term", title: "Short-Term (1-5 years)" },
                  { id: "medium_term", title: "Medium-Term (5-15 years)" },
                  { id: "long_term", title: "Long-Term (15+ years)" },
                ].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setRiskProfile({ timeHorizon: o.id as GoalsDiscoveryData["riskProfile"]["timeHorizon"] })}
                    className={cn(
                      "rounded-lg border p-2 text-left text-sm",
                      data.riskProfile.timeHorizon === o.id ? "border-primary bg-primary/5" : "bg-muted/30"
                    )}
                  >
                    {o.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50/60 p-3 dark:border-red-900/40 dark:bg-red-950/20">
              <p className="text-sm font-semibold">If your investments dropped from $100,000 to $70,000, what would you do?</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {[
                  { id: "sell_everything", label: "Sell everything — I can't handle that" },
                  { id: "sell_some", label: "Sell some to reduce risk" },
                  { id: "hold_steady", label: "Hold steady and wait for recovery" },
                  { id: "buy_more", label: "Buy more — stocks are on sale" },
                ].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setRiskProfile({ marketLossReaction: o.id as GoalsDiscoveryData["riskProfile"]["marketLossReaction"] })}
                    className={cn(
                      "rounded-md border p-2 text-left text-xs",
                      data.riskProfile.marketLossReaction === o.id ? "border-primary bg-background" : "bg-background/60"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Have you experienced any of these market events?</Label>
              <div className="mt-2 grid gap-2">
                {[
                  { id: "2008_financial_crisis", label: "2008 Financial Crisis (market dropped ~38%)" },
                  { id: "2020_covid_crash", label: "2020 COVID Crash (market dropped ~34%)" },
                  { id: "2022_tech_crypto_crash", label: "2022 Tech/Crypto Crash (many portfolios dropped 20-30%)" },
                  { id: "no_major_downturn", label: "I haven't experienced a major downturn" },
                ].map((evt) => {
                  const checked = data.riskProfile.marketExperience?.includes(evt.id) ?? false;
                  return (
                    <label key={evt.id} className="flex items-center gap-2 rounded-md border bg-muted/20 p-2 text-xs">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const current = new Set(data.riskProfile.marketExperience ?? []);
                          if (e.target.checked) current.add(evt.id);
                          else current.delete(evt.id);
                          setRiskProfile({ marketExperience: Array.from(current) });
                        }}
                      />
                      {evt.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="specific-goals" className="rounded-xl border bg-card px-4">
          <AccordionTrigger>
            <div className="text-left">
              <p className="font-semibold">Your Specific Goals</p>
              <p className="text-xs text-muted-foreground">Milestones and timelines you are targeting.</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">Debt Payoff Goal</p>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant={data.specificGoals.debtPayoff?.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSpecificGoals({ debtPayoff: { ...(data.specificGoals.debtPayoff ?? { enabled: false }), enabled: true } })
                  }
                >
                  Set Goal
                </Button>
                <Button
                  type="button"
                  variant={!data.specificGoals.debtPayoff?.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSpecificGoals({ debtPayoff: { enabled: false } })}
                >
                  Skip
                </Button>
              </div>
              {data.specificGoals.debtPayoff?.enabled && (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <Select
                    value={data.specificGoals.debtPayoff.targetDebt ?? ""}
                    onValueChange={(v) =>
                      setSpecificGoals({
                        debtPayoff: { ...(data.specificGoals.debtPayoff ?? { enabled: true }), enabled: true, targetDebt: v },
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Select target debt" /></SelectTrigger>
                    <SelectContent>
                      {debtOptions.length === 0 ? (
                        <SelectItem value="custom">Add new debt goal</SelectItem>
                      ) : (
                        debtOptions.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={new Date().getFullYear()}
                    placeholder="Target year"
                    value={data.specificGoals.debtPayoff.targetDate ?? ""}
                    onChange={(e) =>
                      setSpecificGoals({
                        debtPayoff: { ...(data.specificGoals.debtPayoff ?? { enabled: true }), enabled: true, targetDate: e.target.value },
                      })
                    }
                  />
                </div>
              )}
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Major Purchases</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSpecificGoals({
                      majorPurchases: [...(data.specificGoals.majorPurchases ?? []), { type: "home_purchase" }],
                    })
                  }
                >
                  Add
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {(data.specificGoals.majorPurchases ?? []).map((purchase, idx) => (
                  <MajorPurchaseRow
                    key={`${purchase.type}_${idx}`}
                    purchase={purchase}
                    onChange={(next) => {
                      const list = [...(data.specificGoals.majorPurchases ?? [])];
                      list[idx] = next;
                      setSpecificGoals({ majorPurchases: list });
                    }}
                    onRemove={() => {
                      const list = (data.specificGoals.majorPurchases ?? []).filter((_, i) => i !== idx);
                      setSpecificGoals({ majorPurchases: list });
                    }}
                  />
                ))}
              </div>
            </div>

            {childIds.length > 0 && (
              <div className="rounded-lg border p-3">
                <p className="text-sm font-semibold">Education Goal</p>
                <div className="mt-2 space-y-2">
                  {childIds.map((childId, idx) => {
                    const current = (data.specificGoals.educationPreferences ?? []).find((e) => e.childId === childId);
                    return (
                      <div key={childId} className="grid gap-2 md:grid-cols-2">
                        <p className="text-xs font-medium self-center">Child {idx + 1} — Education Preference</p>
                        <Select
                          value={current?.preference ?? ""}
                          onValueChange={(v) => {
                            const list = [...(data.specificGoals.educationPreferences ?? [])];
                            const next: EducationPreference = {
                              childId,
                              childName: `Child ${idx + 1}`,
                              preference: v as EducationPreference["preference"],
                            };
                            const foundIdx = list.findIndex((e) => e.childId === childId);
                            if (foundIdx >= 0) list[foundIdx] = next;
                            else list.push(next);
                            setSpecificGoals({ educationPreferences: list });
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public_university">Public University</SelectItem>
                            <SelectItem value="private_university">Private University</SelectItem>
                            <SelectItem value="community_college_first">Community College First</SelectItem>
                            <SelectItem value="trade_school">Trade School</SelectItem>
                            <SelectItem value="not_sure">Not Sure</SelectItem>
                            <SelectItem value="child_self_funded">Child will fund their own education</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">Legacy Goal</p>
              <div className="mt-2 grid gap-2">
                {[
                  { id: "as_much_as_possible", label: "Yes — as much as possible" },
                  { id: "specific_amount", label: "Yes — a specific amount" },
                  { id: "not_a_priority", label: "Not a priority — I want to enjoy my money while I'm alive" },
                  { id: "not_thought_about", label: "Haven't thought about it" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setSpecificGoals({
                        legacy: {
                          ...(data.specificGoals.legacy ?? {}),
                          type: opt.id as
                            | "as_much_as_possible"
                            | "specific_amount"
                            | "not_a_priority"
                            | "not_thought_about",
                        },
                      })
                    }
                    className={cn(
                      "rounded-md border p-2 text-left text-xs",
                      data.specificGoals.legacy?.type === opt.id ? "border-primary bg-primary/5" : "bg-muted/20"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {data.specificGoals.legacy?.type === "specific_amount" && (
                <Input
                  type="number"
                  min={0}
                  className="mt-2"
                  placeholder="Specific inheritance amount"
                  value={data.specificGoals.legacy?.specificAmount ?? ""}
                  onChange={(e) =>
                    setSpecificGoals({
                      legacy: {
                        ...(data.specificGoals.legacy ?? {}),
                        type: "specific_amount",
                        specificAmount: e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                />
              )}
            </div>

            <div className="rounded-lg border p-3">
              <Label className="text-xs">Anything else on your financial wish list?</Label>
              <textarea
                className="mt-2 min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Examples: Pay for daughter's wedding, buy a vacation home, support a family member..."
                value={data.specificGoals.otherGoals ?? ""}
                onChange={(e) => setSpecificGoals({ otherGoals: e.target.value })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="concerns" className="rounded-xl border bg-card px-4">
          <AccordionTrigger>
            <div className="text-left">
              <p className="font-semibold">What Keeps You Up at Night?</p>
              <p className="text-xs text-muted-foreground">Understanding concerns helps us prioritize what matters most.</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div>
              <Label className="text-xs">Select any financial concerns that resonate with you</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {FEAR_OPTIONS.map((fear) => {
                  const selected = data.concerns.financialFears?.includes(fear.id) ?? false;
                  return (
                    <button
                      key={fear.id}
                      type="button"
                      onClick={() => {
                        const set = new Set(data.concerns.financialFears ?? []);
                        if (set.has(fear.id)) set.delete(fear.id);
                        else set.add(fear.id);
                        setConcerns({ financialFears: Array.from(set) });
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        selected ? "border-primary bg-primary/10 text-primary" : "bg-muted/20"
                      )}
                    >
                      {fear.icon} {fear.label}
                    </button>
                  );
                })}
              </div>
              {(data.concerns.financialFears ?? []).includes("other") && (
                <Input
                  className="mt-2"
                  placeholder="Other concern"
                  value={data.concerns.otherFearText ?? ""}
                  onChange={(e) => setConcerns({ otherFearText: e.target.value })}
                />
              )}
            </div>

            <div className="rounded-lg border p-3">
              <Label className="text-xs">Has anything happened recently that made you think about your finances?</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {TRIGGER_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="rounded-full border bg-muted/20 px-3 py-1 text-xs"
                    onClick={() => setConcerns({ recentTrigger: s })}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <textarea
                className="mt-2 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={data.concerns.recentTrigger ?? ""}
                onChange={(e) => setConcerns({ recentTrigger: e.target.value })}
              />
            </div>

            <div className="rounded-lg border p-3">
              <Label className="text-xs">In your own words, what would financial peace of mind look like for you?</Label>
              <textarea
                className="mt-2 min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Knowing my family is taken care of no matter what happens..."
                value={data.concerns.peaceOfMind ?? ""}
                onChange={(e) => setConcerns({ peaceOfMind: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">We&apos;ll reference this in your personalized report.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="sticky bottom-0 z-10 rounded-xl border bg-background/95 p-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="size-4" />
            Back to Financial Background
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {isSaving ? "Saving..." : saveTick > 0 ? "All changes saved" : "Auto-save enabled"}
            </span>
            <Button onClick={() => void handleNext()} className="gap-1.5">
              Next: Income Replacement Risk
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MajorPurchaseRow({
  purchase,
  onChange,
  onRemove,
}: {
  purchase: MajorPurchaseGoal;
  onChange: (next: MajorPurchaseGoal) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-md border bg-muted/20 p-2 md:grid-cols-4">
      <Select value={purchase.type} onValueChange={(v) => onChange({ ...purchase, type: v })}>
        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="home_purchase">Home purchase / upgrade</SelectItem>
          <SelectItem value="new_vehicle">New vehicle</SelectItem>
          <SelectItem value="home_renovation">Home renovation</SelectItem>
          <SelectItem value="wedding">Wedding</SelectItem>
          <SelectItem value="starting_business">Starting a business</SelectItem>
          <SelectItem value="travel_sabbatical">Travel / sabbatical</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={0}
        placeholder="Estimated cost"
        value={purchase.estimatedCost ?? ""}
        onChange={(e) =>
          onChange({
            ...purchase,
            estimatedCost: e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
      />
      <Input
        type="number"
        min={new Date().getFullYear()}
        max={new Date().getFullYear() + 40}
        placeholder="Target year"
        value={purchase.targetYear ?? ""}
        onChange={(e) =>
          onChange({
            ...purchase,
            targetYear: e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
      />
      <Button variant="ghost" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}

