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

export interface CDDetails {
  hasCDs: boolean;
  /** Number of CDs held */
  numberOfCDs?: number;
  /** Total value across all CDs */
  totalValue?: number;
  /** Highest interest rate among CDs */
  interestRate?: number;
  /** Institution holding CDs */
  institution?: string;
  /** Longest remaining term in months */
  longestTermMonths?: number;
}

export interface CashOnHandDetails {
  hasCashOnHand: boolean;
  /** Checking account balance */
  checkingBalance?: number;
  /** Savings account balance */
  savingsBalance?: number;
  /** Emergency fund target (months of expenses) */
  emergencyFundMonths?: number;
}

export interface PensionDetails {
  hasPension: boolean;
  /** Employer / plan provider */
  employer?: string;
  /** Vested or not */
  isVested?: boolean;
  /** Estimated monthly benefit at retirement */
  estimatedMonthlyBenefit?: number;
  /** Lump-sum option value (if offered) */
  lumpSumOption?: number;
  /** Years of service credited */
  yearsOfService?: number;
  /** Eligible retirement age for this plan */
  eligibleRetirementAge?: number;
}

export interface Plan403b457bDetails {
  hasPlan: boolean;
  planType?: "403b" | "457b" | "both";
  annualContribution?: number;
  currentBalance?: number;
  employerMatch?: boolean;
  employerMatchPercent?: number;
  isMaxedOut?: boolean;
}

export interface Education529Details {
  has529: boolean;
  /** Number of 529 accounts (one per beneficiary typically) */
  numberOfAccounts?: number;
  totalBalance?: number;
  annualContribution?: number;
  /** State plan used (some offer state tax deductions) */
  statePlan?: string;
  /** Beneficiary names / count */
  beneficiaryCount?: number;
}

export interface AnnuityDetails {
  hasAnnuity: boolean;
  type?: "fixed" | "variable" | "indexed" | "immediate";
  provider?: string;
  currentValue?: number;
  /** Annual guaranteed rate (fixed/indexed) */
  guaranteedRate?: number;
  surrenderPeriodYearsRemaining?: number;
  /** Monthly income if annuitized */
  monthlyIncome?: number;
}

export interface BondHoldingsDetails {
  hasBonds: boolean;
  /** Municipal bonds — tax-free interest */
  municipalBondValue?: number;
  /** US Treasury / I-Bonds / T-Bills */
  treasuryBondValue?: number;
  /** Corporate bonds */
  corporateBondValue?: number;
  /** Bond funds / ETFs */
  bondFundValue?: number;
  /** Average yield across holdings */
  averageYieldPercent?: number;
}

export interface EquityCompensationDetails {
  hasEquityComp: boolean;
  /** Vested stock options value */
  vestedOptionsValue?: number;
  /** Unvested stock options value */
  unvestedOptionsValue?: number;
  /** Restricted Stock Units (RSUs) — vested value */
  vestedRSUValue?: number;
  /** RSUs — unvested value */
  unvestedRSUValue?: number;
  /** ESPP participation */
  hasESPP?: boolean;
  esppContributionPercent?: number;
  companyName?: string;
}

export interface RealEstateDetails {
  hasRealEstate: boolean;
  /** Number of investment properties (excluding primary home) */
  numberOfProperties?: number;
  /** Total estimated market value of investment properties */
  totalMarketValue?: number;
  /** Total outstanding mortgage on investment properties */
  totalMortgageBalance?: number;
  /** Monthly rental income across all properties */
  monthlyRentalIncome?: number;
  /** Primary home equity (market value minus mortgage) */
  primaryHomeEquity?: number;
}

export interface CryptoDetails {
  hasCrypto: boolean;
  /** Total current value of crypto holdings */
  totalValue?: number;
  /** Platforms used (Coinbase, Binance, etc.) */
  platforms?: string;
  /** Major holdings (BTC, ETH, etc.) */
  majorHoldings?: string;
  /** Cost basis (for tax purposes) */
  approximateCostBasis?: number;
}

