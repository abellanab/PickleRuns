import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { hostRequests } from "@/db/schema";
import {
  sendHostRequestAdminEmail,
  sendHostApprovedEmail,
  sendHostDeniedEmail,
} from "@/services/email.service";

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

export class HostRequestNotFoundError extends Error {
  constructor() {
    super("Host request not found");
    this.name = "HostRequestNotFoundError";
  }
}

export class HostRequestAlreadyDecidedError extends Error {
  constructor(public readonly status: "approved" | "denied") {
    super(`This host request was already ${status}`);
    this.name = "HostRequestAlreadyDecidedError";
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

async function notifyAdminOfRequest(
  requestId: string,
  displayName: string,
  email: string | null,
): Promise<void> {
  try {
    await sendHostRequestAdminEmail({ requestId, displayName, email });
  } catch (err) {
    console.error("Host request admin notification failed", err);
  }
}

export async function createHostRequest(
  userId: string,
  displayName: string,
  email: string | null,
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
    .values({ userId, displayName, email, status: "pending" })
    .returning({ id: hostRequests.id, status: hostRequests.status });

  await notifyAdminOfRequest(created.id, displayName, email);

  return { status: created.status };
}

// Idempotent auto-create for the sign-up-with-host-intent path. Called from the
// auth callback, so it must be safe to run more than once and never throw on
// "already requested" — same discipline as welcomeUserOnce.
export async function ensureHostRequest(
  userId: string,
  displayName: string,
  email: string | null,
): Promise<void> {
  const existing = await db
    .select({ status: hostRequests.status })
    .from(hostRequests)
    .where(eq(hostRequests.userId, userId));

  if (existing.some((r) => r.status === "pending" || r.status === "approved")) {
    return;
  }

  const [created] = await db
    .insert(hostRequests)
    .values({ userId, displayName, email, status: "pending" })
    .returning({ id: hostRequests.id });

  await notifyAdminOfRequest(created.id, displayName, email);
}

export async function getDecisionPreview(requestId: string): Promise<{
  displayName: string;
  email: string | null;
  status: "pending" | "approved" | "denied";
}> {
  const [row] = await db
    .select({
      displayName: hostRequests.displayName,
      email: hostRequests.email,
      status: hostRequests.status,
    })
    .from(hostRequests)
    .where(eq(hostRequests.id, requestId));

  if (!row) throw new HostRequestNotFoundError();
  return row;
}

export async function decideHostRequest(
  requestId: string,
  decision: "approved" | "denied",
): Promise<{ status: "approved" | "denied" }> {
  const [updated] = await db
    .update(hostRequests)
    .set({ status: decision })
    .where(and(eq(hostRequests.id, requestId), eq(hostRequests.status, "pending")))
    .returning({ displayName: hostRequests.displayName, email: hostRequests.email });

  if (!updated) {
    const [existing] = await db
      .select({ status: hostRequests.status })
      .from(hostRequests)
      .where(eq(hostRequests.id, requestId));
    if (!existing || existing.status === "pending") throw new HostRequestNotFoundError();
    throw new HostRequestAlreadyDecidedError(existing.status);
  }

  if (updated.email) {
    try {
      const input = { to: updated.email, displayName: updated.displayName };
      if (decision === "approved") await sendHostApprovedEmail(input);
      else await sendHostDeniedEmail(input);
    } catch (err) {
      console.error("Host decision email failed", err);
    }
  }

  return { status: decision };
}
