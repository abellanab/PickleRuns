import { createClient } from "@/lib/supabase/server";
import { getHostStatus } from "@/services/host-request.service";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET   /api/users/me — fetch authenticated user profile
// PATCH /api/users/me — update display name
export async function GET(): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

  return apiSuccess({
    id: user.id,
    email: user.email ?? null,
    displayName: (user.user_metadata?.displayName as string | undefined) ?? null,
    hostStatus: await getHostStatus(user.id),
  });
}

export async function PATCH(): Promise<Response> {
  return apiError("NOT_IMPLEMENTED", "Not implemented", 501);
}
