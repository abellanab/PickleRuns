"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCourts, type CourtGame } from "@/hooks/use-courts";
import { useQueue } from "@/hooks/use-queue";
import { useRun } from "@/hooks/use-run";
import { useRunRealtime } from "@/hooks/use-run-realtime";
import { LiveScoreRow } from "@/components/ui/live-score-row";
import { getQueueNumber } from "@/components/ui/player-status-banner";

interface PlayerLiveViewProps {
  runCode: string;
  runName: string;
  entryId: string;
  displayName: string | null;
  onEntryGone: () => void;
}

const labelClass =
  "font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted";

export function PlayerLiveView({
  runCode,
  runName,
  entryId,
  displayName,
  onEntryGone,
}: PlayerLiveViewProps) {
  const router = useRouter();
  const runQuery = useRun(runCode);
  const queueQuery = useQueue(runCode);
  const courtsQuery = useCourts(runCode);
  const run = runQuery.data;
  useRunRealtime(run?.id ?? null, runCode);

  const queue = queueQuery.data;
  const courts = courtsQuery.data?.courts;
  const isScoreMode = run?.runMode === "score_only" || run?.runMode === "score_and_queue";

  const myCourtEntry = queue?.onCourt.find((e) => e.id === entryId) ?? null;
  const myGame = courts?.find((c) => c.number === myCourtEntry?.courtNumber)?.game ?? null;
  const myWaiting = queue?.waiting.find((e) => e.id === entryId) ?? null;

  const redirectedRef = useRef(false);
  useEffect(() => {
    if (!myCourtEntry) {
      redirectedRef.current = false;
      return;
    }
    if (!isScoreMode || !myGame || redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace(`/runs/${runCode}/game?gameId=${myGame.id}`);
  }, [myCourtEntry, isScoreMode, myGame, runCode, router]);

  // A stale cached queue may predate the join; only trust a settled fetch.
  const entryGone =
    queueQuery.isSuccess && !queueQuery.isFetching && !myCourtEntry && !myWaiting;
  useEffect(() => {
    if (entryGone) onEntryGone();
  }, [entryGone, onEntryGone]);

  if (!run || !queue || !courts || entryGone) {
    return (
      <div className="app-shell px-5">
        <div className="pt-10 flex flex-col items-center gap-4">
          <div className="h-4 w-32 bg-bg-surface rounded-md animate-pulse" />
          <div className="h-24 w-40 bg-bg-surface rounded-md animate-pulse" />
          <div className="h-4 w-28 bg-bg-surface rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  const liveGames = courts.flatMap((c) => (c.game ? [{ number: c.number, game: c.game }] : []));
  const waitingEntries = queue.waiting.filter((e) => e.status !== "removed");
  const showScores = run.runMode !== "queue_only";
  const showQueue = run.runMode !== "score_only";
  const name = displayName ?? myCourtEntry?.displayName ?? myWaiting?.displayName ?? null;

  let waitingNumber = 0;

  return (
    <div className="app-shell px-5 pb-10">
      <div className="pt-10 flex items-center justify-between animate-fade-up">
        <span className="font-display text-[11px] font-bold tracking-[0.16em] uppercase text-text-muted">
          {runName}
        </span>
        <span className="font-display text-[11px] font-bold tracking-[0.16em] uppercase text-accent">
          You&apos;re in
        </span>
      </div>

      {myCourtEntry ? (
        <OnCourtPanel
          courtNumber={myCourtEntry.courtNumber}
          partners={namesOf(myGame, entryId, "partners")}
          opponents={namesOf(myGame, entryId, "opponents")}
        />
      ) : (
        <Hero
          number={getQueueNumber(queue, entryId)}
          markedOut={myWaiting?.status === "marked_out"}
        />
      )}

      {name && (
        <div className="w-full border-t border-border pt-4 flex items-center justify-center gap-2">
          <span className={labelClass}>Playing as</span>
          <span className="font-display text-[13px] font-black tracking-[0.08em] uppercase text-text-primary">
            {name}
          </span>
        </div>
      )}

      {liveGames.length > 0 && (
        <section className="mt-8 flex flex-col gap-2">
          <h2 className={labelClass}>Live games</h2>
          {liveGames.map(({ number, game }) => (
            <LiveScoreRow
              key={game.id}
              courtNumber={number}
              game={game}
              showScores={showScores}
              href={`/runs/${runCode}/game?gameId=${game.id}`}
            />
          ))}
        </section>
      )}

      {showQueue && (
        <section className="mt-8 flex flex-col gap-2">
          <h2 className={labelClass}>Queue</h2>
          {waitingEntries.length === 0 ? (
            <p className="font-body text-[13px] text-text-muted">Nobody is waiting.</p>
          ) : (
            waitingEntries.map((e) => {
              const isMarkedOut = e.status === "marked_out";
              if (!isMarkedOut) waitingNumber += 1;
              const mine = e.id === entryId;
              return (
                <div
                  key={e.id}
                  className={cn(
                    "min-h-[44px] rounded-md border px-3.5 flex items-center gap-3",
                    mine ? "border-border-accent bg-accent-glow" : "border-border bg-bg-surface",
                    isMarkedOut && "opacity-60"
                  )}
                >
                  {!isMarkedOut && (
                    <span
                      className={cn(
                        "w-9 flex-shrink-0 font-display text-[16px] font-black tabular-nums",
                        mine ? "text-accent" : "text-text-secondary"
                      )}
                    >
                      #{waitingNumber}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 font-display text-[14px] font-black tracking-[0.03em] uppercase text-text-primary truncate">
                    {e.displayName}
                  </span>
                  {isMarkedOut && (
                    <span className="font-display text-[10px] font-bold tracking-[0.12em] uppercase text-text-muted">
                      Marked out
                    </span>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}

      <div className="mt-8 grid grid-cols-2 gap-2.5">
        <FooterLink href={`/runs/${runCode}/lobby`}>All courts</FooterLink>
        <FooterLink href={`/runs/${runCode}/queue`}>Queue</FooterLink>
      </div>
    </div>
  );
}

function namesOf(
  game: CourtGame | null,
  entryId: string,
  which: "partners" | "opponents"
): string[] {
  if (!game) return [];
  const mine = game.sideA.some((p) => p.entryId === entryId) ? game.sideA : game.sideB;
  const theirs = mine === game.sideA ? game.sideB : game.sideA;
  return which === "partners"
    ? mine.filter((p) => p.entryId !== entryId).map((p) => p.displayName)
    : theirs.map((p) => p.displayName);
}

function Hero({ number, markedOut }: { number: number | null; markedOut: boolean }) {
  if (markedOut || number === null) {
    return (
      <div className="py-10 flex flex-col items-center justify-center">
        <span className="font-display text-[32px] font-black tracking-[0.04em] uppercase text-text-secondary leading-none">
          Marked out
        </span>
      </div>
    );
  }

  const upNext = number <= 4;
  const ahead = number - 1;

  return (
    <div className="py-10 flex flex-col items-center justify-center">
      <span className={cn(labelClass, "tracking-[0.2em] mb-3 animate-fade-up")}>
        Your number
      </span>
      <div className="relative flex items-center justify-center animate-fade-up">
        <div className="absolute w-56 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <span
          className={cn(
            "relative font-display text-[96px] font-black tracking-[-0.02em] leading-none",
            upNext ? "text-accent" : "text-text-primary"
          )}
        >
          #{number}
        </span>
      </div>
      <span
        className={cn(
          "font-display text-[16px] font-black tracking-[0.08em] uppercase leading-none mt-3 animate-fade-up",
          upNext ? "text-accent" : "text-text-secondary"
        )}
      >
        {upNext ? "Up next" : `${ahead} ${ahead === 1 ? "player" : "players"} ahead`}
      </span>
    </div>
  );
}

function OnCourtPanel({
  courtNumber,
  partners,
  opponents,
}: {
  courtNumber: number | null;
  partners: string[];
  opponents: string[];
}) {
  return (
    <div className="my-10 rounded-md border border-border-accent bg-accent-glow px-4 py-6 flex flex-col items-center gap-3 text-center">
      <span className="font-display text-[28px] font-black tracking-[0.04em] uppercase text-accent leading-tight">
        {`You're on Court ${courtNumber ?? ""}`.trim()}
      </span>
      {partners.length > 0 && <Detail label="With" value={partners.join(" + ")} />}
      {opponents.length > 0 && <Detail label="Against" value={opponents.join(" + ")} />}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <span className="font-body text-[14px] text-text-secondary">
      <span className={labelClass}>{label}</span> {value}
    </span>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="min-h-[44px] rounded-md border border-border bg-bg-surface text-text-secondary font-display text-[13px] font-bold tracking-[0.08em] uppercase flex items-center justify-center active:bg-bg-hover"
    >
      {children}
    </Link>
  );
}
