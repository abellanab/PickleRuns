import { z } from "zod";

export const createHostRequestSchema = z.object({
  displayName: z.string().trim().min(1, "Name is required").max(50, "Name must be 50 characters or fewer"),
});

export type CreateHostRequestInput = z.infer<typeof createHostRequestSchema>;
