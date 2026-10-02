"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";

export function useInvite(token: string | null) {
  return useQuery({
    queryKey: ["invite", token],
    queryFn: () => apiGet<{ email: string }>(`/api/invites/${token}`),
    enabled: !!token,
    retry: false,
  });
}
