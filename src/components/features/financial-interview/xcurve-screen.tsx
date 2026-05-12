"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Pencil, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters/currency";
import { DisclaimerBanner } from "@/components/shared/DisclaimerBanner";
import type { FinancialHealthScore } from "@/types/financial-interview";
import { XCurveHelpPanel } from "@/components/features/xcurve/XCurveHelpPanel";

type Dict = Record<string, unknown>;

type Child = {
  name: string;
  age: number;
  enrollmentYear?: number;
  projectedAnnualCostAtEnrollment?: number;
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
    consumerDebtTotal: number;
    debtBreakdown: Array<{ label: string; amount: number }>;
    debtDataCaptured: boolean;
    annualIncome: number;
    passiveIncomeAnnual: number;
    replacementYears: number;
    incomeReplacementRationale: string;
    mortgageBalance: number;
    mortgageMonthlyPiti: number;
    mortgageRateAnnual: number;
    mortgageRemainingYears: number;
    hasMortgage: boolean;
    educationNeed: number;
    educationExistingSavings: number;
    educationDerivation: string;
    educationChildren: Child[];
    finalExpenses: number;
    estateCosts: number;
    estateCostsDerivation: string;
    debtPayoffMonths: number;
    grossRisk: number;
    netRisk: number;
    coverageGap: number;
    coverageGapDeductions: Array<{ key: string; label: string; amount: number }>;
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
    monthlyDebtService: number;
    projectedNetWorthAtRetirement: number;
  };
  retirement: {
    targetAge: number;
    desiredMonthlyIncome: number;
    desiredAnnualIncome: number;
    yearsInRetirement: number;
    monthlyExpenses: number;
    monthlyExpensesInput: number;
    monthlyExpenseBreakdown: {
      housing: number;
      groceries: number;
      childcare: number;
      transportation: number;
      other: number;
    };
    projected401kWithdrawal: number;
    projectedSocialSecurity: number;
    socialSecurityMonthlyPrimary: number;
    socialSecurityMonthlySpouse: number;
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
    const currentChildAge = n(child.age);
    if (currentChildAge >= 18) {
      continue;
    }
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

function estimateRetirementExpenses(
  currentMonthlyExpenses: number,
  mortgageMonthlyPiti: number,
  debtServiceMonthly: number,
  debtPaidOffByRetirement: boolean,
  yearsWithMortgageInRetirement: number,
  yearsWithoutMortgageInRetirement: number,
  fallbackHousingMonthly: number,
  hasMortgage: boolean,
  currentFoodMonthly: number,
  currentTransportationMonthly: number,
  currentOtherMonthly: number
) {
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
      housingLabel: "Housing",
      housingNote: "",
      otherNote: "",
    };
  }
  const normalizedPiti = Math.max(0, mortgageMonthlyPiti);
  const normalizedDebt = Math.max(0, debtServiceMonthly);
  const debtInRetirement = debtPaidOffByRetirement ? 0 : normalizedDebt;
  const yearsWithMortgage = Math.max(0, yearsWithMortgageInRetirement);
  const yearsWithoutMortgage = Math.max(0, yearsWithoutMortgageInRetirement);
  const totalRetirementYearsForHousing = yearsWithMortgage + yearsWithoutMortgage;
  const postMortgageHousing = normalizedPiti > 0 ? Math.round(normalizedPiti * 0.12) : Math.max(0, fallbackHousingMonthly);
  let housingInRetirement = Math.max(0, fallbackHousingMonthly);
  let housingLabel = "Housing";
  let housingNote = "";

  if (hasMortgage && normalizedPiti > 0) {
    if (yearsWithMortgage <= 0) {
      housingInRetirement = postMortgageHousing;
      housingLabel = "Housing (taxes + insurance — mortgage paid before retirement)";
    } else if (yearsWithoutMortgage <= 0 || totalRetirementYearsForHousing <= 0) {
      housingInRetirement = normalizedPiti;
      housingLabel = "Housing (PITI — mortgage active throughout retirement period)";
    } else {
      housingInRetirement = Math.round(
        ((normalizedPiti * yearsWithMortgage) + (postMortgageHousing * yearsWithoutMortgage)) /
        totalRetirementYearsForHousing
      );
      housingLabel = "Housing (blended avg — PITI until mortgage payoff, taxes/insurance only after)";
      housingNote = `~${formatCurrency(normalizedPiti)}/mo while mortgage is active, ~${formatCurrency(postMortgageHousing)}/mo after payoff. Blended average used for ${totalRetirementYearsForHousing} retirement years.`;
    }
  }

  const nonHousingBase = Math.max(
    currentMonthlyExpenses - normalizedPiti - normalizedDebt,
    0
  );
  const baseWithoutDebt = nonHousingBase + housingInRetirement + debtInRetirement;
  const medical = Math.round(Math.max(baseWithoutDebt * 0.12, 1000));
  const insurancePremiums = Math.round(Math.max(baseWithoutDebt * 0.09, 600));
  const food = currentFoodMonthly > 0 ? Math.round(currentFoodMonthly) : Math.round(baseWithoutDebt * 0.2);
  const utilities = Math.round(baseWithoutDebt * 0.08);
  const transportation = currentTransportationMonthly > 0
    ? Math.round(currentTransportationMonthly)
    : 0;
  const isOtherFromMonthlyExpenses = currentOtherMonthly > 0;
  const other = isOtherFromMonthlyExpenses ? Math.round(currentOtherMonthly) : 400;
  const otherNote = isOtherFromMonthlyExpenses
    ? `~${formatCurrency(other)}/mo (from Monthly Expenses — other category)`
    : `~${formatCurrency(other)}/mo (estimated minimum — covers personal care, subscriptions, clothing, household maintenance, and miscellaneous expenses in retirement. Actual discretionary spending may vary. Enter specific amounts in Monthly Expenses for a more accurate figure.)`;
  const totalMonthly = Math.round(
    food +
      insurancePremiums +
      medical +
      housingInRetirement +
      utilities +
      transportation +
      other
  );
  return {
    food,
    insurancePremiums,
    medical,
    housing: housingInRetirement,
    utilities,
    transportation,
    other,
    totalMonthly,
    totalAnnual: totalMonthly * 12,
    housingLabel,
    housingNote,
    otherNote,
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
  const passiveIncomeAnnual = incomeSources.reduce<number>((sum, src) => {
    const s = (src as Dict | null) ?? {};
    const sourceType = String(s["type"] ?? "").toLowerCase();
    if (!["rental_income", "rental", "passive"].includes(sourceType)) {
      return sum;
    }
    return sum + n(s["annual"]);
  }, 0);

  const dependentsDetail = (pi["dependentsDetail"] as unknown[] | undefined) ?? [];
  const eduChildrenRaw = (goalEducation["children"] as unknown[] | undefined) ?? [];
  const fallbackChildren: Child[] = dependentsDetail.map((dep) => {
    const d = (dep as Dict | null) ?? {};
    return {
      name: String(d["name"] ?? d["childName"] ?? d["child_name"] ?? "Child"),
      age: n(d["age"] ?? d["childAge"] ?? d["child_age"]),
    };
  });
  const educationChildren: Child[] =
    eduChildrenRaw.length > 0
      ? eduChildrenRaw.map((c) => {
          const x = (c as Dict | null) ?? {};
          return {
            name: String(x["name"] ?? x["childName"] ?? x["child_name"] ?? "Child"),
            age: n(x["age"] ?? x["childAge"] ?? x["child_age"]),
            enrollmentYear: n(
              x["enrollmentYear"] ??
                x["enrollment_year"] ??
                x["collegeStartYear"] ??
                x["college_start_year"]
            ),
            projectedAnnualCostAtEnrollment: n(
              x["projectedAnnualCostAtEnrollment"] ??
                x["projected_annual_cost_at_enrollment"] ??
                x["annualCostAtEnrollment"] ??
                x["annual_cost_at_enrollment"]
            ),
            projectedTotalNeed: n(
              x["projectedTotalNeed"] ??
                x["projected_total_need"] ??
                x["totalNeed"] ??
                x["total_need"]
            ),
          };
        })
      : fallbackChildren;
  const eligibleEducationChildren = educationChildren.filter((child) => child.age < 18);
  const hasAdultOnlyDependents =
    educationChildren.length > 0 && eligibleEducationChildren.length === 0;

  const debtEntries = (debt["debts"] as unknown[] | undefined) ?? [];
  const debtBreakdownFromDebts = debtEntries.map((d) => {
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
  const spouseBackground =
    ((pi["spouse_background"] as Dict | undefined) ??
      (pi["spouseBackground"] as Dict | undefined) ??
      {});
  const primaryResidenceDetail =
    (primaryResidence["primaryResidence"] as Dict | undefined) ??
    (primaryResidence["primary_residence"] as Dict | undefined) ??
    {};
  const primaryBackground =
    ((pi["primary_background"] as Dict | undefined) ??
      (pi["primaryBackground"] as Dict | undefined) ??
      {});

  const sumMonthlyExpenses = (background: Dict): number => {
    const section =
      ((background["monthly_expenses"] as Dict | undefined) ??
        (background["monthlyExpenses"] as Dict | undefined) ??
        {});
    return Object.values(section as Record<string, unknown>).reduce<number>((sum, value) => {
      const amount = Number(value ?? 0);
      return Number.isFinite(amount) ? sum + amount : sum;
    }, 0);
  };
  const getMonthlyExpenseSection = (background: Dict): Dict =>
    ((background["monthly_expenses"] as Dict | undefined) ??
      (background["monthlyExpenses"] as Dict | undefined) ??
      {});

  const mortgageFromCase =
    n(primaryResidenceDetail["mortgageBalance"] ?? primaryResidenceDetail["mortgage_balance"]) ||
    n(pi["mortgageBalance"]);
  const mortgageMonthlyPiti = n(
    primaryResidenceDetail["monthlyPaymentPiti"] ??
      primaryResidenceDetail["monthly_payment_piti"] ??
      primaryResidence["monthlyPaymentPiti"] ??
      primaryResidence["monthly_payment_piti"]
  );
  const hsRealEstateAnalysis =
    (hs["realEstateAnalysis"] as Dict | undefined) ??
    (hs["real_estate_analysis"] as Dict | undefined) ??
    {};
  const hsRealEstatePrimary =
    (hsRealEstateAnalysis["primary"] as Dict | undefined) ??
    (hsRealEstateAnalysis["primaryResidence"] as Dict | undefined) ??
    (hsRealEstateAnalysis["primary_residence"] as Dict | undefined) ??
    {};
  const realEstateAnalysis =
    (fa["realEstateAnalysis"] as Dict | undefined) ??
    (fa["real_estate_analysis"] as Dict | undefined) ??
    {};
  const realEstatePrimary =
    (realEstateAnalysis["primary"] as Dict | undefined) ??
    (realEstateAnalysis["primaryResidence"] as Dict | undefined) ??
    (realEstateAnalysis["primary_residence"] as Dict | undefined) ??
    {};
  const resolvedMortgageMonthlyPiti =
    n(
      realEstatePrimary["monthlyPaymentPiti"] ??
        realEstatePrimary["monthly_payment_piti"] ??
        realEstatePrimary["monthlyPayment"] ??
        realEstatePrimary["monthly_payment"]
    ) ||
    n(
      hsRealEstatePrimary["monthlyPaymentPiti"] ??
        hsRealEstatePrimary["monthly_payment_piti"] ??
        hsRealEstatePrimary["monthlyPayment"] ??
        hsRealEstatePrimary["monthly_payment"]
    ) ||
    n(xcurve["mortgageMonthlyPayment"] ?? xcurve["mortgage_monthly_payment"]) ||
    mortgageMonthlyPiti;
  const primaryMonthlyExpensesInput = sumMonthlyExpenses(primaryBackground);
  const spouseMonthlyExpensesInput = sumMonthlyExpenses(spouseBackground);
  const monthlyExpensesInput = Math.max(
    primaryMonthlyExpensesInput,
    spouseMonthlyExpensesInput
  );
  const goalRetirementMonthlyExpenses =
    (goalRet["retirementMonthlyExpenses"] as Dict | undefined) ??
    (goalRet["retirement_monthly_expenses"] as Dict | undefined) ??
    {};
  const goalRetComputed =
    (goalRet["computed"] as Dict | undefined) ?? {};
  const chosenMonthlyExpenseSection =
    primaryMonthlyExpensesInput >= spouseMonthlyExpensesInput
      ? getMonthlyExpenseSection(primaryBackground)
      : getMonthlyExpenseSection(spouseBackground);
  const monthlyExpenseBreakdown = {
    housing: n(chosenMonthlyExpenseSection["housing"]),
    groceries: n(
      goalRetirementMonthlyExpenses["foodGroceries"] ??
        goalRetirementMonthlyExpenses["food_groceries"] ??
        chosenMonthlyExpenseSection["food_groceries"] ??
        chosenMonthlyExpenseSection["groceries"] ??
        goalRetComputed["checklistFood"] ??
        goalRetComputed["checklist_food"]
    ),
    childcare: n(
      chosenMonthlyExpenseSection["childcare"] ??
        chosenMonthlyExpenseSection["childcareEducation"] ??
        chosenMonthlyExpenseSection["childcare_education"]
    ),
    transportation: n(
      chosenMonthlyExpenseSection["transportation"] ??
        goalRetirementMonthlyExpenses["transportation"] ??
        goalRetComputed["checklistTransportation"] ??
        goalRetComputed["checklist_transportation"]
    ),
    other: n(
      goalRetirementMonthlyExpenses["other"] ??
        chosenMonthlyExpenseSection["other"] ??
        chosenMonthlyExpenseSection["other_expenses"] ??
        goalRetComputed["checklistOther"] ??
        goalRetComputed["checklist_other"]
    ),
  };
  const extractSocialSecurityMonthlyFRA = (background: Dict): number => {
    const ss =
      ((background["social_security"] as Dict | undefined) ??
        (background["socialSecurity"] as Dict | undefined) ??
        {});
    return n(
      ss["estimatedMonthlyBenefitFRA"] ??
        ss["estimated_monthly_benefit_fra"] ??
        ss["estimatedBenefitFRA"] ??
        ss["estimated_benefit_fra"]
    );
  };
  const primarySocialSecurityMonthly = extractSocialSecurityMonthlyFRA(primaryBackground);
  const spouseSocialSecurityMonthly = extractSocialSecurityMonthlyFRA(spouseBackground);
  const mortgageRateAnnual = n(
    primaryResidenceDetail["mortgageRate"] ??
      primaryResidenceDetail["mortgage_rate"] ??
      primaryResidenceDetail["interestRate"] ??
      primaryResidenceDetail["interest_rate"] ??
      realEstatePrimary["mortgageRate"] ??
      realEstatePrimary["mortgage_rate"] ??
      realEstatePrimary["interestRate"] ??
      realEstatePrimary["interest_rate"]
  );
  const mortgageRemainingYears = n(
    primaryResidenceDetail["remainingTermYears"] ??
      primaryResidenceDetail["remaining_term_years"] ??
      primaryResidenceDetail["mortgageRemainingYears"] ??
      primaryResidenceDetail["mortgage_remaining_years"] ??
      realEstatePrimary["remainingTermYears"] ??
      realEstatePrimary["remaining_term_years"]
  );

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
  const xcurveEstateProbate =
    n(xcurveByKey.get("estate_probate")) || n(xcurveByKey.get("estate_probate_cost"));
  const xcurveDebtDetail =
    (((xcurve["dimeDebtDetail"] as Dict | undefined) ??
      (xcurve["dime_debt_detail"] as Dict | undefined)) as Dict | undefined) ?? {};
  const rentalDetailRaw = (
    (xcurveDebtDetail["rentalMortgageDetail"] as unknown[] | undefined) ??
    (xcurveDebtDetail["rental_mortgage_detail"] as unknown[] | undefined) ??
    []
  );
  const consumerDetailRaw = (
    (xcurveDebtDetail["consumerDebtDetail"] as unknown[] | undefined) ??
    (xcurveDebtDetail["consumer_debt_detail"] as unknown[] | undefined) ??
    []
  );
  const rentalDetailRows = rentalDetailRaw
    .map((raw) => {
      const row = (raw as Dict | null) ?? {};
      return {
        label: String(row["label"] ?? "Rental mortgage"),
        amount: n(row["amount"]),
      };
    })
    .filter((row) => row.amount > 0);
  const consumerDetailRows = consumerDetailRaw
    .map((raw) => {
      const row = (raw as Dict | null) ?? {};
      return {
        label: String(row["label"] ?? "Consumer debt"),
        amount: n(row["amount"]),
      };
    })
    .filter((row) => row.amount > 0);
  const debtBreakdownFromXCurve =
    rentalDetailRows.length > 0 || consumerDetailRows.length > 0
      ? [...rentalDetailRows, ...consumerDetailRows]
      : [
          {
            label: "Rental mortgages",
            amount: n(xcurveDebtDetail["rentalMortgages"] ?? xcurveDebtDetail["rental_mortgages"]),
          },
          {
            label: "Consumer debts",
            amount: n(xcurveDebtDetail["consumerDebts"] ?? xcurveDebtDetail["consumer_debts"]),
          },
        ].filter((row) => row.amount > 0);
  const debtBreakdown =
    debtBreakdownFromXCurve.length > 0 ? debtBreakdownFromXCurve : debtBreakdownFromDebts;
  const debtDataCaptured =
    Boolean(xcurve["debtDataCaptured"] ?? xcurve["debt_data_captured"]) ||
    debtBreakdownFromDebts.length > 0 ||
    debtBreakdownFromXCurve.length > 0;
  const xcurveIncomeYears = n(
    xcurve["income_replacement_years"] ?? xcurve["incomeReplacementYears"]
  );
  const xcurveIncomeRationale = String(
    xcurve["income_replacement_rationale"] ?? xcurve["incomeReplacementRationale"] ?? ""
  ).trim();
  const hasEducationFundFromXCurve = xcurveByKey.has("education_fund");
  const educationDerivation = hasEducationFundFromXCurve
    ? "Projected college costs from your family profile."
    : (eligibleEducationChildren.length === 0
        ? "No college-age children (all dependents are 18+)"
        : "Derived from children profiles and education funding assumptions.");

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

  const coverageChainRaw =
    ((goalCoverage["coverageGapChain"] as Dict | undefined) ??
      (goalCoverage["coverage_gap_chain"] as Dict | undefined) ??
      {}) as Dict;
  const coverageChainDeductionsRaw =
    ((coverageChainRaw["deductions"] as unknown[] | undefined) ?? []);
  const coverageGapDeductions = coverageChainDeductionsRaw.map((row) => {
    const r = (row as Dict | null) ?? {};
    return {
      key: String(r["key"] ?? "deduction"),
      label: String(r["label"] ?? "Deduction"),
      amount: n(r["amount"]),
    };
  });
  const grossRisk =
    n(coverageChainRaw["grossRisk"] ?? coverageChainRaw["gross_risk"]) ||
    n(goalCoverage["dimeTotal"] ?? goalCoverage["dime_total"]);
  const netRisk =
    n(coverageChainRaw["netRisk"] ?? coverageChainRaw["net_risk"]) ||
    n(goalCoverage["netRisk"] ?? goalCoverage["net_risk"]) ||
    Math.max(0, grossRisk - totalAssets);
  const coverageGap =
    n(coverageChainRaw["coverageGap"] ?? coverageChainRaw["coverage_gap"]) ||
    n(goalCoverage["coverageGap"] ?? goalCoverage["coverage_gap"]) ||
    Math.max(0, netRisk - existingLifeCoverage);

  return {
    client: {
      primaryAge,
      primaryName: String(pi["firstName"] ?? cd["clientName"] ?? "Client"),
      spouseName: pi["partnerFirstName"] ? String(pi["partnerFirstName"]) : null,
      children: educationChildren,
    },
    risk: {
      totalDebt: xcurveDebtPayoff || n(debt["totalConsumerDebt"] ?? debt["total_consumer_debt"]),
      consumerDebtTotal: n(debt["totalConsumerDebt"] ?? debt["total_consumer_debt"]),
      debtBreakdown,
      debtDataCaptured,
      annualIncome,
      passiveIncomeAnnual,
      replacementYears,
      incomeReplacementRationale: derivedIncomeRationale,
      mortgageBalance: resolvedMortgage,
      mortgageMonthlyPiti: resolvedMortgageMonthlyPiti,
      mortgageRateAnnual,
      mortgageRemainingYears,
      hasMortgage: resolvedMortgage > 0,
      educationNeed: hasEducationFundFromXCurve
        ? n(xcurveEducation)
        : (eligibleEducationChildren.length > 0
            ? n(goalEducation["projectedTotalEducationNeed"] ?? goalEducation["projected_total_education_need"])
            : 0),
      educationExistingSavings: n(
        goalEducation["existingEducationAssets"] ?? goalEducation["existing_education_assets"]
      ),
      educationDerivation,
      educationChildren,
      finalExpenses: xcurveFinalExpenses || 25_000,
      estateCosts:
        xcurveByKey.size > 0
          ? xcurveEstateProbate
          : n(goalEstate["baseEstateNeed"] ?? goalEstate["base_estate_need"]),
      estateCostsDerivation:
        (xcurveFormulaByKey.get("estate_probate") ||
          xcurveFormulaByKey.get("estate_probate_cost") ||
          "").trim() ||
        (xcurveEstateProbate > 0
          ? "Estimated probate cost for estate settlement when no trust is in place."
          : "Trust in place - probate avoided"),
      debtPayoffMonths:
        n(((debt["avalancheStrategy"] as Dict | undefined) ?? {})["payoffMonths"]) || 36,
      grossRisk,
      netRisk,
      coverageGap,
      coverageGapDeductions,
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
      monthlyDebtService: n(cashFlow["monthlyDebtService"] ?? cashFlow["monthly_debt_service"]),
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
      monthlyExpenses: (() => {
        const rawMonthlyExpenses =
          n(cashFlow["totalMonthlyExpenses"] ?? cashFlow["total_monthly_expenses"]) || 0;
        // Remove inferred childcare/education expense when all dependents are adults.
        // This keeps retirement projections aligned with "Childcare/Edu N/A".
        if (hasAdultOnlyDependents && rawMonthlyExpenses > 0) {
          const inferredChildcareEdu = Math.round(rawMonthlyExpenses * 0.12);
          return Math.max(0, rawMonthlyExpenses - inferredChildcareEdu);
        }
        return rawMonthlyExpenses;
      })(),
      monthlyExpensesInput:
        monthlyExpensesInput > 0
          ? monthlyExpensesInput
          : n(cashFlow["totalMonthlyExpenses"] ?? cashFlow["total_monthly_expenses"]) || 0,
      monthlyExpenseBreakdown,
      projected401kWithdrawal: n(
        goalRet["projectedAnnual401kWithdrawal"] ?? goalRet["projected_annual_401k_withdrawal"]
      ),
      projectedSocialSecurity: n(
        goalRet["projectedSocialSecurityAnnual"] ?? goalRet["projected_social_security_annual"]
      ),
      socialSecurityMonthlyPrimary: primarySocialSecurityMonthly,
      socialSecurityMonthlySpouse: spouseSocialSecurityMonthly,
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

export function computeXCurveCrossingAgeForDashboard(
  caseData: unknown,
  healthScore: FinancialHealthScore | null | undefined,
  fullAnalysis: unknown,
  xcurveData?: unknown
): number | null {
  const inputs = deriveXCurveInputs(caseData, healthScore, fullAnalysis, xcurveData);
  const editable: DimeEditable = {
    debt: inputs.risk.totalDebt,
    replacementYears: inputs.risk.replacementYears,
    mortgage: inputs.risk.mortgageBalance,
    education: inputs.risk.educationNeed,
    finalExpenses: inputs.risk.finalExpenses,
  };
  return buildCurve(inputs, editable).crossingAge;
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
    editable.education +
    inputs.risk.estateCosts;
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
  const consumerDebtTotal = Math.max(0, inputs.risk.consumerDebtTotal);
  const nonConsumerDebt = Math.max(0, inputs.risk.totalDebt - consumerDebtTotal);
  const hasMortgageDebt = currentMortgageBalance > 0 || nonConsumerDebt > 0;
  const debtFreeAge =
    consumerDebtTotal > 0 ? currentAge + Math.ceil(inputs.risk.debtPayoffMonths / 12) : null;
  const debtMilestoneLabel =
    debtFreeAge !== null && debtFreeAge <= 90
      ? `Consumer debt-free by ${debtFreeAge}`
      : (!hasMortgageDebt ? "Debt-free" : null);
  return {
    currentAge,
    retirementAge: inputs.retirement.targetAge,
    childrenCollege,
    mortgagePayoff:
      mortgagePayoff !== null && mortgagePayoff <= 90 ? mortgagePayoff : null,
    debtMilestoneLabel,
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

function formatIncomeLabel(annualIncome: number): string {
  const v = Math.max(0, Math.round(annualIncome));
  if (v >= 1_000_000) {
    const rounded = Math.round(v / 50_000) * 50_000;
    const millions = rounded / 1_000_000;
    return `$${millions.toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (v >= 1_000) {
    return `$${Math.round(v / 1_000)}K`;
  }
  return `$${v}`;
}

function estimateMortgageBalanceAtRetirement(
  currentBalance: number,
  annualRatePct: number,
  remainingYears: number,
  yearsToRetirement: number
): number {
  const balance = Math.max(0, currentBalance);
  const yearsRemaining = Math.max(0, remainingYears);
  const yearsUntilRetirement = Math.max(0, yearsToRetirement);
  if (balance <= 0 || yearsRemaining <= 0) return 0;
  if (yearsUntilRetirement >= yearsRemaining) return 0;

  const monthlyRate = Math.max(0, annualRatePct) / 100 / 12;
  const totalMonths = Math.round(yearsRemaining * 12);
  const monthsUntilRetirement = Math.round(yearsUntilRetirement * 12);

  if (monthlyRate <= 0) {
    const remainingRatio = Math.max(0, (totalMonths - monthsUntilRetirement) / Math.max(totalMonths, 1));
    return balance * remainingRatio;
  }

  const monthlyPayment =
    balance * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths)));
  const remaining =
    balance * Math.pow(1 + monthlyRate, monthsUntilRetirement) -
    monthlyPayment * ((Math.pow(1 + monthlyRate, monthsUntilRetirement) - 1) / monthlyRate);
  return Math.max(0, remaining);
}

function getResponsibilities(inputs: XCurveInputs, editable: DimeEditable) {
  const monthlyBase = Math.max(
    0,
    inputs.retirement.monthlyExpensesInput || inputs.retirement.monthlyExpenses
  );
  const eligibleChildrenCount = (inputs.client.children ?? []).filter((child) => n(child.age) < 18).length;
  const hasHousingPiti = inputs.risk.mortgageMonthlyPiti > 0;
  const housing = hasHousingPiti
    ? inputs.risk.mortgageMonthlyPiti
    : inputs.risk.hasMortgage
      ? 0
    : !inputs.risk.hasMortgage && inputs.retirement.monthlyExpenseBreakdown.housing > 0
      ? inputs.retirement.monthlyExpenseBreakdown.housing
      : Math.round(monthlyBase * 0.3);
  const remaining = Math.max(0, monthlyBase - housing);
  const childcareEdu = eligibleChildrenCount > 0
    ? (inputs.retirement.monthlyExpenseBreakdown.childcare > 0
        ? inputs.retirement.monthlyExpenseBreakdown.childcare
        : Math.round(remaining * 0.3))
    : 0;
  const food = inputs.retirement.monthlyExpenseBreakdown.groceries > 0
    ? inputs.retirement.monthlyExpenseBreakdown.groceries
    : Math.round(remaining * (eligibleChildrenCount > 0 ? 0.5 : 0.7));
  const hasTransportation = inputs.retirement.monthlyExpenseBreakdown.transportation > 0;
  const transportation = hasTransportation
    ? inputs.retirement.monthlyExpenseBreakdown.transportation
    : 0;
  const debtStatus =
    editable.debt > 0 ? `${formatAmountCompact(editable.debt)} total` : "Debt-free";
  const mortgageStatus =
    editable.mortgage > 0 ? formatAmount(editable.mortgage) : "No mortgage";
  return [
    {
      label: hasHousingPiti ? "Housing (PITI)" : "Housing",
      value:
        (hasHousingPiti || (!inputs.risk.hasMortgage && monthlyBase > 0))
          ? `${formatAmount(housing)}/mo`
          : "Not captured",
    },
    { label: "Food/Groceries", value: monthlyBase > 0 ? `${formatAmount(food)}/mo` : "Not captured" },
    { label: "Childcare/Edu", value: eligibleChildrenCount > 0 ? `${formatAmount(childcareEdu)}/mo` : "N/A" },
    {
      label: "Transportation",
      value: hasTransportation ? `${formatAmount(transportation)}/mo` : "Not captured",
    },
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
  zeroMessage,
}: {
  letter: string;
  title: string;
  colorClass: string;
  amount: number;
  onChange: (next: number) => void;
  subtitle?: string;
  breakdown?: Array<{ label: string; amount: number }>;
  zeroMessage?: string;
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
          {zeroMessage || "No data captured. Click the pencil icon to add this value."}
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
  const [educationDerivationExpanded, setEducationDerivationExpanded] =
    useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    return fromGoal > 0 ? fromGoal : inputs.risk.coverageGap;
  }, [fullAnalysis, inputs.risk.coverageGap]);
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
    const yearsToRetirement = Math.max(
      0,
      inputs.retirement.targetAge - inputs.client.primaryAge
    );
    const retirementEndAge = 90;
    const payoffAge = milestones.mortgagePayoff;
    const yearsWithMortgageInRetirement =
      payoffAge === null
        ? Math.max(0, retirementEndAge - inputs.retirement.targetAge)
        : Math.max(0, Math.min(payoffAge, retirementEndAge) - inputs.retirement.targetAge);
    const yearsWithoutMortgageInRetirement =
      payoffAge === null
        ? 0
        : Math.max(0, retirementEndAge - Math.max(payoffAge, inputs.retirement.targetAge));
    const debtPaidOffByRetirement =
      inputs.risk.debtPayoffMonths > 0 &&
      inputs.risk.debtPayoffMonths <= yearsToRetirement * 12;
    const baselineMonthly =
      inputs.retirement.monthlyExpensesInput > 0
        ? inputs.retirement.monthlyExpensesInput
        : inputs.retirement.monthlyExpenses > 0
          ? inputs.retirement.monthlyExpenses
        : inputs.retirement.desiredMonthlyIncome > 0
          ? inputs.retirement.desiredMonthlyIncome
          : Math.round((inputs.risk.annualIncome * 0.5) / 12);
    return estimateRetirementExpenses(
      Math.max(0, baselineMonthly),
      inputs.risk.mortgageMonthlyPiti,
      inputs.accumulation.monthlyDebtService,
      debtPaidOffByRetirement,
      yearsWithMortgageInRetirement,
      yearsWithoutMortgageInRetirement,
      inputs.retirement.monthlyExpenseBreakdown.housing,
      inputs.risk.hasMortgage,
      inputs.retirement.monthlyExpenseBreakdown.groceries,
      inputs.retirement.monthlyExpenseBreakdown.transportation,
      inputs.retirement.monthlyExpenseBreakdown.other
    );
  }, [
    inputs.client.primaryAge,
    inputs.retirement.monthlyExpensesInput,
    inputs.retirement.monthlyExpenses,
    inputs.retirement.desiredMonthlyIncome,
    inputs.retirement.targetAge,
    inputs.risk.annualIncome,
    inputs.risk.mortgageMonthlyPiti,
    inputs.risk.hasMortgage,
    inputs.risk.debtPayoffMonths,
    inputs.accumulation.monthlyDebtService,
    inputs.retirement.monthlyExpenseBreakdown.housing,
    inputs.retirement.monthlyExpenseBreakdown.groceries,
    inputs.retirement.monthlyExpenseBreakdown.transportation,
    milestones.mortgagePayoff,
  ]);

  const retirementCorpus = useMemo(
    () =>
      calculateRetirementCorpus(retirementExpenses.totalAnnual, inputs.retirement.yearsInRetirement, 0.03),
    [retirementExpenses.totalAnnual, inputs.retirement.yearsInRetirement]
  );

  const socialSecurityFRAAge = 67;
  const socialSecurityEarliestClaimAge = 62;
  const socialSecurityPrimaryMonthlyInput = Math.max(0, inputs.retirement.socialSecurityMonthlyPrimary);
  const socialSecuritySpouseMonthlyInput = Math.max(0, inputs.retirement.socialSecurityMonthlySpouse);
  const socialSecurityCombinedMonthlyInput =
    socialSecurityPrimaryMonthlyInput + socialSecuritySpouseMonthlyInput;
  const socialSecurityEntered = socialSecurityCombinedMonthlyInput > 0;
  const fullSocialSecurityAnnual = socialSecurityEntered ? socialSecurityCombinedMonthlyInput * 12 : 0;
  const socialSecurityTiming = useMemo(() => {
    if (!socialSecurityEntered) {
      return {
        annual: 0,
        monthly: 0,
        note: "Social Security not entered. If you have a Social Security estimate, enter it in Investments & Assets → Social Security Estimate to include it in this projection.",
      };
    }
    const retirementAge = inputs.retirement.targetAge;
    if (retirementAge < socialSecurityEarliestClaimAge) {
      return {
        annual: 0,
        monthly: 0,
        note: `Social Security cannot be claimed before age ${socialSecurityEarliestClaimAge}. Estimated Social Security gap: ${socialSecurityEarliestClaimAge - retirementAge} years (age ${retirementAge} to ${socialSecurityEarliestClaimAge}).`,
      };
    }
    if (retirementAge < socialSecurityFRAAge) {
      const yearsEarly = socialSecurityFRAAge - retirementAge;
      const reductionPct = Math.min(30, Math.max(0, (yearsEarly / (socialSecurityFRAAge - socialSecurityEarliestClaimAge)) * 30));
      const factor = 1 - reductionPct / 100;
      const annual = Math.max(0, fullSocialSecurityAnnual * factor);
      return {
        annual,
        monthly: annual / 12,
        note: `Early claim assumed at age ${retirementAge} with ~${reductionPct.toFixed(0)}% reduction vs Full Retirement Age ${socialSecurityFRAAge}.`,
      };
    }
    return {
      annual: fullSocialSecurityAnnual,
      monthly: fullSocialSecurityAnnual / 12,
      note: `Full Retirement Age ${socialSecurityFRAAge} benefit assumption.`,
    };
  }, [inputs.retirement.targetAge, fullSocialSecurityAnnual, socialSecurityEntered]);
  const retirementIncomeTotal =
    inputs.retirement.projected401kWithdrawal +
    socialSecurityTiming.annual +
    inputs.retirement.projectedPension;
  const replacementYearOptions = useMemo(() => {
    const defaults = [5, 7, 8, 10, 12, 15, 20];
    const current = Math.round(editable.replacementYears);
    if (current > 0 && !defaults.includes(current)) {
      return [...defaults, current].sort((a, b) => a - b);
    }
    return defaults;
  }, [editable.replacementYears]);
  const educationDisplayRows = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const rawRows = inputs.risk.educationChildren.map((child, idx) => {
      const age = Math.max(0, Math.round(n(child.age)));
      const collegeAgeReached = age >= 18;
      const defaultStartYear = collegeAgeReached ? currentYear : currentYear + Math.max(1, 18 - age);
      const startYear =
        child.enrollmentYear && child.enrollmentYear > 0
          ? child.enrollmentYear
          : defaultStartYear;
      const yearsUntilCollege = Math.max(0, startYear - currentYear);
      const baselineAnnualAtEnrollment = 38_000 * Math.pow(1.05, yearsUntilCollege);
      const rawAnnual =
        child.projectedAnnualCostAtEnrollment && child.projectedAnnualCostAtEnrollment > 0
          ? child.projectedAnnualCostAtEnrollment
          : collegeAgeReached
            ? 0
            : baselineAnnualAtEnrollment;
      const rawTotal =
        child.projectedTotalNeed && child.projectedTotalNeed > 0
          ? child.projectedTotalNeed
          : rawAnnual * 4;
      return {
        key: `${child.name}_${idx}`,
        name: child.name || `Child ${idx + 1}`,
        age,
        collegeAgeReached,
        startYear,
        rawAnnual,
        rawTotal,
      };
    });
    const hasServiceChildTotals = rawRows.some((row) => row.rawTotal > 0);
    const rawTotalSum = rawRows.reduce((sum, row) => sum + row.rawTotal, 0);
    const authoritativeEducationNeed = Math.max(0, editable.education);
    const scaleFactor =
      !hasServiceChildTotals && rawTotalSum > 0 && authoritativeEducationNeed > 0
        ? authoritativeEducationNeed / rawTotalSum
        : 1;
    return rawRows.map((row) => ({
      ...row,
      annualAtEnrollment: row.rawAnnual * scaleFactor,
      totalNeed: row.rawTotal * scaleFactor,
    }));
  }, [inputs.risk.educationChildren, editable.education]);

  const retirementAnnualGap = Math.max(
    0,
    retirementExpenses.totalAnnual - retirementIncomeTotal
  );
  const retirementMonthlyGap = Math.max(0, retirementAnnualGap / 12);
  const retirementDeficit = retirementAnnualGap;
  const retirementMonthlySurplus = Math.max(0, (retirementIncomeTotal - retirementExpenses.totalAnnual) / 12);
  const inflatedNeedAtAge90 = retirementExpenses.totalAnnual * Math.pow(1.03, 30);
  const estimated401kBalanceAtRetirement =
    inputs.retirement.projected401kWithdrawal > 0
      ? inputs.retirement.projected401kWithdrawal / 0.04
      : 0;
  const projectedMortgageBalanceAtRetirement = useMemo(() => {
    const yearsToRetirement = Math.max(0, inputs.retirement.targetAge - inputs.client.primaryAge);
    const fallbackRemainingYears =
      milestones.mortgagePayoff !== null
        ? Math.max(0, milestones.mortgagePayoff - inputs.client.primaryAge)
        : 0;
    const effectiveRemainingYears =
      inputs.risk.mortgageRemainingYears > 0 ? inputs.risk.mortgageRemainingYears : fallbackRemainingYears;
    return estimateMortgageBalanceAtRetirement(
      inputs.risk.mortgageBalance,
      inputs.risk.mortgageRateAnnual,
      effectiveRemainingYears,
      yearsToRetirement
    );
  }, [
    milestones.mortgagePayoff,
    inputs.retirement.targetAge,
    inputs.client.primaryAge,
    inputs.risk.mortgageBalance,
    inputs.risk.mortgageRateAnnual,
    inputs.risk.mortgageRemainingYears,
  ]);
  const projectedAtRetirementDerivation = useMemo(() => {
    const years = Math.max(0, inputs.retirement.targetAge - inputs.client.primaryAge);
    const annualSavings = Math.max(0, inputs.accumulation.monthlySurplus) * 12;
    const growthRateAssumedPct = 6;
    return `Derived from: current assets (${formatCurrency(
      inputs.accumulation.totalCurrentAssets
    )}) grown at assumed rate over ${years} years + annual savings of ${formatCurrency(
      annualSavings
    )}/yr compounded. Minus outstanding mortgage balance at retirement (~${formatCurrency(
      projectedMortgageBalanceAtRetirement
    )}) and other projected liabilities. Growth rate assumed: ${growthRateAssumedPct}%. This is an estimate — actual results will vary.`;
  }, [
    inputs.retirement.targetAge,
    inputs.client.primaryAge,
    inputs.accumulation.monthlySurplus,
    inputs.accumulation.totalCurrentAssets,
    projectedMortgageBalanceAtRetirement,
  ]);
  const formatEstimatedCurrency = (value: number): string =>
    `~$${Math.round(Math.max(0, value)).toLocaleString()}`;
  const displayedProjectedAtRetirement = Math.max(
    0,
    inputs.accumulation.projectedNetWorthAtRetirement - projectedMortgageBalanceAtRetirement
  );

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
  const existingAssetsDeduction =
    inputs.risk.coverageGapDeductions.find((row) => row.key === "existing_assets")?.amount ??
    inputs.accumulation.totalCurrentAssets;
  const postNetDeductions = inputs.risk.coverageGapDeductions.filter(
    (row) => row.key !== "existing_assets"
  );
  const helpPanelCaseData = useMemo(
    () => ({
      coverageGap: authoritativeCoverageGap,
      incomeI: inputs.risk.annualIncome * editable.replacementYears,
      multiplierYears: editable.replacementYears,
      retirementAge: inputs.retirement.targetAge,
      crossingPointAge: curve.crossingAge,
      monthlyRetirementGap: retirementMonthlyGap,
      primaryClientName: inputs.client.primaryName,
    }),
    [
      authoritativeCoverageGap,
      inputs.risk.annualIncome,
      editable.replacementYears,
      inputs.retirement.targetAge,
      curve.crossingAge,
      retirementMonthlyGap,
      inputs.client.primaryName,
    ]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#1B365D]">Financial X-Curve</h2>
            <p className="text-sm text-muted-foreground">Your lifetime financial risk vs accumulation</p>
          </div>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            title="How does this work?"
            className="inline-flex items-center gap-2 rounded-full border border-[#0D3B6E]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#0D3B6E] hover:bg-[#0D3B6E]/5"
          >
            <span aria-hidden="true">📖</span>
            How is this calculated?
          </button>
        </div>
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
              milestones.debtMilestoneLabel,
              `${formatAmount(inputs.retirement.desiredMonthlyIncome || retirementIncomeTotal / 12)}/mo passive`,
            ]
              .filter((item): item is string => Boolean(item))
              .map((item, idx) => (
              <g key={`target-${idx}`}>
                <text x={freedomCheckX} y={rightDataStartY + idx * lineHeight} fill="#8B0000" fontSize="13" fontWeight="700">✓</text>
                <text x={freedomTextX} y={rightDataStartY + idx * lineHeight} fill="#8B0000" fontSize="13">{truncateText(item, 24)}</text>
              </g>
            ))}

            <text x={svgWidth * 0.25} y={lowerTextStartY} fill="#1B365D" fontSize="16" fontWeight="700" textDecoration="underline" textAnchor="middle">Active Income</text>
            <text x={svgWidth * 0.25} y={lowerTextStartY + 20} fill="#1B365D" fontSize="13" textAnchor="middle">(Man At Work)</text>
            <text x={svgWidth * 0.25} y={lowerTextStartY + 42} fill="#1B365D" fontSize="12" textAnchor="middle">
              {inputs.client.primaryName} earns {formatIncomeLabel(Math.max(inputs.risk.annualIncome - inputs.risk.passiveIncomeAnnual, 0))}/yr
            </text>

            <text x={svgWidth * 0.75} y={lowerTextStartY} fill="#8B0000" fontSize="16" fontWeight="700" textDecoration="underline" textAnchor="middle">Passive Income</text>
            <text x={svgWidth * 0.75} y={lowerTextStartY + 20} fill="#8B0000" fontSize="13" textAnchor="middle">(Money At Work)</text>
            <text x={svgWidth * 0.75} y={lowerTextStartY + 42} fill="#8B0000" fontSize="12" textAnchor="middle">
              Current {formatAmount(inputs.risk.passiveIncomeAnnual / 12)}/mo; target {formatAmount(inputs.retirement.desiredMonthlyIncome || retirementIncomeTotal / 12)}/mo by age {inputs.retirement.targetAge}
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
            <p className="text-base font-bold text-[#1B365D]">a. IF SOMETHING HAPPENS TO YOU</p>
            <p className="text-sm font-semibold text-[#1B365D]">PROTECT YOUR FAMILY</p>
            <p className="text-xs text-muted-foreground">(Life Insurance / Income Replacement)</p>
            <p className="mt-1 font-mono text-lg font-bold text-[#E74C3C]">Coverage Gap: {formatCurrency(authoritativeCoverageGap)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total DIME risk is {formatCurrency(inputs.risk.grossRisk)}; after current assets and existing life insurance, the remaining gap is{" "}
              {formatCurrency(authoritativeCoverageGap)}.
            </p>
          </div>
          <div className="rounded-lg border border-[#8B0000]/35 bg-white p-3">
            <p className="text-base font-bold text-[#8B0000]">b. IF YOU OUTLIVE YOUR SAVINGS</p>
            <p className="text-sm font-semibold text-[#8B0000]">PROTECT YOURSELF</p>
            <p className="text-xs text-muted-foreground">(Retirement Investments / Living on Returns)</p>
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
          <p className="mt-1 text-[11px] text-muted-foreground">
            DIME is a financial planning framework for estimating life insurance needs. Not a guarantee of exact coverage required. Actual needs depend on individual circumstances, existing coverage, and insurer underwriting.
          </p>
          <div className="mt-3 space-y-3">
            <DimeRow
              letter="D"
              title="Debt"
              colorClass="bg-[#E74C3C]"
              amount={editable.debt}
              onChange={(next) => setEditable((prev) => ({ ...prev, debt: next }))}
              breakdown={inputs.risk.debtBreakdown}
              zeroMessage={
                inputs.risk.debtDataCaptured
                  ? "Debt-free"
                  : "No data captured. Click the pencil icon to add this value."
              }
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
              title="Education Funding Need (Estimated)"
              colorClass="bg-[#8E44AD]"
              amount={editable.education}
              onChange={(next) => setEditable((prev) => ({ ...prev, education: next }))}
              subtitle="Projected college costs from your family profile. All figures are estimates based on current college cost data and assumed 5% annual tuition inflation."
            />
            {inputs.risk.educationChildren.length > 0 && (
              <div className="rounded-lg border bg-background p-3">
                <button
                  type="button"
                  onClick={() =>
                    setEducationDerivationExpanded((prev) => !prev)
                  }
                  className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold"
                >
                  <span>How this education cost is derived</span>
                  {educationDerivationExpanded ? (
                    <ChevronUp className="size-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  )}
                </button>
                {educationDerivationExpanded && (
                  <div className="mt-2 space-y-2 text-xs">
                    {educationDisplayRows.map((child, idx) => {
                      return (
                        <div
                          key={child.key}
                          className="rounded border bg-muted/20 p-2"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">
                              {child.name} (age {child.age})
                            </span>
                            <span>
                              Est. start year: {child.collegeAgeReached ? "College age reached" : `~${child.startYear}`}
                            </span>
                          </div>
                          <div className="mt-1 flex justify-between text-muted-foreground">
                            <span>Est. annual cost at enrollment (inflation-adjusted)</span>
                            <span>
                              {child.annualAtEnrollment > 0
                                ? `~${formatCurrency(child.annualAtEnrollment)}/yr`
                                : "See total below"}
                            </span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Est. total need (4-year program)</span>
                            <span>{child.totalNeed > 0 ? `~${formatCurrency(child.totalNeed)}` : formatCurrency(0)}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between">
                      <span>Existing education savings</span>
                      <span>{formatCurrency(inputs.risk.educationExistingSavings)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-semibold">
                      <span>Est. total education need used in DIME</span>
                      <span>{editable.education > 0 ? `~${formatCurrency(editable.education)}` : formatCurrency(0)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Estimates use your children&apos;s current ages, a 5% annual college cost inflation rate, and projected 4-year enrollment costs. Actual costs will vary. Existing 529 savings are deducted from the gross need. These figures are for Financial Needs Analysis purposes and are not a guarantee of future costs.
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      📋 College cost estimates are based on current national averages and projected at 5% annual inflation. Actual costs depend on institution type, location, financial aid, and future tuition changes.
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between text-sm">
                <span>Estate / Probate Costs</span>
                <span className="font-mono">{formatCurrency(inputs.risk.estateCosts)}</span>
              </div>
              <div className="mt-1 text-[10px] italic text-muted-foreground">
                * {inputs.risk.estateCostsDerivation}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-1 rounded-lg border bg-muted/20 p-3 font-mono text-sm">
            <div className="flex justify-between">
              <span>GROSS RISK</span>
              <span>{formatCurrency(inputs.risk.grossRisk)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>- Existing Assets</span>
              <span>({formatCurrency(existingAssetsDeduction)})</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span>NET RISK</span>
              <span>{formatCurrency(inputs.risk.netRisk)}</span>
            </div>
            {postNetDeductions.map((row) => (
              <div key={row.key} className="flex justify-between text-muted-foreground">
                <span>- {row.label}</span>
                <span>({formatCurrency(row.amount)})</span>
              </div>
            ))}
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
          <p className="mt-1 text-[11px] text-muted-foreground">
            Retirement projections are estimates based on assumed rates of return and may not reflect actual outcomes. This is not a retirement plan and does not constitute investment advice.
          </p>

          <div className="mt-3 rounded-lg border bg-background p-3">
            <p className="text-sm font-semibold">Est. Monthly Expenses in Retirement</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span>Food/Groceries</span><span>{formatEstimatedCurrency(retirementExpenses.food)}/mo</span></div>
              <div className="flex justify-between"><span>Insurance Premiums</span><span>{formatEstimatedCurrency(retirementExpenses.insurancePremiums)}/mo</span></div>
              <p className="text-[11px] text-muted-foreground">
                {formatEstimatedCurrency(retirementExpenses.insurancePremiums)}/mo (estimated — includes assumed health insurance costs in retirement. Enter actual insurance premiums in Monthly Expenses for a more accurate figure.)
              </p>
              <div className="flex justify-between"><span>Medical/Healthcare</span><span>{formatEstimatedCurrency(retirementExpenses.medical)}/mo</span></div>
              <p className="text-[11px] text-muted-foreground">
                Medical/Healthcare {formatEstimatedCurrency(retirementExpenses.medical)}/mo (default estimate — actual healthcare expenses not captured. Enter in Monthly Expenses for a more accurate projection.)
              </p>
              <div className="flex justify-between"><span>{retirementExpenses.housingLabel}</span><span>{formatEstimatedCurrency(retirementExpenses.housing)}/mo</span></div>
              {retirementExpenses.housingNote ? (
                <p className="text-[11px] text-muted-foreground">{retirementExpenses.housingNote}</p>
              ) : null}
              <div className="flex justify-between"><span>Utilities</span><span>{formatEstimatedCurrency(retirementExpenses.utilities)}/mo</span></div>
              <div className="flex justify-between"><span>Transportation</span><span>{formatEstimatedCurrency(retirementExpenses.transportation)}/mo</span></div>
              <div className="flex justify-between"><span>Other (miscellaneous)</span><span>{formatEstimatedCurrency(retirementExpenses.other)}/mo</span></div>
              <p className="text-[11px] text-muted-foreground">
                {retirementExpenses.otherNote}
              </p>
              <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
                <span>Est. Total Monthly</span>
                <span>{formatEstimatedCurrency(retirementExpenses.totalMonthly)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Total Annual</span>
                <span>{formatEstimatedCurrency(retirementExpenses.totalAnnual)}/yr</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Total Need ({inputs.retirement.yearsInRetirement} yrs)</span>
                <span>{formatEstimatedCurrency(retirementExpenses.totalAnnual * inputs.retirement.yearsInRetirement)}</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Inflation-adjusted corpus</span>
                <span>{formatEstimatedCurrency(retirementCorpus.recommended)}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border bg-background p-3">
            <p className="text-sm font-semibold">Retirement Income Sources</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span>Current Savings</span><span>{formatEstimatedCurrency(inputs.accumulation.totalCurrentAssets)}</span></div>
              <div className="flex justify-between"><span>Est. Projected at Retirement</span><span>{formatEstimatedCurrency(displayedProjectedAtRetirement)}</span></div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Gross projection before liabilities</span>
                <span>{formatEstimatedCurrency(inputs.accumulation.projectedNetWorthAtRetirement)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Less est. mortgage at retirement</span>
                <span>- {formatEstimatedCurrency(projectedMortgageBalanceAtRetirement)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{projectedAtRetirementDerivation}</p>
              <div className="flex justify-between"><span>Est. 401(k) Withdrawal</span><span>{formatEstimatedCurrency(inputs.retirement.projected401kWithdrawal)}/yr</span></div>
              <p className="text-[11px] text-muted-foreground">
                Estimated at 4% annual withdrawal rate from projected 401(k) and retirement account balance of {formatEstimatedCurrency(estimated401kBalanceAtRetirement)} at retirement. (4% rule is a common retirement planning guideline — not a guarantee.)
              </p>
              <div className="flex justify-between"><span>Social Security</span><span>{formatEstimatedCurrency(socialSecurityTiming.annual)}/yr</span></div>
              <p className="text-[11px] text-muted-foreground">
                {socialSecurityEntered
                  ? `Combined Social Security estimate: Primary ${formatEstimatedCurrency(socialSecurityPrimaryMonthlyInput)}/mo + Spouse ${formatEstimatedCurrency(socialSecuritySpouseMonthlyInput)}/mo = ${formatEstimatedCurrency(socialSecurityCombinedMonthlyInput)}/mo total (as entered). Annual: ${formatEstimatedCurrency(socialSecurityCombinedMonthlyInput * 12)}/yr. ${socialSecurityTiming.note}`
                  : socialSecurityTiming.note}
              </p>
              {!socialSecurityEntered && (
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  💡 Tip: Enter your Social Security estimate in Financial Background → Investments & Assets to include SS income in this projection. At ~\$3,310/mo combined (typical for this income level), SS may significantly reduce this gap.
                </p>
              )}
              <div className="flex justify-between"><span>Pension</span><span>{formatEstimatedCurrency(inputs.retirement.projectedPension)}/yr</span></div>
              <p className="text-[11px] text-muted-foreground">
                Social Security estimates are approximate. Visit ssa.gov for your official benefit statement. Actual benefits depend on your earnings history, claiming age, and future legislative changes.
              </p>
              <div className="flex justify-between border-t pt-1"><span>Est. Total Income</span><span>{formatEstimatedCurrency(retirementIncomeTotal)}/yr</span></div>
              <div className="flex justify-between"><span>Est. Annual Need</span><span>{formatEstimatedCurrency(retirementExpenses.totalAnnual)}/yr</span></div>
              <div className="flex justify-between font-semibold text-[#E67E22]">
                <span>Est. Annual Gap</span>
                <span>{formatEstimatedCurrency(retirementAnnualGap)}/yr</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Est. Monthly Gap</span>
                <span>{formatEstimatedCurrency(retirementMonthlyGap)}/mo</span>
              </div>
              <div className="mt-1 flex justify-between border-t pt-1 font-semibold text-[#E74C3C]">
                <span>Est. Retirement Deficit</span>
                <span>{formatEstimatedCurrency(retirementDeficit)}</span>
              </div>
            </div>
            {retirementMonthlySurplus > 0 && retirementMonthlySurplus < 500 && (
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <p className="font-semibold">⚠️ Retirement Surplus Warning</p>
                <p className="mt-1">
                  Your estimated retirement income exceeds your projected needs by only {formatEstimatedCurrency(retirementMonthlySurplus)}/month.
                </p>
                <p className="mt-1">
                  This margin does not account for inflation on living expenses over 30 years, rising healthcare costs in later years, market volatility affecting investment returns, and unexpected large expenses.
                </p>
                <p className="mt-1">
                  At 3% annual inflation, your expenses could reach {formatEstimatedCurrency(inflatedNeedAtAge90)}/yr by age 90.
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 rounded-lg border border-[#00838F]/30 bg-[#00838F]/5 p-3 text-sm">
            {retirementDeficit > 0 ? (
              socialSecurityTiming.annual > 0 ? (
                <p>
                  ⚠ Your plan must generate <strong>{formatCompactCurrency(retirementMonthlyGap)}/mo</strong> above
                  Social Security to meet your retirement goal. The Roth IRA and IUL recommendations address this gap.
                </p>
              ) : (
                <p>
                  ⚠ Your estimated retirement income of <strong>{formatEstimatedCurrency(retirementIncomeTotal / 12)}/mo</strong>
                  {" "}falls short of your projected need of <strong>{formatEstimatedCurrency(retirementExpenses.totalMonthly)}/mo</strong>
                  {" "}by <strong>{formatEstimatedCurrency(retirementMonthlyGap)}/mo</strong>. This gap does not include Social Security — enter your SS estimate in Investments & Assets to update this projection. The Roth IRA and IUL recommendations address this gap.
                </p>
              )
            ) : (
              <p>
                ✓ Current trajectory projects sufficient retirement income. Maintaining savings discipline is key.
              </p>
            )}
          </div>
          {socialSecurityTiming.annual > 0 && (
            <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 text-xs text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-100">
              📊 With Social Security: Est. Total Income {formatEstimatedCurrency(retirementIncomeTotal)}/yr,
              a surplus of {formatEstimatedCurrency(Math.max(0, retirementIncomeTotal - retirementExpenses.totalAnnual))}/yr
              above the projected need. Note: Social Security income before age {socialSecurityFRAAge} may be reduced based on claim age.
            </div>
          )}
        </div>
      </section>

      <section className="print:hidden rounded-xl border bg-card p-4">
        <details>
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#1B365D]">
            <Info className="size-4" />
            🔒 Agent View Only
          </summary>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>
              1. The red curve shows what the family would need today ({formatCurrency(inputs.risk.grossRisk)}). The green curve shows what has been built ({formatCurrency(existingAssetsDeduction)}). The gap is {formatCurrency(authoritativeCoverageGap)}.
            </p>
            <p>
              2. The curves cross at {curve.crossingAge === null ? "beyond age 90" : `age ${curve.crossingAge}`}. Retirement goal is age {inputs.retirement.targetAge}, which is {curve.crossingAge !== null && inputs.retirement.targetAge < curve.crossingAge ? "before crossing point." : "after crossing point."}
            </p>
            <p>
              3. DIME shows where {formatCurrency(inputs.risk.grossRisk)} comes from; the largest lever is income replacement ({formatCurrency(inputs.risk.annualIncome * editable.replacementYears)}) at {editable.replacementYears} years.
            </p>
            <p>
              4. Retirement projection shows a separate retirement deficit of {formatCurrency(retirementDeficit)}.
            </p>
          </div>
        </details>
      </section>

      <DisclaimerBanner variant="standard" context="projections" className="rounded-md border border-[#E5E7EB]" />
      <div className="flex justify-end">
        <Button onClick={onContinue} className="gap-1.5">
          Continue to Recommendations <ChevronRight className="size-4" />
        </Button>
      </div>
      <XCurveHelpPanel
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        caseData={helpPanelCaseData}
      />

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
