import Link from "next/link";
import type { CourtGame, CourtPlayer } from "@/hooks/use-courts";

interface LiveScoreRowProps {
  courtNumber: number;
  game: CourtGame;
  href: string;
  showScores: boolean;
}

const names = (players: CourtPlayer[]) => players.map((p) => p.displayName).join(" + ");

export function LiveScoreRow({ courtNumber, game, href, showScores }: LiveScoreRowProps) {
  return (
    <Link
      href={href}
      className="block min-h-[44px] rounded-md border border-border bg-bg-surface px-3.5 py-3 active:bg-bg-hover"
    >
      <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-accent">
        Court {courtNumber}
      </span>
      <div className="mt-1.5 flex flex-col gap-1">
        <SideLine label="Side A" players={game.sideA} score={showScores ? game.scoreA : null} />
        <SideLine label="Side B" players={game.sideB} score={showScores ? game.scoreB : null} />
      </div>
    </Link>
  );
}

function SideLine({
  label,
  players,
  score,
}: {
  label: string;
  players: CourtPlayer[];
  score: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex items-baseline gap-2">
        <span className="font-display text-[10px] font-bold tracking-[0.12em] uppercase text-text-muted flex-shrink-0">
          {label}
        </span>
        <span className="font-display text-[14px] font-black tracking-[0.03em] uppercase text-text-primary truncate">
          {names(players)}
        </span>
      </div>
      {score !== null && (
        <span className="font-display text-[22px] font-black leading-none text-accent tabular-nums flex-shrink-0">
          {score}
        </span>
      )}
    </div>
  );
}
