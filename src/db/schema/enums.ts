import { pgEnum } from "drizzle-orm/pg-core";

export const runMode = pgEnum("run_mode", [
  "score_only",
  "queue_only",
  "score_and_queue",
]);

export const rotationStyle = pgEnum("rotation_style", ["winner_stays", "rotate_all"]);

export const runStatus =pgEnum("run_status", [
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

export const gameWinner = pgEnum("game_winner", ["team_a", "team_b"]);

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
