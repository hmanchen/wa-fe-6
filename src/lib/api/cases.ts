import { apiClient } from "./client";
import type { ApiResponse, Case, PaginatedResponse } from "@/types";
import { isValid, parseISO } from "date-fns";
import { formatDateOnly } from "@/lib/formatters/date";

export interface GetCasesParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export interface CreateCaseData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  dependents?: number;
  dependentsDetail?: Array<{ name: string; age: number }>;
  clientEmail: string;
  clientPhone: string;
  country?: string;
  street?: string;
  city: string;
  state?: string;
  postalCode: string;
  partnerFirstName?: string;
  partnerLastName?: string;
  partnerDateOfBirth?: string;
  meetingDate?: string;
  caseType: string;
  description?: string;
}

export interface UpdateCaseData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  dependents?: number;
  dependentsDetail?: Array<{ name: string; age: number }>;
  clientEmail?: string;
  clientPhone?: string;
  country?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  partnerFirstName?: string;
  partnerLastName?: string;
  partnerDateOfBirth?: string;
  meetingDate?: string;
  caseType?: string;
  description?: string;
  status?: string;
  consentGiven?: boolean;
  consentAcknowledgedAt?: string;
  consentGivenAt?: string;
  consentVersion?: string;
  consentAdvisorId?: string;
  consentGivenBy?: string;
  riskScore?: number;
  riskProfile?: string;
}

export interface ZipLookupResult {
  city: string | null;
  state_code: string | null;
  metro_area: string | null;
}

export interface ArchiveCaseResult {
  id: string;
  caseNumber: string;
  archived: boolean;
  message: string;
}

export interface RecordConsentPayload {
  version?: string;
  acknowledgments: string[];
}

export interface RecordConsentResult {
  status: string;
  caseId: string;
  consentAcknowledgedAt: string;
  consentVersion: string;
  consentAdvisorId: string;
}

/** Transform backend snake_case response to frontend camelCase */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromBackendCase(raw: any): Case {
  // Parse client_personal_info from backend (snake_case) to camelCase
  const pi = raw.client_personal_info ?? raw.clientPersonalInfo;
  const personalInfo = pi
    ? {
        firstName: pi.first_name ?? pi.firstName,
        lastName: pi.last_name ?? pi.lastName,
        dateOfBirth: pi.date_of_birth ?? pi.dateOfBirth,
        gender: pi.gender,
        maritalStatus: pi.marital_status ?? pi.maritalStatus,
        dependents: pi.dependents,
        dependentsDetail: pi.dependents_detail ?? pi.dependentsDetail,
        partnerFirstName: pi.partner_first_name ?? pi.partnerFirstName,
        partnerLastName: pi.partner_last_name ?? pi.partnerLastName,
        partnerDateOfBirth: pi.partner_date_of_birth ?? pi.partnerDateOfBirth,
        address: pi.address
          ? {
              country: pi.address.country,
              street: pi.address.street,
              city: pi.address.city,
              province: pi.address.province,
              postalCode: pi.address.postal_code ?? pi.address.postalCode,
            }
          : undefined,
      }
    : undefined;

  return {
    id: raw.id,
    caseNumber: raw.case_number ?? raw.caseNumber ?? "",
    status: raw.status,
    priority: raw.priority ?? "medium",
    clientId: raw.client_id ?? raw.clientId ?? "",
    advisorId: raw.advisor_id ?? raw.advisorId ?? "",
    title: raw.case_name ?? raw.title ?? "",
    description: raw.description ?? "",
    clientName: raw.client_name ?? raw.clientName ?? raw.case_name ?? "",
    clientEmail: raw.client_email ?? raw.clientEmail ?? "",
    clientPhone: raw.client_phone ?? raw.clientPhone,
    meetingDate: raw.meeting_date ?? raw.meetingDate,
    caseType: raw.case_type ?? raw.caseType ?? "other",
    consentGiven: raw.consent_given ?? raw.consentGiven ?? false,
    consentAcknowledgedAt: raw.consent_acknowledged_at ?? raw.consentAcknowledgedAt,
    consentGivenAt: raw.consent_given_at ?? raw.consentGivenAt,
    consentVersion: raw.consent_version ?? raw.consentVersion,
    consentAdvisorId: raw.consent_advisor_id ?? raw.consentAdvisorId,
    consentGivenBy: raw.consent_given_by ?? raw.consentGivenBy,
    riskScore: raw.risk_score ?? raw.riskScore,
    riskProfile: raw.risk_profile ?? raw.riskProfile,
    clientPersonalInfo: personalInfo,
    createdAt: raw.created_at ?? raw.createdAt ?? "",
    updatedAt: raw.updated_at ?? raw.updatedAt ?? "",
    completedAt: raw.completed_at ?? raw.completedAt,
  } as Case;
}

/** Format a case type value for display (e.g. "life_insurance" → "Life Insurance") */
function formatCaseType(caseType: string): string {
  return caseType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Convert ISO date string to YYYY-MM-DD format for the backend */
function toDateString(isoDate?: string): string | undefined {
  if (!isoDate) return undefined;
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
    const parsed = parseISO(isoDate);
    return isValid(parsed) ? formatDateOnly(parsed) : undefined;
  } catch {
    return undefined;
  }
}

