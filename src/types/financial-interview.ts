/**
 * Financial Interview types for WealthArchitect platform
 *
 * The Financial Interview is a multi-section workflow where the advisor
 * captures detailed financial data while educating the client.
 */

// ── Contribution Limits ─────────────────────────────────────

export interface ContributionLimitRow {
  id: string;
  taxYear: number;
  planType: string;
  coverageType: string;
  ageGroup: string;
  limitAmount: number;
  description: string;
  notes: string | null;
  source: string;
}

export interface ContributionLimitPlan {
  planType: string;
  planDisplayName: string;
  limits: ContributionLimitRow[];
}

export interface ContributionLimitsData {
  taxYear: number;
  totalRecords: number;
  plans: ContributionLimitPlan[];
}

// ── Market Snapshot ─────────────────────────────────────────

export interface MarketTrend {
  days: number;
  startPrice: number;
  endPrice: number;
  changePercent: number;
  direction: "up" | "down" | "flat";
}

export interface MarketSnapshot {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  changeAmount: number;
  changePercent: number;
  trend: MarketTrend;
  sentiment: "positive" | "negative" | "neutral";
  sentimentLabel: string;
  marketStatus: "open" | "closed" | "pre_market" | "after_hours";
  lastUpdated: string;
  source: string;
  cached: boolean;
}

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

export type EducationAccountOwner = "primary" | "spouse" | "grandparent" | "child" | "other";
export type EducationInvestmentAllocation = "conservative" | "moderate" | "aggressive" | "age_based";
export type EducationOtherAccountType =
  | "utma_ugma"
  | "coverdell_esa"
  | "savings_bonds"
  | "regular_savings"
  | "cash_value_life_insurance"
  | "other";

export interface CollegeSavingsChildPlan {
  id: string;
  childName: string;
  childAge: number;
  has529Plan: boolean;
  balance529?: number;
  monthlyContribution529?: number;
  annualContribution529?: number;
  accountOwner529?: EducationAccountOwner;
  statePlan529?: string;
  investmentAllocation529?: EducationInvestmentAllocation;
  yearsFunded529?: number;
  hasOtherEducationSavings: boolean;
  otherAccountType?: EducationOtherAccountType;
  otherAccountTypeCustom?: string;
  otherCurrentBalance?: number;
  otherMonthlyContribution?: number;
  otherAccountOwner?: EducationAccountOwner;
  hasPrepaidTuition: boolean;
  prepaidPlanType?: "state_prepaid" | "private_college_prepaid";
  prepaidCreditsPurchased?: number;
  prepaidEstimatedValueAtEnrollment?: number;
  prepaidSpecificSchoolLockedIn?: boolean;
  prepaidSchoolName?: string;
}

