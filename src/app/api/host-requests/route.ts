import { createClient } from "@/lib/supabase/server";
import { createHostRequest } from "@/services/host-request.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  try {
    const created = await createHostRequest(user.id);
    return apiSuccess(created, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
