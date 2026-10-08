import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "avatars";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class InvalidAvatarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAvatarError";
  }
}

export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ url: string; path: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new InvalidAvatarError("Photo must be a JPEG, PNG or WebP image");
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    throw new InvalidAvatarError("Photo must be 2 MB or smaller");
  }

  const path = `${userId}/avatar-${Date.now()}.webp`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Avatar upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeUserAvatars(
  supabase: SupabaseClient,
  userId: string,
  keepPath?: string,
): Promise<void> {
  const { data: files, error: listError } = await supabase.storage.from(BUCKET).list(userId);
  if (listError) throw new Error(`Avatar list failed: ${listError.message}`);

  const stale = (files ?? [])
    .map((f) => `${userId}/${f.name}`)
    .filter((p) => p !== keepPath);
  if (stale.length === 0) return;

  const { error: removeError } = await supabase.storage.from(BUCKET).remove(stale);
  if (removeError) throw new Error(`Avatar remove failed: ${removeError.message}`);
}
