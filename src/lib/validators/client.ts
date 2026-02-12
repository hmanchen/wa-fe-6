import { z } from "zod";
import {
  personalInfoSchema,
  financialProfileSchema,
} from "./discovery";

export const clientInfoSchema = z.object({
  personal: personalInfoSchema.optional(),
  financial: financialProfileSchema.optional(),
});

export type ClientInfoInput = z.infer<typeof clientInfoSchema>;
