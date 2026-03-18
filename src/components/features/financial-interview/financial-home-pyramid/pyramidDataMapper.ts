import type { FinancialHealthScore } from "@/types/financial-interview";

type Status = "healthy" | "attention" | "not_started";

type Dict = Record<string, unknown>;

interface FamilyChild {
  name: string;
  age: number;
}

interface Level1Data {
  assets: {
    retirement: number;
    investments: number;
    savings: number;
    realEstate: number;
    other: number;
    totalAssets: number;
  };
  liabilities: {
    debts: unknown[];
    totalConsumerDebt: number;
    totalLiabilities: number;
    highInterestTotal: number;
    debtFreeMonths: number;
  };
  income: {
    sources: unknown[];
    monthlyGross: number;
    annualGross: number;
  };
  family: {
    primaryName: string;
    spouseName: string | null;
    dependents: number;
    children: FamilyChild[];
  };
  protection: {
    lifeInsurance: {
      exists: boolean;
      coverageAmount: number;
      coverageGap: number;
      recommended: number;
      coverageRatioPct: number;
      insuranceAdequate: boolean;
    };
    disabilityInsurance: { exists: boolean };
    criticalIllness: { exists: boolean };
    umbrellaPolicy: { exists: boolean };
    ltcPlanning: { exists: boolean };
  };
  foundationHealthyCount: number;
  foundationStatus: Status;
}

interface Level2Data {
  emergencyFund: {
    currentMonths: number;
    targetMonths: number;
    currentBalance: number;
    monthlyExpenses: number;
    targetBalance: number;
    gap: number;
    status: Status;
  };
  criticalExpenses: {
    totalCritical: number;
    monthlyIncome: number;
    criticalExpenseRatio: number;
    housing: number;
  };
  retirement: {
    targetAge: number;
    desiredMonthly: number;
    currentSavings: number;
    projectedAtRetirement: number;
    retirementGapMonthly: number;
    readinessScore: number;
    onTrack: boolean;
  };
  largePurchases: {
    educationNeed: number;
    educationSavings: number;
    educationShortfall: number;
    children: unknown[];
    hasMajorPurchaseGoals: boolean;
  };
  status: Status;
}

interface Level3Data {
  investments: {
    brokerage: number;
    brokerageAccounts: unknown[];
    realEstateInvestments: unknown[];
    totalInvested: number;
    hasInvestments: boolean;
  };
  growth: {
    monthlyInvestmentContributions: number;
    surplusAvailable: number;
    inflationTarget: number;
    minimumGrowthTarget: number;
  };
  status: Status;
}

interface Level4Data {
  estate: {
    willInPlace: boolean;
    willCurrent: boolean;
    trustEstablished: boolean;
    poa: boolean;
    healthcareDirective: boolean;
    beneficiariesCurrent: boolean;
    guardianDesignated: boolean;
    estateScore: number;
    estateMaxScore: number;
    estateScorePct: number;
  };
  deathBenefit: {
    totalCoverage: number;
    coverageGap: number;
    estateNeed: number;
    legacyGoal: number;
  };
  status: Status;
}

interface Level5Data {
  healthScore: number;
  maxScore: number;
  freedom: {
    allDebtsManaged: boolean;
    emergencyFundComplete: boolean;
    protectionInPlace: boolean;
    retirementOnTrack: boolean;
    estateComplete: boolean;
    investmentsGrowing: boolean;
    pillarsComplete: number;
    totalPillars: number;
    freedomPercentage: number;
  };
  review: {
    recommendedReviewDate: string;
  };
  status: Status;
}

function n(v: unknown): number {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
}

