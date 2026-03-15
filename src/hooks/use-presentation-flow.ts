"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  computeFullAnalysis,
  computeXCurveData,
  computeRothVs7702,
  computeCollegeFunding,
  computeRolloverOptions,
  aiBackgroundSummary,
  aiHealthNarrative,
  aiProtectionGaps,
  aiEstateUrgency,
  aiBackgroundGaps,
  aiXCurveNarration,
  aiTaxNarrative,
  aiRecommendations,
} from "@/lib/api/presentation-flow";

// ── Compute hooks ────────────────────────────────────────────

export function useFullAnalysis(caseId: string | null, clientState = "unknown") {
  return useMutation({
    mutationKey: ["full-analysis", caseId],
    mutationFn: () => computeFullAnalysis(caseId!, clientState),
  });
}

export function useFullAnalysisData(
  caseId: string | null,
  clientState = "unknown",
  enabled = true
) {
  return useQuery({
    queryKey: ["full-analysis", caseId, clientState],
    queryFn: () => computeFullAnalysis(caseId!, clientState),
    enabled: !!caseId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useXCurveData(caseId: string | null, retirementAge = 65, enabled = true) {
  return useQuery({
    queryKey: ["xcurve-data", caseId, retirementAge],
    queryFn: () => computeXCurveData(caseId!, retirementAge),
    enabled: !!caseId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRothVs7702() {
  return useMutation({
    mutationFn: computeRothVs7702,
  });
}

export function useCollegeFunding() {
  return useMutation({
    mutationFn: computeCollegeFunding,
  });
}

export function useRolloverOptions() {
  return useMutation({
    mutationFn: computeRolloverOptions,
  });
}

// ── AI hooks (all mutations since they POST + cost money) ────

export function useBackgroundSummary(caseId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["ai-background-summary", caseId],
    queryFn: () => aiBackgroundSummary(caseId!),
    enabled: !!caseId && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useHealthNarrative(caseId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["ai-health-narrative", caseId],
    queryFn: () => aiHealthNarrative(caseId!),
    enabled: !!caseId && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useProtectionGaps(caseId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["ai-protection-gaps", caseId],
    queryFn: () => aiProtectionGaps(caseId!),
    enabled: !!caseId && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useEstateUrgency(caseId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["ai-estate-urgency", caseId],
    queryFn: () => aiEstateUrgency(caseId!),
    enabled: !!caseId && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useBackgroundGaps(caseId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["ai-background-gaps", caseId],
    queryFn: () => aiBackgroundGaps(caseId!),
    enabled: !!caseId && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useXCurveNarration(caseId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["ai-xcurve-narration", caseId],
    queryFn: () => aiXCurveNarration(caseId!),
    enabled: !!caseId && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTaxNarrative(caseId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["ai-tax-narrative", caseId],
    queryFn: () => aiTaxNarrative(caseId!),
    enabled: !!caseId && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAiRecommendations(caseId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["ai-recommendations", caseId],
    queryFn: () => aiRecommendations(caseId!),
    enabled: !!caseId && enabled,
    staleTime: 10 * 60 * 1000,
  });
}
