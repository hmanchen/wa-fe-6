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

export async function getCases(
  params?: GetCasesParams
): Promise<PaginatedResponse<Case>> {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Case>>>(
    "/cases",
    { params }
  );
  return (data?.data ?? data) as PaginatedResponse<Case>;
}

export async function getCase(id: string): Promise<Case> {
  const { data } = await apiClient.get<ApiResponse<Case>>(`/cases/${id}`);
  return (data?.data ?? data) as Case;
}

export async function createCase(
  createData: CreateCaseData
): Promise<Case> {
  const { data } = await apiClient.post<ApiResponse<Case>>("/cases", createData);
  return (data?.data ?? data) as Case;
}

export async function updateCase(
  id: string,
  updateData: UpdateCaseData
): Promise<Case> {
  const { data } = await apiClient.patch<ApiResponse<Case>>(
    `/cases/${id}`,
    updateData
  );
  return (data?.data ?? data) as Case;
}

export async function deleteCase(id: string): Promise<void> {
  await apiClient.delete(`/cases/${id}`);
}
