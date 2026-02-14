"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDiscoveryData,
  updateDiscoveryData,
  completeDiscoveryStep,
} from "@/lib/api/discovery";
import type { DiscoveryData } from "@/types";

/**
 * Merge the backend response with previous cache data so that fields the
 * backend doesn't persist yet (e.g. address.country) aren't lost mid-session.
 * The response takes precedence for any field it actually returns.
 */
function mergeWithPrevious(
  prev: DiscoveryData | undefined,
  next: DiscoveryData
): DiscoveryData {
  if (!prev) return next;

  const merged = { ...next };

  // Deep-merge personalInfo.address so new frontend-only fields survive
  if (prev.personalInfo?.address && merged.personalInfo) {
    merged.personalInfo = {
      ...merged.personalInfo,
      address: {
        ...prev.personalInfo.address,
        ...(merged.personalInfo.address ?? {}),
      },
    };
  }

  // Deep-merge partner fields in case backend doesn't echo them back
  if (prev.personalInfo && merged.personalInfo) {
    if (!merged.personalInfo.partnerFirstName && prev.personalInfo.partnerFirstName) {
      merged.personalInfo.partnerFirstName = prev.personalInfo.partnerFirstName;
    }
    if (!merged.personalInfo.partnerLastName && prev.personalInfo.partnerLastName) {
      merged.personalInfo.partnerLastName = prev.personalInfo.partnerLastName;
    }
    if (!merged.personalInfo.partnerDateOfBirth && prev.personalInfo.partnerDateOfBirth) {
      merged.personalInfo.partnerDateOfBirth = prev.personalInfo.partnerDateOfBirth;
    }
  }

  return merged;
}

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
    onSuccess: (responseData) => {
      const prev = queryClient.getQueryData<DiscoveryData>(["discovery", caseId]);
      queryClient.setQueryData(["discovery", caseId], mergeWithPrevious(prev, responseData));
    },
  });
}

export function useCompleteDiscoveryStep(caseId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (step: string) => completeDiscoveryStep(caseId!, step),
    onSuccess: (responseData) => {
      const prev = queryClient.getQueryData<DiscoveryData>(["discovery", caseId]);
      queryClient.setQueryData(["discovery", caseId], mergeWithPrevious(prev, responseData));
    },
  });
}
