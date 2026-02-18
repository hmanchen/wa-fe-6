import { z } from "zod";

/** Base object schema (no refinements) — used by .partial() for updates */
const baseCaseFields = z.object({
  // ── Client info ──
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  maritalStatus: z.string().min(1, "Marital status is required"),
  dependents: z.number().int().min(0).optional(),
  clientEmail: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  clientPhone: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (val) => /^\d{10}$/.test(val.replace(/[\s\-().+]/g, "")),
      { message: "Please enter a valid 10-digit mobile number" }
    ),
  // ── Address ──
  country: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  // ── Spouse (conditional) ──
  partnerFirstName: z.string().optional(),
  partnerLastName: z.string().optional(),
  partnerDateOfBirth: z.string().optional(),
  // ── Case info ──
  meetingDate: z.string().optional().or(z.literal("")),
  caseType: z.enum(
    [
      "life_insurance",
      "retirement_planning",
      "estate_planning",
      "investment_review",
      "comprehensive",
      "other",
    ],
    { message: "Please select a case type" }
  ),
  description: z.string().max(1000, "Description is too long").optional(),
});

/** Create schema with conditional spouse validation */
export const createCaseSchema = baseCaseFields.superRefine((data, ctx) => {
  if (data.maritalStatus === "married") {
    if (!data.partnerFirstName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Partner first name is required",
        path: ["partnerFirstName"],
      });
    }
    if (!data.partnerLastName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Partner last name is required",
        path: ["partnerLastName"],
      });
    }
    if (!data.partnerDateOfBirth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Partner date of birth is required",
        path: ["partnerDateOfBirth"],
      });
    }
  }
});

/** Update schema — partial of the base (no refinements) + status */
export const updateCaseSchema = baseCaseFields.partial().extend({
  status: z
    .enum([
      "draft",
      "discovery",
      "analysis",
      "recommendation",
      "report",
      "completed",
      "archived",
    ])
    .optional(),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
