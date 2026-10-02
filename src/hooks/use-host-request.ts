"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api/client";
import type { HostStatus } from "@/services/host-request.service";

interface MeResponse {
  id: string;
  email: string | null;
  displayName: string | null;
  hostStatus: HostStatus;
}

export function useHostStatus() {
  return useQuery({
    queryKey: ["host-status"],
    queryFn: () => apiGet<MeResponse>("/api/users/me"),
    select: (data) => data.hostStatus,
  });
}

export function useRequestHostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ status: HostStatus }>("/api/host-requests"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-status"] });
    },
  });
}
