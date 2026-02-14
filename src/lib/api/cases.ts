import { apiClient } from "./client";
import type { ApiResponse, Case, PaginatedResponse } from "@/types";

export interface GetCasesParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export interface CreateCaseData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  meetingDate?: string;
  caseType: string;
  description?: string;
}

export interface UpdateCaseData {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  meetingDate?: string;
  caseType?: string;
  description?: string;
  status?: string;
}

/** Format a case type value for display (e.g. "life_insurance" → "Life Insurance") */
function formatCaseType(caseType: string): string {
  return caseType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Convert ISO date string to YYYY-MM-DD format for the backend */
function toDateString(isoDate?: string): string | undefined {
  if (!isoDate) return undefined;
  try {
    return new Date(isoDate).toISOString().split("T")[0];
  } catch {
    return undefined;
  }
}

/** Transform frontend camelCase form data to backend snake_case format */
function toBackendCreatePayload(formData: CreateCaseData) {
  return {
    case_name: `${formData.clientName} — ${formatCaseType(formData.caseType)}`,
    client_name: formData.clientName,
    client_email: formData.clientEmail,
    client_phone: formData.clientPhone || undefined,
    meeting_date: toDateString(formData.meetingDate),
    case_type: formData.caseType,
    description: formData.description || undefined,
  };
}

/** Transform frontend camelCase update data to backend snake_case format */
function toBackendUpdatePayload(formData: UpdateCaseData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {};
  if (formData.clientName !== undefined) payload.client_name = formData.clientName;
  if (formData.clientEmail !== undefined) payload.client_email = formData.clientEmail;
  if (formData.clientPhone !== undefined) payload.client_phone = formData.clientPhone;
  if (formData.meetingDate !== undefined) payload.meeting_date = toDateString(formData.meetingDate);
  if (formData.caseType !== undefined) payload.case_type = formData.caseType;
  if (formData.description !== undefined) payload.description = formData.description;
  if (formData.status !== undefined) payload.status = formData.status;
  return payload;
}

export async function getCases(
  params?: GetCasesParams
): Promise<PaginatedResponse<Case>> {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Case>>>(
    "/cases/",
    { params }
  );
  return (data?.data ?? data) as PaginatedResponse<Case>;
}

export async function getCase(id: string): Promise<Case> {
  const { data } = await apiClient.get<ApiResponse<Case>>(`/cases/${id}/`);
  return (data?.data ?? data) as Case;
}

export async function createCase(
  createData: CreateCaseData
): Promise<Case> {
  const payload = toBackendCreatePayload(createData);
  const { data } = await apiClient.post<ApiResponse<Case>>("/cases/", payload);
  return (data?.data ?? data) as Case;
}

export async function updateCase(
  id: string,
  updateData: UpdateCaseData
): Promise<Case> {
  const payload = toBackendUpdatePayload(updateData);
  const { data } = await apiClient.put<ApiResponse<Case>>(
    `/cases/${id}/`,
    payload
  );
  return (data?.data ?? data) as Case;
}

export async function deleteCase(id: string): Promise<void> {
  await apiClient.delete(`/cases/${id}/`);
}
