"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Zap, RotateCw, Users, History, ArrowRight, ArrowDown, Mail, Plus, ChevronRight, LogOut } from "lucide-react";
import { cn, deriveInitials } from "@/lib/utils";
import { useRuns, useCloseRunMutation, type RunSummary } from "@/hooks/use-run";
import { signOut } from "@/app/(auth)/actions";
import JoinByCodeForm from "@/components/ui/JoinByCodeForm";

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

const FEATURES = [
  { icon: Zap, title: "Live Scoring", body: "Real-time score, synced to every phone on the court." },
  { icon: RotateCw, title: "Queue Rotation", body: "Winners stay, losers rotate — automatic." },
  { icon: Users, title: "Team Assignment", body: "Balanced squads in a single tap." },
  { icon: History, title: "Run History", body: "Every game and result, saved." },
] as const;

const STEPS = [
  { n: "01", title: "Host starts a run", body: "Set the format, score goal, and game clock." },
  { n: "02", title: "Players join by code", body: "Share the run code — they jump in from their phone." },
  { n: "03", title: "Game runs live", body: "Score, queue, and rotation update for everyone, instantly." },
] as const;

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#host", label: "For hosts" },
] as const;

const MARQUEE = [
  "Live Scoring",
  "Queue Rotation",
  "Team Balance",
  "Run History",
  "Winners Stay",
  "Synced Courtside",
] as const;

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className,
      )}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ n, label, tone = "muted" }: { n: string; label: string; tone?: "muted" | "dark" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("font-display text-[12px] font-black tracking-[0.18em]", tone === "dark" ? "text-bg" : "text-accent")}>
        {n}
      </span>
      <span className={cn("w-5 h-px", tone === "dark" ? "bg-bg/40" : "bg-border")} />
      <span
        className={cn(
          "font-display text-[11px] font-bold tracking-[0.2em] uppercase",
          tone === "dark" ? "text-bg/70" : "text-text-muted",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid place-items-center rounded-[7px] bg-accent", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" aria-hidden="true" className="h-[67%] w-[67%]" />
    </span>
  );
}

function HeroBoard() {
  return (
    <div className="relative w-full max-w-[420px]">
      <div className="pointer-events-none absolute -inset-8 rounded-[32px] bg-accent/[0.07] blur-[70px]" />
      <div className="animate-float-soft pointer-events-none absolute -left-6 top-14 z-20 hidden xl:flex items-center gap-1.5 rounded-full border border-border-accent bg-bg-raised px-3 py-1.5 shadow-lg shadow-black/40">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent">+2 · Score</span>
      </div>
      <div
        className="animate-float-soft pointer-events-none absolute -right-5 bottom-20 z-20 hidden xl:flex items-center gap-1.5 rounded-full border border-border bg-bg-raised px-3 py-1.5 shadow-lg shadow-black/40"
        style={{ animationDelay: "1.4s" }}
      >
        <RotateCw className="h-3 w-3 text-accent" />
        <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.12em] text-text-primary">Queue rotated</span>
      </div>
      <div className="relative z-10 overflow-hidden rounded-2xl border border-border bg-bg-surface shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <span className="font-display text-[12px] font-bold uppercase tracking-[0.18em] text-text-muted">
            Court 3 · Game 12
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-success-border bg-success-glow px-2.5 py-1">
            <span className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-success" />
            <span className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-success">Live</span>
          </span>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-center justify-between rounded-lg border border-border-accent bg-accent-glow px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-team-a" />
              <span className="font-display text-[17px] font-extrabold uppercase tracking-[0.04em] text-text-primary">Team A</span>
            </div>
            <span className="font-display text-[38px] font-black leading-none tabular-nums text-accent">21</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between rounded-lg border border-border bg-bg-raised px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-text-secondary" />
              <span className="font-display text-[17px] font-extrabold uppercase tracking-[0.04em] text-text-secondary">Team B</span>
            </div>
            <span className="font-display text-[38px] font-black leading-none tabular-nums text-text-secondary">18</span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">First to 21</span>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-accent">Match point</span>
          </div>
        </div>
        <div className="border-t border-border px-5 py-4">
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Up next</span>
          <div className="mt-2.5 flex items-center gap-2">
            {["JR", "MV", "TK", "DS"].map((tag, i) => (
              <span
                key={tag}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full border font-display text-[12px] font-extrabold tracking-[0.03em]",
                  i === 0
                    ? "border-border-accent bg-bg-hover text-accent"
                    : "border-border bg-bg-raised text-text-secondary",
                )}
              >
                {tag}
              </span>
            ))}
            <span className="ml-1 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-text-muted">+5 waiting</span>
          </div>
        </div>
      </div>
    </div>
  );
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
    </div>
  );
}
