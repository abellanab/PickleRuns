import { pgTable, uuid, integer, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { games } from "./games";
import { queueEntries } from "./queue-entries";
import { gameTeam } from "./enums";

export const scoreEvents = pgTable(
  "score_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    // RESTRICT — scoring history is permanent
    queueEntryId: uuid("queue_entry_id").notNull().references(() => queueEntries.id, { onDelete: "restrict" }),
    team: gameTeam("team").notNull(),
    points: integer("points").notNull().default(1),
    // NULL = active point, non-null = undone
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // No updatedAt — rows are never updated except voidedAt via trigger
  },
  (t) => [
    index("idx_score_events_game_id").on(t.gameId),
    index("idx_score_events_queue_entry_id").on(t.queueEntryId),
    // Partial index — covers all live score queries (active events only)
    index("idx_score_events_game_voided").on(t.gameId).where(sql`voided_at IS NULL`),
  ],
);
