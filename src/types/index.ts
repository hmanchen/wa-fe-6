/**
 * WealthArchitect type definitions
 * Insurance-centric financial intelligence platform for advisors
 */

// API types
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
} from './api';

// Case management types
export {
  CaseStatus,
  CasePriority,
} from './case';
export type {
  Case,
  CaseListItem,
  CreateCaseInput,
  UpdateCaseInput,
} from './case';

// Client types
export type {
  MaritalStatus,
  Gender,
  EmploymentStatus,
  SmokingStatus,
  Address,
  ClientPersonalInfo,
  ClientFinancialProfile,
  ExistingCoverageType,
  ExistingCoverage,
  ClientInfo,
} from './client';

// Discovery workflow types
export type {
  DiscoveryStep,
  DiscoveryStatus,
  GoalType,
  ClientGoal,
  DiscoveryData,
} from './discovery';

// Needs analysis types
export type {
  NeedsCategory,
  NeedLineItem,
  CoverageGap,
  NeedsAnalysisResult,
  NeedsAnalysisInput,
} from './needs-analysis';

// Recommendation types
export type {
  ProductType,
  PremiumFrequency,
  InsuranceProduct,
  FundingValidation,
  RecommendationStatus,
  Recommendation,
} from './recommendation';

// Report types
export type {
  ReportSection,
  ReportConfig,
  ReportStatus,
  Report,
} from './report';

// Financial Interview types
export type {
  EmploymentRecord,
  HSADetails,
  IRADetails,
  RothIRADetails,
  BrokerageDetails,
  SystematicInvestment,
  FundsAbroad,
  PersonFinancialBackground,
  FinancialInterviewSection,
  FinancialInterviewStatus,
  FinancialInterviewData,
} from './financial-interview';
