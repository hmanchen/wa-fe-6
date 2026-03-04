"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFinancialInterviewData,
  saveFinancialBackground,
  getFinancialHealthScore,
  getContributionLimits,
  getMarketSnapshot,
  calculate401k,
  type FinancialInterviewPayload,
  type Calculate401kRequest,
  type Calculate401kResponse,
} from "@/lib/api/financial-interview";
import type { PersonFinancialBackground, FinancialHealthScore, ContributionLimitsData, MarketSnapshot } from "@/types/financial-interview";

export function useFinancialInterview(caseId: string | null) {
  return useQuery<FinancialInterviewPayload>({
    queryKey: ["financial-interview", caseId],
    queryFn: () => getFinancialInterviewData(caseId!),
    enabled: !!caseId,
    staleTime: 5 * 60 * 1000, // 5 min — data only changes on explicit save (mutation invalidates)
  });
}

export function useFinancialHealthScore(caseId: string | null) {
  return useQuery<FinancialHealthScore>({
    queryKey: ["financial-health-score", caseId],
    queryFn: () => getFinancialHealthScore(caseId!),
    enabled: !!caseId,
    staleTime: 5 * 60 * 1000, // 5 min — recalculated on save; mutation invalidates this key
  });
}

export function useContributionLimits(taxYear: number) {
  return useQuery<ContributionLimitsData>({
    queryKey: ["contribution-limits", taxYear],
    queryFn: () => getContributionLimits(taxYear),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — IRS limits change once per year
  });
}

export function useMarketSnapshot(enabled: boolean) {
  return useQuery<MarketSnapshot | null>({
    queryKey: ["market-snapshot"],
    queryFn: getMarketSnapshot,
    enabled,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000, // match refetchInterval
    retry: 1,
  });
}

export function useCalculate401k(payload: Calculate401kRequest | null) {
  return useQuery<Calculate401kResponse>({
    queryKey: ["401k-calculate", payload],
    queryFn: () => calculate401k(payload!),
    enabled: !!payload && payload.salary > 0 && payload.empContribPct > 0,
    staleTime: 5 * 60 * 1000, // deterministic: same inputs = same output
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
