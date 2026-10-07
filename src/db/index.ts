import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle>;
};

// `prepare: false` required for Supabase pgBouncer (transaction mode pooler)
const client = postgres(env.DATABASE_URL, { prepare: false });
export const db = globalForDb.db ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
