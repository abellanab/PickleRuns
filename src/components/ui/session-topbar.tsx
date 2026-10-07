"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Share2, X, Check, Copy, MoreVertical, Flag, ChevronLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCloseRunMutation } from "@/hooks/use-run";

interface SessionTopbarProps {
  run: { name: string; location: string | null; sessionCode: string; status: "lobby" | "active" | "completed" } | null;
  loading: boolean;
  badge?: React.ReactNode;
  backHref?: string;
  exitHref?: string;
  menuAction?: { label: string; onSelect: () => void };
  showEndRun?: boolean;
  liveGameWarning?: boolean;
}

export function SessionTopbar({ run, loading, badge, backHref, exitHref, menuAction, showEndRun, liveGameWarning }: SessionTopbarProps) {
  const router = useRouter();
  const [showShare, setShowShare] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [showEndRunConfirm, setShowEndRunConfirm] = useState(false);
  const [endingRun, setEndingRun] = useState(false);

  const closeRunMutation = useCloseRunMutation(run?.sessionCode ?? "");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const joinUrl = origin ? `${origin}/runs/${run?.sessionCode}/join` : "";

  // A completed run can't be joined (the queue rejects it), so the join/share
  // invite is hidden once the run is over — for everyone, not just the host.
  const isCompleted = run?.status === "completed";

  async function handleCopy() {
    if (!joinUrl) return;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleEndRun() {
    setEndingRun(true);
    try {
      await closeRunMutation.mutateAsync();
      router.push("/history");
    } catch {
      setEndingRun(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {loading ? (
            <>
              <div className="h-[11px] w-20 bg-bg-hover rounded-sm animate-pulse" />
              <div className="h-5 w-36 bg-bg-hover rounded-sm mt-0.5 animate-pulse" />
            </>
          ) : (
            <>
              <span className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-text-muted truncate">
                {run?.location ?? "Pickleball Run"}
              </span>
              <span className="font-display text-[20px] font-black tracking-[0.02em] uppercase text-text-primary leading-none truncate">
                {run?.name ?? "—"}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {badge}
          {menuAction || showEndRun ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((v) => !v)}
                className="w-9 h-9 flex items-center justify-center rounded-sm border border-border bg-bg-surface text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[200]"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-[201] bg-bg-raised border border-border rounded-lg overflow-hidden shadow-lg min-w-[160px]">
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => { setShowMenu(false); setShowShare(true); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                      >
                        <Share2 className="w-4 h-4 flex-shrink-0" />
                        <span className="font-display text-[13px] font-bold tracking-[0.06em] uppercase">Share</span>
                      </button>
                    )}
                    {menuAction && (
                      <>
                        <div className="h-px bg-border mx-3" />
                        <button
                          type="button"
                          onClick={() => { setShowMenu(false); menuAction.onSelect(); }}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-[#ff6060] hover:bg-danger/[0.08] transition-colors"
                        >
                          <Flag className="w-4 h-4 flex-shrink-0" />
                          <span className="font-display text-[13px] font-bold tracking-[0.06em] uppercase">{menuAction.label}</span>
                        </button>
                      </>
                    )}
                    {showEndRun && (
                      <>
                        <div className="h-px bg-border mx-3" />
                        <button
                          type="button"
                          onClick={() => { setShowMenu(false); setShowEndRunConfirm(true); }}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-[#ff6060] hover:bg-danger/[0.08] transition-colors"
                        >
                          <Flag className="w-4 h-4 flex-shrink-0" />
                          <span className="font-display text-[13px] font-bold tracking-[0.06em] uppercase">End Run</span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            !isCompleted && (
              <button
                type="button"
                onClick={() => setShowShare(true)}
                className="w-9 h-9 flex items-center justify-center rounded-sm border border-border bg-bg-surface text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )
          )}
          {exitHref && (
            <Link
              href={exitHref}
              className="w-9 h-9 flex items-center justify-center rounded-sm border border-border bg-bg-surface text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </Link>
          )}
          {backHref && (
            <Link
              href={backHref}
              className="w-9 h-9 flex items-center justify-center rounded-sm border border-border bg-bg-surface text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {showShare && run && (
        <>
          <div
            className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm"
            onClick={() => setShowShare(false)}
          />
          <div className="fixed inset-0 z-[111] flex items-center justify-center px-5">
            <div className="w-full max-w-[340px] bg-bg-raised border border-border rounded-xl p-6 flex flex-col items-center gap-5 animate-slide-in">

              <div className="w-full flex items-center justify-between">
                <span className="font-display text-[14px] font-black tracking-[0.08em] uppercase text-text-primary">
                  Join this Run
                </span>
                <button
                  type="button"
                  onClick={() => setShowShare(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-sm border border-border bg-bg-surface text-text-muted transition-colors hover:border-text-muted hover:text-text-primary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 bg-bg-surface border border-border rounded-lg">
                <QRCodeSVG
                  value={joinUrl}
                  size={180}
                  bgColor="#1e2019"
                  fgColor="#f0f0e8"
                />
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="font-display text-[10px] font-bold tracking-[0.16em] uppercase text-text-muted">
                  Session Code
                </span>
                <span className="font-display text-[32px] font-black tracking-[0.12em] uppercase text-accent leading-none">
                  {run.sessionCode}
                </span>
              </div>

              <span className="w-full font-display text-[10px] font-bold tracking-[0.16em] uppercase text-text-muted">
                Share this run
              </span>
              <div className="w-full flex items-center gap-2 bg-bg-surface border border-border rounded-md px-3 py-2.5">
                <span className="font-body text-[12px] text-text-muted flex-1 truncate">
                  {joinUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 font-display text-[11px] font-bold tracking-[0.08em] uppercase flex-shrink-0 transition-colors ${
                    copied ? "text-accent" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      {showEndRunConfirm && (
        <>
          <div
            className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm"
            onClick={() => setShowEndRunConfirm(false)}
          />
          <div className="fixed inset-0 z-[111] flex items-center justify-center px-5">
            <div className="w-full max-w-[320px] bg-bg-raised border border-border rounded-xl p-6 flex flex-col gap-5 animate-slide-up">
              <div className="flex flex-col gap-1.5">
                <span className="font-display text-[16px] font-black tracking-[0.06em] uppercase text-text-primary">
                  End this run?
                </span>
                <span className="font-body text-[13px] text-text-secondary leading-[1.5]">
                  This closes the run for everyone. This can&apos;t be undone.
                </span>
                {liveGameWarning && (
                  <span className="font-body text-[13px] text-[#ff6060] leading-[1.5] font-semibold">
                    A game is still live — it will be ended too.
                  </span>
                )}
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEndRunConfirm(false)}
                  className="flex-1 h-11 rounded-md border border-border bg-bg-surface text-text-secondary font-display text-[13px] font-bold tracking-[0.08em] uppercase transition-colors hover:border-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEndRun}
                  disabled={endingRun}
                  className="flex-1 h-11 rounded-md border border-danger bg-danger/[0.08] text-[#ff6060] font-display text-[13px] font-black tracking-[0.1em] uppercase transition-all hover:bg-danger/[0.16] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {endingRun ? "Ending…" : "End Run"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
