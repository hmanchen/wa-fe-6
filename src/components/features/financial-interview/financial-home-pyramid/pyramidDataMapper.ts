/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FinancialHealthScore } from "@/types/financial-interview";

type Status = "healthy" | "attention" | "not_started";

function n(v: any): number {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
}

function factorMet(healthScore: FinancialHealthScore | null | undefined, id: string): boolean {
  const factors = healthScore?.categories?.protection?.factors ?? [];
  const f = factors.find((x) => x?.id === id);
  return Boolean(f?.met);
}

export type PyramidMappedData = {
  level1: any;
  level2: any;
  level3: any;
  level4: any;
  level5: any;
};

function emergencyStatus(months: number): Status {
  if (months >= 3) return "healthy";
  if (months > 0) return "attention";
  return "not_started";
}

function levelStatus(healthy: number, total: number): Status {
  const pct = total > 0 ? healthy / total : 0;
  if (pct >= 0.7) return "healthy";
  if (pct > 0) return "attention";
  return "not_started";
}

export function getLevelSummary(level: number, data: PyramidMappedData): string {
  if (level === 1) {
    const h = data.level1.foundationHealthyCount;
    if (h >= 4) return "Your foundation is solid. Great work building this base.";
    if (h >= 3) return "Your foundation is mostly in place. A few areas would strengthen it further.";
    if (h >= 2) return "Your foundation has some good elements. Let's work on strengthening the gaps.";
    return "Building your foundation is the most important step. Let's start here.";
  }
  if (level === 2) {
    if (data.level2.emergencyFund.currentMonths >= 3 && data.level2.retirement.onTrack) {
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
  caseData: any;
  healthScore: FinancialHealthScore | null | undefined;
  fullAnalysis: any;
}): PyramidMappedData {
  const { caseData, healthScore, fullAnalysis } = params;

  const fa = fullAnalysis ?? {};
  const nw = fa?.netWorth ?? {};
  const debt = fa?.debtService ?? {};
  const cf = fa?.cashFlow ?? {};
  const goalCov = fa?.goalCoverageAdequacy ?? {};
  const goalEdu = fa?.goalEducationFunding ?? healthScore?.educationFundingAnalysis ?? {};
  const goalRet = fa?.goalRetirementProjection ?? {};
  const goalEstate = fa?.goalEstateNeed ?? {};

  const dependentsNum =
    n(caseData?.clientPersonalInfo?.dependents) ||
    ((caseData?.clientPersonalInfo?.dependentsDetail ?? []).length || 0);
  const children = caseData?.clientPersonalInfo?.dependentsDetail ?? [];
  const coverageAmount = n(goalCov?.existingCoverage) || 0;
  const coverageGap = n(goalCov?.coverageGap);
  const recommendedCoverage = n(goalCov?.recommendedCoverage);

  const emergencyMonths = (() => {
    const fromFactor =
      healthScore?.categories?.debtHealth?.factors?.find((f) =>
        String(f?.label || "").toLowerCase().includes("emergency fund")
      )?.label ?? "";
    const m = /([0-9]+(\.[0-9]+)?)\s*months?/i.exec(fromFactor);
    if (m) return n(m[1]);
    const savings = n(nw?.categories?.savings?.total);
    const monthlyExp = n(cf?.totalMonthlyExpenses);
    return monthlyExp > 0 ? savings / monthlyExp : 0;
  })();

  const level1 = {
    assets: {
      retirement: n(nw?.categories?.retirement?.total),
      investments: n(nw?.categories?.investments?.total),
      savings: n(nw?.categories?.savings?.total),
      realEstate: n(nw?.categories?.realEstate?.total),
      other: n(nw?.categories?.other?.total),
      totalAssets: n(nw?.totalAssets),
    },
    liabilities: {
      debts: debt?.debts ?? [],
      totalConsumerDebt: n(debt?.totalConsumerDebt),
      totalLiabilities: n(nw?.totalLiabilities),
      highInterestTotal: n(debt?.highInterestTotal),
      debtFreeMonths: n(debt?.avalancheStrategy?.payoffMonths),
    },
    income: {
      sources: cf?.incomeSources ?? [],
      monthlyGross: n(cf?.monthlyGrossIncome),
      annualGross: (cf?.incomeSources ?? []).reduce((sum: number, s: any) => sum + n(s?.annual), 0),
    },
    family: {
      primaryName: caseData?.clientPersonalInfo?.firstName ?? "Primary",
      spouseName: caseData?.clientPersonalInfo?.partnerFirstName ?? null,
      dependents: dependentsNum,
      children,
    },
    protection: {
      lifeInsurance: {
        exists: factorMet(healthScore, "life_insurance_exists"),
        coverageAmount,
        coverageGap,
        recommended: recommendedCoverage,
      },
      disabilityInsurance: { exists: factorMet(healthScore, "disability_insurance") },
      criticalIllness: { exists: false },
      umbrellaPolicy: { exists: factorMet(healthScore, "umbrella_liability") },
      ltcPlanning: { exists: factorMet(healthScore, "ltc_consideration") },
    },
  };

  const level2 = {
    emergencyFund: {
      currentMonths: emergencyMonths,
      targetMonths: 6,
      currentBalance: n(nw?.categories?.savings?.total),
      monthlyExpenses: n(cf?.totalMonthlyExpenses),
      targetBalance: n(cf?.totalMonthlyExpenses) * 6,
      gap: Math.max(0, n(cf?.totalMonthlyExpenses) * 6 - n(nw?.categories?.savings?.total)),
      status: emergencyStatus(emergencyMonths),
    },
    criticalExpenses: {
      totalCritical: n(cf?.monthlyFixedExpenses),
      monthlyIncome: n(cf?.monthlyNetTakeHome),
      criticalExpenseRatio:
        n(cf?.monthlyNetTakeHome) > 0
          ? n(cf?.monthlyFixedExpenses) / n(cf?.monthlyNetTakeHome)
          : 0,
      housing: n(cf?.monthlyFixedExpenses),
    },
    retirement: {
      targetAge: n(healthScore?.goalSummary?.retirementTargetAge) || 65,
      desiredMonthly: n(healthScore?.goalSummary?.desiredMonthlyIncome),
      currentSavings: n(nw?.categories?.retirement?.total),
      projectedAtRetirement: n(fa?.goalNetWorth?.projectedNetWorthAtRetirement),
      retirementGapMonthly: n(goalRet?.retirementIncomeGapMonthly),
      readinessScore: n(goalRet?.retirementReadinessScore),
      onTrack: n(goalRet?.retirementReadinessScore) >= 70,
    },
    largePurchases: {
      educationNeed: n(goalEdu?.projectedTotalEducationNeed),
      educationSavings: n(goalEdu?.existingEducationAssets),
      educationShortfall: n(goalEdu?.projectedShortfall),
      children: goalEdu?.children ?? [],
      hasMajorPurchaseGoals: n(fa?.goalNetWorth?.majorPurchaseDrag) > 0,
    },
  };

  const level3 = {
    investments: {
      brokerage: n(nw?.categories?.investments?.total),
      brokerageAccounts: nw?.categories?.investments?.accounts ?? [],
      realEstateInvestments: [],
      totalInvested: n(nw?.categories?.investments?.total),
      hasInvestments: n(nw?.categories?.investments?.total) > 0,
    },
    growth: {
      monthlyInvestmentContributions: n(healthScore?.hiddenMoney?.totalAvailable),
      surplusAvailable: n(healthScore?.hiddenMoney?.totalAvailable),
      inflationTarget: 0.04,
      minimumGrowthTarget: 0.05,
    },
  };

  const estateFactors = healthScore?.categories?.estatePlanning?.factors ?? [];
  const estateMet = (id: string) => Boolean(estateFactors.find((f) => f?.id === id)?.met);
  const estateScore = n(healthScore?.categories?.estatePlanning?.score);
  const estateMax = n(healthScore?.categories?.estatePlanning?.maxScore);
  const level4 = {
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
      estateNeed: n(goalEstate?.totalEstateNeed),
      legacyGoal: n(goalEstate?.legacyAmount),
    },
  };

  const pillars = [
    level1.income.monthlyGross > 0,
    level2.emergencyFund.currentMonths >= 3,
    level1.protection.lifeInsurance.exists && level1.protection.disabilityInsurance.exists,
    level2.retirement.onTrack,
    level4.estate.estateScorePct >= 70,
    level3.investments.hasInvestments,
  ];
  const pillarsComplete = pillars.filter(Boolean).length;

  const level5 = {
    healthScore: n(healthScore?.totalScore),
    maxScore: n(healthScore?.maxPossibleScore) || 100,
    freedom: {
      allDebtsManaged:
        n(debt?.totalConsumerDebt) === 0 || n(debt?.avalancheStrategy?.payoffMonths) < 36,
      emergencyFundComplete: level2.emergencyFund.currentMonths >= 3,
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
  };

  const foundationHealthyCount = [
    level1.assets.totalAssets > 0,
    level1.liabilities.totalConsumerDebt === 0 || level1.liabilities.debtFreeMonths < 36,
    level1.income.monthlyGross > 0,
    true,
    level1.protection.lifeInsurance.exists && level1.protection.disabilityInsurance.exists,
  ].filter(Boolean).length;
  level1.foundationHealthyCount = foundationHealthyCount;
  level1.foundationStatus = levelStatus(foundationHealthyCount, 5);
  level2.status = levelStatus(
    [
      level2.emergencyFund.currentMonths >= 3,
      level2.criticalExpenses.criticalExpenseRatio > 0 &&
        level2.criticalExpenses.criticalExpenseRatio <= 0.5,
      level2.retirement.onTrack,
      level2.largePurchases.educationNeed === 0 ||
        level2.largePurchases.educationSavings > 0,
    ].filter(Boolean).length,
    4
  );
  level3.status = level3.investments.hasInvestments ? "healthy" : "attention";
  level4.status = level4.estate.estateScorePct >= 70 ? "healthy" : "attention";
  level5.status =
    level5.freedom.freedomPercentage >= 70
      ? "healthy"
      : level5.freedom.freedomPercentage > 0
        ? "attention"
        : "not_started";

  return { level1, level2, level3, level4, level5 };
}

