import { apiClient } from "./client";
import type { ApiResponse, DiscoveryData } from "@/types";

export async function getDiscoveryData(
  caseId: string
): Promise<DiscoveryData> {
  const { data } = await apiClient.get<ApiResponse<DiscoveryData>>(
    `/cases/${caseId}/discovery/`
  );
  return (data?.data ?? data) as DiscoveryData;
}

export async function updateDiscoveryData(
  caseId: string,
  updateData: Partial<DiscoveryData>
): Promise<DiscoveryData> {
  const { data } = await apiClient.put<ApiResponse<DiscoveryData>>(
    `/cases/${caseId}/discovery/`,
    updateData
  );
  return (data?.data ?? data) as DiscoveryData;
}

export async function completeDiscoveryStep(
  caseId: string,
  step: string
): Promise<DiscoveryData> {
  const { data } = await apiClient.post<ApiResponse<DiscoveryData>>(
    `/cases/${caseId}/discovery/complete-step/`,
    { step }
  );
  return (data?.data ?? data) as DiscoveryData;
}
