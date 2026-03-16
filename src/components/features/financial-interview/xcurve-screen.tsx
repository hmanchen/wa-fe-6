"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Pencil, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters/currency";
import type { FinancialHealthScore } from "@/types/financial-interview";

type Dict = Record<string, unknown>;

type Child = {
  name: string;
  age: number;
  projectedTotalNeed?: number;
};

type DimeEditable = {
  debt: number;
  replacementYears: number;
  mortgage: number;
  education: number;
  finalExpenses: number;
};

type XCurveInputs = {
  client: {
    primaryAge: number;
    primaryName: string;
    spouseName: string | null;
    children: Child[];
  };
  risk: {
    totalDebt: number;
    debtBreakdown: Array<{ label: string; amount: number }>;
    annualIncome: number;
    replacementYears: number;
    incomeReplacementRationale: string;
    mortgageBalance: number;
    hasMortgage: boolean;
    educationNeed: number;
    educationDerivation: string;
    educationChildren: Child[];
    finalExpenses: number;
    estateCosts: number;
    debtPayoffMonths: number;
  };
  accumulation: {
    retirementAccounts: number;
    investments: number;
    savings: number;
    realEstateEquity: number;
    otherAssets: number;
    totalCurrentAssets: number;
    existingLifeInsurance: number;
    monthlyContributions: number;
    employerMatch: number;
    monthlySurplus: number;
    projectedNetWorthAtRetirement: number;
  };
  retirement: {
    targetAge: number;
    desiredMonthlyIncome: number;
    desiredAnnualIncome: number;
    yearsInRetirement: number;
    monthlyExpenses: number;
    projected401kWithdrawal: number;
    projectedSocialSecurity: number;
    projectedPension: number;
    retirementIncomeGapAnnual: number;
    retirementIncomeGapMonthly: number;
    retirementReadiness: number;
  };
};

type CurvePoint = {
  age: number;
  risk: number;
  accumulation: number;
  gap: number;
  accumulationBase: number;
};

interface XCurveScreenProps {
  caseId: string;
  caseData: unknown;
  healthScore: FinancialHealthScore | null | undefined;
  fullAnalysis: unknown;
  xcurveData?: unknown;
  onContinue: () => void;
}

function n(v: unknown): number {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
}

function calculateAgeFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? age : null;
}

function calculateEducationNeedAtAge(children: Child[], age: number, currentParentAge: number): number {
  let total = 0;
  for (const child of children) {
    const childAgeAtPoint = n(child.age) + (age - currentParentAge);
    const projectedNeed = n(child.projectedTotalNeed) || 150_000;
    if (childAgeAtPoint < 18) {
      total += projectedNeed;
    } else if (childAgeAtPoint < 22) {
      const remainingYears = 22 - childAgeAtPoint;
      total += projectedNeed * (remainingYears / 4);
    }
  }
  return total;
}

function estimateRetirementExpenses(currentMonthlyExpenses: number, mortgagePaidOff: boolean) {
  if (currentMonthlyExpenses <= 0) {
    return {
      food: 0,
      insurancePremiums: 0,
      medical: 0,
      housing: 0,
      utilities: 0,
      transportation: 0,
      other: 0,
      totalMonthly: 0,
      totalAnnual: 0,
    };
  }
  const base = currentMonthlyExpenses * (mortgagePaidOff ? 0.65 : 0.8);
  const healthcareIncrease = 1_000;
  const totalMonthly = Math.round(base + healthcareIncrease);
  return {
    food: Math.round(currentMonthlyExpenses * 0.16),
    insurancePremiums: 1_000,
    medical: 2_000,
    housing: mortgagePaidOff ? 0 : Math.round(currentMonthlyExpenses * 0.24),
    utilities: Math.round(currentMonthlyExpenses * 0.035),
    transportation: Math.round(currentMonthlyExpenses * 0.023),
    other: Math.round(base * 0.15),
    totalMonthly,
    totalAnnual: totalMonthly * 12,
  };
}

function calculateRetirementCorpus(annualNeed: number, yearsInRetirement: number, inflationRate = 0.03) {
  const fourPercentRule = annualNeed * 25;
  const realReturnRate = 0.05;
  let corpus = 0;
  for (let year = 0; year < yearsInRetirement; year += 1) {
    const inflatedNeed = annualNeed * Math.pow(1 + inflationRate, year);
    corpus += inflatedNeed / Math.pow(1 + realReturnRate, year);
  }
  return {
    fourPercentRule: Math.round(fourPercentRule),
    inflationAdjusted: Math.round(corpus),
    recommended: Math.round(Math.max(fourPercentRule, corpus)),
  };
}

