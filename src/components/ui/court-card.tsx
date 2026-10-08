"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { HostTag } from "@/components/ui/host-tag";
import { Button } from "@/components/ui/button";
import type { CourtLastGame, CourtPlayer, CourtState, FillProposal } from "@/hooks/use-courts";
import type { RunWire } from "@/types/api";

type Winner = "team_a" | "team_b";

interface CourtCardProps {
  code: string;
  court: CourtState;
  runMode: RunWire["runMode"];
  isHost: boolean;
  canRemove: boolean;
  proposal: FillProposal | null;
  askWinner: boolean;
  endPending: boolean;
  endError: string | null;
  startPending: boolean;
  startError: string | null;
  removePending: boolean;
  removeError: string | null;
  scoreError: string | null;
  undoPending: boolean;
  onScorePlayer: (entryId: string) => void;
  onUndo: () => void;
  onEndTap: () => void;
  onPickWinner: (winner: Winner) => void;
  onCancelWinner: () => void;
  onStart: () => void;
  onRemove: () => void;
}

const labelClass =
  "font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted";
const errorClass = "font-display text-[12px] font-bold text-warning text-center";
const primaryLinkClass =
  "min-h-[48px] rounded-md bg-accent text-bg font-display text-[14px] font-extrabold tracking-[0.1em] uppercase flex items-center justify-center active:scale-[0.98]";

function names(players: CourtPlayer[]) {
  return players.map((p) => p.displayName).join(" + ");
}

