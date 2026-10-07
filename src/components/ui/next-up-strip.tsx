import type { CourtPlayer } from "@/hooks/use-courts";

interface NextUpStripProps {
  nextUp: CourtPlayer[];
  waitingCount: number;
}

function pair(players: CourtPlayer[]) {
  return players.map((p) => p.displayName).join(" + ");
}

export function NextUpStrip({ nextUp, waitingCount }: NextUpStripProps) {
  const sideA = nextUp.slice(0, 2);
  const sideB = nextUp.slice(2, 4);
  const needed = 4 - nextUp.length;
  const more = Math.max(0, waitingCount - nextUp.length);

  return (
    <div className="rounded-md border border-border bg-bg-surface px-3.5 py-3 flex flex-col gap-1.5">
      <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
        Next up
      </span>
      {nextUp.length === 0 ? (
        <span className="font-body text-[13px] text-text-muted">Nobody waiting</span>
      ) : needed > 0 ? (
        <>
          <span className="font-display text-[13px] font-extrabold uppercase tracking-[0.03em] text-text-primary">
            {pair(nextUp)}
          </span>
          <span className="font-display text-[12px] font-bold text-warning">Need {needed} more</span>
        </>
      ) : (
        <div className="flex flex-col gap-0.5">
          <span className="font-display text-[13px] font-extrabold uppercase tracking-[0.03em] text-text-primary">
            {pair(sideA)}
          </span>
          <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-text-muted">
            vs
          </span>
          <span className="font-display text-[13px] font-extrabold uppercase tracking-[0.03em] text-text-primary">
            {pair(sideB)}
          </span>
        </div>
      )}
      {more > 0 && (
        <span className="font-display text-[11px] font-semibold text-text-muted">+{more} more waiting</span>
      )}
    </div>
  );
}
