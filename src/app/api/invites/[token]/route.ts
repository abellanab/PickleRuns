import { NextRequest } from "next/server";
import { getValidInvite } from "@/services/invite.service";
import { inviteTokenSchema } from "@/validators";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

// GET /api/invites/[token] — validate an invite token and return its bound email
// for signup prefill. No auth: this runs before an account exists.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  void req;
  const { token } = await params;

  const result = inviteTokenSchema.safeParse(token);
  if (!result.success) {
    return apiError("VALIDATION", "Invalid invite token", 400);
  }

  try {
    const { email } = await getValidInvite(result.data);
    // An invite's validity is mutable (it can be consumed seconds later), so
    // never let a CDN or browser cache a "valid" response.
    const res = apiSuccess({ email });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return handleApiError(err);
  }
}
