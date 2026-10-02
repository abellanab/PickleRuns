"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn, deriveInitials } from "@/lib/utils";
import JoinByCodeForm from "@/components/ui/JoinByCodeForm";
import { useRuns, useCloseRunMutation, type RunSummary } from "@/hooks/use-run";
import { useHostStatus, useRequestHostMutation } from "@/hooks/use-host-request";
import { signOut } from "@/app/(auth)/actions";
import { Plus, ChevronRight, LogOut, User, Clock, Sparkles } from "lucide-react";

type InitialUser = {
  id: string;
  email: string;
  metadata: Record<string, unknown> | undefined;
};

export type DashboardClientProps = {
  initialUser: InitialUser;
};

type DashboardRun = Pick<
  RunSummary,
  "id" | "name" | "location" | "status" | "sessionCode" | "gameCount" | "isHost"
>;

function mapRuns(runs: RunSummary[]): DashboardRun[] {
  return runs.map((r) => ({
    id: r.id,
    name: r.name,
    location: r.location,
    status: r.status,
    sessionCode: r.sessionCode,
    gameCount: r.gameCount,
    isHost: r.isHost,
  }));
}

export default function DashboardClient({ initialUser }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent") === "host";

  const [showConflictModal, setShowConflictModal] = useState(false);
  const [hostPromptDismissed, setHostPromptDismissed] = useState(false);

  const { data: runs = [] } = useRuns(true);
  const { data: hostStatus } = useHostStatus();
  const requestHost = useRequestHostMutation();

  const isApproved = hostStatus === "approved";
  const isPending = hostStatus === "pending";
  const isDenied = hostStatus === "denied";
  const isUnapproved = hostStatus === "none" || hostStatus === "denied";

  const dismissKey = `ballruns:host-prompt-dismissed:${initialUser.id}`;

  useEffect(() => {
    if (intent) {
      try {
        localStorage.removeItem(dismissKey);
      } catch {
        // localStorage may be unavailable — fall back to the in-memory default.
      }
      setHostPromptDismissed(false);
      return;
    }
    try {
      setHostPromptDismissed(localStorage.getItem(dismissKey) === "true");
    } catch {
      // localStorage may be unavailable — keep the prompt visible.
    }
  }, [intent, dismissKey]);

  function handleDismissHostPrompt() {
    setHostPromptDismissed(true);
    try {
      localStorage.setItem(dismissKey, "true");
    } catch {
      // Persisting is best-effort; the prompt stays dismissed for this session regardless.
    }
  }

  const initials = deriveInitials(initialUser.metadata, initialUser.email);
  const email = initialUser.email;
  const visibleRuns: DashboardRun[] = mapRuns(runs);

  const activeRun =
    visibleRuns.find((r) => r.status === "active" || r.status === "lobby") ?? null;

  const completedCount = visibleRuns.filter((r) => r.status === "completed").length;

  const closeRun = useCloseRunMutation(activeRun?.sessionCode ?? "");

  function handleStartRun() {
    if (activeRun) {
      setShowConflictModal(true);
    } else {
      router.push("/create-run");
    }
  }

  async function handleCloseAndStart() {
    if (!activeRun) return;
    try {
      await closeRun.mutateAsync();
      setShowConflictModal(false);
      router.push("/create-run");
    } catch {
      // Keep the modal open so the host can retry.
    }
  }

  return (
    <div className="app-shell px-5">

      {/* WORDMARK */}
      <div className="pt-14 flex flex-col gap-[2px] animate-fade-up">
        <div className="flex items-start justify-between">
          <h1 className="font-display text-[52px] font-black tracking-[-0.01em] uppercase text-text-primary leading-none">
            Ball
            <br />
            Runs
          </h1>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="mt-1 w-[38px] h-[38px] flex-shrink-0 rounded-full bg-bg-hover border border-border-accent flex items-center justify-center font-display text-[13px] font-extrabold tracking-[0.04em] text-accent outline-none focus-visible:ring-2 focus-visible:ring-accent/50 transition-colors hover:bg-bg-surface">
                {initials}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-[200px] rounded-md border border-border bg-bg-surface shadow-lg outline-none animate-fade-up"
              >
                <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-border">
                  <div className="w-[30px] h-[30px] flex-shrink-0 rounded-full bg-bg-hover border border-border-accent flex items-center justify-center font-display text-[11px] font-extrabold tracking-[0.04em] text-accent">
                    {initials}
                  </div>
                  <span className="font-body text-[12px] font-medium text-text-muted truncate">
                    {email}
                  </span>
                </div>

                {isUnapproved && (
                  <DropdownMenu.Item asChild>
                    <button
                      onClick={() => requestHost.mutate()}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 font-display text-[13px] font-bold tracking-[0.06em] uppercase text-text-secondary hover:bg-bg-hover hover:text-text-primary outline-none cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      Become a Host
                    </button>
                  </DropdownMenu.Item>
                )}

                <DropdownMenu.Item asChild>
                  <Link
                    href="/account"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 font-display text-[13px] font-bold tracking-[0.06em] uppercase text-text-secondary hover:bg-bg-hover hover:text-text-primary outline-none cursor-pointer transition-colors"
                  >
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                    Account
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-border mx-1" />

                <DropdownMenu.Item asChild>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 font-display text-[13px] font-bold tracking-[0.06em] uppercase text-[#ff4040] hover:bg-[#ff4040]/10 outline-none cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                    Sign Out
                  </button>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        <div className="w-12 h-0.5 bg-accent rounded-sm mt-2.5" />
        <p className="font-display text-[14px] font-bold tracking-[0.1em] uppercase text-text-muted mt-2.5">
          Run your game
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex-1 flex flex-col pt-9 pb-10">
        <div className="flex flex-col gap-5">

          {activeRun && (
            <button
              onClick={() => router.push(`/runs/${activeRun.sessionCode}/lobby`)}
              className="w-full flex flex-col gap-3 px-[18px] py-4 rounded-md border border-border-accent border-l-[3px] border-l-accent bg-accent/[0.04] hover:bg-accent/[0.08] transition-colors text-left animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-[7px] h-[7px] rounded-full bg-[#3ddc84] flex-shrink-0 animate-live-pulse" />
                  <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-accent-dim">
                    {activeRun.isHost ? "Live" : "Live · You're in"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
                    {activeRun.gameCount} {activeRun.gameCount === 1 ? "Game" : "Games"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-display text-[22px] font-extrabold tracking-[0.02em] uppercase text-text-primary leading-none">
                  {activeRun.name}
                </span>
                {activeRun.location && (
                  <span className="font-body text-[12px] font-medium text-text-muted uppercase">
                    {activeRun.location}
                  </span>
                )}
              </div>
            </button>
          )}

          <div
            className="flex flex-col gap-2.5 animate-fade-up"
            style={{ animationDelay: "0.14s" }}
          >
            <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
              {activeRun ? "Join another run" : "Join a run"}
            </span>
            <JoinByCodeForm />
          </div>

          {isApproved && (
            <>
              <div
                className="flex items-center gap-2.5 animate-fade-up"
                style={{ animationDelay: "0.18s" }}
              >
                <div className="flex-1 h-px bg-border" />
                <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
                  or
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button
                onClick={handleStartRun}
                className={cn(
                  "w-full h-14 rounded-md animate-fade-up",
                  "bg-accent text-bg",
                  "font-display text-[17px] font-extrabold tracking-[0.1em] uppercase",
                  "flex items-center justify-center gap-2",
                  "transition-all duration-150 hover:-translate-y-px hover:bg-[#d4f545] active:scale-[0.98]"
                )}
                style={{ animationDelay: "0.22s" }}
              >
                <Plus className="w-4 h-4" />
                Start a Run
              </button>
            </>
          )}

          {isPending && (
            <div
              className="w-full h-14 rounded-md border border-border bg-bg-surface flex items-center justify-center gap-2 animate-fade-up"
              style={{ animationDelay: "0.22s" }}
            >
              <Clock className="w-4 h-4 text-text-muted" />
              <span className="font-display text-[15px] font-extrabold tracking-[0.1em] uppercase text-text-muted">
                Host Request Pending
              </span>
            </div>
          )}

          {completedCount > 0 && (
            <button
              onClick={() => router.push("/history")}
              className="w-full flex items-center justify-between px-[18px] py-3 rounded-md border border-border bg-bg-surface hover:bg-bg-hover transition-colors text-left animate-fade-up"
              style={{ animationDelay: "0.26s" }}
            >
              <div className="flex flex-col gap-[5px]">
                <span className="font-display text-[18px] font-extrabold tracking-[0.02em] uppercase text-text-secondary leading-none">
                  Runs You&apos;ve Played
                </span>
                <span className="font-display text-[12px] font-semibold tracking-[0.1em] uppercase text-text-muted">
                  {completedCount} completed
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
            </button>
          )}
        </div>

        {/* Become a host — demoted footer nudge */}
        {isUnapproved && !hostPromptDismissed && (
          <div
            className="mt-auto pt-8 w-full flex flex-col gap-4 animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="w-full flex flex-col gap-4 px-[18px] py-5 rounded-md border border-border-accent border-l-[3px] border-l-accent bg-accent/[0.04]">
              <div className="flex flex-col gap-1.5">
                <span className="font-display text-[20px] font-extrabold tracking-[0.02em] uppercase text-text-primary leading-none">
                  Run Your Own Court
                </span>
                <span className="font-body text-[13px] text-text-secondary leading-[1.5]">
                  {isDenied
                    ? "Your last request wasn't approved. Add some detail and try again."
                    : "Hosting is approval-gated. Send a quick request and we'll get you set up."}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => requestHost.mutate()}
                  disabled={requestHost.isPending}
                  className="w-full h-12 flex items-center justify-center rounded-md bg-accent text-bg font-display text-[15px] font-extrabold tracking-[0.1em] uppercase transition-all duration-150 hover:-translate-y-px hover:bg-[#d4f545] active:scale-[0.98] disabled:opacity-50"
                >
                  {requestHost.isPending
                    ? "Sending…"
                    : isDenied
                      ? "Request Again"
                      : "Request to Host"}
                </button>
                <button
                  onClick={handleDismissHostPrompt}
                  className="w-full h-11 flex items-center justify-center rounded-md border border-border bg-bg-surface text-text-secondary font-display text-[13px] font-bold tracking-[0.08em] uppercase transition-colors hover:bg-bg-hover hover:text-text-primary"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        )}

        {isUnapproved && hostPromptDismissed && (
          <button
            onClick={() => requestHost.mutate()}
            disabled={requestHost.isPending}
            className="mt-auto pt-8 w-full text-center font-body text-[13px] text-text-muted transition-colors hover:text-text-secondary animate-fade-up disabled:opacity-50"
            style={{ animationDelay: "0.3s" }}
          >
            Want to run your own court?{" "}
            <span className="font-semibold text-text-secondary underline underline-offset-2 decoration-border">
              Request to host
            </span>
          </button>
        )}
      </div>

      {showConflictModal && activeRun && (
        <>
          <div
            className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm"
            onClick={() => setShowConflictModal(false)}
          />
          <div className="fixed inset-0 z-[111] flex items-center justify-center px-5">
            <div className="w-full max-w-[320px] bg-bg-raised border border-border rounded-xl p-6 flex flex-col gap-5 animate-slide-up">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="font-display text-[16px] font-black tracking-[0.06em] uppercase text-text-primary">
                    Run in Progress
                  </span>
                  <span className="font-body text-[13px] text-text-secondary leading-[1.5]">
                    You already have an active run. Continue it, or close it to start a new one.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConflictModal(false)}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push(`/runs/${activeRun.sessionCode}/lobby`)}
                  className="w-full h-11 flex items-center justify-center rounded-md bg-accent text-bg font-display text-[13px] font-black tracking-[0.08em] uppercase transition-opacity hover:opacity-90"
                >
                  Continue Run
                </button>
                <button
                  type="button"
                  onClick={handleCloseAndStart}
                  disabled={closeRun.isPending}
                  className="w-full h-11 flex items-center justify-center rounded-md border border-danger/40 bg-danger/[0.06] text-[#ff6060] font-display text-[13px] font-black tracking-[0.08em] uppercase transition-all hover:bg-danger/[0.12] disabled:opacity-50"
                >
                  {closeRun.isPending ? "Closing..." : "Close & Start New"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
