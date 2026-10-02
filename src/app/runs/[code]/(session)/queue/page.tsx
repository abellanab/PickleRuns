"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { Ban, MoreVertical, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SessionTopbar } from "@/components/ui/session-topbar";
import { useQueueRealtime } from "@/hooks/use-queue-realtime";
import {
  useAddQueueEntryMutation,
  useQueue,
  useUpdateQueueStatusMutation,
  type QueueData,
  type QueueEntry,
} from "@/hooks/use-queue";
import { useRun } from "@/hooks/use-run";
import { useSessionUser } from "@/hooks/use-session";

type CtxMenu = {
  entryId: string;
  status: "waiting" | "marked_out";
  top: number;
  right: number;
};

const EMPTY_QUEUE: QueueData = { onCourt: [], waiting: [] };

export default function QueuePage() {
  const { code } = useParams<{ code: string }>();
  const queryClient = useQueryClient();

  const runQuery = useRun(code);
  const queueQuery = useQueue(code);
  const sessionQuery = useSessionUser();

  const run = runQuery.data ?? null;
  const queue = queueQuery.data ?? EMPTY_QUEUE;
  const userId = sessionQuery.data ?? null;
  const loading = runQuery.isPending || queueQuery.isPending || sessionQuery.isPending;

  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addError, setAddError] = useState("");
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [mutating, setMutating] = useState<Set<string>>(new Set());

  const invalidateQueue = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["queue", code] });
  }, [queryClient, code]);

  useQueueRealtime(run?.id ?? null, invalidateQueue);

  const statusMutation = useUpdateQueueStatusMutation(code);
  const addPlayerMutation = useAddQueueEntryMutation(code);

  const adding = addPlayerMutation.isPending;

  const isHost = !!userId && !!run && userId === run.hostId;
  const canManageRun = isHost && run?.status !== "completed";

  const onCourtCount = queue.onCourt.length;
  const waitingCount = queue.waiting.filter((e) => e.status === "waiting").length;
  const totalCount = onCourtCount + queue.waiting.length;

  async function handleStatusUpdate(entryId: string, status: "waiting" | "marked_out" | "removed") {
    setMutating((prev) => new Set(prev).add(entryId));
    try {
      await statusMutation.mutateAsync({ entryId, status });
    } catch {
      // Realtime + invalidation will resync
    } finally {
      setMutating((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }
  }

  async function handleAddPlayer() {
    const name = addName.trim();
    if (!name || adding) return;
    setAddError("");
    try {
      await addPlayerMutation.mutateAsync(name);
    } catch {
      setAddError("Failed to add player. Try again.");
      return;
    }
    setAddName("");
    setShowAddForm(false);
  }

  function openCtxMenu(e: React.MouseEvent<HTMLButtonElement>, entry: QueueEntry) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setCtxMenu({
      entryId: entry.id,
      status: entry.status as "waiting" | "marked_out",
      top: Math.min(rect.bottom + 4, window.innerHeight - 120),
      right: window.innerWidth - rect.right,
    });
  }

  return (
    <>
      <SessionTopbar
        run={run}
        loading={loading}
        backHref={`/runs/${code}/lobby`}
        showEndRun={canManageRun}
        liveGameWarning={onCourtCount > 0}
        badge={onCourtCount > 0 ? (
          <div className="flex items-center gap-[5px] font-display text-[12px] font-bold tracking-[0.1em] uppercase text-accent bg-accent-glow border border-border-accent px-2.5 py-1 rounded-[4px]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-live-pulse flex-shrink-0" />
            {onCourtCount} on court
          </div>
        ) : undefined}
      />

      {/* STATS STRIP */}
      {!loading && (
        <div
          className="bg-bg-surface border border-border rounded-md mx-5 mt-3.5 flex animate-fade-up"
          style={{ animationDelay: "0.04s" }}
        >
          {[
            { label: "Waiting", value: waitingCount, accent: true },
            { label: "Players", value: totalCount, accent: false },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center gap-0.5 p-2.5 flex-1 ${i > 0 ? "border-l border-border" : ""}`}
            >
              <span
                className={`font-display text-[18px] font-black leading-none ${stat.accent ? "text-accent" : "text-text-primary"}`}
              >
                {stat.value}
              </span>
              <span className="font-display text-[10px] font-bold tracking-[0.1em] uppercase text-text-muted">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">

        {/* ON COURT SECTION */}
        {!loading && onCourtCount > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <span className="font-display text-[12px] font-bold tracking-[0.14em] uppercase text-text-muted">
                On Court
              </span>
              <span className="font-display text-[11px] font-bold tracking-[0.08em] uppercase text-accent bg-accent-glow border border-border-accent px-2 py-0.5 rounded-sm">
                {onCourtCount}
              </span>
            </div>
            <div className="px-5 flex flex-col gap-1.5">
              {queue.onCourt.map((entry, i) => (
                <div
                  key={entry.id}
                  className="bg-bg-surface border border-border-accent bg-[rgba(200,241,53,0.04)] rounded-md px-3 py-2.5 flex items-center gap-2.5"
                >
                  <span className="font-display text-[13px] font-extrabold text-accent-dim w-5 text-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-display text-[16px] font-extrabold uppercase text-text-primary flex-1 truncate tracking-[0.02em]">
                    {entry.displayName}
                  </span>
                  <span className="font-display text-[12px] font-semibold text-text-muted whitespace-nowrap">
                    {entry.gamesPlayed} {entry.gamesPlayed === 1 ? "game" : "games"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WAITING SECTION */}
        {!loading && (
          <div className="animate-fade-up" style={{ animationDelay: "0.12s" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <span className="font-display text-[12px] font-bold tracking-[0.14em] uppercase text-text-muted">
                Waiting
              </span>
              <span className="font-display text-[11px] font-bold tracking-[0.08em] uppercase text-text-muted bg-bg-hover border border-border px-2 py-0.5 rounded-sm">
                {waitingCount}
              </span>
            </div>

            {queue.waiting.length > 0 ? (
              <div className="px-5 flex flex-col gap-1.5">
                {queue.waiting.map((entry, i) => (
                  <div
                    key={entry.id}
                    className={`bg-bg-surface border border-border rounded-md px-3 py-2.5 flex items-center gap-2.5 transition-opacity ${entry.status === "marked_out" ? "opacity-45" : ""}`}
                  >
                    <span
                      className={`font-display text-[13px] font-extrabold w-5 text-center flex-shrink-0 ${entry.status === "marked_out" ? "text-text-muted" : "text-accent-dim"}`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`font-display text-[16px] font-extrabold uppercase text-text-primary flex-1 truncate tracking-[0.02em] ${entry.status === "marked_out" ? "line-through decoration-text-muted" : ""}`}
                    >
                      {entry.displayName}
                    </span>
                    <span className="font-display text-[12px] font-semibold text-text-muted whitespace-nowrap">
                      {entry.gamesPlayed} {entry.gamesPlayed === 1 ? "game" : "games"}
                    </span>
                    {canManageRun && !mutating.has(entry.id) && entry.status === "marked_out" && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(entry.id, "waiting")}
                        className="w-7 h-7 flex items-center justify-center rounded-sm border border-border bg-bg-hover text-text-muted transition-colors hover:border-accent hover:text-accent"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canManageRun && !mutating.has(entry.id) && (
                      <button
                        type="button"
                        onClick={(e) => openCtxMenu(e, entry)}
                        className="w-7 h-7 flex items-center justify-center rounded-sm border border-border bg-bg-hover text-text-muted transition-colors hover:border-text-muted hover:text-text-primary"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

              </div>
            ) : (
              <>
                  <div className="mx-5 mt-4 px-5 py-6 bg-bg-surface border border-dashed border-border rounded-md flex flex-col items-center gap-1.5 text-center">
                    <span className="font-display text-[13px] font-bold tracking-[0.08em] uppercase text-text-muted">
                      Queue is empty
                    </span>
                    <span className="font-body text-[12px] text-text-muted">
                      {isHost ? "Add players with the + button" : "Waiting for players to join"}
                    </span>
                  </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* FAB — host only */}
      {canManageRun && !showAddForm && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-[74px] right-[max(16px,calc(50vw-224px))] z-[90] w-14 h-14 rounded-full bg-accent text-bg flex items-center justify-center shadow-[0_4px_24px_rgba(200,241,53,0.35)] transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      )}

      {/* ADD PLAYER MODAL */}
      {showAddForm && canManageRun && (
        <>
          <div
            className="fixed inset-0 z-[98] bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowAddForm(false); setAddName(""); setAddError(""); }}
          />
          <div className="fixed inset-0 z-[99] flex items-center justify-center px-5">
            <div className="bg-bg-raised border border-border rounded-xl px-5 pt-5 pb-5 w-full max-w-[440px] animate-fade-up">
              <div className="flex items-center justify-between mb-5">
                <span className="font-display text-[16px] font-black tracking-[0.06em] uppercase text-text-primary">
                  Add Player
                </span>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setAddName(""); setAddError(""); }}
                  className="w-8 h-8 flex items-center justify-center rounded-sm border border-border bg-bg-surface text-text-muted transition-colors hover:border-text-muted hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-bg-surface border border-border rounded-md px-4 py-3 flex items-center gap-3 focus-within:border-border-accent transition-colors mb-4">
                <input
                  autoFocus
                  type="text"
                  value={addName}
                  onChange={(e) => { setAddName(e.target.value); setAddError(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddPlayer();
                    if (e.key === "Escape") { setShowAddForm(false); setAddName(""); }
                  }}
                  placeholder="Player name..."
                  maxLength={50}
                  className="flex-1 bg-transparent font-display text-[18px] font-bold uppercase text-text-primary placeholder:text-text-muted outline-none tracking-[0.02em]"
                />
                {addName && (
                  <button
                    type="button"
                    onClick={() => setAddName("")}
                    className="text-text-muted hover:text-text-secondary transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {addError && (
                <p className="font-body text-[13px] text-danger mb-3 animate-slide-in">{addError}</p>
              )}

              <button
                type="button"
                onClick={handleAddPlayer}
                disabled={adding || !addName.trim()}
                className="w-full h-12 rounded-md bg-accent text-bg font-display text-[15px] font-extrabold tracking-[0.1em] uppercase flex items-center justify-center gap-2 transition-colors hover:bg-[#d4f545] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Add to Queue
              </button>
            </div>
          </div>
        </>
      )}

      {/* CONTEXT MENU */}
      {ctxMenu !== null && (
        <>
          <div
            className="fixed inset-0 z-[99]"
            onClick={() => setCtxMenu(null)}
          />
          <div
            className="fixed z-[100] bg-bg-raised border border-border rounded-md p-1.5 min-w-[160px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-slide-in"
            style={{ top: ctxMenu.top, right: ctxMenu.right }}
          >
            {ctxMenu.status === "waiting" ? (
              <button
                type="button"
                onClick={() => {
                  const id = ctxMenu.entryId;
                  setCtxMenu(null);
                  handleStatusUpdate(id, "marked_out");
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-sm cursor-pointer font-display text-[13px] font-bold uppercase tracking-[0.04em] text-text-secondary hover:bg-bg-hover hover:text-text-primary w-full"
              >
                <Ban className="w-3.5 h-3.5 flex-shrink-0" />
                Mark Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const id = ctxMenu.entryId;
                  setCtxMenu(null);
                  handleStatusUpdate(id, "waiting");
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-sm cursor-pointer font-display text-[13px] font-bold uppercase tracking-[0.04em] text-accent hover:bg-bg-hover w-full"
              >
                <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
                Reinstate
              </button>
            )}
            <div className="h-px bg-border mx-1 my-1" />
            <button
              type="button"
              onClick={() => {
                const id = ctxMenu.entryId;
                setCtxMenu(null);
                handleStatusUpdate(id, "removed");
              }}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-sm cursor-pointer font-display text-[13px] font-bold uppercase tracking-[0.04em] text-danger hover:bg-danger-light hover:text-[#ff8080] w-full"
            >
              <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
              Remove
            </button>
          </div>
        </>
      )}
    </>
  );
}
