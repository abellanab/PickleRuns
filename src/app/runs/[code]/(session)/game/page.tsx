"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { HostTag } from "@/components/ui/host-tag";
import { SessionTopbar } from "@/components/ui/session-topbar";
import { useGameRealtime } from "@/hooks/use-game-realtime";
import {
  useEndGameMutation,
  useGameDetails,
  useGames,
  useScoreMutation,
  useUndoScoreMutation,
  type PlayerData,
} from "@/hooks/use-game";
import { useCourts } from "@/hooks/use-courts";
import { useRun } from "@/hooks/use-run";
import { useSessionUser } from "@/hooks/use-session";

type Side = "team_a" | "team_b";

const SIDE_LABEL: Record<Side, string> = { team_a: "Side A", team_b: "Side B" };

export default function GamePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameIdOverride = searchParams.get("gameId");
  const fromLobby = searchParams.get("from") === "lobby";

  const runQuery = useRun(code);
  const gamesQuery = useGames(code);
  const sessionQuery = useSessionUser();

  const run = runQuery.data ?? null;
  const userId = sessionQuery.data ?? null;

  const games = gamesQuery.data;
  const currentGameId = useMemo(() => {
    if (!games) return null;
    if (gameIdOverride && games.some((g) => g.id === gameIdOverride)) return gameIdOverride;
    const current =
      games.find((g) => g.status === "active") ??
      games.find((g) => g.status === "pending") ??
      games[0] ??
      null;
    return current?.id ?? null;
  }, [games, gameIdOverride]);

  const detailsQuery = useGameDetails(code, currentGameId);
  const details = detailsQuery.data ?? null;

  const [showEndSheet, setShowEndSheet] = useState(false);

  const scoreMutation = useScoreMutation(code, currentGameId ?? "");
  const undoMutation = useUndoScoreMutation(code, currentGameId ?? "");
  const endGameMutation = useEndGameMutation(code, currentGameId ?? "");

  const submitting = scoreMutation.isPending || undoMutation.isPending;

  useGameRealtime(code, currentGameId);

  const isQueueOnly = run?.runMode === "queue_only";

  useEffect(() => {
    if (isQueueOnly) router.replace(`/runs/${code}/lobby`);
  }, [isQueueOnly, code, router]);

  const courts = useCourts(code).data?.courts ?? [];
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pillsRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [currentGameId, courts.length]);

  function openCourtGame(gameId: string) {
    const params = new URLSearchParams({ gameId });
    if (fromLobby) params.set("from", "lobby");
    router.replace(`/runs/${code}/game?${params.toString()}`);
  }

  const loading =
    runQuery.isPending ||
    gamesQuery.isPending ||
    sessionQuery.isPending ||
    (!!currentGameId && detailsQuery.isPending);

  const isHost = !!userId && !!run && userId === run.hostId;
  const toLobby = isHost || fromLobby;
  const homeHref = toLobby ? `/runs/${code}/lobby` : `/runs/${code}/join`;
  const homeLabel = toLobby ? "Back to lobby" : "Back to my status";
  const game = details?.game ?? null;
  const isCompleted = game?.status === "completed";
  const canScore = isHost && !!game && !isCompleted;

  const sideA = details?.players.filter((p) => p.team === "team_a") ?? [];
  const sideB = details?.players.filter((p) => p.team === "team_b") ?? [];
  const lastEvent = details?.recentEvents[0] ?? null;

  function score(queueEntryId: string) {
    if (!canScore || submitting) return;
    scoreMutation.mutate({ queueEntryId });
  }

  function undo() {
    if (!canScore || submitting || !lastEvent) return;
    undoMutation.mutate();
  }

  function endMatch(winner?: Side) {
    endGameMutation.mutate(winner ? { winner } : undefined, {
      onSuccess: () => setShowEndSheet(false),
    });
  }

  if (loading || isQueueOnly) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <SessionTopbar run={null} loading={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="font-display text-[13px] font-bold tracking-[0.1em] uppercase text-text-muted animate-pulse">
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (!details || !game) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <SessionTopbar run={run} loading={false} backHref={homeHref} />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5">
          <span className="font-display text-[14px] font-bold tracking-[0.1em] uppercase text-text-muted text-center">
            No active game
          </span>
          <Link
            href={homeHref}
            className="min-h-[48px] px-6 flex items-center justify-center bg-accent text-bg font-display font-black tracking-[0.1em] uppercase text-[14px] rounded-md active:scale-[0.98]"
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    );
  }

  const currentCourt = courts.find((c) => c.game?.id === game.id) ?? null;
  const isLevel = game.scoreA === game.scoreB;
  const leader: Side = game.scoreA > game.scoreB ? "team_a" : "team_b";
  const winByTwo = run?.winByTwo ?? false;
  const scoreGoal = game.scoreGoal;
  const endError = endGameMutation.isError ? endGameMutation.error.message : null;
  const scoreError = scoreMutation.isError
    ? scoreMutation.error.message
    : undoMutation.isError
      ? undoMutation.error.message
      : null;

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <SessionTopbar
        run={run}
        loading={false}
        backHref={homeHref}
        badge={
          <span className="font-display text-[12px] font-bold tracking-[0.1em] uppercase text-accent bg-accent-glow border border-border-accent px-2.5 py-1 rounded-[4px]">
            {currentCourt ? `Court ${currentCourt.number} · Game ${game.gameNumber}` : `Game ${game.gameNumber}`}
          </span>
        }
      />

      {courts.length > 1 && (
        <div
          ref={pillsRef}
          className="flex gap-2 overflow-x-auto snap-x px-5 py-2 flex-shrink-0 custom-scrollbar"
        >
          {courts.map((court) => {
            const live = court.game;
            const active = !!live && live.id === game.id;
            const base =
              "snap-center flex-shrink-0 min-h-[44px] px-4 rounded-md border flex items-center gap-2 font-display text-[12px] font-extrabold tracking-[0.08em] uppercase whitespace-nowrap";
            const label = court.name ?? `Court ${court.number}`;
            if (!live) {
              return (
                <span
                  key={court.id}
                  aria-disabled="true"
                  className={`${base} border-border bg-bg-surface text-text-muted opacity-60`}
                >
                  {label}
                  <span className="text-[10px] font-semibold">Open</span>
                </span>
              );
            }
            return (
              <button
                key={court.id}
                type="button"
                data-active={active}
                aria-current={active ? "true" : undefined}
                onClick={() => openCourtGame(live.id)}
                className={`${base} active:scale-[0.97] ${
                  active
                    ? "border-border-accent bg-accent-glow text-accent"
                    : "border-border bg-bg-surface text-text-secondary"
                }`}
              >
                {label}
                <span className="text-[11px] tabular-nums">
                  {live.scoreA}–{live.scoreB}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="px-5 mt-1">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center py-2 gap-2">
            <ScoreColumn
              label="Side A"
              value={game.scoreA}
              won={isCompleted && game.winner === "team_a"}
            />
            <span className="font-display text-[32px] font-black text-text-muted leading-none tracking-[-0.04em] pt-3">
              —
            </span>
            <ScoreColumn
              label="Side B"
              value={game.scoreB}
              won={isCompleted && game.winner === "team_b"}
            />
          </div>
          <p className="text-center font-display text-[12px] font-semibold tracking-[0.08em] uppercase text-text-muted">
            First to {scoreGoal}
            {winByTwo ? ", win by 2" : ""}
          </p>
        </div>

        {isCompleted && (
          <div className="mx-5 mt-4 rounded-md border border-border-accent bg-accent-glow px-4 py-4 flex flex-col items-center gap-3">
            <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
              Match over
            </span>
            <span className="font-display text-[26px] font-black tracking-[0.02em] uppercase text-accent leading-none">
              {game.winner ? `${SIDE_LABEL[game.winner]} wins` : "Final"}
            </span>
            <Link
              href={homeHref}
              className="w-full min-h-[48px] rounded-md bg-accent text-bg font-display text-[14px] font-extrabold tracking-[0.1em] uppercase flex items-center justify-center active:scale-[0.98]"
            >
              {homeLabel}
            </Link>
          </div>
        )}

        <div className="px-5 mt-4 pb-4 flex flex-col gap-4">
          <SidePanel
            label="Side A"
            players={sideA}
            canScore={canScore}
            disabled={submitting}
            won={isCompleted && game.winner === "team_a"}
            onScore={score}
          />
          <SidePanel
            label="Side B"
            players={sideB}
            canScore={canScore}
            disabled={submitting}
            won={isCompleted && game.winner === "team_b"}
            onScore={score}
          />
        </div>

        {scoreError && (
          <p className="px-5 pb-3 font-display text-[12px] font-bold text-warning text-center">
            {scoreError}
          </p>
        )}
      </div>

      {canScore && (
        <div className="bottom-bar flex-col !items-stretch gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={submitting || !lastEvent}
            className="w-full min-h-[48px] px-4 flex items-center justify-center gap-2 rounded-md border border-border bg-bg-surface text-text-secondary font-display text-[13px] font-bold tracking-[0.08em] uppercase active:bg-bg-hover disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {lastEvent ? `Undo · ${lastEvent.displayName}` : "Undo"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowEndSheet(true)}
            className="w-full min-h-[48px] rounded-md border border-danger bg-danger/[0.08] text-[#ff6060] font-display text-[13px] font-black tracking-[0.1em] uppercase active:bg-danger/[0.16]"
          >
            End match
          </button>
        </div>
      )}

      {showEndSheet && canScore && (
        <>
          <div
            className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm"
            onClick={() => setShowEndSheet(false)}
          />
          <div className="fixed inset-0 z-[111] flex items-center justify-center px-5">
            <div className="w-full max-w-[320px] bg-bg-raised border border-border rounded-xl p-6 flex flex-col gap-5 animate-slide-up">
              <div className="flex flex-col gap-1.5">
                <span className="font-display text-[16px] font-black tracking-[0.06em] uppercase text-text-primary">
                  {isLevel ? "Who won?" : "End this match?"}
                </span>
                <span className="font-body text-[13px] text-text-secondary leading-[1.5]">
                  {isLevel
                    ? "The score is level. Pick the winning side."
                    : `${SIDE_LABEL[leader]} leads`}{" "}
                  <strong className="text-text-primary">
                    {game.scoreA} – {game.scoreB}
                  </strong>
                </span>
              </div>

              {isLevel ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {(["team_a", "team_b"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => endMatch(side)}
                      disabled={endGameMutation.isPending}
                      className="min-h-[56px] rounded-md border border-border-accent bg-accent-glow text-accent font-display text-[14px] font-black tracking-[0.08em] uppercase active:scale-[0.97] disabled:opacity-40"
                    >
                      {SIDE_LABEL[side]}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => endMatch(leader)}
                  disabled={endGameMutation.isPending}
                  className="min-h-[48px] rounded-md border border-danger bg-danger/[0.08] text-[#ff6060] font-display text-[13px] font-black tracking-[0.1em] uppercase active:bg-danger/[0.16] disabled:opacity-40"
                >
                  {endGameMutation.isPending ? "Ending…" : "End match"}
                </button>
              )}

              {endError && (
                <p className="font-display text-[12px] font-bold text-warning text-center">
                  {endError}
                </p>
              )}

              <button
                type="button"
                onClick={() => setShowEndSheet(false)}
                className="min-h-[44px] rounded-md border border-border bg-bg-surface text-text-secondary font-display text-[13px] font-bold tracking-[0.08em] uppercase active:bg-bg-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ScoreColumn({ label, value, won }: { label: string; value: number; won: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
        {label}
      </span>
      <span
        className={`font-display font-black leading-[0.88] tracking-[-0.02em] select-none tabular-nums ${
          won ? "text-accent" : "text-text-primary"
        }`}
        style={{ fontSize: "clamp(80px, 24vw, 150px)" }}
      >
        {value}
      </span>
    </div>
  );
}

function SidePanel({
  label,
  players,
  canScore,
  disabled,
  won,
  onScore,
}: {
  label: string;
  players: PlayerData[];
  canScore: boolean;
  disabled: boolean;
  won: boolean;
  onScore: (queueEntryId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`font-display text-[11px] font-black tracking-[0.14em] uppercase border-b pb-1 ${
          won ? "text-accent border-border-accent" : "text-text-muted border-border"
        }`}
      >
        {label}
      </div>
      {players.map((player) => {
        const content = (
          <>
            <span className="flex items-center gap-2.5 min-w-0">
              <Avatar name={player.displayName} src={player.avatarUrl} size="sm" host={player.isHost} />
              <span className="font-display text-[18px] font-black tracking-[0.03em] uppercase text-text-primary leading-none truncate text-left">
                {player.displayName}
              </span>
              {player.isHost && <HostTag />}
            </span>
            <span className="flex items-baseline gap-1.5 flex-shrink-0">
              <span className="font-display text-[24px] font-black leading-none text-accent tabular-nums">
                {player.points}
              </span>
              <span className="font-display text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted">
                pts
              </span>
            </span>
          </>
        );
        const base =
          "w-full min-h-[72px] bg-bg-surface border rounded-md px-4 flex items-center justify-between gap-3 select-none";
        return canScore ? (
          <button
            key={player.queueEntryId}
            type="button"
            onClick={() => onScore(player.queueEntryId)}
            disabled={disabled}
            className={`${base} border-border-accent transition-transform duration-[80ms] active:scale-[0.97] active:bg-accent-glow disabled:opacity-60`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {content}
          </button>
        ) : (
          <div key={player.queueEntryId} className={`${base} border-border`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
