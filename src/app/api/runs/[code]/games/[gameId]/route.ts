import { NextRequest } from "next/server";
import { getRunByCode } from "@/services/run.service";
import { getGameWithDetails, endGame } from "@/services/game.service";
import { endGameSchema } from "@/validators";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string; gameId: string }> },
): Promise<Response> {
  const { code, gameId } = await params;
  const run = await getRunByCode(code);
  if (!run) return apiError("NOT_FOUND", "Run not found", 404);

  const details = await getGameWithDetails(gameId);
  if (!details || details.game.runId !== run.id) {
    return apiError("NOT_FOUND", "Game not found", 404);
  }

  return apiSuccess(details);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; gameId: string }> },
): Promise<Response> {
  const { code, gameId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  if (!userId) return apiError("UNAUTHORIZED", "Unauthorized", 401);

  const run = await getRunByCode(code);
  if (!run) return apiError("NOT_FOUND", "Run not found", 404);
  if (run.hostId !== userId) return apiError("FORBIDDEN", "Forbidden", 403);

  const body: unknown = await req.json().catch(() => ({}));
  const result = endGameSchema.safeParse(body ?? {});
  if (!result.success) {
    return apiError("VALIDATION", "Invalid request payload", 400, result.error.flatten());
  }

  try {
    const game = await endGame(gameId, run.id, result.data.winner);
    return apiSuccess(game);
  } catch (err) {
    return handleApiError(err);
  }
}
