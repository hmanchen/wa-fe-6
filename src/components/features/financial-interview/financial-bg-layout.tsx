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
import type { PersonFinancialBackground, EmploymentStatus, FinancialHealthScore } from "@/types/financial-interview";
import { FinancialBgInsights } from "./financial-bg-insights";

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
    case "employment":
      return (data.income?.annualSalary ?? 0) > 0 || (data.income?.businessIncome ?? 0) > 0 || (data.income?.otherIncome ?? 0) > 0;
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
    case "debts":
      return !!(
        data.debts?.mortgageBalance ||
        data.debts?.autoLoanBalance ||
        data.debts?.studentLoanBalance ||
        data.debts?.creditCardBalance
      );
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

function EmploymentSection({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  const status = data.income?.employmentStatus ?? "employed";

  return (
    <div className="space-y-4">
      {/* Employment status selector */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Employment status</Label>
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

      {/* Employed — salary fields */}
      {status === "employed" && (
        <AccountCard
          name="Annual Salary"
          description="Primary employment income (before taxes)"
          accent="border-l-emerald-400"
          balance={data.income?.annualSalary}
          onBalanceChange={(v) => update({ income: { ...data.income, annualSalary: v } })}
          contribution={data.income?.annualBonus}
          onContributionChange={(v) => update({ income: { ...data.income, annualBonus: v } })}
          contributionLabel="Bonus / Comm."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Employer name</Label>
              <Input className="h-8 text-sm" placeholder="e.g. Google"
                value={data.income?.employerName ?? ""}
                onChange={(e) => update({ income: { ...data.income, employerName: e.target.value } })}
              />
            </div>
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
          </div>
        </AccountCard>
      )}

      {/* Self-employed — business income fields */}
      {status === "self-employed" && (
        <AccountCard
          name="Business / Self-Employment Income"
          description="Annual income from business, freelance, or consulting"
          accent="border-l-blue-400"
          balance={data.income?.businessIncome}
          onBalanceChange={(v) => update({ income: { ...data.income, businessIncome: v } })}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Business type</Label>
              <Input className="h-8 text-sm" placeholder="e.g. Consulting, Retail"
                value={data.income?.businessType ?? ""}
                onChange={(e) => update({ income: { ...data.income, businessType: e.target.value } })}
              />
            </div>
            <CurrencyField
              label="Bonus / Commission"
              value={data.income?.annualBonus}
              onChange={(v) => update({ income: { ...data.income, annualBonus: v } })}
            />
            <CurrencyField
              label="Other income (annual)"
              value={data.income?.otherIncome}
              onChange={(v) => update({ income: { ...data.income, otherIncome: v } })}
            />
          </div>
        </AccountCard>
      )}

      {/* Not working — other income only */}
      {status === "not-working" && (
        <AccountCard
          name="Other Income Sources"
          description="Rental, pension, alimony, family support, or any other income"
          accent="border-l-slate-400"
          balance={data.income?.otherIncome}
          onBalanceChange={(v) => update({ income: { ...data.income, otherIncome: v } })}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Source of income</Label>
              <Input className="h-8 text-sm" placeholder="e.g. Rental income, Pension"
                value={data.income?.otherIncomeSource ?? ""}
                onChange={(e) => update({ income: { ...data.income, otherIncomeSource: e.target.value } })}
              />
            </div>
            <CurrencyField
              label="Bonus / One-time income"
              value={data.income?.annualBonus}
              onChange={(v) => update({ income: { ...data.income, annualBonus: v } })}
            />
          </div>
        </AccountCard>
      )}

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
      {/* 401(k), Traditional IRA & Roth IRA — grouped */}
      <div className={cn("rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm", "border-l-indigo-400")}>
        <div className="mb-3">
          <p className="text-sm font-semibold">401(k) / IRA / Roth IRA</p>
          <p className="text-xs text-muted-foreground">Core retirement accounts — enter balances and contributions</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* 401(k) */}
          <div className="space-y-2 rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">401(k)</p>
            <CurrencyField
              label="Balance"
              value={data.retirement401k?.currentBalance}
              onChange={(v) => update({ retirement401k: { ...data.retirement401k, has401k: true, currentBalance: v } })}
            />
            <CurrencyField
              label="Contribution"
              value={(() => {
                const pct = data.retirement401k?.employeeContributionPercent ?? 0;
                const salary = data.income?.annualSalary ?? 0;
                return pct > 0 && salary > 0 ? Math.round((pct / 100) * salary) : undefined;
              })()}
              onChange={(v) => {
                const salary = data.income?.annualSalary ?? 0;
                const pct = salary > 0 && v ? Math.round((v / salary) * 100) : undefined;
                update({ retirement401k: { ...data.retirement401k, has401k: true, employeeContributionPercent: pct } });
              }}
            />
          </div>
          {/* Traditional IRA */}
          <div className="space-y-2 rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Traditional IRA</p>
            <CurrencyField
              label="Balance"
              value={data.ira?.currentBalance}
              onChange={(v) => update({ ira: { ...data.ira, hasIRA: true, currentBalance: v } })}
            />
            <CurrencyField
              label="Annual Contribution"
              value={data.ira?.annualContribution}
              onChange={(v) => update({ ira: { ...data.ira, hasIRA: true, annualContribution: v } })}
            />
          </div>
          {/* Roth IRA */}
          <div className="space-y-2 rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Roth IRA</p>
            <CurrencyField
              label="Balance"
              value={data.rothIRA?.currentBalance}
              onChange={(v) => update({ rothIRA: { ...data.rothIRA, hasRothIRA: true, currentBalance: v } })}
            />
            <CurrencyField
              label="Annual Contribution"
              value={data.rothIRA?.annualContribution}
              onChange={(v) => update({ rothIRA: { ...data.rothIRA, hasRothIRA: true, annualContribution: v } })}
            />
          </div>
        </div>
      </div>
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
    <div className="space-y-3">
      <AccountCard
        name="Brokerage Account"
        description="Taxable investment account (stocks, ETFs, mutual funds)"
        accent="border-l-emerald-500"
        balance={data.brokerage?.currentValue}
        onBalanceChange={(v) => update({ brokerage: { ...data.brokerage, hasBrokerage: true, currentValue: v } })}
      />
      <AccountCard
        name="Bond Holdings"
        description="Municipal, Treasury, Corporate bonds & bond funds"
        accent="border-l-emerald-500"
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
        accent="border-l-emerald-500"
        balance={data.annuity?.currentValue}
        onBalanceChange={(v) => update({ annuity: { ...data.annuity, hasAnnuity: true, currentValue: v } })}
      />
      <AccountCard
        name="Stock Options / RSUs / ESPP"
        description="Employer equity compensation"
        accent="border-l-emerald-500"
        balance={(() => {
          const e = data.equityCompensation;
          return e ? (e.vestedOptionsValue ?? 0) + (e.vestedRSUValue ?? 0) || undefined : undefined;
        })()}
        onBalanceChange={(v) => update({ equityCompensation: { ...data.equityCompensation, hasEquityComp: true, vestedRSUValue: v } })}
      />
      <AccountCard
        name="Cryptocurrency"
        description="Bitcoin, Ethereum & digital assets"
        accent="border-l-emerald-500"
        balance={data.crypto?.totalValue}
        onBalanceChange={(v) => update({ crypto: { ...data.crypto, hasCrypto: true, totalValue: v } })}
      />
      <AccountCard
        name="Cash on Hand"
        description="Checking & savings account balances"
        accent="border-l-amber-400"
        balance={(data.cashOnHand?.checkingBalance ?? 0) + (data.cashOnHand?.savingsBalance ?? 0) || undefined}
        onBalanceChange={(v) => update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, checkingBalance: v } })}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <CurrencyField label="Checking" value={data.cashOnHand?.checkingBalance}
            onChange={(v) => update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, checkingBalance: v } })} />
          <CurrencyField label="Savings" value={data.cashOnHand?.savingsBalance}
            onChange={(v) => update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, savingsBalance: v } })} />
          <CurrencyField label="Emergency Fund (months)" value={data.cashOnHand?.emergencyFundMonths}
            onChange={(v) => update({ cashOnHand: { ...data.cashOnHand, hasCashOnHand: true, emergencyFundMonths: v } })}
            placeholder="e.g. 6" />
        </div>
      </AccountCard>
      <AccountCard
        name="HSA / CDs / 529"
        description="Health savings, certificates of deposit, education savings"
        accent="border-l-amber-400"
        balance={(data.hsa?.currentBalance ?? 0) + (data.cd?.totalValue ?? 0) + (data.education529?.totalBalance ?? 0) || undefined}
        onBalanceChange={() => {}}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <CurrencyField label="HSA Balance" value={data.hsa?.currentBalance}
            onChange={(v) => update({ hsa: { ...data.hsa, hasHSA: true, currentBalance: v } })} />
          <CurrencyField label="CDs Total" value={data.cd?.totalValue}
            onChange={(v) => update({ cd: { ...data.cd, hasCDs: true, totalValue: v } })} />
          <CurrencyField label="529 Balance" value={data.education529?.totalBalance}
            onChange={(v) => update({ education529: { ...data.education529, has529: true, totalBalance: v } })} />
        </div>
      </AccountCard>
      <AccountCard
        name="Social Security Estimate"
        description="Projected government retirement benefit"
        accent="border-l-violet-400"
        contribution={data.socialSecurity?.estimatedMonthlyBenefitFRA}
        onContributionChange={(v) => update({ socialSecurity: { ...data.socialSecurity, hasEstimate: true, estimatedMonthlyBenefitFRA: v } })}
        contributionLabel="Monthly at FRA"
      />
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

