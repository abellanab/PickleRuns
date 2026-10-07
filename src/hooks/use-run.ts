"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/api/client";
import type { RunWire } from "@/types/api";

export type RunSummary = {
  id: string;
  hostId: string;
  name: string;
  location: string | null;
  status: "lobby" | "active" | "completed";
  runMode: "score_only" | "queue_only" | "score_and_queue";
  courtCount: number;
  sessionCode: string;
  createdAt: string;
  gameCount: number;
  isHost: boolean;
};

export type CreateRunPayload = {
  name: string;
  location: string;
  runMode: "score_only" | "queue_only" | "score_and_queue";
  rotationStyle: "winner_stays" | "rotate_all";
  courtCount: number;
  scoreGoal: 11 | 15;
  winByTwo: boolean;
  sessionCode: string;
};

export function useRun(code: string) {
  return useQuery({
    queryKey: ["run", code],
    queryFn: () => apiGet<RunWire>(`/api/runs/${code}`),
  });
}

export function useRuns(enabled: boolean = true) {
  return useQuery({
    queryKey: ["runs"],
    queryFn: () => apiGet<RunSummary[]>(`/api/runs`),
    enabled,
  });
}

export function useCreateRunMutation() {
  return useMutation({
    mutationFn: (input: CreateRunPayload) =>
      apiPost<{ sessionCode: string }>("/api/runs", input),
  });
}

export function useCloseRunMutation(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPatch<RunWire>(`/api/runs/${code}/status`, { status: "completed" }),
    onSuccess: (updated) => {
      // Close-run flips runs.status from "active" to "completed" — the feed
      // shows the run summary block only in that state, so the cache has to
      // be told the run changed and the stats are now valid.
      queryClient.setQueryData<RunWire>(["run", code], updated);
      queryClient.invalidateQueries({ queryKey: ["run-stats", code] });
    },
  });
}

export type RunStats = {
  gameCount: number;
  playerCount: number;
  startedAt: string;
  topScorers: { displayName: string; points: number }[];
};

export function useRunStats(code: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["run-stats", code],
    queryFn: () => apiGet<RunStats>(`/api/runs/${code}/stats`),
    enabled,
  });
}
