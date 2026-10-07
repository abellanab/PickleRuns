import { createClient } from "@/lib/supabase/server";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <HomeClient
      initialUser={user ? { id: user.id, email: user.email ?? "", metadata: user.user_metadata } : null}
    />
  );
}
