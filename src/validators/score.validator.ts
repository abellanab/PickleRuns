import { z } from "zod";

export const scorePointSchema = z.object({
  queueEntryId: z.string().uuid(),
});

export type ScorePointInput = z.infer<typeof scorePointSchema>;
