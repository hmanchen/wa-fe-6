"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  computeNeedsAnalysis,
  getAiExplanation,
} from "@/lib/api/computation";

export function useComputeNeedsAnalysis() {
  return useMutation({
    mutationFn: (caseId: string) => computeNeedsAnalysis(caseId),
  });
}

export function useAiExplanation(
  caseId: string | null | undefined,
  analysisId: string | null | undefined
) {
  return useQuery({
    queryKey: ["ai-explanation", caseId, analysisId],
    queryFn: () => getAiExplanation(caseId!, analysisId!),
    enabled: !!caseId && !!analysisId,
  });
}
