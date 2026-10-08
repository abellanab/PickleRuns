"use client";

import { useCallback, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PaymentQrCard } from "@/components/ui/payment-qr-card";
import { SessionTopbar } from "@/components/ui/session-topbar";
import {
  usePaymentQr,
  useRemovePaymentQrMutation,
  useUploadPaymentQrMutation,
} from "@/hooks/use-payment-qr";
import { useQueueRealtime } from "@/hooks/use-queue-realtime";
import {
  useQueue,
  useUpdateQueuePaidMutation,
  type QueueData,
  type QueueEntry,
} from "@/hooks/use-queue";
import { useRun } from "@/hooks/use-run";
import { useSessionUser } from "@/hooks/use-session";
import { ApiError } from "@/lib/api/client";
import { downscaleImage } from "@/lib/image";

const EMPTY_QUEUE: QueueData = { onCourt: [], waiting: [] };

export default function PaymentPage() {
  const { code } = useParams<{ code: string }>();
  const queryClient = useQueryClient();

  const runQuery = useRun(code);
  const queueQuery = useQueue(code);
  const sessionQuery = useSessionUser();

  const run = runQuery.data ?? null;
  const queue = queueQuery.data ?? EMPTY_QUEUE;
  const userId = sessionQuery.data ?? null;
  const loading = runQuery.isPending || queueQuery.isPending || sessionQuery.isPending;

  const isHost = !!userId && !!run && userId === run.hostId;

  const [mutating, setMutating] = useState<Set<string>>(new Set());
  const lastTapRef = useRef<Record<string, number>>({});

  const invalidateQueue = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["queue", code] });
  }, [queryClient, code]);

  useQueueRealtime(isHost ? (run?.id ?? null) : null, invalidateQueue);

  const paidMutation = useUpdateQueuePaidMutation(code);
  const paymentQrQuery = usePaymentQr(code);
  const paymentQrUrl = paymentQrQuery.data?.paymentQrUrl ?? null;

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

  if (!loading && !isHost) {
    return (
      <>
        <SessionTopbar run={run} loading={false} backHref={`/runs/${code}/lobby`} showEndRun={false} liveGameWarning={false} />
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pt-5 pb-8">
          {paymentQrUrl ? (
            <PaymentQrCard url={paymentQrUrl} caption="Scan to pay the host" />
          ) : (
            <p className="font-body text-[13px] text-text-muted text-center">
              {paymentQrQuery.isPending ? "Loading..." : "The host hasn't added a payment QR yet."}
            </p>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <SessionTopbar run={run} loading={loading} backHref={`/runs/${code}/lobby`} showEndRun={isHost && run?.status !== "completed"} liveGameWarning={queue.onCourt.length > 0} />

      {!loading && isHost && <HostPaymentQrCard code={code} url={paymentQrUrl} />}

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

const qrButtonClass =
  "min-h-[48px] rounded-md border border-border bg-bg-surface text-text-primary font-display text-[13px] font-bold tracking-[0.08em] uppercase px-4 active:bg-bg-hover disabled:opacity-50";

function qrErrorMessage(err: unknown): string {
  if (err instanceof ApiError && (err.code === "INVALID_PAYMENT_QR" || err.code === "HOST_NOT_APPROVED")) {
    return err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong. Try again.";
}

function HostPaymentQrCard({ code, url }: { code: string; url: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const upload = useUploadPaymentQrMutation(code);
  const remove = useRemovePaymentQrMutation(code);
  const busy = preparing || upload.isPending || remove.isPending;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPreparing(true);
    try {
      const image = await downscaleImage(file);
      await upload.mutateAsync(image);
    } catch (err) {
      setError(qrErrorMessage(err));
    } finally {
      setPreparing(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setConfirming(false);
    try {
      await remove.mutateAsync();
    } catch (err) {
      setError(qrErrorMessage(err));
    }
  }

  return (
    <div className="bg-bg-surface border border-border rounded-md mx-5 mt-3.5 p-4 flex flex-col items-center gap-3 animate-fade-up">
      <span className="font-display text-[12px] font-bold tracking-[0.14em] uppercase text-text-muted self-start">
        Payment QR
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void handleFile(file);
        }}
      />
      {url ? (
        <>
          <PaymentQrCard url={url} />
          {confirming ? (
            <div className="w-full flex items-center gap-2">
              <span className="flex-1 font-display text-[13px] font-bold uppercase text-text-primary">
                Remove QR?
              </span>
              <button type="button" onClick={() => setConfirming(false)} className={qrButtonClass}>
                No
              </button>
              <button type="button" onClick={() => void handleRemove()} className={qrButtonClass}>
                Yes
              </button>
            </div>
          ) : (
            <div className="w-full grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className={qrButtonClass}
              >
                {busy ? "Working..." : "Replace"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirming(true)}
                className={qrButtonClass}
              >
                Remove
              </button>
            </div>
          )}
        </>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={`${qrButtonClass} w-full`}
        >
          {busy ? "Uploading..." : "Upload QR"}
        </button>
      )}
      {error && (
        <p role="alert" className="font-body text-[12px] text-danger self-start">
          {error}
        </p>
      )}
    </div>
  );
}
