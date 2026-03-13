export const HOUSING_TYPE_LABELS = {
  mortgage: "Owns Home - Has Mortgage",
  owned_free_clear: "Owns Home - Paid Off",
  renting: "Renting - Standard Lease",
  renting_month: "Renting - Month-to-Month",
  sharing: "Shared Housing / Roommates",
  living_with_family: "Living with Family (No Rent)",
  mobile_own_land: "Mobile Home - Owns Land",
  mobile_rent_lot: "Mobile Home - Rents Lot",
  corporate_housing: "Corporate / Employer Housing",
  military_housing: "Military / Base Housing",
  subsidized: "Subsidized / Section 8",
  owns_investment: "Primary + Investment Property",
};

function n(v, fallback = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

export function buildFinancialAnalysisPrompt(clientData, fullAnalysis, healthScore) {
  const monthlyFlow = n(fullAnalysis?.cashFlow?.monthlySurplusOrDeficit);
  const totalExpenses = n(fullAnalysis?.cashFlow?.totalMonthlyExpenses);
  const annualIncome = n(
    fullAnalysis?.cashFlow?.incomeSources?.reduce(
      (sum, s) => sum + n(s?.annual),
      0
    )
  );
  const housingType = clientData?.housingProfile?.housingType || "mortgage";
  const housingLabel = HOUSING_TYPE_LABELS[housingType] || housingType;
  const expense = clientData?.expenses || {};
  const expensesFromCategories =
    n(expense.housing) +
    n(expense.utilities) +
    n(expense.transportation) +
    n(expense.groceries) +
    n(expense.insurance) +
    n(expense.childcare) +
    n(expense.entertainment) +
    n(expense.diningOut) +
    n(expense.subscriptions) +
    n(expense.otherExpenses);
  const effectiveTotalExpenses = totalExpenses || expensesFromCategories;
  const cashFlowLabel =
    monthlyFlow < 0 ? "deficit" : monthlyFlow > 0 ? "surplus" : "break_even";
  const filingStatus = clientData?.filingStatus || "unknown";
  const dependentAges = Array.isArray(clientData?.dependentAges)
    ? clientData.dependentAges
    : [];
  const housingContext =
    clientData?.housingProfile?.context ||
    `monthly_housing=${n(clientData?.housingProfile?.monthlyHousingCost)}, mortgage_balance=${n(clientData?.housingProfile?.mortgageBalance)}, mortgage_rate=${n(clientData?.housingProfile?.mortgageRate)}`;
  const inputDataJson = {
    filing_status: filingStatus,
    number_of_dependents: n(clientData?.numberOfDependents),
    dependent_ages: dependentAges,
    monthly_net_income: n(clientData?.monthlyTakeHomePay),
    expense_categories_monthly: {
      housing: n(expense.housing),
      utilities: n(expense.utilities),
      transportation: n(expense.transportation),
      groceries: n(expense.groceries),
      insurance: n(expense.insurance),
      childcare: n(expense.childcare),
      entertainment: n(expense.entertainment),
      dining_out: n(expense.diningOut),
      subscriptions: n(expense.subscriptions),
      other_expenses: n(expense.otherExpenses),
    },
    total_monthly_expenses: effectiveTotalExpenses,
    cash_flow_label: cashFlowLabel,
    housing_type: housingType,
    housing_type_label: housingLabel,
    housing_type_context: housingContext,
    credit_card_debt: n(clientData?.debts?.creditCardTotal),
    credit_card_apr: n(clientData?.debts?.creditCardAPR),
    student_loan_balance: n(clientData?.debts?.studentLoans),
    other_debt_balance: n(clientData?.debts?.otherDebt),
    monthly_401k_contribution: n(clientData?.investments?.monthly401kContribution),
    employer_match_percent: n(clientData?.investments?.employerMatchPercent),
    roth_ira_status: Boolean(clientData?.investments?.hasRothIRA),
    college_funding_goal: Boolean(clientData?.goals?.collegeFunding),
    retirement_target_age: n(clientData?.goals?.retirementAge, 65),
    disability_insurance_status: Boolean(clientData?.insurance?.hasDisabilityInsurance),
  };

  const schema = {
    summary: {
      clientName: "string",
      housingType: "string",
      housingTypeLabel: "string",
      totalMonthlyExpenses: "number",
      monthlyTakeHome: "number",
      monthlyDeficitOrSurplus: "number",
      primaryIssue: "string",
      urgencyLevel: "critical | high | medium | low",
    },
    budgetAudit: "array",
    housingAnalysis: "object",
    creditCardAnalysis: "object",
    k401Analysis: "object",
    hiddenMoneyReport: "object",
    w4Analysis: "object",
    collegeFundingPlan: "object | null",
    protectionAnalysis: "object",
    actionPlan: "array",
    financialTransformation: "object",
    advisorScript: "object",
  };

  return `FINANCIAL FREEDOM ANALYSIS REQUEST

CLIENT PROFILE
- Name: ${clientData?.firstName || ""} ${clientData?.lastName || ""}
- Age: ${n(clientData?.age)}
- Filing Status: ${clientData?.filingStatus || "unknown"}
- Dependents: ${n(clientData?.numberOfDependents)}

INCOME & CASH FLOW
- Monthly take-home: ${n(fullAnalysis?.cashFlow?.monthlyNetTakeHome)}
- Annual gross income: ${annualIncome}
- Monthly expenses (total): ${effectiveTotalExpenses}
- Monthly flow: ${monthlyFlow}
- Cash flow label: ${cashFlowLabel}

HOUSING
- Type: ${housingType}
- Label: ${housingLabel}
- Housing type context: ${housingContext}
- Monthly housing cost: ${n(clientData?.housingProfile?.monthlyHousingCost)}
- Mortgage balance: ${n(clientData?.housingProfile?.mortgageBalance)}
- Mortgage rate: ${n(clientData?.housingProfile?.mortgageRate)}

DEBTS
- Credit card total: ${n(clientData?.debts?.creditCardTotal)}
- Credit card APR: ${n(clientData?.debts?.creditCardAPR)}
- Student loan balance: ${n(clientData?.debts?.studentLoans)}
- Other debt balance: ${n(clientData?.debts?.otherDebt)}
- Total consumer debt: ${n(fullAnalysis?.debtService?.totalConsumerDebt)}
- High-interest debt total: ${n(fullAnalysis?.debtService?.highInterestTotal)}
- Debt entries: ${JSON.stringify(fullAnalysis?.debtService?.debts || [])}

GOALS
- Retirement target age: ${n(healthScore?.goalSummary?.retirementTargetAge, 65)}
- Desired monthly retirement income: ${n(healthScore?.goalSummary?.desiredMonthlyIncome)}
- Has college goal: ${Boolean(clientData?.goals?.collegeFunding)}
- Top goal: ${healthScore?.goalSummary?.topGoal?.label || "unknown"}

PROTECTION
- Existing life coverage: ${n(fullAnalysis?.goalCoverageAdequacy?.existingCoverage)}
- Coverage gap: ${n(fullAnalysis?.goalCoverageAdequacy?.coverageGap)}
- Has disability insurance: ${Boolean(clientData?.insurance?.hasDisabilityInsurance)}

EXPENSE CATEGORIES (MONTHLY)
- Housing: ${n(expense.housing)}
- Utilities: ${n(expense.utilities)}
- Transportation: ${n(expense.transportation)}
- Groceries: ${n(expense.groceries)}
- Insurance: ${n(expense.insurance)}
- Childcare / Education: ${n(expense.childcare)}
- Entertainment: ${n(expense.entertainment)}
- Dining out: ${n(expense.diningOut)}
- Subscriptions: ${n(expense.subscriptions)}
- Other expenses: ${n(expense.otherExpenses)}

CRITICAL DATA CHECKLIST (DO NOT CLAIM MISSING IF VALUE IS PRESENT)
- filing status: ${filingStatus}
- number of dependents: ${n(clientData?.numberOfDependents)}
- dependent ages: ${JSON.stringify(dependentAges)}
- monthly net income: ${n(clientData?.monthlyTakeHomePay)}
- all expense categories: ${JSON.stringify({
    housing: n(expense.housing),
    utilities: n(expense.utilities),
    transportation: n(expense.transportation),
    groceries: n(expense.groceries),
    insurance: n(expense.insurance),
    childcare: n(expense.childcare),
    entertainment: n(expense.entertainment),
    dining_out: n(expense.diningOut),
    subscriptions: n(expense.subscriptions),
    other_expenses: n(expense.otherExpenses),
  })}
- total monthly expenses: ${effectiveTotalExpenses}
- cash flow label: ${cashFlowLabel}
- housing type label: ${housingLabel}
- housing type context: ${housingContext}
- credit card total: ${n(clientData?.debts?.creditCardTotal)}
- credit card APR: ${n(clientData?.debts?.creditCardAPR)}
- student loan balance: ${n(clientData?.debts?.studentLoans)}
- other debt balance: ${n(clientData?.debts?.otherDebt)}
- monthly 401k contribution: ${n(clientData?.investments?.monthly401kContribution)}
- employer match percent: ${n(clientData?.investments?.employerMatchPercent)}
- has Roth IRA: ${Boolean(clientData?.investments?.hasRothIRA)}
- has college goal: ${Boolean(clientData?.goals?.collegeFunding)}
- retirement target age: ${n(clientData?.goals?.retirementAge, 65)}
- has disability insurance: ${Boolean(clientData?.insurance?.hasDisabilityInsurance)}

IMPORTANT OUTPUT RULES
1) Return valid JSON only.
2) Use numeric values (not numeric strings).
3) Provide specific dollar impacts.
4) Keep tone constructive and educational.
5) Use INPUT_DATA_JSON as source of truth.
6) "Missing data" is only allowed when a field is null/undefined/empty string; numeric 0 and boolean false are valid provided values.

INPUT_DATA_JSON
${JSON.stringify(inputDataJson, null, 2)}

REQUIRED JSON SHAPE
${JSON.stringify(schema, null, 2)}`;
}