/** Transform frontend camelCase form data to backend snake_case format */
function toBackendCreatePayload(formData: CreateCaseData) {
  const fullName = `${formData.firstName} ${formData.lastName}`.trim();
  return {
    case_name: `${fullName} — ${formatCaseType(formData.caseType)}`,
    client_name: fullName,
    client_email: formData.clientEmail,
    client_phone: formData.clientPhone || undefined,
    city: formData.city,
    postal_code: formData.postalCode,
    meeting_date: toDateString(formData.meetingDate),
    case_type: formData.caseType,
    description: formData.description || undefined,
    // Personal info stored in client_personal_info JSON
    client_personal_info: {
      first_name: formData.firstName,
      last_name: formData.lastName,
      date_of_birth: formData.dateOfBirth,
      gender: formData.gender,
      marital_status: formData.maritalStatus,
      dependents: formData.dependents ?? 0,
      dependents_detail: formData.dependentsDetail ?? [],
      email: formData.clientEmail,
      phone: formData.clientPhone,
      partner_first_name: formData.maritalStatus === "married" ? formData.partnerFirstName || undefined : undefined,
      partner_last_name: formData.maritalStatus === "married" ? formData.partnerLastName || undefined : undefined,
      partner_date_of_birth: formData.maritalStatus === "married" ? formData.partnerDateOfBirth || undefined : undefined,
      address: {
        country: formData.country || undefined,
        street: formData.street || undefined,
        city: formData.city || undefined,
        province: formData.state || undefined,
        postal_code: formData.postalCode || undefined,
      },
    },
  };
}

/** Transform frontend camelCase update data to backend snake_case format */
function toBackendUpdatePayload(formData: UpdateCaseData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {};
  if (formData.firstName !== undefined || formData.lastName !== undefined) {
    const fullName = `${formData.firstName ?? ""} ${formData.lastName ?? ""}`.trim();
    if (fullName) payload.client_name = fullName;
  }
  if (formData.clientEmail !== undefined) payload.client_email = formData.clientEmail;
  if (formData.clientPhone !== undefined) payload.client_phone = formData.clientPhone;
  if (formData.city !== undefined) payload.city = formData.city;
  if (formData.postalCode !== undefined) payload.postal_code = formData.postalCode;
  if (formData.meetingDate !== undefined) payload.meeting_date = toDateString(formData.meetingDate);
  if (formData.caseType !== undefined) payload.case_type = formData.caseType;
  if (formData.description !== undefined) payload.description = formData.description;
  if (formData.status !== undefined) payload.status = formData.status;
  if (formData.consentGiven !== undefined) payload.consent_given = formData.consentGiven;
  if (formData.consentAcknowledgedAt !== undefined) payload.consent_acknowledged_at = formData.consentAcknowledgedAt;
  if (formData.consentGivenAt !== undefined) payload.consent_given_at = formData.consentGivenAt;
  if (formData.consentVersion !== undefined) payload.consent_version = formData.consentVersion;
  if (formData.consentAdvisorId !== undefined) payload.consent_advisor_id = formData.consentAdvisorId;
  if (formData.consentGivenBy !== undefined) payload.consent_given_by = formData.consentGivenBy;
  if (formData.riskScore !== undefined) payload.risk_score = formData.riskScore;
  if (formData.riskProfile !== undefined) payload.risk_profile = formData.riskProfile;
  return payload;
}

export async function getCases(
  params?: GetCasesParams
): Promise<PaginatedResponse<Case>> {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Case>>>(
    "/cases/",
    { params }
  );
  const raw = (data?.data ?? data) as PaginatedResponse<Case>;
  // Transform each case item from snake_case to camelCase
  if (raw && Array.isArray(raw.data)) {
    raw.data = raw.data.map(fromBackendCase);
  }
  return raw;
}

export async function getCase(id: string): Promise<Case> {
  const { data } = await apiClient.get<ApiResponse<Case>>(`/cases/${id}/`);
  const raw = data?.data ?? data;
  return fromBackendCase(raw);
}

export async function createCase(
  createData: CreateCaseData
): Promise<Case> {
  const payload = toBackendCreatePayload(createData);
  const { data } = await apiClient.post<ApiResponse<Case>>("/cases/", payload);
  const raw = data?.data ?? data;
  return fromBackendCase(raw);
}

export async function updateCase(
  id: string,
  updateData: UpdateCaseData
): Promise<Case> {
  const payload = toBackendUpdatePayload(updateData);
  const { data } = await apiClient.put<ApiResponse<Case>>(
    `/cases/${id}/`,
    payload
  );
  const raw = data?.data ?? data;
  return fromBackendCase(raw);
}

export async function deleteCase(id: string): Promise<ArchiveCaseResult> {
  const { data } = await apiClient.delete<ApiResponse<Record<string, unknown>>>(`/cases/${id}`);
  const raw = (data?.data ?? data) as Record<string, unknown>;
  return {
    id: String(raw.id ?? id),
    caseNumber: String(raw.case_number ?? raw.caseNumber ?? ""),
    archived: Boolean(raw.archived),
    message: String(raw.message ?? "Case archived successfully."),
  };
}

export async function lookupZip(zip: string): Promise<ZipLookupResult> {
  const { data } = await apiClient.get<ZipLookupResult>("/prefill/zip-lookup", {
    params: { zip },
  });
  return data;
}

export async function recordCaseConsent(
  id: string,
  payload: RecordConsentPayload
): Promise<RecordConsentResult> {
  const { data } = await apiClient.post<ApiResponse<Record<string, unknown>>>(
    `/cases/${id}/consent`,
    payload
  );
  const raw = (data?.data ?? data) as Record<string, unknown>;
  return {
    status: String(raw.status ?? "recorded"),
    caseId: String(raw.case_id ?? raw.caseId ?? id),
    consentAcknowledgedAt: String(
      raw.consent_acknowledged_at ?? raw.consentAcknowledgedAt ?? ""
    ),
    consentVersion: String(raw.consent_version ?? raw.consentVersion ?? "1.0"),
    consentAdvisorId: String(raw.consent_advisor_id ?? raw.consentAdvisorId ?? ""),
  };
}
