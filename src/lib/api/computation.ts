import { apiClient } from "./client";
import type {
  ApiResponse,
  NeedsAnalysisResult,
  Recommendation,
} from "@/types";

export async function computeNeedsAnalysis(
  caseId: string
): Promise<NeedsAnalysisResult> {
  const { data } = await apiClient.post<ApiResponse<NeedsAnalysisResult>>(
    `/computation/needs-analysis/${caseId}`
  );
  return data?.data as NeedsAnalysisResult;
}

export interface AiExplanationResponse {
  explanation: string;
}

export async function getAiExplanation(
  caseId: string,
  analysisId: string
): Promise<string> {
  const { data } = await apiClient.get<
    ApiResponse<AiExplanationResponse>
  >(`/computation/ai-explanation/${caseId}/${analysisId}`);
  return data?.data?.explanation ?? "";
}

export interface ValidateFundingResponse {
  valid: boolean;
  message?: string;
}

export async function validateFunding(
  caseId: string,
  recommendationId: string
): Promise<ValidateFundingResponse & Partial<Recommendation>> {
  const { data } = await apiClient.post<
    ApiResponse<ValidateFundingResponse & Partial<Recommendation>>
  >(`/computation/validate-funding/${caseId}/${recommendationId}`);
  return data?.data as ValidateFundingResponse & Partial<Recommendation>;
}