export interface SocialSecurityDetails {
  hasEstimate: boolean;
  /** Estimated monthly benefit at full retirement age */
  estimatedMonthlyBenefitFRA?: number;
  /** Full retirement age (66, 67, etc.) */
  fullRetirementAge?: number;
  /** Estimated benefit if taken early (age 62) */
  estimatedBenefitEarly?: number;
  /** Estimated benefit if delayed (age 70) */
  estimatedBenefitDelayed?: number;
  /** Years of qualifying work credits */
  qualifyingYears?: number;
}

export type EmploymentStatus = "employed" | "self-employed" | "not-working";

export type IncomeSourceType = "employer" | "business" | "side-hustle";

export interface IncomeSource {
  id: string;
  type: IncomeSourceType;
  isCurrent: boolean;
  /** Employer / business / gig name */
  name?: string;
  annualIncome?: number;
  annualBonus?: number;
  frequency?: "weekly" | "biweekly" | "semi-monthly" | "monthly" | "annual";
  /** For business / side hustle */
  businessType?: string;
  /** Years at this job/business */
  yearsAtJob?: number;
  /** Has a 401k at this employer (links to retirement) */
  has401k?: boolean;
}

export interface IncomeDetails {
  employmentStatus?: EmploymentStatus;
  /** Employer name (when employed) — kept for backward compat */
  employerName?: string;
  annualSalary?: number;
  /** Business / self-employment annual income */
  businessIncome?: number;
  /** Type of business or self-employment */
  businessType?: string;
  otherIncome?: number;
  otherIncomeSource?: string;
  /** Bonus / commission (annual estimate) */
  annualBonus?: number;
  incomeFrequency?: "weekly" | "biweekly" | "semi-monthly" | "monthly" | "annual";
  /** Multiple income sources (employers, businesses, side hustles) */
  incomeSources?: IncomeSource[];
}

export interface MonthlyExpensesDetails {
  housing?: number;
  utilities?: number;
  transportation?: number;
  groceries?: number;
  insurance?: number;
  childcare?: number;
  entertainment?: number;
  diningOut?: number;
  subscriptions?: number;
  otherExpenses?: number;
}

export interface Previous401k {
  id: string;
  employerName?: string;
  balance?: number;
  action?: "rolled-over" | "left-with-employer" | "cashed-out" | "converted-to-roth";
}

export interface Retirement401kDetails {
  has401k: boolean;
  /** Current employer plan */
  currentBalance?: number;
  employerMatchPercent?: number;
  employeeContributionPercent?: number;
  isMaxedOut?: boolean;
  /** Has an old/previous 401(k) from a prior employer */
  hasOld401k?: boolean;
  old401kBalance?: number;
  old401kAction?: "rolled-over" | "left-with-employer" | "cashed-out" | "converted-to-roth";
  /** Multiple previous 401(k) accounts */
  previous401ks?: Previous401k[];
}

export type DebtType =
  | "mortgage"
  | "auto-loan"
  | "student-loan"
  | "credit-card"
  | "personal-loan"
  | "heloc"
  | "medical-debt"
  | "tax-debt"
  | "business-loan"
  | "other";

export interface DebtEntry {
  id: string;
  type: DebtType;
  description?: string;
  balance?: number;
  monthlyPayment?: number;
  interestRate?: number;
}

export interface DebtsLiabilities {
  /** Primary mortgage */
  mortgageBalance?: number;
  mortgageMonthlyPayment?: number;
  /** Auto loans */
  autoLoanBalance?: number;
  autoLoanMonthlyPayment?: number;
  /** Student loans */
  studentLoanBalance?: number;
  studentLoanMonthlyPayment?: number;
  /** Credit card debt */
  creditCardBalance?: number;
  creditCardMinPayment?: number;
  /** Personal / other loans */
  otherLoanBalance?: number;
  otherLoanMonthlyPayment?: number;
  otherLoanDescription?: string;
  /** Dynamic debt entries */
  entries?: DebtEntry[];
}

