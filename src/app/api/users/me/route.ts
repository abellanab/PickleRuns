import { createClient } from "@/lib/supabase/server";
import { getHostStatus } from "@/services/host-request.service";
import { getProfile, updateDisplayName, ProfileNotFoundError } from "@/services/profile.service";
import { updateProfileSchema } from "@/validators";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

// GET   /api/users/me — fetch authenticated user profile
// PATCH /api/users/me — update display name
export async function GET(): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

    let displayName = (user.user_metadata?.displayName as string | undefined) ?? null;
    let avatarUrl: string | null = null;
    let paymentQrUrl: string | null = null;
    try {
      const profile = await getProfile(user.id);
      displayName = profile.displayName;
      avatarUrl = profile.avatarUrl;
      paymentQrUrl = profile.paymentQrUrl;
    } catch (err) {
      if (!(err instanceof ProfileNotFoundError)) throw err;
    }

    return apiSuccess({
      id: user.id,
      email: user.email ?? null,
      displayName,
      avatarUrl,
      paymentQrUrl,
      hostStatus: await getHostStatus(user.id),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

    const body: unknown = await req.json().catch(() => null);
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return apiError("VALIDATION", "Invalid request payload", 400, result.error.flatten());
    }

    return apiSuccess(await updateDisplayName(user.id, result.data.displayName));
  } catch (err) {
    return handleApiError(err);
  }
}
