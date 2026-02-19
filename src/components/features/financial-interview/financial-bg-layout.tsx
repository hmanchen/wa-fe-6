"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Briefcase,
  Landmark,
  TrendingUp,
  Wallet,
  GraduationCap,
  Globe,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  BarChart3,
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
import { cn } from "@/lib/utils";
import type { PersonFinancialBackground } from "@/types/financial-interview";
import { FinancialBgInsights } from "./financial-bg-insights";

// ── Sub-section definitions ──────────────────────────────────

type SubSection =
  | "employment"
  | "retirement"
  | "investments"
  | "savings"
  | "education"
  | "international";

interface SubSectionDef {
  id: SubSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  fieldCount: number;
}

const SUB_SECTIONS: SubSectionDef[] = [
  { id: "employment", label: "Employment & Income", icon: Briefcase, fieldCount: 5 },
  { id: "retirement", label: "Retirement Accounts", icon: Landmark, fieldCount: 5 },
  { id: "investments", label: "Investments & Assets", icon: TrendingUp, fieldCount: 6 },
  { id: "savings", label: "Savings & Liquidity", icon: Wallet, fieldCount: 4 },
  { id: "education", label: "Education & Future", icon: GraduationCap, fieldCount: 3 },
  { id: "international", label: "International & Other", icon: Globe, fieldCount: 2 },
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
  children,
}: {
  name: string;
  description: string;
  balance?: number;
  onBalanceChange?: (v: number | undefined) => void;
  contribution?: number;
  onContributionChange?: (v: number | undefined) => void;
  contributionLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
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

// ── Health score computation ─────────────────────────────────

interface HealthScore {
  total: number;
  retirement: number | null;
  education: number | null;
  tax: number | null;
  protection: number | null;
  estate: number | null;
}

function computeHealthScore(data: PersonFinancialBackground): HealthScore {
  let retirement = 0;
  if (data.retirement401k?.currentBalance) retirement += 4;
  if (data.retirement401k?.employeeContributionPercent) retirement += 2;
  if (data.retirement401k?.employerMatchPercent) retirement += 2;
  if (data.ira?.currentBalance) retirement += 3;
  if (data.rothIRA?.currentBalance) retirement += 3;
  if (data.pension?.estimatedMonthlyBenefit) retirement += 3;
  if (data.plan403b457b?.currentBalance) retirement += 3;
  retirement = Math.min(retirement, 20);

  let education = 0;
  if (data.education529?.totalBalance) education += 10;
  if (data.education529?.annualContribution) education += 5;
  if (data.socialSecurity?.estimatedMonthlyBenefitFRA) education += 5;
  education = Math.min(education, 20);

  let tax = 0;
  const hasPreTax = !!(data.retirement401k?.currentBalance || data.ira?.currentBalance);
  const hasRoth = !!data.rothIRA?.currentBalance;
  const hasTaxable = !!(data.brokerage?.currentValue || data.cashOnHand?.checkingBalance);
  if (hasPreTax) tax += 6;
  if (hasRoth) tax += 7;
  if (hasTaxable) tax += 4;
  if (hasPreTax && hasRoth && hasTaxable) tax += 3;
  tax = Math.min(tax, 20);

  const hasAllSections =
    (data.income?.annualSalary ?? 0) > 0 &&
    retirement > 0;

  return {
    total: retirement + education + tax,
    retirement: hasAllSections || retirement > 0 ? retirement : null,
    education: education > 0 ? education : null,
    tax: tax > 0 ? tax : null,
    protection: null,
    estate: null,
  };
}

// ── Section completion check ─────────────────────────────────

function isSectionComplete(section: SubSection, data: PersonFinancialBackground): boolean {
  switch (section) {
    case "employment":
      return (data.income?.annualSalary ?? 0) > 0;
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
        data.realEstate?.primaryHomeEquity
      );
    case "savings":
      return !!(
        data.cashOnHand?.checkingBalance ||
        data.cashOnHand?.savingsBalance ||
        data.hsa?.currentBalance ||
        data.cd?.totalValue
      );
    case "education":
      return !!(data.education529?.totalBalance || data.socialSecurity?.estimatedMonthlyBenefitFRA);
    case "international":
      return !!(data.fundsAbroad?.monthlyAmount || data.monthlyExpenses?.housing);
    default:
      return false;
  }
}

