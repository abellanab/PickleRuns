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
    mutationFn: ({ displayName }: { displayName: string }) =>
      apiPost<{ status: HostStatus }>("/api/host-requests", { displayName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-status"] });
    },
  });
}

export type DecisionStatus = "pending" | "approved" | "denied";

export interface DecisionPreview {
  displayName: string;
  email: string | null;
  status: DecisionStatus;
}

export function useHostRequestDecisionPreview(token: string | null) {
  return useQuery({
    queryKey: ["host-request-decision", token],
    queryFn: () =>
      apiGet<DecisionPreview>(`/api/host-requests/decision?token=${encodeURIComponent(token ?? "")}`),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useDecideHostRequest() {
  return useMutation({
    mutationFn: ({ token, decision }: { token: string; decision: "approved" | "denied" }) =>
      apiPost<{ status: "approved" | "denied" }>("/api/host-requests/decision", {
        token,
        decision,
      }),
  });
}
