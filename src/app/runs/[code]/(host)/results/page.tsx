"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Home } from "lucide-react";
import { SessionTopbar } from "@/components/ui/session-topbar";
import { GameBreakdown, winnerText } from "@/components/ui/game-breakdown";
import { useRun } from "@/hooks/use-run";
import { useGameDetails } from "@/hooks/use-game";
import { useQueue } from "@/hooks/use-queue";
import { useSessionUser } from "@/hooks/use-session";

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="app-shell h-dvh overflow-hidden">
          <SessionTopbar run={null} loading={true} />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = searchParams.get("gameId");

  const runQuery = useRun(code);
  const sessionQuery = useSessionUser();
  const detailsQuery = useGameDetails(code, gameId);
  const queueQuery = useQueue(code);

  const run = runQuery.data ?? null;
  const userId = sessionQuery.data ?? null;
  const details = detailsQuery.data ?? null;
  const queue = queueQuery.data ?? null;

  const loading =
    runQuery.isPending ||
    sessionQuery.isPending ||
    (!!gameId && detailsQuery.isPending) ||
    queueQuery.isPending;

  const [upNextExpanded, setUpNextExpanded] = useState(false);

  const game = details?.game ?? null;
  const teamA = useMemo(
    () =>
      (details?.players ?? [])
        .filter((p) => p.team === "team_a")
        .sort((a, b) => b.points - a.points),
    [details],
  );
  const teamB = useMemo(
    () =>
      (details?.players ?? [])
        .filter((p) => p.team === "team_b")
        .sort((a, b) => b.points - a.points),
    [details],
  );

  const isTeamAWinner = game?.winner === "team_a";
  const isTeamBWinner = game?.winner === "team_b";
  const totalPoints = (game?.scoreA ?? 0) + (game?.scoreB ?? 0);

  const upNextCount = run?.rotationStyle === "winner_stays" ? 5 : 10;
  const waitingEntries = useMemo(
    () => (queue?.waiting ?? []).filter((e) => e.status === "waiting"),
    [queue],
  );
  const upNext = useMemo(
    () => waitingEntries.slice(0, upNextCount),
    [waitingEntries, upNextCount],
  );
  const topScorer = useMemo(
    () => [...teamA, ...teamB].sort((a, b) => b.points - a.points)[0] ?? null,
    [teamA, teamB],
  );
  const upNextMeasureRef = useRef<HTMLDivElement | null>(null);
  const [visibleNameCount, setVisibleNameCount] = useState(upNextCount);

  // The collapsed pill shows as many full names as fit on one row; the +N
  // badge counts the rest of the capped up-next group, so N always matches
  // what expanding will reveal.
  useLayoutEffect(() => {
    const measure = upNextMeasureRef.current;
    if (!measure) return;
    const container = measure.parentElement;
    if (!container) return;
    const compute = () => {
      let used = 0;
      let count = 0;
      for (const child of Array.from(measure.children) as HTMLElement[]) {
        used += child.offsetWidth;
        if (used > container.clientWidth) break;
        count++;
      }
      setVisibleNameCount(Math.max(1, count));
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(container);
    return () => observer.disconnect();
  }, [upNext, upNextExpanded]);

  const hiddenCount = Math.max(0, upNext.length - visibleNameCount);
  const upNextMid = Math.ceil(upNext.length / 2);
  const upNextColumns = [upNext.slice(0, upNextMid), upNext.slice(upNextMid)];

  const isHost = !!userId && !!run && userId === run.hostId;

  const detailsError = detailsQuery.isError;

  useEffect(() => {
    if (loading) return;
    if (!gameId || detailsError) {
      router.replace(`/runs/${code}/lobby`);
      return;
    }
    if (game && game.status !== "completed") {
      router.replace(`/runs/${code}/game`);
    }
  }, [loading, gameId, detailsError, game, code, router]);

  function handleNextGame() {
    router.push(`/runs/${code}/lobby`);
  }

  const redirecting =
    !gameId || detailsError || (!!game && game.status !== "completed");

  if (loading || redirecting) {
    return (
      <div className="app-shell h-dvh overflow-hidden">
        <SessionTopbar run={null} loading={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="font-display text-[13px] font-bold tracking-[0.1em] uppercase text-text-muted animate-pulse">
            Loading…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell h-dvh overflow-hidden">
      <SessionTopbar
        run={run}
        loading={false}
        badge={game ? (
          <span className="font-display text-[12px] font-bold tracking-[0.1em] uppercase text-text-secondary bg-bg-surface border border-border px-2.5 py-1 rounded-[4px]">
            Game {game.gameNumber}
          </span>
        ) : undefined}
        showEndRun={isHost && run?.status !== "completed"}
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-4 [scrollbar-gutter:stable]">

        <div className="relative flex flex-col items-center gap-1 pt-6 pb-5 flex-shrink-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[260px] h-[140px] bg-accent-glow rounded-full blur-[48px] pointer-events-none" />
          <span className="relative font-display text-[11px] font-bold tracking-[0.16em] uppercase text-accent-dim">
            Winner
          </span>
          <span className="relative font-display text-[38px] font-black tracking-[0.02em] uppercase text-text-primary leading-none">
            {winnerText(game?.winner ?? null)}
          </span>
        </div>

        <div className="mx-5 bg-bg-surface border border-border rounded-lg px-5 py-4 relative overflow-hidden">
          <div className={`absolute top-0 bottom-0 w-[3px] bg-accent ${isTeamBWinner ? "right-0 rounded-r-sm" : "left-0 rounded-l-sm"}`} />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex flex-col items-center gap-0.5">
              <span className={`font-display text-[11px] font-bold tracking-[0.14em] uppercase ${isTeamAWinner ? "text-accent-dim" : "text-text-muted"}`}>
                Side A
              </span>
              <span
                className={`font-display font-black leading-[0.9] tracking-[-0.02em] ${isTeamAWinner ? "text-text-primary" : "text-text-secondary"}`}
                style={{ fontSize: "clamp(56px, 14vw, 80px)" }}
              >
                {game?.scoreA ?? 0}
              </span>
            </div>
            <span className="font-display text-[24px] font-black text-text-muted tracking-[-0.04em] pb-2">—</span>
            <div className="flex flex-col items-center gap-0.5">
              <span className={`font-display text-[11px] font-bold tracking-[0.14em] uppercase ${isTeamBWinner ? "text-accent-dim" : "text-text-muted"}`}>
                Side B
              </span>
              <span
                className={`font-display font-black leading-[0.9] tracking-[-0.02em] ${isTeamBWinner ? "text-text-primary" : "text-text-secondary"}`}
                style={{ fontSize: "clamp(56px, 14vw, 80px)" }}
              >
                {game?.scoreB ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-2.5 mx-5">
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

        <GameBreakdown
          players={details?.players ?? []}
          scoreA={game?.scoreA ?? 0}
          scoreB={game?.scoreB ?? 0}
          winner={game?.winner ?? null}
        />

        {upNext.length > 0 && (
          <div className="px-5 mt-4">
            <button
              type="button"
              onClick={() => setUpNextExpanded((v) => !v)}
              className="w-full bg-bg-surface border border-border rounded-md px-3.5 py-2.5 min-h-[44px] text-left transition-colors active:bg-bg-hover"
            >
              {upNextExpanded ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2.5">
                    <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-text-muted flex-shrink-0">
                      Up next
                    </span>
                    <ChevronUp className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                  </div>
                  <div className="flex gap-3 pt-1">
                    {upNextColumns.map((column, ci) => (
                      <div key={ci} className="flex-1 min-w-0 flex flex-col">
                        {column.map((entry, i) => (
                          <div key={entry.id} className="flex items-center gap-2 py-1.5 min-w-0">
                            <span className="font-display text-[11px] font-black text-text-muted w-4 text-right flex-shrink-0">
                              {ci * upNextMid + i + 1}
                            </span>
                            <span className="font-display text-[13px] font-bold tracking-[0.04em] uppercase text-text-secondary truncate">
                              {entry.displayName}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-text-muted flex-shrink-0">
                    Up next
                  </span>
                  <div className="relative flex-1 min-w-0 overflow-hidden">
                    <span className="block font-display text-[13px] font-bold tracking-[0.04em] uppercase text-text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
                      {upNext.slice(0, visibleNameCount).map((e) => e.displayName).join(", ")}
                    </span>
                    <div ref={upNextMeasureRef} aria-hidden className="invisible absolute top-0 left-0 flex w-max whitespace-nowrap">
                      {upNext.map((e, i) => (
                        <span key={e.id} className="font-display text-[13px] font-bold tracking-[0.04em] uppercase">
                          {e.displayName}{i < upNext.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  {hiddenCount > 0 && (
                    <span className="font-display text-[11px] font-bold tracking-[0.08em] uppercase text-text-muted flex-shrink-0">
                      +{hiddenCount}
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                </div>
              )}
            </button>
          </div>
        )}

        <div className="h-6" />
      </div>

      {isHost && (
        <div className="bottom-bar">
          <button
            type="button"
            onClick={() => router.push(`/runs/${code}/lobby`)}
            title="Lobby"
            className="w-[52px] h-[52px] flex-shrink-0 flex items-center justify-center rounded-md border border-border bg-bg-surface text-text-secondary transition-all hover:border-text-muted hover:text-text-primary active:scale-[0.97]"
          >
            <Home className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextGame}
            className="flex-1 h-[52px] rounded-md bg-accent text-bg font-display text-[16px] font-extrabold tracking-[0.1em] uppercase flex items-center justify-center transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            Next Game
          </button>
        </div>
      )}
    </div>
  );
}
