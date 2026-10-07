import { sql } from "drizzle-orm";
import { pgTable, uuid, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { runs } from "./runs";
import { courts } from "./courts";
import { gameStatus, gameWinner } from "./enums";

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
    courtId: uuid("court_id").notNull().references(() => courts.id, { onDelete: "restrict" }),
    gameNumber: integer("game_number").notNull(),
    status: gameStatus("status").notNull().default("pending"),
    scoreGoal: integer("score_goal").notNull(),
    // Trigger-maintained — never written by the app directly
    scoreA: integer("score_a").notNull().default(0),
    scoreB: integer("score_b").notNull().default(0),
    winner: gameWinner("winner"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_games_run_id_game_number").on(t.runId, t.gameNumber),
    index("idx_games_run_id").on(t.runId),
    index("idx_games_status").on(t.status),
    index("idx_games_court_id").on(t.courtId),
    uniqueIndex("uq_games_court_open")
      .on(t.courtId)
      .where(sql`status IN ('pending','active')`),
  ],
);