export function CourtCard({
  code,
  court,
  runMode,
  isHost,
  canRemove,
  proposal,
  askWinner,
  endPending,
  endError,
  startPending,
  startError,
  removePending,
  removeError,
  scoreError,
  undoPending,
  onScorePlayer,
  onUndo,
  onEndTap,
  onPickWinner,
  onCancelWinner,
  onStart,
  onRemove,
}: CourtCardProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const game = court.game;
  const title = court.name ?? `Court ${court.number}`;
  const showScore = runMode !== "queue_only";
  const isQueueMode = runMode !== "score_only";
  const canTapScore = isHost && showScore;
  const assignHref = `/runs/${code}/courts/${court.id}/assign`;

  return (
    <div
      className={`bg-bg-surface rounded-lg overflow-hidden border ${game ? "border-border-accent" : "border-border"}`}
    >
      {game && <div className="h-[3px] bg-accent w-full" />}
      <div className="px-4 pt-3.5 pb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className={labelClass}>{title}</span>
          {game ? (
            <span className="flex items-center gap-1.5 font-display text-[11px] font-bold tracking-[0.1em] uppercase text-[#3ddc84]">
              <span className="w-[7px] h-[7px] rounded-full bg-[#3ddc84] animate-live-pulse" />
              Live
            </span>
          ) : (
            <span className="font-display text-[11px] font-bold tracking-[0.1em] uppercase text-text-muted">
              Open
            </span>
          )}
        </div>

        {game ? (
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <SideBlock label="Side A" players={game.sideA} />
              <div className="flex flex-col items-center gap-1">
                {showScore ? (
                  <>
                    <span className="font-display text-[30px] font-black tabular-nums text-text-primary leading-none whitespace-nowrap">
                      {game.scoreA} – {game.scoreB}
                    </span>
                    <span className={labelClass}>to {game.scoreGoal}</span>
                  </>
                ) : (
                  <span className={labelClass}>In play</span>
                )}
              </div>
              <SideBlock label="Side B" players={game.sideB} align="right" />
            </div>

            {canTapScore && !askWinner && (
              <div className="grid grid-cols-2 gap-2">
                <ScoreColumn label="Side A" players={game.sideA} onScore={onScorePlayer} />
                <ScoreColumn label="Side B" players={game.sideB} onScore={onScorePlayer} />
              </div>
            )}

            {isHost && !askWinner && (
              <div className={`grid gap-2 ${showScore ? "grid-cols-3" : "grid-cols-1"}`}>
                {showScore && (
                  <Link
                    href={`/runs/${code}/game?gameId=${game.id}`}
                    className="min-h-[44px] rounded-md border border-border-accent bg-accent-glow text-accent font-display text-[13px] font-extrabold tracking-[0.12em] uppercase flex items-center justify-center active:scale-[0.98]"
                  >
                    Scoreboard
                  </Link>
                )}
                {showScore && (
                  <Button
                    variant="secondary"
                    onClick={onUndo}
                    disabled={undoPending}
                    aria-label={`Undo last point on Court ${court.number}`}
                    className="w-full min-h-[44px]"
                  >
                    Undo
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={onEndTap}
                  disabled={endPending}
                  className="w-full min-h-[44px]"
                >
                  {endPending ? "Ending…" : "End match"}
                </Button>
              </div>
            )}

            {isHost && askWinner && (
              <div className="flex flex-col gap-2">
                <span className={`${labelClass} text-center`}>Who won?</span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="primary"
                    onClick={() => onPickWinner("team_a")}
                    disabled={endPending}
                    className="min-h-[44px] text-[13px]"
                  >
                    Side A won
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => onPickWinner("team_b")}
                    disabled={endPending}
                    className="min-h-[44px] text-[13px]"
                  >
                    Side B won
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={onCancelWinner}
                  className="min-h-[44px] font-display text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted active:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            )}

            {scoreError && <p className={errorClass}>{scoreError}</p>}
            {endError && <p className={errorClass}>{endError}</p>}
          </>
        ) : (
          <>
            {court.lastGame ? (
              <LastMatch last={court.lastGame} showScore={showScore} />
            ) : (
              <span className="font-body text-[13px] text-text-muted">No match in progress</span>
            )}

            {isQueueMode && (
              <FillOffer
                proposal={proposal}
                isHost={isHost}
                assignHref={assignHref}
                startPending={startPending}
                onStart={onStart}
              />
            )}

            {isHost && !isQueueMode && (
              <Link href={assignHref} className={primaryLinkClass}>
                Set up match
              </Link>
            )}

            {startError && <p className={errorClass}>{startError}</p>}

            {isHost && canRemove && !confirmRemove && (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="min-h-[44px] font-display text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted active:text-danger"
              >
                Remove court
              </button>
            )}

            {isHost && confirmRemove && (
              <div className="flex flex-col gap-2">
                <span className="font-display text-[12px] font-bold text-text-secondary text-center">
                  Remove {title}?
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmRemove(false)}
                    className="min-h-[44px] text-[13px]"
                  >
                    Keep
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      onRemove();
                      setConfirmRemove(false);
                    }}
                    disabled={removePending}
                    className="min-h-[44px] text-[13px]"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {removeError && <p className={errorClass}>{removeError}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function RosterRow({ label, players }: { label: string; players: CourtPlayer[] }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className={`${labelClass} min-w-[52px] flex-shrink-0`}>{label}</span>
      {players.length > 0 ? (
        <div className="flex items-center gap-x-2 min-w-0">
          {players.map((p, i) => (
            <span key={p.entryId} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <span className="font-display text-[13px] text-text-muted">+</span>}
              <Avatar name={p.displayName} src={p.avatarUrl} size="sm" host={p.isHost} />
              <span className="font-display text-[13px] font-extrabold uppercase tracking-[0.03em] text-text-primary truncate">
                {p.displayName}
              </span>
              {p.isHost && <HostTag />}
            </span>
          ))}
        </div>
      ) : (
        <span className="font-body text-[13px] text-text-muted">—</span>
      )}
    </div>
  );
}

function FillOffer({
  proposal,
  isHost,
  assignHref,
  startPending,
  onStart,
}: {
  proposal: FillProposal | null;
  isHost: boolean;
  assignHref: string;
  startPending: boolean;
  onStart: () => void;
}) {
  const hasPlayers = !!proposal && proposal.sideA.length + proposal.sideB.length > 0;

  if (!proposal || !hasPlayers) {
    return <span className="font-body text-[13px] text-text-muted">Waiting for players</span>;
  }

  const roster = (
    <div className="rounded-md border border-border bg-bg-hover px-3 py-2.5 flex flex-col gap-1.5">
      <span className={labelClass}>Next up on this court</span>
      <RosterRow label="Side A" players={proposal.sideA} />
      <RosterRow label="Side B" players={proposal.sideB} />
    </div>
  );

  if (!isHost) return roster;

  return (
    <div className="flex flex-col gap-2.5">
      {roster}

      {proposal.needed === 0 ? (
        <>
          <Button
            variant="primary"
            size="lg"
            onClick={onStart}
            disabled={startPending}
            className="w-full min-h-[48px]"
          >
            {startPending ? "Starting…" : "Start match"}
          </Button>
          <Link
            href={assignHref}
            className="min-h-[44px] font-display text-[12px] font-bold uppercase tracking-[0.08em] text-text-secondary flex items-center justify-center active:text-text-primary"
          >
            Swap players
          </Link>
        </>
      ) : (
        <>
          <span className="font-display text-[12px] font-bold text-warning text-center">
            Need {proposal.needed} more
          </span>
          <Link href={assignHref} className={primaryLinkClass}>
            Fill court
          </Link>
        </>
      )}
    </div>
  );
}

function LastMatch({ last, showScore }: { last: CourtLastGame; showScore: boolean }) {
  const winnerLabel = last.winner === "team_a" ? "Side A won" : last.winner === "team_b" ? "Side B won" : "Ended";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display text-[12px] font-bold text-text-secondary">
        Last match: {winnerLabel}
        {showScore ? ` ${last.scoreA}–${last.scoreB}` : ""}
      </span>
      <span className="font-body text-[12px] text-text-muted">
        {names(last.sideA)} vs {names(last.sideB)}
      </span>
    </div>
  );
}

function ScoreColumn({
  label,
  players,
  onScore,
}: {
  label: string;
  players: CourtPlayer[];
  onScore: (entryId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className={labelClass}>{label}</span>
      {players.map((p) => (
        <button
          key={p.entryId}
          type="button"
          onClick={() => onScore(p.entryId)}
          aria-label={`Score a point for ${p.displayName}`}
          className="min-h-[48px] w-full rounded-md border border-border bg-bg-hover px-3 flex items-center justify-between gap-2 font-display text-[13px] font-extrabold uppercase tracking-[0.03em] text-text-primary select-none touch-manipulation motion-safe:transition motion-safe:duration-150 active:scale-[0.97] active:brightness-125 active:ring-2 active:ring-accent"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Avatar name={p.displayName} src={p.avatarUrl} size="sm" host={p.isHost} />
            <span className="truncate">{p.displayName}</span>
            {p.isHost && <HostTag />}
          </span>
          <span className="text-[11px] text-accent flex-shrink-0">+1</span>
        </button>
      ))}
    </div>
  );
}

function SideBlock({
  label,
  players,
  align = "left",
}: {
  label: string;
  players: CourtPlayer[];
  align?: "left" | "right";
}) {
  return (
    <div className={`flex flex-col gap-0.5 min-w-0 ${align === "right" ? "items-end text-right" : ""}`}>
      <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-text-muted">
        {label}
      </span>
      {players.map((p) => (
        <span
          key={p.entryId}
          className={`flex items-center gap-1.5 min-w-0 max-w-full ${align === "right" ? "justify-end" : ""}`}
        >
          <Avatar name={p.displayName} src={p.avatarUrl} size="sm" host={p.isHost} />
          <span className="font-display text-[13px] font-extrabold uppercase tracking-[0.03em] text-text-primary truncate">
            {p.displayName}
          </span>
          {p.isHost && <HostTag />}
        </span>
      ))}
    </div>
  );
}
