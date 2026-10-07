import { z } from "zod";

export const createGameSchema = z.object({
  courtId: z.string().uuid(),
  sideA: z.array(z.string().uuid()).min(1).max(2),
  sideB: z.array(z.string().uuid()).min(1).max(2),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;

export const endGameSchema = z.object({
  winner: z.enum(["team_a", "team_b"]).optional(),
});

export type EndGameInput = z.infer<typeof endGameSchema>;
