"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api/client";
import {
  Briefcase,
  Landmark,
  TrendingUp,
  GraduationCap,
  Home,
  CreditCard,
  Receipt,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Info,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  PrefillErrorBanner,
  PrefillLoadingBanner,
  PrefillSuccessBanner,
} from "@/components/features/financial-interview/prefill-banners";
import { useCalculate401k } from "@/hooks/use-financial-interview";
import type { Calculate401kRequest } from "@/lib/api/financial-interview";
import type { PersonFinancialBackground, EmploymentStatus, FinancialHealthScore, IncomeSource, IncomeSourceType, Previous401k, DebtEntry, DebtType, ContributionLimitsData, ContributionLimitPlan, MarketSnapshot, MatchStructureType, TenureTier } from "@/types/financial-interview";
import type { Case } from "@/types/case";

// ── Sub-section definitions ──────────────────────────────────

type SubSection =
  | "employment"
  | "retirement"
  | "investments"
  | "college"
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
  { id: "college", label: "College Savings", icon: GraduationCap, fieldCount: 6 },
  { id: "realEstate", label: "Real Estate", icon: Home, fieldCount: 3 },
  { id: "debts", label: "Debts & Liabilities", icon: CreditCard, fieldCount: 5 },
  { id: "expenses", label: "Monthly Expenses", icon: Receipt, fieldCount: 9 },
];

// Prevent repeated prefill loops from remount/re-render churn.
// - inFlight: dedupe concurrent same-key requests
// - successful: avoid refetching the same completed key
const prefillInFlightRequestKeys = new Set<string>();
const prefillSuccessfulRequestKeys = new Set<string>();

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
  isPrefilled = false,
  isUserEdited = false,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  isPrefilled?: boolean;
  isUserEdited?: boolean;
}) {
  const parseNonNegative = (raw: string): number | undefined => {
    if (raw === "") return undefined;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return undefined;
    return Math.max(0, parsed);
  };

  return (
    <div className={cn("space-y-1", isUserEdited ? "expense-field--edited" : isPrefilled ? "expense-field--prefilled" : "")}>
      <Label className="text-xs">
        {label}
        {isPrefilled && !isUserEdited && <span className="prefill-badge">~ avg</span>}
        {isUserEdited && <span className="edited-badge">✏️</span>}
      </Label>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <Input
          type="number"
          min={0}
          className="h-8 pl-6 text-sm"
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(parseNonNegative(e.target.value))}
        />
      </div>
    </div>
  );
}

function PercentInputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          className="h-8 pr-7 text-sm"
          type="number"
          min={0}
          step={0.1}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
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
    case "college":
      return !!(data.collegeSavings?.children ?? []).length;
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

function normalizeEmployerName(input: string): string {
  const raw = input.trim();
  if (!raw.includes("@")) return raw;
  const [left, right] = raw.split("@", 2).map((part) => part.trim());
  if (!left || !right) return raw;
  // If users enter "Title @ Company", persist only the company segment.
  return right;
}

