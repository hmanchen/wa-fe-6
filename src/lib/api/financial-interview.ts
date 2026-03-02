import { apiClient } from "./client";
import type { ApiResponse } from "@/types";
import type { PersonFinancialBackground, FinancialHealthScore, ContributionLimitsData, MarketSnapshot } from "@/types/financial-interview";

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

// ── Helpers: camelCase ↔ snake_case conversion ───────────────

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([a-zA-Z])(\d)/g, "$1_$2")
    .toLowerCase();
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepConvertKeys(obj: any, converter: (s: string) => string): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => deepConvertKeys(item, converter));
  if (typeof obj === "object" && !(obj instanceof Date)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[converter(key)] = deepConvertKeys(value, converter);
    }
    return result;
  }
  return obj;
}

// ── API functions ────────────────────────────────────────────

export interface FinancialInterviewPayload {
  primaryBackground?: PersonFinancialBackground;
  spouseBackground?: PersonFinancialBackground;
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
  };

  console.log("[getFinancialInterviewData] Loaded →", {
    fpKeys: Object.keys(fp),
    hasPrimaryBg: !!fp.primary_background,
    primaryRetirementKeys: fp.primary_background
      ? Object.keys(fp.primary_background).filter(k => k.includes("retirement") || k.includes("401"))
      : "NO primary_background",
    convertedRetirementKeys: result.primaryBackground
      ? Object.keys(result.primaryBackground).filter(k => k.includes("retirement") || k.includes("401"))
      : "NO primaryBackground",
    retirementBalance: result.primaryBackground?.retirement401k?.currentBalance,
  });

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

  console.log("[saveFinancialBackground] Before save →", {
    role,
    fieldKey,
    retirementKeys: Object.keys(snakeCaseData.retirement401k ?? snakeCaseData.retirement_401k ?? {}),
    retirementBalance: snakeCaseData.retirement401k?.current_balance ?? snakeCaseData.retirement_401k?.current_balance,
    originalRetirementBalance: backgroundData.retirement401k?.currentBalance,
  });

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
  };

  console.log("[saveFinancialBackground] After save ←", {
    role,
    fpKeys: Object.keys(fp),
    primaryBgKeys: fp.primary_background ? Object.keys(fp.primary_background) : "UNDEFINED",
    resultRetirementKeys: Object.keys(result.primaryBackground?.retirement401k ?? {}),
    resultRetirementBalance: result.primaryBackground?.retirement401k?.currentBalance,
  });

  return result;
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
    empAnnual: number;
    isNearLimit: boolean;
    isOverLimit: boolean;
    catchUpEligible: boolean;
  };
  unclaimedMatch: number;
  alerts: Calculate401kAlert[];
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
