/**
 * Report types for WealthArchitect platform
 */

export type ReportSection =
  | 'executive-summary'
  | 'client-profile'
  | 'needs-analysis'
  | 'recommendations'
  | 'funding-summary'
  | 'next-steps';

export interface ReportConfig {
  sections: Record<ReportSection, boolean>;
  includeCharts: boolean;
  includeAiExplanations: boolean;
  advisorSignature: boolean;
  companyBranding: boolean;
}

export type ReportStatus =
  | 'generating'
  | 'ready'
  | 'error';

export interface Report {
  id: string;
  caseId: string;
  config: ReportConfig;
  generatedAt: string; // ISO 8601 date string
  pdfUrl?: string;
  status: ReportStatus;
}