function toCount(v: unknown, fallback = 0): number {
  if (Array.isArray(v)) return v.length;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function factorMet(healthScore: FinancialHealthScore | null | undefined, id: string): boolean {
  const hs = healthScore as unknown as Dict;
  const categories = (hs["categories"] as Dict | undefined) ?? {};
  const protection = (categories["protection"] as Dict | undefined) ?? {};
  const factors = (protection["factors"] as Array<Dict> | undefined) ?? [];
  const f = factors.find((x) => String(x?.["id"] ?? "") === id);
  return Boolean(f?.met);
}

export type PyramidMappedData = {
  level1: Level1Data;
  level2: Level2Data;
  level3: Level3Data;
  level4: Level4Data;
  level5: Level5Data;
};

function emergencyStatus(months: number, targetMonths: number): Status {
  if (months >= targetMonths) return "healthy";
  if (months > 0) return "attention";
  return "not_started";
}

function levelStatus(healthy: number, total: number): Status {
  const pct = total > 0 ? healthy / total : 0;
  if (pct >= 0.7) return "healthy";
  if (pct > 0) return "attention";
  return "not_started";
}

function usd(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    Number.isFinite(amount) ? amount : 0
  );
}

export function getLevelSummary(level: number, data: PyramidMappedData): string {
  if (level === 1) {
    if (data.level1.foundationStatus === "healthy") {
      return "Defensive planning is on track with emergency reserves and baseline protection in place.";
    }
    if (data.level1.protection.lifeInsurance.exists && !data.level1.protection.lifeInsurance.insuranceAdequate) {
      return `Life insurance is in place but covers only ${data.level1.protection.lifeInsurance.coverageRatioPct.toFixed(1)}% of calculated need. A ${usd(
        data.level1.protection.lifeInsurance.coverageGap
      )} gap remains.`;
    }
    if (!data.level1.protection.lifeInsurance.exists) {
      return "Defensive planning needs attention: no life insurance protection is currently in place.";
    }
    if (data.level2.emergencyFund.currentMonths < 1) {
      return "Defensive planning needs attention: emergency reserves are below the minimum one-month threshold.";
    }
    return "Defensive planning needs attention: build emergency reserves and confirm life protection.";
  }
  if (level === 2) {
    if (
      data.level2.emergencyFund.currentMonths >= data.level2.emergencyFund.targetMonths &&
      data.level2.retirement.onTrack
    ) {
      return "Excellent stability. Emergency reserves and retirement trajectory are both on track.";
    }
    if (data.level2.emergencyFund.currentMonths >= 1) {
      return "You've started building stability. Keep strengthening reserves and retirement consistency.";
    }
    return "This level builds stability through reserves and planned cash-flow commitments.";
  }
  if (level === 3) {
    return data.level3.investments.hasInvestments
      ? "You have begun growth investing. Continue diversified, consistent contributions."
      : "Growth investing becomes powerful after Levels 1 and 2 are stronger.";
  }
  if (level === 4) {
    return data.level4.estate.estateScorePct >= 70
      ? "Legacy planning is mostly in place; a few updates can complete this level."
      : "Legacy planning ensures your wishes are carried out smoothly for loved ones.";
  }
  const pct = data.level5.freedom.freedomPercentage;
  if (pct >= 80) return "You're close to full financial freedom with most pillars in place.";
  if (pct >= 50) return "Strong progress. Keep building each level methodically.";
  return `You're ${pct}% of the way to financial freedom. Every level you strengthen compounds forward.`;
}

