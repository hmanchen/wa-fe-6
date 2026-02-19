import { apiClient } from "./client";
import type { ApiResponse } from "@/types";
import type { PersonFinancialBackground } from "@/types/financial-interview";

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
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
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

  return {
    primaryBackground: fp.primary_background
      ? deepConvertKeys(fp.primary_background, toCamelCase)
      : undefined,
    spouseBackground: fp.spouse_background
      ? deepConvertKeys(fp.spouse_background, toCamelCase)
      : undefined,
  };
}

export async function saveFinancialBackground(
  caseId: string,
  role: "primary" | "spouse",
  backgroundData: PersonFinancialBackground
): Promise<FinancialInterviewPayload> {
  // Fetch current data first so we don't overwrite the other role's data.
  // The backend merges at the section level (financial_profile), not deep.
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

  return {
    primaryBackground: fp.primary_background
      ? deepConvertKeys(fp.primary_background, toCamelCase)
      : undefined,
    spouseBackground: fp.spouse_background
      ? deepConvertKeys(fp.spouse_background, toCamelCase)
      : undefined,
  };
}
