"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SessionTopbar } from "@/components/ui/session-topbar";
import { useQueueRealtime } from "@/hooks/use-queue-realtime";
import {
  useQueue,
  useUpdateQueuePaidMutation,
  type QueueData,
  type QueueEntry,
} from "@/hooks/use-queue";
import { useRun } from "@/hooks/use-run";
import { useSessionUser } from "@/hooks/use-session";

const EMPTY_QUEUE: QueueData = { onCourt: [], waiting: [] };

export default function PaymentPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const runQuery = useRun(code);
  const queueQuery = useQueue(code);
  const sessionQuery = useSessionUser();

  const run = runQuery.data ?? null;
  const queue = queueQuery.data ?? EMPTY_QUEUE;
  const userId = sessionQuery.data ?? null;
  const loading = runQuery.isPending || queueQuery.isPending || sessionQuery.isPending;

  const isHost = !!userId && !!run && userId === run.hostId;

  // Payment is host-only. Anyone else who deep-links to this URL is bounced to
  // the lobby — replace so back doesn't loop them straight back here.
  useEffect(() => {
    if (loading) return;
    if (!isHost) router.replace(`/runs/${code}/lobby`);
  }, [loading, isHost, router, code]);

  const [mutating, setMutating] = useState<Set<string>>(new Set());
  const lastTapRef = useRef<Record<string, number>>({});

  const invalidateQueue = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["queue", code] });
  }, [queryClient, code]);

  useQueueRealtime(run?.id ?? null, invalidateQueue);

  const paidMutation = useUpdateQueuePaidMutation(code);

  const allPlayers = [...queue.onCourt, ...queue.waiting];
  const paidCount = allPlayers.filter((e) => e.paid).length;

  async function setPaid(entryId: string, paid: boolean) {
    setMutating((prev) => new Set(prev).add(entryId));
    try {
      await paidMutation.mutateAsync({ entryId, paid });
    } catch {
      // optimistic rollback + realtime/invalidation resync handle this
    } finally {
      setMutating((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }
  }

  function handleTap(entry: QueueEntry) {
    if (!isHost) return;
    if (mutating.has(entry.id)) return;
    const now = Date.now();
    if (!entry.paid) {
      lastTapRef.current[entry.id] = 0;
      void setPaid(entry.id, true);
    } else {
      const last = lastTapRef.current[entry.id] ?? 0;
      if (now - last < 400) {
        lastTapRef.current[entry.id] = 0;
        void setPaid(entry.id, false);
      } else {
        lastTapRef.current[entry.id] = now;
      }
    }
  }

  return (
    <>
      <SessionTopbar run={run} loading={loading} backHref={`/runs/${code}/lobby`} showEndRun={isHost && run?.status !== "completed"} liveGameWarning={queue.onCourt.length > 0} />

      {/* STATS STRIP */}
      {!loading && isHost && (
        <div
          className="bg-bg-surface border border-border rounded-md mx-5 mt-3.5 flex animate-fade-up"
          style={{ animationDelay: "0.04s" }}
        >
          {[
            { label: "Paid", value: paidCount, accent: true },
            { label: "Players", value: allPlayers.length, accent: false },
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

      {/* PLAYER LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
        {!loading && isHost && (
          <div
            className="px-5 pt-5 flex flex-col gap-1.5 animate-fade-up"
            style={{ animationDelay: "0.08s" }}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="font-display text-[12px] font-bold tracking-[0.14em] uppercase text-text-muted">
                Players
              </span>
              <span className="font-display text-[10px] font-bold tracking-[0.08em] uppercase text-text-muted">
                Tap to mark paid · Double-tap to undo
              </span>
            </div>

            {allPlayers.length > 0 ? (
              allPlayers.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => handleTap(entry)}
                  className={`w-full rounded-md px-3.5 py-3 flex items-center gap-3 transition-all active:scale-[0.98] border touch-manipulation ${
                    entry.paid
                      ? "bg-success-glow border-success-border"
                      : "bg-bg-surface border-border"
                  }`}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <span
                    className={`font-display text-[16px] font-extrabold uppercase flex-1 truncate tracking-[0.02em] transition-colors text-left ${
                      entry.paid ? "text-success" : "text-text-primary"
                    }`}
                  >
                    {entry.displayName}
                  </span>
                  {entry.paid && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-success flex-shrink-0"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="px-5 py-6 bg-bg-surface border border-dashed border-border rounded-md flex flex-col items-center gap-1.5 text-center">
                <span className="font-display text-[13px] font-bold tracking-[0.08em] uppercase text-text-muted">
                  No players yet
                </span>
                <span className="font-body text-[12px] text-text-muted">
                  Players will appear here once they join
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