function deriveXCurveInputs(
  caseData: unknown,
  healthScore: FinancialHealthScore | null | undefined,
  fullAnalysis: unknown,
  xcurveData?: unknown
): XCurveInputs {
  const cd = (caseData as Dict | null) ?? {};
  const pi = (cd["clientPersonalInfo"] as Dict | undefined) ?? {};
  const hs = (healthScore as unknown as Dict | null) ?? {};
  const fa = (fullAnalysis as Dict | null) ?? {};

  const debt = (fa["debtService"] as Dict | undefined) ?? {};
  const cashFlow = (fa["cashFlow"] as Dict | undefined) ?? {};
  const netWorth = (fa["netWorth"] as Dict | undefined) ?? {};
  const nwCategories = (netWorth["categories"] as Dict | undefined) ?? {};
  const goalIncome = (fa["goalIncomeReplacement"] as Dict | undefined) ?? {};
  const goalEducation = (fa["goalEducationFunding"] as Dict | undefined) ?? {};
  const goalEstate = (fa["goalEstateNeed"] as Dict | undefined) ?? {};
  const goalCoverage = (fa["goalCoverageAdequacy"] as Dict | undefined) ?? {};
  const goalRet = (fa["goalRetirementProjection"] as Dict | undefined) ?? {};
  const goalNetWorth = (fa["goalNetWorth"] as Dict | undefined) ?? {};
  const hsGoalSummary = (hs["goalSummary"] as Dict | undefined) ?? {};
  const xcurveRaw =
    (xcurveData as Dict | undefined) ?? (fa["xcurve"] as Dict | undefined) ?? {};
  const xcurve =
    ((xcurveRaw["data"] as Dict | undefined) ?? xcurveRaw);

  const primaryAge = calculateAgeFromDob(String(pi["dateOfBirth"] ?? "")) ?? 40;
  const retirementAge = n(hsGoalSummary["retirementTargetAge"]) || 65;
  const incomeSources = (cashFlow["incomeSources"] as unknown[] | undefined) ?? [];
  const annualIncome = incomeSources.reduce<number>((sum, src) => {
    const s = (src as Dict | null) ?? {};
    return sum + n(s["annual"]);
  }, 0);

  const dependentsDetail = (pi["dependentsDetail"] as unknown[] | undefined) ?? [];
  const eduChildrenRaw = (goalEducation["children"] as unknown[] | undefined) ?? [];
  const fallbackChildren: Child[] = dependentsDetail.map((dep) => {
    const d = (dep as Dict | null) ?? {};
    return {
      name: String(d["name"] ?? "Child"),
      age: n(d["age"]),
    };
  });
  const educationChildren: Child[] =
    eduChildrenRaw.length > 0
      ? eduChildrenRaw.map((c) => {
          const x = (c as Dict | null) ?? {};
          return {
            name: String(x["name"] ?? "Child"),
            age: n(x["age"]),
            projectedTotalNeed: n(x["projectedTotalNeed"] ?? x["projected_total_need"]),
          };
        })
      : fallbackChildren;

  const debtEntries = (debt["debts"] as unknown[] | undefined) ?? [];
  const debtBreakdown = debtEntries.map((d) => {
    const x = (d as Dict | null) ?? {};
    return {
      label: String(x["label"] ?? "Debt"),
      amount: n(x["balance"]),
    };
  });

  const primaryResidence =
    (((pi["primary_background"] as Dict | undefined) ?? {})["real_estate"] as Dict | undefined) ??
    (((pi["primaryBackground"] as Dict | undefined) ?? {})["realEstate"] as Dict | undefined) ??
    {};
  const primaryResidenceDetail =
    (primaryResidence["primaryResidence"] as Dict | undefined) ??
    (primaryResidence["primary_residence"] as Dict | undefined) ??
    {};

  const mortgageFromCase =
    n(primaryResidenceDetail["mortgageBalance"] ?? primaryResidenceDetail["mortgage_balance"]) ||
    n(pi["mortgageBalance"]);

  const retirementMonthly =
    n(cashFlow["monthlyRetirementContributions"] ?? cashFlow["monthly_retirement_contributions"]) || 0;

  const employerMatch = n(cashFlow["monthlyEmployerMatch"] ?? cashFlow["monthly_employer_match"]) || 0;
  const xcurveComponents = (xcurve["components"] as unknown[] | undefined) ?? [];
  const xcurveByKey = new Map<string, number>();
  const xcurveFormulaByKey = new Map<string, string>();
  xcurveComponents.forEach((raw) => {
    const row = (raw as Dict | null) ?? {};
    const key = String(row["key"] ?? "");
    if (!key) return;
    xcurveByKey.set(key, n(row["amount"]));
    const formula = String(row["formula"] ?? "").trim();
    if (formula) xcurveFormulaByKey.set(key, formula);
  });
  const xcurveIncomeReplacement = n(xcurveByKey.get("income_replacement"));
  const xcurveDebtPayoff = n(xcurveByKey.get("debt_payoff"));
  const xcurveMortgage = n(xcurveByKey.get("mortgage_payoff"));
  const xcurveEducation = n(xcurveByKey.get("education_fund"));
  const xcurveFinalExpenses = n(xcurveByKey.get("final_expenses"));
  const xcurveIncomeYears = n(
    xcurve["income_replacement_years"] ?? xcurve["incomeReplacementYears"]
  );
  const xcurveIncomeRationale = String(
    xcurve["income_replacement_rationale"] ?? xcurve["incomeReplacementRationale"] ?? ""
  ).trim();
  const educationDerivation =
    xcurveFormulaByKey.get("education_fund") ||
    "Derived from children profiles and education funding assumptions.";

  let replacementYears = n(goalIncome["replacementYears"] ?? goalIncome["replacement_years"]) || 10;
  if (xcurveIncomeYears > 0) {
    replacementYears = xcurveIncomeYears;
  }
  if (xcurveIncomeReplacement > 0 && annualIncome > 0) {
    replacementYears = Math.max(1, Math.round(xcurveIncomeReplacement / annualIncome));
  }
  const derivedIncomeRationale =
    xcurveIncomeRationale ||
    (educationChildren.length > 0
      ? `Until youngest child (age ${Math.min(...educationChildren.map((c) => Math.max(0, c.age)))}) becomes independent`
      : `Until planned retirement at age ${retirementAge}`);
  const resolvedMortgage = xcurveMortgage || mortgageFromCase;

  const existingLifeCoverage =
    n(xcurve["existingCoverage"] ?? xcurve["existing_coverage"]) ||
    n(goalCoverage["existingCoverage"] ?? goalCoverage["existing_coverage"]) ||
    n(goalCoverage["existingLifeInsurance"] ?? goalCoverage["existing_life_insurance"]);

  const totalAssets =
    n(netWorth["totalAssets"] ?? netWorth["total_assets"]) ||
    n(goalCoverage["existingAssets"] ?? goalCoverage["existing_assets"]);

  return {
    client: {
      primaryAge,
      primaryName: String(pi["firstName"] ?? cd["clientName"] ?? "Client"),
      spouseName: pi["partnerFirstName"] ? String(pi["partnerFirstName"]) : null,
      children: educationChildren,
    },
    risk: {
      totalDebt: xcurveDebtPayoff || n(debt["totalConsumerDebt"] ?? debt["total_consumer_debt"]),
      debtBreakdown,
      annualIncome,
      replacementYears,
      incomeReplacementRationale: derivedIncomeRationale,
      mortgageBalance: resolvedMortgage,
      hasMortgage: resolvedMortgage > 0,
      educationNeed: n(
        xcurveEducation ||
          n(goalEducation["projectedTotalEducationNeed"] ?? goalEducation["projected_total_education_need"])
      ),
      educationDerivation,
      educationChildren,
      finalExpenses: xcurveFinalExpenses || 25_000,
      estateCosts: xcurveByKey.size > 0 ? 0 : n(goalEstate["baseEstateNeed"] ?? goalEstate["base_estate_need"]),
      debtPayoffMonths:
        n(((debt["avalancheStrategy"] as Dict | undefined) ?? {})["payoffMonths"]) || 36,
    },
    accumulation: {
      retirementAccounts: n(((nwCategories["retirement"] as Dict | undefined) ?? {})["total"]),
      investments: n(((nwCategories["investments"] as Dict | undefined) ?? {})["total"]),
      savings: n(((nwCategories["savings"] as Dict | undefined) ?? {})["total"]),
      realEstateEquity: n(((nwCategories["realEstate"] as Dict | undefined) ?? {})["total"]),
      otherAssets: n(((nwCategories["other"] as Dict | undefined) ?? {})["total"]),
      totalCurrentAssets: totalAssets,
      existingLifeInsurance: existingLifeCoverage,
      monthlyContributions: retirementMonthly,
      employerMatch,
      monthlySurplus: n(cashFlow["monthlySurplusOrDeficit"] ?? cashFlow["monthly_surplus_or_deficit"]),
      projectedNetWorthAtRetirement: n(
        goalNetWorth["projectedNetWorthAtRetirement"] ?? goalNetWorth["projected_net_worth_at_retirement"]
      ),
    },
    retirement: {
      targetAge: retirementAge,
      desiredMonthlyIncome:
        n(hsGoalSummary["desiredMonthlyIncome"] ?? hsGoalSummary["desired_monthly_income"]) || 0,
      desiredAnnualIncome:
        n(hsGoalSummary["desiredMonthlyIncome"] ?? hsGoalSummary["desired_monthly_income"]) * 12 || 0,
      yearsInRetirement: Math.max(20, 90 - retirementAge),
      monthlyExpenses:
        n(cashFlow["totalMonthlyExpenses"] ?? cashFlow["total_monthly_expenses"]) || 0,
      projected401kWithdrawal: n(
        goalRet["projectedAnnual401kWithdrawal"] ?? goalRet["projected_annual_401k_withdrawal"]
      ),
      projectedSocialSecurity: n(
        goalRet["projectedSocialSecurityAnnual"] ?? goalRet["projected_social_security_annual"]
      ),
      projectedPension: n(goalRet["projectedPensionAnnual"] ?? goalRet["projected_pension_annual"]),
      retirementIncomeGapAnnual: n(
        goalRet["retirementIncomeGapAnnual"] ?? goalRet["retirement_income_gap_annual"]
      ),
      retirementIncomeGapMonthly: n(
        goalRet["retirementIncomeGapMonthly"] ?? goalRet["retirement_income_gap_monthly"]
      ),
      retirementReadiness: n(
        goalRet["retirementReadinessScore"] ?? goalRet["retirement_readiness_score"]
      ),
    },
  };
}

