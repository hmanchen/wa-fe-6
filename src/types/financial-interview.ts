/**
 * Financial Interview types for WealthArchitect platform
 *
 * The Financial Interview is a multi-section workflow where the advisor
 * captures detailed financial data while educating the client.
 */

// ── Section 1: Financial Background ──────────────────────────

export interface EmploymentRecord {
  id: string;
  company: string;
  yearsEmployed: number;
  isCurrent: boolean;
  has401k: boolean;
  /** Only for previous employers: what was done with the 401k */
  previous401kAction?: "rolled-over" | "left-with-employer" | "cashed-out" | "converted-to-roth";
  previous401kBalance?: number;
  /** Only for current employer */
  employer401kMatchPercent?: number;
  employee401kContributionPercent?: number;
  is401kMaxedOut?: boolean;
  current401kBalance?: number;
}

export interface HSADetails {
  hasHSA: boolean;
  annualContribution?: number;
  currentBalance?: number;
  isMaxedOut?: boolean;
}

export interface IRADetails {
  hasIRA: boolean;
  type?: "traditional" | "sep" | "simple";
  annualContribution?: number;
  currentBalance?: number;
}

export interface RothIRADetails {
  hasRothIRA: boolean;
  annualContribution?: number;
  currentBalance?: number;
}

export interface BrokerageDetails {
  hasBrokerage: boolean;
  platform?: string;
  currentValue?: number;
  investmentTypes?: string; // e.g. "stocks, ETFs, mutual funds"
}

export interface SystematicInvestment {
  hasSystematicInvestments: boolean;
  description?: string;
  monthlyAmount?: number;
  currentValue?: number;
}

export interface FundsAbroad {
  sendsFundsAbroad: boolean;
  monthlyAmount?: number;
  purpose?: string;
  country?: string;
}

export interface PersonFinancialBackground {
  /** "primary" or "spouse" */
  role: "primary" | "spouse";
  yearsInCountry: number;
  countryOfResidence: string;
  employmentHistory: EmploymentRecord[];
  hsa: HSADetails;
  ira: IRADetails;
  rothIRA: RothIRADetails;
  brokerage: BrokerageDetails;
  systematicInvestments: SystematicInvestment;
  fundsAbroad: FundsAbroad;
}

// ── Section 2: Life Insurance & Will/Trust Education ─────────

export interface ExistingInsurance {
  provider: string;
  type: "term" | "whole-life" | "universal" | "iul" | "other";
  coverageAmount: number;
  monthlyPremium: number;
  termLengthYears?: number;
  paidByEmployer: boolean;
}

export interface LifeInsuranceEducation {
  /** Client's existing insurance policies */
  existingPolicies: ExistingInsurance[];
  /** Whether client is interested in learning more */
  interestedInTermInsurance: boolean;
  interestedInPermInsurance: boolean;
  interestedInIUL: boolean;
  hasWill: boolean;
  hasTrust: boolean;
  notes?: string;
}

// ── Section 3: Financial Home (Triangle) ─────────────────────

export interface FinancialHomeData {
  /** Level 1: Foundation — income, protection, debts */
  level1Notes?: string;
  /** Level 2: Goals — offensive & defensive planning */
  level2Notes?: string;
  /** Level 3: Growth — investments, retirement */
  level3Notes?: string;
  /** Level 4: Wealth transfer / legacy */
  level4Notes?: string;
  notes?: string;
}

// ── Section 4: Financial X Curve (DIME / FIME) ──────────────

export interface DIMEAnalysis {
  /** Debt */
  totalDebt: number;
  debtBreakdown?: string;
  /** Income replacement */
  annualIncome: number;
  yearsOfIncomeToReplace: number;
  /** Mortgage */
  mortgageBalance: number;
  mortgageMonthlyPayment?: number;
  /** Education */
  educationFundNeeded: number;
  numberOfChildren: number;
}

export interface FIMEAnalysis {
  /** Final expenses */
  finalExpenses: number;
  /** Income replacement (same as DIME) */
  incomeReplacement: number;
  /** Mortgage (same as DIME) */
  mortgage: number;
  /** Education (same as DIME) */
  education: number;
}

export interface FinancialXCurveData {
  dime: DIMEAnalysis;
  fime?: FIMEAnalysis;
  /** Right side of X: Tax-free retirement, disability, protection */
  taxFreeRetirementGoal?: number;
  disabilityCoverageNeeded?: number;
  protectionNotes?: string;
  notes?: string;
}

// ── Section 5: Tax Diversification ───────────────────────────

export interface TaxDiversificationData {
  /** Tax Later: 401k, Traditional IRA */
  taxLaterTotal: number;
  taxLaterBreakdown?: string;
  /** Tax Advantage: Roth IRA, Roth 401k, IUL */
  taxAdvantageTotal: number;
  taxAdvantageBreakdown?: string;
  /** Tax Now: Brokerage, savings */
  taxNowTotal: number;
  taxNowBreakdown?: string;
  notes?: string;
}

// ── Top-level Financial Interview Data ───────────────────────

export type FinancialInterviewSection =
  | "financial-background"
  | "life-insurance-education"
  | "financial-home"
  | "financial-x-curve"
  | "tax-diversification";

export type FinancialInterviewStatus = "not-started" | "in-progress" | "completed";

export interface FinancialInterviewData {
  caseId: string;
  status: FinancialInterviewStatus;
  currentSection: FinancialInterviewSection;
  completedSections: FinancialInterviewSection[];

  /** Section 1 */
  primaryBackground?: PersonFinancialBackground;
  spouseBackground?: PersonFinancialBackground;

  /** Section 2 */
  lifeInsuranceEducation?: LifeInsuranceEducation;

  /** Section 3 */
  financialHome?: FinancialHomeData;

  /** Section 4 */
  financialXCurve?: FinancialXCurveData;

  /** Section 5 */
  taxDiversification?: TaxDiversificationData;

  lastUpdated: string;
}
