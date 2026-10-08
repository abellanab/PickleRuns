import { createClient } from "@/lib/supabase/server";
import { uploadPaymentQr, removeUserPaymentQrs } from "@/lib/supabase/payment-qr-storage";
import { getHostStatus, HostNotApprovedError } from "@/services/host-request.service";
import { setPaymentQrUrl } from "@/services/profile.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

// POST   /api/users/me/payment-qr — upload the host's payment QR (multipart, field "file")
// DELETE /api/users/me/payment-qr — remove the host's payment QR
export async function POST(req: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);
    if ((await getHostStatus(user.id)) !== "approved") throw new HostNotApprovedError();

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return apiError("VALIDATION", "Missing file", 400);
    }

    const { url, path } = await uploadPaymentQr(supabase, user.id, file);
    await setPaymentQrUrl(user.id, url);

    try {
      await removeUserPaymentQrs(supabase, user.id, path);
    } catch (cleanupErr) {
      console.error(cleanupErr);
    }

    return apiSuccess({ paymentQrUrl: url }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);
    if ((await getHostStatus(user.id)) !== "approved") throw new HostNotApprovedError();

    await setPaymentQrUrl(user.id, null);
    try {
      await removeUserPaymentQrs(supabase, user.id);
    } catch (cleanupErr) {
      console.error(cleanupErr);
    }

    return apiSuccess({ paymentQrUrl: null });
  } catch (err) {
    return handleApiError(err);
  }
}