export interface LifeInsuranceCoverage {
  /** Employer-provided group life */
  hasGroupLife?: boolean;
  groupLifeAmount?: number;
  /** Individual term life */
  hasTermLife?: boolean;
  termLifeAmount?: number;
  termLifePremium?: number;
  termLengthYears?: number;
  /** Whole / universal / IUL */
  hasPermLife?: boolean;
  permLifeType?: "whole-life" | "universal" | "iul" | "other";
  permLifeAmount?: number;
  permLifePremium?: number;
  permLifeCashValue?: number;
  /** Total coverage */
  totalCoverageAmount?: number;
  /** Disability insurance */
  hasDisabilityInsurance?: boolean;
  disabilityMonthlyBenefit?: number;
  /** Long-term care */
  hasLongTermCare?: boolean;
  /** Umbrella policy */
  hasUmbrellaPolicy?: boolean;
  umbrellaCoverageAmount?: number;
}

export interface EstatePlanning {
  /** Will */
  hasWill?: boolean;
  willLastUpdated?: string;
  /** Trust */
  hasTrust?: boolean;
  trustType?: "revocable" | "irrevocable" | "other";
  /** Power of Attorney */
  hasPowerOfAttorney?: boolean;
  /** Healthcare Directive / Living Will */
  hasHealthcareDirective?: boolean;
  /** Beneficiary designations current? */
  beneficiaryDesignationsCurrent?: boolean;
  notes?: string;
}

export interface PersonFinancialBackground {
  /** "primary" or "spouse" */
  role: "primary" | "spouse";
  yearsInCountry: number;
  countryOfResidence: string;
  income: IncomeDetails;
  monthlyExpenses: MonthlyExpensesDetails;
  retirement401k: Retirement401kDetails;
  employmentHistory: EmploymentRecord[];
  hsa: HSADetails;
  ira: IRADetails;
  rothIRA: RothIRADetails;
  pension: PensionDetails;
  plan403b457b: Plan403b457bDetails;
  brokerage: BrokerageDetails;
  cd: CDDetails;
  bonds: BondHoldingsDetails;
  annuity: AnnuityDetails;
  equityCompensation: EquityCompensationDetails;
  education529: Education529Details;
  realEstate: RealEstateDetails;
  crypto: CryptoDetails;
  cashOnHand: CashOnHandDetails;
  socialSecurity: SocialSecurityDetails;
  systematicInvestments: SystematicInvestment;
  fundsAbroad: FundsAbroad;
  debts: DebtsLiabilities;
  lifeInsurance: LifeInsuranceCoverage;
  estate: EstatePlanning;
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

// ── Financial Health Score (from backend) ─────────────────────

export interface HealthScoreFactor {
  label: string;
  points: number;
  maxPoints: number;
  met: boolean;
}

export interface HealthScoreCategory {
  score: number | null;
  maxScore: number;
  factors: HealthScoreFactor[];
}

export interface HealthScoreInsightCard {
  title: string;
  detail: string;
}

export interface FinancialHealthScore {
  totalScore: number;
  maxPossibleScore: number;
  categories: {
    retirement: HealthScoreCategory;
    education: HealthScoreCategory;
    tax: HealthScoreCategory;
    protection: HealthScoreCategory;
    estate: HealthScoreCategory;
  };
  netWorth: {
    total: number;
    breakdown: {
      retirement: number;
      investments: number;
      savings: number;
      realEstate: number;
      other: number;
    };
  };
  taxBuckets: {
    taxDeferred: number;
    taxFree: number;
    taxable: number;
  };
  insights: {
    strengths: HealthScoreInsightCard[];
    gaps: HealthScoreInsightCard[];
    advisorHints: string[];
    summary: string;
  };
}

// ── Top-level Financial Interview Data ───────────────────────

export type FinancialInterviewSection =
  | "financial-background"
  | "income-replacement-risk"
  | "protection-estate"
  | "analysis-dashboard"
  | "financial-home"
  | "financial-x-curve"
  | "recommendations"
  | "delivery";

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
