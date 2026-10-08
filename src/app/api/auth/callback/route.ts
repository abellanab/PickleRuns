import { createClient } from "@/lib/supabase/server";
import { welcomeUserOnce } from "@/services/email.service";
import { ensureHostRequest } from "@/services/host-request.service";
import { NextResponse } from "next/server";

function resolveDisplayName(
  metadata: Record<string, unknown> | undefined,
  email: string | undefined,
): string {
  for (const key of ["displayName", "full_name", "name"]) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return (email ?? "").split("@")[0];
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Open-redirect guard: only follow same-origin paths. A leading "//" would
  // be parsed by the browser as a different host (e.g. //evil.com → evil.com),
  // so it has to be rejected alongside full URLs.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const user = data.user;
      if (user?.email) {
        try {
          await welcomeUserOnce({
            userId: user.id,
            email: user.email,
            displayName: resolveDisplayName(user.user_metadata, user.email),
          });
        } catch (err) {
          console.error("Welcome email failed", err);
        }
      }
      // Sign-up-with-host-intent: the session now exists and public.users is
      // trigger-created, so the FK is satisfiable. Log-only, must not block redirect.
      if (user?.user_metadata?.hostIntent) {
        try {
          const hostName = (resolveDisplayName(user.user_metadata, user.email) || "Host").slice(0, 50);
          await ensureHostRequest(user.id, hostName);
        } catch (err) {
          console.error("Host request auto-create failed", err);
        }
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=callback_error`);
}
