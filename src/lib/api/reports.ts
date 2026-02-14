import { apiClient } from "./client";
import type { ApiResponse, Report } from "@/types";

export interface ReportConfig {
  format?: string;
  includeCharts?: boolean;
  [key: string]: unknown;
}

export async function generateReport(
  caseId: string,
  config: ReportConfig = {}
): Promise<Report> {
  const { data } = await apiClient.post<ApiResponse<Report>>(
    `/reports/${caseId}/generate/`,
    config
  );
  return (data?.data ?? data) as Report;
}

export async function getReport(
  caseId: string,
  reportId: string
): Promise<Report> {
  const { data } = await apiClient.get<ApiResponse<Report>>(
    `/reports/${caseId}/${reportId}/`
  );
  return (data?.data ?? data) as Report;
}

export async function downloadReport(
  caseId: string,
  reportId: string
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(
    `/reports/${caseId}/${reportId}/download/`,
    { responseType: "blob" }
  );
  return data;
}
