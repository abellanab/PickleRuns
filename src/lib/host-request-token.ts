import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

interface DecisionPayload {
  id: string;
  exp: number;
}

function sign(payloadB64: string): Buffer {
  return createHmac("sha256", env.HOST_REQUEST_DECISION_SECRET).update(payloadB64).digest();
}

export function signDecisionToken(requestId: string): string {
  const payload: DecisionPayload = {
    id: requestId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${sign(payloadB64).toString("base64url")}`;
}

export function verifyDecisionToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, signatureB64] = parts;

    const expected = sign(payloadB64);
    const actual = Buffer.from(signatureB64, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return null;
    }

    const payload: unknown = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (typeof payload !== "object" || payload === null) return null;
    const { id, exp } = payload as Partial<DecisionPayload>;
    if (typeof id !== "string" || typeof exp !== "number") return null;
    if (exp < Math.floor(Date.now() / 1000)) return null;
    return id;
  } catch {
    return null;
  }
}
