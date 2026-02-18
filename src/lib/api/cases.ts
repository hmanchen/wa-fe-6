import { apiClient } from "./client";
import type { ApiResponse, Case, PaginatedResponse } from "@/types";

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
  clientEmail: string;
  clientPhone: string;
  country?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
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
    return new Date(isoDate).toISOString().split("T")[0];
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
  if (formData.meetingDate !== undefined) payload.meeting_date = toDateString(formData.meetingDate);
  if (formData.caseType !== undefined) payload.case_type = formData.caseType;
  if (formData.description !== undefined) payload.description = formData.description;
  if (formData.status !== undefined) payload.status = formData.status;
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

export async function deleteCase(id: string): Promise<void> {
  await apiClient.delete(`/cases/${id}/`);
}
