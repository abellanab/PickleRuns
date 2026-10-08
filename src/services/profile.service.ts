import { db } from "@/db";
import { users, queueEntries, runs } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export class ProfileNotFoundError extends Error {
  constructor() {
    super("Profile not found");
    this.name = "ProfileNotFoundError";
  }
}

export type Profile = { id: string; displayName: string; avatarUrl: string | null };
export type FullProfile = Profile & { paymentQrUrl: string | null };

export async function getProfile(userId: string): Promise<FullProfile> {
  const [row] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      paymentQrUrl: users.paymentQrUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) throw new ProfileNotFoundError();
  return row;
}

export async function updateDisplayName(userId: string, displayName: string): Promise<Profile> {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [row] = await tx
      .update(users)
      .set({ displayName, updatedAt: now })
      .where(eq(users.id, userId))
      .returning({ id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl });
    if (!row) throw new ProfileNotFoundError();

    await tx
      .update(queueEntries)
      .set({ displayName, updatedAt: now })
      .where(
        and(
          eq(queueEntries.userId, userId),
          inArray(
            queueEntries.runId,
            tx.select({ id: runs.id }).from(runs).where(inArray(runs.status, ["lobby", "active"])),
          ),
        ),
      );

    return row;
  });
}

export async function setAvatarUrl(userId: string, avatarUrl: string | null): Promise<void> {
  const updated = await db
    .update(users)
    .set({ avatarUrl, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  if (updated.length === 0) throw new ProfileNotFoundError();
}

export async function setPaymentQrUrl(userId: string, paymentQrUrl: string | null): Promise<void> {
  const updated = await db
    .update(users)
    .set({ paymentQrUrl, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  if (updated.length === 0) throw new ProfileNotFoundError();
}

export async function getPaymentQrForRun(runId: string): Promise<string | null> {
  const [row] = await db
    .select({ paymentQrUrl: users.paymentQrUrl })
    .from(runs)
    .innerJoin(users, eq(users.id, runs.hostId))
    .where(eq(runs.id, runId))
    .limit(1);
  return row?.paymentQrUrl ?? null;
}
