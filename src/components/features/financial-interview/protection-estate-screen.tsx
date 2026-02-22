"use client";

import { useState, useCallback } from "react";
import {
  Shield,
  ScrollText,
  Check,
  ChevronLeft,
  ChevronRight,
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
  const setIns = (patch: Partial<PersonFinancialBackground["lifeInsurance"]>) =>
    update({ lifeInsurance: { ...ins, ...patch } });

  return (
    <div className="space-y-3">
      <YesNoField
        label="Group Life Insurance (Employer)"
        description="Life insurance provided through your employer"
        value={ins.hasGroupLife}
        onChange={(v) => setIns({ hasGroupLife: v })}
      >
        <CurrencyField label="Coverage amount" value={ins.groupLifeAmount}
          onChange={(v) => setIns({ groupLifeAmount: v })} />
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

      <div className="rounded-xl border border-l-4 border-l-blue-400 bg-card px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Total Coverage Amount</p>
            <p className="text-xs text-muted-foreground">Sum of all life insurance coverage</p>
          </div>
          <CurrencyField label="" value={ins.totalCoverageAmount}
            onChange={(v) => setIns({ totalCoverageAmount: v })} />
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
