import { eq } from "drizzle-orm";
import { db } from "@/db";
import { hostRequests } from "@/db/schema";

export class HostNotApprovedError extends Error {
  constructor() {
    super("Hosting requires an approved request");
    this.name = "HostNotApprovedError";
  }
}

export class AlreadyHostError extends Error {
  constructor() {
    super("This account is already approved to host");
    this.name = "AlreadyHostError";
  }
}

export class HostRequestPendingError extends Error {
  constructor() {
    super("A host request is already pending");
    this.name = "HostRequestPendingError";
  }
}

export type HostStatus = "none" | "pending" | "approved" | "denied";

export async function getHostStatus(userId: string): Promise<HostStatus> {
  const rows = await db
    .select({ status: hostRequests.status })
    .from(hostRequests)
    .where(eq(hostRequests.userId, userId));

  if (rows.some((r) => r.status === "approved")) return "approved";
  if (rows.some((r) => r.status === "pending")) return "pending";
  if (rows.some((r) => r.status === "denied")) return "denied";
  return "none";
}

export async function createHostRequest(
  userId: string,
): Promise<{ status: HostStatus }> {
  const existing = await db
    .select({ status: hostRequests.status })
    .from(hostRequests)
    .where(eq(hostRequests.userId, userId));

  if (existing.some((r) => r.status === "approved")) {
    throw new AlreadyHostError();
  }
  if (existing.some((r) => r.status === "pending")) {
    throw new HostRequestPendingError();
  }

  // The partial unique index uq_host_requests_one_pending is the race backstop.
  const [created] = await db
    .insert(hostRequests)
    .values({ userId, status: "pending" })
    .returning({ status: hostRequests.status });

  return { status: created.status };
}

// Idempotent auto-create for the sign-up-with-host-intent path. Called from the
// auth callback, so it must be safe to run more than once and never throw on
// "already requested" — same discipline as welcomeUserOnce.
export async function ensureHostRequest(userId: string): Promise<void> {
  const existing = await db
    .select({ status: hostRequests.status })
    .from(hostRequests)
    .where(eq(hostRequests.userId, userId));

  if (existing.some((r) => r.status === "pending" || r.status === "approved")) {
    return;
  }

  await db.insert(hostRequests).values({ userId, status: "pending" });
}
