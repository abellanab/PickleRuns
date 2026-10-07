"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/topbar";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useCourts, useFillProposal } from "@/hooks/use-courts";
import { useStartMatchMutation } from "@/hooks/use-game";
import { useAddQueueEntryMutation, useQueue } from "@/hooks/use-queue";
import { useRun } from "@/hooks/use-run";
import { useSessionUser } from "@/hooks/use-session";
import {
  MAX_PER_SIDE,
  useCourtAssignmentStore,
  type SlotSide,
} from "@/stores/court-assignment.store";

const LABEL = "font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted";

const ERROR_BY_CODE: Record<string, string> = {
  PLAYER_UNAVAILABLE: "A selected player is no longer available. Refresh the pool and try again.",
  COURT_OCCUPIED: "This court already has a match in progress.",
  INVALID_ROSTER: "That roster isn't valid. Each side needs 1 or 2 players.",
};

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return ERROR_BY_CODE[err.code] ?? err.message;
  return fallback;
}

export default function CourtAssignPage() {
  const { code, courtId } = useParams<{ code: string; courtId: string }>();
  const router = useRouter();

  const runQuery = useRun(code);
  const sessionQuery = useSessionUser();
  const queueQuery = useQueue(code);
  const courtsQuery = useCourts(code);

  const run = runQuery.data ?? null;
  const userId = sessionQuery.data ?? null;
  const isHost = !!userId && !!run && userId === run.hostId;
  const isQueueMode = run?.runMode !== "score_only";
  const courtNumber = courtsQuery.data?.courts.find((c) => c.id === courtId)?.number ?? null;

  const proposalQuery = useFillProposal(code, courtId, isHost);
  const startMutation = useStartMatchMutation(code);
  const addMutation = useAddQueueEntryMutation(code, "host_add");

  const sideA = useCourtAssignmentStore((s) => s.sideA);
  const sideB = useCourtAssignmentStore((s) => s.sideB);
  const selected = useCourtAssignmentStore((s) => s.selected);
  const init = useCourtAssignmentStore((s) => s.init);
  const select = useCourtAssignmentStore((s) => s.select);
  const swapOrPlace = useCourtAssignmentStore((s) => s.swapOrPlace);
  const remove = useCourtAssignmentStore((s) => s.remove);
  const reset = useCourtAssignmentStore((s) => s.reset);

  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    reset();
    return reset;
  }, [reset, courtId]);

  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !isHost) return;
    if (proposalQuery.isPending) return;
    seededRef.current = true;
    init(courtId, proposalQuery.data ?? { sideA: [], sideB: [], needed: 4 });
  }, [isHost, proposalQuery.isPending, proposalQuery.data, courtId, init]);

  const names = new Map<string, string>();
  for (const e of queueQuery.data?.waiting ?? []) names.set(e.id, e.displayName);
  for (const p of [...(proposalQuery.data?.sideA ?? []), ...(proposalQuery.data?.sideB ?? [])]) {
    names.set(p.entryId, p.displayName);
  }

  const drafted = new Set([...sideA, ...sideB]);
  const pool = (queueQuery.data?.waiting ?? []).filter(
    (e) => e.status === "waiting" && !drafted.has(e.id),
  );

  const count = sideA.length + sideB.length;
  const canStart = count >= 2 && sideA.length >= 1 && sideB.length >= 1;
  const startLabel =
    startMutation.isPending
      ? "Starting…"
      : count === 4
        ? "Start match"
        : count >= 2
          ? `Start short-handed (${count} players)`
          : "Start match";

  function onTapSlot(side: "A" | "B", entryId: string | null) {
    if (selected) swapOrPlace({ side, entryId });
    else if (entryId) select({ side, entryId });
  }

  function onTapPool(entryId: string) {
    if (selected) swapOrPlace({ side: "pool", entryId });
    else select({ side: "pool", entryId });
  }

  async function handleStart() {
    if (!canStart || startMutation.isPending) return;
    setFormError(null);
    try {
      await startMutation.mutateAsync({ courtId, sideA, sideB });
      reset();
      router.push(`/runs/${code}/lobby`);
    } catch (e) {
      setFormError(errorMessage(e, "Couldn't start the match. Please try again."));
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || addMutation.isPending) return;
    setAddError(null);
    try {
      await addMutation.mutateAsync(name);
      setNewName("");
    } catch (err) {
      setAddError(errorMessage(err, "Couldn't add that player. Please try again."));
    }
  }

  const loading = runQuery.isPending || sessionQuery.isPending || queueQuery.isPending;

  if (loading) {
    return (
      <div className="app-shell">
        <Topbar label="Court" title="…" onBack={() => router.back()} />
      </div>
    );
  }

  const title = courtNumber !== null ? `Court ${courtNumber}` : "Court";

  if (!isHost) {
    const nextUp = courtsQuery.data?.nextUp ?? [];
    return (
      <div className="app-shell">
        <Topbar label={run?.name ?? "Run"} title={title} onBack={() => router.back()} />
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
          <span className={LABEL}>Next up</span>
          {nextUp.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-5 text-center font-body text-[13px] text-text-muted">
              Nobody is waiting
            </div>
          ) : (
            nextUp.map((p, i) => (
              <div
                key={p.entryId}
                className="min-h-[48px] rounded-md border border-border bg-bg-surface px-3 flex items-center gap-3"
              >
                <span className="font-display text-[12px] font-black tabular-nums text-text-muted w-4">
                  {i + 1}
                </span>
                <span className="font-display text-[14px] font-extrabold uppercase tracking-[0.03em] text-text-primary truncate">
                  {p.displayName}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  const selectedName = selected ? names.get(selected.entryId) ?? null : null;

  return (
    <div className="app-shell">
      <Topbar
        label={run?.name ?? "Run"}
        title={title}
        onBack={() => router.back()}
        badge={
          isQueueMode && run ? (
            <span className="font-display text-[11px] font-bold tracking-[0.1em] uppercase text-accent bg-accent-glow border border-border-accent px-2.5 py-1 rounded-[4px]">
              {run.rotationStyle === "winner_stays" ? "Winner stays" : "Rotate all - winners first, pairs kept"}
            </span>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <SideCard
            label="Side A"
            side="A"
            ids={sideA}
            names={names}
            selectedId={selected?.entryId ?? null}
            armed={!!selected}
            onTap={onTapSlot}
          />
          <SideCard
            label="Side B"
            side="B"
            ids={sideB}
            names={names}
            selectedId={selected?.entryId ?? null}
            armed={!!selected}
            onTap={onTapSlot}
          />
        </div>

        {selected && (
          <div className="rounded-md border border-border-accent bg-accent-glow px-3 py-2 flex items-center gap-2">
            <span className="font-display text-[12px] font-bold uppercase tracking-[0.06em] text-accent flex-1 truncate">
              {selectedName ?? "Player"} selected. Tap a slot or player.
            </span>
            {selected.side !== "pool" && (
              <button
                type="button"
                onClick={() => remove(selected.entryId)}
                className="min-h-[44px] px-3 font-display text-[12px] font-bold uppercase tracking-[0.08em] text-text-secondary active:text-text-primary"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={() => select(null)}
              className="min-h-[44px] px-3 font-display text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted active:text-text-primary"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={LABEL}>Waiting</span>
            <span className={LABEL}>{pool.length}</span>
          </div>
          {pool.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-4 text-center font-body text-[13px] text-text-muted">
              No one else is waiting
            </div>
          ) : (
            pool.map((e) => {
              const isSelected = selected?.entryId === e.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onTapPool(e.id)}
                  className={cn(
                    "min-h-[48px] w-full rounded-md border px-3 flex items-center gap-3 text-left transition-colors active:scale-[0.99]",
                    isSelected
                      ? "border-border-accent bg-accent-glow text-accent"
                      : "border-border bg-bg-surface text-text-primary",
                  )}
                >
                  <span className="font-display text-[14px] font-extrabold uppercase tracking-[0.03em] flex-1 truncate">
                    {e.displayName}
                  </span>
                  <span className="font-display text-[11px] font-semibold tracking-[0.06em] text-text-muted flex-shrink-0">
                    {e.gamesPlayed} {e.gamesPlayed === 1 ? "game" : "games"}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <form onSubmit={handleAdd} className="flex flex-col gap-2">
          <span className={LABEL}>Add player</span>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Player name"
              maxLength={40}
              autoComplete="off"
              className="flex-1 min-w-0 min-h-[48px] rounded-md border border-border bg-bg-surface px-3 font-body text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-accent"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={!newName.trim() || addMutation.isPending}
              className="min-h-[48px] px-4"
            >
              {addMutation.isPending ? "Adding…" : "Add"}
            </Button>
          </div>
          {addError && (
            <p className="font-display text-[12px] font-bold tracking-[0.04em] text-warning">
              {addError}
            </p>
          )}
        </form>
      </div>

      <div className="px-4 py-4 border-t border-border flex flex-col gap-2">
        {formError && (
          <p className="font-display text-[12px] font-bold tracking-[0.04em] text-warning text-center">
            {formError}
          </p>
        )}
        <Button
          variant="primary"
          size="lg"
          onClick={handleStart}
          disabled={!canStart || startMutation.isPending}
          className="w-full min-h-[52px]"
        >
          {startLabel}
        </Button>
      </div>
    </div>
  );
}

interface SideCardProps {
  label: string;
  side: Exclude<SlotSide, "pool">;
  ids: string[];
  names: Map<string, string>;
  selectedId: string | null;
  armed: boolean;
  onTap: (side: "A" | "B", entryId: string | null) => void;
}

function SideCard({ label, side, ids, names, selectedId, armed, onTap }: SideCardProps) {
  return (
    <div className="rounded-md border border-border bg-bg-surface p-3 flex flex-col gap-2">
      <span className={LABEL}>{label}</span>
      {Array.from({ length: MAX_PER_SIDE }).map((_, i) => {
        const entryId = ids[i] ?? null;
        const isSelected = entryId !== null && entryId === selectedId;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onTap(side, entryId)}
            disabled={entryId === null && !armed}
            className={cn(
              "min-h-[56px] w-full rounded-md border px-3 flex items-center text-left transition-colors active:scale-[0.98]",
              isSelected
                ? "border-border-accent bg-accent-glow text-accent"
                : entryId
                  ? "border-border bg-bg-hover text-text-primary"
                  : cn(
                      "border-dashed border-border text-text-muted",
                      armed && "border-border-accent",
                    ),
            )}
          >
            <span
              className={cn(
                "truncate",
                entryId
                  ? "font-display text-[14px] font-extrabold uppercase tracking-[0.03em]"
                  : "font-body text-[13px]",
              )}
            >
              {entryId ? names.get(entryId) ?? "Player" : "Empty"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