function buildCurve(
  inputs: XCurveInputs,
  editable: DimeEditable
): {
  points: CurvePoint[];
  crossingAge: number | null;
  grossRisk: number;
  netRisk: number;
  coverageGap: number;
  currentGap: number;
} {
  const currentAge = inputs.client.primaryAge;
  const retirementAge = inputs.retirement.targetAge;
  const endAge = 90;

  const incomeReplacementNeed = inputs.risk.annualIncome * editable.replacementYears;
  const grossRisk =
    editable.debt +
    incomeReplacementNeed +
    editable.mortgage +
    editable.education;
  const netRisk = Math.max(0, grossRisk - inputs.accumulation.totalCurrentAssets);
  const coverageGap = Math.max(0, netRisk - inputs.accumulation.existingLifeInsurance);

  const points: CurvePoint[] = [];
  for (let age = currentAge; age <= endAge; age += 1) {
    const yearsFromNow = age - currentAge;

    const mortgageTerm = 30;
    const mortgageYearsRemaining = Math.max(0, mortgageTerm - yearsFromNow);
    const mortgageAtAge = editable.mortgage * (mortgageYearsRemaining / mortgageTerm);

    const yearsToRetirement = Math.max(0, retirementAge - age);
    const incomeReplacementAtAge =
      inputs.risk.annualIncome * Math.min(yearsToRetirement, editable.replacementYears);

    const educationAtAge = calculateEducationNeedAtAge(
      inputs.risk.educationChildren,
      age,
      currentAge
    );

    const debtAtAge =
      yearsFromNow * 12 >= inputs.risk.debtPayoffMonths
        ? 0
        : editable.debt * (1 - yearsFromNow * 12 / inputs.risk.debtPayoffMonths);

    const fixedRisk = editable.finalExpenses + inputs.risk.estateCosts;
    const riskAtAge = Math.max(0, mortgageAtAge + incomeReplacementAtAge + educationAtAge + debtAtAge + fixedRisk);

    const growthRate = 0.07;
    const retirementAtAge =
      inputs.accumulation.retirementAccounts * Math.pow(1 + growthRate, yearsFromNow);
    const annualContributions =
      (inputs.accumulation.monthlyContributions +
        inputs.accumulation.employerMatch +
        Math.max(0, inputs.accumulation.monthlySurplus * 0.35)) *
      12;
    const contributionGrowth =
      annualContributions > 0
        ? annualContributions * ((Math.pow(1 + growthRate, yearsFromNow) - 1) / growthRate)
        : 0;
    const investmentsAtAge = inputs.accumulation.investments * Math.pow(1 + 0.06, yearsFromNow);
    const savingsAtAge = inputs.accumulation.savings * Math.pow(1 + 0.02, yearsFromNow);
    const realEstateAtAge = inputs.accumulation.realEstateEquity * Math.pow(1 + 0.03, yearsFromNow);
    const otherAssetsAtAge = inputs.accumulation.otherAssets * Math.pow(1 + 0.03, yearsFromNow);
    const coverageAtAge = inputs.accumulation.existingLifeInsurance;

    let accumulationAtAge =
      retirementAtAge +
      contributionGrowth +
      investmentsAtAge +
      savingsAtAge +
      realEstateAtAge +
      otherAssetsAtAge +
      coverageAtAge;

    if (age > retirementAge) {
      const yearsInRetirement = age - retirementAge;
      const annualWithdrawal =
        inputs.retirement.desiredAnnualIncome > 0
          ? inputs.retirement.desiredAnnualIncome
          : inputs.retirement.monthlyExpenses * 12;
      accumulationAtAge = Math.max(0, accumulationAtAge - annualWithdrawal * yearsInRetirement);
    }

    const gap = Math.max(0, riskAtAge - accumulationAtAge);
    points.push({
      age,
      risk: Math.round(riskAtAge),
      accumulation: Math.round(accumulationAtAge),
      gap: Math.round(gap),
      accumulationBase: Math.round(accumulationAtAge),
    });
  }

  let crossingAge: number | null = null;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const cur = points[i];
    if (prev.risk > prev.accumulation && cur.risk <= cur.accumulation) {
      crossingAge = cur.age;
      break;
    }
  }

  return {
    points,
    crossingAge,
    grossRisk: Math.round(grossRisk),
    netRisk: Math.round(netRisk),
    coverageGap: Math.round(coverageGap),
    currentGap: Math.round(points[0]?.gap ?? 0),
  };
}

