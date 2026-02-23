"use client";

import { useState, useMemo } from "react";
import { ChevronRight, Loader2, TrendingDown, TrendingUp, AlertTriangle, Info, DollarSign, GraduationCap, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useXCurveData,
  useXCurveNarration,
  useTaxNarrative,
  useRothVs7702,
  useCollegeFunding,
  useRolloverOptions,
} from "@/hooks/use-presentation-flow";

type SubTab = "xcurve" | "tax" | "roth7702" | "college" | "retirement";

const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: "xcurve", label: "X-Curve", icon: TrendingDown },
  { id: "tax", label: "Tax Buckets", icon: DollarSign },
  { id: "roth7702", label: "Roth vs 7702", icon: Landmark },
  { id: "college", label: "College Plan", icon: GraduationCap },
  { id: "retirement", label: "Retirement Income", icon: TrendingUp },
];

interface XCurveScreenProps {
  caseId: string;
  onContinue: () => void;
}

function fmt(n: number | undefined | null): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function pct(n: number | undefined | null): string {
  if (n == null) return "—";
  return `${n.toFixed(1)}%`;
}

// ── X-Curve Tab ──────────────────────────────────────────────

function XCurveTab({ caseId }: { caseId: string }) {
  const { data: curve, isLoading, isError } = useXCurveData(caseId);
  const { data: narration } = useXCurveNarration(caseId);

  if (isLoading) return <div className="flex items-center gap-2 py-10"><Loader2 className="size-5 animate-spin" /> <span className="text-sm text-muted-foreground">Computing X-Curve...</span></div>;
  if (isError || !curve) return <div className="py-10 text-center text-sm text-red-500">Could not compute X-Curve data.</div>;

  const maxVal = Math.max(
    ...(curve.responsibilityCurve?.map((p: any) => p.value) ?? [0]),
    ...(curve.wealthCurve?.map((p: any) => p.value) ?? [0]),
    1
  );

  return (
    <div className="space-y-5">
      {/* Chart area */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h4 className="mb-1 text-sm font-bold">Financial X-Curve</h4>
        <p className="mb-4 text-xs text-muted-foreground">Responsibility (declining) vs Wealth (growing) — the shaded area is your insurance need</p>

        <div className="relative h-64 w-full">
          <svg viewBox="0 0 600 200" className="h-full w-full" preserveAspectRatio="none">
            {curve.responsibilityCurve?.length > 1 && (
              <>
                <defs>
                  <linearGradient id="gapFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(239,68,68)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="rgb(239,68,68)" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {/* Responsibility curve (red, declining) */}
                <polyline
                  fill="none"
                  stroke="rgb(239,68,68)"
                  strokeWidth="2.5"
                  points={curve.responsibilityCurve.map((p: any, i: number) => {
                    const x = (i / (curve.responsibilityCurve.length - 1)) * 580 + 10;
                    const y = 190 - (p.value / maxVal) * 180;
                    return `${x},${y}`;
                  }).join(" ")}
                />
                {/* Wealth curve (green, growing) */}
                <polyline
                  fill="none"
                  stroke="rgb(34,197,94)"
                  strokeWidth="2.5"
                  points={curve.wealthCurve.map((p: any, i: number) => {
                    const x = (i / (curve.wealthCurve.length - 1)) * 580 + 10;
                    const y = 190 - (p.value / maxVal) * 180;
                    return `${x},${y}`;
                  }).join(" ")}
                />
              </>
            )}
            {/* Baseline */}
            <line x1="10" y1="190" x2="590" y2="190" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
          </svg>
          {/* Legend */}
          <div className="absolute bottom-0 right-0 flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-red-500" /> Responsibility</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-green-500" /> Wealth</span>
          </div>
        </div>

        {/* Key metrics */}
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Crossover Age</p>
            <p className="text-xl font-bold">{curve.crossoverAge ?? "—"}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Insurance Need</p>
            <p className="text-xl font-bold text-red-600">{fmt(curve.totalNeed)}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Existing Coverage</p>
            <p className="text-xl font-bold text-emerald-600">{fmt(curve.existingCoverage)}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Coverage Gap</p>
            <p className="text-xl font-bold text-amber-600">{fmt(curve.coverageGap)}</p>
          </div>
        </div>
      </div>

      {/* Insurance needs breakdown */}
      {curve.components?.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h4 className="mb-3 text-sm font-bold">Insurance Needs Breakdown</h4>
          <div className="space-y-2">
            {curve.components.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.formula || c.description}</p>
                </div>
                <p className="text-sm font-bold">{fmt(c.amount)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border-2 border-red-200 bg-red-50/50 px-4 py-2.5 dark:border-red-900 dark:bg-red-950/20">
              <p className="text-sm font-bold text-red-700 dark:text-red-300">TOTAL NEED</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-300">{fmt(curve.totalNeed)}</p>
            </div>
            <div className="flex items-center justify-between px-4 py-1 text-sm text-muted-foreground">
              <span>Less: Existing Coverage</span>
              <span>- {fmt(curve.existingCoverage)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border-2 border-amber-200 bg-amber-50/50 px-4 py-2.5 dark:border-amber-900 dark:bg-amber-950/20">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">GAP</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{fmt(curve.coverageGap)}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Narration */}
      {narration && (
        <div className="rounded-xl border border-l-4 border-l-indigo-500 bg-card p-5 shadow-sm">
          <h4 className="mb-2 text-sm font-bold text-indigo-600">AI Narration</h4>
          {narration.openingNarrative && <p className="mb-2 text-sm leading-relaxed text-muted-foreground">{narration.openingNarrative}</p>}
          {narration.gapSummary && <p className="text-sm leading-relaxed font-medium text-amber-700 dark:text-amber-300">{narration.gapSummary}</p>}
        </div>
      )}
    </div>
  );
}

// ── Tax Bucket Tab ───────────────────────────────────────────

function TaxBucketTab({ caseId }: { caseId: string }) {
  const { data: taxNarr, isLoading, isError } = useTaxNarrative(caseId);

  if (isLoading) return <div className="flex items-center gap-2 py-10"><Loader2 className="size-5 animate-spin" /> <span className="text-sm text-muted-foreground">Generating tax narrative...</span></div>;
  if (isError) return <div className="py-10 text-center text-sm text-red-500">Could not generate tax narrative.</div>;

  return (
    <div className="space-y-5">
      {/* Visual buckets */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h4 className="mb-4 text-sm font-bold">Tax Bucket Strategy</h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border-2 border-red-300 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/20">
            <div className="mb-2 text-2xl">🔴</div>
            <h5 className="text-sm font-bold text-red-700 dark:text-red-300">TAX NOW</h5>
            <p className="text-xs text-red-600 dark:text-red-400">Taxable</p>
            <p className="mt-2 text-xs text-muted-foreground">Brokerage, savings, CDs, bonds — taxed as earned</p>
          </div>
          <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50/50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20">
            <div className="mb-2 text-2xl">🟡</div>
            <h5 className="text-sm font-bold text-yellow-700 dark:text-yellow-300">TAX LATER</h5>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Deferred</p>
            <p className="mt-2 text-xs text-muted-foreground">401(k), Traditional IRA — taxed on withdrawal. RMD at 73!</p>
          </div>
          <div className="rounded-xl border-2 border-green-300 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-950/20">
            <div className="mb-2 text-2xl">🟢</div>
            <h5 className="text-sm font-bold text-green-700 dark:text-green-300">TAX ADVANTAGED</h5>
            <p className="text-xs text-green-600 dark:text-green-400">Tax-Free Future</p>
            <p className="mt-2 text-xs text-muted-foreground">Roth IRA, 7702/CVL — no tax in future, no RMD</p>
          </div>
        </div>
      </div>

      {/* AI Narrative */}
      {taxNarr && (
        <div className="space-y-4">
          {taxNarr.bucketNarrative && (
            <div className="rounded-xl border border-l-4 border-l-indigo-500 bg-card p-5 shadow-sm">
              <h4 className="mb-2 text-sm font-bold text-indigo-600">Tax Diversification Analysis</h4>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{taxNarr.bucketNarrative}</p>
            </div>
          )}
          {taxNarr.diversificationRecommendation && (
            <div className="rounded-xl border border-l-4 border-l-emerald-500 bg-card p-5 shadow-sm">
              <h4 className="mb-2 text-sm font-bold text-emerald-600">Recommendation</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{taxNarr.diversificationRecommendation}</p>
            </div>
          )}
          {taxNarr.rmdWarning && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">RMD Warning</p>
                <p className="mt-1 text-sm text-muted-foreground">{taxNarr.rmdWarning}</p>
              </div>
            </div>
          )}
          {taxNarr.actionBridge && (
            <p className="rounded-lg bg-blue-50/50 p-4 text-sm font-medium text-blue-700 dark:bg-blue-950/20 dark:text-blue-300">{taxNarr.actionBridge}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Roth vs 7702 Tab ─────────────────────────────────────────

function RothVs7702Tab({ caseId }: { caseId: string }) {
  const mutation = useRothVs7702();
  const [income, setIncome] = useState(175000);
  const [age, setAge] = useState(35);
  const [ran, setRan] = useState(false);

  const handleRun = () => {
    mutation.mutate({ caseId, householdIncome: income, clientAge: age, hasDependents: true, hasCoverageGap: true });
    setRan(true);
  };

  const data = mutation.data;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h4 className="mb-3 text-sm font-bold">Roth IRA vs 7702 (CVL/IUL) Comparison</h4>
        <div className="mb-4 flex items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Household Income</Label>
            <Input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} className="w-40" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Client Age</Label>
            <Input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-24" />
          </div>
          <Button size="sm" onClick={handleRun} disabled={mutation.isPending}>
            {mutation.isPending ? <><Loader2 className="mr-1 size-3.5 animate-spin" /> Computing...</> : ran ? "Recompute" : "Run Comparison"}
          </Button>
        </div>

        {data?.comparison && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-semibold">Feature</th>
                  <th className="py-2 text-center font-semibold text-blue-600">Roth IRA</th>
                  <th className="py-2 text-center font-semibold text-emerald-600">7702 (CVL/IUL)</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(data.comparison) ? data.comparison : data.comparison.rows ?? []).map((row: any, i: number) => (
                  <tr key={i} className={cn("border-b", row.highlight === "7702" ? "bg-emerald-50/50 dark:bg-emerald-950/10" : row.highlight === "roth" ? "bg-blue-50/50 dark:bg-blue-950/10" : "")}>
                    <td className="py-2 font-medium">{row.feature ?? row.label}</td>
                    <td className="py-2 text-center">{row.roth ?? row.rothIra}</td>
                    <td className="py-2 text-center">{row["7702"] ?? row.cvlIul ?? row.iul}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data?.recommendation && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{typeof data.recommendation === "string" ? data.recommendation : data.recommendation.text ?? JSON.stringify(data.recommendation)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── College Planning Tab ─────────────────────────────────────

function CollegePlanningTab({ caseId }: { caseId: string }) {
  const mutation = useCollegeFunding();
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(5);
  const [monthly, setMonthly] = useState(300);
  const [ran, setRan] = useState(false);

  const handleRun = () => {
    if (!childName) return;
    mutation.mutate({ caseId, childName, childAge, monthlyContribution: monthly });
    setRan(true);
  };

  const data = mutation.data;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h4 className="mb-3 text-sm font-bold">College Education Planning</h4>
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Child Name</Label>
            <Input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="e.g. Siran" className="w-36" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Child Age</Label>
            <Input type="number" value={childAge} onChange={(e) => setChildAge(Number(e.target.value))} className="w-20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Monthly Contribution</Label>
            <Input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} className="w-28" />
          </div>
          <Button size="sm" onClick={handleRun} disabled={mutation.isPending || !childName}>
            {mutation.isPending ? <><Loader2 className="mr-1 size-3.5 animate-spin" /> Computing...</> : ran ? "Recompute" : "Run Comparison"}
          </Button>
        </div>

        {data && (
          <div className="space-y-4">
            {/* 529 vs IUL cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border-2 border-blue-300 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                <h5 className="text-sm font-bold text-blue-700 dark:text-blue-300">529 Plan</h5>
                {data.plan529 && (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Projected (moderate):</span><span className="font-semibold">{fmt(data.plan529.projectedValue?.moderate)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">FAFSA impact/yr:</span><span className="font-semibold text-amber-600">{fmt(data.plan529.fafsaImpactAnnual)}</span></div>
                  </div>
                )}
              </div>
              <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                <h5 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">IUL / CVL (Policy Loan)</h5>
                {data.iulCollege && (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Cash value at college:</span><span className="font-semibold">{fmt(data.iulCollege.cashValueAtCollege?.moderate)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">FAFSA impact:</span><span className="font-semibold text-emerald-600">$0 (invisible)</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Death benefit:</span><span className="font-semibold">{fmt(data.iulCollege.deathBenefit)}</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* Comparison table */}
            {data.comparisonTable && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-semibold">Feature</th>
                      <th className="py-2 text-center font-semibold text-blue-600">529</th>
                      <th className="py-2 text-center font-semibold text-emerald-600">IUL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(data.comparisonTable) ? data.comparisonTable : data.comparisonTable.rows ?? []).map((row: any, i: number) => (
                      <tr key={i} className={cn("border-b", row.advantage === "iul" ? "bg-emerald-50/30 dark:bg-emerald-950/10" : row.advantage === "529" ? "bg-blue-50/30 dark:bg-blue-950/10" : "")}>
                        <td className="py-2 font-medium">{row.feature}</td>
                        <td className="py-2 text-center">{row["529"] ?? row.plan529}</td>
                        <td className="py-2 text-center">{row.iul ?? row.iulCollege}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.recommendation && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{typeof data.recommendation === "string" ? data.recommendation : JSON.stringify(data.recommendation)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Retirement Income Tab ────────────────────────────────────

function RetirementIncomeTab({ caseId }: { caseId: string }) {
  const mutation = useRolloverOptions();
  const [balance, setBalance] = useState(200000);
  const [employer, setEmployer] = useState("");
  const [age, setAge] = useState(35);
  const [ran, setRan] = useState(false);

  const handleRun = () => {
    if (!employer) return;
    mutation.mutate({ caseId, old401kBalance: balance, employerName: employer, clientAge: age });
    setRan(true);
  };

  const data = mutation.data;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h4 className="mb-3 text-sm font-bold">Pension / Annuity Strategy — 401(k) Rollover Options</h4>
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Old 401(k) Balance</Label>
            <Input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} className="w-36" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Previous Employer</Label>
            <Input value={employer} onChange={(e) => setEmployer(e.target.value)} placeholder="e.g. Delta" className="w-36" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Client Age</Label>
            <Input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-20" />
          </div>
          <Button size="sm" onClick={handleRun} disabled={mutation.isPending || !employer}>
            {mutation.isPending ? <><Loader2 className="mr-1 size-3.5 animate-spin" /> Computing...</> : ran ? "Recompute" : "Analyze Options"}
          </Button>
        </div>

        {data && (
          <div className="space-y-4">
            {/* Cash-out penalty warning */}
            {data.cashOutPenalty && (
              <div className="rounded-lg border-2 border-red-300 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/20">
                <p className="text-sm font-bold text-red-700 dark:text-red-300">⚠️ Cash Out = WORST Option</p>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                  <div><span className="text-muted-foreground">10% Penalty:</span> <span className="font-semibold">{fmt(data.cashOutPenalty.penalty10pct)}</span></div>
                  <div><span className="text-muted-foreground">Federal Tax:</span> <span className="font-semibold">{fmt(data.cashOutPenalty.federalTax)}</span></div>
                  <div><span className="text-muted-foreground">Total Loss:</span> <span className="font-bold text-red-600">{fmt(data.cashOutPenalty.totalLoss)} ({pct(data.cashOutPenalty.lossPercentage)})</span></div>
                </div>
              </div>
            )}

            {/* Rollover options */}
            {data.options?.map((opt: any, i: number) => (
              <div key={i} className={cn("rounded-xl border bg-card p-4 shadow-sm", opt.riskLevel === "low" ? "border-l-4 border-l-emerald-500" : opt.riskLevel === "high" ? "border-l-4 border-l-red-400" : "border-l-4 border-l-amber-400")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{opt.name}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                  {opt.projectedValueAt65 != null && <p className="shrink-0 text-sm font-bold">{fmt(opt.projectedValueAt65)}</p>}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {opt.pros?.map((p: string, j: number) => (
                    <span key={j} className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">✓ {p}</span>
                  ))}
                  {opt.cons?.map((c: string, j: number) => (
                    <span key={j} className="rounded bg-red-100 px-2 py-0.5 text-red-700 dark:bg-red-900/30 dark:text-red-300">✗ {c}</span>
                  ))}
                </div>
              </div>
            ))}

            {/* Systematic vs FIA comparison */}
            {(data.systematicWithdrawal || data.fiaProjection) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {data.systematicWithdrawal && (
                  <div className="rounded-xl border-2 border-amber-300 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                    <h5 className="text-sm font-bold text-amber-700 dark:text-amber-300">Systematic Withdrawal (4% Rule)</h5>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>Monthly Income: <strong>{fmt(data.systematicWithdrawal.monthlyIncome)}</strong></p>
                      <p className="text-xs text-muted-foreground">Risk: Market downturn + longevity = could deplete</p>
                    </div>
                  </div>
                )}
                {data.fiaProjection && (
                  <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                    <h5 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Fixed Index Annuity (Private Pension)</h5>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>Guaranteed Monthly: <strong>{fmt(data.fiaProjection.guaranteedMonthlyIncome)}</strong></p>
                      <p className="text-xs text-muted-foreground">Income for life · 0% floor · Never depletes</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {data.recommendation && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{typeof data.recommendation === "string" ? data.recommendation : JSON.stringify(data.recommendation)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export function XCurveScreen({ caseId, onContinue }: XCurveScreenProps) {
  const [activeTab, setActiveTab] = useState<SubTab>("xcurve");

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-3 rounded-t-xl border-b bg-muted/30 px-4 py-2.5">
        <h2 className="text-base font-bold">Presentation Flow</h2>
        <span className="text-xs text-muted-foreground">X-Curve, Tax Strategy, Comparisons & Planning</span>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex gap-1 border-b bg-muted/10 px-4 py-1.5">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {activeTab === "xcurve" && <XCurveTab caseId={caseId} />}
        {activeTab === "tax" && <TaxBucketTab caseId={caseId} />}
        {activeTab === "roth7702" && <RothVs7702Tab caseId={caseId} />}
        {activeTab === "college" && <CollegePlanningTab caseId={caseId} />}
        {activeTab === "retirement" && <RetirementIncomeTab caseId={caseId} />}

        <div className="mt-8 flex justify-end">
          <Button onClick={onContinue} className="gap-1.5">
            Continue to Recommendations <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
