import { z } from "zod";

export const addressSchema = z.object({
  country: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(), // Maps to province in Address type
  postalCode: z.string().optional(),
});

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  maritalStatus: z.string().min(1, "Marital status is required"),
  partnerFirstName: z.string().optional(),
  partnerLastName: z.string().optional(),
  partnerDateOfBirth: z.string().optional(),
  dependents: z.number().int().min(0).optional(),
  email: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().email("Invalid email format").min(1, "Email is required")
  ),
  phone: z.string().min(1, "Phone number is required"),
  address: addressSchema.optional(),
}).superRefine((data, ctx) => {
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
  }
});

export const financialProfileSchema = z.object({
  annualIncome: z.number().min(0, "Cannot be negative").optional(),
  monthlyExpenses: z.number().min(0, "Cannot be negative").optional(),
  totalAssets: z.number().min(0, "Cannot be negative").optional(),
  totalLiabilities: z.number().min(0, "Cannot be negative").optional(),
  investmentAssets: z.number().min(0, "Cannot be negative").optional(),
  retirementSavings: z.number().min(0, "Cannot be negative").optional(),
  emergencyFund: z.number().min(0, "Cannot be negative").optional(),
  monthlyDebtPayments: z.number().min(0, "Cannot be negative").optional(),
});

export const existingCoverageSchema = z.object({
  type: z.enum([
    "life",
    "health",
    "disability",
    "critical-illness",
    "long-term-care",
    "other",
  ]),
  provider: z.string().optional(),
  policyNumber: z.string().optional(),
  coverageAmount: z.number().min(0).optional(),
  premium: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export const existingCoverageFormSchema = existingCoverageSchema.extend({
  id: z.string().optional(),
});

export const goalSchema = z.object({
  type: z.enum([
    "income-replacement",
    "debt-protection",
    "education-funding",
    "retirement",
    "estate-planning",
    "business-succession",
    "critical-illness",
    "disability",
  ]),
  description: z.string(),
  priority: z.number().int().min(1).max(5),
  targetAmount: z.number().positive().optional(),
  timeHorizon: z.number().positive().optional(), // years
});

export const goalsFormSchema = z.object({
  goals: z.array(goalSchema),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type FinancialProfileInput = z.infer<typeof financialProfileSchema>;
export type ExistingCoverageInput = z.infer<typeof existingCoverageSchema>;
export type ExistingCoverageFormInput = z.infer<typeof existingCoverageFormSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
