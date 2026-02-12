/**
 * Client types for WealthArchitect platform
 */

export type MaritalStatus =
  | 'single'
  | 'married'
  | 'common-law'
  | 'separated'
  | 'divorced'
  | 'widowed';

export type Gender =
  | 'male'
  | 'female'
  | 'non-binary'
  | 'prefer-not-to-say';

export type EmploymentStatus =
  | 'employed'
  | 'self-employed'
  | 'unemployed'
  | 'retired'
  | 'student'
  | 'homemaker'
  | 'disabled'
  | 'other';

export type SmokingStatus =
  | 'non-smoker'
  | 'smoker'
  | 'former-smoker'
  | 'occasional';

export interface Address {
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface ClientPersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO 8601 date string
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  dependents: number;
  email?: string;
  phone?: string;
  address?: Address;
}

export interface ClientFinancialProfile {
  annualIncome: number;
  monthlyExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  investmentAssets: number;
  retirementSavings: number;
  emergencyFund: number;
  monthlyDebtPayments: number;
}

export type ExistingCoverageType =
  | 'life'
  | 'health'
  | 'disability'
  | 'critical-illness'
  | 'long-term-care'
  | 'other';

export interface ExistingCoverage {
  type: ExistingCoverageType;
  provider: string;
  policyNumber?: string;
  coverageAmount: number;
  premium: number; // monthly or annual based on context
  startDate: string; // ISO 8601 date string
  endDate?: string; // ISO 8601 date string
  notes?: string;
}

export interface ClientInfo {
  personalInfo: ClientPersonalInfo;
  financialProfile: ClientFinancialProfile;
  existingCoverage: ExistingCoverage[];
}
