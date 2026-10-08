"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourtCard } from "@/components/ui/court-card";
import { NextUpStrip } from "@/components/ui/next-up-strip";
import { PlayerStatusBanner } from "@/components/ui/player-status-banner";
import { SessionTopbar } from "@/components/ui/session-topbar";
import { ApiError } from "@/lib/api/client";
import { useRunRealtime } from "@/hooks/use-run-realtime";
import { winnerText } from "@/components/ui/game-breakdown";
import {
  useAddCourtMutation,
  isDuplicateScoreError,
  useCourtScoreMutation,
  useCourtUndoMutation,
  useCourts,
  useRemoveCourtMutation,
  type CourtState,
} from "@/hooks/use-courts";
import { useEndGameMutation, useGames, useStartMatchMutation } from "@/hooks/use-game";
import { useQueue } from "@/hooks/use-queue";
import { useRun, useRunStats } from "@/hooks/use-run";
import { useSessionUser } from "@/hooks/use-session";
import type { RunWire } from "@/types/api";

const MODE_LABELS: Record<RunWire["runMode"], string> = {
  score_only: "Score only",
  queue_only: "Queue only",
  score_and_queue: "Score + queue",
};

function readStoredEntryId(code: string): string | null {
  try {
    return localStorage.getItem(`pickleruns:entry:${code}`);
  } catch {
    return null;
  }
}

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();

  const runQuery = useRun(code);
  const gamesQuery = useGames(code);
  const sessionQuery = useSessionUser();
  const courtsQuery = useCourts(code);
  const queueQuery = useQueue(code);
  const addCourtMutation = useAddCourtMutation(code);
  const [entryId, setEntryId] = useState<string | null>(null);

  useEffect(() => {
    setEntryId(readStoredEntryId(code));
  }, [code]);

  const run = runQuery.data ?? null;
  const games = gamesQuery.data ?? [];
  const runStatsQuery = useRunStats(code, run?.status === "completed");
  const userId = sessionQuery.data ?? null;
  const loading = runQuery.isPending || gamesQuery.isPending || sessionQuery.isPending;
  const courtsLoading = courtsQuery.isPending;

  const isHost = !!userId && !!run && userId === run.hostId;
  const canManageRun = isHost && run?.status !== "completed";
  const completedGames = games.filter((g) => g.status === "completed");
  const courts = [...(courtsQuery.data?.courts ?? [])].sort((a, b) => a.number - b.number);
  const nextUp = courtsQuery.data?.nextUp ?? [];
  const isQueueMode = !!run && run.runMode !== "score_only";
  const hasLiveGame = courts.some((c) => c.game !== null);
  const waitingCount = queueQuery.data?.waiting.filter((e) => e.status === "waiting").length ?? 0;

  useRunRealtime(run?.id ?? null, code);

  return (
    <>
      <SessionTopbar
        run={run}
        loading={loading}
        exitHref={!loading && userId !== null ? "/dashboard" : undefined}
        showEndRun={canManageRun}
        liveGameWarning={hasLiveGame}
        badge={hasLiveGame ? (
          <div className="flex items-center gap-[5px] font-display text-[12px] font-bold tracking-[0.1em] uppercase text-accent bg-accent-glow border border-border-accent px-2.5 py-1 rounded-[4px]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-live-pulse flex-shrink-0" />
            Live
          </div>
        ) : undefined}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">

        {!loading && run && (
          <div className="px-5 mt-4 flex items-center justify-between gap-3">
            <span className="font-display text-[14px] font-extrabold uppercase tracking-[0.04em] text-text-primary truncate">
              {run.name}
            </span>
            <span className="flex-shrink-0 font-display text-[10px] font-bold tracking-[0.12em] uppercase text-text-secondary border border-border rounded-full px-2.5 py-1">
              {MODE_LABELS[run.runMode]}
            </span>
          </div>
        )}

        {!loading && run && run.status !== "completed" && isQueueMode && (
          <div className="px-5 mt-3">
            <PlayerStatusBanner entryId={entryId} queue={queueQuery.data} courts={courts} />
          </div>
        )}

        {/* RUN ENDED — celebration summary, only when the run is fully closed */}
        {!loading && run?.status === "completed" && runStatsQuery.data && (
          <div
            className="mx-5 mt-4 bg-bg-surface border border-border-accent rounded-lg overflow-hidden animate-fade-up"
            style={{ animationDelay: "0.04s" }}
          >
            <div className="h-[3px] bg-accent w-full" />

            <div className="px-4 pt-3.5 pb-4">
              {/* Session facts */}
              <div className="flex items-baseline justify-between">
                <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
                  Run ended
                </span>
                <span className="font-display text-[11px] font-semibold tracking-[0.04em] uppercase text-text-muted">
                  {new Date(runStatsQuery.data.startedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <span className="font-display text-[13px] font-semibold tracking-[0.02em] text-text-secondary mt-1 block">
                {runStatsQuery.data.gameCount} {runStatsQuery.data.gameCount === 1 ? "game" : "games"}
                {" · "}
                {runStatsQuery.data.playerCount} {runStatsQuery.data.playerCount === 1 ? "player" : "players"}
              </span>

              {/* Top scorers leaderboard */}
              {runStatsQuery.data.topScorers.length > 0 ? (
                <div className="mt-3.5 pt-3.5 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-accent">
                      Top Scorers
                    </span>
                    <span className="font-display text-[9px] font-bold tracking-[0.12em] uppercase text-text-muted">
                      Pts
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5 mt-2.5">
                    {runStatsQuery.data.topScorers.map((scorer, i) => (
                      <div key={`${scorer.displayName}-${i}`} className="flex items-center gap-3">
                        <span
                          className={`font-display text-[12px] font-black tabular-nums w-3 leading-none ${
                            i === 0 ? "text-accent" : "text-text-muted"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="font-display text-[14px] font-extrabold uppercase tracking-[-0.01em] text-text-primary leading-none flex-1 truncate">
                          {scorer.displayName}
                        </span>
                        <span
                          className={`font-display text-[16px] font-black tabular-nums leading-none ${
                            i === 0 ? "text-accent" : "text-text-primary"
                          }`}
                        >
                          {scorer.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="font-display text-[12px] font-semibold text-text-muted mt-3.5 pt-3.5 border-t border-border block">
                  No scoring recorded
                </span>
              )}
            </div>
          </div>
        )}

        {/* COURTS */}
        {!loading && run && run.status !== "completed" && (
          <div className="px-5 mt-4 flex flex-col gap-3 animate-fade-up" style={{ animationDelay: "0.06s" }}>
            {courtsLoading && (
              <>
                <div className="h-[140px] rounded-lg bg-bg-surface animate-pulse" />
                <div className="h-[140px] rounded-lg bg-bg-surface animate-pulse" />
              </>
            )}

            {courtsQuery.isError && !courtsLoading && (
              <div className="rounded-md border border-border bg-bg-surface px-4 py-4 flex flex-col items-center gap-2 text-center">
                <span className="font-body text-[13px] text-text-muted">Couldn&apos;t load courts.</span>
                <Button variant="secondary" onClick={() => courtsQuery.refetch()} className="min-h-[44px]">
                  Retry
                </Button>
              </div>
            )}

            {courts.map((court) => (
              <CourtSlot
                key={court.id}
                code={code}
                court={court}
                run={run}
                isHost={canManageRun}
                canRemove={courts.length > 1}
              />
            ))}

            {isQueueMode && !courtsLoading && !courtsQuery.isError && (
              <NextUpStrip nextUp={nextUp} waitingCount={waitingCount} />
            )}

            {canManageRun && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => addCourtMutation.mutate()}
                  disabled={addCourtMutation.isPending}
                  className="w-full min-h-[48px]"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  Add court
                </Button>
                {addCourtMutation.isError && (
                  <p className="font-display text-[12px] font-bold text-warning text-center">
                    {addCourtMutation.error.message}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* PAST GAMES SECTION HEADER */}
        {!loading && completedGames.length > 0 && (
          <div
            className="flex items-center justify-between px-5 pt-6 pb-2.5 animate-fade-up"
            style={{ animationDelay: "0.12s" }}
          >
            <span className="font-display text-[12px] font-bold tracking-[0.14em] uppercase text-text-muted">
              Past games
            </span>
            <span className="font-display text-[12px] font-bold tracking-[0.1em] uppercase text-text-muted">
              {completedGames.length} played
            </span>
          </div>
        )}

        {/* PAST GAME CARDS */}
        {completedGames.length > 0 && (
          <div
            className="px-5 flex flex-col gap-2 animate-fade-up"
            style={{ animationDelay: "0.16s" }}
          >
            {completedGames.map((game) => (
              <Link
                key={game.id}
                href={`/runs/${code}/lobby/${game.id}`}
                className="bg-bg-surface border border-border rounded-md px-3.5 py-3 flex items-center gap-3 cursor-pointer relative overflow-hidden group transition-[border-color] hover:border-border-accent active:scale-[0.99]"
              >
                <div className="absolute inset-0 bg-accent-glow opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex-1 flex flex-col gap-0.5 relative z-10 min-w-0">
                  <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-text-muted leading-none">
                    Game {game.gameNumber}
                  </span>
                  <span className="font-display text-[16px] font-extrabold tracking-[0.04em] uppercase text-text-primary leading-none truncate">
                    {winnerText(game.winner)}
                  </span>
                </div>
                <span className="font-display text-[22px] font-black tracking-[-0.01em] text-text-secondary flex-shrink-0 leading-none relative z-10">
                  {run?.runMode === "queue_only" ? "" : `${game.scoreA}–${game.scoreB}`}
                </span>
                <ChevronRight
                  strokeWidth={2.5}
                  className="w-3.5 h-3.5 text-text-muted flex-shrink-0 relative z-10 group-hover:text-text-secondary transition-colors"
                />
              </Link>
            ))}
          </div>
        )}

        {/* EMPTY STATE — no games yet, not host */}
        {!loading && completedGames.length === 0 && !isHost && (
          <div
            className="mx-5 mt-4 px-5 py-6 bg-bg-surface border border-dashed border-border rounded-md flex flex-col items-center gap-1.5 text-center animate-fade-up"
            style={{ animationDelay: "0.12s" }}
          >
            <span className="font-display text-[13px] font-bold tracking-[0.08em] uppercase text-text-muted">
              No games yet
            </span>
            <span className="font-body text-[12px] text-text-muted">
              Completed games will appear here
            </span>
          </div>
        )}
      </div>
    </>
  );
}

interface CourtSlotProps {
  code: string;
  court: CourtState;
  run: RunWire;
  isHost: boolean;
  canRemove: boolean;
}

function CourtSlot({ code, court, run, isHost, canRemove }: CourtSlotProps) {
  const game = court.game;
  const endMutation = useEndGameMutation(code, game?.id ?? "");
  const startMutation = useStartMatchMutation(code);
  const removeMutation = useRemoveCourtMutation(code);
  const scoreMutation = useCourtScoreMutation(code, game?.id ?? "");
  const undoMutation = useCourtUndoMutation(code, game?.id ?? "");
  const [askWinner, setAskWinner] = useState(false);

  const proposal = court.fillProposal;

  function endMatch(winner?: "team_a" | "team_b") {
    endMutation.mutate(winner ? { winner } : undefined, {
      onSuccess: () => setAskWinner(false),
      onError: (err) => {
        if (err instanceof ApiError && err.code === "WINNER_REQUIRED") setAskWinner(true);
      },
    });
  }

  function handleEndTap() {
    if (run.runMode === "queue_only" && run.rotationStyle === "winner_stays") {
      setAskWinner(true);
      return;
    }
    endMatch();
  }

  function handleStart() {
    if (!proposal) return;
    startMutation.mutate({
      courtId: court.id,
      sideA: proposal.sideA.map((p) => p.entryId),
      sideB: proposal.sideB.map((p) => p.entryId),
    });
  }

  const scoreFailure =
    scoreMutation.isError && !isDuplicateScoreError(scoreMutation.error)
      ? scoreMutation.error
      : null;
  const scoreError = scoreFailure?.message ?? (undoMutation.isError ? undoMutation.error.message : null);

  const endError =
    endMutation.isError &&
    !(endMutation.error instanceof ApiError && endMutation.error.code === "WINNER_REQUIRED")
      ? endMutation.error.message
      : null;

  return (
    <CourtCard
      code={code}
      court={court}
      runMode={run.runMode}
      isHost={isHost}
      canRemove={canRemove}
      proposal={proposal}
      askWinner={askWinner}
      endPending={endMutation.isPending}
      endError={endError}
      startPending={startMutation.isPending}
      startError={startMutation.isError ? startMutation.error.message : null}
      removePending={removeMutation.isPending}
      removeError={removeMutation.isError ? removeMutation.error.message : null}
      scoreError={scoreError}
      undoPending={undoMutation.isPending}
      onScorePlayer={(queueEntryId) => scoreMutation.mutate({ queueEntryId })}
      onUndo={() => undoMutation.mutate()}
      onEndTap={handleEndTap}
      onPickWinner={endMatch}
      onCancelWinner={() => setAskWinner(false)}
      onStart={handleStart}
      onRemove={() => removeMutation.mutate(court.id)}
    />
  );
}
