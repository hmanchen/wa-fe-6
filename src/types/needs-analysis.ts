/**
 * Needs analysis types for WealthArchitect platform
 */

import type { DiscoveryData } from './discovery';

export type NeedsCategory =
  | 'income-replacement'
  | 'debt-clearance'
  | 'education-fund'
  | 'final-expenses'
  | 'emergency-fund'
  | 'estate-equalization';

export interface NeedLineItem {
  category: NeedsCategory;
  label: string;
  amount: number;
  assumptions: string[];
  notes?: string;
}

export interface CoverageGap {
  category: NeedsCategory;
  totalNeed: number;
  existingCoverage: number;
  gap: number;
  percentageCovered: number;
}

export interface NeedsAnalysisResult {
  caseId: string;
  totalInsuranceNeed: number;
  totalExistingCoverage: number;
  totalGap: number;
  lineItems: NeedLineItem[];
  coverageGaps: CoverageGap[];
  assumptions: Record<string, string | number>;
  computedAt: string; // ISO 8601 date string
  aiExplanation?: string;
}

export interface NeedsAnalysisInput {
  caseId: string;
  discoveryData: DiscoveryData;
}
