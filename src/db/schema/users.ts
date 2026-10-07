import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    // Mirrors auth.users(id) — FK to auth.users is set via SQL migration, not here
    id: uuid("id").primaryKey(),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    welcomeSentAt: timestamp("welcome_sent_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_users_created_at").on(t.createdAt),
  ],
);