// ── Sub-section form content ─────────────────────────────────

function EmploymentSection({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Country of residence</Label>
          <Select value={data.countryOfResidence} onValueChange={(v) => update({ countryOfResidence: v })}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Years in country</Label>
          <Input
            type="number" min={0} className="h-8 text-sm" placeholder="e.g. 10"
            value={data.yearsInCountry || ""}
            onChange={(e) => update({ yearsInCountry: e.target.value === "" ? 0 : parseInt(e.target.value, 10) })}
          />
        </div>
      </div>
      <AccountCard
        name="Annual Salary"
        description="Primary employment income (before taxes)"
        balance={data.income?.annualSalary}
        onBalanceChange={(v) => update({ income: { ...data.income, annualSalary: v } })}
        contribution={data.income?.annualBonus}
        onContributionChange={(v) => update({ income: { ...data.income, annualBonus: v } })}
        contributionLabel="Bonus / Comm."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Pay frequency</Label>
            <Select
              value={data.income?.incomeFrequency ?? ""}
              onValueChange={(v) =>
                update({ income: { ...data.income, incomeFrequency: v as PersonFinancialBackground["income"]["incomeFrequency"] } })
              }
            >
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
          <CurrencyField
            label="Other income (annual)"
            value={data.income?.otherIncome}
            onChange={(v) => update({ income: { ...data.income, otherIncome: v } })}
          />
          <div className="space-y-1">
            <Label className="text-xs">Other income source</Label>
            <Input className="h-8 text-sm" placeholder="e.g. Rental"
              value={data.income?.otherIncomeSource ?? ""}
              onChange={(e) => update({ income: { ...data.income, otherIncomeSource: e.target.value } })}
            />
          </div>
        </div>
      </AccountCard>
      <AccountCard
        name="Monthly Expenses"
        description="Total household monthly spending"
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
          <CurrencyField label="Childcare" value={data.monthlyExpenses?.childcare}
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

function RetirementSection({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  return (
    <div className="space-y-3">
      <AccountCard
        name="401(k)"
        description="Employer-sponsored retirement plan"
        balance={data.retirement401k?.currentBalance}
        onBalanceChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, currentBalance: v } })}
        contribution={(() => {
          const pct = data.retirement401k?.employeeContributionPercent ?? 0;
          const salary = data.income?.annualSalary ?? 0;
          return pct > 0 && salary > 0 ? Math.round((pct / 100) * salary) : undefined;
        })()}
        onContributionChange={(v) => {
          const salary = data.income?.annualSalary ?? 0;
          const pct = salary > 0 && v ? Math.round((v / salary) * 100) : undefined;
          update({ retirement401k: { ...data.retirement401k, has401k: true, employeeContributionPercent: pct } });
        }}
      />
      <AccountCard
        name="Traditional IRA"
        description="Tax-deferred individual retirement account"
        balance={data.ira?.currentBalance}
        onBalanceChange={(v) => update({ ira: { ...data.ira, hasIRA: true, currentBalance: v } })}
        contribution={data.ira?.annualContribution}
        onContributionChange={(v) => update({ ira: { ...data.ira, hasIRA: true, annualContribution: v } })}
      />
      <AccountCard
        name="Roth IRA"
        description="After-tax contributions, tax-free growth"
        balance={data.rothIRA?.currentBalance}
        onBalanceChange={(v) => update({ rothIRA: { ...data.rothIRA, hasRothIRA: true, currentBalance: v } })}
        contribution={data.rothIRA?.annualContribution}
        onContributionChange={(v) => update({ rothIRA: { ...data.rothIRA, hasRothIRA: true, annualContribution: v } })}
      />
      <AccountCard
        name="Pension / Defined Benefit"
        description="Employer-sponsored guaranteed income"
        balance={data.pension?.lumpSumOption}
        onBalanceChange={(v) => update({ pension: { ...data.pension, hasPension: true, lumpSumOption: v } })}
        contribution={data.pension?.estimatedMonthlyBenefit}
        onContributionChange={(v) => update({ pension: { ...data.pension, hasPension: true, estimatedMonthlyBenefit: v } })}
        contributionLabel="Monthly Benefit"
      />
      <AccountCard
        name="403(b) / 457(b)"
        description="Non-profit & government retirement plan"
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
    <div className="space-y-3">
      <AccountCard
        name="Brokerage Account"
        description="Taxable investment account (stocks, ETFs, mutual funds)"
        balance={data.brokerage?.currentValue}
        onBalanceChange={(v) => update({ brokerage: { ...data.brokerage, hasBrokerage: true, currentValue: v } })}
      />
      <AccountCard
        name="Bond Holdings"
        description="Municipal, Treasury, Corporate bonds & bond funds"
        balance={(() => {
          const b = data.bonds;
          return b ? (b.municipalBondValue ?? 0) + (b.treasuryBondValue ?? 0) +
            (b.corporateBondValue ?? 0) + (b.bondFundValue ?? 0) || undefined : undefined;
        })()}
        onBalanceChange={(v) => update({ bonds: { ...data.bonds, hasBonds: true, municipalBondValue: v } })}
      />
      <AccountCard
        name="Annuities"
        description="Insurance-based investment / income products"
        balance={data.annuity?.currentValue}
        onBalanceChange={(v) => update({ annuity: { ...data.annuity, hasAnnuity: true, currentValue: v } })}
      />
      <AccountCard
        name="Stock Options / RSUs / ESPP"
        description="Employer equity compensation"
        balance={(() => {
          const e = data.equityCompensation;
          return e ? (e.vestedOptionsValue ?? 0) + (e.vestedRSUValue ?? 0) || undefined : undefined;
        })()}
        onBalanceChange={(v) => update({ equityCompensation: { ...data.equityCompensation, hasEquityComp: true, vestedRSUValue: v } })}
      />
      <AccountCard
        name="Real Estate"
        description="Primary home equity & investment properties"
        balance={data.realEstate?.primaryHomeEquity}
        onBalanceChange={(v) => update({ realEstate: { ...data.realEstate, hasRealEstate: true, primaryHomeEquity: v } })}
        contribution={data.realEstate?.monthlyRentalIncome}
        onContributionChange={(v) => update({ realEstate: { ...data.realEstate, hasRealEstate: true, monthlyRentalIncome: v } })}
        contributionLabel="Rental Income"
      />
      <AccountCard
        name="Cryptocurrency"
        description="Bitcoin, Ethereum & digital assets"
        balance={data.crypto?.totalValue}
        onBalanceChange={(v) => update({ crypto: { ...data.crypto, hasCrypto: true, totalValue: v } })}
      />
    </div>
  );
}

