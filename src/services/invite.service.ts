import { db } from "@/db";
import { invites } from "@/db/schema";
import { eq } from "drizzle-orm";

export class InviteNotFoundError extends Error {
  constructor() {
    super("Invite not found");
    this.name = "InviteNotFoundError";
  }
}

export class InviteUsedError extends Error {
  constructor() {
    super("Invite has already been used");
    this.name = "InviteUsedError";
  }
}

export class InviteExpiredError extends Error {
  constructor() {
    super("Invite has expired");
    this.name = "InviteExpiredError";
  }
}

export async function getValidInvite(token: string): Promise<{ email: string }> {
  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);

  if (!invite) throw new InviteNotFoundError();
  if (invite.usedAt) throw new InviteUsedError();
  if (invite.expiresAt.getTime() <= Date.now()) throw new InviteExpiredError();

  return { email: invite.email };
}
