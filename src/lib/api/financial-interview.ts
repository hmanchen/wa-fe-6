import { apiClient } from "./client";
import type { ApiResponse } from "@/types";
import type {
  PersonFinancialBackground,
  FinancialHealthScore,
  ContributionLimitsData,
  MarketSnapshot,
  GoalsDiscoveryData,
} from "@/types/financial-interview";
import { deepConvertKeys, toCamelCase, toSnakeCase } from "./key-utils";

/**
 * Financial interview data is persisted via the discovery endpoint's
 * `financial_profile` JSON field, which supports partial-merge updates.
 *
 * Structure stored in `financial_profile`:
 * {
 *   primary_background: { ...PersonFinancialBackground },
 *   spouse_background:  { ...PersonFinancialBackground },
 * }
 */

// ── API functions ────────────────────────────────────────────

export interface FinancialInterviewPayload {
  primaryBackground?: PersonFinancialBackground;
  spouseBackground?: PersonFinancialBackground;
  goalsDiscovery?: GoalsDiscoveryData;
}

interface WrappedResponse<T> {
  success?: boolean;
  data: T;
  meta?: unknown;
}

export async function getFinancialInterviewData(
  caseId: string
): Promise<FinancialInterviewPayload> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await apiClient.get<ApiResponse<any>>(
    `/cases/${caseId}/discovery/`
  );
  const raw = data?.data ?? data;
  const fp = raw?.financial_profile ?? raw?.financialProfile ?? {};

  const result = {
    primaryBackground: fp.primary_background
      ? deepConvertKeys(fp.primary_background, toCamelCase)
      : undefined,
    spouseBackground: fp.spouse_background
      ? deepConvertKeys(fp.spouse_background, toCamelCase)
      : undefined,
    goalsDiscovery: fp.goals_discovery
      ? deepConvertKeys(fp.goals_discovery, toCamelCase)
      : undefined,
  };

  return result;
}

export async function saveFinancialBackground(
  caseId: string,
  role: "primary" | "spouse",
  backgroundData: PersonFinancialBackground
): Promise<FinancialInterviewPayload> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentData } = await apiClient.get<ApiResponse<any>>(
    `/cases/${caseId}/discovery/`
  );
  const currentRaw = currentData?.data ?? currentData;
  const existingFP =
    currentRaw?.financial_profile ?? currentRaw?.financialProfile ?? {};

  const snakeCaseData = deepConvertKeys(backgroundData, toSnakeCase);
  const fieldKey =
    role === "primary" ? "primary_background" : "spouse_background";

  const payload = {
    financial_profile: {
      ...existingFP,
      [fieldKey]: snakeCaseData,
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await apiClient.put<ApiResponse<any>>(
    `/cases/${caseId}/discovery/`,
    payload
  );

  const raw = data?.data ?? data;
  const fp = raw?.financial_profile ?? raw?.financialProfile ?? {};

  const result = {
    primaryBackground: fp.primary_background
      ? deepConvertKeys(fp.primary_background, toCamelCase)
      : undefined,
    spouseBackground: fp.spouse_background
      ? deepConvertKeys(fp.spouse_background, toCamelCase)
      : undefined,
    goalsDiscovery: fp.goals_discovery
      ? deepConvertKeys(fp.goals_discovery, toCamelCase)
      : undefined,
  };

  return result;
}

export async function saveGoalsDiscovery(
  caseId: string,
  goalsDiscoveryData: Partial<GoalsDiscoveryData>
): Promise<GoalsDiscoveryData> {
  const payload = deepConvertKeys(goalsDiscoveryData, toSnakeCase);
  const { data } = await apiClient.put<WrappedResponse<Record<string, unknown>>>(
    `/cases/${caseId}/discovery/goals-discovery/`,
    payload
  );
  return deepConvertKeys(data?.data ?? {}, toCamelCase) as GoalsDiscoveryData;
}

export async function getGoalsDiscoveryData(
  caseId: string
): Promise<GoalsDiscoveryData> {
  const { data } = await apiClient.get<WrappedResponse<Record<string, unknown>>>(
    `/cases/${caseId}/discovery/goals-discovery/`
  );
  return deepConvertKeys(data?.data ?? {}, toCamelCase) as GoalsDiscoveryData;
}

export async function completeDiscoveryStep(
  caseId: string,
  step: "goals-priorities"
): Promise<void> {
  await apiClient.post<WrappedResponse<unknown>>(
    `/cases/${caseId}/discovery/complete-step/`,
    { step }
  );
}

export async function getFinancialHealthScore(
  caseId: string
): Promise<FinancialHealthScore> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await apiClient.get<ApiResponse<any>>(
    `/cases/${caseId}/financial-health-score/`
  );
  const raw = data?.data ?? data;
  return deepConvertKeys(raw, toCamelCase) as FinancialHealthScore;
}

export async function getContributionLimits(
  taxYear: number
): Promise<ContributionLimitsData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await apiClient.get<ApiResponse<any>>(
    `/contribution-limits/${taxYear}`
  );
  const raw = data?.data ?? data;
  return deepConvertKeys(raw, toCamelCase) as ContributionLimitsData;
}

export async function getMarketSnapshot(): Promise<MarketSnapshot | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await apiClient.get<ApiResponse<any>>("/market/snapshot");
    const raw = data?.data ?? data;
    return deepConvertKeys(raw, toCamelCase) as MarketSnapshot;
  } catch {
    return null;
  }
}

// ── 401(k) Calculate API ──────────────────────────────────────

export interface Calculate401kRequest {
  salary: number;
  payFrequency: number;
  age: number;
  empContribPct: number;
  currentBalance: number;
  matchType: number;
  matchRate?: number;
  matchCapPct?: number;
  dollarCap?: number;
  yearsOfService?: number;
  tiers?: { matchRate: number; capPct: number }[];
  tenureTiers?: { maxYears: number; matchRate: number }[];
  autoContribPct?: number;
  autoContribType?: string;
  ageBrackets?: { maxAge: number; pct: number }[];
}

export interface Calculate401kAlert {
  type: "success" | "warning" | "danger" | "info";
  code: string;
  message: string;
}

export interface Calculate401kResponse {
  empAnnual: number;
  empPerPay: number;
  employerMatchAnnual: number;
  employerMatchPerPay: number;
  autoContribAnnual: number;
  autoContribPerPay: number;
  totalAnnual: number;
  totalPerPay: number;
  effectiveMatchPct: number;
  irsLimitStatus: {
    limit: number;
    baseLimit: number;
    catchUpLimit: number;
    empAnnual: number;
    isNearLimit: boolean;
    isOverLimit: boolean;
    catchUpEligible: boolean;
  };
  unclaimedMatch: number;
  alerts: Calculate401kAlert[];
  catchUpJustification: {
    eligible: boolean;
    taxYear?: number | null;
    age: number;
    triggerReason: string;
    under50Limit: number;
    age50PlusTotalLimit: number;
    age60To63TotalLimit: number;
    catchUpExtra: number;
    maxAllowedContribution: number;
    currentEmployeeContribution: number;
    remainingRoom: number;
    message: string;
  };
}

export async function calculate401k(
  payload: Calculate401kRequest
): Promise<Calculate401kResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await apiClient.post<ApiResponse<any>>(
    "/401k/calculate",
    payload
  );
  const raw = data?.data ?? data;
  return deepConvertKeys(raw, toCamelCase) as Calculate401kResponse;
}
