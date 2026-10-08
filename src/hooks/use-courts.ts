"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { GameData } from "@/hooks/use-game";

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
  fillProposal: FillProposal | null;
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
    refetchOnMount: "always",
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

type CourtScoreResult = { game: GameData };

function patchCourtGame(
  overview: CourtsOverview | undefined,
  gameId: string,
  patch: (game: CourtGame) => CourtGame,
): CourtsOverview | undefined {
  if (!overview) return overview;
  return {
    ...overview,
    courts: overview.courts.map((c) =>
      c.game?.id === gameId ? { ...c, game: patch(c.game) } : c,
    ),
  };
}

function settleCourtScore(
  queryClient: ReturnType<typeof useQueryClient>,
  code: string,
  gameId: string,
  game: GameData,
) {
  if (game.status === "completed") {
    queryClient.invalidateQueries({ queryKey: ["courts", code] });
    queryClient.invalidateQueries({ queryKey: ["queue", code] });
    queryClient.invalidateQueries({ queryKey: ["games", code] });
    queryClient.invalidateQueries({ queryKey: ["fill-proposal", code] });
  } else if (queryClient.isMutating({ mutationKey: ["court-score", code, gameId] }) <= 1) {
    queryClient.setQueryData<CourtsOverview>(["courts", code], (prev) =>
      patchCourtGame(prev, gameId, (g) => ({ ...g, scoreA: game.scoreA, scoreB: game.scoreB })),
    );
  }
  queryClient.invalidateQueries({ queryKey: ["game", code, gameId] });
}

export function isDuplicateScoreError(err: unknown) {
  return err instanceof ApiError && err.code === "DUPLICATE_SCORE";
}

export function useCourtScoreMutation(code: string, gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["court-score", code, gameId],
    mutationFn: (input: { queueEntryId: string }) =>
      apiPost<CourtScoreResult>(`/api/runs/${code}/games/${gameId}/score`, input),
    onMutate: async ({ queueEntryId }) => {
      await queryClient.cancelQueries({ queryKey: ["courts", code] });
      const overview = queryClient.getQueryData<CourtsOverview>(["courts", code]);
      const game = overview?.courts.find((c) => c.game?.id === gameId)?.game;
      const side = game?.sideA.some((p) => p.entryId === queueEntryId) ? "a" : "b";
      queryClient.setQueryData<CourtsOverview>(["courts", code], (prev) =>
        patchCourtGame(prev, gameId, (g) => ({
          ...g,
          scoreA: g.scoreA + (side === "a" ? 1 : 0),
          scoreB: g.scoreB + (side === "b" ? 1 : 0),
        })),
      );
      return { side };
    },
    onSuccess: ({ game }) => settleCourtScore(queryClient, code, gameId, game),
    onError: (_err, _input, context) => {
      if (!context) return;
      queryClient.setQueryData<CourtsOverview>(["courts", code], (prev) =>
        patchCourtGame(prev, gameId, (g) => ({
          ...g,
          scoreA: Math.max(0, g.scoreA - (context.side === "a" ? 1 : 0)),
          scoreB: Math.max(0, g.scoreB - (context.side === "b" ? 1 : 0)),
        })),
      );
    },
  });
}

export function useCourtUndoMutation(code: string, gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPatch<CourtScoreResult>(`/api/runs/${code}/games/${gameId}/score`),
    onSuccess: ({ game }) => {
      queryClient.setQueryData<CourtsOverview>(["courts", code], (prev) =>
        patchCourtGame(prev, gameId, (g) => ({ ...g, scoreA: game.scoreA, scoreB: game.scoreB })),
      );
      queryClient.invalidateQueries({ queryKey: ["game", code, gameId] });
    },
  });
}
