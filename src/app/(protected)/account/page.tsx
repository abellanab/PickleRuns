import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountClient from "@/components/AccountClient";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AccountClient
      initialUser={{ id: user.id, email: user.email ?? "", metadata: user.user_metadata }}
    />
  );
}
