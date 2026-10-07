import { NextRequest } from "next/server";
import { getRunByCode } from "@/services/run.service";
import { getFillProposal } from "@/services/court.service";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string; courtId: string }> },
): Promise<Response> {
  const { code, courtId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  if (!userId) return apiError("UNAUTHORIZED", "Unauthorized", 401);

  const run = await getRunByCode(code);
  if (!run) return apiError("NOT_FOUND", "Run not found", 404);
  if (run.hostId !== userId) return apiError("FORBIDDEN", "Forbidden", 403);

  try {
    return apiSuccess(await getFillProposal(run.id, courtId));
  } catch (err) {
    return handleApiError(err);
  }
}
