import { sql } from "drizzle-orm";
import { pgTable, uuid, text, integer, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { rotationStyle, runMode, runStatus } from "./enums";

export const runs = pgTable(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hostId: uuid("host_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    location: text("location"),
    runMode: runMode("run_mode").notNull().default("score_and_queue"),
    rotationStyle: rotationStyle("rotation_style").notNull().default("rotate_all"),
    courtCount: integer("court_count").notNull().default(1),
    winByTwo: boolean("win_by_two").notNull().default(false),
    scoreGoal: integer("score_goal").notNull().default(11),
    status: runStatus("status").notNull().default("lobby"),
    sessionCode: text("session_code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_runs_session_code").on(t.sessionCode),
    index("idx_runs_host_id").on(t.hostId),
    index("idx_runs_status").on(t.status),
    uniqueIndex("uq_runs_one_open_per_host")
      .on(t.hostId)
      .where(sql`status IN ('lobby','active')`),
  ],
);
