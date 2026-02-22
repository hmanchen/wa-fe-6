"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Briefcase,
  Landmark,
  TrendingUp,
  Home,
  CreditCard,
  Receipt,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PersonFinancialBackground, EmploymentStatus, FinancialHealthScore, IncomeSource, IncomeSourceType, Previous401k, DebtEntry, DebtType, ContributionLimitsData, ContributionLimitPlan } from "@/types/financial-interview";

// ── Sub-section definitions ──────────────────────────────────

type SubSection =
  | "employment"
  | "retirement"
  | "investments"
  | "realEstate"
  | "debts"
  | "expenses";

interface SubSectionDef {
  id: SubSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  fieldCount: number;
}

const SUB_SECTIONS: SubSectionDef[] = [
  { id: "employment", label: "Employment & Income", icon: Briefcase, fieldCount: 5 },
  { id: "retirement", label: "Retirement Accounts", icon: Landmark, fieldCount: 5 },
  { id: "investments", label: "Investments & Assets", icon: TrendingUp, fieldCount: 8 },
  { id: "realEstate", label: "Real Estate", icon: Home, fieldCount: 3 },
  { id: "debts", label: "Debts & Liabilities", icon: CreditCard, fieldCount: 5 },
  { id: "expenses", label: "Monthly Expenses", icon: Receipt, fieldCount: 9 },
];

// ── Reusable account card ────────────────────────────────────

