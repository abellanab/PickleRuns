import { NextRequest } from "next/server";
import { getRunByCode } from "@/services/run.service";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/runs/[code] — fetch run by session code
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  void req;
  const { code } = await params;
  const run = await getRunByCode(code);

  if (!run) {
    return apiError("NOT_FOUND", "Run not found", 404);
  }

  return apiSuccess(run);
}
