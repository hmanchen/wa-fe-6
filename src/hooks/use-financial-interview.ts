"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFinancialInterviewData,
  saveFinancialBackground,
  type FinancialInterviewPayload,
} from "@/lib/api/financial-interview";
import type { PersonFinancialBackground } from "@/types/financial-interview";

export function useFinancialInterview(caseId: string | null) {
  return useQuery<FinancialInterviewPayload>({
    queryKey: ["financial-interview", caseId],
    queryFn: () => getFinancialInterviewData(caseId!),
    enabled: !!caseId,
    staleTime: 30_000,
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
    },
  });
}