export interface CollegeSavingsDetails {
  children: CollegeSavingsChildPlan[];
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
  hasPrimaryResidence?: boolean;
  hasRentalProperties?: boolean;
  hasInternationalProperties?: boolean;
  /** Primary residence mortgage/property information */
  primaryResidence?: {
    propertyType?: "primary_residence";
    estimatedMarketValue?: number;
    yearPurchased?: number;
    propertyAddress?: string;
    hasMortgage?: boolean;
    mortgageBalance?: number;
    originalLoanAmount?: number;
    interestRate?: number;
    loanType?: "fixed" | "arm" | "interest_only";
    armCurrentRate?: number;
    armAdjustmentPeriodMonths?: number;
    armRateCap?: number;
    loanTermYears?: number;
    monthlyPaymentPiti?: number;
    principalAndInterestMonthly?: number;
    propertyTaxesMonthly?: number;
    propertyTaxesAnnual?: number;
    homeownersInsuranceMonthly?: number;
    homeownersInsuranceAnnual?: number;
    hoaFeesMonthly?: number;
    pmiMonthly?: number;
    remainingTermYears?: number;
  };
  rentalProperties?: Array<{
    id: string;
    propertyLabel?: string;
    propertyType?: "single_family" | "multi_family" | "condo" | "commercial" | "other";
    estimatedMarketValue?: number;
    yearPurchased?: number;
    locationCity?: string;
    locationState?: string;
    country?: string;
    hasMortgage?: boolean;
    mortgageBalance?: number;
    interestRate?: number;
    loanType?: "fixed" | "arm" | "interest_only";
    monthlyMortgagePayment?: number;
    remainingTermYears?: number;
    monthlyRentalIncomeGross?: number;
    monthlyPropertyManagementFee?: number;
    monthlyPropertyTaxes?: number;
    monthlyInsurance?: number;
    monthlyHoaFees?: number;
    monthlyMaintenance?: number;
    currentVacancyStatus?: "occupied" | "vacant" | "partially_occupied";
    averageVacancyRatePct?: number;
  }>;
  internationalProperties?: Array<{
    id: string;
    propertyLabel?: string;
    country?: string;
    estimatedMarketValueUsd?: number;
    isIncomeProducing?: boolean;
    estimatedMonthlyRentalIncomeUsd?: number;
    ownershipStatus?: "sole_owner" | "joint_with_family" | "inherited" | "under_construction";
    hasMortgage?: boolean;
    mortgageBalance?: number;
    interestRate?: number;
    loanType?: "fixed" | "arm" | "interest_only";
    monthlyMortgagePayment?: number;
    remainingTermYears?: number;
  }>;
  /** Legacy fields retained for backward compatibility */
  numberOfProperties?: number;
  totalMarketValue?: number;
  totalMortgageBalance?: number;
  monthlyRentalIncome?: number;
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

export type MatchStructureType = "simple" | "tiered" | "dollar_capped" | "tenure" | "auto_plus_match";

export interface TenureTier {
  matchRatePercent?: number;
  upToYears?: number;
}

export interface Retirement401kDetails {
  has401k: boolean;
  /** Current employer plan — Pre-tax (Traditional 401k) */
  currentBalance?: number;
  /** % of salary the employee contributes pre-tax */
  employeeContributionPercent?: number;
  /** Pay periods per year: 12 (monthly), 24 (semi-monthly), 26 (bi-weekly), 52 (weekly) */
  payFrequency?: number;

  /** Employer match structure type */
  matchStructureType?: MatchStructureType;

  /** Tier 1 match rate (all types) */
  employerMatchPercent?: number;
  /** Tier 1 cap % of salary (all types) */
  employerMatchCapPercent?: number;

  /** Tiered match — Tier 2 */
  tier2MatchRatePercent?: number;
  tier2CapPercent?: number;
  /** Tiered match — Tier 3 (optional) */
  tier3MatchRatePercent?: number;
  tier3CapPercent?: number;

  /** Dollar-capped match */
  maxEmployerMatchDollars?: number;

  /** Tenure-based match */
  yearsOfService?: number;
  tenureTiers?: TenureTier[];

  /** Auto + match */
  autoContributionPercent?: number;
  autoContributionType?: "flat" | "age_based" | "performance_bonus";
  ageBracketUnder30?: number;
  ageBracket30to39?: number;
  ageBracket40to49?: number;
  ageBracket50Plus?: number;

