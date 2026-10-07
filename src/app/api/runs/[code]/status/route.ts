import { NextRequest } from "next/server";
import { getRunByCode, closeRun } from "@/services/run.service";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const updateStatusSchema = z.object({ status: z.literal("completed") });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  if (!userId) return apiError("UNAUTHORIZED", "Unauthorized", 401);

  const run = await getRunByCode(code);
  if (!run) return apiError("NOT_FOUND", "Run not found", 404);
  if (run.hostId !== userId) return apiError("FORBIDDEN", "Forbidden", 403);

  const result = updateStatusSchema.safeParse(await req.json());
  if (!result.success) return apiError("VALIDATION", "Invalid request payload", 400, result.error.flatten());

  try {
    const updated = await closeRun(run.id);
    return apiSuccess(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
