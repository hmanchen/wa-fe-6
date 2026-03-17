"use client";

import { useState, useCallback } from "react";
import {
  Shield,
  ScrollText,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PersonFinancialBackground } from "@/types/financial-interview";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SubTab = "life-insurance" | "will-trust";

function YesNoField({
  label,
  description,
  value,
  onChange,
  children,
}: {
  label: string;
  description?: string;
  value?: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={cn(
              "rounded-lg border-2 px-4 py-1.5 text-xs font-semibold transition-all",
              value === true
                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
                : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70"
            )}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={cn(
              "rounded-lg border-2 px-4 py-1.5 text-xs font-semibold transition-all",
              value === false
                ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300"
                : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70"
            )}
          >
            No
          </button>
        </div>
      </div>
      {value === true && children && (
        <div className="mt-3 border-t pt-3">{children}</div>
      )}
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

function LifeInsuranceTab({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  const ins = data.lifeInsurance ?? {};
  const computeTotalCoverage = (next: PersonFinancialBackground["lifeInsurance"] | undefined) => {
    if (!next) return undefined;
    const policyCoverageTotal = (next.policies ?? []).reduce(
      (sum, policy) => sum + Number(policy?.coverageAmount ?? 0),
      0
    );
    return (
      Number(next.groupLifeAmount ?? 0) +
      Number(next.termLifeAmount ?? 0) +
      Number(next.permLifeAmount ?? 0) +
      policyCoverageTotal
    );
  };
  const setIns = (patch: Partial<PersonFinancialBackground["lifeInsurance"]>) => {
    const merged = { ...ins, ...patch };
    update({
      lifeInsurance: {
        ...merged,
        totalCoverageAmount: computeTotalCoverage(merged),
      },
    });
  };
  const policies = Array.isArray(ins.policies) ? ins.policies : [];
  const annualIncomeForGroupLife = (() => {
    const income = data.income ?? {};
    const sources = Array.isArray(income.incomeSources) ? income.incomeSources : [];
    let total = 0;
    for (const src of sources) {
      total += Number(src?.annualIncome ?? 0) + Number(src?.annualBonus ?? 0);
    }
    if (total > 0) return total;
    return Number(income.annualSalary ?? 0) + Number(income.businessIncome ?? 0) + Number(income.otherIncome ?? 0);
  })();

  return (
    <div className="space-y-3">
      <YesNoField
        label="Group Life Insurance (Employer)"
        description="Life insurance provided through your employer"
        value={ins.hasGroupLife}
        onChange={(v) => setIns({ hasGroupLife: v })}
      >
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium">Coverage based on salary multiple?</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex text-muted-foreground hover:text-foreground"
                        aria-label="How salary multiple works"
                      >
                        <Info className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm p-2.5 text-[11px] leading-relaxed">
                      Group life is commonly elected as a multiple of annual salary (for example 5x).
                      Coverage amount is auto-calculated as annual salary multiplied by the selected multiple.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIns({ groupLifeBasedOnSalary: true })}
                  className={cn(
                    "rounded-lg border-2 px-3 py-1 text-xs font-semibold transition-all",
                    ins.groupLifeBasedOnSalary === true
                      ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
                      : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIns({ groupLifeBasedOnSalary: false })}
                  className={cn(
                    "rounded-lg border-2 px-3 py-1 text-xs font-semibold transition-all",
                    ins.groupLifeBasedOnSalary === false
                      ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300"
                      : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  No
                </button>
              </div>
            </div>
            {ins.groupLifeBasedOnSalary && (
              <div className="mt-3 space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">Salary multiple</Label>
                  <Select
                    value={ins.groupLifeSalaryMultiple ? String(ins.groupLifeSalaryMultiple) : ""}
                    onValueChange={(value) => {
                      const multiple = Number(value);
                      const computed = annualIncomeForGroupLife > 0 ? annualIncomeForGroupLife * multiple : undefined;
                      setIns({
                        groupLifeSalaryMultiple: multiple,
                        groupLifeAmount: computed,
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select 1x to 10x" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Base salary used for estimate: ${annualIncomeForGroupLife.toLocaleString()} per year.
                </p>
              </div>
            )}
          </div>
          <CurrencyField
            label="Coverage amount"
            value={ins.groupLifeAmount}
            onChange={(v) => setIns({ groupLifeAmount: v })}
          />
          <div className="rounded-md border border-amber-200 bg-amber-50/70 p-2.5 text-[11px] leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
            Group life insurance is employer-sponsored and may create taxable implications in some situations.
            Employer-paid portions can trigger imputed taxable income, and policy payouts follow plan/tax rules.
            Also, group life typically does not include Living Benefits riders for critical, chronic, or terminal illness.
          </div>
        </div>
      </YesNoField>

      <YesNoField
        label="Individual Term Life Insurance"
        description="Personal term life policy"
        value={ins.hasTermLife}
        onChange={(v) => setIns({ hasTermLife: v })}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <CurrencyField label="Coverage amount" value={ins.termLifeAmount}
            onChange={(v) => setIns({ termLifeAmount: v })} />
          <CurrencyField label="Monthly premium" value={ins.termLifePremium}
            onChange={(v) => setIns({ termLifePremium: v })} />
          <div className="space-y-1">
            <Label className="text-xs">Term length (years)</Label>
            <Input type="number" min={0} className="h-8 text-sm" placeholder="e.g. 20"
              value={ins.termLengthYears ?? ""}
              onChange={(e) => setIns({ termLengthYears: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="mt-3 rounded-lg border bg-muted/20 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium">Does this policy include Living Benefits?</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex text-muted-foreground hover:text-foreground"
                      aria-label="What are living benefits"
                    >
                      <Info className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm p-2.5 text-[11px] leading-relaxed">
                    Living Benefits allow access to part of the death benefit while the insured is alive.
                    Common covered events include:
                    Critical Illness (e.g., heart attack, stroke, cancer),
                    Chronic Illness (unable to perform daily living activities long-term),
                    and Terminal Illness (typically limited life expectancy).
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIns({ hasLivingBenefits: true })}
                className={cn(
                  "rounded-lg border-2 px-3 py-1 text-xs font-semibold transition-all",
                  ins.hasLivingBenefits === true
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
                    : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70"
                )}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setIns({ hasLivingBenefits: false })}
                className={cn(
                  "rounded-lg border-2 px-3 py-1 text-xs font-semibold transition-all",
                  ins.hasLivingBenefits === false
                    ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300"
                    : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70"
                )}
              >
                No
              </button>
            </div>
          </div>
        </div>
      </YesNoField>

      <YesNoField
        label="Permanent Life Insurance (Whole / Universal / IUL)"
        description="Cash-value life insurance policies"
        value={ins.hasPermLife}
        onChange={(v) => setIns({ hasPermLife: v })}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Policy type</Label>
            <Select value={ins.permLifeType ?? ""} onValueChange={(v) => setIns({ permLifeType: v as PersonFinancialBackground["lifeInsurance"]["permLifeType"] })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whole-life">Whole Life</SelectItem>
                <SelectItem value="universal">Universal Life</SelectItem>
                <SelectItem value="iul">Indexed Universal Life (IUL)</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CurrencyField label="Coverage amount" value={ins.permLifeAmount}
            onChange={(v) => setIns({ permLifeAmount: v })} />
          <CurrencyField label="Monthly premium" value={ins.permLifePremium}
            onChange={(v) => setIns({ permLifePremium: v })} />
          <CurrencyField label="Cash value" value={ins.permLifeCashValue}
            onChange={(v) => setIns({ permLifeCashValue: v })} />
        </div>
      </YesNoField>

      <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Additional Life Policies</p>
            <p className="text-xs text-muted-foreground">
              Capture each policy separately for accurate totals and downstream analysis.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() =>
              setIns({
                policies: [
                  ...policies,
                  { policyType: "term", coverageAmount: 0, monthlyPremium: 0 },
                ],
              })
            }
          >
            <Plus className="size-3.5" />
            Add Policy
          </Button>
        </div>
        <div className="space-y-3">
          {policies.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No additional policies captured yet.
            </p>
          )}
          {policies.map((policy, idx) => (
            <div key={idx} className="rounded-lg border bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">Policy #{idx + 1}</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-red-600"
                  onClick={() =>
                    setIns({
                      policies: policies.filter((_, i) => i !== idx),
                    })
                  }
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Policy type</Label>
                  <Select
                    value={policy.policyType ?? "term"}
                    onValueChange={(value) =>
                      setIns({
                        policies: policies.map((p, i) =>
                          i === idx
                            ? {
                                ...p,
                                policyType:
                                  value as
                                    | "term"
                                    | "whole-life"
                                    | "universal"
                                    | "iul"
                                    | "group"
                                    | "other",
                              }
                            : p
                        ),
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term">Term</SelectItem>
                      <SelectItem value="whole-life">Whole Life</SelectItem>
                      <SelectItem value="universal">Universal</SelectItem>
                      <SelectItem value="iul">IUL</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CurrencyField
                  label="Coverage"
                  value={policy.coverageAmount}
                  onChange={(value) =>
                    setIns({
                      policies: policies.map((p, i) =>
                        i === idx ? { ...p, coverageAmount: value } : p
                      ),
                    })
                  }
                />
                <CurrencyField
                  label="Monthly premium"
                  value={policy.monthlyPremium}
                  onChange={(value) =>
                    setIns({
                      policies: policies.map((p, i) =>
                        i === idx ? { ...p, monthlyPremium: value } : p
                      ),
                    })
                  }
                />
                <div className="space-y-1">
                  <Label className="text-xs">Provider</Label>
                  <Input
                    className="h-8 text-sm"
                    value={policy.providerName ?? ""}
                    onChange={(e) =>
                      setIns({
                        policies: policies.map((p, i) =>
                          i === idx ? { ...p, providerName: e.target.value } : p
                        ),
                      })
                    }
                    placeholder="Carrier name"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-l-4 border-l-blue-400 bg-card px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Total Coverage Amount</p>
            <p className="text-xs text-muted-foreground">Sum of all life insurance coverage</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">
              ${Number(ins.totalCoverageAmount ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Auto-derived from captured policies
            </p>
          </div>
        </div>
      </div>

      <YesNoField
        label="Disability Insurance"
        description="Income replacement if unable to work due to disability"
        value={ins.hasDisabilityInsurance}
        onChange={(v) => setIns({ hasDisabilityInsurance: v })}
      >
        <CurrencyField label="Monthly benefit" value={ins.disabilityMonthlyBenefit}
          onChange={(v) => setIns({ disabilityMonthlyBenefit: v })} />
      </YesNoField>

      <YesNoField
        label="Long-Term Care Insurance"
        description="Coverage for extended care needs"
        value={ins.hasLongTermCare}
        onChange={(v) => setIns({ hasLongTermCare: v })}
      />

      <YesNoField
        label="Umbrella Policy"
        description="Extra liability coverage beyond standard policies"
        value={ins.hasUmbrellaPolicy}
        onChange={(v) => setIns({ hasUmbrellaPolicy: v })}
      >
        <CurrencyField label="Coverage amount" value={ins.umbrellaCoverageAmount}
          onChange={(v) => setIns({ umbrellaCoverageAmount: v })} />
      </YesNoField>
    </div>
  );
}

function WillTrustTab({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  const est = data.estate ?? {};
  const setEst = (patch: Partial<PersonFinancialBackground["estate"]>) =>
    update({ estate: { ...est, ...patch } });

  return (
    <div className="space-y-3">
      <YesNoField
        label="Will"
        description="A legal document specifying how your assets should be distributed"
        value={est.hasWill}
        onChange={(v) => setEst({ hasWill: v })}
      >
        <div className="space-y-1">
          <Label className="text-xs">Last updated</Label>
          <Input type="date" className="h-8 w-48 text-sm"
            value={est.willLastUpdated ?? ""}
            onChange={(e) => setEst({ willLastUpdated: e.target.value })}
          />
        </div>
      </YesNoField>

      <YesNoField
        label="Trust"
        description="A fiduciary arrangement to manage and distribute assets"
        value={est.hasTrust}
        onChange={(v) => setEst({ hasTrust: v })}
      >
        <div className="space-y-1">
          <Label className="text-xs">Trust type</Label>
          <Select value={est.trustType ?? ""} onValueChange={(v) => setEst({ trustType: v as PersonFinancialBackground["estate"]["trustType"] })}>
            <SelectTrigger className="h-8 w-48 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="revocable">Revocable Living Trust</SelectItem>
              <SelectItem value="irrevocable">Irrevocable Trust</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </YesNoField>

      <YesNoField
        label="Power of Attorney"
        description="Designates someone to make financial decisions on your behalf"
        value={est.hasPowerOfAttorney}
        onChange={(v) => setEst({ hasPowerOfAttorney: v })}
      />

      <YesNoField
        label="Healthcare Directive / Living Will"
        description="Documents your medical treatment preferences"
        value={est.hasHealthcareDirective}
        onChange={(v) => setEst({ hasHealthcareDirective: v })}
      />

      <YesNoField
        label="Beneficiary Designations Current"
        description="Are beneficiary designations on all accounts up to date?"
        value={est.beneficiaryDesignationsCurrent}
        onChange={(v) => setEst({ beneficiaryDesignationsCurrent: v })}
      />

      <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
        <div className="space-y-1">
          <Label className="text-xs">Additional notes</Label>
          <Input className="h-8 text-sm" placeholder="Any additional estate planning notes..."
            value={est.notes ?? ""}
            onChange={(e) => setEst({ notes: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export interface ProtectionEstateScreenProps {
  clientNames: string;
  caseId: string;
  defaultValues?: PersonFinancialBackground;
  role: "primary" | "spouse";
  onSubmit: (data: PersonFinancialBackground) => void | Promise<void>;
  isSubmitting?: boolean;
  onContinue: () => void;
}

export function ProtectionEstateScreen({
  clientNames,
  caseId,
  defaultValues,
  role,
  onSubmit,
  isSubmitting = false,
  onContinue,
}: ProtectionEstateScreenProps) {
  const [data, setData] = useState<PersonFinancialBackground>(
    defaultValues ?? {
      role,
      yearsInCountry: 0,
      countryOfResidence: "US",
      income: {},
      monthlyExpenses: {},
      retirement401k: { has401k: false },
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
      debts: {},
      lifeInsurance: {},
      estate: {},
    }
  );
  const [activeTab, setActiveTab] = useState<SubTab>("life-insurance");

  const update = useCallback((patch: Partial<PersonFinancialBackground>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSave = async () => {
    await onSubmit(data);
  };

  const handleSaveAndContinue = async () => {
    await onSubmit(data);
    onContinue();
  };

  const tabs: { id: SubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "life-insurance", label: "Life Insurance Policies", icon: Shield },
    { id: "will-trust", label: "Will, Trust & Estate", icon: ScrollText },
  ];

  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-wrap items-center gap-3 rounded-t-xl border bg-muted/30 px-4 py-2.5">
        <h2 className="text-base font-bold">Protection & Estate</h2>
        <span className="rounded-full border bg-background px-3 py-0.5 text-xs font-medium">
          {clientNames}
        </span>
      </div>

      <div className="flex min-h-[500px] rounded-b-xl border border-t-0">
        {/* Left sidebar */}
        <div className="hidden w-56 shrink-0 border-r bg-muted/10 p-4 md:block">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Sections
          </p>
          <div className="space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              const isComplete = tab.id === "life-insurance"
                ? (data.lifeInsurance?.hasGroupLife !== undefined || data.lifeInsurance?.hasTermLife !== undefined)
                : (data.estate?.hasWill !== undefined || data.estate?.hasTrust !== undefined);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="mb-5">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <span>{activeTab === "life-insurance" ? "🛡️" : "📜"}</span>
              {activeTab === "life-insurance" ? "Life Insurance Policies" : "Will, Trust & Estate"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {activeTab === "life-insurance"
                ? "Capture all life insurance coverage, disability, and liability protection"
                : "Estate planning documents and beneficiary designations"}
            </p>
          </div>

          {activeTab === "life-insurance" && <LifeInsuranceTab data={data} update={update} />}
          {activeTab === "will-trust" && <WillTrustTab data={data} update={update} />}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                if (activeTab === "will-trust") setActiveTab("life-insurance");
              }}
              disabled={activeTab === "life-insurance"}
            >
              <ChevronLeft className="size-3.5" />
              Previous
            </Button>
            {activeTab === "life-insurance" ? (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={async () => { await handleSave(); setActiveTab("will-trust"); }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save & Next"}
                <ChevronRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleSaveAndContinue}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save & Continue to Analysis"}
                <ChevronRight className="size-3.5" />
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