function calculateMilestones(inputs: XCurveInputs, currentMortgageBalance: number) {
  const currentAge = inputs.client.primaryAge;
  const childrenCollege = (inputs.client.children ?? [])
    .map((child) => ({
      name: child.name || "Child",
      parentAgeAtCollege: currentAge + (18 - n(child.age)),
    }))
    .filter((x) => x.parentAgeAtCollege > currentAge && x.parentAgeAtCollege < 90);

  const mortgagePayoff = currentMortgageBalance > 0 ? currentAge + 30 : null;
  const debtFreeAge = currentAge + Math.ceil(inputs.risk.debtPayoffMonths / 12);
  return {
    currentAge,
    retirementAge: inputs.retirement.targetAge,
    childrenCollege,
    mortgagePayoff: mortgagePayoff <= 90 ? mortgagePayoff : null,
    debtFreeAge: debtFreeAge <= 90 ? debtFreeAge : null,
  };
}

function formatAmount(amount: number): string {
  const v = Math.round(Math.max(0, amount));
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `$${v.toLocaleString()}`;
  return `$${v}`;
}

function formatAmountCompact(amount: number): string {
  const v = Math.round(Math.max(0, amount));
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

function getResponsibilities(inputs: XCurveInputs, editable: DimeEditable) {
  const monthlyBase = Math.max(0, inputs.retirement.monthlyExpenses);
  const debtStatus =
    editable.debt > 0 ? `${formatAmountCompact(editable.debt)} total` : "Debt-free";
  const mortgageStatus =
    editable.mortgage > 0 ? formatAmount(editable.mortgage) : "No mortgage";
  return [
    { label: "Housing", value: monthlyBase > 0 ? `${formatAmount(monthlyBase * 0.3)}/mo` : "Not captured" },
    { label: "Food/Groceries", value: monthlyBase > 0 ? `${formatAmount(monthlyBase * 0.16)}/mo` : "Not captured" },
    { label: "Childcare/Edu", value: inputs.client.children.length > 0 ? `${formatAmount(monthlyBase * 0.12)}/mo` : "N/A" },
    { label: "Transportation", value: monthlyBase > 0 ? `${formatAmount(monthlyBase * 0.08)}/mo` : "Not captured" },
    { label: "Healthcare", value: "Not captured" },
    { label: "Debts", value: debtStatus },
    { label: "Mortgage", value: mortgageStatus },
  ];
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

function positionMilestones(
  milestones: Array<{ label: string; age: number }>,
  svgWidth: number
): Array<{ label: string; age: number; x: number; labelAbove: boolean }> {
  const minAge = 25;
  const maxAge = 90;
  const padding = 70;
  const usableWidth = svgWidth - padding * 2;
  const positioned = milestones
    .map((m) => ({
      ...m,
      x: padding + ((m.age - minAge) / (maxAge - minAge)) * usableWidth,
      labelAbove: false,
    }))
    .sort((a, b) => a.x - b.x);

  for (let i = 1; i < positioned.length; i += 1) {
    const prev = positioned[i - 1];
    const cur = positioned[i];
    if (cur.x - prev.x < 60) {
      cur.labelAbove = !prev.labelAbove;
    }
  }
  return positioned;
}

function DimeRow({
  letter,
  title,
  colorClass,
  amount,
  onChange,
  subtitle,
  breakdown,
}: {
  letter: string;
  title: string;
  colorClass: string;
  amount: number;
  onChange: (next: number) => void;
  subtitle?: string;
  breakdown?: Array<{ label: string; amount: number }>;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold text-white ${colorClass}`}
          >
            {letter}
          </span>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <Input
              type="number"
              value={amount}
              onChange={(e) => onChange(n(e.target.value))}
              onBlur={() => setEditing(false)}
              className="h-8 w-32 text-right"
              autoFocus
            />
          ) : (
            <>
              <span className="font-mono text-sm font-semibold">{formatCurrency(amount)}</span>
              <button
                type="button"
                className="rounded p-1 text-muted-foreground hover:bg-muted"
                onClick={() => setEditing(true)}
                aria-label={`Edit ${title}`}
              >
                <Pencil className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
      {amount === 0 && (
        <div className="mt-2 rounded border border-dashed px-2 py-1.5 text-xs text-muted-foreground">
          No data captured. Click the pencil icon to add this value.
        </div>
      )}
      {breakdown && breakdown.length > 0 && (
        <div className="mt-2 space-y-1">
          {breakdown.slice(0, 4).map((row, i) => (
            <div key={`${row.label}-${i}`} className="flex justify-between text-xs text-muted-foreground">
              <span>{row.label}</span>
              <span className="font-mono">{formatCurrency(row.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function XCurveScreen({
  caseId: _caseId,
  caseData,
  healthScore,
  fullAnalysis,
  xcurveData,
  onContinue,
}: XCurveScreenProps) {
  const inputs = useMemo(
    () => deriveXCurveInputs(caseData, healthScore, fullAnalysis, xcurveData),
    [caseData, healthScore, fullAnalysis, xcurveData]
  );

  const [editable, setEditable] = useState<DimeEditable>({
    debt: inputs.risk.totalDebt,
    replacementYears: inputs.risk.replacementYears,
    mortgage: inputs.risk.mortgageBalance,
    education: inputs.risk.educationNeed,
    finalExpenses: inputs.risk.finalExpenses,
  });

  useEffect(() => {
    setEditable({
      debt: inputs.risk.totalDebt,
      replacementYears: inputs.risk.replacementYears,
      mortgage: inputs.risk.mortgageBalance,
      education: inputs.risk.educationNeed,
      finalExpenses: inputs.risk.finalExpenses,
    });
  }, [
    inputs.risk.totalDebt,
    inputs.risk.replacementYears,
    inputs.risk.mortgageBalance,
    inputs.risk.educationNeed,
    inputs.risk.finalExpenses,
  ]);

  const curve = useMemo(() => buildCurve(inputs, editable), [inputs, editable]);
  const authoritativeCoverageGap = useMemo(() => {
    const fa = (fullAnalysis as Dict | null) ?? {};
    const cov =
      (fa["goalCoverageAdequacy"] as Dict | undefined) ??
      (fa["goal_coverage_adequacy"] as Dict | undefined) ??
      {};
    const fromGoal = n(cov["coverageGap"] ?? cov["coverage_gap"]);
    return fromGoal > 0 ? fromGoal : curve.coverageGap;
  }, [fullAnalysis, curve.coverageGap]);
  const milestones = useMemo(
    () => calculateMilestones(inputs, editable.mortgage),
    [inputs, editable.mortgage]
  );
  const responsibilities = useMemo(
    () => getResponsibilities(inputs, editable),
    [inputs, editable]
  );

  const svgWidth = 1040;
  const svgHeight = 760;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2 - 30;
  const curveBottomY = 600;
  const upperLeftMaxX = svgWidth * 0.38;
  const lowerTextStartY = curveBottomY + 30;
  const maxValueRightEdge = svgWidth * 0.30;
  const leftDataStartY = svgHeight * 0.30;
  const rightDataStartY = leftDataStartY;
  const lineHeight = 38;
  const crossingAccent = "#7C3AED";
  const freedomCheckX = svgWidth * 0.64;
  const freedomTextX = svgWidth * 0.67;
  const moneyLineStartX = 60;
  const moneyLineStartY = curveBottomY;
  const respLineEndX = 980;
  const respLineEndY = curveBottomY;
  const responsibilityPath = `
    M 60,95
    C 250,95 390,235 ${centerX},${centerY}
    S 780,${curveBottomY} 980,${curveBottomY}
  `;
  const moneyLinePath = `
    M 60,${curveBottomY}
    C 250,${curveBottomY} 390,455 ${centerX},${centerY}
    S 780,95 980,95
  `;

  const retirementExpenses = useMemo(() => {
    const mortgagePaidOff = milestones.mortgagePayoff !== null && milestones.mortgagePayoff <= inputs.retirement.targetAge;
    const baselineMonthly =
      inputs.retirement.monthlyExpenses > 0
        ? inputs.retirement.monthlyExpenses
        : inputs.retirement.desiredMonthlyIncome > 0
          ? inputs.retirement.desiredMonthlyIncome
          : Math.round((inputs.risk.annualIncome * 0.5) / 12);
    return estimateRetirementExpenses(Math.max(0, baselineMonthly), mortgagePaidOff);
  }, [
    inputs.retirement.monthlyExpenses,
    inputs.retirement.desiredMonthlyIncome,
    inputs.retirement.targetAge,
    inputs.risk.annualIncome,
    milestones.mortgagePayoff,
  ]);

  const retirementCorpus = useMemo(
    () =>
      calculateRetirementCorpus(retirementExpenses.totalAnnual, inputs.retirement.yearsInRetirement, 0.03),
    [retirementExpenses.totalAnnual, inputs.retirement.yearsInRetirement]
  );

  const retirementIncomeTotal =
    inputs.retirement.projected401kWithdrawal +
    inputs.retirement.projectedSocialSecurity +
    inputs.retirement.projectedPension;
  const replacementYearOptions = useMemo(() => {
    const defaults = [5, 7, 8, 10, 12, 15, 20];
    const current = Math.round(editable.replacementYears);
    if (current > 0 && !defaults.includes(current)) {
      return [...defaults, current].sort((a, b) => a - b);
    }
    return defaults;
  }, [editable.replacementYears]);

  const retirementAnnualGap = Math.max(
    0,
    retirementExpenses.totalAnnual - retirementIncomeTotal
  );
  const retirementMonthlyGap = Math.max(0, retirementAnnualGap / 12);
  const retirementDeficit = retirementAnnualGap;
  const projectedAtRetirementDerivation = useMemo(() => {
    const years = Math.max(0, inputs.retirement.targetAge - inputs.client.primaryAge);
    const annualSavings = Math.max(0, inputs.accumulation.monthlySurplus) * 12;
    const liabilitiesNow = Math.max(
      0,
      inputs.risk.totalDebt + Math.max(0, editable.mortgage)
    );
    return `Derived by goal net worth projection: current assets (${formatCurrency(
      inputs.accumulation.totalCurrentAssets
    )}) + annual savings (${formatCurrency(annualSavings)}/yr) over ${years} years at assumed growth, minus projected liabilities and planned major purchases.`;
  }, [
    inputs.retirement.targetAge,
    inputs.client.primaryAge,
    inputs.accumulation.monthlySurplus,
    inputs.accumulation.totalCurrentAssets,
    inputs.risk.totalDebt,
    editable.mortgage,
  ]);

  const timelineMilestones = [
    { label: "Age", age: inputs.client.primaryAge },
    ...(curve.crossingAge !== null ? [{ label: "Cross", age: curve.crossingAge }] : []),
    { label: "Retire", age: inputs.retirement.targetAge },
    { label: "SS", age: 67 },
    ...(milestones.mortgagePayoff ? [{ label: "Mtg off", age: milestones.mortgagePayoff }] : []),
  ]
    .filter((m, idx, arr) => arr.findIndex((x) => x.label === m.label && x.age === m.age) === idx)
    .slice(0, 7);
  const positionedMilestones = positionMilestones(timelineMilestones, svgWidth);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-xl font-bold text-[#1B365D]">Financial X-Curve</h2>
        <p className="text-sm text-muted-foreground">Your lifetime financial risk vs accumulation</p>
      </div>

      <section className="rounded-xl border bg-[#FAFAF7] p-4 md:p-5">
        <div className="mb-4">
          <p className="text-sm font-semibold text-[#1B365D]">The X-Curve Diagram</p>
          <p className="text-xs text-muted-foreground">
            Responsibility line and money line crossing in the center.
          </p>
        </div>
        <div className="w-full overflow-x-auto rounded-xl border bg-white p-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="xcurve-diagram mx-auto h-[420px] w-full md:h-[600px]"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d={responsibilityPath}
              className="xcurve-responsibility-line"
              stroke="#1B365D"
              strokeWidth="9"
              strokeDasharray="20 10"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={moneyLinePath}
              className="xcurve-money-line"
              stroke="#8B0000"
              strokeWidth="9"
              strokeDasharray="20 10"
              fill="none"
              strokeLinecap="round"
            />

            <text x="255" y="122" fill="#1B365D" fontSize="20" fontWeight="700" fontStyle="italic" transform="rotate(28,255,122)">
              Responsibility Line
            </text>
            <text x={svgWidth * 0.68} y="156" fill="#8B0000" fontSize="20" fontWeight="700" fontStyle="italic" transform={`rotate(-28, ${svgWidth * 0.68}, 156)`}>
              MONEY LINE
            </text>

            <text x="42" y="52" fill="#1B365D" fontSize="14" fontWeight="700">Big</text>
            <text x="42" y="72" fill="#1B365D" fontSize="14" fontWeight="700">Resp.</text>
            <text x={svgWidth - 80} y="45" fill="#8B0000" fontSize="14" fontWeight="700" textAnchor="end">Big</text>
            <text x={svgWidth - 80} y="62" fill="#8B0000" fontSize="14" fontWeight="700" textAnchor="end">Savings</text>
            <text x={moneyLineStartX - 5} y={moneyLineStartY - 12} fill="#8B0000" fontSize="14" fontWeight="700" textAnchor="end">No</text>
            <text x={moneyLineStartX - 5} y={moneyLineStartY + 3} fill="#8B0000" fontSize="14" fontWeight="700" textAnchor="end">Savings</text>
            <text x={respLineEndX + 5} y={respLineEndY - 12} fill="#1B365D" fontSize="14" fontWeight="700">No</text>
            <text x={respLineEndX + 5} y={respLineEndY + 3} fill="#1B365D" fontSize="14" fontWeight="700">Resp.</text>

            {responsibilities.map((item, idx) => (
              <g key={`resp-${idx}`}>
                <text x="78" y={leftDataStartY + idx * lineHeight} fill="#1B365D" fontSize="13">
                  {item.value === "Not captured" ? "⚠" : "✓"}
                </text>
                <text x="103" y={leftDataStartY + idx * lineHeight} fill="#1B365D" fontSize="13">
                  {truncateText(item.label, 16)}
                </text>
                <text
                  x={Math.min(maxValueRightEdge, upperLeftMaxX - 20)}
                  y={leftDataStartY + idx * lineHeight}
                  textAnchor="end"
                  fill={item.value === "Not captured" ? "#D4A84B" : "#1B365D"}
                  fontSize="13"
                  fontWeight="700"
                >
                  {item.value === "Not captured" ? "⚠ Not captured" : truncateText(item.value, 13)}
                </text>
              </g>
            ))}

            {[
              "Food expenses covered",
              !inputs.risk.hasMortgage
                ? "No mortgage"
                : milestones.mortgagePayoff
                  ? `Mortgage off by age ${milestones.mortgagePayoff}`
                  : "Mortgage data not captured",
              "Education funded",
              "Healthcare covered",
              `Debt-free by ${milestones.debtFreeAge ?? "-"}`,
              `${formatAmount(inputs.retirement.desiredMonthlyIncome || retirementIncomeTotal / 12)}/mo passive`,
            ].map((item, idx) => (
              <g key={`target-${idx}`}>
                <text x={freedomCheckX} y={rightDataStartY + idx * lineHeight} fill="#8B0000" fontSize="13" fontWeight="700">✓</text>
                <text x={freedomTextX} y={rightDataStartY + idx * lineHeight} fill="#8B0000" fontSize="13">{truncateText(item, 24)}</text>
              </g>
            ))}

            <text x={svgWidth * 0.25} y={lowerTextStartY} fill="#1B365D" fontSize="16" fontWeight="700" textDecoration="underline" textAnchor="middle">Active Income</text>
            <text x={svgWidth * 0.25} y={lowerTextStartY + 20} fill="#1B365D" fontSize="13" textAnchor="middle">(Man At Work)</text>
            <text x={svgWidth * 0.25} y={lowerTextStartY + 42} fill="#1B365D" fontSize="12" textAnchor="middle">
              {inputs.client.primaryName} earns {formatAmount(inputs.risk.annualIncome)}/yr
            </text>

            <text x={svgWidth * 0.75} y={lowerTextStartY} fill="#8B0000" fontSize="16" fontWeight="700" textDecoration="underline" textAnchor="middle">Passive Income</text>
            <text x={svgWidth * 0.75} y={lowerTextStartY + 20} fill="#8B0000" fontSize="13" textAnchor="middle">(Money At Work)</text>
            <text x={svgWidth * 0.75} y={lowerTextStartY + 42} fill="#8B0000" fontSize="12" textAnchor="middle">
              Target {formatAmount(inputs.retirement.desiredMonthlyIncome || retirementIncomeTotal / 12)}/mo by age {inputs.retirement.targetAge}
            </text>

            {(() => {
              const timelineY = svgHeight * 0.94;
              return (
                <>
                  <line x1="60" y1={timelineY} x2={svgWidth - 60} y2={timelineY} stroke="#1B365D" strokeWidth="2" />
            <text x="70" y={svgHeight * 0.9} fill="#1B365D" fontSize="28" fontWeight="700">YOUNG</text>
                  <text x={centerX} y={svgHeight - 20} fill="#1B365D" fontSize="24" fontWeight="700" textAnchor="middle" textDecoration="underline">LIFE</text>
            <text x={svgWidth - 70} y={svgHeight * 0.9} fill="#1B365D" fontSize="28" fontWeight="700" textAnchor="end">OLD</text>

                  {positionedMilestones.map((m, idx) => {
                    const x = m.x;
                    const labelY = m.labelAbove ? timelineY - 18 : timelineY + 16;
                    const isCurrentAge = m.label === "Age" && m.age === inputs.client.primaryAge;
                    return (
                      <g key={`${m.label}-${m.age}-${idx}`}>
                        <line x1={x} y1={timelineY} x2={x} y2={m.labelAbove ? timelineY - 12 : timelineY + 10} stroke="#636E72" strokeWidth="2" />
                        <circle cx={x} cy={timelineY} r={isCurrentAge ? 6 : 4} fill={isCurrentAge ? "#E74C3C" : "#636E72"} stroke={isCurrentAge ? "white" : "none"} strokeWidth={isCurrentAge ? 2 : 0} />
                        {isCurrentAge ? (
                          <>
                            <text x={x} y={timelineY - 12} textAnchor="middle" fill="#E74C3C" fontSize="11" fontWeight="700">
                              ▲ You are here
                            </text>
                            <text x={x} y={timelineY + 16} textAnchor="middle" fill="#636E72" fontSize="10" fontWeight="700">
                              Age {m.age}
                            </text>
                          </>
                        ) : (
                          <text x={x} y={labelY} textAnchor="middle" fill="#636E72" fontSize="10" fontWeight="700">
                            {m.label} {m.age}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </>
              );
            })()}

            <g className="crossing-point-overlay">
              <rect x={centerX - 58} y={centerY + 12} width="116" height="38" fill="white" rx="8" opacity="0.95" />
              <circle className="xcurve-cross-pulse" cx={centerX} cy={centerY} r="11" fill={crossingAccent} stroke="white" strokeWidth="3" />
              <text x={centerX} y={centerY + 28} textAnchor="middle" fill={crossingAccent} fontSize="12" fontWeight="700">Crossing Point</text>
              {curve.crossingAge !== null && (
                <text x={centerX} y={centerY + 43} textAnchor="middle" fill={crossingAccent} fontSize="14" fontWeight="700">Age {curve.crossingAge}</text>
              )}
            </g>
          </svg>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-[#1B365D]/35 bg-white p-3">
            <p className="text-base font-bold text-[#1B365D]">a. DIE TOO SOON</p>
            <p className="text-sm font-semibold text-[#1B365D]">PROTECT YOUR FAMILY</p>
            <p className="text-xs text-muted-foreground">(Life Insurance / Income Replacement)</p>
            <p className="mt-1 font-mono text-lg font-bold text-[#E74C3C]">Coverage Gap: {formatCurrency(authoritativeCoverageGap)}</p>
          </div>
          <div className="rounded-lg border border-[#8B0000]/35 bg-white p-3">
            <p className="text-base font-bold text-[#8B0000]">b. LIVE TOO LONG</p>
            <p className="text-sm font-semibold text-[#8B0000]">PROTECT YOURSELF</p>
            <p className="text-xs text-muted-foreground">(Investments / Living on Interest)</p>
            <p className="mt-1 font-mono text-lg font-bold text-[#8B0000]">Retirement Gap: {formatCurrency(retirementDeficit)}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-[#E74C3C]/30 bg-white p-3">
              <p className="text-xs text-muted-foreground">Current Risk Gap</p>
            <p className="font-mono text-xl font-bold text-[#E74C3C]">{formatCurrency(curve.currentGap)}</p>
              <p className="text-xs text-muted-foreground">At current age after timeline adjustment</p>
          </div>
          <div className="rounded-lg border bg-white p-3" style={{ borderColor: `${crossingAccent}66` }}>
            <p className="text-xs text-muted-foreground">Crossing Point</p>
            <p className="text-2xl font-bold" style={{ color: crossingAccent }}>
              {curve.crossingAge !== null ? `Age ${curve.crossingAge}` : "Beyond age 90"}
            </p>
            <p className="text-xs text-muted-foreground">When accumulation exceeds risk</p>
          </div>
          <div
            className={`rounded-lg border bg-white p-3 ${
              curve.crossingAge !== null && milestones.retirementAge < curve.crossingAge
                ? "border-amber-300"
                : "border-[#00838F]/40"
            }`}
          >
            <p className="text-xs text-muted-foreground">Retirement Goal</p>
            <p className="text-xl font-bold text-[#00838F]">Age {milestones.retirementAge}</p>
            <p className="text-xs text-muted-foreground">
              {curve.crossingAge === null
                ? "Gap still open beyond 90"
                : milestones.retirementAge < curve.crossingAge
                  ? "Retirement goal before crossing point"
                  : "Retirement goal after crossing point"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-base font-bold text-[#1B365D]">DIME Analysis - Risk Breakdown</h3>
          <div className="mt-3 space-y-3">
            <DimeRow
              letter="D"
              title="Debt"
              colorClass="bg-[#E74C3C]"
              amount={editable.debt}
              onChange={(next) => setEditable((prev) => ({ ...prev, debt: next }))}
              breakdown={inputs.risk.debtBreakdown}
            />
            <div className="rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#3498DB] text-xs font-bold text-white">
                    I
                  </span>
                  <p className="text-sm font-semibold">Income Replacement</p>
                </div>
                <p className="font-mono text-sm font-semibold">
                  {formatCurrency(inputs.risk.annualIncome * editable.replacementYears)}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span>{formatCurrency(inputs.risk.annualIncome)}/year ×</span>
                <select
                  value={editable.replacementYears}
                  onChange={(e) =>
                    setEditable((prev) => ({ ...prev, replacementYears: n(e.target.value) }))
                  }
                  className="h-8 rounded border bg-background px-2"
                >
                  {replacementYearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y} years
                    </option>
                  ))}
                </select>
              </div>
              {inputs.risk.incomeReplacementRationale && (
                <div className="mt-1 text-[10px] italic text-muted-foreground">
                  * {inputs.risk.incomeReplacementRationale}
                </div>
              )}
            </div>
            <DimeRow
              letter="M"
              title="Mortgage"
              colorClass="bg-[#27AE60]"
              amount={editable.mortgage}
              onChange={(next) => setEditable((prev) => ({ ...prev, mortgage: next }))}
            />
            <DimeRow
              letter="E"
              title="Education"
              colorClass="bg-[#8E44AD]"
              amount={editable.education}
              onChange={(next) => setEditable((prev) => ({ ...prev, education: next }))}
              subtitle={inputs.risk.educationDerivation}
            />
            <div className="rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between text-sm">
                <span>Estate / Probate Costs</span>
                <span className="font-mono">{formatCurrency(inputs.risk.estateCosts)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-1 rounded-lg border bg-muted/20 p-3 font-mono text-sm">
            <div className="flex justify-between">
              <span>GROSS RISK</span>
              <span>{formatCurrency(curve.grossRisk)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>- Existing Assets</span>
              <span>({formatCurrency(inputs.accumulation.totalCurrentAssets)})</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span>NET RISK</span>
              <span>{formatCurrency(curve.netRisk)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>- Existing Life Insurance</span>
              <span>({formatCurrency(inputs.accumulation.existingLifeInsurance)})</span>
            </div>
            <div className="flex justify-between border-t pt-1 text-base font-bold text-[#E67E22]">
              <span>COVERAGE GAP</span>
              <span>{formatCurrency(authoritativeCoverageGap)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-base font-bold text-[#1B365D]">Retirement Projection</h3>
          <p className="text-xs text-muted-foreground">
            Planning for age {inputs.retirement.targetAge} to 90
          </p>

          <div className="mt-3 rounded-lg border bg-background p-3">
            <p className="text-sm font-semibold">Projected Monthly Expenses in Retirement</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span>Food/Groceries</span><span>{formatCurrency(retirementExpenses.food)}/mo</span></div>
              <div className="flex justify-between"><span>Insurance Premiums</span><span>{formatCurrency(retirementExpenses.insurancePremiums)}/mo</span></div>
              <div className="flex justify-between"><span>Medical/Healthcare</span><span>{formatCurrency(retirementExpenses.medical)}/mo</span></div>
              <div className="flex justify-between"><span>Housing</span><span>{formatCurrency(retirementExpenses.housing)}/mo</span></div>
              <div className="flex justify-between"><span>Utilities</span><span>{formatCurrency(retirementExpenses.utilities)}/mo</span></div>
              <div className="flex justify-between"><span>Transportation</span><span>{formatCurrency(retirementExpenses.transportation)}/mo</span></div>
              <div className="flex justify-between"><span>Other</span><span>{formatCurrency(retirementExpenses.other)}/mo</span></div>
              <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
                <span>Total Monthly</span>
                <span>{formatCurrency(retirementExpenses.totalMonthly)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span>Total Annual</span>
                <span>{formatCurrency(retirementExpenses.totalAnnual)}/yr</span>
              </div>
              <div className="flex justify-between">
                <span>Total Need ({inputs.retirement.yearsInRetirement} yrs)</span>
                <span>{formatCurrency(retirementExpenses.totalAnnual * inputs.retirement.yearsInRetirement)}</span>
              </div>
              <div className="flex justify-between">
                <span>Inflation-adjusted corpus</span>
                <span>{formatCurrency(retirementCorpus.recommended)}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border bg-background p-3">
            <p className="text-sm font-semibold">Retirement Income Sources</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span>Current Savings</span><span>{formatCurrency(inputs.accumulation.totalCurrentAssets)}</span></div>
              <div className="flex justify-between"><span>Projected at Retirement</span><span>{formatCurrency(inputs.accumulation.projectedNetWorthAtRetirement)}</span></div>
              <p className="text-xs text-muted-foreground">{projectedAtRetirementDerivation}</p>
              <div className="flex justify-between"><span>401(k) Withdrawal</span><span>{formatCurrency(inputs.retirement.projected401kWithdrawal)}/yr</span></div>
              <div className="flex justify-between"><span>Social Security</span><span>{formatCurrency(inputs.retirement.projectedSocialSecurity)}/yr</span></div>
              <div className="flex justify-between"><span>Pension</span><span>{formatCurrency(inputs.retirement.projectedPension)}/yr</span></div>
              <div className="flex justify-between border-t pt-1"><span>Total Income</span><span>{formatCurrency(retirementIncomeTotal)}/yr</span></div>
              <div className="flex justify-between"><span>Need</span><span>{formatCurrency(retirementExpenses.totalAnnual)}/yr</span></div>
              <div className="flex justify-between font-semibold text-[#E67E22]">
                <span>Annual Gap</span>
                <span>{formatCurrency(retirementAnnualGap)}/yr</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Monthly Gap</span>
                <span>{formatCurrency(retirementMonthlyGap)}/mo</span>
              </div>
              <div className="mt-1 flex justify-between border-t pt-1 font-semibold text-[#E74C3C]">
                <span>Retirement Deficit</span>
                <span>{formatCurrency(retirementDeficit)}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-[#00838F]/30 bg-[#00838F]/5 p-3 text-sm">
            {retirementDeficit > 0 ? (
              <p>
                ⚠ Your plan must generate <strong>{formatCompactCurrency(retirementMonthlyGap)}/mo</strong> above
                Social Security to meet your retirement goal. The Roth IRA and IUL recommendations address this gap.
              </p>
            ) : (
              <p>
                ✓ Current trajectory projects sufficient retirement income. Maintaining savings discipline is key.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="print:hidden rounded-xl border bg-card p-4">
        <details>
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#1B365D]">
            <Info className="size-4" />
            Agent Notes
          </summary>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>
              1. The red curve shows what the family would need today ({formatCurrency(curve.grossRisk)}). The green curve shows what has been built ({formatCurrency(inputs.accumulation.totalCurrentAssets)}). The gap is {formatCurrency(authoritativeCoverageGap)}.
            </p>
            <p>
              2. The curves cross at {curve.crossingAge === null ? "beyond age 90" : `age ${curve.crossingAge}`}. Retirement goal is age {inputs.retirement.targetAge}, which is {curve.crossingAge !== null && inputs.retirement.targetAge < curve.crossingAge ? "before crossing point." : "after crossing point."}
            </p>
            <p>
              3. DIME shows where {formatCurrency(curve.grossRisk)} comes from; the largest lever is income replacement ({formatCurrency(inputs.risk.annualIncome * editable.replacementYears)}) at {editable.replacementYears} years.
            </p>
            <p>
              4. Retirement projection shows a separate retirement deficit of {formatCurrency(retirementDeficit)}.
            </p>
          </div>
        </details>
      </section>

      <div className="flex justify-end">
        <Button onClick={onContinue} className="gap-1.5">
          Continue to Recommendations <ChevronRight className="size-4" />
        </Button>
      </div>

      <style jsx>{`
        .xcurve-diagram {
          animation: xcurveFadeIn 0.25s ease-out forwards;
        }
        .xcurve-responsibility-line {
          clip-path: inset(0 100% 0 0);
          animation: revealLine 1.2s ease-out 0.2s forwards;
        }
        .xcurve-money-line {
          clip-path: inset(0 100% 0 0);
          animation: revealLine 1.2s ease-out 0.6s forwards;
        }
        .xcurve-cross-pulse {
          opacity: 0;
          animation: crossPulse 0.4s ease-out 1.4s forwards;
        }
        @keyframes xcurveFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes revealLine {
          to {
            clip-path: inset(0 0 0 0);
          }
        }
        @keyframes crossPulse {
          0% {
            opacity: 0;
            transform: scale(0.7);
          }
          80% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
