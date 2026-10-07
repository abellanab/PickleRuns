import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle>;
};

// `prepare: false`: Supabase pgBouncer runs in transaction mode, which does not support prepared statements.
// `max: 1`: each serverless instance holds a single pooled connection so concurrent instances do not exhaust the pooler.
const client = postgres(env.DATABASE_URL, { prepare: false, max: 1 });
export const db = globalForDb.db ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
