import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "payment-qr";
const MAX_BYTES = 3 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class InvalidPaymentQrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPaymentQrError";
  }
}

export async function uploadPaymentQr(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ url: string; path: string }> {
  const ext = EXTENSIONS[file.type];
  if (!ext) {
    throw new InvalidPaymentQrError("QR image must be a JPEG, PNG or WebP image");
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    throw new InvalidPaymentQrError("QR image must be 3 MB or smaller");
  }

  const path = `${userId}/qr-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Payment QR upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeUserPaymentQrs(
  supabase: SupabaseClient,
  userId: string,
  keepPath?: string,
): Promise<void> {
  const { data: files, error: listError } = await supabase.storage.from(BUCKET).list(userId);
  if (listError) throw new Error(`Payment QR list failed: ${listError.message}`);

  const stale = (files ?? [])
    .map((f) => `${userId}/${f.name}`)
    .filter((p) => p !== keepPath);
  if (stale.length === 0) return;

  const { error: removeError } = await supabase.storage.from(BUCKET).remove(stale);
  if (removeError) throw new Error(`Payment QR remove failed: ${removeError.message}`);
}