function AccountCard({
  name,
  description,
  balance,
  onBalanceChange,
  contribution,
  onContributionChange,
  contributionLabel = "Annual Contrib.",
  accent = "border-l-blue-400",
  children,
}: {
  name: string;
  description: string;
  balance?: number;
  onBalanceChange?: (v: number | undefined) => void;
  contribution?: number;
  onContributionChange?: (v: number | undefined) => void;
  contributionLabel?: string;
  accent?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm", accent)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 sm:w-56 sm:shrink-0">
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {onBalanceChange && (
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Balance</Label>
              <div className="relative w-28">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={0}
                  className="h-8 pl-6 text-sm"
                  placeholder="0"
                  value={balance ?? ""}
                  onChange={(e) =>
                    onBalanceChange(e.target.value === "" ? undefined : Number(e.target.value))
                  }
                />
              </div>
            </div>
          )}
          {onContributionChange && (
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{contributionLabel}</Label>
              <div className="relative w-28">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={0}
                  className="h-8 pl-6 text-sm"
                  placeholder="0"
                  value={contribution ?? ""}
                  onChange={(e) =>
                    onContributionChange(e.target.value === "" ? undefined : Number(e.target.value))
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {children && <div className="mt-3 border-t pt-3">{children}</div>}
    </div>
  );
}

function CurrencyField({
  label,
  value,
  onChange,
  placeholder = "0",
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <Input
          type="number"
          min={0}
          className="h-8 pl-6 text-sm"
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      </div>
    </div>
  );
}

// ── Section completion check ─────────────────────────────────

function isSectionComplete(section: SubSection, data: PersonFinancialBackground): boolean {
  switch (section) {
    case "employment": {
      const hasSourceIncome = (data.income?.incomeSources ?? []).some((s) => (s.annualIncome ?? 0) > 0);
      const hasLegacyIncome = (data.income?.annualSalary ?? 0) > 0 || (data.income?.businessIncome ?? 0) > 0 || (data.income?.otherIncome ?? 0) > 0;
      return hasSourceIncome || hasLegacyIncome;
    }
    case "retirement":
      return !!(
        data.retirement401k?.currentBalance ||
        data.ira?.currentBalance ||
        data.rothIRA?.currentBalance
      );
    case "investments":
      return !!(
        data.brokerage?.currentValue ||
        data.bonds?.municipalBondValue ||
        data.equityCompensation?.vestedRSUValue ||
        data.cashOnHand?.checkingBalance ||
        data.hsa?.currentBalance
      );
    case "realEstate":
      return !!(data.realEstate?.primaryHomeEquity);
    case "debts": {
      const hasEntries = (data.debts?.entries ?? []).some((e) => (e.balance ?? 0) > 0);
      const hasLegacyDebts = !!(data.debts?.mortgageBalance || data.debts?.autoLoanBalance || data.debts?.studentLoanBalance || data.debts?.creditCardBalance);
      return hasEntries || hasLegacyDebts;
    }
    case "expenses":
      return !!(data.monthlyExpenses?.housing);
    default:
      return false;
  }
}

// ── Sub-section form content ─────────────────────────────────

const STATUS_OPTIONS: { value: EmploymentStatus; label: string; desc: string; color: string }[] = [
  { value: "employed", label: "Employed", desc: "Working for an employer", color: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" },
  { value: "self-employed", label: "Self-Employed / Business", desc: "Own business or freelance", color: "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300" },
  { value: "not-working", label: "Not Working", desc: "Homemaker, retired, or other", color: "border-slate-400 bg-slate-50 text-slate-600 dark:bg-slate-900/30 dark:text-slate-300" },
];

const SOURCE_TYPE_META: Record<IncomeSourceType, { label: string; desc: string; accent: string; icon: string }> = {
  employer: { label: "Employer", desc: "W-2 employment", accent: "border-l-emerald-400", icon: "💼" },
  business: { label: "Business / Self-Employed", desc: "1099, LLC, freelance", accent: "border-l-blue-400", icon: "🏢" },
  "side-hustle": { label: "Side Hustle / Gig", desc: "Uber, Lyft, DoorDash, etc.", accent: "border-l-amber-400", icon: "🚗" },
};

function makeSourceId() {
  return `src_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function IncomeSourceCard({
  source,
  index,
  onUpdate,
  onRemove,
}: {
  source: IncomeSource;
  index: number;
  onUpdate: (patch: Partial<IncomeSource>) => void;
  onRemove: () => void;
}) {
  const meta = SOURCE_TYPE_META[source.type];
  return (
    <div className={cn("rounded-lg border bg-card shadow-sm", meta.accent, "border-l-4")}>
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">{meta.icon}</span>
          <span className="text-xs font-semibold">
            {source.name || `${meta.label} ${index + 1}`}
          </span>
          {source.isCurrent && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Current
            </span>
          )}
          {!source.isCurrent && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Previous
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">{source.type === "employer" ? "Employer name" : "Business / Gig name"}</Label>
          <Input className="h-8 text-sm" placeholder={source.type === "employer" ? "e.g. Google" : source.type === "business" ? "e.g. ABC Consulting" : "e.g. Uber"}
            value={source.name ?? ""}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>
        <CurrencyField
          label={source.type === "employer" ? "Annual Salary" : "Annual Income"}
          value={source.annualIncome}
          onChange={(v) => onUpdate({ annualIncome: v })}
        />
        <CurrencyField
          label="Bonus / Commission"
          value={source.annualBonus}
          onChange={(v) => onUpdate({ annualBonus: v })}
        />
        <div className="space-y-1">
          <Label className="text-xs">Pay frequency</Label>
          <Select value={source.frequency ?? ""} onValueChange={(v) => onUpdate({ frequency: v as IncomeSource["frequency"] })}>
            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="semi-monthly">Semi-monthly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {source.type !== "employer" && (
          <div className="space-y-1">
            <Label className="text-xs">{source.type === "business" ? "Business type" : "Gig / hustle type"}</Label>
            <Input className="h-8 text-sm" placeholder={source.type === "business" ? "e.g. Consulting, Retail" : "e.g. Rideshare, Delivery"}
              value={source.businessType ?? ""}
              onChange={(e) => onUpdate({ businessType: e.target.value })}
            />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Years at this job</Label>
          <Input className="h-8 text-sm" type="number" min={0} placeholder="0"
            value={source.yearsAtJob ?? ""}
            onChange={(e) => onUpdate({ yearsAtJob: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" className="h-3.5 w-3.5 rounded accent-emerald-600"
              checked={source.isCurrent}
              onChange={(e) => onUpdate({ isCurrent: e.target.checked })}
            />
            Currently active
          </label>
        </div>
        {source.type === "employer" && (
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" className="h-3.5 w-3.5 rounded accent-blue-600"
                checked={source.has401k ?? false}
                onChange={(e) => onUpdate({ has401k: e.target.checked })}
              />
              Has 401(k) here
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

function EmploymentSection({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  const status = data.income?.employmentStatus ?? "employed";
  const sources: IncomeSource[] = data.income?.incomeSources ?? [];

  const updateSources = useCallback(
    (newSources: IncomeSource[]) => {
      update({ income: { ...data.income, incomeSources: newSources } });
    },
    [data.income, update]
  );

  const addSource = useCallback(
    (type: IncomeSourceType) => {
      updateSources([...sources, { id: makeSourceId(), type, isCurrent: true, name: "" }]);
    },
    [sources, updateSources]
  );

  const updateSource = useCallback(
    (idx: number, patch: Partial<IncomeSource>) => {
      const next = sources.map((s, i) => (i === idx ? { ...s, ...patch } : s));
      updateSources(next);
    },
    [sources, updateSources]
  );

  const removeSource = useCallback(
    (idx: number) => {
      updateSources(sources.filter((_, i) => i !== idx));
    },
    [sources, updateSources]
  );

  const totalIncome = useMemo(() => {
    return sources.reduce((sum, s) => sum + (s.annualIncome ?? 0) + (s.annualBonus ?? 0), 0) + (data.income?.otherIncome ?? 0);
  }, [sources, data.income?.otherIncome]);

  return (
    <div className="space-y-4">
      {/* Employment status selector */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Primary employment status</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ income: { ...data.income, employmentStatus: opt.value } })}
              className={cn(
                "rounded-lg border-2 px-3 py-2.5 text-left transition-all",
                status === opt.value
                  ? opt.color
                  : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70"
              )}
            >
              <p className="text-xs font-semibold">{opt.label}</p>
              <p className="text-[10px] opacity-70">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Income sources list */}
      {sources.length > 0 && (
        <div className="space-y-2">
          {sources.map((src, idx) => (
            <IncomeSourceCard
              key={src.id}
              source={src}
              index={idx}
              onUpdate={(patch) => updateSource(idx, patch)}
              onRemove={() => removeSource(idx)}
            />
          ))}
        </div>
      )}

      {/* Add source buttons — contextual based on employment status */}
      <div className="flex flex-wrap gap-2">
        {status === "employed" && (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
            onClick={() => addSource("employer")}
          >
            <Plus className="h-3.5 w-3.5" /> Add Employer
          </Button>
        )}
        {status === "self-employed" && (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/30"
            onClick={() => addSource("business")}
          >
            <Plus className="h-3.5 w-3.5" /> Add Business
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30"
          onClick={() => addSource("side-hustle")}
        >
          <Plus className="h-3.5 w-3.5" /> Add Side Hustle
        </Button>
      </div>

      {/* Other passive income */}
      <div className="rounded-lg border bg-card p-3 shadow-sm">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Additional Passive / Other Income</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <CurrencyField
            label="Other income (annual)"
            value={data.income?.otherIncome}
            onChange={(v) => update({ income: { ...data.income, otherIncome: v } })}
          />
          <div className="space-y-1">
            <Label className="text-xs">Source description</Label>
            <Input className="h-8 text-sm" placeholder="e.g. Rental income, Pension, Alimony"
              value={data.income?.otherIncomeSource ?? ""}
              onChange={(e) => update({ income: { ...data.income, otherIncomeSource: e.target.value } })}
            />
          </div>
          <div className="flex items-end">
            <div className="rounded-md bg-muted/60 px-3 py-1.5">
              <p className="text-[10px] text-muted-foreground">Total combined income</p>
              <p className="text-sm font-bold text-foreground">${totalIncome.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {sources.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-3">
          {status === "employed" && "Click above to add your employer(s) and any side hustles."}
          {status === "self-employed" && "Click above to add your business(es) and any side hustles."}
          {status === "not-working" && "Click above to add any side hustles or gig work."}
        </p>
      )}
    </div>
  );
}

function makePrev401kId() {
  return `p401k_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

const ACTION_LABELS: Record<string, string> = {
  "rolled-over": "Rolled over to IRA",
  "left-with-employer": "Left with former employer",
  "cashed-out": "Cashed out",
  "converted-to-roth": "Converted to Roth",
};

function findLimit(
  plans: ContributionLimitPlan[] | undefined,
  planType: string,
  coverageType: string,
  ageGroup: string
): number | null {
  if (!plans) return null;
  const plan = plans.find((p) => p.planType === planType);
  if (!plan) return null;
  const row = plan.limits.find(
    (l) => l.coverageType === coverageType && l.ageGroup === ageGroup
  );
  return row?.limitAmount ?? null;
}

function formatLimit(amount: number | null): string {
  return amount != null ? `$${amount.toLocaleString()}` : "—";
}

function RetirementSection({
  data,
  update,
  limits,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
  limits?: ContributionLimitsData | null;
}) {
  const prev401ks: Previous401k[] = data.retirement401k?.previous401ks ?? [];

  const updatePrev401ks = useCallback(
    (next: Previous401k[]) => {
      update({ retirement401k: { ...data.retirement401k, has401k: true, previous401ks: next } });
    },
    [data.retirement401k, update]
  );

  const addPrev401k = useCallback(() => {
    updatePrev401ks([...prev401ks, { id: makePrev401kId() }]);
  }, [prev401ks, updatePrev401ks]);

  const updateOnePrev = useCallback(
    (idx: number, patch: Partial<Previous401k>) => {
      updatePrev401ks(prev401ks.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
    },
    [prev401ks, updatePrev401ks]
  );

  const removePrev = useCallback(
    (idx: number) => {
      updatePrev401ks(prev401ks.filter((_, i) => i !== idx));
    },
    [prev401ks, updatePrev401ks]
  );

  const totalPrevBalance = useMemo(
    () => prev401ks.reduce((s, p) => s + (p.balance ?? 0), 0),
    [prev401ks]
  );

  const TaxBadge = ({ type }: { type: "pre-tax" | "post-tax" | "after-tax" | "roth" | "employer" }) => {
    const styles: Record<string, string> = {
      "pre-tax": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
      "post-tax": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      "after-tax": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      roth: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      employer: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    };
    const labels: Record<string, string> = {
      "pre-tax": "Pre-Tax",
      "post-tax": "Roth / Post-Tax",
      "after-tax": "After-Tax",
      roth: "Roth",
      employer: "Employer Match",
    };
    return (
      <span className={cn("ml-1.5 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide", styles[type])}>
        {labels[type]}
      </span>
    );
  };

  const plans = limits?.plans;
  const taxYear = limits?.taxYear ?? new Date().getFullYear();

  const k401Base = findLimit(plans, "401k", "individual", "all_ages") ?? findLimit(plans, "401k", "individual", "under_50");
  const k401Age50 = findLimit(plans, "401k", "individual", "age_50_plus");
  const k401Age60 = findLimit(plans, "401k", "individual", "age_60_63");
  const k401Total = findLimit(plans, "401k", "total_annual_additions", "all_ages");
  const roth401kBase = findLimit(plans, "roth_401k", "individual", "under_50");
  const afterTax401kTotal = findLimit(plans, "after_tax_401k", "total_annual_additions", "under_50");
  const iraBase = findLimit(plans, "traditional_ira", "individual", "under_50");
  const iraAge50 = findLimit(plans, "traditional_ira", "individual", "age_50_plus");
  const hsaIndiv = findLimit(plans, "hsa", "individual", "under_50");
  const hsaFamily = findLimit(plans, "hsa", "family", "under_50");
  const hsaAge55 = findLimit(plans, "hsa", "individual", "age_55_plus");

  return (
    <div className="space-y-3">
      {/* ── 401(k) Pre-Tax + Employer Match ── */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm", "border-l-indigo-400")}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">401(k) Plan & Employer Match</p>
            <p className="text-xs text-muted-foreground">Traditional pre-tax 401(k) with employer matching</p>
          </div>
          <div className="shrink-0 rounded-lg border bg-indigo-50/70 px-3 py-1.5 text-right dark:bg-indigo-950/20">
            <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-500">{taxYear} Max Contribution</p>
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Individual: {formatLimit(k401Base)}</p>
            <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70">Age 50+: {formatLimit(k401Age50)} · Age 60-63: {formatLimit(k401Age60)}</p>
            <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70">Total w/ employer: {formatLimit(k401Total)} (§415c)</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              401(k) Pre-Tax <TaxBadge type="pre-tax" />
            </p>
            <CurrencyField label="Balance" value={data.retirement401k?.currentBalance}
              onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, currentBalance: v } })} />
            <CurrencyField label="Employee Contribution (per pay)" value={data.retirement401k?.employeePreTaxContribution}
              onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, employeePreTaxContribution: v } })} />
          </div>
          <div className="space-y-2 rounded-lg bg-violet-50/50 p-3 dark:bg-violet-950/10 border border-violet-200 dark:border-violet-800">
            <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">
              Employer Match <TaxBadge type="employer" />
            </p>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Company Match %</Label>
                <Input className="h-8 text-sm" type="number" min={0} max={100} step={0.5} placeholder="e.g. 6"
                  value={data.retirement401k?.employerMatchPercent ?? ""}
                  onChange={(e) => update({ retirement401k: { ...data.retirement401k, has401k: true, employerMatchPercent: e.target.value ? Number(e.target.value) : undefined } })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Calculated Match (per pay)</Label>
                <div className="flex h-8 items-center rounded-md border bg-muted/40 px-3 text-sm font-medium">
                  ${(() => {
                    const contrib = data.retirement401k?.employeePreTaxContribution ?? 0;
                    const pct = data.retirement401k?.employerMatchPercent ?? 0;
                    return contrib > 0 && pct > 0 ? Math.round((contrib * pct) / 100).toLocaleString() : "—";
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Roth 401(k) + After-Tax 401(k) ── */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm", "border-l-emerald-400")}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Roth 401(k) & After-Tax 401(k)</p>
            <p className="text-xs text-muted-foreground">Post-tax and after-tax 401(k) contribution buckets</p>
          </div>
          <div className="shrink-0 rounded-lg border bg-emerald-50/70 px-3 py-1.5 text-right dark:bg-emerald-950/20">
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">{taxYear} Limits</p>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Roth 401(k): shares {formatLimit(roth401kBase ?? k401Base)} w/ Pre-Tax</p>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">After-Tax: up to {formatLimit(afterTax401kTotal ?? k401Total)} total (§415c)</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Roth 401(k) <TaxBadge type="post-tax" />
            </p>
            <p className="text-[10px] text-muted-foreground">Contributions are post-tax, growth is tax-free</p>
            <CurrencyField label="Balance" value={data.retirement401k?.roth401kBalance}
              onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, roth401kBalance: v } })} />
            <CurrencyField label="Contribution (per pay)" value={data.retirement401k?.roth401kContribution}
              onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, roth401kContribution: v } })} />
          </div>
          <div className="space-y-2 rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              401(k) After-Tax <TaxBadge type="after-tax" />
            </p>
            <p className="text-[10px] text-muted-foreground">Mega backdoor Roth eligible</p>
            <CurrencyField label="Balance" value={data.retirement401k?.afterTaxBalance}
              onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, afterTaxBalance: v } })} />
            <CurrencyField label="Contribution (per pay)" value={data.retirement401k?.afterTaxContribution}
              onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, afterTaxContribution: v } })} />
          </div>
        </div>
      </div>

      {/* ── IRA Section — Traditional, Roth, Backdoor Roth ── */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm", "border-l-indigo-400")}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Individual Retirement Accounts (IRA)</p>
            <p className="text-xs text-muted-foreground">Traditional, Roth, and Backdoor Roth IRAs</p>
          </div>
          <div className="shrink-0 rounded-lg border bg-indigo-50/70 px-3 py-1.5 text-right dark:bg-indigo-950/20">
            <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-500">{taxYear} Max Contribution</p>
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Individual: {formatLimit(iraBase)}</p>
            <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70">Age 50+: {formatLimit(iraAge50)} (combined Trad + Roth)</p>
            <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70">Backdoor Roth: no income limit</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2 rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Traditional IRA <TaxBadge type="pre-tax" />
            </p>
            <CurrencyField label="Balance" value={data.ira?.currentBalance}
              onChange={(v) => update({ ira: { ...data.ira, hasIRA: true, currentBalance: v } })} />
            <CurrencyField label="Annual Contribution" value={data.ira?.annualContribution}
              onChange={(v) => update({ ira: { ...data.ira, hasIRA: true, annualContribution: v } })} />
          </div>
          <div className="space-y-2 rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Roth IRA <TaxBadge type="roth" />
            </p>
            <CurrencyField label="Balance" value={data.rothIRA?.currentBalance}
              onChange={(v) => update({ rothIRA: { ...data.rothIRA, hasRothIRA: true, currentBalance: v } })} />
            <CurrencyField label="Annual Contribution" value={data.rothIRA?.annualContribution}
              onChange={(v) => update({ rothIRA: { ...data.rothIRA, hasRothIRA: true, annualContribution: v } })} />
          </div>
          <div className="space-y-2 rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
              Backdoor Roth IRA <TaxBadge type="roth" />
            </p>
            <p className="text-[10px] text-muted-foreground">Non-deductible Traditional → Roth conversion</p>
            <CurrencyField label="Balance" value={data.backdoorRothIRA?.currentBalance}
              onChange={(v) => update({ backdoorRothIRA: { ...data.backdoorRothIRA, hasBackdoorRoth: true, currentBalance: v } })} />
            <CurrencyField label="Annual Contribution" value={data.backdoorRothIRA?.annualContribution}
              onChange={(v) => update({ backdoorRothIRA: { ...data.backdoorRothIRA, hasBackdoorRoth: true, annualContribution: v } })} />
            <label className="flex items-center gap-2 text-[10px] cursor-pointer text-muted-foreground">
              <input type="checkbox" className="h-3 w-3 rounded accent-amber-600"
                checked={data.backdoorRothIRA?.hasProRataIssue ?? false}
                onChange={(e) => update({ backdoorRothIRA: { ...data.backdoorRothIRA, hasBackdoorRoth: true, hasProRataIssue: e.target.checked } })} />
              Has pro-rata issue (existing pre-tax IRA balance)
            </label>
          </div>
        </div>
      </div>

      {/* ── HSA ── */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm", "border-l-teal-400")}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">
              Health Savings Account (HSA) <TaxBadge type="pre-tax" />
            </p>
            <p className="text-xs text-muted-foreground">Triple tax-advantaged — pre-tax in, tax-free growth, tax-free withdrawal for medical</p>
          </div>
          <div className="shrink-0 rounded-lg border bg-teal-50/70 px-3 py-1.5 text-right dark:bg-teal-950/20">
            <p className="text-[9px] font-bold uppercase tracking-wider text-teal-500">{taxYear} Max Contribution</p>
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">Individual: {formatLimit(hsaIndiv)}</p>
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">Family: {formatLimit(hsaFamily)}</p>
            <p className="text-[10px] text-teal-600/70 dark:text-teal-400/70">Age 55+: {formatLimit(hsaAge55)} (w/ catch-up)</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <CurrencyField label="Current Balance" value={data.hsa?.currentBalance}
            onChange={(v) => update({ hsa: { ...data.hsa, hasHSA: true, currentBalance: v } })} />
          <CurrencyField label="Annual Contribution" value={data.hsa?.annualContribution}
            onChange={(v) => update({ hsa: { ...data.hsa, hasHSA: true, annualContribution: v } })} />
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" className="h-3.5 w-3.5 rounded accent-teal-600"
                checked={data.hsa?.isMaxedOut ?? false}
                onChange={(e) => update({ hsa: { ...data.hsa, hasHSA: true, isMaxedOut: e.target.checked } })} />
              Maxing out contributions
            </label>
          </div>
        </div>
      </div>

      {/* ── Previous 401(k)s from prior employers ── */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm", "border-l-amber-400")}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Previous 401(k) Accounts</p>
            <p className="text-xs text-muted-foreground">
              401(k) plans from prior employers
              {totalPrevBalance > 0 && (
                <span className="ml-2 font-medium text-amber-600 dark:text-amber-400">
                  — Total: ${totalPrevBalance.toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30"
            onClick={addPrev401k}
          >
            <Plus className="h-3.5 w-3.5" /> Add Previous 401(k)
          </Button>
        </div>

        {prev401ks.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            No previous 401(k) accounts added. Click above to add one.
          </p>
        ) : (
          <div className="space-y-2">
            {prev401ks.map((p, idx) => (
              <div key={p.id} className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
                <div className="flex-1 grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Former employer</Label>
                    <Input className="h-8 text-sm" placeholder="e.g. Amazon"
                      value={p.employerName ?? ""}
                      onChange={(e) => updateOnePrev(idx, { employerName: e.target.value })} />
                  </div>
                  <CurrencyField label="Balance" value={p.balance}
                    onChange={(v) => updateOnePrev(idx, { balance: v })} />
                  <div className="space-y-1">
                    <Label className="text-xs">What did you do with it?</Label>
                    <Select value={p.action ?? ""} onValueChange={(v) => updateOnePrev(idx, { action: v as Previous401k["action"] })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select action" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTION_LABELS).map(([val, lbl]) => (
                          <SelectItem key={val} value={val}>{lbl}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="mt-5 h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removePrev(idx)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pension & 403(b)/457(b) ── */}
      <AccountCard
        name="Pension / Defined Benefit"
        description="Employer-sponsored guaranteed income"
        accent="border-l-indigo-400"
        balance={data.pension?.lumpSumOption}
        onBalanceChange={(v) => update({ pension: { ...data.pension, hasPension: true, lumpSumOption: v } })}
        contribution={data.pension?.estimatedMonthlyBenefit}
        onContributionChange={(v) => update({ pension: { ...data.pension, hasPension: true, estimatedMonthlyBenefit: v } })}
        contributionLabel="Monthly Benefit"
      />
      <AccountCard
        name="403(b) / 457(b)"
        description="Non-profit & government retirement plan"
        accent="border-l-indigo-400"
        balance={data.plan403b457b?.currentBalance}
        onBalanceChange={(v) => update({ plan403b457b: { ...data.plan403b457b, hasPlan: true, currentBalance: v } })}
        contribution={data.plan403b457b?.annualContribution}
        onContributionChange={(v) => update({ plan403b457b: { ...data.plan403b457b, hasPlan: true, annualContribution: v } })}
      />
    </div>
  );
}

function InvestmentsSection({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Investment Accounts — compact 2-col grid */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm border-l-emerald-500")}>
        <div className="mb-3">
          <p className="text-sm font-semibold">Investment Accounts</p>
          <p className="text-xs text-muted-foreground">Brokerage, bonds, annuities, equity compensation & crypto</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CurrencyField label="Brokerage" value={data.brokerage?.currentValue}
            onChange={(v) => update({ brokerage: { ...data.brokerage, hasBrokerage: true, currentValue: v } })} />
          <CurrencyField label="Bond Holdings" value={(() => {
            const b = data.bonds;
            return b ? (b.municipalBondValue ?? 0) + (b.treasuryBondValue ?? 0) + (b.corporateBondValue ?? 0) + (b.bondFundValue ?? 0) || undefined : undefined;
          })()}
            onChange={(v) => update({ bonds: { ...data.bonds, hasBonds: true, municipalBondValue: v } })} />
          <CurrencyField label="Annuities" value={data.annuity?.currentValue}
            onChange={(v) => update({ annuity: { ...data.annuity, hasAnnuity: true, currentValue: v } })} />
          <CurrencyField label="RSUs / Stock Options" value={(() => {
            const e = data.equityCompensation;
            return e ? (e.vestedOptionsValue ?? 0) + (e.vestedRSUValue ?? 0) || undefined : undefined;
          })()}
            onChange={(v) => update({ equityCompensation: { ...data.equityCompensation, hasEquityComp: true, vestedRSUValue: v } })} />
          <CurrencyField label="Cryptocurrency" value={data.crypto?.totalValue}
            onChange={(v) => update({ crypto: { ...data.crypto, hasCrypto: true, totalValue: v } })} />
        </div>
      </div>

      {/* Cash & Savings — compact 2-col grid */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm border-l-amber-400")}>
        <div className="mb-3">
          <p className="text-sm font-semibold">Cash & Savings</p>
          <p className="text-xs text-muted-foreground">Checking, savings, HSA, CDs, 529, and emergency fund</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CurrencyField label="Checking" value={data.cashOnHand?.checkingBalance}
            onChange={(v) => update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, checkingBalance: v } })} />
          <CurrencyField label="Savings" value={data.cashOnHand?.savingsBalance}
            onChange={(v) => update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, savingsBalance: v } })} />
          <CurrencyField label="HSA" value={data.hsa?.currentBalance}
            onChange={(v) => update({ hsa: { ...data.hsa, hasHSA: true, currentBalance: v } })} />
          <CurrencyField label="CDs" value={data.cd?.totalValue}
            onChange={(v) => update({ cd: { ...data.cd, hasCDs: true, totalValue: v } })} />
          <CurrencyField label="529 Education" value={data.education529?.totalBalance}
            onChange={(v) => update({ education529: { ...data.education529, has529: true, totalBalance: v } })} />
          <CurrencyField label="Emergency Fund (months)" value={data.cashOnHand?.emergencyFundMonths}
            onChange={(v) => update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, emergencyFundMonths: v } })}
            placeholder="e.g. 6" />
        </div>
      </div>

      {/* Social Security — single inline row */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm border-l-violet-400")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Social Security Estimate</p>
            <p className="text-xs text-muted-foreground">Projected monthly benefit at full retirement age</p>
          </div>
          <div className="w-40">
            <CurrencyField label="Monthly at FRA" value={data.socialSecurity?.estimatedMonthlyBenefitFRA}
              onChange={(v) => update({ socialSecurity: { ...data.socialSecurity, hasEstimate: true, estimatedMonthlyBenefitFRA: v } })} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RealEstateSection({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  return (
    <div className="space-y-3">
      <AccountCard
        name="Primary Home"
        description="Primary residence equity (market value minus mortgage)"
        accent="border-l-sky-500"
        balance={data.realEstate?.primaryHomeEquity}
        onBalanceChange={(v) => update({ realEstate: { ...data.realEstate, hasRealEstate: true, primaryHomeEquity: v } })}
      />
      <AccountCard
        name="Investment Properties"
        description="Rental properties and other real estate investments"
        accent="border-l-sky-500"
        balance={data.realEstate?.totalMarketValue}
        onBalanceChange={(v) => update({ realEstate: { ...data.realEstate, hasRealEstate: true, totalMarketValue: v } })}
        contribution={data.realEstate?.monthlyRentalIncome}
        onContributionChange={(v) => update({ realEstate: { ...data.realEstate, hasRealEstate: true, monthlyRentalIncome: v } })}
        contributionLabel="Rental Income"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Number of properties</Label>
            <Input type="number" min={0} className="h-8 w-32 text-sm" placeholder="0"
              value={data.realEstate?.numberOfProperties ?? ""}
              onChange={(e) => update({ realEstate: { ...data.realEstate, hasRealEstate: true, numberOfProperties: e.target.value === "" ? undefined : parseInt(e.target.value, 10) } })}
            />
          </div>
          <CurrencyField label="Total mortgage on investments" value={data.realEstate?.totalMortgageBalance}
            onChange={(v) => update({ realEstate: { ...data.realEstate, hasRealEstate: true, totalMortgageBalance: v } })} />
        </div>
      </AccountCard>
    </div>
  );
}

const DEBT_TYPE_META: Record<DebtType, { label: string; icon: string }> = {
  mortgage: { label: "Mortgage", icon: "🏠" },
  "auto-loan": { label: "Auto Loan", icon: "🚗" },
  "student-loan": { label: "Student Loan", icon: "🎓" },
  "credit-card": { label: "Credit Card", icon: "💳" },
  "personal-loan": { label: "Personal Loan", icon: "💰" },
  heloc: { label: "HELOC", icon: "🏡" },
  "401k-loan": { label: "401(k) Loan", icon: "🏦" },
  "medical-debt": { label: "Medical Debt", icon: "🏥" },
  "tax-debt": { label: "Tax Debt", icon: "🏛️" },
  "business-loan": { label: "Business Loan", icon: "🏢" },
  other: { label: "Other", icon: "📋" },
};

function makeDebtId() {
  return `debt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function DebtsSection({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  const entries: DebtEntry[] = data.debts?.entries ?? [];

  const updateEntries = useCallback(
    (next: DebtEntry[]) => {
      update({ debts: { ...data.debts, entries: next } });
    },
    [data.debts, update]
  );

  const addDebt = useCallback(
    (type: DebtType) => {
      updateEntries([...entries, { id: makeDebtId(), type }]);
    },
    [entries, updateEntries]
  );

  const updateOne = useCallback(
    (idx: number, patch: Partial<DebtEntry>) => {
      updateEntries(entries.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
    },
    [entries, updateEntries]
  );

  const removeOne = useCallback(
    (idx: number) => {
      updateEntries(entries.filter((_, i) => i !== idx));
    },
    [entries, updateEntries]
  );

  const totalBalance = useMemo(() => entries.reduce((s, e) => s + (e.balance ?? 0), 0), [entries]);
  const totalPayment = useMemo(() => entries.reduce((s, e) => s + (e.monthlyPayment ?? 0), 0), [entries]);

  const usedTypes = useMemo(() => new Set(entries.map((e) => e.type)), [entries]);

  return (
    <div className="space-y-4">
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm border-l-red-400")}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold">Debts & Liabilities</p>
            <p className="text-xs text-muted-foreground">Select debt types and enter balances</p>
          </div>
          {entries.length > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Total debt</p>
              <p className="text-sm font-bold text-red-600 dark:text-red-400">${totalBalance.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Add debt dropdown */}
        <div className="mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 w-full justify-start gap-2 border-dashed border-red-200 text-sm text-muted-foreground hover:border-red-400 hover:bg-red-50/50 dark:border-red-800 dark:hover:border-red-600 dark:hover:bg-red-950/20">
                <Plus className="h-3.5 w-3.5" />
                Add a debt...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {(Object.entries(DEBT_TYPE_META) as [DebtType, { label: string; icon: string }][]).map(
                ([type, meta]) => {
                  const alreadyAdded = usedTypes.has(type) && type !== "credit-card" && type !== "401k-loan" && type !== "other";
                  return (
                    <DropdownMenuItem
                      key={type}
                      disabled={alreadyAdded}
                      onClick={() => addDebt(type)}
                      className="gap-2"
                    >
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                      {alreadyAdded && (
                        <span className="ml-auto text-[10px] text-muted-foreground">(added)</span>
                      )}
                    </DropdownMenuItem>
                  );
                }
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Debt entries */}
        {entries.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No debts added yet. Use the dropdown above to add a debt type.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Header row */}
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2rem] gap-3 px-3 sm:grid">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Debt Type</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Balance</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Monthly Payment</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Interest Rate</span>
              <span />
            </div>

            {entries.map((entry, idx) => {
              const meta = DEBT_TYPE_META[entry.type];
              return (
                <div key={entry.id} className="grid items-center gap-3 rounded-lg border bg-muted/10 px-3 py-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2rem]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{meta.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{meta.label}</p>
                      {(entry.type === "other" || entry.type === "personal-loan" || entry.type === "business-loan") && (
                        <Input className="mt-1 h-7 text-xs" placeholder="Description..."
                          value={entry.description ?? ""}
                          onChange={(e) => updateOne(idx, { description: e.target.value })}
                        />
                      )}
                    </div>
                  </div>
                  <CurrencyField label="" value={entry.balance} onChange={(v) => updateOne(idx, { balance: v })} />
                  <CurrencyField label="" value={entry.monthlyPayment} onChange={(v) => updateOne(idx, { monthlyPayment: v })} />
                  <div className="space-y-1">
                    <Input className="h-8 text-sm" type="number" min={0} max={100} step={0.1} placeholder="%"
                      value={entry.interestRate ?? ""}
                      onChange={(e) => updateOne(idx, { interestRate: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeOne(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}

            {/* Totals row */}
            <div className="grid items-center gap-3 rounded-lg bg-red-50/50 px-3 py-2.5 dark:bg-red-950/10 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2rem]">
              <span className="text-xs font-bold">Total</span>
              <p className="text-xs font-bold text-red-600 dark:text-red-400">${totalBalance.toLocaleString()}</p>
              <p className="text-xs font-bold text-red-600 dark:text-red-400">${totalPayment.toLocaleString()}/mo</p>
              <span />
              <span />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MonthlyExpensesSection({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  return (
    <div className="space-y-3">
      <AccountCard
        name="Monthly Expenses"
        description="Total household monthly spending"
        accent="border-l-orange-400"
        balance={(() => {
          const e = data.monthlyExpenses ?? {};
          return (e.housing ?? 0) + (e.utilities ?? 0) + (e.transportation ?? 0) +
            (e.groceries ?? 0) + (e.insurance ?? 0) + (e.childcare ?? 0) +
            (e.entertainment ?? 0) + (e.diningOut ?? 0) + (e.subscriptions ?? 0) + (e.otherExpenses ?? 0) || undefined;
        })()}
        onBalanceChange={() => {}}
        contributionLabel=""
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <CurrencyField label="Housing" value={data.monthlyExpenses?.housing}
            onChange={(v) => update({ monthlyExpenses: { ...data.monthlyExpenses, housing: v } })} />
          <CurrencyField label="Utilities" value={data.monthlyExpenses?.utilities}
            onChange={(v) => update({ monthlyExpenses: { ...data.monthlyExpenses, utilities: v } })} />
          <CurrencyField label="Transportation" value={data.monthlyExpenses?.transportation}
            onChange={(v) => update({ monthlyExpenses: { ...data.monthlyExpenses, transportation: v } })} />
          <CurrencyField label="Groceries" value={data.monthlyExpenses?.groceries}
            onChange={(v) => update({ monthlyExpenses: { ...data.monthlyExpenses, groceries: v } })} />
          <CurrencyField label="Insurance" value={data.monthlyExpenses?.insurance}
            onChange={(v) => update({ monthlyExpenses: { ...data.monthlyExpenses, insurance: v } })} />
          <CurrencyField label="Childcare / Schooling / Education" value={data.monthlyExpenses?.childcare}
            onChange={(v) => update({ monthlyExpenses: { ...data.monthlyExpenses, childcare: v } })} />
          <CurrencyField label="Entertainment" value={data.monthlyExpenses?.entertainment}
            onChange={(v) => update({ monthlyExpenses: { ...data.monthlyExpenses, entertainment: v } })} />
          <CurrencyField label="Dining out" value={data.monthlyExpenses?.diningOut}
            onChange={(v) => update({ monthlyExpenses: { ...data.monthlyExpenses, diningOut: v } })} />
          <CurrencyField label="Other" value={data.monthlyExpenses?.otherExpenses}
            onChange={(v) => update({ monthlyExpenses: { ...data.monthlyExpenses, otherExpenses: v } })} />
        </div>
      </AccountCard>
    </div>
  );
}

// ── Section title & description ──────────────────────────────

const SECTION_META: Record<SubSection, { title: string; description: string }> = {
  employment: { title: "Employment & Income", description: "Enter salary, bonus, and income sources" },
  retirement: { title: "Retirement Accounts", description: "Enter all retirement accounts" },
  investments: { title: "Investments & Assets", description: "Enter investment accounts, savings, and liquid assets" },
  realEstate: { title: "Real Estate", description: "Enter primary home and investment property details" },
  debts: { title: "Debts & Liabilities", description: "Enter mortgage, auto loans, student loans, and other debts" },
  expenses: { title: "Monthly Expenses", description: "Enter monthly household spending" },
};

const SECTION_ICONS: Record<SubSection, string> = {
  employment: "💼",
  retirement: "🏦",
  investments: "📈",
  realEstate: "🏠",
  debts: "💳",
  expenses: "🧾",
};

// ── Main Layout ──────────────────────────────────────────────

function makeEmptyData(role: "primary" | "spouse"): PersonFinancialBackground {
  return {
    role,
    yearsInCountry: 0,
    countryOfResidence: "US",
    income: { incomeSources: [] },
    monthlyExpenses: {},
    retirement401k: { has401k: false, previous401ks: [] },
    employmentHistory: [],
    hsa: { hasHSA: false },
    ira: { hasIRA: false },
    rothIRA: { hasRothIRA: false },
    backdoorRothIRA: { hasBackdoorRoth: false },
    pension: { hasPension: false },
    plan403b457b: { hasPlan: false },
    brokerage: { hasBrokerage: false },
    cd: { hasCDs: false },
    bonds: { hasBonds: false },
    annuity: { hasAnnuity: false },
    equityCompensation: { hasEquityComp: false },
    education529: { has529: false },
    realEstate: { hasRealEstate: false },
    crypto: { hasCrypto: false },
    cashOnHand: { hasCashOnHand: false },
    socialSecurity: { hasEstimate: false },
    systematicInvestments: { hasSystematicInvestments: false },
    fundsAbroad: { sendsFundsAbroad: false },
    debts: { entries: [] },
    lifeInsurance: {},
    estate: {},
  };
}

export interface FinancialBgLayoutProps {
  clientNames: string;
  caseId: string;
  defaultValues?: PersonFinancialBackground;
  role: "primary" | "spouse";
  healthScore?: FinancialHealthScore | null;
  contributionLimits?: ContributionLimitsData | null;
  onSubmit: (data: PersonFinancialBackground) => void | Promise<void>;
  isSubmitting?: boolean;
  /** Called when all sub-sections are done and user clicks "Save & Continue" on the last one */
  onComplete?: () => void;
}

export function FinancialBgLayout({
  clientNames,
  caseId,
  defaultValues,
  role,
  healthScore,
  contributionLimits,
  onSubmit,
  isSubmitting = false,
  onComplete,
}: FinancialBgLayoutProps) {
  const [data, setData] = useState<PersonFinancialBackground>(
    defaultValues ?? makeEmptyData(role)
  );
  const [activeSection, setActiveSection] = useState<SubSection>("employment");

  const update = useCallback((patch: Partial<PersonFinancialBackground>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const completedSections = useMemo(
    () => SUB_SECTIONS.filter((s) => isSectionComplete(s.id, data)).map((s) => s.id),
    [data]
  );

  const progressPercent = Math.round((completedSections.length / SUB_SECTIONS.length) * 100);

  const currentIdx = SUB_SECTIONS.findIndex((s) => s.id === activeSection);

  const handlePrev = () => {
    if (currentIdx > 0) setActiveSection(SUB_SECTIONS[currentIdx - 1].id);
  };
  const handleNext = () => {
    if (currentIdx < SUB_SECTIONS.length - 1) {
      setActiveSection(SUB_SECTIONS[currentIdx + 1].id);
    } else if (onComplete) {
      onComplete();
    }
  };
  const handleSaveAndNext = async () => {
    try {
      await onSubmit(data);
      handleNext();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      console.error("Save failed:", message);
    }
  };

  const meta = SECTION_META[activeSection];

  // ── Render ──

  return (
    <div className="flex flex-col gap-0">
      {/* ── Top header bar ── */}
      <div className={cn(
        "flex flex-wrap items-center gap-3 rounded-t-xl border px-4 py-2.5",
        role === "primary"
          ? "bg-violet-50/50 dark:bg-violet-950/10"
          : "bg-rose-50/50 dark:bg-rose-950/10"
      )}>
        <h2 className="text-base font-bold">Financial Background</h2>
        <span className={cn(
          "rounded-full px-3 py-0.5 text-xs font-semibold",
          role === "primary"
            ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
        )}>
          {role === "primary" ? "Primary Client" : "Spouse"} — {clientNames}
        </span>
        <div className="flex flex-1 items-center gap-2">
          <Progress value={progressPercent} className="h-1.5 flex-1" />
          <span className="text-xs font-medium text-muted-foreground">{progressPercent}%</span>
        </div>
      </div>

        <div className="flex min-h-[500px] rounded-b-xl border border-t-0">
          {/* ── Left sidebar ── */}
          <div className="hidden w-56 shrink-0 border-r bg-muted/10 p-4 md:block">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Sections
            </p>
            <div className="space-y-1">
              {SUB_SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                const isComplete = completedSections.includes(section.id);
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {isComplete ? (
                      <div className="flex size-5 items-center justify-center rounded-full bg-green-500">
                        <Check className="size-3 text-white" />
                      </div>
                    ) : (
                      <Icon className="size-5" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate">{section.label}</p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {section.fieldCount} fields
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Financial Health Score */}
            {(() => {
              const total = healthScore?.totalScore ?? 0;
              const cats = healthScore?.categories;
              return (
                <div className="mt-2 rounded-xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-background p-4 dark:border-amber-800/40 dark:from-amber-950/20">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-500">
                    Financial Health Score
                  </p>
                  <div className="mb-1 flex items-baseline gap-1.5">
                    <span className="text-5xl font-black leading-none">{total}</span>
                    <span className="text-lg text-muted-foreground">/{healthScore?.maxPossibleScore ?? 100}</span>
                  </div>
                  <p className="mb-4 text-xs text-muted-foreground">
                    {!healthScore
                      ? "Loading..."
                      : total < 30
                        ? "Partial — more screens ahead"
                        : total < 60
                          ? "Building — keep going"
                          : "Looking strong!"}
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Retirement", value: cats?.retirement?.score ?? 0, maxScore: cats?.retirement?.maxScore ?? 20, color: "bg-orange-400" },
                      { label: "Education", value: cats?.education?.score ?? 0, maxScore: cats?.education?.maxScore ?? 20, color: "bg-blue-400" },
                      { label: "Tax", value: cats?.tax?.score ?? 0, maxScore: cats?.tax?.maxScore ?? 20, color: "bg-red-400" },
                      { label: "Protection", value: cats?.protection?.score ?? 0, maxScore: cats?.protection?.maxScore ?? 20, color: "bg-green-400" },
                      { label: "Estate", value: cats?.estate?.score ?? 0, maxScore: cats?.estate?.maxScore ?? 20, color: "bg-purple-400" },
                    ].map((cat) => (
                      <div key={cat.label} className="flex items-center gap-2">
                        <span className="w-[4.5rem] text-xs text-muted-foreground">{cat.label}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full transition-all", cat.color)}
                            style={{ width: cat.value !== null ? `${(cat.value / cat.maxScore) * 100}%` : "0%" }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs font-semibold">
                          {cat.value !== null ? `${cat.value}/${cat.maxScore}` : `—/${cat.maxScore}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── Main form area ── */}
          <div className="flex-1 p-6">
            <div className="mb-5">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <span>{SECTION_ICONS[activeSection]}</span>
                {meta.title}
                <span className={cn(
                  "ml-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  role === "primary"
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                )}>
                  {role === "primary" ? "Primary Client" : "Spouse"}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground">{meta.description}</p>
            </div>

            {activeSection === "employment" && <EmploymentSection data={data} update={update} />}
            {activeSection === "retirement" && <RetirementSection data={data} update={update} limits={contributionLimits} />}
            {activeSection === "investments" && <InvestmentsSection data={data} update={update} />}
            {activeSection === "realEstate" && <RealEstateSection data={data} update={update} />}
            {activeSection === "debts" && <DebtsSection data={data} update={update} />}
            {activeSection === "expenses" && <MonthlyExpensesSection data={data} update={update} />}

            {/* ── Bottom navigation ── */}
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handlePrev}
                disabled={currentIdx === 0}
              >
                <ChevronLeft className="size-3.5" />
                Previous Section
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleSaveAndNext}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : currentIdx < SUB_SECTIONS.length - 1
                    ? "Save & Next Section"
                    : "Save & Continue"}
                <ChevronRight className="size-3.5" />
              </Button>
            </div>

            {/* ── Debug: API URL & JSON Payload ── */}
            <div className="mt-6 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-4 dark:border-amber-700 dark:bg-amber-950/20">
              <p className="mb-2 text-xs font-bold text-amber-700 dark:text-amber-400">🛠 Debug — API Info</p>
              <div className="space-y-2">
                <div>
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">API URL</Label>
                  <Input readOnly className="mt-0.5 h-8 font-mono text-xs bg-white dark:bg-black"
                    value={`PUT ${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/cases/${caseId}/discovery/`}
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">JSON Payload</Label>
                  <textarea readOnly rows={10}
                    className="mt-0.5 w-full rounded-md border bg-white p-2 font-mono text-[11px] leading-relaxed dark:bg-black"
                    value={JSON.stringify({
                      financial_profile: {
                        [role === "primary" ? "primary_background" : "spouse_background"]: data,
                      },
                    }, null, 2)}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
    </div>
  );
}
