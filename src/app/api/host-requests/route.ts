import { createClient } from "@/lib/supabase/server";
import { createHostRequest } from "@/services/host-request.service";
import { createHostRequestSchema } from "@/validators";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 400);
  }

  const parsed = createHostRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return apiError("VALIDATION", message, 400);
  }

  try {
    const created = await createHostRequest(user.id, parsed.data.displayName);
    return apiSuccess(created, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
