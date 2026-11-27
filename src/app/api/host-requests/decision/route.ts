import { decisionTokenQuerySchema, decideHostRequestSchema } from "@/validators";
import { verifyDecisionToken } from "@/lib/host-request-token";
import { getDecisionPreview, decideHostRequest } from "@/services/host-request.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const invalidToken = () => apiError("INVALID_TOKEN", "This link is invalid or has expired", 401);

export async function GET(req: Request) {
  const parsed = decisionTokenQuerySchema.safeParse({
    token: new URL(req.url).searchParams.get("token"),
  });
  if (!parsed.success) return invalidToken();

  const requestId = verifyDecisionToken(parsed.data.token);
  if (!requestId) return invalidToken();

  try {
    const preview = await getDecisionPreview(requestId);
    return apiSuccess(preview);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 400);
  }

  const parsed = decideHostRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return apiError("VALIDATION", message, 400);
  }

  const requestId = verifyDecisionToken(parsed.data.token);
  if (!requestId) return invalidToken();

  try {
    const result = await decideHostRequest(requestId, parsed.data.decision);
    return apiSuccess(result);
  } catch (e) {
    return handleApiError(e);
  }
}
