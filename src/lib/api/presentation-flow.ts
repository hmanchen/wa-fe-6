import { apiClient } from "./client";
import type { ApiResponse } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function deepConvertKeys(obj: any, converter: (s: string) => string): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => deepConvertKeys(item, converter));
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[converter(key)] = deepConvertKeys(value, converter);
    }
    return result;
  }
  return obj;
}

function camelify<T>(raw: any): T {
  return deepConvertKeys(raw, toCamelCase) as T;
}

function extract(data: any): any {
  return data?.data ?? data;
}

// ── Compute endpoints ────────────────────────────────────────

export async function computeFullAnalysis(caseId: string, state = "GA") {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/compute/financial/full-analysis",
    { case_id: caseId, state }
  );
  return camelify<any>(extract(data));
}

export async function computeXCurveData(caseId: string, retirementAge = 65) {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/compute/financial/xcurve-data",
    { case_id: caseId, retirement_age: retirementAge }
  );
  return camelify<any>(extract(data));
}

export async function computeRothVs7702(params: {
  caseId: string;
  householdIncome: number;
  clientAge: number;
  hasDependents?: boolean;
  hasCoverageGap?: boolean;
  gapAmount?: number;
  filingStatus?: string;
}) {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/compute/financial/roth-vs-7702",
    {
      case_id: params.caseId,
      household_income: params.householdIncome,
      client_age: params.clientAge,
      has_dependents: params.hasDependents ?? false,
      has_coverage_gap: params.hasCoverageGap ?? false,
      gap_amount: params.gapAmount ?? 0,
      filing_status: params.filingStatus ?? "married_filing_jointly",
    }
  );
  return camelify<any>(extract(data));
}

export async function computeCollegeFunding(params: {
  caseId: string;
  childName: string;
  childAge: number;
  monthlyContribution: number;
  state?: string;
  iulMonthlyPremium?: number;
  iulDeathBenefit?: number;
}) {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/compute/financial/college-funding-comparison",
    {
      case_id: params.caseId,
      child_name: params.childName,
      child_age: params.childAge,
      monthly_contribution: params.monthlyContribution,
      state: params.state ?? "GA",
      iul_monthly_premium: params.iulMonthlyPremium,
      iul_death_benefit: params.iulDeathBenefit ?? 500000,
    }
  );
  return camelify<any>(extract(data));
}

export async function computeRolloverOptions(params: {
  caseId: string;
  old401kBalance: number;
  employerName: string;
  clientAge: number;
  retirementAge?: number;
  taxBracketPct?: number;
  stateTaxPct?: number;
}) {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/compute/financial/rollover-options",
    {
      case_id: params.caseId,
      old_401k_balance: params.old401kBalance,
      employer_name: params.employerName,
      client_age: params.clientAge,
      retirement_age: params.retirementAge ?? 65,
      tax_bracket_pct: params.taxBracketPct ?? 24,
      state_tax_pct: params.stateTaxPct ?? 5,
    }
  );
  return camelify<any>(extract(data));
}

// ── AI endpoints ─────────────────────────────────────────────

export async function aiBackgroundSummary(caseId: string) {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/ai/background-summary",
    { case_id: caseId }
  );
  return camelify<any>(extract(data));
}

export async function aiHealthNarrative(caseId: string) {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/ai/health-narrative",
    { case_id: caseId }
  );
  return camelify<any>(extract(data));
}

export async function aiProtectionGaps(caseId: string) {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/ai/protection-gaps",
    { case_id: caseId }
  );
  return camelify<any>(extract(data));
}

export async function aiEstateUrgency(caseId: string) {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/ai/estate-urgency",
    { case_id: caseId }
  );
  return camelify<any>(extract(data));
}

export async function aiBackgroundGaps(caseId: string) {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/ai/background-gaps",
    { case_id: caseId }
  );
  return camelify<any>(extract(data));
}

export async function aiXCurveNarration(caseId: string) {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/ai/xcurve-narration",
    { case_id: caseId }
  );
  return camelify<any>(extract(data));
}

export async function aiTaxNarrative(caseId: string) {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/ai/tax-narrative",
    { case_id: caseId }
  );
  return camelify<any>(extract(data));
}

export async function aiRecommendations(caseId: string) {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/ai/recommendations",
    { case_id: caseId }
  );
  return camelify<any>(extract(data));
}

export async function aiDebtStrategyNarrative(caseId: string) {
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/ai/debt-strategy-narrative",
    { case_id: caseId }
  );
  return camelify<any>(extract(data));
}
