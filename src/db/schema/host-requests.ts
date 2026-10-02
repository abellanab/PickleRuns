import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { hostRequestStatus } from "./enums";

export const hostRequests = pgTable(
  "host_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // FK to public.users(id) is set via SQL migration, not here
    userId: uuid("user_id").notNull(),
    status: hostRequestStatus("status").notNull().default("pending"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_host_requests_user_id").on(t.userId),
  ],
);
