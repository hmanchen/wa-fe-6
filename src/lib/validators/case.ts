import { z } from "zod";

export const createCaseSchema = z.object({
  clientName: z
    .string()
    .min(1, "Client name is required")
    .max(200, "Client name is too long"),
  clientEmail: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  clientPhone: z
    .string()
    .max(30, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  meetingDate: z
    .string()
    .optional()
    .or(z.literal("")),
  caseType: z.enum(["life_insurance", "retirement_planning", "estate_planning", "investment_review", "comprehensive", "other"], {
    message: "Please select a case type",
  }),
  description: z.string().max(1000, "Description is too long").optional(),
});

export const updateCaseSchema = createCaseSchema.partial().extend({
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
