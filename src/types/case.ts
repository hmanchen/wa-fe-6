/**
 * Case management types for WealthArchitect platform
 */

export const CaseStatus = {
  DRAFT: 'draft',
  DISCOVERY: 'discovery',
  ANALYSIS: 'analysis',
  RECOMMENDATION: 'recommendation',
  REPORT: 'report',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export type CaseStatus =
  | (typeof CaseStatus)[keyof typeof CaseStatus];

export const CasePriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type CasePriority =
  | (typeof CasePriority)[keyof typeof CasePriority];

export type CaseType = 'individual' | 'couple' | 'family';

export interface Case {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  priority: CasePriority;
  clientId: string;
  advisorId: string;
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  meetingDate?: string; // ISO 8601 date string
  caseType: CaseType;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  completedAt?: string; // ISO 8601 date string
}

/**
 * Simplified case representation for list views
 */
export interface CaseListItem {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  priority: CasePriority;
  clientId: string;
  clientName: string;
  title: string;
  caseType: CaseType;
  updatedAt: string;
}

export interface CreateCaseInput {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  meetingDate?: string;
  caseType: CaseType;
  description?: string;
}

export interface UpdateCaseInput {
  status?: CaseStatus;
  priority?: CasePriority;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  meetingDate?: string;
  caseType?: CaseType;
  title?: string;
  description?: string;
}
