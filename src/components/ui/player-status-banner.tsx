import type { CourtState } from "@/hooks/use-courts";
import type { QueueData } from "@/hooks/use-queue";

interface PlayerStatusBannerProps {
  entryId: string | null;
  queue: QueueData | undefined;
  courts: CourtState[];
}

const labelClass =
  "font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted";

export function PlayerStatusBanner({ entryId, queue, courts }: PlayerStatusBannerProps) {
  if (!entryId || !queue) return null;

  const onCourtEntry = queue.onCourt.find((e) => e.id === entryId);
  if (onCourtEntry) {
    const court = courts.find((c) => c.number === onCourtEntry.courtNumber);
    const sideA = court?.game?.sideA ?? [];
    const sideB = court?.game?.sideB ?? [];
    const mine = sideA.some((p) => p.entryId === entryId) ? sideA : sideB;
    const theirs = mine === sideA ? sideB : sideA;
    const partners = mine.filter((p) => p.entryId !== entryId).map((p) => p.displayName);
    const opponents = theirs.map((p) => p.displayName);

    return (
      <Banner accent title={`You're on Court ${onCourtEntry.courtNumber ?? ""}`.trim()}>
        {partners.length > 0 && <Detail label="With" value={partners.join(" + ")} />}
        {opponents.length > 0 && <Detail label="Against" value={opponents.join(" + ")} />}
      </Banner>
    );
  }

  const entry = queue.waiting.find((e) => e.id === entryId);
  if (!entry) return null;

  if (entry.status === "marked_out") {
    return <Banner title="You're marked out" />;
  }

  if (entry.status !== "waiting") return null;

  const waitingOnly = queue.waiting.filter((e) => e.status === "waiting");
  const index = waitingOnly.findIndex((e) => e.id === entryId);
  if (index === -1) return null;
  const k = index + 1;

  return (
    <Banner accent={k <= 4} title={`You're #${k} in the queue`}>
      {k <= 4 && (
        <span className="font-display text-[12px] font-extrabold tracking-[0.12em] uppercase text-accent">
          Up next
        </span>
      )}
      {k > 1 && <span className="font-body text-[12px] text-text-muted">{k - 1} ahead</span>}
    </Banner>
  );
}

function Banner({
  title,
  accent = false,
  children,
}: {
  title: string;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-md border px-3.5 py-3 flex flex-col gap-1 ${
        accent ? "border-border-accent bg-accent-glow" : "border-border bg-bg-surface"
      }`}
    >
      <span
        className={`font-display text-[16px] font-black tracking-[0.04em] uppercase leading-tight ${
          accent ? "text-accent" : "text-text-primary"
        }`}
      >
        {title}
      </span>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <span className="font-body text-[12px] text-text-secondary">
      <span className={labelClass}>{label}</span> {value}
    </span>
  );
}
