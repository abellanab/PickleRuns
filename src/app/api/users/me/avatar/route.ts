import { createClient } from "@/lib/supabase/server";
import { uploadAvatar, removeUserAvatars } from "@/lib/supabase/avatar-storage";
import { setAvatarUrl } from "@/services/profile.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

// POST   /api/users/me/avatar — upload a profile photo (multipart, field "file")
// DELETE /api/users/me/avatar — remove the profile photo
export async function POST(req: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return apiError("VALIDATION", "Missing file", 400);
    }

    const { url, path } = await uploadAvatar(supabase, user.id, file);
    await setAvatarUrl(user.id, url);

    try {
      await removeUserAvatars(supabase, user.id, path);
    } catch (cleanupErr) {
      console.error(cleanupErr);
    }

    return apiSuccess({ avatarUrl: url }, 201);
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

    await setAvatarUrl(user.id, null);
    try {
      await removeUserAvatars(supabase, user.id);
    } catch (cleanupErr) {
      console.error(cleanupErr);
    }

    return apiSuccess({ avatarUrl: null });
  } catch (err) {
    return handleApiError(err);
  }
}
