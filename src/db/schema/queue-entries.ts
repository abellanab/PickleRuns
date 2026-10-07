import { pgTable, uuid, text, integer, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { runs } from "./runs";
import { users } from "./users";
import { queueEntryStatus } from "./enums";

export const queueEntries = pgTable(
  "queue_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
    // Nullable — guests have no account
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    displayName: text("display_name").notNull(),
    status: queueEntryStatus("status").notNull().default("waiting"),
    paid: boolean("paid").notNull().default(false),
    // Integer position for queue ordering — lower = front of queue
    position: integer("position").notNull().default(0),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_queue_entries_run_id").on(t.runId),
    index("idx_queue_entries_user_id").on(t.userId),
    index("idx_queue_entries_run_id_position").on(t.runId, t.position),
  ],
);
