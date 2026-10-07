"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const SESSION_USER_KEY = ["session-user"] as const;

export function useSessionUser() {
  return useQuery({
    queryKey: SESSION_USER_KEY,
    queryFn: async () => {
      const { data: { session } } = await createClient().auth.getSession();
      return session?.user?.id ?? null;
    },
    staleTime: Infinity,
  });
}
