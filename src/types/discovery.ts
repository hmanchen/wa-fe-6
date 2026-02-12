/**
 * Discovery workflow types for WealthArchitect platform
 */

import type {
  ClientPersonalInfo,
  ClientFinancialProfile,
  ExistingCoverage,
} from './client';

export type DiscoveryStep =
  | 'personal-info'
  | 'financial-profile'
  | 'existing-coverage'
  | 'goals-priorities';

export type DiscoveryStatus =
  | 'not-started'
  | 'in-progress'
  | 'completed';

export type GoalType =
  | 'income-replacement'
  | 'debt-protection'
  | 'education-funding'
  | 'retirement'
  | 'estate-planning'
  | 'business-succession'
  | 'critical-illness'
  | 'disability';

export interface ClientGoal {
  id: string;
  type: GoalType;
  description: string;
  priority: number;
  targetAmount?: number;
  timeHorizon?: string; // e.g., "5 years", "10 years"
}

export interface DiscoveryData {
  caseId: string;
  status: DiscoveryStatus;
  currentStep: DiscoveryStep;
  personalInfo?: ClientPersonalInfo;
  financialProfile?: ClientFinancialProfile;
  existingCoverage: ExistingCoverage[];
  goals: ClientGoal[];
  notes?: string;
  completedSteps: DiscoveryStep[];
  lastUpdated: string; // ISO 8601 date string
}