function SavingsSection({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  return (
    <div className="space-y-3">
      <AccountCard
        name="Cash on Hand"
        description="Checking & savings account balances"
        balance={(data.cashOnHand?.checkingBalance ?? 0) + (data.cashOnHand?.savingsBalance ?? 0) || undefined}
        onBalanceChange={(v) => update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, checkingBalance: v } })}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <CurrencyField label="Checking" value={data.cashOnHand?.checkingBalance}
            onChange={(v) => update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, checkingBalance: v } })} />
          <CurrencyField label="Savings" value={data.cashOnHand?.savingsBalance}
            onChange={(v) => update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, savingsBalance: v } })} />
        </div>
      </AccountCard>
      <AccountCard
        name="Health Savings Account (HSA)"
        description="Triple tax-advantaged medical savings"
        balance={data.hsa?.currentBalance}
        onBalanceChange={(v) => update({ hsa: { ...data.hsa, hasHSA: true, currentBalance: v } })}
        contribution={data.hsa?.annualContribution}
        onContributionChange={(v) => update({ hsa: { ...data.hsa, hasHSA: true, annualContribution: v } })}
      />
      <AccountCard
        name="Certificates of Deposit (CDs)"
        description="Fixed-term, FDIC-insured savings"
        balance={data.cd?.totalValue}
        onBalanceChange={(v) => update({ cd: { ...data.cd, hasCDs: true, totalValue: v } })}
      />
      <AccountCard
        name="Emergency Fund"
        description="Target months of expenses as reserve"
        balance={undefined}
        contribution={undefined}
      >
        <div className="space-y-1">
          <Label className="text-xs">Emergency fund target (months)</Label>
          <Input type="number" min={0} max={24} className="h-8 w-32 text-sm" placeholder="e.g. 6"
            value={data.cashOnHand?.emergencyFundMonths ?? ""}
            onChange={(e) =>
              update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, emergencyFundMonths: e.target.value === "" ? undefined : parseInt(e.target.value, 10) } })
            }
          />
        </div>
      </AccountCard>
    </div>
  );
}

