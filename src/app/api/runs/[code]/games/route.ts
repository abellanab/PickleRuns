import { NextRequest } from "next/server";
import { getRunByCode } from "@/services/run.service";
import { getGamesByRunId, createGame } from "@/services/game.service";
import { createGameSchema } from "@/validators";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const run = await getRunByCode(code);
  if (!run) {
    return apiError("NOT_FOUND", "Run not found", 404);
  }
  const games = await getGamesByRunId(run.id);
  return apiSuccess(games);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code } = await params;

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

  const result = createGameSchema.safeParse(await req.json());
  if (!result.success) {
    return apiError("VALIDATION", "Invalid request payload", 400, result.error.flatten());
  }

  try {
    const game = await createGame(run.id, result.data.courtId, result.data.sideA, result.data.sideB);
    return apiSuccess(game, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
