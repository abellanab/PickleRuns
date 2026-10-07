import type { PlayerData } from "@/hooks/use-game";

type GameBreakdownProps = {
  players: PlayerData[];
  scoreA: number;
  scoreB: number;
  winner: "team_a" | "team_b" | null;
};

export function winnerText(winner: "team_a" | "team_b" | null): string {
  if (winner === "team_a") return "Side A won";
  if (winner === "team_b") return "Side B won";
  return "—";
}

export function GameBreakdown({ players, scoreA, scoreB, winner }: GameBreakdownProps) {
  const teamA = players
    .filter((p) => p.team === "team_a")
    .sort((a, b) => b.points - a.points);
  const teamB = players
    .filter((p) => p.team === "team_b")
    .sort((a, b) => b.points - a.points);

  const isTeamAWinner = winner === "team_a";
  const isTeamBWinner = winner === "team_b";

  return (
    <>
      <div className="flex items-center px-5 pt-5 pb-2.5">
        <span className="font-display text-[12px] font-bold tracking-[0.14em] uppercase text-text-muted">Breakdown</span>
      </div>

      <div className="px-5 grid grid-cols-2 gap-2.5">

        <div className="flex flex-col gap-[5px]">
          <div className={`flex items-center justify-between pb-1.5 mb-0.5 border-b font-display text-[11px] font-extrabold tracking-[0.14em] uppercase ${isTeamAWinner ? "text-accent-dim border-border-accent" : "text-text-muted border-border"}`}>
            Side A
            <span className={`text-[13px] font-black ${isTeamAWinner ? "text-accent" : "text-text-muted"}`}>
              {scoreA}
            </span>
          </div>
          {teamA.map((player, i) => (
            <div
              key={player.queueEntryId}
              className={`bg-bg-surface border rounded-md px-2.5 h-9 flex items-center justify-between gap-1.5 ${i === 0 && player.points > 0 ? "border-border-accent" : "border-border"}`}
            >
              <span className="font-display text-[13px] font-extrabold tracking-[0.03em] uppercase text-text-primary leading-none flex-1 truncate min-w-0">
                {player.displayName}
              </span>
              <span className={`font-display font-black tracking-[-0.01em] leading-none flex-shrink-0 ${i === 0 && player.points > 0 ? "text-[20px] text-accent" : player.points === 0 ? "text-[16px] text-text-muted" : "text-[20px] text-text-muted"}`}>
                {player.points}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[5px]">
          <div className={`flex items-center justify-between pb-1.5 mb-0.5 border-b font-display text-[11px] font-extrabold tracking-[0.14em] uppercase ${isTeamBWinner ? "text-accent-dim border-border-accent" : "text-text-muted border-border"}`}>
            Side B
            <span className={`text-[13px] font-black ${isTeamBWinner ? "text-accent" : "text-text-muted"}`}>
              {scoreB}
            </span>
          </div>
          {teamB.map((player, i) => (
            <div
              key={player.queueEntryId}
              className={`bg-bg-surface border rounded-md px-2.5 h-9 flex items-center justify-between gap-1.5 ${i === 0 && player.points > 0 ? "border-border-accent" : "border-border"}`}
            >
              <span className="font-display text-[13px] font-extrabold tracking-[0.03em] uppercase text-text-primary leading-none flex-1 truncate min-w-0">
                {player.displayName}
              </span>
              <span className={`font-display font-black tracking-[-0.01em] leading-none flex-shrink-0 ${i === 0 && player.points > 0 ? "text-[20px] text-accent" : player.points === 0 ? "text-[16px] text-text-muted" : "text-[20px] text-text-muted"}`}>
                {player.points}
              </span>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