function DebtsSection({
  data,
  update,
}: {
  data: PersonFinancialBackground;
  update: (patch: Partial<PersonFinancialBackground>) => void;
}) {
  return (
    <div className="space-y-3">
      <AccountCard
        name="Mortgage"
        description="Primary home mortgage balance"
        accent="border-l-red-400"
        balance={data.debts?.mortgageBalance}
        onBalanceChange={(v) => update({ debts: { ...data.debts, mortgageBalance: v } })}
        contribution={data.debts?.mortgageMonthlyPayment}
        onContributionChange={(v) => update({ debts: { ...data.debts, mortgageMonthlyPayment: v } })}
        contributionLabel="Monthly Payment"
      />
      <AccountCard
        name="Auto Loans"
        description="Car payments and vehicle financing"
        accent="border-l-red-400"
        balance={data.debts?.autoLoanBalance}
        onBalanceChange={(v) => update({ debts: { ...data.debts, autoLoanBalance: v } })}
        contribution={data.debts?.autoLoanMonthlyPayment}
        onContributionChange={(v) => update({ debts: { ...data.debts, autoLoanMonthlyPayment: v } })}
        contributionLabel="Monthly Payment"
      />
      <AccountCard
        name="Student Loans"
        description="Federal and private student loan debt"
        accent="border-l-red-400"
        balance={data.debts?.studentLoanBalance}
        onBalanceChange={(v) => update({ debts: { ...data.debts, studentLoanBalance: v } })}
        contribution={data.debts?.studentLoanMonthlyPayment}
        onContributionChange={(v) => update({ debts: { ...data.debts, studentLoanMonthlyPayment: v } })}
        contributionLabel="Monthly Payment"
      />
      <AccountCard
        name="Credit Card Debt"
        description="Outstanding revolving credit balances"
        accent="border-l-red-400"
        balance={data.debts?.creditCardBalance}
        onBalanceChange={(v) => update({ debts: { ...data.debts, creditCardBalance: v } })}
        contribution={data.debts?.creditCardMinPayment}
        onContributionChange={(v) => update({ debts: { ...data.debts, creditCardMinPayment: v } })}
        contributionLabel="Min Payment"
      />
      <AccountCard
        name="Other Loans"
        description="Personal loans, HELOC, or other debts"
        accent="border-l-red-400"
        balance={data.debts?.otherLoanBalance}
        onBalanceChange={(v) => update({ debts: { ...data.debts, otherLoanBalance: v } })}
        contribution={data.debts?.otherLoanMonthlyPayment}
        onContributionChange={(v) => update({ debts: { ...data.debts, otherLoanMonthlyPayment: v } })}
        contributionLabel="Monthly Payment"
      >
        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Input className="h-8 text-sm" placeholder="e.g. HELOC, Personal loan"
            value={data.debts?.otherLoanDescription ?? ""}
            onChange={(e) => update({ debts: { ...data.debts, otherLoanDescription: e.target.value } })}
          />
        </div>
      </AccountCard>
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
    debts: {},
    lifeInsurance: {},
    estate: {},
  };
}

export interface FinancialBgLayoutProps {
  clientNames: string;
  defaultValues?: PersonFinancialBackground;
  role: "primary" | "spouse";
  healthScore?: FinancialHealthScore | null;
  onSubmit: (data: PersonFinancialBackground) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function FinancialBgLayout({
  clientNames,
  defaultValues,
  role,
  healthScore,
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
              </h3>
              <p className="text-sm text-muted-foreground">{meta.description}</p>
            </div>

            {activeSection === "employment" && <EmploymentSection data={data} update={update} />}
            {activeSection === "retirement" && <RetirementSection data={data} update={update} />}
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
