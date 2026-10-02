"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import { SessionTopbar } from "@/components/ui/session-topbar";
import { useLobbyRealtime } from "@/hooks/use-lobby-realtime";
import { formatTime, winnerLabel } from "@/lib/utils";
import { useGames, type GameData } from "@/hooks/use-game";
import { useRun, useRunStats } from "@/hooks/use-run";
import { useSessionUser } from "@/hooks/use-session";

function getRemainingTime(game: GameData): number {
  if (!game.clockStartedAt || game.timeLimitSeconds === null) return 0;
  const startMs = new Date(game.clockStartedAt).getTime();
  const endMs = game.clockPausedAt ? new Date(game.clockPausedAt).getTime() : Date.now();
  const elapsed = Math.max(0, Math.floor((endMs - startMs) / 1000) - game.totalPausedSeconds);
  return Math.max(0, game.timeLimitSeconds - elapsed);
}

function gameDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) return "—";
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  return formatTime(Math.round(ms / 1000));
}

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const runQuery = useRun(code);
  const gamesQuery = useGames(code);
  const sessionQuery = useSessionUser();

  const run = runQuery.data ?? null;
  const games = gamesQuery.data ?? [];
  // Only fetch run totals once the run is actually completed — the summary
  // block is gated on status === "completed" anyway, so an in-progress run
  // doesn't need the request.
  const runStatsQuery = useRunStats(code, run?.status === "completed");
  const userId = sessionQuery.data ?? null;
  const loading = runQuery.isPending || gamesQuery.isPending || sessionQuery.isPending;

  const [lastScorer, setLastScorer] = useState<string | null>(null);

  const isHost = !!userId && !!run && userId === run.hostId;
  const canManageRun = isHost && run?.status !== "completed";
  const activeGame = games.find((g) => g.status === "active" || g.status === "pending") ?? null;
  const completedGames = games.filter((g) => g.status === "completed");

  const runId = run?.id ?? null;
  useLobbyRealtime(runId, code, activeGame?.id ?? null, setLastScorer);

  // Clear last scorer when active game changes or disappears.
  useEffect(() => {
    return () => setLastScorer(null);
  }, [activeGame?.id]);

  return (
    <>
      <SessionTopbar
        run={run}
        loading={loading}
        exitHref={!loading && userId !== null ? "/dashboard" : undefined}
        showEndRun={canManageRun}
        liveGameWarning={!!activeGame}
        badge={activeGame ? (
          <div className="flex items-center gap-[5px] font-display text-[12px] font-bold tracking-[0.1em] uppercase text-accent bg-accent-glow border border-border-accent px-2.5 py-1 rounded-[4px]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-live-pulse flex-shrink-0" />
            Live
          </div>
        ) : undefined}
      />

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">

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

        {/* HOST — NO ACTIVE GAME: Start Game prompt */}
        {!loading && !activeGame && canManageRun && (
          <div
            className="mx-5 mt-4 bg-bg-surface border border-dashed border-border rounded-lg px-4 py-5 flex flex-col items-center gap-1 text-center animate-fade-up"
            style={{ animationDelay: "0.06s" }}
          >
            <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
              No game in progress
            </span>
            <span className="font-body text-[12px] text-text-muted mb-3">
              {completedGames.length > 0
                ? `${completedGames.length} ${completedGames.length === 1 ? "game" : "games"} played`
                : "Queue is ready"}
            </span>
            <Link
              href={`/runs/${code}/team-assignment`}
              className="w-full h-[52px] rounded-md bg-accent text-bg font-display text-[16px] font-extrabold tracking-[0.1em] uppercase flex items-center justify-center gap-2 transition-colors hover:bg-[#d4f545] active:scale-[0.98]"
            >
              <Play className="w-4 h-4" strokeWidth={2.5} />
              Start Game
            </Link>
          </div>
        )}

        {/* LIVE CARD — shown when there is an active game */}
        {activeGame && (
          <div
            className="mx-5 mt-4 bg-bg-surface border border-border-accent rounded-lg overflow-hidden cursor-pointer transition-[border-color] hover:border-accent-dim animate-fade-up"
            style={{ animationDelay: "0.06s" }}
            onClick={() => !isHost && router.push(`/runs/${code}/game`)}
          >
            <div className="h-[3px] bg-accent w-full" />

            <div className="px-4 pt-3.5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
                  Game {activeGame.gameNumber} · In progress
                </span>
                {activeGame.timeLimitSeconds !== null && (
                  <span className="font-display text-[14px] font-black tracking-[0.06em] text-accent leading-none">
                    {activeGame.clockStartedAt ? formatTime(getRemainingTime(activeGame)) : "—"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 mb-3">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
                    Runs
                  </span>
                  <span
                    className="font-display font-black leading-[0.88] tracking-[-0.02em] text-text-primary select-none"
                    style={{ fontSize: "clamp(52px, 14vw, 72px)" }}
                  >
                    {activeGame.scoreA}
                  </span>
                  <span className="font-display text-[11px] font-semibold tracking-[0.08em] uppercase text-text-muted">
                    to {activeGame.scoreGoal}
                  </span>
                </div>

                <span className="font-display text-[22px] font-black text-text-muted tracking-[-0.04em] pb-2.5">
                  —
                </span>

                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
                    Next
                  </span>
                  <span
                    className="font-display font-black leading-[0.88] tracking-[-0.02em] text-text-primary select-none"
                    style={{ fontSize: "clamp(52px, 14vw, 72px)" }}
                  >
                    {activeGame.scoreB}
                  </span>
                  <span className="font-display text-[11px] font-semibold tracking-[0.08em] uppercase text-text-muted">
                    to {activeGame.scoreGoal}
                  </span>
                </div>
              </div>

              <div className="h-[3px] bg-bg-hover rounded-sm flex gap-0.5">
                <div
                  className="h-full rounded-l-sm bg-accent"
                  style={{ width: `calc(${activeGame.scoreA} / ${activeGame.scoreGoal} * 47%)` }}
                />
                <div
                  className="h-full rounded-r-sm bg-text-secondary"
                  style={{ width: `calc(${activeGame.scoreB} / ${activeGame.scoreGoal} * 47%)` }}
                />
              </div>

              {/* Role-based action */}
              {isHost ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); router.push(`/runs/${code}/game`); }}
                  className="w-full h-10 mt-3 rounded-sm border border-accent bg-accent-glow text-accent font-display text-[13px] font-extrabold tracking-[0.12em] uppercase flex items-center justify-center gap-1.5 transition-colors hover:bg-[rgba(200,241,53,0.22)] active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Manage Game
                </button>
              ) : (
                <div className="flex items-center gap-1.5 mt-2.5">
                  <div className="w-[5px] h-[5px] rounded-full flex-shrink-0 bg-accent" />
                  <span className="font-display text-[12px] font-semibold tracking-[0.04em] text-text-muted flex-1">
                    {lastScorer ? `${lastScorer} scored` : "Live now"}
                  </span>
                  <span className="font-display text-[11px] font-semibold tracking-[0.08em] uppercase text-text-muted">
                    Tap to watch →
                  </span>
                </div>
              )}
            </div>
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
                    {winnerLabel(game.winner)}
                  </span>
                  <span className="font-display text-[11px] font-semibold tracking-[0.06em] uppercase text-text-muted">
                    {gameDuration(game.startedAt, game.endedAt)}
                  </span>
                </div>
                <span className="font-display text-[22px] font-black tracking-[-0.01em] text-text-secondary flex-shrink-0 leading-none relative z-10">
                  {game.scoreA}–{game.scoreB}
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
