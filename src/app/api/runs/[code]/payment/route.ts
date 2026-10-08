import { getRunByCode } from "@/services/run.service";
import { getPaymentQrForRun } from "@/services/profile.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

// GET /api/runs/[code]/payment — the host's payment QR (public: players and guests see it)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  try {
    const { code } = await params;

    const run = await getRunByCode(code);
    if (!run) return apiError("NOT_FOUND", "Run not found", 404);

    return apiSuccess({ paymentQrUrl: await getPaymentQrForRun(run.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
