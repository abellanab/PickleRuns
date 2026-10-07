import { pgTable, uuid, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { games } from "./games";
import { queueEntries } from "./queue-entries";
import { gameTeam } from "./enums";

export const gamePlayers = pgTable(
  "game_players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    // RESTRICT — a queue entry with game history cannot be hard-deleted
    queueEntryId: uuid("queue_entry_id").notNull().references(() => queueEntries.id, { onDelete: "restrict" }),
    team: gameTeam("team").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // No updatedAt — immutable after creation
  },
  (t) => [
    uniqueIndex("uq_game_players_game_entry").on(t.gameId, t.queueEntryId),
    index("idx_game_players_game_id").on(t.gameId),
    index("idx_game_players_queue_entry_id").on(t.queueEntryId),
  ],
);