function looksLikeRoleAtCompany(value: string): boolean {
  const raw = value.trim();
  if (!raw.includes("@")) return false;
  const roleWords = /(engineer|developer|manager|director|analyst|consultant|specialist|officer|lead|architect)/i;
  return roleWords.test(raw.split("@", 1)[0] ?? "");
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
  const employerNameHasRolePattern = source.type === "employer" && looksLikeRoleAtCompany(source.name ?? "");
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
            onBlur={(e) => {
              if (source.type !== "employer") return;
              const normalized = normalizeEmployerName(e.target.value);
              if (normalized !== (source.name ?? "")) {
                onUpdate({ name: normalized });
              }
            }}
          />
          {employerNameHasRolePattern && (
            <p className="text-[11px] text-amber-700">
              Enter company name only. We auto-correct entries like "Software Engineer @ Company" to "Company".
            </p>
          )}
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
          <Input className="h-8 text-sm" type="number" min={0} placeholder="e.g. 5"
            value={source.yearsAtJob && source.yearsAtJob > 0 ? source.yearsAtJob : ""}
            onChange={(e) =>
              onUpdate({
                yearsAtJob: e.target.value
                  ? Math.max(0, Number(e.target.value))
                  : undefined,
              })
            }
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
  householdAnnualIncome,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
  householdAnnualIncome?: number;
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
    const activeSourceIncome = sources.reduce((sum, s) => {
      // For employer rows, only include income when the source is currently active.
      if (s.type === "employer" && !s.isCurrent) return sum;
      return sum + (s.annualIncome ?? 0) + (s.annualBonus ?? 0);
    }, 0);

    return activeSourceIncome + (data.income?.otherIncome ?? 0);
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
            <div className="space-y-1.5">
              <div className="rounded-md bg-muted/60 px-3 py-1.5">
                <p className="text-[10px] text-muted-foreground">Total combined income</p>
                <p className="text-sm font-bold text-foreground">${totalIncome.toLocaleString()}</p>
              </div>
              <div className="rounded-md bg-blue-50 px-3 py-1.5 dark:bg-blue-950/30">
                <p className="text-[10px] text-muted-foreground">Total household income (primary + spouse)</p>
                <p className="text-sm font-bold text-foreground">
                  ${Math.round(householdAnnualIncome ?? totalIncome).toLocaleString()}
                </p>
              </div>
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
  clientAge,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
  limits?: ContributionLimitsData | null;
  clientAge?: number;
}) {
  const prev401ks: Previous401k[] = data.retirement401k?.previous401ks ?? [];
  const [showCatchUpJustification, setShowCatchUpJustification] = useState(false);
  const [expandedRetirementSections, setExpandedRetirementSections] = useState({
    k401: false,
    rothAfterTax: false,
    ira: false,
    hsa: false,
    previous401k: false,
    pension: false,
    plan403457: false,
  });

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
  const toggleRetirementSection = useCallback(
    (key: keyof typeof expandedRetirementSections) => {
      setExpandedRetirementSections((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
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

  // ── Build 401(k) API request payload ──
  const matchTypeStr: MatchStructureType = data.retirement401k?.matchStructureType ?? "simple";
  const matchTypeNumMap: Record<MatchStructureType, number> = { simple: 1, tiered: 2, dollar_capped: 3, tenure: 4, auto_plus_match: 5 };
  const salary401k = data.income?.incomeSources?.[0]?.annualIncome ?? 0;
  const empPct401k = data.retirement401k?.employeeContributionPercent ?? 0;
  const t1Rate401k = data.retirement401k?.employerMatchPercent ?? 0;
  const t1Cap401k = data.retirement401k?.employerMatchCapPercent ?? 0;
  const age401k = clientAge ?? 35;
  const freqStr = data.income?.incomeSources?.[0]?.frequency;
  const payFreq401k = freqStr === "weekly" ? 52 : freqStr === "biweekly" ? 26 : freqStr === "semi-monthly" ? 24 : freqStr === "monthly" ? 12 : 26;

  const calc401kReady = useMemo(() => {
    if (!salary401k || !empPct401k) return { ready: false, missing: ["Annual Salary (Employment & Income)", "Employee Contribution %"] as string[] };
    const missing: string[] = [];
    if (!t1Rate401k) missing.push("Tier 1 Match Rate %");
    if (!t1Cap401k) missing.push("Tier 1 Match Cap %");
    if (matchTypeStr === "tiered") {
      const t2r = data.retirement401k?.tier2MatchRatePercent;
      const t2c = data.retirement401k?.tier2CapPercent;
      if (!t2r) missing.push("Tier 2 Match Rate %");
      if (!t2c) missing.push("Tier 2 Cap %");
    }
    if (matchTypeStr === "dollar_capped" && !data.retirement401k?.maxEmployerMatchDollars) {
      missing.push("Maximum Employer Match ($)");
    }
    if (matchTypeStr === "tenure") {
      if (data.retirement401k?.yearsOfService == null) missing.push("Years of Service");
      const tiers = data.retirement401k?.tenureTiers ?? [];
      const validTiers = tiers.filter((t) => t.matchRatePercent != null && t.upToYears != null);
      if (validTiers.length < 2) missing.push("At least 2 Tenure Tiers");
    }
    return { ready: missing.length === 0, missing };
  }, [salary401k, empPct401k, t1Rate401k, t1Cap401k, matchTypeStr,
      data.retirement401k?.tier2MatchRatePercent, data.retirement401k?.tier2CapPercent,
      data.retirement401k?.maxEmployerMatchDollars, data.retirement401k?.yearsOfService,
      data.retirement401k?.tenureTiers]);

  const calc401kPayload = useMemo((): Calculate401kRequest | null => {
    if (!calc401kReady.ready) return null;

    const base: Calculate401kRequest = {
      salary: salary401k,
      payFrequency: payFreq401k,
      age: age401k,
      empContribPct: empPct401k / 100,
      currentBalance: data.retirement401k?.currentBalance ?? 0,
      matchType: matchTypeNumMap[matchTypeStr],
      matchRate: t1Rate401k / 100,
      matchCapPct: t1Cap401k / 100,
    };

    if (matchTypeStr === "dollar_capped") {
      base.dollarCap = data.retirement401k?.maxEmployerMatchDollars;
    }

    if (matchTypeStr === "tiered") {
      const tiers: { matchRate: number; capPct: number }[] = [];
      tiers.push({ matchRate: t1Rate401k / 100, capPct: t1Cap401k / 100 });
      const t2Rate = data.retirement401k?.tier2MatchRatePercent;
      const t2Cap = data.retirement401k?.tier2CapPercent;
      if (t2Rate && t2Cap) tiers.push({ matchRate: t2Rate / 100, capPct: t2Cap / 100 });
      const t3Rate = data.retirement401k?.tier3MatchRatePercent;
      const t3Cap = data.retirement401k?.tier3CapPercent;
      if (t3Rate && t3Cap) tiers.push({ matchRate: t3Rate / 100, capPct: t3Cap / 100 });
      base.tiers = tiers;
    }

    if (matchTypeStr === "tenure") {
      base.yearsOfService = data.retirement401k?.yearsOfService ?? 0;
      const srcTiers = data.retirement401k?.tenureTiers ?? [];
      base.tenureTiers = srcTiers
        .filter((t) => t.matchRatePercent != null && t.upToYears != null)
        .map((t) => ({ maxYears: t.upToYears!, matchRate: (t.matchRatePercent ?? 0) / 100 }));
    }

    if (matchTypeStr === "auto_plus_match") {
      base.autoContribPct = (data.retirement401k?.autoContributionPercent ?? 0) / 100;
      base.autoContribType = data.retirement401k?.autoContributionType ?? "flat";
      if (data.retirement401k?.autoContributionType === "age_based") {
        base.ageBrackets = [
          { maxAge: 29, pct: (data.retirement401k?.ageBracketUnder30 ?? 0) / 100 },
          { maxAge: 39, pct: (data.retirement401k?.ageBracket30to39 ?? 0) / 100 },
          { maxAge: 49, pct: (data.retirement401k?.ageBracket40to49 ?? 0) / 100 },
          { maxAge: 999, pct: (data.retirement401k?.ageBracket50Plus ?? 0) / 100 },
        ];
      }
    }

    console.log("[401k Calculate] Sending payload →", base);
    return base;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calc401kReady.ready, salary401k, empPct401k, t1Rate401k, t1Cap401k, matchTypeStr, payFreq401k, age401k,
      data.retirement401k?.currentBalance, data.retirement401k?.maxEmployerMatchDollars,
      data.retirement401k?.tier2MatchRatePercent, data.retirement401k?.tier2CapPercent,
      data.retirement401k?.tier3MatchRatePercent, data.retirement401k?.tier3CapPercent,
      data.retirement401k?.yearsOfService, data.retirement401k?.tenureTiers,
      data.retirement401k?.autoContributionPercent, data.retirement401k?.autoContributionType,
      data.retirement401k?.ageBracketUnder30, data.retirement401k?.ageBracket30to39,
      data.retirement401k?.ageBracket40to49, data.retirement401k?.ageBracket50Plus]);

  const { data: calcResult, isLoading: calcLoading, error: calcError } = useCalculate401k(calc401kPayload);

  if (calcResult) console.log("[401k Calculate] Response ←", calcResult);
  if (calcError) console.log("[401k Calculate] Error ←", calcError);

  return (
    <div className="space-y-3">
      {/* ── 401(k) Pre-Tax + Employer Match ── */}
      {(() => {
        const matchType: MatchStructureType = matchTypeStr;
        const salary = salary401k;
        const empPct = empPct401k;
        const t1Rate = t1Rate401k;
        const t1Cap = t1Cap401k;

        const matchTypeOptions: { value: MatchStructureType; label: string; short: string }[] = [
          { value: "simple", label: "My employer matches a % of what I contribute", short: "Simple Match" },
          { value: "tiered", label: "My employer matches in stages (tiered)", short: "Tiered Match" },
          { value: "dollar_capped", label: "My employer match has a maximum dollar cap", short: "Dollar-Capped" },
          { value: "tenure", label: "My match % increases with my years of service", short: "Tenure-Based" },
          { value: "auto_plus_match", label: "My employer contributes automatically + also matches", short: "Auto + Match" },
        ];

        const handleMatchTypeChange = (v: string) => {
          const next = v as MatchStructureType;
          update({
            retirement401k: {
              ...data.retirement401k,
              has401k: true,
              matchStructureType: next,
              tier2MatchRatePercent: undefined,
              tier2CapPercent: undefined,
              tier3MatchRatePercent: undefined,
              tier3CapPercent: undefined,
              maxEmployerMatchDollars: undefined,
              yearsOfService: undefined,
              tenureTiers: undefined,
              autoContributionPercent: undefined,
              autoContributionType: undefined,
              ageBracketUnder30: undefined,
              ageBracket30to39: undefined,
              ageBracket40to49: undefined,
              ageBracket50Plus: undefined,
            },
          });
        };

        const PercentField = ({ label, helper, value, onChange, max = 100, step = 0.5, placeholder }: {
          label: string; helper?: string; value?: number; onChange: (v: number | undefined) => void; max?: number; step?: number; placeholder?: string;
        }) => (
          <div className="space-y-1">
            <Label className="text-xs">{label}</Label>
            {helper && <p className="text-[10px] text-muted-foreground">{helper}</p>}
            <div className="relative">
              <Input className="h-8 pr-7 text-sm" type="number" min={0} max={max} step={step} placeholder={placeholder ?? "0"}
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)} />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
          </div>
        );

        const r = calcResult;
        const catchUpInfo = r?.catchUpJustification;

        return (
        <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm", "border-l-indigo-400")}>
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">401(k) Plan & Employer Match</p>
              <p className="text-xs text-muted-foreground">Traditional pre-tax 401(k) with employer matching</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="shrink-0 rounded-lg border bg-indigo-50/70 px-3 py-1.5 text-right dark:bg-indigo-950/20">
                <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-500">{taxYear} Max Contribution</p>
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Individual: {formatLimit(k401Base)}</p>
                <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70">Age 50+: {formatLimit(k401Age50)} · Age 60-63: {formatLimit(k401Age60)}</p>
                <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70">Total w/ employer: {formatLimit(k401Total)} (§415c)</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => toggleRetirementSection("k401")}
              >
                {expandedRetirementSections.k401 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {expandedRetirementSections.k401 && (
          <>
          {/* ── Match Structure Selector ── */}
          <div className="mb-3 rounded-lg border bg-slate-50/60 p-3 dark:bg-slate-900/30">
            <div className="flex items-center gap-2 mb-1.5">
              <Label className="text-xs font-semibold">Employer Match Structure</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30">
                    <Info className="h-3 w-3" /> Help me choose
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[480px] max-h-[70vh] overflow-y-auto text-xs space-y-4 p-4" side="right" align="start">
                  <div>
                    <p className="font-bold text-sm mb-1">401(k) Employer Match Structures</p>
                    <p className="text-muted-foreground text-[11px]">Select the type that matches your employer&apos;s plan. Not sure? Answer the questions below or review the examples.</p>
                  </div>

                  {/* Quick Decision Guide */}
                  <div className="rounded-md border bg-blue-50/50 p-2.5 dark:bg-blue-950/20 dark:border-blue-800">
                    <p className="font-semibold text-[11px] text-blue-700 dark:text-blue-300 mb-1.5">Quick Decision Guide</p>
                    <div className="space-y-1">
                      <p><span className="font-medium">Q1:</span> Does your employer contribute even if you don&apos;t? → <button type="button" className="text-blue-600 underline font-medium" onClick={() => handleMatchTypeChange("auto_plus_match")}>Auto + Match (Type 5)</button></p>
                      <p><span className="font-medium">Q2:</span> Does your match % go up with tenure? → <button type="button" className="text-blue-600 underline font-medium" onClick={() => handleMatchTypeChange("tenure")}>Tenure-Based (Type 4)</button></p>
                      <p><span className="font-medium">Q3:</span> Is there a hard dollar cap on the match? → <button type="button" className="text-blue-600 underline font-medium" onClick={() => handleMatchTypeChange("dollar_capped")}>Dollar-Capped (Type 3)</button></p>
                      <p><span className="font-medium">Q4:</span> Does your employer match in stages? → <button type="button" className="text-blue-600 underline font-medium" onClick={() => handleMatchTypeChange("tiered")}>Tiered Match (Type 2)</button></p>
                      <p><span className="font-medium">Q5:</span> None of the above → <button type="button" className="text-blue-600 underline font-medium" onClick={() => handleMatchTypeChange("simple")}>Simple Match (Type 1)</button></p>
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Type 1 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">Type 1</span>
                      <p className="font-semibold text-[11px]">Simple Match <span className="font-normal text-muted-foreground">(Most Common)</span></p>
                    </div>
                    <p className="text-muted-foreground italic">&quot;50% match on first 6% of salary&quot;</p>
                    <p className="text-muted-foreground">Examples: Amazon, Oracle, UPS, Microsoft</p>
                    <div className="rounded border bg-muted/30 p-2 mt-1">
                      <p className="font-medium mb-1">Fields:</p>
                      <table className="w-full text-[10px]">
                        <tbody>
                          <tr><td className="py-0.5 pr-2 font-medium">Employer Match Rate %</td><td className="text-muted-foreground">e.g. 50%, 100%, 75%</td></tr>
                          <tr><td className="py-0.5 pr-2 font-medium">Match Cap % of Salary</td><td className="text-muted-foreground">e.g. 6% — the ceiling on which match applies</td></tr>
                        </tbody>
                      </table>
                      <p className="mt-1.5 font-medium text-[10px]">Formula:</p>
                      <p className="font-mono text-[10px] bg-background/80 rounded px-1.5 py-1 mt-0.5">Match = Salary × MIN(EmpContrib%, MatchCap%) × MatchRate%</p>
                    </div>
                    <button type="button" className="mt-1 text-[10px] font-medium text-blue-600 hover:underline" onClick={() => handleMatchTypeChange("simple")}>→ Select Simple Match</button>
                  </div>

                  <hr className="border-border" />

                  {/* Type 2 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">Type 2</span>
                      <p className="font-semibold text-[11px]">Tiered Match <span className="font-normal text-muted-foreground">(Multi-stage)</span></p>
                    </div>
                    <p className="text-muted-foreground italic">&quot;100% on first 3%, then 50% on next 2%&quot;</p>
                    <p className="text-muted-foreground">Examples: Kroger, Capital One, Fidelity</p>
                    <div className="rounded border bg-muted/30 p-2 mt-1">
                      <p className="font-medium mb-1">Additional Fields:</p>
                      <table className="w-full text-[10px]">
                        <tbody>
                          <tr><td className="py-0.5 pr-2 font-medium">Tier 1 Match Rate %</td><td className="text-muted-foreground">e.g. 100% on first 3%</td></tr>
                          <tr><td className="py-0.5 pr-2 font-medium">Tier 1 Cap %</td><td className="text-muted-foreground">e.g. first 3% of salary</td></tr>
                          <tr><td className="py-0.5 pr-2 font-medium">Tier 2 Match Rate %</td><td className="text-muted-foreground">e.g. 50% on next 2%</td></tr>
                          <tr><td className="py-0.5 pr-2 font-medium">Tier 2 Cap %</td><td className="text-muted-foreground">e.g. next 2% of salary</td></tr>
                          <tr><td className="py-0.5 pr-2 font-medium">Tier 3 (optional)</td><td className="text-muted-foreground">e.g. 25% on next 1%</td></tr>
                        </tbody>
                      </table>
                      <p className="mt-1.5 font-medium text-[10px]">Example — Kroger ($80k salary, 6% contrib):</p>
                      <p className="font-mono text-[10px] bg-background/80 rounded px-1.5 py-1 mt-0.5">Tier 1: $80k × 3% × 100% = $2,400<br/>Tier 2: $80k × 2% × 50% = $800<br/>Total match = $3,200/yr</p>
                    </div>
                    <button type="button" className="mt-1 text-[10px] font-medium text-blue-600 hover:underline" onClick={() => handleMatchTypeChange("tiered")}>→ Select Tiered Match</button>
                  </div>

                  <hr className="border-border" />

                  {/* Type 3 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Type 3</span>
                      <p className="font-semibold text-[11px]">Dollar-Capped Match</p>
                    </div>
                    <p className="text-muted-foreground italic">&quot;50% match up to max $500/year&quot; or &quot;100% match up to $7,500/year&quot;</p>
                    <p className="text-muted-foreground">Examples: Costco, Dell, Home Depot</p>
                    <div className="rounded border bg-muted/30 p-2 mt-1">
                      <p className="font-medium mb-1">Additional Field:</p>
                      <table className="w-full text-[10px]">
                        <tbody>
                          <tr><td className="py-0.5 pr-2 font-medium">Max Employer Match ($/year)</td><td className="text-muted-foreground">Hard dollar cap per year regardless of formula result</td></tr>
                        </tbody>
                      </table>
                      <p className="mt-1.5 font-medium text-[10px]">Example — Costco ($60k salary, 6% contrib):</p>
                      <p className="font-mono text-[10px] bg-background/80 rounded px-1.5 py-1 mt-0.5">Formula: $60k × 6% × 50% = $1,800<br/>Dollar cap: $500<br/>Actual match = $500/yr (capped)</p>
                    </div>
                    <button type="button" className="mt-1 text-[10px] font-medium text-blue-600 hover:underline" onClick={() => handleMatchTypeChange("dollar_capped")}>→ Select Dollar-Capped</button>
                  </div>

                  <hr className="border-border" />

                  {/* Type 4 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">Type 4</span>
                      <p className="font-semibold text-[11px]">Tenure-Based Match</p>
                    </div>
                    <p className="text-muted-foreground italic">&quot;Match rate increases with years of service&quot;</p>
                    <p className="text-muted-foreground">Examples: Apple, EY, Deloitte</p>
                    <div className="rounded border bg-muted/30 p-2 mt-1">
                      <p className="font-medium mb-1">Additional Field:</p>
                      <table className="w-full text-[10px]">
                        <tbody>
                          <tr><td className="py-0.5 pr-2 font-medium">Years of Service</td><td className="text-muted-foreground">Determines which match rate tier applies</td></tr>
                        </tbody>
                      </table>
                      <p className="mt-1.5 font-medium text-[10px]">Example — Apple ($120k salary, 6% contrib, 3 yrs):</p>
                      <table className="w-full text-[10px] mt-0.5 font-mono bg-background/80 rounded">
                        <tbody>
                          <tr className="border-b border-border/50"><td className="px-1.5 py-0.5">0–2 yrs</td><td>50% match</td></tr>
                          <tr className="border-b border-border/50"><td className="px-1.5 py-0.5">2–5 yrs</td><td>75% match ← <span className="text-green-600 font-bold">you</span></td></tr>
                          <tr><td className="px-1.5 py-0.5">5+ yrs</td><td>100% match</td></tr>
                        </tbody>
                      </table>
                      <p className="font-mono text-[10px] mt-1">Match = $120k × 6% × 75% = $5,400/yr</p>
                    </div>
                    <button type="button" className="mt-1 text-[10px] font-medium text-blue-600 hover:underline" onClick={() => handleMatchTypeChange("tenure")}>→ Select Tenure-Based</button>
                  </div>

                  <hr className="border-border" />

                  {/* Type 5 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">Type 5</span>
                      <p className="font-semibold text-[11px]">Auto + Match</p>
                    </div>
                    <p className="text-muted-foreground italic">&quot;Employer contributes automatically + also matches your contributions&quot;</p>
                    <p className="text-muted-foreground">Examples: Capital One (3% auto + match), Boeing, JP Morgan</p>
                    <div className="rounded border bg-muted/30 p-2 mt-1">
                      <p className="font-medium mb-1">Additional Fields:</p>
                      <table className="w-full text-[10px]">
                        <tbody>
                          <tr><td className="py-0.5 pr-2 font-medium">Auto Contribution %</td><td className="text-muted-foreground">% employer gives regardless of your contribution</td></tr>
                          <tr><td className="py-0.5 pr-2 font-medium">Auto Type</td><td className="text-muted-foreground">Flat %, Age-Based, or Performance Bonus</td></tr>
                        </tbody>
                      </table>
                      <p className="mt-1.5 font-medium text-[10px]">Example — Capital One ($100k salary, 6% contrib):</p>
                      <p className="font-mono text-[10px] bg-background/80 rounded px-1.5 py-1 mt-0.5">Auto: $100k × 3% = $3,000 (free!)<br/>Match: $100k × 6% × 50% = $3,000<br/>Total employer = $6,000/yr</p>
                    </div>
                    <button type="button" className="mt-1 text-[10px] font-medium text-blue-600 hover:underline" onClick={() => handleMatchTypeChange("auto_plus_match")}>→ Select Auto + Match</button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Select value={matchType} onValueChange={handleMatchTypeChange}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {matchTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="font-medium">{opt.short}</span>
                    <span className="ml-1.5 text-muted-foreground text-xs">— {opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* ── Left: 401(k) Pre-Tax ── */}
            <div className="space-y-2 rounded-lg bg-muted/30 p-3">
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                401(k) Pre-Tax <TaxBadge type="pre-tax" />
              </p>
              <CurrencyField label="Balance" value={data.retirement401k?.currentBalance}
                onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, currentBalance: v } })} />
              <PercentField label="Employee Contribution (%)" helper="% of gross salary you contribute pre-tax each pay period" max={80} placeholder="e.g. 10"
                value={data.retirement401k?.employeeContributionPercent}
                onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, employeeContributionPercent: v } })} />
            </div>

            {/* ── Right: Employer Match (conditional) ── */}
            <div className="space-y-2 rounded-lg bg-violet-50/50 p-3 dark:bg-violet-950/10 border border-violet-200 dark:border-violet-800">
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                Employer Match <TaxBadge type="employer" />
              </p>
              <div className="space-y-2">

                {/* Tier 1 — all types */}
                <PercentField label="Tier 1 Match Rate %" helper="How much employer matches — e.g. 50% (50¢/dollar) or 100% (dollar-for-dollar)" max={200} step={5} placeholder="e.g. 100"
                  value={data.retirement401k?.employerMatchPercent}
                  onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, employerMatchPercent: v } })} />
                <PercentField label="Tier 1 Match Cap %" helper="Max % of salary employer matches — e.g. 6% means match applies only on first 6%" max={20} placeholder="e.g. 6"
                  value={data.retirement401k?.employerMatchCapPercent}
                  onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, employerMatchCapPercent: v } })} />

                {/* ── Type 2: Tiered ── */}
                {matchType === "tiered" && (
                  <div className="space-y-2 mt-1 border-t border-violet-200 pt-2 dark:border-violet-700">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Tier 2</p>
                    <PercentField label="Tier 2 Match Rate %" placeholder="e.g. 50" max={200} step={5}
                      value={data.retirement401k?.tier2MatchRatePercent}
                      onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, tier2MatchRatePercent: v } })} />
                    <PercentField label="Tier 2 Cap % of Salary" helper="Additional % of salary eligible for Tier 2 match" max={20} placeholder="e.g. 2"
                      value={data.retirement401k?.tier2CapPercent}
                      onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, tier2CapPercent: v } })} />

                    {(data.retirement401k?.tier3MatchRatePercent !== undefined || data.retirement401k?.tier3CapPercent !== undefined) ? (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500 mt-1">Tier 3</p>
                        <PercentField label="Tier 3 Match Rate %" placeholder="e.g. 25" max={200} step={5}
                          value={data.retirement401k?.tier3MatchRatePercent}
                          onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, tier3MatchRatePercent: v } })} />
                        <PercentField label="Tier 3 Cap % of Salary" max={20} placeholder="e.g. 2"
                          value={data.retirement401k?.tier3CapPercent}
                          onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, tier3CapPercent: v } })} />
                      </>
                    ) : (
                      <button type="button" className="text-[11px] font-medium text-violet-600 hover:underline dark:text-violet-400"
                        onClick={() => update({ retirement401k: { ...data.retirement401k, has401k: true, tier3MatchRatePercent: 0, tier3CapPercent: 0 } })}>
                        + Add Tier 3
                      </button>
                    )}
                  </div>
                )}

                {/* ── Type 3: Dollar-Capped ── */}
                {matchType === "dollar_capped" && (
                  <div className="space-y-2 mt-1 border-t border-violet-200 pt-2 dark:border-violet-700">
                    <div className="space-y-1">
                      <Label className="text-xs">Maximum Employer Match ($/year)</Label>
                      <p className="text-[10px] text-muted-foreground">The maximum dollar amount your employer will contribute annually</p>
                      <CurrencyField label="" value={data.retirement401k?.maxEmployerMatchDollars}
                        onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, maxEmployerMatchDollars: v } })} />
                    </div>
                  </div>
                )}

                {/* ── Type 4: Tenure-Based ── */}
                {matchType === "tenure" && (
                  <div className="space-y-2 mt-1 border-t border-violet-200 pt-2 dark:border-violet-700">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Tenure-Based Match</p>
                    <div className="space-y-1">
                      <Label className="text-xs">Years of Service</Label>
                      <Input className="h-8 text-sm" type="number" min={0} max={50} step={1} placeholder="e.g. 5"
                        value={data.retirement401k?.yearsOfService ?? ""}
                        onChange={(e) => update({ retirement401k: { ...data.retirement401k, has401k: true, yearsOfService: e.target.value ? Number(e.target.value) : undefined } })} />
                    </div>
                    {[0, 1, 2].map((idx) => {
                      const tiers = data.retirement401k?.tenureTiers ?? [];
                      const tier = tiers[idx];
                      const setTier = (field: keyof TenureTier, val: number | undefined) => {
                        const copy = [...(data.retirement401k?.tenureTiers ?? [{}, {}, {}])];
                        while (copy.length <= idx) copy.push({});
                        copy[idx] = { ...copy[idx], [field]: val };
                        update({ retirement401k: { ...data.retirement401k, has401k: true, tenureTiers: copy } });
                      };
                      return (
                        <div key={idx} className="grid grid-cols-2 gap-2">
                          <PercentField label={`Tenure Tier ${idx + 1}: Match Rate %`} max={200} step={5} placeholder="e.g. 50"
                            value={tier?.matchRatePercent}
                            onChange={(v) => setTier("matchRatePercent", v)} />
                          <div className="space-y-1">
                            <Label className="text-xs">Up to X Years</Label>
                            <Input className="h-8 text-sm" type="number" min={0} max={50} step={1} placeholder={idx === 0 ? "e.g. 2" : idx === 1 ? "e.g. 5" : "e.g. 99"}
                              value={tier?.upToYears ?? ""}
                              onChange={(e) => setTier("upToYears", e.target.value ? Number(e.target.value) : undefined)} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Type 5: Auto + Match ── */}
                {matchType === "auto_plus_match" && (
                  <div className="space-y-2 mt-1 border-t border-violet-200 pt-2 dark:border-violet-700">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Automatic Employer Contribution</p>
                    <PercentField label="Auto Employer Contribution %" helper="% your employer contributes regardless of your contribution" max={20} placeholder="e.g. 3"
                      value={data.retirement401k?.autoContributionPercent}
                      onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, autoContributionPercent: v } })} />
                    <div className="space-y-1">
                      <Label className="text-xs">Auto Contribution Type</Label>
                      <Select value={data.retirement401k?.autoContributionType ?? "flat"}
                        onValueChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, autoContributionType: v as "flat" | "age_based" | "performance_bonus" } })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">Flat %</SelectItem>
                          <SelectItem value="age_based">Age-Based</SelectItem>
                          <SelectItem value="performance_bonus">Performance Bonus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {data.retirement401k?.autoContributionType === "age_based" && (
                      <div className="grid grid-cols-2 gap-2 rounded-md border bg-violet-50/40 p-2 dark:bg-violet-950/20">
                        <PercentField label="Under 30" placeholder="e.g. 3" max={20}
                          value={data.retirement401k?.ageBracketUnder30}
                          onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, ageBracketUnder30: v } })} />
                        <PercentField label="30–39" placeholder="e.g. 4" max={20}
                          value={data.retirement401k?.ageBracket30to39}
                          onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, ageBracket30to39: v } })} />
                        <PercentField label="40–49" placeholder="e.g. 5" max={20}
                          value={data.retirement401k?.ageBracket40to49}
                          onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, ageBracket40to49: v } })} />
                        <PercentField label="50+" placeholder="e.g. 6" max={20}
                          value={data.retirement401k?.ageBracket50Plus}
                          onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, ageBracket50Plus: v } })} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 401(k) Annual Summary Card ── */}
          {!calc401kReady.ready && (salary > 0 || empPct > 0) && (
            <div className="mt-3 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/30 p-3 dark:border-indigo-700 dark:bg-indigo-950/10">
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">Complete these fields to see the 401(k) summary:</p>
              <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-0.5">
                {calc401kReady.missing.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
          {calcLoading && calc401kReady.ready && (
            <div className="mt-3 flex items-center justify-center rounded-lg border-2 border-indigo-200 bg-indigo-50/50 p-6 dark:border-indigo-800 dark:bg-indigo-950/20">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
              <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">Calculating...</span>
            </div>
          )}
          {calcError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300">
              Calculation unavailable — displaying without backend computation.
            </div>
          )}
          {r && !calcLoading && (
            <div className="mt-3 rounded-lg border-2 border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-800 dark:bg-indigo-950/20">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">401(k) Annual Summary</p>
              <div className="grid gap-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Annual Contribution</span>
                  <span className="font-semibold">${r.empAnnual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="pl-3">Per Paycheck</span>
                  <span>${r.empPerPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employer Annual Match</span>
                  <span className="font-semibold">${r.employerMatchAnnual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="pl-3">Per Paycheck</span>
                  <span>${r.employerMatchPerPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {matchType === "auto_plus_match" && r.autoContribAnnual > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Auto Contribution</span>
                      <span className="font-semibold">${r.autoContribAnnual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="pl-3">Per Paycheck</span>
                      <span>${r.autoContribPerPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t pt-1.5 mt-1">
                  <span className="font-semibold">Total Annual 401(k)</span>
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">${r.totalAnnual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="pl-3">Per Paycheck</span>
                  <span>${r.totalPerPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Effective Employer Match %</span>
                  <span className="font-semibold">{r.effectiveMatchPct.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IRS Limit Status</span>
                  <span className="font-semibold">
                    {!r.irsLimitStatus.isNearLimit && !r.irsLimitStatus.isOverLimit && <span className="text-green-600">✅ Within limits (${r.irsLimitStatus.limit.toLocaleString()})</span>}
                    {r.irsLimitStatus.isNearLimit && !r.irsLimitStatus.isOverLimit && <span className="text-amber-600">⚠️ Approaching limit (${r.irsLimitStatus.limit.toLocaleString()})</span>}
                    {r.irsLimitStatus.isOverLimit && <span className="text-red-600">🚨 Over limit (${r.irsLimitStatus.limit.toLocaleString()})</span>}
                  </span>
                </div>
                {r.unclaimedMatch > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unclaimed Match / Year</span>
                    <span className="font-semibold text-amber-600">${r.unclaimedMatch.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Smart Alerts (from API) ── */}
          {r && r.alerts && r.alerts.length > 0 && !calcLoading && (
            <div className="mt-2 space-y-1.5">
              {r.alerts.map((alert, idx) => {
                const styles: Record<string, { border: string; bg: string; text: string; icon: string }> = {
                  success: { border: "border-green-300 dark:border-green-700", bg: "bg-green-50 dark:bg-green-950/20", text: "text-green-800 dark:text-green-300", icon: "🎯" },
                  warning: { border: "border-amber-300 dark:border-amber-700", bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-800 dark:text-amber-300", icon: "⚠️" },
                  danger:  { border: "border-red-300 dark:border-red-700", bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-800 dark:text-red-300", icon: "🚨" },
                  info:    { border: "border-blue-300 dark:border-blue-700", bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-800 dark:text-blue-300", icon: "🎂" },
                };
                const s = styles[alert.type] ?? styles.info;
                const isCatchUpAlert = alert.code === "CATCH_UP_ELIGIBLE" && Boolean(catchUpInfo?.eligible);
                return (
                  <div key={idx} className={cn("flex items-start gap-2 rounded-md border px-3 py-2 text-xs", s.border, s.bg)}>
                    <span className="mt-0.5">{s.icon}</span>
                    <div className="flex w-full items-start justify-between gap-3">
                      <p className={s.text}>{alert.message}</p>
                      {isCatchUpAlert && (
                        <button
                          type="button"
                          className="shrink-0 text-[11px] font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
                          onClick={() => setShowCatchUpJustification(true)}
                        >
                          How this was calculated
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Dialog open={showCatchUpJustification} onOpenChange={setShowCatchUpJustification}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Catch-Up Contribution Justification</DialogTitle>
                <DialogDescription>
                  Why this appears and how the number is derived from IRS age-based limits.
                </DialogDescription>
              </DialogHeader>
              {catchUpInfo && (
                <div className="space-y-3 text-sm">
                  <div className="rounded-md border bg-blue-50/60 p-3 text-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
                    <p className="font-semibold">What is catch-up contribution?</p>
                    <p className="mt-1 text-xs leading-relaxed">
                      IRS rules allow age 50+ savers to contribute extra into retirement plans. This is a benefit,
                      not a penalty, and it does not mean earlier planning was wrong.
                    </p>
                  </div>

                  <div className="rounded-md border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Your Calculation</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
                      <div className="flex justify-between"><span>Tax Year</span><span className="font-semibold">{catchUpInfo.taxYear ?? "Current year"}</span></div>
                      <div className="flex justify-between"><span>Client Age</span><span className="font-semibold">{catchUpInfo.age}</span></div>
                      <div className="flex justify-between"><span>Under-50 Limit</span><span className="font-semibold">${catchUpInfo.under50Limit.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Age 50+ Total Limit</span><span className="font-semibold">${catchUpInfo.age50PlusTotalLimit.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Age 60-63 Total Limit</span><span className="font-semibold">${catchUpInfo.age60To63TotalLimit.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Catch-Up Extra Applied</span><span className="font-semibold">${catchUpInfo.catchUpExtra.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Current Employee Contribution</span><span className="font-semibold">${catchUpInfo.currentEmployeeContribution.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Remaining Room</span><span className="font-semibold">${catchUpInfo.remainingRoom.toLocaleString()}</span></div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{catchUpInfo.triggerReason}</p>
                  </div>

                  <div className="rounded-md border bg-amber-50/50 p-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                    <p className="font-semibold">Why this matters</p>
                    <p className="mt-1">
                      If this room is used consistently, retirement savings can compound significantly over time. The advisor can
                      position this as a late-career opportunity window to strengthen retirement readiness.
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter showCloseButton />
            </DialogContent>
          </Dialog>
          </>
          )}
        </div>
        );
      })()}

      {/* ── Roth 401(k) + After-Tax 401(k) ── */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm", "border-l-emerald-400")}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Roth 401(k) & After-Tax 401(k)</p>
            <p className="text-xs text-muted-foreground">Post-tax and after-tax 401(k) contribution buckets</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="shrink-0 rounded-lg border bg-emerald-50/70 px-3 py-1.5 text-right dark:bg-emerald-950/20">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">{taxYear} Limits</p>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Roth 401(k): shares {formatLimit(roth401kBase ?? k401Base)} w/ Pre-Tax</p>
              <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">After-Tax: up to {formatLimit(afterTax401kTotal ?? k401Total)} total (§415c)</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => toggleRetirementSection("rothAfterTax")}
            >
              {expandedRetirementSections.rothAfterTax ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {expandedRetirementSections.rothAfterTax && (
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
        )}
      </div>

      {/* ── IRA Section — Traditional, Roth, Backdoor Roth ── */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm", "border-l-indigo-400")}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Individual Retirement Accounts (IRA)</p>
            <p className="text-xs text-muted-foreground">Traditional, Roth, and Backdoor Roth IRAs</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="shrink-0 rounded-lg border bg-indigo-50/70 px-3 py-1.5 text-right dark:bg-indigo-950/20">
              <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-500">{taxYear} Max Contribution</p>
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Individual: {formatLimit(iraBase)}</p>
              <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70">Age 50+: {formatLimit(iraAge50)} (combined Trad + Roth)</p>
              <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70">Backdoor Roth: no income limit</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => toggleRetirementSection("ira")}
            >
              {expandedRetirementSections.ira ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {expandedRetirementSections.ira && (
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
        )}
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
          <div className="flex items-start gap-2">
            <div className="shrink-0 rounded-lg border bg-teal-50/70 px-3 py-1.5 text-right dark:bg-teal-950/20">
              <p className="text-[9px] font-bold uppercase tracking-wider text-teal-500">{taxYear} Max Contribution</p>
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">Individual: {formatLimit(hsaIndiv)}</p>
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">Family: {formatLimit(hsaFamily)}</p>
              <p className="text-[10px] text-teal-600/70 dark:text-teal-400/70">Age 55+: {formatLimit(hsaAge55)} (w/ catch-up)</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => toggleRetirementSection("hsa")}
            >
              {expandedRetirementSections.hsa ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {expandedRetirementSections.hsa && (
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
        )}
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30"
              onClick={addPrev401k}
            >
              <Plus className="h-3.5 w-3.5" /> Add Previous 401(k)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => toggleRetirementSection("previous401k")}
            >
              {expandedRetirementSections.previous401k ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {expandedRetirementSections.previous401k && (
        prev401ks.length === 0 ? (
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
        )
        )}
      </div>

      {/* ── Pension & 403(b)/457(b) ── */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm", "border-l-indigo-400")}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Pension / Defined Benefit</p>
            <p className="text-xs text-muted-foreground">Employer-sponsored guaranteed income</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => toggleRetirementSection("pension")}
          >
            {expandedRetirementSections.pension ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {expandedRetirementSections.pension && (
          <div className="mt-3">
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
          </div>
        )}
      </div>
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm", "border-l-indigo-400")}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">403(b) / 457(b)</p>
            <p className="text-xs text-muted-foreground">Non-profit & government retirement plan</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => toggleRetirementSection("plan403457")}
          >
            {expandedRetirementSections.plan403457 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {expandedRetirementSections.plan403457 && (
          <div className="mt-3">
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
        )}
      </div>
    </div>
  );
}

function MarketSnapshotCard({ snapshot }: { snapshot: MarketSnapshot }) {
  const isUp = snapshot.changePercent >= 0;
  const arrow = isUp ? "▲" : "▼";
  const sentimentColor =
    snapshot.sentiment === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : snapshot.sentiment === "negative"
        ? "text-red-600 dark:text-red-400"
        : "text-gray-500";
  const sentimentBg =
    snapshot.sentiment === "positive"
      ? "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
      : snapshot.sentiment === "negative"
        ? "bg-red-50/70 border-red-200 dark:bg-red-950/20 dark:border-red-800"
        : "bg-gray-50/70 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700";

  const trendArrow =
    snapshot.trend.direction === "up" ? "▲" : snapshot.trend.direction === "down" ? "▼" : "▬";
  const trendSign = snapshot.trend.changePercent > 0 ? "+" : "";

  const statusDot =
    snapshot.marketStatus === "open"
      ? "bg-emerald-500"
      : snapshot.marketStatus === "closed"
        ? "bg-gray-400"
        : "bg-yellow-500";
  const statusLabel =
    snapshot.marketStatus === "open"
      ? "Open"
      : snapshot.marketStatus === "closed"
        ? "Closed"
        : snapshot.marketStatus === "pre_market"
          ? "Pre-Market"
          : "After Hours";

  let formattedTime = "";
  try {
    formattedTime = new Date(snapshot.lastUpdated).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
  } catch {
    formattedTime = "—";
  }

  return (
    <div className={cn("rounded-lg border px-4 py-3 shadow-sm", sentimentBg)}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          📊 Market Snapshot
        </span>
        <span className="text-xs font-medium text-muted-foreground">{snapshot.name}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold">
          {snapshot.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={cn("text-xs font-semibold", sentimentColor)}>
          {arrow} {isUp ? "+" : ""}{snapshot.changePercent.toFixed(2)}% today
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>
          {snapshot.trend.days}-day trend: <span className={sentimentColor}>{trendArrow} {trendSign}{snapshot.trend.changePercent.toFixed(2)}%</span>
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span className={sentimentColor}>{snapshot.sentimentLabel}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/70">
        <span>Last updated: {formattedTime} ET</span>
        <span className="flex items-center gap-1">
          <span className={cn("inline-block h-1.5 w-1.5 rounded-full", statusDot)} />
          {statusLabel}
        </span>
      </div>
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
  const [expandedInvestmentsSections, setExpandedInvestmentsSections] = useState({
    investmentAccounts: false,
    otherSavings: false,
    cashAndSavings: false,
    socialSecurity: false,
  });
  const toggleInvestmentsSection = useCallback(
    (key: keyof typeof expandedInvestmentsSections) => {
      setExpandedInvestmentsSections((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Investment Accounts — compact 2-col grid */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm border-l-emerald-500")}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Investment Accounts</p>
            <p className="text-xs text-muted-foreground">Brokerage, bonds, annuities, equity compensation & crypto</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => toggleInvestmentsSection("investmentAccounts")}
          >
            {expandedInvestmentsSections.investmentAccounts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {expandedInvestmentsSections.investmentAccounts && (
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
        )}
      </div>

      {/* Other Savings */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm border-l-slate-500")}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Other Savings</p>
            <p className="text-xs text-muted-foreground">Precious metals, jewelry, and other tangible savings assets</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => toggleInvestmentsSection("otherSavings")}
          >
            {expandedInvestmentsSections.otherSavings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {expandedInvestmentsSections.otherSavings && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CurrencyField
              label="Precious Metals (Gold/Silver)"
              value={data.otherSavings?.preciousMetalsValue}
              onChange={(v) =>
                update({
                  otherSavings: {
                    ...data.otherSavings,
                    hasOtherSavings: true,
                    preciousMetalsValue: v,
                  },
                })
              }
            />
            <CurrencyField
              label="Jewelry"
              value={data.otherSavings?.jewelryValue}
              onChange={(v) =>
                update({
                  otherSavings: {
                    ...data.otherSavings,
                    hasOtherSavings: true,
                    jewelryValue: v,
                  },
                })
              }
            />
            <CurrencyField
              label="Other Assets"
              value={data.otherSavings?.otherAssetsValue}
              onChange={(v) =>
                update({
                  otherSavings: {
                    ...data.otherSavings,
                    hasOtherSavings: true,
                    otherAssetsValue: v,
                  },
                })
              }
            />
          </div>
        )}
      </div>

      {/* Cash & Savings — compact 2-col grid */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm border-l-amber-400")}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Cash & Savings</p>
            <p className="text-xs text-muted-foreground">Checking, savings, HSA, CDs, and emergency fund</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => toggleInvestmentsSection("cashAndSavings")}
          >
            {expandedInvestmentsSections.cashAndSavings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {expandedInvestmentsSections.cashAndSavings && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CurrencyField label="Checking" value={data.cashOnHand?.checkingBalance}
            onChange={(v) => update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, checkingBalance: v } })} />
          <CurrencyField label="Savings" value={data.cashOnHand?.savingsBalance}
            onChange={(v) => update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, savingsBalance: v } })} />
          <CurrencyField label="Emergency Fund Value" value={data.cashOnHand?.emergencyFundBalance}
            onChange={(v) => update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, emergencyFundBalance: v } })} />
          <CurrencyField label="HSA" value={data.hsa?.currentBalance}
            onChange={(v) => update({ hsa: { ...data.hsa, hasHSA: true, currentBalance: v } })} />
          <CurrencyField label="CDs" value={data.cd?.totalValue}
            onChange={(v) => update({ cd: { ...data.cd, hasCDs: true, totalValue: v } })} />
          <div className="space-y-1">
            <Label className="text-xs">Emergency Fund Target (months)</Label>
            <Input
              type="number"
              min={0}
              className="h-8 text-sm"
              placeholder="e.g. 6"
              value={data.cashOnHand?.emergencyFundMonths ?? ""}
              onChange={(e) =>
                update({
                  cashOnHand: {
                    ...data.cashOnHand,
                    hasCashOnHand: true,
                    emergencyFundMonths:
                      e.target.value === "" ? undefined : Number(e.target.value),
                  },
                })
              }
            />
          </div>
        </div>
        )}
      </div>

      {/* Social Security — single inline row */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm border-l-violet-400")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Social Security Estimate</p>
            <p className="text-xs text-muted-foreground">Projected monthly benefit at full retirement age</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 self-start"
            onClick={() => toggleInvestmentsSection("socialSecurity")}
          >
            {expandedInvestmentsSections.socialSecurity ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {expandedInvestmentsSections.socialSecurity && (
          <div className="w-40">
            <CurrencyField label="Monthly at FRA" value={data.socialSecurity?.estimatedMonthlyBenefitFRA}
              onChange={(v) => update({ socialSecurity: { ...data.socialSecurity, hasEstimate: true, estimatedMonthlyBenefitFRA: v } })} />
          </div>
        )}
      </div>
    </div>
  );
}

function makeCollegeChildId() {
  return `edu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function CollegeSavingsSection({
  data,
  update,
  dependentSeed,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
  dependentSeed: Array<{ name: string; age: number }>;
}) {
  const collegeSavings = data.collegeSavings ?? { children: [] };
  const children = collegeSavings.children ?? [];

  const setCollegeSavings = (patch: Partial<NonNullable<PersonFinancialBackground["collegeSavings"]>>) => {
    update({
      collegeSavings: {
        ...collegeSavings,
        ...patch,
      },
    });
  };

  const addChildPlan = () => {
    const next = [
      ...children,
      {
        id: makeCollegeChildId(),
        childName: "",
        childAge: 0,
        has529Plan: false,
        hasOtherEducationSavings: false,
        hasPrepaidTuition: false,
      },
    ];
    setCollegeSavings({ children: next });
  };

  const updateChildPlan = (index: number, patch: Record<string, unknown>) => {
    const next = children.map((child, idx) => (idx === index ? { ...child, ...patch } : child));
    setCollegeSavings({ children: next });
  };

  const removeChildPlan = (index: number) => {
    const next = children.filter((_, idx) => idx !== index);
    setCollegeSavings({ children: next });
  };

  useEffect(() => {
    if (dependentSeed.length === 0 || children.length > 0) return;
    const seeded = dependentSeed.map((dep) => ({
      id: makeCollegeChildId(),
      childName: dep.name,
      childAge: dep.age,
      has529Plan: false,
      hasOtherEducationSavings: false,
      hasPrepaidTuition: false,
    }));
    setCollegeSavings({ children: seeded });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependentSeed]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-l-4 border-l-indigo-500 bg-card px-5 py-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">College & Education Savings</p>
            <p className="text-xs text-muted-foreground">
              Savings earmarked for your children&apos;s education
            </p>
          </div>
          <Button type="button" size="sm" className="h-7 gap-1.5 px-2" onClick={addChildPlan}>
            <Plus className="h-3.5 w-3.5" />
            Add Education Account
          </Button>
        </div>

        {children.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-xs text-muted-foreground">
            No child plans yet. Add an education account to track 529, other education savings,
            and prepaid tuition.
          </div>
        ) : (
          <div className="space-y-4">
            {children.map((child, idx) => (
              <div key={child.id ?? `child-plan-${idx}`} className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    {child.childName?.trim() ? child.childName : `Child ${idx + 1}`}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeChildPlan(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Child&apos;s name</Label>
                    <Input
                      className="h-8 text-sm"
                      placeholder="Enter child name"
                      value={child.childName ?? ""}
                      onChange={(e) => updateChildPlan(idx, { childName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Child&apos;s current age</Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      className="h-8 text-sm"
                      placeholder="0"
                      value={child.childAge ?? ""}
                      onChange={(e) =>
                        updateChildPlan(idx, {
                          childAge: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Age determines years until college and cost projection.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-md border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold">529 Plan</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Button
                        type="button"
                        variant={child.has529Plan ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => updateChildPlan(idx, { has529Plan: true })}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={!child.has529Plan ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2"
                        onClick={() =>
                          updateChildPlan(idx, {
                            has529Plan: false,
                            balance529: 0,
                            monthlyContribution529: 0,
                            annualContribution529: 0,
                          })
                        }
                      >
                        No
                      </Button>
                    </div>
                  </div>
                  {child.has529Plan && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <CurrencyField
                        label="529 current balance"
                        value={child.balance529}
                        onChange={(v) => updateChildPlan(idx, { balance529: v })}
                      />
                      <CurrencyField
                        label="Monthly contribution"
                        value={child.monthlyContribution529}
                        onChange={(v) =>
                          updateChildPlan(idx, {
                            monthlyContribution529: v,
                            annualContribution529: (v ?? 0) * 12,
                          })
                        }
                      />
                      <CurrencyField
                        label="Annual contribution"
                        value={child.annualContribution529}
                        onChange={(v) => updateChildPlan(idx, { annualContribution529: v })}
                      />
                      <div className="space-y-1">
                        <Label className="text-xs">Account owner</Label>
                        <Select
                          value={child.accountOwner529 ?? ""}
                          onValueChange={(v) => updateChildPlan(idx, { accountOwner529: v })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select owner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="grandparent">Grandparent</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">State plan (optional)</Label>
                        <Input
                          className="h-8 text-sm"
                          placeholder="e.g. GA"
                          value={child.statePlan529 ?? ""}
                          onChange={(e) => updateChildPlan(idx, { statePlan529: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Investment allocation</Label>
                        <Select
                          value={child.investmentAllocation529 ?? ""}
                          onValueChange={(v) => updateChildPlan(idx, { investmentAllocation529: v })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select allocation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conservative">Conservative</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="aggressive">Aggressive</SelectItem>
                            <SelectItem value="age_based">Age-Based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 rounded-md border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold">Other Education Savings</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Button
                        type="button"
                        variant={child.hasOtherEducationSavings ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => updateChildPlan(idx, { hasOtherEducationSavings: true })}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={!child.hasOtherEducationSavings ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2"
                        onClick={() =>
                          updateChildPlan(idx, {
                            hasOtherEducationSavings: false,
                            otherCurrentBalance: 0,
                            otherMonthlyContribution: 0,
                          })
                        }
                      >
                        No
                      </Button>
                    </div>
                  </div>
                  {child.hasOtherEducationSavings && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Account type</Label>
                        <Select
                          value={child.otherAccountType ?? ""}
                          onValueChange={(v) => updateChildPlan(idx, { otherAccountType: v })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="utma_ugma">UTMA/UGMA Custodial</SelectItem>
                            <SelectItem value="coverdell_esa">Coverdell ESA</SelectItem>
                            <SelectItem value="savings_bonds">Savings Bonds</SelectItem>
                            <SelectItem value="regular_savings">Regular Savings</SelectItem>
                            <SelectItem value="cash_value_life_insurance">Cash Value Life</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <CurrencyField
                        label="Current balance"
                        value={child.otherCurrentBalance}
                        onChange={(v) => updateChildPlan(idx, { otherCurrentBalance: v })}
                      />
                      <CurrencyField
                        label="Monthly contribution"
                        value={child.otherMonthlyContribution}
                        onChange={(v) => updateChildPlan(idx, { otherMonthlyContribution: v })}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-3 rounded-md border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold">Prepaid Tuition Plan</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Button
                        type="button"
                        variant={child.hasPrepaidTuition ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => updateChildPlan(idx, { hasPrepaidTuition: true })}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={!child.hasPrepaidTuition ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2"
                        onClick={() =>
                          updateChildPlan(idx, {
                            hasPrepaidTuition: false,
                            prepaidEstimatedValueAtEnrollment: 0,
                          })
                        }
                      >
                        No
                      </Button>
                    </div>
                  </div>
                  {child.hasPrepaidTuition && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Plan type</Label>
                        <Select
                          value={child.prepaidPlanType ?? ""}
                          onValueChange={(v) => updateChildPlan(idx, { prepaidPlanType: v })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select plan type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="state_prepaid">State prepaid plan</SelectItem>
                            <SelectItem value="private_college_prepaid">Private college prepaid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <CurrencyField
                        label="Estimated value at enrollment"
                        value={child.prepaidEstimatedValueAtEnrollment}
                        onChange={(v) => updateChildPlan(idx, { prepaidEstimatedValueAtEnrollment: v })}
                      />
                      <div className="space-y-1">
                        <Label className="text-xs">Credits/semesters purchased</Label>
                        <Input
                          type="number"
                          min={0}
                          className="h-8 text-sm"
                          placeholder="0"
                          value={child.prepaidCreditsPurchased ?? ""}
                          onChange={(e) =>
                            updateChildPlan(idx, {
                              prepaidCreditsPurchased:
                                e.target.value === "" ? undefined : Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function makeRentalPropertyId() {
  return `rental_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function makeInternationalPropertyId() {
  return `intl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function RealEstateSection({
  caseId,
  data,
  update,
}: {
  caseId: string;
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  const realEstate = data.realEstate ?? {
    hasRealEstate: false,
    hasPrimaryResidence: false,
    hasRentalProperties: false,
    hasInternationalProperties: false,
  };
  const primary = realEstate.primaryResidence ?? { propertyType: "primary_residence" as const, hasMortgage: false };
  const rentals = realEstate.rentalProperties ?? [];
  const internationals = realEstate.internationalProperties ?? [];
  const hasPrimaryResidence = Boolean(
    realEstate.hasPrimaryResidence ??
      primary.estimatedMarketValue ??
      primary.propertyAddress ??
      primary.mortgageBalance
  );
  const hasRentalProperties = Boolean(realEstate.hasRentalProperties ?? rentals.length > 0);
  const hasInternationalProperties = Boolean(
    realEstate.hasInternationalProperties ?? internationals.length > 0
  );
  const [expanded, setExpanded] = useState({
    primary: true,
    rentals: true,
    international: true,
  });

  useEffect(() => {
    const hydratePrimaryAddress = async () => {
      if (!hasPrimaryResidence) return;
      if (primary.propertyAddress) return;
      try {
        const { data: res } = await apiClient.get<{ data?: Record<string, unknown> } & Record<string, unknown>>(
          `/cases/${caseId}/discovery/`
        );
        const payload = (res?.data ?? res) as Record<string, unknown>;
        const pi =
          ((payload["personal_info"] as Record<string, unknown> | undefined) ??
            (payload["personalInfo"] as Record<string, unknown> | undefined) ??
            {}) as Record<string, unknown>;
        const addr = (pi["address"] as Record<string, unknown> | undefined) ?? {};
        const line = [
          addr["street"],
          addr["city"],
          addr["province"] || addr["state"],
          addr["postal_code"] || addr["postalCode"],
        ]
          .filter(Boolean)
          .join(", ");
        if (!line) return;
        update({
          realEstate: {
            ...realEstate,
            hasRealEstate: true,
            primaryResidence: {
              ...primary,
              propertyType: "primary_residence",
              propertyAddress: line,
            },
          },
        });
      } catch {
        // Best-effort UX fill only.
      }
    };
    void hydratePrimaryAddress();
  }, [caseId, primary, realEstate, update]);

  const setRealEstate = (patch: Partial<PersonFinancialBackground["realEstate"]>) => {
    const merged: PersonFinancialBackground["realEstate"] = {
      ...realEstate,
      ...patch,
    };
    const mergedPrimary = merged.primaryResidence ?? {};
    const mergedHasPrimaryResidence = Boolean(
      merged.hasPrimaryResidence ??
        mergedPrimary.estimatedMarketValue ??
        mergedPrimary.propertyAddress ??
        mergedPrimary.mortgageBalance ??
        mergedPrimary.monthlyPaymentPiti
    );
    const hasAnyProperty = Boolean(
      mergedHasPrimaryResidence ||
        merged.hasRentalProperties ||
        merged.hasInternationalProperties
    );
    const nextMonthlyExpenses = { ...(data.monthlyExpenses ?? {}) };
    const nextHousing = mergedHasPrimaryResidence
      ? mergedPrimary.monthlyPaymentPiti ?? undefined
      : undefined;
    if (nextHousing === undefined) {
      delete nextMonthlyExpenses.housing;
    } else {
      nextMonthlyExpenses.housing = nextHousing;
    }
    update({
      realEstate: {
        ...merged,
        hasPrimaryResidence: mergedHasPrimaryResidence,
        hasRealEstate: hasAnyProperty,
      },
      monthlyExpenses: nextMonthlyExpenses,
    });
  };

  const setPrimary = (patch: Partial<NonNullable<PersonFinancialBackground["realEstate"]>["primaryResidence"]>) =>
    setRealEstate({ primaryResidence: { ...primary, ...patch } });

  const updateRental = (idx: number, patch: Record<string, unknown>) => {
    const next = rentals.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setRealEstate({ rentalProperties: next });
  };
  const removeRental = (idx: number) => setRealEstate({ rentalProperties: rentals.filter((_, i) => i !== idx) });
  const addRental = () =>
    setRealEstate({
      hasRentalProperties: true,
      rentalProperties: [
        ...rentals,
        { id: makeRentalPropertyId(), currentVacancyStatus: "occupied", hasMortgage: true },
      ],
    });

  const updateInternational = (idx: number, patch: Record<string, unknown>) => {
    const next = internationals.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setRealEstate({ internationalProperties: next });
  };
  const removeInternational = (idx: number) =>
    setRealEstate({ internationalProperties: internationals.filter((_, i) => i !== idx) });
  const addInternational = () =>
    setRealEstate({
      hasInternationalProperties: true,
      internationalProperties: [
        ...internationals,
        { id: makeInternationalPropertyId(), isIncomeProducing: false, hasMortgage: false },
      ],
    });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-l-4 border-l-sky-500 bg-card px-5 py-4 shadow-sm">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold">Primary Residence</p>
            <p className="text-xs text-muted-foreground">Property and mortgage details for housing-risk analysis</p>
          </div>
          <Button type="button" variant="outline" size="sm" className="h-7 px-2" onClick={() => setExpanded((p) => ({ ...p, primary: !p.primary }))}>
            {expanded.primary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mb-3 flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
          <p className="text-xs font-medium">Does the client own a primary property?</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={hasPrimaryResidence ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setRealEstate({ hasPrimaryResidence: true })}
            >
              Yes
            </Button>
            <Button
              type="button"
              size="sm"
              variant={hasPrimaryResidence ? "outline" : "default"}
              className="h-7 text-xs"
              onClick={() =>
                setRealEstate({
                  hasPrimaryResidence: false,
                  primaryResidence: { propertyType: "primary_residence", hasMortgage: false },
                })
              }
            >
              No
            </Button>
          </div>
        </div>
        {hasPrimaryResidence && expanded.primary && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Property Type</Label>
                <Input className="h-8 text-sm" value="Primary Residence" readOnly />
              </div>
              <CurrencyField label="Estimated market value" value={primary.estimatedMarketValue} onChange={(v) => setPrimary({ estimatedMarketValue: v })} />
              <div className="space-y-1">
                <Label className="text-xs">Year purchased</Label>
                <Input className="h-8 text-sm" type="number" placeholder="e.g. 2018" value={primary.yearPurchased ?? ""} onChange={(e) => setPrimary({ yearPurchased: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Property address</Label>
                <Input className="h-8 text-sm" value={primary.propertyAddress ?? ""} onChange={(e) => setPrimary({ propertyAddress: e.target.value })} />
              </div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">Mortgage details</p>
                <div className="flex gap-2">
                  <Button type="button" variant={primary.hasMortgage ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setPrimary({ hasMortgage: true })}>Has Mortgage</Button>
                  <Button type="button" variant={primary.hasMortgage ? "outline" : "default"} size="sm" className="h-7 text-xs" onClick={() => setPrimary({ hasMortgage: false })}>No Mortgage</Button>
                </div>
              </div>
              {primary.hasMortgage && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <CurrencyField label="Mortgage balance" value={primary.mortgageBalance} onChange={(v) => setPrimary({ mortgageBalance: v })} />
                  <CurrencyField label="Original loan amount" value={primary.originalLoanAmount} onChange={(v) => setPrimary({ originalLoanAmount: v })} />
                  <PercentInputField label="Interest rate (%)" value={primary.interestRate} onChange={(v) => setPrimary({ interestRate: v })} />
                  <div className="space-y-1">
                    <Label className="text-xs">Loan type</Label>
                    <Select value={primary.loanType ?? "fixed"} onValueChange={(v) => setPrimary({ loanType: v as "fixed" | "arm" | "interest_only" })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="arm">Adjustable (ARM)</SelectItem>
                        <SelectItem value="interest_only">Interest-Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {primary.loanType === "arm" && (
                    <>
                      <PercentInputField label="ARM current rate (%)" value={primary.armCurrentRate} onChange={(v) => setPrimary({ armCurrentRate: v })} />
                      <div className="space-y-1">
                        <Label className="text-xs">Adjustment period (months)</Label>
                        <Input className="h-8 text-sm" type="number" value={primary.armAdjustmentPeriodMonths ?? ""} onChange={(e) => setPrimary({ armAdjustmentPeriodMonths: e.target.value ? Number(e.target.value) : undefined })} />
                      </div>
                      <PercentInputField label="Rate cap (%)" value={primary.armRateCap} onChange={(v) => setPrimary({ armRateCap: v })} />
                    </>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Loan term (years)</Label>
                    <Select value={primary.loanTermYears ? String(primary.loanTermYears) : "30"} onValueChange={(v) => setPrimary({ loanTermYears: Number(v) })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15-year</SelectItem>
                        <SelectItem value="20">20-year</SelectItem>
                        <SelectItem value="30">30-year</SelectItem>
                        <SelectItem value="40">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <CurrencyField label="Monthly payment (PITI)" value={primary.monthlyPaymentPiti} onChange={(v) => setPrimary({ monthlyPaymentPiti: v })} />
                  <CurrencyField label="Principal & Interest (monthly)" value={primary.principalAndInterestMonthly} onChange={(v) => setPrimary({ principalAndInterestMonthly: v })} />
                  <CurrencyField label="Property taxes (monthly)" value={primary.propertyTaxesMonthly} onChange={(v) => setPrimary({ propertyTaxesMonthly: v })} />
                  <CurrencyField label="Homeowner's insurance (monthly)" value={primary.homeownersInsuranceMonthly} onChange={(v) => setPrimary({ homeownersInsuranceMonthly: v })} />
                  <CurrencyField label="HOA fees (monthly)" value={primary.hoaFeesMonthly} onChange={(v) => setPrimary({ hoaFeesMonthly: v })} />
                  <CurrencyField label="PMI (monthly)" value={primary.pmiMonthly} onChange={(v) => setPrimary({ pmiMonthly: v })} />
                  <div className="space-y-1">
                    <Label className="text-xs">Remaining term (years)</Label>
                    <Input className="h-8 text-sm" type="number" value={primary.remainingTermYears ?? ""} onChange={(e) => setPrimary({ remainingTermYears: e.target.value ? Number(e.target.value) : undefined })} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-l-4 border-l-sky-500 bg-card px-5 py-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Investment Properties</p>
            <p className="text-xs text-muted-foreground">Capture each rental property with true net-income inputs</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5" onClick={addRental} disabled={!hasRentalProperties}>
              <Plus className="h-3.5 w-3.5" /> Add Rental
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 px-2" onClick={() => setExpanded((p) => ({ ...p, rentals: !p.rentals }))}>
              {expanded.rentals ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="mb-3 flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
          <p className="text-xs font-medium">Does the client have investment / rental properties?</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={hasRentalProperties ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setRealEstate({ hasRentalProperties: true })}
            >
              Yes
            </Button>
            <Button
              type="button"
              size="sm"
              variant={hasRentalProperties ? "outline" : "default"}
              className="h-7 text-xs"
              onClick={() => setRealEstate({ hasRentalProperties: false, rentalProperties: [] })}
            >
              No
            </Button>
          </div>
        </div>
        {hasRentalProperties && expanded.rentals && (
          <div className="space-y-3">
            {rentals.length === 0 && <p className="text-xs text-muted-foreground">No rental properties added yet.</p>}
            {rentals.map((r, idx) => (
              <div key={r.id} className="rounded-lg border bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold">{r.propertyLabel || `Rental Property ${idx + 1}`}</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRental(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Input className="h-8 text-sm" placeholder="Property label" value={r.propertyLabel ?? ""} onChange={(e) => updateRental(idx, { propertyLabel: e.target.value })} />
                  <CurrencyField label="Estimated market value" value={r.estimatedMarketValue} onChange={(v) => updateRental(idx, { estimatedMarketValue: v })} />
                  <div className="space-y-1">
                    <Label className="text-xs">Property type</Label>
                    <Select value={r.propertyType ?? "single_family"} onValueChange={(v) => updateRental(idx, { propertyType: v })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_family">Single-family rental</SelectItem>
                        <SelectItem value="multi_family">Multi-family</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input className="h-8 text-sm" placeholder="Year purchased" type="number" value={r.yearPurchased ?? ""} onChange={(e) => updateRental(idx, { yearPurchased: e.target.value ? Number(e.target.value) : undefined })} />
                  <Input className="h-8 text-sm" placeholder="City" value={r.locationCity ?? ""} onChange={(e) => updateRental(idx, { locationCity: e.target.value })} />
                  <Input className="h-8 text-sm" placeholder="State" value={r.locationState ?? ""} onChange={(e) => updateRental(idx, { locationState: e.target.value })} />
                  <CurrencyField label="Mortgage balance" value={r.mortgageBalance} onChange={(v) => updateRental(idx, { mortgageBalance: v })} />
                  <PercentInputField label="Interest rate (%)" value={r.interestRate} onChange={(v) => updateRental(idx, { interestRate: v })} />
                  <CurrencyField label="Monthly mortgage payment" value={r.monthlyMortgagePayment} onChange={(v) => updateRental(idx, { monthlyMortgagePayment: v })} />
                  <CurrencyField label="Gross monthly rent" value={r.monthlyRentalIncomeGross} onChange={(v) => updateRental(idx, { monthlyRentalIncomeGross: v })} />
                  <CurrencyField label="Property management fee (monthly)" value={r.monthlyPropertyManagementFee} onChange={(v) => updateRental(idx, { monthlyPropertyManagementFee: v })} />
                  <CurrencyField label="Property taxes (monthly)" value={r.monthlyPropertyTaxes} onChange={(v) => updateRental(idx, { monthlyPropertyTaxes: v })} />
                  <CurrencyField label="Insurance (monthly)" value={r.monthlyInsurance} onChange={(v) => updateRental(idx, { monthlyInsurance: v })} />
                  <CurrencyField label="HOA fees (monthly)" value={r.monthlyHoaFees} onChange={(v) => updateRental(idx, { monthlyHoaFees: v })} />
                  <CurrencyField label="Maintenance / repairs (monthly)" value={r.monthlyMaintenance} onChange={(v) => updateRental(idx, { monthlyMaintenance: v })} />
                  <PercentInputField label="Average vacancy rate (%)" value={r.averageVacancyRatePct} onChange={(v) => updateRental(idx, { averageVacancyRatePct: v })} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-l-4 border-l-violet-500 bg-card px-5 py-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">International / Overseas Property</p>
            <p className="text-xs text-muted-foreground">Capture foreign assets and rental income for compliance and estate complexity rules</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5" onClick={addInternational} disabled={!hasInternationalProperties}>
              <Plus className="h-3.5 w-3.5" /> Add International Property
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 px-2" onClick={() => setExpanded((p) => ({ ...p, international: !p.international }))}>
              {expanded.international ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="mb-3 flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
          <p className="text-xs font-medium">Does the client have international / overseas property?</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={hasInternationalProperties ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setRealEstate({ hasInternationalProperties: true })}
            >
              Yes
            </Button>
            <Button
              type="button"
              size="sm"
              variant={hasInternationalProperties ? "outline" : "default"}
              className="h-7 text-xs"
              onClick={() =>
                setRealEstate({
                  hasInternationalProperties: false,
                  internationalProperties: [],
                })
              }
            >
              No
            </Button>
          </div>
        </div>
        {hasInternationalProperties && expanded.international && (
          <div className="space-y-3">
            {internationals.length === 0 && <p className="text-xs text-muted-foreground">No international properties added.</p>}
            {internationals.map((p, idx) => (
              <div key={p.id} className="rounded-lg border bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold">{p.propertyLabel || `International Property ${idx + 1}`}</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeInternational(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Input className="h-8 text-sm" placeholder="Property label" value={p.propertyLabel ?? ""} onChange={(e) => updateInternational(idx, { propertyLabel: e.target.value })} />
                  <Input className="h-8 text-sm" placeholder="Country" value={p.country ?? ""} onChange={(e) => updateInternational(idx, { country: e.target.value })} />
                  <CurrencyField label="Estimated market value (USD)" value={p.estimatedMarketValueUsd} onChange={(v) => updateInternational(idx, { estimatedMarketValueUsd: v })} />
                  <div className="space-y-1">
                    <Label className="text-xs">Income producing?</Label>
                    <Select value={p.isIncomeProducing ? "yes" : "no"} onValueChange={(v) => updateInternational(idx, { isIncomeProducing: v === "yes" })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {p.isIncomeProducing && (
                    <CurrencyField label="Estimated monthly rental income (USD)" value={p.estimatedMonthlyRentalIncomeUsd} onChange={(v) => updateInternational(idx, { estimatedMonthlyRentalIncomeUsd: v })} />
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Ownership status</Label>
                    <Select value={p.ownershipStatus ?? "sole_owner"} onValueChange={(v) => updateInternational(idx, { ownershipStatus: v })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sole_owner">Sole owner</SelectItem>
                        <SelectItem value="joint_with_family">Joint with family</SelectItem>
                        <SelectItem value="inherited">Inherited</SelectItem>
                        <SelectItem value="under_construction">Under construction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <CurrencyField label="Mortgage balance" value={p.mortgageBalance} onChange={(v) => updateInternational(idx, { mortgageBalance: v })} />
                  <PercentInputField label="Interest rate (%)" value={p.interestRate} onChange={(v) => updateInternational(idx, { interestRate: v })} />
                  <CurrencyField label="Monthly mortgage payment" value={p.monthlyMortgagePayment} onChange={(v) => updateInternational(idx, { monthlyMortgagePayment: v })} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
  caseId,
  caseData,
  data,
  update,
}: {
  caseId: string;
  caseData?: Case | null;
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  const [expandedMonthlyExpenses, setExpandedMonthlyExpenses] = useState(false);
  const [prefillData, setPrefillData] = useState<Record<string, unknown> | null>(null);
  const [prefillStatus, setPrefillStatus] = useState<"idle" | "loading" | "success" | "error" | "dismissed">("idle");
  const [refreshTick, setRefreshTick] = useState(0);
  const [userEdited, setUserEdited] = useState<Set<string>>(new Set());
  const hasFetched = useRef(false);
  const lastAttemptedPrefillTick = useRef(0);

  const primaryResidence = data.realEstate?.primaryResidence;
  const rentalProperties = data.realEstate?.rentalProperties ?? [];
  const hasPrimaryResidence = Boolean(
    data.realEstate?.hasPrimaryResidence ??
      primaryResidence?.estimatedMarketValue ??
      primaryResidence?.propertyAddress ??
      primaryResidence?.mortgageBalance ??
      primaryResidence?.monthlyPaymentPiti
  );
  const primaryPitiAmount = Number(primaryResidence?.monthlyPaymentPiti ?? 0) || 0;
  const rentalMortgagePitiAmount = rentalProperties.reduce((sum, property) => {
    const mortgageBalance = Number(property?.mortgageBalance ?? 0) || 0;
    const monthlyPayment =
      Number(property?.monthlyMortgagePayment ?? property?.monthlyPayment ?? 0) || 0;
    if (mortgageBalance > 0 && monthlyPayment > 0) {
      return sum + monthlyPayment;
    }
    return sum;
  }, 0);
  const totalMortgagePitiAmount = primaryPitiAmount + rentalMortgagePitiAmount;
  const hasAnyMortgagePiti = totalMortgagePitiAmount > 0;
  const prefillOwnsHome = hasPrimaryResidence || hasAnyMortgagePiti;
  const personalInfo = (caseData?.clientPersonalInfo ?? {}) as Record<string, unknown>;
  const address = ((personalInfo.address as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
  const prefillZip = String(address.postal_code ?? address.postalCode ?? "").trim();
  const hasValidPrefillZip = /^\d{5}$/.test(prefillZip);
  const prefillCity = String(address.city ?? address.city_name ?? "").trim();
  const prefillState = String(address.state ?? address.state_code ?? "").trim();
  const prefillLocationLabel =
    [prefillCity, prefillState].filter(Boolean).join(", ") ||
    prefillCity ||
    prefillState ||
    (hasValidPrefillZip ? prefillZip : "your area");

  const applyPrefill = useCallback(
    (
      payload: Record<string, unknown>,
      ownsHome: boolean,
      currentPiti?: number,
      edited: Set<string> = userEdited
    ) => {
      const estimates = (payload.monthly_estimates ?? {}) as Record<string, Record<string, number>>;
      const housingEst = estimates.housing ?? {};
      const utilEst = estimates.utilities ?? {};
      const foodEst = estimates.food ?? {};
      const transportEst = estimates.transportation ?? {};
      const healthEst = estimates.healthcare ?? {};
      const childEst = estimates.children ?? {};
      const personalEst = estimates.personal ?? {};
      const entertainmentEst = estimates.entertainment ?? {};

      const sum = (...values: Array<number | undefined>) =>
        values.reduce<number>((acc, val) => acc + (val ?? 0), 0);

      const next: Partial<NonNullable<PersonFinancialBackground["monthlyExpenses"]>> = {
        housing:
          ownsHome && (currentPiti ?? 0) > 0
            ? currentPiti
            : ownsHome
              ? housingEst.mortgage_payment
              : (housingEst.rent_3br ?? housingEst.rent_2br ?? housingEst.rent_1br),
        utilities: sum(
          utilEst.electricity,
          utilEst.water_trash,
          utilEst.internet,
          utilEst.natural_gas
        ),
        groceries: foodEst.groceries,
        diningOut: foodEst.dining_out,
        transportation: sum(
          transportEst.car_payment,
          transportEst.gas,
          transportEst.car_insurance,
          transportEst.maintenance,
          transportEst.registration
        ),
        insurance: sum(
          healthEst.insurance_premium,
          ownsHome ? housingEst.homeowners_insurance : housingEst.renters_insurance
        ),
        childcare: sum(
          childEst.afterschool_care,
          childEst.daycare_toddler,
          childEst.daycare_infant,
          childEst.school_supplies,
          childEst.activities_sports
        ),
        entertainment: sum(
          entertainmentEst.family_outings,
          entertainmentEst.streaming_services,
          entertainmentEst.gym_memberships
        ),
        otherExpenses: sum(
          healthEst.out_of_pocket,
          healthEst.prescriptions,
          healthEst.dental_vision,
          personalEst.personal_care,
          personalEst.household_supplies,
          personalEst.clothing_adults,
          personalEst.cell_phones_2adults
        ),
      };

      const filtered = Object.fromEntries(
        Object.entries(next).filter(([key, val]) => !edited.has(key) && (val ?? 0) > 0)
      ) as Partial<NonNullable<PersonFinancialBackground["monthlyExpenses"]>>;
      if (Object.keys(filtered).length === 0) return;
      update({ monthlyExpenses: { ...(data.monthlyExpenses ?? {}), ...filtered } });
    },
    [data.monthlyExpenses, update, userEdited]
  );

  useEffect(() => {
    if (prefillStatus !== "loading") return;
    const timer = setTimeout(() => {
      setPrefillStatus("error");
    }, 10000);
    return () => clearTimeout(timer);
  }, [prefillStatus]);

  useEffect(() => {
    if (refreshTick === 0) return; // Manual trigger only.
    if (!caseId) return;
    if (lastAttemptedPrefillTick.current === refreshTick) return;
    lastAttemptedPrefillTick.current = refreshTick;
    let active = true;

    const run = async () => {
      let requestKey = "";
      try {
        const pi = personalInfo;
        const zip = prefillZip;
        if (!/^\d{5}$/.test(zip)) {
          hasFetched.current = false;
          if (active) setPrefillStatus("idle");
          return;
        }

        requestKey = `${caseId}:${zip}:${prefillOwnsHome ? "own" : "rent"}:${String(totalMortgagePitiAmount)}:${refreshTick}`;
        if (prefillSuccessfulRequestKeys.has(requestKey) || prefillInFlightRequestKeys.has(requestKey)) {
          return;
        }
        prefillInFlightRequestKeys.add(requestKey);

        hasFetched.current = true;
        setPrefillStatus("loading");

        const dependents =
          ((pi.dependents_detail as Array<Record<string, unknown>> | undefined) ??
            (pi.dependentsDetail as Array<Record<string, unknown>> | undefined) ??
            []) as Array<Record<string, unknown>>;
        const childrenAges = Array.isArray(dependents)
          ? dependents
              .map((d) => Number(d.age ?? 0))
              .filter((age) => Number.isFinite(age) && age < 18 && age >= 0)
          : [];
        const adults = String(pi.marital_status ?? pi.maritalStatus ?? "").toLowerCase() === "married" ? 2 : 1;

        const prefillReq = apiClient.post<Record<string, unknown>>("/prefill/cost-of-living", {
          zip_code: zip,
          adults,
          children_ages: childrenAges,
          owns_home: prefillOwnsHome,
          piti_amount: hasAnyMortgagePiti ? totalMortgagePitiAmount : undefined,
        });
        const timeoutReq = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Prefill request timeout")), 20000)
        );
        const prefillRes = await Promise.race([prefillReq, timeoutReq]);
        const payload = (prefillRes.data ?? {}) as Record<string, unknown>;
        if (!active) return;
        if (payload.error) {
          if (process.env.NODE_ENV !== "production") {
            // Keep this visible in dev while preserving user-facing fallback banner.
            console.error("[COL Prefill] API returned error payload", payload);
          }
          setPrefillStatus("error");
          prefillInFlightRequestKeys.delete(requestKey);
          return;
        }

        setPrefillData(payload);
        setPrefillStatus("success");
        applyPrefill(payload, prefillOwnsHome, totalMortgagePitiAmount);
        prefillSuccessfulRequestKeys.add(requestKey);
        prefillInFlightRequestKeys.delete(requestKey);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[COL Prefill] Request failed", err);
        }
        prefillInFlightRequestKeys.delete(requestKey);
        if (active) setPrefillStatus("error");
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [applyPrefill, caseId, personalInfo, prefillOwnsHome, prefillZip, totalMortgagePitiAmount, hasAnyMortgagePiti, refreshTick]);

  const handleFieldChange = (fieldName: keyof NonNullable<PersonFinancialBackground["monthlyExpenses"]>, value: number | undefined) => {
    setUserEdited((prev) => new Set([...prev, String(fieldName)]));
    update({ monthlyExpenses: { ...data.monthlyExpenses, [fieldName]: value } });
  };

  const totalMonthlyExpenses = (() => {
    const e = data.monthlyExpenses ?? {};
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
  })();

  return (
    <div className="space-y-3">
      {prefillStatus === "loading" && (
        <PrefillLoadingBanner cityLabel={prefillLocationLabel} />
      )}
      {prefillStatus === "success" && prefillData && (
        <PrefillSuccessBanner
          prefillData={prefillData}
          ownsHome={prefillOwnsHome}
          pitiAmount={totalMortgagePitiAmount}
          primaryPitiAmount={primaryPitiAmount}
          rentalPitiAmount={rentalMortgagePitiAmount}
          onDismiss={() => setPrefillStatus("dismissed")}
          onRefresh={() => {
            hasFetched.current = false;
            setUserEdited(new Set());
            setPrefillStatus("idle");
            setRefreshTick((v) => v + 1);
          }}
        />
      )}
      {prefillStatus === "error" && (
        <PrefillErrorBanner
          onRetry={() => {
            hasFetched.current = false;
            setPrefillStatus("idle");
            setRefreshTick((v) => v + 1);
          }}
        />
      )}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm", "border-l-orange-400")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Monthly Expenses</p>
            <p className="text-xs text-muted-foreground">Total household monthly spending</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!hasValidPrefillZip || prefillStatus === "loading"}
              onClick={() => {
                if (!hasValidPrefillZip) return;
                setPrefillStatus("idle");
                setRefreshTick((v) => v + 1);
              }}
            >
              {prefillStatus === "loading"
                ? "Fetching averages..."
                : `Prefill Data With National Averages for ${prefillLocationLabel}`}
            </Button>
            <p className="text-sm font-semibold">${totalMonthlyExpenses.toLocaleString()}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => setExpandedMonthlyExpenses((prev) => !prev)}
            >
              {expandedMonthlyExpenses ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {expandedMonthlyExpenses && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {prefillOwnsHome && totalMortgagePitiAmount > 0 && !userEdited.has("housing") && (
              <div className="sm:col-span-3 piti-notice">
                <span>📋</span>
                <span>
                  Monthly housing is pre-filled from all mortgages: Primary home{" "}
                  <strong>${primaryPitiAmount.toLocaleString()}/mo</strong>
                  {" + "}Rental properties{" "}
                  <strong>${rentalMortgagePitiAmount.toLocaleString()}/mo</strong>
                  {" = "} <strong>${totalMortgagePitiAmount.toLocaleString()}/mo total</strong>.
                </span>
              </div>
            )}
            <CurrencyField
              label={hasPrimaryResidence ? "Mortgage Payment (PITI)" : "Housing"}
              value={data.monthlyExpenses?.housing}
              onChange={(v) => handleFieldChange("housing", v)}
              isPrefilled={prefillStatus === "success" || prefillStatus === "dismissed"}
              isUserEdited={userEdited.has("housing")}
            />
            <CurrencyField
              label="Utilities"
              value={data.monthlyExpenses?.utilities}
              onChange={(v) => handleFieldChange("utilities", v)}
              isPrefilled={prefillStatus === "success" || prefillStatus === "dismissed"}
              isUserEdited={userEdited.has("utilities")}
            />
            <CurrencyField
              label="Transportation"
              value={data.monthlyExpenses?.transportation}
              onChange={(v) => handleFieldChange("transportation", v)}
              isPrefilled={prefillStatus === "success" || prefillStatus === "dismissed"}
              isUserEdited={userEdited.has("transportation")}
            />
            <CurrencyField
              label="Groceries"
              value={data.monthlyExpenses?.groceries}
              onChange={(v) => handleFieldChange("groceries", v)}
              isPrefilled={prefillStatus === "success" || prefillStatus === "dismissed"}
              isUserEdited={userEdited.has("groceries")}
            />
            <CurrencyField
              label="Insurance"
              value={data.monthlyExpenses?.insurance}
              onChange={(v) => handleFieldChange("insurance", v)}
              isPrefilled={prefillStatus === "success" || prefillStatus === "dismissed"}
              isUserEdited={userEdited.has("insurance")}
            />
            <CurrencyField
              label="Childcare / Schooling / Education"
              value={data.monthlyExpenses?.childcare}
              onChange={(v) => handleFieldChange("childcare", v)}
              isPrefilled={prefillStatus === "success" || prefillStatus === "dismissed"}
              isUserEdited={userEdited.has("childcare")}
            />
            <CurrencyField
              label="Entertainment"
              value={data.monthlyExpenses?.entertainment}
              onChange={(v) => handleFieldChange("entertainment", v)}
              isPrefilled={prefillStatus === "success" || prefillStatus === "dismissed"}
              isUserEdited={userEdited.has("entertainment")}
            />
            <CurrencyField
              label="Dining out"
              value={data.monthlyExpenses?.diningOut}
              onChange={(v) => handleFieldChange("diningOut", v)}
              isPrefilled={prefillStatus === "success" || prefillStatus === "dismissed"}
              isUserEdited={userEdited.has("diningOut")}
            />
            <CurrencyField
              label="Other"
              value={data.monthlyExpenses?.otherExpenses}
              onChange={(v) => handleFieldChange("otherExpenses", v)}
              isPrefilled={prefillStatus === "success" || prefillStatus === "dismissed"}
              isUserEdited={userEdited.has("otherExpenses")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section title & description ──────────────────────────────

const SECTION_META: Record<SubSection, { title: string; description: string }> = {
  employment: { title: "Employment & Income", description: "Enter salary, bonus, and income sources" },
  retirement: { title: "Retirement Accounts", description: "Enter all retirement accounts" },
  investments: { title: "Investments & Assets", description: "Enter investment accounts, savings, and liquid assets" },
  college: { title: "College & Education Savings", description: "Capture existing education savings before shortfall analysis" },
  realEstate: { title: "Real Estate", description: "Enter primary home and investment property details" },
  debts: { title: "Debts & Liabilities", description: "Enter mortgage, auto loans, student loans, and other debts" },
  expenses: { title: "Monthly Expenses", description: "Enter monthly household spending" },
};

const SECTION_ICONS: Record<SubSection, string> = {
  employment: "💼",
  retirement: "🏦",
  investments: "📈",
  college: "🎓",
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
    collegeSavings: { children: [] },
    realEstate: { hasRealEstate: false },
    crypto: { hasCrypto: false },
    cashOnHand: { hasCashOnHand: false },
    otherSavings: { hasOtherSavings: false },
    socialSecurity: { hasEstimate: false },
    systematicInvestments: { hasSystematicInvestments: false },
    fundsAbroad: { sendsFundsAbroad: false },
    debts: { entries: [] },
    lifeInsurance: {},
    estate: {},
  };
}

function annualIncomeFromBackground(background: unknown): number {
  if (!background || typeof background !== "object") return 0;
  const bg = background as Record<string, unknown>;
  const income = (bg["income"] as Record<string, unknown> | undefined) ?? {};
  const sources = (income["income_sources"] as Array<Record<string, unknown>> | undefined)
    ?? (income["incomeSources"] as Array<Record<string, unknown>> | undefined)
    ?? [];

  const sourcesTotal = Array.isArray(sources)
    ? sources.reduce((sum, src) => {
        if (!src || typeof src !== "object") return sum;
        const annualIncome = Number(src["annual_income"] ?? src["annualIncome"] ?? 0) || 0;
        const annualBonus = Number(src["annual_bonus"] ?? src["annualBonus"] ?? 0) || 0;
        return sum + annualIncome + annualBonus;
      }, 0)
    : 0;
  if (sourcesTotal > 0) {
    return sourcesTotal;
  }

  return (
    Number(income["annual_salary"] ?? income["annualSalary"] ?? 0) +
    Number(income["annual_bonus"] ?? income["annualBonus"] ?? 0) +
    Number(income["other_income"] ?? income["otherIncome"] ?? 0) +
    Number(income["business_income"] ?? income["businessIncome"] ?? 0)
  );
}

export interface FinancialBgLayoutProps {
  clientNames: string;
  caseId: string;
  defaultValues?: PersonFinancialBackground;
  role: "primary" | "spouse";
  healthScore?: FinancialHealthScore | null;
  contributionLimits?: ContributionLimitsData | null;
  marketSnapshot?: MarketSnapshot | null;
  caseData?: Case | null;
  clientAge?: number;
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
  marketSnapshot,
  caseData,
  clientAge,
  onSubmit,
  isSubmitting = false,
  onComplete,
}: FinancialBgLayoutProps) {
  const [data, setData] = useState<PersonFinancialBackground>(() => {
    const initial = defaultValues ?? makeEmptyData(role);
    console.log("[FinancialBgLayout] MOUNT — useState init", {
      role,
      hasDefaultValues: !!defaultValues,
      retirementBalance: initial.retirement401k?.currentBalance,
      has401k: initial.retirement401k?.has401k,
      allTopKeys: Object.keys(initial),
    });
    return initial;
  });
  const [activeSection, setActiveSection] = useState<SubSection>("employment");
  const [showCollegeSection, setShowCollegeSection] = useState(true);
  const [dependentSeed, setDependentSeed] = useState<Array<{ name: string; age: number }>>([]);
  const [householdAnnualIncome, setHouseholdAnnualIncome] = useState<number>(0);
  const initializedFromProps = useRef(!!defaultValues);
  const lastHydratedCaseId = useRef<string | null>(null);

  useEffect(() => {
    const caseChanged = lastHydratedCaseId.current !== caseId;
    if (caseChanged) {
      lastHydratedCaseId.current = caseId;
      initializedFromProps.current = !!defaultValues;
      setData(defaultValues ?? makeEmptyData(role));
      return;
    }
    if (defaultValues && !initializedFromProps.current) {
      initializedFromProps.current = true;
      setData(defaultValues);
    }
  }, [caseId, defaultValues, role]);

  useEffect(() => {
    return () => {
      console.log("[FinancialBgLayout] UNMOUNT", { role });
    };
  }, [role]);

  const update = useCallback((patch: Partial<PersonFinancialBackground>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadCollegeVisibility = async () => {
      try {
        const { data: res } = await apiClient.get<{ data?: Record<string, unknown> } & Record<string, unknown>>(
          `/cases/${caseId}/discovery/`
        );
        const payload = (res?.data ?? res) as Record<string, unknown>;
        const pi =
          ((payload["personal_info"] as Record<string, unknown> | undefined) ??
            (payload["personalInfo"] as Record<string, unknown> | undefined) ??
            {}) as Record<string, unknown>;
        const fp =
          ((payload["financial_profile"] as Record<string, unknown> | undefined) ??
            (payload["financialProfile"] as Record<string, unknown> | undefined) ??
            {}) as Record<string, unknown>;
        const primaryBg =
          (fp["primary_background"] as Record<string, unknown> | undefined) ??
          (fp["primaryBackground"] as Record<string, unknown> | undefined) ??
          {};
        const spouseBg =
          (fp["spouse_background"] as Record<string, unknown> | undefined) ??
          (fp["spouseBackground"] as Record<string, unknown> | undefined) ??
          {};
        const goalsDiscovery =
          ((fp["goals_discovery"] as Record<string, unknown> | undefined) ??
            (fp["goalsDiscovery"] as Record<string, unknown> | undefined) ??
            {}) as Record<string, unknown>;
        const goalsRanking =
          ((goalsDiscovery["goals_ranking"] as Array<Record<string, unknown>> | undefined) ??
            (goalsDiscovery["goalsRanking"] as Array<Record<string, unknown>> | undefined) ??
            []);
        const hasEducationGoal = Array.isArray(goalsRanking)
          ? goalsRanking.some((g) => (g?.goal_id ?? g?.goalId) === "fund_education")
          : false;

        const rawDependents = pi["dependents_detail"] ?? pi["dependentsDetail"] ?? pi["dependents"] ?? [];
        let seedRows: Array<{ name: string; age: number }> = [];
        let dependentCount = 0;
        if (Array.isArray(rawDependents)) {
          seedRows = rawDependents
            .map((d: { name?: string; age?: number }, idx: number) => ({
              name: String(d?.name ?? `Child ${idx + 1}`),
              age: Number(d?.age ?? 0),
            }))
            .filter((d) => d.name.trim().length > 0);
          dependentCount = seedRows.length;
        } else {
          dependentCount = Number(rawDependents ?? 0);
          seedRows = Array.from({ length: Math.max(0, dependentCount) }, (_, idx) => ({
            name: `Child ${idx + 1}`,
            age: 0,
          }));
        }

        if (!mounted) return;
        setHouseholdAnnualIncome(
          annualIncomeFromBackground(primaryBg) + annualIncomeFromBackground(spouseBg)
        );
        setDependentSeed(seedRows);
        setShowCollegeSection(dependentCount > 0 || hasEducationGoal);
      } catch {
        if (!mounted) return;
        setHouseholdAnnualIncome(0);
        setShowCollegeSection(true);
      }
    };
    void loadCollegeVisibility();
    return () => {
      mounted = false;
    };
  }, [caseId]);

  useEffect(() => {
    if (showCollegeSection) return;
    setData((prev) => ({
      ...prev,
      collegeSavings: { children: [] },
      education529: { has529: false },
    }));
    if (activeSection === "college") {
      setActiveSection("investments");
    }
  }, [activeSection, showCollegeSection]);

  const visibleSections = useMemo(
    () => (showCollegeSection ? SUB_SECTIONS : SUB_SECTIONS.filter((s) => s.id !== "college")),
    [showCollegeSection]
  );

  const completedSections = useMemo(
    () => visibleSections.filter((s) => isSectionComplete(s.id, data)).map((s) => s.id),
    [data, visibleSections]
  );

  const progressPercent = Math.round(
    (completedSections.length / Math.max(visibleSections.length, 1)) * 100
  );

  const currentIdx = visibleSections.findIndex((s) => s.id === activeSection);

  const handlePrev = () => {
    if (currentIdx > 0) setActiveSection(visibleSections[currentIdx - 1].id);
  };
  const handleNext = () => {
    if (currentIdx < visibleSections.length - 1) {
      setActiveSection(visibleSections[currentIdx + 1].id);
    } else if (onComplete) {
      onComplete();
    }
  };
  const handleSaveAndNext = async () => {
    try {
      console.log("[FinancialBgLayout] Saving data for", role, {
        retirementBalance: data.retirement401k?.currentBalance,
        has401k: data.retirement401k?.has401k,
        iraBalance: data.ira?.currentBalance,
        hsaBalance: data.hsa?.currentBalance,
      });
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
              {visibleSections.map((section) => {
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
                      { label: "Education/Systematic Investments", value: cats?.education?.score ?? 0, maxScore: cats?.education?.maxScore ?? 20, color: "bg-blue-400" },
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
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
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
              {activeSection === "investments" && marketSnapshot && (
                <div className="shrink-0 w-[280px]">
                  <MarketSnapshotCard snapshot={marketSnapshot} />
                </div>
              )}
            </div>

            {activeSection === "employment" && (
              <EmploymentSection
                data={data}
                update={update}
                householdAnnualIncome={householdAnnualIncome}
              />
            )}
            {activeSection === "retirement" && <RetirementSection data={data} update={update} limits={contributionLimits} clientAge={clientAge} />}
            {activeSection === "investments" && <InvestmentsSection data={data} update={update} />}
            {activeSection === "college" && showCollegeSection && (
              <CollegeSavingsSection data={data} update={update} dependentSeed={dependentSeed} />
            )}
            {activeSection === "realEstate" && <RealEstateSection caseId={caseId} data={data} update={update} />}
            {activeSection === "debts" && <DebtsSection data={data} update={update} />}
            {activeSection === "expenses" && (
              <MonthlyExpensesSection caseId={caseId} caseData={caseData} data={data} update={update} />
            )}

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
                  : currentIdx < visibleSections.length - 1
                    ? "Save & Next Section"
                    : "Save & Continue"}
                <ChevronRight className="size-3.5" />
              </Button>
            </div>

          </div>
        </div>
    </div>
  );
}
