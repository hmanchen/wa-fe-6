"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFinancialInterviewData,
  saveFinancialBackground,
  getFinancialHealthScore,
  getContributionLimits,
  getMarketSnapshot,
  type FinancialInterviewPayload,
} from "@/lib/api/financial-interview";
import type { PersonFinancialBackground, FinancialHealthScore, ContributionLimitsData, MarketSnapshot } from "@/types/financial-interview";

export function useFinancialInterview(caseId: string | null) {
  return useQuery<FinancialInterviewPayload>({
    queryKey: ["financial-interview", caseId],
    queryFn: () => getFinancialInterviewData(caseId!),
    enabled: !!caseId,
    staleTime: 30_000,
  });
}

export function useFinancialHealthScore(caseId: string | null) {
  return useQuery<FinancialHealthScore>({
    queryKey: ["financial-health-score", caseId],
    queryFn: () => getFinancialHealthScore(caseId!),
    enabled: !!caseId,
    staleTime: 10_000,
  });
}

export function useContributionLimits(taxYear: number) {
  return useQuery<ContributionLimitsData>({
    queryKey: ["contribution-limits", taxYear],
    queryFn: () => getContributionLimits(taxYear),
    staleTime: 60 * 60 * 1000, // 1 hour — limits don't change often
  });
}

export function useMarketSnapshot(enabled: boolean) {
  return useQuery<MarketSnapshot | null>({
    queryKey: ["market-snapshot"],
    queryFn: getMarketSnapshot,
    enabled,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

export function useSaveFinancialBackground(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      role,
      data,
    }: {
      role: "primary" | "spouse";
      data: PersonFinancialBackground;
    }) => saveFinancialBackground(caseId, role, data),
    onSuccess: (result) => {
      queryClient.setQueryData(
        ["financial-interview", caseId],
        result
      );
      queryClient.invalidateQueries({
        queryKey: ["financial-health-score", caseId],
      });
    },
  });
}
