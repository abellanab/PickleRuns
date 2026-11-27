import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getResend } from "@/lib/resend/client";
import { env } from "@/lib/env";
import { signDecisionToken } from "@/lib/host-request-token";
import { WelcomeEmail } from "@/emails/welcome-email";
import { HostRequestAdminEmail } from "@/emails/host-request-admin-email";
import { HostApprovedEmail } from "@/emails/host-approved-email";
import { HostDeniedEmail } from "@/emails/host-denied-email";

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

interface SendHostRequestAdminEmailInput {
  requestId: string;
  displayName: string;
  email: string | null;
}

export async function sendHostRequestAdminEmail({
  requestId,
  displayName,
  email,
}: SendHostRequestAdminEmailInput): Promise<void> {
  const token = signDecisionToken(requestId);
  const base = `${env.APP_URL.replace(/\/+$/, "")}/host-requests/decision?token=${encodeURIComponent(token)}`;

  const { error } = await getResend().emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: env.HOST_REQUEST_ADMIN_EMAIL,
    subject: `Host request from ${displayName}`,
    react: HostRequestAdminEmail({
      displayName,
      email,
      approveUrl: `${base}&action=approve`,
      denyUrl: `${base}&action=deny`,
    }),
  });

  if (error) {
    throw new Error(`Host request admin email failed: ${error.message}`);
  }
}

interface SendHostDecisionEmailInput {
  to: string;
  displayName: string;
}

export async function sendHostApprovedEmail({
  to,
  displayName,
}: SendHostDecisionEmailInput): Promise<void> {
  const { error } = await getResend().emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: "You're approved to host on PickleRuns",
    react: HostApprovedEmail({
      displayName,
      createRunUrl: `${env.APP_URL.replace(/\/+$/, "")}/create-run`,
    }),
  });

  if (error) {
    throw new Error(`Host approved email failed: ${error.message}`);
  }
}

export async function sendHostDeniedEmail({
  to,
  displayName,
}: SendHostDecisionEmailInput): Promise<void> {
  const { error } = await getResend().emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: "An update on your PickleRuns host request",
    react: HostDeniedEmail({ displayName }),
  });

  if (error) {
    throw new Error(`Host denied email failed: ${error.message}`);
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
