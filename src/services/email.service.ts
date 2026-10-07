import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getResend } from "@/lib/resend/client";
import { env } from "@/lib/env";
import { WelcomeEmail } from "@/emails/welcome-email";

interface SendWelcomeEmailInput {
  to: string;
  displayName: string;
}

export async function sendWelcomeEmail({
  to,
  displayName,
}: SendWelcomeEmailInput): Promise<void> {
  const { error } = await getResend().emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: "Welcome to PickleRuns",
    react: WelcomeEmail({ displayName }),
  });

  if (error) {
    throw new Error(`Welcome email failed: ${error.message}`);
  }
}

interface WelcomeUserOnceInput {
  userId: string;
  email: string;
  displayName: string;
}

export async function welcomeUserOnce({
  userId,
  email,
  displayName,
}: WelcomeUserOnceInput): Promise<void> {
  const claimed = await db
    .update(users)
    .set({ welcomeSentAt: sql`now()` })
    .where(and(eq(users.id, userId), isNull(users.welcomeSentAt)))
    .returning({ id: users.id });

  if (claimed.length === 0) {
    return;
  }

  // The claim is committed before the send, so a failed send is a missed
  // welcome email (the safe failure) — never a duplicate.
  await sendWelcomeEmail({ to: email, displayName });
}
