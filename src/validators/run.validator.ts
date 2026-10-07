import { z } from "zod";

export const createRunSchema = z.object({
  name: z.string().min(1).max(100),
  location: z.string().max(100).optional(),
  runMode: z.enum(["score_only", "queue_only", "score_and_queue"]),
  rotationStyle: z.enum(["winner_stays", "rotate_all"]).default("rotate_all"),
  courtCount: z.number().int().min(1).max(8).default(1),
  scoreGoal: z.union([z.literal(11), z.literal(15)]).default(11),
  winByTwo: z.boolean().default(false),
  sessionCode: z.string().regex(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/),
});

export type CreateRunInput = z.infer<typeof createRunSchema>;
