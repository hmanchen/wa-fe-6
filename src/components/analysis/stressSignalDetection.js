function n(v, fallback = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function getNested(obj, paths, fallback = 0) {
  for (const p of paths) {
    const val = p.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
    if (val != null) return val;
  }
  return fallback;
}

export function getHousingExpense(fullAnalysis, caseData) {
  const fixed = n(getNested(fullAnalysis, ["cashFlow.monthlyFixedExpenses"], 0));
  const explicit = n(
    getNested(caseData, [
      "monthlyExpenses.housing",
      "primaryBackground.monthlyExpenses.housing",
      "spouseBackground.monthlyExpenses.housing",
    ])
  );
  return explicit > 0 ? explicit : fixed;
}

export function getDiningExpense(caseData) {
  return n(
    getNested(caseData, [
      "monthlyExpenses.diningOut",
      "primaryBackground.monthlyExpenses.diningOut",
      "primaryBackground.monthlyExpenses.entertainment",
      "monthlyExpenses.entertainment",
    ])
  );
}

export function detectFinancialStressSignals(fullAnalysis, healthScore, caseData) {
  const signals = [];

  const monthlyTakeHome = n(fullAnalysis?.cashFlow?.monthlyNetTakeHome);
  const monthlyFlow = n(fullAnalysis?.cashFlow?.monthlySurplusOrDeficit);
  const totalDebt = n(fullAnalysis?.debtService?.totalConsumerDebt);

  const housingExpense = getHousingExpense(fullAnalysis, caseData);
  const housingPct = monthlyTakeHome > 0 ? (housingExpense / monthlyTakeHome) * 100 : 0;
  const diningExpense = getDiningExpense(caseData);
  const diningPct = monthlyTakeHome > 0 ? (diningExpense / monthlyTakeHome) * 100 : 0;
  const debtToIncome = monthlyTakeHome > 0 ? (totalDebt / (monthlyTakeHome * 12)) * 100 : 0;

  if (monthlyFlow < 0) {
    signals.push({
      type: "CRITICAL",
      code: "MONTHLY_DEFICIT",
      title: "Monthly Cash Flow Deficit",
      message: `Expenses exceed income by $${Math.abs(Math.round(monthlyFlow)).toLocaleString()}/month.`,
      monthlyImpact: Math.abs(monthlyFlow),
    });
  }

  if (monthlyFlow >= 0 && monthlyFlow < 300) {
    signals.push({
      type: "HIGH",
      code: "TIGHT_CASH_FLOW",
      title: "Critically Tight Cash Flow",
      message: `Only $${Math.round(monthlyFlow).toLocaleString()}/month remaining.`,
      monthlyImpact: monthlyFlow,
    });
  }

  if (totalDebt > monthlyTakeHome * 6) {
    signals.push({
      type: "HIGH",
      code: "HIGH_DEBT_LOAD",
      title: "Significant Debt Load",
      message: `Total debt of $${Math.round(totalDebt).toLocaleString()} is ${Math.round(debtToIncome)}% of annual income.`,
      monthlyImpact: 0,
    });
  }

  if (housingPct > 35) {
    signals.push({
      type: "HIGH",
      code: "HOUSING_BURDEN",
      title: "Housing Cost Overburden",
      message: `Housing consumes ${Math.round(housingPct)}% of take-home.`,
      monthlyImpact: Math.max(0, housingExpense - monthlyTakeHome * 0.3),
    });
  }

  if (diningPct > 10) {
    signals.push({
      type: "MEDIUM",
      code: "DISCRETIONARY_LEAK",
      title: "Discretionary Spending Leak",
      message: `Dining/discretionary is ${Math.round(diningPct)}% of income.`,
      monthlyImpact: diningExpense * 0.5,
    });
  }

  const hasLifeInsurance = n(fullAnalysis?.goalCoverageAdequacy?.existingCoverage) > 0;
  const numberOfDependents = n(caseData?.dependents);
  if (!hasLifeInsurance && numberOfDependents > 0) {
    signals.push({
      type: "CRITICAL",
      code: "UNPROTECTED_FAMILY",
      title: "Family Has No Life Insurance Protection",
      message: `${numberOfDependents} dependent(s) with no life insurance coverage found.`,
      monthlyImpact: 0,
    });
  }

  const hasCollegeGoal = Boolean(
    caseData?.goals?.collegeFunding ||
      String(healthScore?.goalSummary?.topGoal?.label || "")
        .toLowerCase()
        .includes("college")
  );
  if (hasCollegeGoal && numberOfDependents > 0 && monthlyFlow < 300) {
    signals.push({
      type: "HIGH",
      code: "COLLEGE_FUNDING_BLOCKED",
      title: "College Funding Goal Blocked by Cash Flow",
      message: "Current monthly cash flow is too tight to fund college consistently.",
      monthlyImpact: 0,
    });
  }

  return {
    signals,
    hasCritical: signals.some((s) => s.type === "CRITICAL"),
    hasHigh: signals.some((s) => s.type === "HIGH"),
    shouldTriggerAnalysis: signals.length > 0,
    totalPotentialMonthlyRecovery: signals.reduce(
      (sum, s) => sum + n(s.monthlyImpact),
      0
    ),
  };
}
