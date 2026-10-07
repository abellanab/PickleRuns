import { createClient } from "@/lib/supabase/server";
import { JoinPageClient } from "./JoinForm";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <JoinPageClient
      runCode={code}
      currentUser={user ? { id: user.id, displayName: (user.user_metadata?.displayName as string | undefined) ?? null } : null}
    />
  );
}
