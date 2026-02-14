import { apiClient } from "./client";
import type { ApiResponse, DiscoveryData } from "@/types";
import type { DiscoveryStep } from "@/types/discovery";

/**
 * Transform backend snake_case discovery response to frontend camelCase.
 * Handles both snake_case and camelCase keys so it works regardless of backend format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromBackendDiscovery(raw: any): DiscoveryData {
  return {
    caseId: raw.case_id ?? raw.caseId ?? "",
    status: raw.status ?? "not-started",
    currentStep: (raw.current_step ?? raw.currentStep ?? "personal-info") as DiscoveryStep,
    personalInfo: raw.personal_info ?? raw.personalInfo,
    financialProfile: raw.financial_profile ?? raw.financialProfile,
    existingCoverage: raw.existing_coverage ?? raw.existingCoverage ?? [],
    goals: raw.goals ?? [],
    notes: raw.notes,
    completedSteps: (raw.completed_steps ?? raw.completedSteps ?? []) as DiscoveryStep[],
    lastUpdated: raw.last_updated ?? raw.lastUpdated ?? raw.updated_at ?? "",
  };
}

/**
 * Transform frontend camelCase update payload to backend snake_case.
 */
function toBackendDiscoveryPayload(updateData: Partial<DiscoveryData>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {};

  if (updateData.personalInfo !== undefined) payload.personal_info = updateData.personalInfo;
  if (updateData.financialProfile !== undefined) payload.financial_profile = updateData.financialProfile;
  if (updateData.existingCoverage !== undefined) payload.existing_coverage = updateData.existingCoverage;
  if (updateData.goals !== undefined) payload.goals = updateData.goals;
  if (updateData.notes !== undefined) payload.notes = updateData.notes;
  if (updateData.currentStep !== undefined) payload.current_step = updateData.currentStep;
  if (updateData.status !== undefined) payload.status = updateData.status;

  return payload;
}

export async function getDiscoveryData(
  caseId: string
): Promise<DiscoveryData> {
  const { data } = await apiClient.get<ApiResponse<DiscoveryData>>(
    `/cases/${caseId}/discovery/`
  );
  const raw = data?.data ?? data;
  return fromBackendDiscovery(raw);
}

export async function updateDiscoveryData(
  caseId: string,
  updateData: Partial<DiscoveryData>
): Promise<DiscoveryData> {
  const payload = toBackendDiscoveryPayload(updateData);
  const { data } = await apiClient.put<ApiResponse<DiscoveryData>>(
    `/cases/${caseId}/discovery/`,
    payload
  );
  const raw = data?.data ?? data;
  return fromBackendDiscovery(raw);
}

export async function completeDiscoveryStep(
  caseId: string,
  step: string
): Promise<DiscoveryData> {
  const { data } = await apiClient.post<ApiResponse<DiscoveryData>>(
    `/cases/${caseId}/discovery/complete-step/`,
    { step }
  );
  const raw = data?.data ?? data;
  return fromBackendDiscovery(raw);
}
