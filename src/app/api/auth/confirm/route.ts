import { createClient } from "@/lib/supabase/server";
import { welcomeUserOnce } from "@/services/email.service";
import { ensureHostRequest } from "@/services/host-request.service";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Token-hash verification endpoint for emailed auth links (signup confirmation,
// recovery, magic link). Supabase's default email template hits its own
// /auth/v1/verify and skips our PKCE callback, so this route is what the
// "Confirm signup" template must point at for the welcome email to fire.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  // Open-redirect guard: only follow same-origin paths.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const user = data.user;
      if (user?.email) {
        try {
          await welcomeUserOnce({
            userId: user.id,
            email: user.email,
            displayName: (user.user_metadata?.displayName as string) ?? "",
          });
        } catch (err) {
          console.error("Welcome email failed", err);
        }
      }
      // Sign-up-with-host-intent: the session now exists and public.users is
      // trigger-created, so the FK is satisfiable. Log-only, must not block redirect.
      if (user?.user_metadata?.hostIntent) {
        try {
          await ensureHostRequest(user.id);
        } catch (err) {
          console.error("Host request auto-create failed", err);
        }
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirm_error`);
}