export function mapPyramidData(params: {
  caseData: unknown;
  healthScore: FinancialHealthScore | null | undefined;
  fullAnalysis: unknown;
}): PyramidMappedData {
  const { caseData, healthScore, fullAnalysis } = params;
  const caseAny = (caseData as Dict | null) ?? {};
  const hsAny = (healthScore as unknown as Dict | null) ?? {};
  const fa = (fullAnalysis as Dict | null) ?? {};
  const nw = (fa["netWorth"] as Dict | undefined) ?? {};
  const hsNetWorth =
    ((hsAny["netWorth"] as Dict | undefined) ??
      (hsAny["net_worth"] as Dict | undefined) ??
      {}) as Dict;
  const debt = (fa["debtService"] as Dict | undefined) ?? {};
  const cf = (fa["cashFlow"] as Dict | undefined) ?? {};
  const goalCov =
    ((fa["goalCoverageAdequacy"] as Dict | undefined) ??
      (fa["goal_coverage_adequacy"] as Dict | undefined) ??
      {}) as Dict;
  const goalEdu =
    ((fa["goalEducationFunding"] as Dict | undefined) ??
      (hsAny["educationFundingAnalysis"] as Dict | undefined) ??
      {}) as Dict;
  const goalRet = (fa["goalRetirementProjection"] as Dict | undefined) ?? {};
  const goalEstate = (fa["goalEstateNeed"] as Dict | undefined) ?? {};

  const clientPersonalInfo = (caseAny["clientPersonalInfo"] as Dict | undefined) ?? {};
  const dependentsDetailRaw =
    (clientPersonalInfo["dependentsDetail"] as unknown[] | undefined) ?? [];
  const children: FamilyChild[] = dependentsDetailRaw
    .map((c) => {
      const child = (c as Dict | null) ?? {};
      return {
        name: String(child["name"] ?? ""),
        age: n(child["age"]),
      };
    });

  const dependentsNum =
    toCount(clientPersonalInfo["dependents"], children.length) || children.length;
  const coverageAmount =
    n(goalCov["existingCoverage"]) ||
    n(goalCov["existing_coverage"]) ||
    n(hsAny["existingCoverage"]) ||
    n(hsAny["existing_coverage"]) ||
    0;
  const xcurve = (fa["xcurve"] as Dict | undefined) ?? {};
  const fromGoalCoverageGap = n(goalCov["coverageGap"] ?? goalCov["coverage_gap"]);
  const fromHealthScoreCoverageGap = n(hsAny["coverageGap"] ?? hsAny["coverage_gap"]);
  const fromXCurveCoverageGap = n(xcurve["coverageGap"] ?? xcurve["coverage_gap"]);
  const coverageGap =
    fromGoalCoverageGap > 0
      ? fromGoalCoverageGap
      : fromHealthScoreCoverageGap > 0
        ? fromHealthScoreCoverageGap
        : fromXCurveCoverageGap;
  const recommendedCoverage =
    n(goalCov["recommendedCoverage"]) ||
    n(goalCov["recommended_coverage"]) ||
    n(hsAny["recommendedCoverage"]) ||
    n(hsAny["recommended_coverage"]);
  const emergencyTargetMonths = 6;

  const emergencyMonths = (() => {
    const categories = (hsAny["categories"] as Dict | undefined) ?? {};
    const debtHealth = (categories["debtHealth"] as Dict | undefined) ?? {};
    const dhFactors = (debtHealth["factors"] as Array<Dict> | undefined) ?? [];
    const fromFactor = String(
      dhFactors.find((f) => String(f?.["label"] ?? "").toLowerCase().includes("emergency fund"))
        ?.["label"] ?? ""
    );
    const m = /([0-9]+(\.[0-9]+)?)\s*months?/i.exec(fromFactor);
    if (m) return n(m[1]);
    const nwCategories = (nw["categories"] as Dict | undefined) ?? {};
    const savingsCat = (nwCategories["savings"] as Dict | undefined) ?? {};
    const savings = n(savingsCat["total"]);
    const monthlyExp = n(cf["totalMonthlyExpenses"]);
    return monthlyExp > 0 ? savings / monthlyExp : 0;
  })();

  const nwCategories = (nw["categories"] as Dict | undefined) ?? {};
  const nwBreakdown =
    ((nw["breakdown"] as Dict | undefined) ??
      (nw["assetBreakdown"] as Dict | undefined) ??
      {}) as Dict;
  const hsBreakdown =
    ((hsNetWorth["breakdown"] as Dict | undefined) ??
      (hsNetWorth["asset_breakdown"] as Dict | undefined) ??
      {}) as Dict;
  const retCat = (nwCategories["retirement"] as Dict | undefined) ?? {};
  const invCat = (nwCategories["investments"] as Dict | undefined) ?? {};
  const savCat = (nwCategories["savings"] as Dict | undefined) ?? {};
  const reCat = (nwCategories["realEstate"] as Dict | undefined) ?? {};
  const otherCat = (nwCategories["other"] as Dict | undefined) ?? {};
  const incomeSources = (cf["incomeSources"] as unknown[] | undefined) ?? [];
  const annualGross = incomeSources.reduce<number>((sum, src) => {
    const s = (src as Dict | null) ?? {};
    return sum + n(s["annual"]);
  }, 0);

  const level1: Level1Data = {
    assets: {
      retirement:
        n(retCat["total"]) ||
        n(nwBreakdown["retirement"]) ||
        n(hsBreakdown["retirement"]),
      investments:
        n(invCat["total"]) ||
        n(nwBreakdown["investments"]) ||
        n(hsBreakdown["investments"]),
      savings:
        n(savCat["total"]) ||
        n(nwBreakdown["savings"]) ||
        n(hsBreakdown["savings"]) ||
        n(hsAny["savings"]),
      realEstate:
        n(reCat["total"]) ||
        n(nwBreakdown["realEstate"]) ||
        n(nwBreakdown["real_estate"]) ||
        n(hsBreakdown["realEstate"]) ||
        n(hsBreakdown["real_estate"]),
      other:
        n(otherCat["total"]) ||
        n(nwBreakdown["other"]) ||
        n(hsBreakdown["other"]),
      totalAssets:
        n(nw["totalAssets"]) ||
        n(nw["total_assets"]) ||
        n(hsNetWorth["totalAssets"]) ||
        n(hsNetWorth["total_assets"]) ||
        n(hsNetWorth["total"]),
    },
    liabilities: {
      debts: ((debt["debts"] as unknown[] | undefined) ?? []),
      totalConsumerDebt: n(debt["totalConsumerDebt"]),
      totalLiabilities: n(nw["totalLiabilities"]),
      highInterestTotal: n(debt["highInterestTotal"]),
      debtFreeMonths: n(((debt["avalancheStrategy"] as Dict | undefined) ?? {})["payoffMonths"]),
    },
    income: {
      sources: incomeSources,
      monthlyGross: n(cf["monthlyGrossIncome"]),
      annualGross,
    },
    family: {
      primaryName: String(clientPersonalInfo["firstName"] ?? "Primary"),
      spouseName: clientPersonalInfo["partnerFirstName"]
        ? String(clientPersonalInfo["partnerFirstName"])
        : null,
      dependents: dependentsNum,
      children,
    },
    protection: {
      lifeInsurance: {
        exists: factorMet(healthScore, "life_insurance_exists") || coverageAmount > 0,
        coverageAmount,
        coverageGap,
        recommended: recommendedCoverage,
        coverageRatioPct: 0,
        insuranceAdequate: false,
      },
      disabilityInsurance: { exists: factorMet(healthScore, "disability_insurance") },
      criticalIllness: { exists: false },
      umbrellaPolicy: { exists: factorMet(healthScore, "umbrella_liability") },
      ltcPlanning: { exists: factorMet(healthScore, "ltc_consideration") },
    },
    foundationHealthyCount: 0,
    foundationStatus: "not_started",
  };

  const level2: Level2Data = {
    emergencyFund: {
      currentMonths: emergencyMonths,
      targetMonths: emergencyTargetMonths,
      currentBalance: n(savCat["total"]),
      monthlyExpenses: n(cf["totalMonthlyExpenses"]),
      targetBalance: n(cf["totalMonthlyExpenses"]) * emergencyTargetMonths,
      gap: Math.max(
        0,
        n(cf["totalMonthlyExpenses"]) * emergencyTargetMonths - n(savCat["total"])
      ),
      status: emergencyStatus(emergencyMonths, emergencyTargetMonths),
    },
    criticalExpenses: {
      totalCritical: n(cf["monthlyFixedExpenses"]) || n(cf["totalMonthlyExpenses"]),
      monthlyIncome: n(cf["monthlyNetTakeHome"]) || n(cf["monthlyNetIncome"]),
      criticalExpenseRatio:
        (n(cf["monthlyNetTakeHome"]) || n(cf["monthlyNetIncome"])) > 0
          ? (n(cf["monthlyFixedExpenses"]) || n(cf["totalMonthlyExpenses"])) /
            (n(cf["monthlyNetTakeHome"]) || n(cf["monthlyNetIncome"]))
          : 0,
      housing: n(cf["monthlyFixedExpenses"]) || n(cf["totalMonthlyExpenses"]) * 0.3,
    },
    retirement: {
      targetAge: n(((hsAny["goalSummary"] as Dict | undefined) ?? {})["retirementTargetAge"]) || 65,
      desiredMonthly: n(((hsAny["goalSummary"] as Dict | undefined) ?? {})["desiredMonthlyIncome"]),
      currentSavings: n(retCat["total"]),
      projectedAtRetirement: n(((fa["goalNetWorth"] as Dict | undefined) ?? {})["projectedNetWorthAtRetirement"]),
      retirementGapMonthly: n(goalRet["retirementIncomeGapMonthly"]),
      readinessScore: n(goalRet["retirementReadinessScore"]),
      onTrack: n(goalRet["retirementReadinessScore"]) >= 70,
    },
    largePurchases: {
      educationNeed: n(goalEdu["projectedTotalEducationNeed"]),
      educationSavings: n(goalEdu["existingEducationAssets"]),
      educationShortfall: n(goalEdu["projectedShortfall"]),
      children: ((goalEdu["children"] as unknown[] | undefined) ?? []),
      hasMajorPurchaseGoals: n(((fa["goalNetWorth"] as Dict | undefined) ?? {})["majorPurchaseDrag"]) > 0,
    },
    status: "not_started",
  };

  const systematicMonthly =
    n(invCat["monthlyContribution"]) ||
    n(invCat["monthly_contribution"]) ||
    n(invCat["systematicMonthly"]) ||
    n(invCat["systematic_monthly"]) ||
    n(((fa["goalNetWorth"] as Dict | undefined) ?? {})["systematicMonthly"]) ||
    n(((fa["goalNetWorth"] as Dict | undefined) ?? {})["systematic_monthly"]);

  const level3: Level3Data = {
    investments: {
      brokerage: n(invCat["total"]),
      brokerageAccounts: ((invCat["accounts"] as unknown[] | undefined) ?? []),
      realEstateInvestments: [],
      totalInvested: n(invCat["total"]),
      hasInvestments: n(invCat["total"]) > 0,
    },
    growth: {
      monthlyInvestmentContributions: systematicMonthly,
      surplusAvailable:
        n(((hsAny["hiddenMoney"] as Dict | undefined) ?? {})["totalAvailable"]) ||
        n(((fa["hiddenMoney"] as Dict | undefined) ?? {})["totalAvailable"]) ||
        n(((fa["hiddenMoney"] as Dict | undefined) ?? {})["totalMonthlyRedirectable"]) ||
        Math.max(0, n(cf["monthlySurplusOrDeficit"])),
      inflationTarget: 0.04,
      minimumGrowthTarget: 0.05,
    },
    status: "not_started",
  };

  const hsCategories = (hsAny["categories"] as Dict | undefined) ?? {};
  const estatePlanning = (hsCategories["estatePlanning"] as Dict | undefined) ?? {};
  const estateFactors = ((estatePlanning["factors"] as Array<Dict> | undefined) ?? []);
  const estateMet = (id: string) => Boolean(estateFactors.find((f) => String(f?.["id"] ?? "") === id)?.["met"]);
  const estateScore = n(estatePlanning["score"]);
  const estateMax = n(estatePlanning["maxScore"]);
  const level4: Level4Data = {
    estate: {
      willInPlace: estateMet("will_in_place"),
      willCurrent: estateMet("will_current"),
      trustEstablished: estateMet("trust_established"),
      poa: estateMet("poa"),
      healthcareDirective: estateMet("healthcare_directive"),
      beneficiariesCurrent: estateMet("beneficiaries_current"),
      guardianDesignated: estateMet("guardian_designated"),
      estateScore,
      estateMaxScore: estateMax,
      estateScorePct: estateMax > 0 ? (estateScore / estateMax) * 100 : 0,
    },
    deathBenefit: {
      totalCoverage: coverageAmount,
      coverageGap,
      estateNeed: n(goalEstate["totalEstateNeed"]),
      legacyGoal: n(goalEstate["legacyAmount"]),
    },
    status: "not_started",
  };

  const pillars = [
    level1.income.monthlyGross > 0,
    level2.emergencyFund.currentMonths >= emergencyTargetMonths,
    level1.protection.lifeInsurance.exists && level1.protection.disabilityInsurance.exists,
    level2.retirement.onTrack,
    level4.estate.estateScorePct >= 70,
    level3.investments.hasInvestments,
  ];
  const pillarsComplete = pillars.filter(Boolean).length;

  const level5: Level5Data = {
    healthScore: n(hsAny["totalScore"]),
    maxScore: n(hsAny["maxPossibleScore"]) || 100,
    freedom: {
      allDebtsManaged:
        n(debt["totalConsumerDebt"]) === 0 ||
        n(((debt["avalancheStrategy"] as Dict | undefined) ?? {})["payoffMonths"]) < 36,
      emergencyFundComplete: level2.emergencyFund.currentMonths >= emergencyTargetMonths,
      protectionInPlace:
        level1.protection.lifeInsurance.exists && level1.protection.disabilityInsurance.exists,
      retirementOnTrack: level2.retirement.onTrack,
      estateComplete: level4.estate.estateScorePct >= 70,
      investmentsGrowing: level3.investments.hasInvestments,
      pillarsComplete,
      totalPillars: 6,
      freedomPercentage: Math.round((pillarsComplete / 6) * 100),
    },
    review: {
      recommendedReviewDate: new Date(
        new Date().getFullYear() + 1,
        new Date().getMonth(),
        new Date().getDate()
      ).toLocaleDateString(),
    },
    status: "not_started",
  };

  const grossRisk =
    n(goalCov["dimeTotal"]) ||
    n(goalCov["dime_total"]) ||
    n(xcurve["grossRisk"]) ||
    n(xcurve["gross_risk"]) ||
    (level1.protection.lifeInsurance.recommended > 0
      ? level1.protection.lifeInsurance.recommended
      : Math.max(
          0,
          level1.protection.lifeInsurance.coverageAmount + level1.protection.lifeInsurance.coverageGap
        ));
  const coverageRatio = grossRisk > 0
    ? level1.protection.lifeInsurance.coverageAmount / grossRisk
    : (level1.protection.lifeInsurance.coverageAmount > 0 ? 1 : 0);
  const insuranceAdequate = grossRisk > 0
    ? (coverageRatio >= 0.5 || level1.protection.lifeInsurance.coverageGap <= 0)
    : level1.protection.lifeInsurance.coverageAmount > 0;
  const efAdequate = level2.emergencyFund.currentMonths >= 1;
  level1.protection.lifeInsurance.coverageRatioPct = Math.max(0, coverageRatio * 100);
  level1.protection.lifeInsurance.insuranceAdequate = insuranceAdequate;

  const level1OnTrack = efAdequate && insuranceAdequate;
  level1.foundationHealthyCount = level1OnTrack ? 1 : 0;
  level1.foundationStatus = level1OnTrack ? "healthy" : "attention";
  level2.status = levelStatus(
    [
      level2.emergencyFund.currentMonths >= emergencyTargetMonths,
      level2.criticalExpenses.criticalExpenseRatio > 0 &&
        level2.criticalExpenses.criticalExpenseRatio <= 0.5,
      level2.retirement.onTrack,
      level2.largePurchases.educationNeed === 0 ||
        level2.largePurchases.educationSavings > 0,
    ].filter(Boolean).length,
    4
  );
  const level3OnTrack =
    level3.investments.totalInvested >= level1.income.annualGross * 0.25 ||
    level3.growth.monthlyInvestmentContributions > 0;
  level3.status = level3OnTrack ? "healthy" : "attention";
  level4.status = level4.estate.estateScorePct >= 70 ? "healthy" : "attention";
  level5.status =
    level5.freedom.freedomPercentage >= 70
      ? "healthy"
      : level5.freedom.freedomPercentage > 0
        ? "attention"
        : "not_started";

  return { level1, level2, level3, level4, level5 };
}

