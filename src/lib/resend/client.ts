import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

let cached: Resend | undefined;

// Lazy singleton: the SDK is constructed on first send, not at import time, so a
// fresh clone or build without RESEND_API_KEY does not fail at module load.
export function getResend(): Resend {
  cached ??= new Resend(env.RESEND_API_KEY);
  return cached;
}
