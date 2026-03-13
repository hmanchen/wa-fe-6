import { apiClient } from "@/lib/api/client";

function extract(data) {
  return data?.data ?? data;
}

export async function runFinancialFreedomAnalysis(
  caseId,
  analysisPrompt,
  qualityOverride = null
) {
  const payload = {
    case_id: caseId,
    analysis_request: analysisPrompt,
  };
  if (qualityOverride) payload.quality_override = qualityOverride;

  try {
    const { data } = await apiClient.post(
      "/ai/financial-freedom-analysis",
      payload
    );
    return extract(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    throw { type: "GENERIC", message };
  }
}