  /** Employer matching contribution (annual, computed) */
  employerMatchAmount?: number;
  /** Employee pre-tax contribution (per pay period, legacy) */
  employeePreTaxContribution?: number;
  isMaxedOut?: boolean;
  /** 401(k) After-tax contributions (mega backdoor eligible) */
  afterTaxBalance?: number;
  afterTaxContribution?: number;
  /** Roth 401(k) / Post-tax contributions */
  roth401kBalance?: number;
  roth401kContribution?: number;
  /** Outstanding 401(k) loans */
  hasLoan?: boolean;
  loanBalance?: number;
  loanPaymentAmount?: number;
  /** Has an old/previous 401(k) from a prior employer */
  hasOld401k?: boolean;
  old401kBalance?: number;
  old401kAction?: "rolled-over" | "left-with-employer" | "cashed-out" | "converted-to-roth";
  /** Multiple previous 401(k) accounts */
  previous401ks?: Previous401k[];
}

export interface BackdoorRothIRADetails {
  hasBackdoorRoth: boolean;
  /** Annual contribution to traditional IRA (non-deductible) then converted */
  annualContribution?: number;
  /** Current balance after conversions */
  currentBalance?: number;
  /** Has pro-rata issue (existing pre-tax IRA balances) */
  hasProRataIssue?: boolean;
}

export type DebtType =
  | "mortgage"
  | "auto-loan"
  | "student-loan"
  | "credit-card"
  | "personal-loan"
  | "heloc"
  | "401k-loan"
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
  /** Whether group life coverage is selected as salary multiple */
  groupLifeBasedOnSalary?: boolean;
  /** Salary multiple used for group life (1x-10x) */
  groupLifeSalaryMultiple?: number;
  groupLifeAmount?: number;
  /** Individual term life */
  hasTermLife?: boolean;
  termLifeAmount?: number;
  termLifePremium?: number;
  termLengthYears?: number;
  /** Term policy includes living benefits rider */
  hasLivingBenefits?: boolean;
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

// ── Section 2: Goals & Discovery ─────────────────────────────

export type GoalOptionId =
  | "retire_comfortably"
  | "protect_family"
  | "pay_off_debt"
  | "fund_education"
  | "tax_free_retirement"
  | "protect_market_losses"
  | "create_legacy"
  | "emergency_cash_access"
  | "generate_passive_income"
  | "care_aging_parents"
  | "grow_wealth_aggressively"
  | "start_grow_business";

export interface GoalRankingItem {
  rank: number;
  goalId: GoalOptionId;
  label: string;
}

export interface PensionDiscoveryDetails {
  who: "primary" | "spouse" | "both";
  estimatedMonthlyAmount?: number;
  startAge?: number;
}

export interface RetirementVision {
  primaryRetirementAge?: number;
  spouseRetirementAge?: number;
  desiredMonthlyIncome?: number;
  retirementConfidence?: number;
  socialSecurityExpectation?:
    | "full_benefits"
    | "reduced_benefits"
    | "no_social_security"
    | "not_sure";
  hasPension?: boolean;
  pensionDetails?: PensionDiscoveryDetails | null;
}

export interface RiskProfile {
  riskTolerance?: "conservative" | "moderate" | "aggressive";
  timeHorizon?: "short_term" | "medium_term" | "long_term";
  marketLossReaction?:
    | "sell_everything"
    | "sell_some"
    | "hold_steady"
    | "buy_more";
  marketExperience?: string[];
  downturnActionTaken?:
    | "sell_everything"
    | "sell_some"
    | "hold_steady"
    | "buy_more";
}

export interface DebtPayoffGoal {
  enabled: boolean;
  targetDebt?: string;
  targetDate?: string;
}

export interface MajorPurchaseGoal {
  type: string;
  estimatedCost?: number;
  targetYear?: number;
}

export interface EducationPreference {
  childName: string;
  childId: string;
  preference:
    | "public_university"
    | "private_university"
    | "community_college_first"
    | "trade_school"
    | "not_sure"
    | "child_self_funded";
}

export interface LegacyGoal {
  type?:
    | "as_much_as_possible"
    | "specific_amount"
    | "not_a_priority"
    | "not_thought_about";
  specificAmount?: number | null;
}

export interface SpecificGoals {
  debtPayoff?: DebtPayoffGoal;
  majorPurchases?: MajorPurchaseGoal[];
  educationPreferences?: EducationPreference[];
  legacy?: LegacyGoal;
  otherGoals?: string;
}

export interface DiscoveryConcerns {
  financialFears?: string[];
  recentTrigger?: string;
  peaceOfMind?: string;
  otherFearText?: string;
}

export interface GoalsDiscoveryData {
  goalsRanking: GoalRankingItem[];
  retirementVision: RetirementVision;
  riskProfile: RiskProfile;
  specificGoals: SpecificGoals;
  concerns: DiscoveryConcerns;
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
  backdoorRothIRA: BackdoorRothIRADetails;
  pension: PensionDetails;
  plan403b457b: Plan403b457bDetails;
  brokerage: BrokerageDetails;
  cd: CDDetails;
  bonds: BondHoldingsDetails;
  annuity: AnnuityDetails;
  equityCompensation: EquityCompensationDetails;
  education529: Education529Details;
  collegeSavings?: CollegeSavingsDetails;
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
  id?: string;
  label: string;
  points: number;
  maxPoints: number;
  met: boolean;
  notApplicable?: boolean;
}

export interface HealthScoreSubsection {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  factors: HealthScoreFactor[];
}

export interface HealthScoreCategory {
  score: number | null;
  maxScore: number;
  factors: HealthScoreFactor[];
  subsections?: HealthScoreSubsection[];
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
    totalAssets?: number;
    totalLiabilities?: number;
    netWorth?: number;
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
    taxDeferredItems?: Array<{ instrument: string; assetType?: string; amount: number }>;
    taxFreeItems?: Array<{ instrument: string; assetType?: string; amount: number }>;
    taxableItems?: Array<{ instrument: string; assetType?: string; amount: number }>;
  };
  rolloverOpportunity?: {
    eligible: boolean;
    candidateAccounts: number;
    totalBalance: number;
    state?: string;
    bonusLowPct: number;
    bonusHighPct: number;
    bonusLowAmount: number;
    bonusHighAmount: number;
    message: string;
  };
  realEstateAnalysis?: {
    hasPrimaryProperty: boolean;
    primary: {
      marketValue: number;
      mortgageBalance: number;
      homeEquity: number;
      equityPercentage: number;
      housingCostRatio: number;
      loanToValue: number;
      monthlyPayment: number;
      remainingTermYears: number;
    };
    rentalProperties: Array<{
      label: string;
      propertyType?: string;
      location?: string;
      marketValue: number;
      mortgageBalance: number;
      monthlyMortgagePayment: number;
      monthlyGrossRent: number;
      monthlyExpenses: number;
      monthlyNetIncome: number;
      rentalYieldPct: number;
      cashOnCashReturnPct: number;
      equity: number;
      debtServiceCoverageRatio: number;
      vacancyRatePct: number;
      occupiedStatus?: string;
      country?: string;
      isInternational: boolean;
    }>;
    totalMonthlyNetRentalIncome: number;
    totalRentalEquity: number;
    concentrationPctOfNetWorth: number;
    alerts: string[];
  };
  educationFundingAnalysis?: {
    children: Array<{
      name: string;
      age: number;
      yearsToCollege: number;
      enrollmentYear: number;
      educationPreference: string;
      status: string;
      projectedTotalNeed: number;
      projectedSavingsAtEnrollment: number;
      shortfall: number;
      fundingPercentage: number;
      monthlyNeededToCloseGap: number;
      projectedAnnualCostAtEnrollment: number;
      programYears: number;
      totalExistingSavings: number;
      totalMonthlyContributions: number;
      has529: boolean;
      accountOwner529?: string;
    }>;
    projectedTotalEducationNeed: number;
    existingEducationAssets: number;
    projectedSavingsAtEnrollment: number;
    projectedShortfall: number;
    totalMonthlyContributions: number;
    additionalMonthlyNeeded: number;
    overallFundingPercentage: number;
    dualEnrollmentOverlap: boolean;
    dualEnrollmentYears: number;
    dualEnrollmentAnnualCost: number;
    dualEnrollmentPeriod: string;
    hasAnyEducationSavings: boolean;
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
  | "goals-discovery"
  | "income-replacement-risk"
  | "protection-estate"
  | "analysis-dashboard"
  | "financial-home"
  | "financial-home-pyramid"
  | "financial-x-curve"
  | "recommendations"
  | "iul-illustration"
  | "college-funding"
  | "debt-freedom"
  | "retirement-diversification"
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
  goalsDiscovery?: GoalsDiscoveryData;

  /** Section 3 */
  lifeInsuranceEducation?: LifeInsuranceEducation;

  /** Section 4 */
  financialHome?: FinancialHomeData;

  /** Section 5 */
  financialXCurve?: FinancialXCurveData;

  /** Section 6 */
  taxDiversification?: TaxDiversificationData;

  lastUpdated: string;
}
