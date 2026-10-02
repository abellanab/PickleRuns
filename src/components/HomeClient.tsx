"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn, deriveInitials } from "@/lib/utils";
import { useRuns, useCloseRunMutation, type RunSummary } from "@/hooks/use-run";
import { signOut } from "@/app/(auth)/actions";
import { Plus, ChevronRight, LogOut } from "lucide-react";

type InitialUser = {
  id: string;
  email: string;
  metadata: Record<string, unknown> | undefined;
} | null;

export type HomeClientProps = {
  initialUser: InitialUser;
};

type HomeRun = Pick<RunSummary, "id" | "name" | "location" | "status" | "sessionCode" | "gameCount">;

function mapRuns(runs: RunSummary[]): HomeRun[] {
  return runs.map((r) => ({
    id: r.id,
    name: r.name,
    location: r.location,
    status: r.status,
    sessionCode: r.sessionCode,
    gameCount: r.gameCount,
  }));
}

export default function HomeClient({ initialUser }: HomeClientProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

  const signedIn = initialUser !== null;
  const { data: runs = [] } = useRuns(signedIn);

  const initials = signedIn ? deriveInitials(initialUser.metadata, initialUser.email) : "";
  const visibleRuns: HomeRun[] = signedIn ? mapRuns(runs) : [];

  const activeRun = signedIn
    ? (visibleRuns.find((r) => r.status === "active" || r.status === "lobby") ?? null)
    : null;

  const completedCount = signedIn
    ? visibleRuns.filter((r) => r.status === "completed").length
    : 0;

  const closeRun = useCloseRunMutation(activeRun?.sessionCode ?? "");

  const stripped = code.replace("-", "");
  const codeReady = stripped.length >= 6;

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
    if (val.length > 3) val = val.slice(0, 3) + "-" + val.slice(3);
    setCode(val);
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!codeReady) {
      const el = inputRef.current;
      if (!el) return;
      el.style.borderColor = "#ff4040";
      el.style.animation = "";
      void el.offsetWidth;
      el.style.animation = "shake 0.4s ease-out";
      setTimeout(() => {
        el.style.borderColor = "";
        el.style.animation = "";
      }, 500);
      return;
    }
    router.push(`/runs/${code}/join`);
  }

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
          {signedIn && (
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
                  className="z-50 min-w-[180px] rounded-md border border-border bg-bg-surface shadow-lg outline-none animate-fade-up"
                >
                  <DropdownMenu.Item asChild>
                    <button
                      onClick={() => router.push("/account")}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 font-display text-[13px] font-bold tracking-[0.06em] uppercase text-text-primary hover:bg-bg-hover outline-none cursor-pointer transition-colors"
                    >
                      Account
                    </button>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
        <div className="w-12 h-0.5 bg-accent rounded-sm mt-2.5" />
        <p className="font-display text-[14px] font-bold tracking-[0.1em] uppercase text-text-muted mt-2.5">
          Run your game
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex-1 flex flex-col justify-end pb-12">
        <div className="flex flex-col gap-5">

          {signedIn && (
            <div
              className="flex flex-col gap-2 mb-12 animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              {activeRun && (
                <button
                  onClick={() => router.push(`/runs/${activeRun.sessionCode}/lobby`)}
                  className="w-full flex flex-col gap-3 px-[18px] py-4 rounded-md border border-border-accent border-l-[3px] border-l-accent bg-accent/[0.04] hover:bg-accent/[0.08] transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-[7px] h-[7px] rounded-full bg-[#3ddc84] flex-shrink-0 animate-live-pulse" />
                      <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-accent-dim">
                        Live
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

              {visibleRuns.length > 0 && (
                <button
                  onClick={() => router.push("/history")}
                  className="w-full flex items-center justify-between px-[18px] py-3 rounded-md border border-border bg-bg-surface hover:bg-bg-hover transition-colors text-left"
                >
                  <div className="flex flex-col gap-[5px]">
                    <span className="font-display text-[18px] font-extrabold tracking-[0.02em] uppercase text-text-secondary leading-none">
                      Your Runs
                    </span>
                    <span className="font-display text-[12px] font-semibold tracking-[0.1em] uppercase text-text-muted">
                      {completedCount} completed
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                </button>
              )}
            </div>
          )}

          <>
            <div
              className="flex flex-col gap-1.5 animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted pl-[2px]">
                Have a code?
              </span>
              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  ref={inputRef}
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="ABC-123"
                  maxLength={7}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className={cn(
                    "flex-1 min-w-0 h-13 bg-bg-surface border border-border rounded-md",
                    "px-3.5",
                    "font-display text-[20px] font-black tracking-[0.18em] text-text-primary uppercase",
                    "outline-none transition-colors duration-150",
                    "placeholder:text-text-muted placeholder:tracking-[0.12em] placeholder:font-bold placeholder:normal-case",
                    "focus:border-border-accent focus:bg-bg-hover",
                    "[caret-color:theme(colors.accent)]"
                  )}
                />
                <button
                  type="submit"
                  className={cn(
                    "h-13 px-5 rounded-md border flex-shrink-0",
                    "font-display text-[14px] font-extrabold tracking-[0.1em] uppercase",
                    "flex items-center transition-all duration-150",
                    codeReady
                      ? "bg-accent border-accent text-bg hover:-translate-y-px"
                      : "bg-bg-surface border-border text-text-secondary hover:border-text-muted hover:text-text-primary"
                  )}
                >
                  Join
                </button>
              </form>
            </div>

            <div
              className="flex items-center gap-2.5 animate-fade-up"
              style={{ animationDelay: "0.16s" }}
            >
              <div className="flex-1 h-px bg-border" />
              <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
                or
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          </>

          <button
            onClick={handleStartRun}
            className={cn(
              "w-full h-14 rounded-md animate-fade-up",
              "bg-accent text-bg",
              "font-display text-[17px] font-extrabold tracking-[0.1em] uppercase",
              "flex items-center justify-center gap-2",
              "transition-all duration-150 hover:-translate-y-px hover:bg-[#d4f545] active:scale-[0.98]"
            )}
            style={{ animationDelay: "0.2s" }}
          >
            <Plus className="w-4 h-4" />
            Start a Run
          </button>

          {!signedIn && (
            <div
              className="flex items-center justify-center gap-1.5 animate-fade-up"
              style={{ animationDelay: "0.24s" }}
            >
              <span className="font-body text-[13px] text-text-muted">
                Already have an account?
              </span>
              <Link
                href="/login"
                className="font-body text-[13px] font-semibold text-text-secondary underline underline-offset-2 decoration-border transition-colors hover:text-text-primary"
              >
                Sign in
              </Link>
            </div>
          )}

        </div>
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
