"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api/client";

export type CourtPlayer = { entryId: string; displayName: string };

export type CourtGame = {
  id: string;
  gameNumber: number;
  status: "pending" | "active";
  scoreA: number;
  scoreB: number;
  scoreGoal: number;
  sideA: CourtPlayer[];
  sideB: CourtPlayer[];
};

export type CourtLastGame = {
  id: string;
  gameNumber: number;
  scoreA: number;
  scoreB: number;
  winner: "team_a" | "team_b" | null;
  sideA: CourtPlayer[];
  sideB: CourtPlayer[];
};

export type CourtState = {
  id: string;
  number: number;
  name: string | null;
  game: CourtGame | null;
  lastGame: CourtLastGame | null;
};

export type CourtsOverview = { courts: CourtState[]; nextUp: CourtPlayer[] };

export type FillProposal = {
  sideA: CourtPlayer[];
  sideB: CourtPlayer[];
  needed: number;
};

export function useCourts(code: string) {
  return useQuery({
    queryKey: ["courts", code],
    queryFn: () => apiGet<CourtsOverview>(`/api/runs/${code}/courts`),
  });
}

export function useFillProposal(code: string, courtId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["fill-proposal", code, courtId],
    queryFn: () =>
      apiGet<FillProposal>(`/api/runs/${code}/courts/${courtId}/fill-proposal`),
    enabled,
    staleTime: 0,
  });
}

export function useAddCourtMutation(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<CourtState>(`/api/runs/${code}/courts`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courts", code] });
    },
  });
}

export function useRemoveCourtMutation(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courtId: string) =>
      apiDelete<{ id: string }>(`/api/runs/${code}/courts/${courtId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courts", code] });
    },
  });
}
