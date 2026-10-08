import { NextRequest } from "next/server";
import { joinRunSchema } from "@/validators";
import { getRunByCode, assertRunModeAllows } from "@/services/run.service";
import { joinQueue, joinQueueAsHost, getQueueForRun } from "@/services/queue.service";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

// GET  /api/runs/[code]/queue — fetch all queue entries
// POST /api/runs/[code]/queue — join queue (guest or authenticated)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code } = await params;

  const run = await getRunByCode(code);
  if (!run) {
    return apiError("NOT_FOUND", "Run not found", 404);
  }

  const queue = await getQueueForRun(run.id);
  return apiSuccess(queue);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const result = joinRunSchema.safeParse(await req.json());
  if (!result.success) {
    return apiError("VALIDATION", "Invalid request payload", 400, result.error.flatten());
  }

  const run = await getRunByCode(code);
  if (!run) {
    return apiError("NOT_FOUND", "Run not found", 404);
  }

  if (run.status === "completed") {
    return apiError("RUN_COMPLETED", "This run has ended", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // host_add / host_self are host-only; host_add players are guests (no user link)
  const { mode, displayName } = result.data;
  if ((mode === "host_add" || mode === "host_self") && userId !== run.hostId) {
    return apiError("FORBIDDEN", "Only the host can add players", 403);
  }

  if (mode === "self_join") {
    try {
      assertRunModeAllows(run, "queue");
    } catch (err) {
      return handleApiError(err);
    }
  }

  let joined;
  try {
    joined =
      mode === "host_self"
        ? await joinQueueAsHost(run.id, run.hostId, displayName)
        : await joinQueue(run.id, displayName, mode === "host_add" ? null : userId);
  } catch (err) {
    return handleApiError(err);
  }
  const { entry, position } = joined;

  return apiSuccess({ ...entry, position }, 201);
}
