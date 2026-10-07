import { NextRequest } from "next/server";
import { queueEntryPatchSchema } from "@/validators";
import { getRunByCode } from "@/services/run.service";
import { updateQueueEntryStatus, updateQueueEntryPaid } from "@/services/queue.service";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";

// PATCH /api/runs/[code]/queue/[entryId]
// Accepts { status } or { paid } — host only.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; entryId: string }> },
): Promise<Response> {
  const { code, entryId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  if (!userId) {
    return apiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const run = await getRunByCode(code);
  if (!run) {
    return apiError("NOT_FOUND", "Run not found", 404);
  }
  if (run.hostId !== userId) {
    return apiError("FORBIDDEN", "Forbidden", 403);
  }

  const result = queueEntryPatchSchema.safeParse(await req.json());
  if (!result.success) {
    return apiError("VALIDATION", "Invalid request payload", 400, result.error.flatten());
  }

  const entry =
    "status" in result.data
      ? await updateQueueEntryStatus(run.id, entryId, result.data.status)
      : await updateQueueEntryPaid(run.id, entryId, result.data.paid);

  if (!entry) {
    return apiError("NOT_FOUND", "Queue entry not found", 404);
  }

  return apiSuccess(entry);
}