function EducationSection({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  return (
    <div className="space-y-3">
      <AccountCard
        name="529 Education Savings"
        description="Tax-advantaged savings for education expenses"
        balance={data.education529?.totalBalance}
        onBalanceChange={(v) => update({ education529: { ...data.education529, has529: true, totalBalance: v } })}
        contribution={data.education529?.annualContribution}
        onContributionChange={(v) => update({ education529: { ...data.education529, has529: true, annualContribution: v } })}
      />
      <AccountCard
        name="Social Security Estimate"
        description="Projected government retirement benefit"
        contribution={data.socialSecurity?.estimatedMonthlyBenefitFRA}
        onContributionChange={(v) => update({ socialSecurity: { ...data.socialSecurity, hasEstimate: true, estimatedMonthlyBenefitFRA: v } })}
        contributionLabel="Monthly at FRA"
      />
      <AccountCard
        name="Systematic Investments"
        description="SIPs, recurring deposits, or regular investments"
        balance={data.systematicInvestments?.currentValue}
        onBalanceChange={(v) => update({ systematicInvestments: { ...data.systematicInvestments, hasSystematicInvestments: true, currentValue: v } })}
        contribution={data.systematicInvestments?.monthlyAmount}
        onContributionChange={(v) => update({ systematicInvestments: { ...data.systematicInvestments, hasSystematicInvestments: true, monthlyAmount: v } })}
        contributionLabel="Monthly"
      />
    </div>
  );
}

function InternationalSection({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  return (
    <div className="space-y-3">
      <AccountCard
        name="Funds Sent Abroad"
        description="Regular remittances or transfers to another country"
        contribution={data.fundsAbroad?.monthlyAmount}
        onContributionChange={(v) => update({ fundsAbroad: { ...data.fundsAbroad, sendsFundsAbroad: true, monthlyAmount: v } })}
        contributionLabel="Monthly"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Destination country</Label>
            <Input className="h-8 text-sm" placeholder="e.g. India"
              value={data.fundsAbroad?.country ?? ""}
              onChange={(e) => update({ fundsAbroad: { ...data.fundsAbroad, sendsFundsAbroad: true, country: e.target.value } })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Purpose</Label>
            <Input className="h-8 text-sm" placeholder="Family support, investment"
              value={data.fundsAbroad?.purpose ?? ""}
              onChange={(e) => update({ fundsAbroad: { ...data.fundsAbroad, sendsFundsAbroad: true, purpose: e.target.value } })}
            />
          </div>
        </div>
      </AccountCard>
      <AccountCard
        name="Other Income Sources"
        description="Side business, freelance, or passive income"
        contribution={data.income?.otherIncome}
        onContributionChange={(v) => update({ income: { ...data.income, otherIncome: v } })}
        contributionLabel="Annual"
      />
    </div>
  );
}

// ── Section title & description ──────────────────────────────

const SECTION_META: Record<SubSection, { title: string; description: string }> = {
  employment: { title: "Employment & Income", description: "Enter salary, bonus, and monthly expenses" },
  retirement: { title: "Retirement Accounts", description: "Enter all retirement accounts for both spouses" },
  investments: { title: "Investments & Assets", description: "Enter taxable investment accounts and assets" },
  savings: { title: "Savings & Liquidity", description: "Enter cash reserves, HSA, and liquid savings" },
  education: { title: "Education & Future", description: "Enter education savings and projected benefits" },
  international: { title: "International & Other", description: "Enter international transfers and other sources" },
};

const SECTION_ICONS: Record<SubSection, string> = {
  employment: "💼",
  retirement: "🏦",
  investments: "📈",
  savings: "💰",
  education: "🎓",
  international: "🌍",
};

// ── Main Layout ──────────────────────────────────────────────

function makeEmptyData(role: "primary" | "spouse"): PersonFinancialBackground {
  return {
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
  };
}

export interface FinancialBgLayoutProps {
  clientNames: string;
  defaultValues?: PersonFinancialBackground;
  role: "primary" | "spouse";
  onSubmit: (data: PersonFinancialBackground) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function FinancialBgLayout({
  clientNames,
  defaultValues,
  role,
  onSubmit,
  isSubmitting = false,
}: FinancialBgLayoutProps) {
  const [data, setData] = useState<PersonFinancialBackground>(
    defaultValues ?? makeEmptyData(role)
  );
  const [activeSection, setActiveSection] = useState<SubSection>("employment");
  const [showInsights, setShowInsights] = useState(false);

  const update = useCallback((patch: Partial<PersonFinancialBackground>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const completedSections = useMemo(
    () => SUB_SECTIONS.filter((s) => isSectionComplete(s.id, data)).map((s) => s.id),
    [data]
  );

  const healthScore = useMemo(() => computeHealthScore(data), [data]);

  const progressPercent = Math.round((completedSections.length / SUB_SECTIONS.length) * 100);

  const currentIdx = SUB_SECTIONS.findIndex((s) => s.id === activeSection);

  const handlePrev = () => {
    if (currentIdx > 0) setActiveSection(SUB_SECTIONS[currentIdx - 1].id);
  };
  const handleNext = () => {
    if (currentIdx < SUB_SECTIONS.length - 1) {
      setActiveSection(SUB_SECTIONS[currentIdx + 1].id);
    } else {
      setShowInsights(true);
    }
  };
  const handleSaveAndNext = async () => {
    await onSubmit(data);
    handleNext();
  };

  const meta = SECTION_META[activeSection];

  // ── Render ──

  return (
    <div className="flex flex-col gap-0">
      {/* ── Top header bar ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-t-xl border bg-muted/30 px-4 py-2.5">
        <h2 className="text-base font-bold">Financial Background</h2>
        <span className="rounded-full border bg-background px-3 py-0.5 text-xs font-medium">
          {clientNames}
        </span>
        <div className="flex flex-1 items-center gap-2">
          <Progress value={progressPercent} className="h-1.5 flex-1" />
          <span className="text-xs font-medium text-muted-foreground">{progressPercent}%</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setShowInsights(!showInsights)}
        >
          {showInsights ? (
            <><FileText className="size-3.5" /> Form &larr; toggle</>
          ) : (
            <><BarChart3 className="size-3.5" /> Insights &rarr; toggle</>
          )}
        </Button>
      </div>

      {showInsights ? (
        <FinancialBgInsights
          data={data}
          healthScore={healthScore}
          onContinue={() => onSubmit(data)}
          isSubmitting={isSubmitting}
        />
      ) : (
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

            {/* Health score */}
            <div className="mt-6 rounded-xl border bg-gradient-to-b from-amber-50 to-background p-3 dark:from-amber-950/20">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500">
                Health Score
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black">{healthScore.total}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <p className="mb-3 text-[10px] text-muted-foreground">
                {healthScore.total < 30
                  ? "Partial — more screens ahead"
                  : healthScore.total < 60
                    ? "Building — keep going"
                    : "Looking strong!"}
              </p>
              <div className="space-y-1.5">
                {[
                  { label: "Retirement", value: healthScore.retirement, color: "bg-orange-400" },
                  { label: "Education", value: healthScore.education, color: "bg-blue-400" },
                  { label: "Tax", value: healthScore.tax, color: "bg-red-400" },
                  { label: "Protection", value: healthScore.protection, color: "bg-green-400" },
                  { label: "Estate", value: healthScore.estate, color: "bg-purple-400" },
                ].map((cat) => (
                  <div key={cat.label} className="flex items-center gap-2">
                    <span className="w-16 text-[10px] text-muted-foreground">{cat.label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", cat.color)}
                        style={{ width: cat.value !== null ? `${(cat.value / 20) * 100}%` : "0%" }}
                      />
                    </div>
                    <span className="w-8 text-right text-[10px] font-medium">
                      {cat.value !== null ? `${cat.value}/20` : "—/20"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Main form area ── */}
          <div className="flex-1 p-6">
            <div className="mb-5">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <span>{SECTION_ICONS[activeSection]}</span>
                {meta.title}
              </h3>
              <p className="text-sm text-muted-foreground">{meta.description}</p>
            </div>

            {activeSection === "employment" && <EmploymentSection data={data} update={update} />}
            {activeSection === "retirement" && <RetirementSection data={data} update={update} />}
            {activeSection === "investments" && <InvestmentsSection data={data} update={update} />}
            {activeSection === "savings" && <SavingsSection data={data} update={update} />}
            {activeSection === "education" && <EducationSection data={data} update={update} />}
            {activeSection === "international" && <InternationalSection data={data} update={update} />}

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
                    : "Save & View Insights"}
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
