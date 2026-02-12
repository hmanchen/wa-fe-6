"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDiscoveryData,
  updateDiscoveryData,
  completeDiscoveryStep,
} from "@/lib/api/discovery";

export function useDiscovery(caseId: string | null | undefined) {
  return useQuery({
    queryKey: ["discovery", caseId],
    queryFn: () => getDiscoveryData(caseId!),
    enabled: !!caseId,
  });
}

export function useUpdateDiscovery(caseId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updateData: Parameters<typeof updateDiscoveryData>[1]) =>
      updateDiscoveryData(caseId!, updateData),
    onSuccess: (_, __, ___) => {
      queryClient.invalidateQueries({ queryKey: ["discovery", caseId] });
    },
  });
}

export function useCompleteDiscoveryStep(caseId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (step: string) => completeDiscoveryStep(caseId!, step),
    onSuccess: (_, __, ___) => {
      queryClient.invalidateQueries({ queryKey: ["discovery", caseId] });
    },
  });
}
