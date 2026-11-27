import { z } from "zod";

export const createHostRequestSchema = z.object({
  displayName: z.string().trim().min(1, "Name is required").max(50, "Name must be 50 characters or fewer"),
});

export type CreateHostRequestInput = z.infer<typeof createHostRequestSchema>;

export const decisionTokenQuerySchema = z.object({
  token: z.string().min(1).max(1024),
});

export const decideHostRequestSchema = z.object({
  token: z.string().min(1).max(1024),
  decision: z.enum(["approved", "denied"]),
});

export type DecideHostRequestInput = z.infer<typeof decideHostRequestSchema>;
