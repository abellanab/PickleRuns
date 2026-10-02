import { pgEnum } from "drizzle-orm/pg-core";

export const runPointSystem = pgEnum("run_point_system", ["one_two", "two_three"]);

export const runFormat = pgEnum("run_format", [
  "winner_stays",
  "new_ten",
  "host_decides",
]);

export const runStatus = pgEnum("run_status", [
  "lobby",
  "active",
  "completed",
]);

export const gameStatus = pgEnum("game_status", [
  "pending",
  "active",
  "completed",
]);

export const gameTeam = pgEnum("game_team", ["team_a", "team_b"]);

export const gameWinner = pgEnum("game_winner", ["team_a", "team_b", "tie"]);

export const queueEntryStatus = pgEnum("queue_entry_status", [
  "waiting",
  "marked_out",
  "removed",
]);

export const hostRequestStatus = pgEnum("host_request_status", [
  "pending",
  "approved",
  "denied",
]);
