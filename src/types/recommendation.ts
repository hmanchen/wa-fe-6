/**
 * Recommendation types for WealthArchitect platform
 */

export type ProductType =
  | 'term-life'
  | 'whole-life'
  | 'universal-life'
  | 'critical-illness'
  | 'disability'
  | 'health';

export type PremiumFrequency = 'monthly' | 'annual';

export interface InsuranceProduct {
  id: string;
  type: ProductType;
  provider: string;
  productName: string;
  coverageAmount: number;
  premium: number;
  premiumFrequency: PremiumFrequency;
  term?: number; // years, for term products
  features: string[];
  notes?: string;
}

export interface FundingValidation {
  isAffordable: boolean;
  monthlyPremiumTotal: number;
  incomePercentage: number;
  maxRecommendedPercentage: number;
  notes?: string;
}

export type RecommendationStatus =
  | 'draft'
  | 'reviewed'
  | 'approved'
  | 'sent';

export interface Recommendation {
  id: string;
  caseId: string;
  products: InsuranceProduct[];
  fundingValidation: FundingValidation;
  totalCoverageProvided: number;
  remainingGap: number;
  advisorNotes?: string;
  aiSummary?: string;
  status: RecommendationStatus;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}
