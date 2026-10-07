"use client";

import { useParams } from "next/navigation";
import { SessionTopbar } from "@/components/ui/session-topbar";
import { GameBreakdown, winnerText } from "@/components/ui/game-breakdown";
import { useGameDetails } from "@/hooks/use-game";
import { useRun } from "@/hooks/use-run";

export default function PastGamePage() {
  const { code, gameId } = useParams<{ code: string; gameId: string }>();

  const runQuery = useRun(code);
  const detailsQuery = useGameDetails(code, gameId ?? null);

  const run = runQuery.data ?? null;
  const details = detailsQuery.data ?? null;
  const loading = runQuery.isPending || detailsQuery.isPending;

  const game = details?.game ?? null;
  // details.players is already sorted leader-first by getGameWithDetails
  // (points DESC, displayName ASC), so the top scorer is always index 0.
  const players = details?.players ?? [];
  const winner = game?.winner ?? null;
  const winnerTextClass = winner !== null ? "text-accent" : "text-text-muted";
  const totalPoints = game ? game.scoreA + game.scoreB : 0;
  const topScorer = players[0] ?? null;

  return (
    <>
      <SessionTopbar
        run={run}
        loading={loading}
        backHref={`/runs/${code}/lobby`}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
        {!details ? (
          <div className="px-5 pt-6 font-display text-[12px] text-text-muted">
            {detailsQuery.isError ? "Couldn't load game." : "Loading…"}
          </div>
        ) : (
          <>
            {/* HEADER — game number + winner */}
            <div
              className="px-5 pt-3 pb-1 flex flex-col gap-0.5 animate-fade-up"
              style={{ animationDelay: "0.04s" }}
            >
              <span className="font-display text-[10px] font-bold tracking-[0.18em] uppercase text-text-muted">
                Game {game!.gameNumber}
              </span>
              <span
                className={`font-display text-[22px] font-black tracking-[0.02em] uppercase leading-none ${winnerTextClass}`}
              >
                {winnerText(winner)}
              </span>
            </div>

            {/* SCORE BLOCK — mirrors the live game's score layout */}
            <div
              className="mx-5 mt-4 bg-bg-surface border border-border rounded-lg overflow-hidden animate-fade-up"
              style={{ animationDelay: "0.08s" }}
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 px-4 py-5">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
                    Side A
                  </span>
                  <span
                    className="font-display font-black leading-[0.88] tracking-[-0.02em] text-text-primary select-none"
                    style={{ fontSize: "clamp(52px, 14vw, 72px)" }}
                  >
                    {game!.scoreA}
                  </span>
                </div>
                <span className="font-display text-[22px] font-black text-text-muted tracking-[-0.04em] pb-2.5">
                  —
                </span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
                    Side B
                  </span>
                  <span
                    className="font-display font-black leading-[0.88] tracking-[-0.02em] text-text-primary select-none"
                    style={{ fontSize: "clamp(52px, 14vw, 72px)" }}
                  >
                    {game!.scoreB}
                  </span>
                </div>
              </div>
              <div className="border-t border-border px-4 py-2.5 flex items-center justify-center gap-2">
                <span className="font-display text-[10px] font-bold tracking-[0.16em] uppercase text-text-muted">
                  Final
                </span>
                <span className="font-display text-[11px] font-semibold tracking-[0.08em] uppercase text-text-muted">
                  · to {game!.scoreGoal}
                </span>
              </div>
            </div>

            {/* STAT STRIP — total points + top scorer */}
            <div
              className="flex items-center justify-center gap-4 mt-2.5 mx-5 animate-fade-up"
              style={{ animationDelay: "0.12s" }}
            >
              <div className="flex flex-col items-center gap-px">
                <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-text-muted">Total Pts</span>
                <span className="font-display text-[18px] font-black tracking-[0.02em] text-text-secondary leading-none">{totalPoints}</span>
              </div>
              <div className="w-px h-6 bg-border flex-shrink-0" />
              <div className="flex flex-col items-center gap-px">
                <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-text-muted">Top Scorer</span>
                <span className="font-display text-[18px] font-black tracking-[0.02em] uppercase text-text-secondary leading-none truncate max-w-[90px]">
                  {topScorer?.displayName ?? "—"}
                </span>
              </div>
            </div>

            <div className="animate-fade-up" style={{ animationDelay: "0.16s" }}>
              <GameBreakdown
                players={players}
                scoreA={game!.scoreA}
                scoreB={game!.scoreB}
                winner={winner}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
