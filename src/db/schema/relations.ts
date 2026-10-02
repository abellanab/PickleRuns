import { relations } from "drizzle-orm";
import { users } from "./users";
import { hostRequests } from "./host-requests";
import { runs } from "./runs";
import { queueEntries } from "./queue-entries";
import { games } from "./games";
import { gamePlayers } from "./game-players";
import { scoreEvents } from "./score-events";

export const usersRelations = relations(users, ({ many }) => ({
  runs: many(runs),
  queueEntries: many(queueEntries),
  hostRequests: many(hostRequests),
}));

export const hostRequestsRelations = relations(hostRequests, ({ one }) => ({
  user: one(users, { fields: [hostRequests.userId], references: [users.id] }),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  host: one(users, { fields: [runs.hostId], references: [users.id] }),
  queueEntries: many(queueEntries),
  games: many(games),
}));

export const queueEntriesRelations = relations(queueEntries, ({ one, many }) => ({
  run: one(runs, { fields: [queueEntries.runId], references: [runs.id] }),
  user: one(users, { fields: [queueEntries.userId], references: [users.id] }),
  gamePlayers: many(gamePlayers),
  scoreEvents: many(scoreEvents),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  run: one(runs, { fields: [games.runId], references: [runs.id] }),
  gamePlayers: many(gamePlayers),
  scoreEvents: many(scoreEvents),
}));

export const gamePlayersRelations = relations(gamePlayers, ({ one }) => ({
  game: one(games, { fields: [gamePlayers.gameId], references: [games.id] }),
  queueEntry: one(queueEntries, {
    fields: [gamePlayers.queueEntryId],
    references: [queueEntries.id],
  }),
}));

export const scoreEventsRelations = relations(scoreEvents, ({ one }) => ({
  game: one(games, { fields: [scoreEvents.gameId], references: [games.id] }),
  queueEntry: one(queueEntries, {
    fields: [scoreEvents.queueEntryId],
    references: [queueEntries.id],
  }),
}));
