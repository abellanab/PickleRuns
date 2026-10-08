"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/api/client";

export type GameData = {
  id: string;
  gameNumber: number;
  status: "pending" | "active" | "completed";
  scoreGoal: number;
  scoreA: number;
  scoreB: number;
  winner: "team_a" | "team_b" | null;
  startedAt: string | null;
  endedAt: string | null;
};

export type PlayerData = {
  queueEntryId: string;
  displayName: string;
  avatarUrl: string | null;
  isHost: boolean;
  team: "team_a" | "team_b";
  points: number;
};

export type EventData = {
  id: string;
  queueEntryId: string;
  displayName: string;
  team: "team_a" | "team_b";
  points: number;
  createdAt: string;
};

export type GameDetails = {
  game: GameData;
  players: PlayerData[];
  recentEvents: EventData[];
};

export function useGames(code: string) {
  return useQuery({
    queryKey: ["games", code],
    queryFn: () => apiGet<GameData[]>(`/api/runs/${code}/games`),
  });
}

export function useGameDetails(code: string, gameId: string | null) {
  return useQuery({
    queryKey: ["game", code, gameId],
    queryFn: () => apiGet<GameDetails>(`/api/runs/${code}/games/${gameId}`),
    enabled: !!gameId,
  });
}

type ScoreResult = { event: EventData; game: GameData };

function applyServerGame(
  queryClient: QueryClient,
  code: string,
  gameId: string,
  game: GameData,
) {
  queryClient.setQueryData<GameDetails>(["game", code, gameId], (prev) =>
    prev ? { ...prev, game } : prev,
  );
  if (game.status === "completed") {
    queryClient.invalidateQueries({ queryKey: ["game", code, gameId] });
    queryClient.invalidateQueries({ queryKey: ["courts", code] });
    queryClient.invalidateQueries({ queryKey: ["queue", code] });
    queryClient.invalidateQueries({ queryKey: ["games", code] });
  }
}

export function useScoreMutation(code: string, gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { queueEntryId: string }) =>
      apiPost<ScoreResult>(`/api/runs/${code}/games/${gameId}/score`, input),
    // Cancel any in-flight game refetch so its stale response can't land after
    // the optimistic value and snap the score back.
    onMutate: async ({ queueEntryId }) => {
      await queryClient.cancelQueries({ queryKey: ["game", code, gameId] });
      queryClient.setQueryData<GameDetails>(["game", code, gameId], (prev) => {
        if (!prev) return prev;
        const scorer = prev.players.find((p) => p.queueEntryId === queueEntryId);
        if (!scorer) return prev;
        const optimisticEvent: EventData = {
          id: `optimistic-${Date.now()}`,
          queueEntryId,
          displayName: scorer.displayName,
          team: scorer.team,
          points: 1,
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          game: {
            ...prev.game,
            scoreA: prev.game.scoreA + (scorer.team === "team_a" ? 1 : 0),
            scoreB: prev.game.scoreB + (scorer.team === "team_b" ? 1 : 0),
            status: prev.game.status === "pending" ? "active" : prev.game.status,
          },
          players: prev.players.map((p) =>
            p.queueEntryId === queueEntryId ? { ...p, points: p.points + 1 } : p,
          ),
          recentEvents: [optimisticEvent, ...prev.recentEvents].slice(0, 10),
        };
      });
    },
    onSuccess: ({ game }) => {
      applyServerGame(queryClient, code, gameId, game);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["game", code, gameId] });
    },
  });
}

export function useUndoScoreMutation(code: string, gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPatch<ScoreResult>(`/api/runs/${code}/games/${gameId}/score`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["game", code, gameId] });
      queryClient.setQueryData<GameDetails>(["game", code, gameId], (prev) => {
        if (!prev || prev.recentEvents.length === 0) return prev;
        const last = prev.recentEvents[0];
        return {
          ...prev,
          game: {
            ...prev.game,
            scoreA: Math.max(0, prev.game.scoreA - (last.team === "team_a" ? last.points : 0)),
            scoreB: Math.max(0, prev.game.scoreB - (last.team === "team_b" ? last.points : 0)),
          },
          players: prev.players.map((p) =>
            p.queueEntryId === last.queueEntryId
              ? { ...p, points: Math.max(0, p.points - last.points) }
              : p,
          ),
          recentEvents: prev.recentEvents.slice(1),
        };
      });
    },
    onSuccess: ({ game }) => {
      applyServerGame(queryClient, code, gameId, game);
      queryClient.invalidateQueries({ queryKey: ["game", code, gameId] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["game", code, gameId] });
    },
  });
}

export function useEndGameMutation(code: string, gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input?: { winner?: "team_a" | "team_b" }) => {
      const updated = await apiPatch<GameData>(
        `/api/runs/${code}/games/${gameId}`,
        input?.winner ? { winner: input.winner } : undefined,
      );
      queryClient.setQueryData<GameDetails>(["game", code, gameId], (prev) =>
        prev ? { ...prev, game: updated } : prev,
      );
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games", code] });
      queryClient.invalidateQueries({ queryKey: ["courts", code] });
      queryClient.invalidateQueries({ queryKey: ["queue", code] });
    },
  });
}

export function useStartMatchMutation(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { courtId: string; sideA: string[]; sideB: string[] }) =>
      apiPost<GameData>(`/api/runs/${code}/games`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games", code] });
      queryClient.invalidateQueries({ queryKey: ["courts", code] });
      queryClient.invalidateQueries({ queryKey: ["queue", code] });
      queryClient.invalidateQueries({ queryKey: ["fill-proposal", code] });
    },
  });
}
