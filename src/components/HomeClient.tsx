"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Zap, RotateCw, Users, History, ArrowRight, ArrowDown, Mail } from "lucide-react";
import { cn, deriveInitials } from "@/lib/utils";
import JoinByCodeForm from "@/components/ui/JoinByCodeForm";

type InitialUser = {
  id: string;
  email: string;
  metadata: Record<string, unknown> | undefined;
} | null;

export type HomeClientProps = {
  initialUser: InitialUser;
};

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

// Sections below the fold reveal as they scroll into view — one observer each, fired once.
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

// BallRuns logo mark — accent chip with a basketball glyph (source: /public/logo.svg).
function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid place-items-center rounded-[7px] bg-accent", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" aria-hidden="true" className="h-[67%] w-[67%]" />
    </span>
  );
}

// Product visual for the hero — a mock live scoreboard, styled from the same tokens as the app.
function HeroBoard() {
  return (
    <div className="relative w-full max-w-[420px]">
      {/* ambient glow behind the board */}
      <div className="pointer-events-none absolute -inset-8 rounded-[32px] bg-accent/[0.07] blur-[70px]" />

      {/* floating accent chips */}
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

      {/* board */}
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
  const signedIn = initialUser !== null;
  const initials = signedIn ? deriveInitials(initialUser.metadata, initialUser.email) : "";

  return (
    <div className="relative z-[1] min-h-[100dvh] w-full">

      {/* ───────── HEADER ───────── */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-10">
          <Link href="/" aria-label="BallRuns home" className="flex items-center">
            <LogoMark className="h-9 w-9" />
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="font-display text-[13px] font-bold uppercase tracking-[0.12em] text-text-secondary transition-colors hover:text-text-primary"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {signedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 rounded-full border border-border-accent bg-bg-hover py-1 pl-3.5 pr-1 transition-colors hover:bg-bg-surface"
              >
                <span className="hidden font-display text-[12px] font-bold uppercase tracking-[0.1em] text-text-secondary sm:inline">
                  Dashboard
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent font-display text-[12px] font-extrabold tracking-[0.03em] text-bg">
                  {initials}
                </span>
              </Link>
            ) : (
              <Link
                href="/signup"
                className="rounded-md bg-accent px-5 py-2.5 font-display text-[13px] font-extrabold uppercase tracking-[0.08em] text-bg transition-all hover:-translate-y-px hover:shadow-[0_0_24px_-6px_rgba(200,241,53,0.5)]"
              >
                Get started
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-bg-raised to-bg">
        <div className="pointer-events-none absolute -top-28 right-0 h-96 w-96 rounded-full bg-accent/[0.10] blur-[120px]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-5 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-10 lg:pb-24 lg:pt-20">
          {/* LEFT — copy + join form */}
          <div className="flex flex-col">
            <span className="animate-fade-up font-display text-[11px] font-bold uppercase tracking-[0.22em] text-text-muted">
              Run your game
            </span>

            <h1
              className="animate-fade-up mt-5 font-display text-[64px] font-black uppercase leading-[0.82] tracking-[-0.025em] text-text-primary sm:text-[88px] lg:text-[104px]"
              style={{ animationDelay: "0.05s" }}
            >
              Ball
              <br />
              Runs
            </h1>
            <div className="animate-fade-up mt-5 h-1 w-14 rounded-sm bg-accent" style={{ animationDelay: "0.1s" }} />

            <p
              className="animate-fade-up mt-6 max-w-[30rem] font-body text-[16px] leading-[1.55] text-text-secondary lg:text-[18px]"
              style={{ animationDelay: "0.15s" }}
            >
              Pickup basketball, organized. Live score, queue, and rotation —
              <span className="text-text-primary"> synced to every phone at the court.</span>
            </p>

            {/* JOIN-CODE FORM */}
            <div className="animate-fade-up mt-9 flex max-w-[30rem] flex-col gap-2" style={{ animationDelay: "0.22s" }}>
              <span className="pl-[2px] font-display text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
                Have a code? Jump in
              </span>
              <JoinByCodeForm />
            </div>

            <a
              href="#features"
              className="animate-fade-up mt-12 flex w-fit items-center gap-2 text-text-muted transition-colors hover:text-text-secondary"
              style={{ animationDelay: "0.3s" }}
            >
              <ArrowDown className="h-3.5 w-3.5" />
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.22em]">See how it works</span>
            </a>
          </div>

          {/* RIGHT — product visual (desktop) */}
          <div
            className="animate-fade-up hidden justify-center lg:flex lg:justify-end"
            style={{ animationDelay: "0.2s" }}
          >
            <HeroBoard />
          </div>
        </div>
      </section>

      {/* ───────── MARQUEE STRIP ───────── */}
      {/* Two identical groups, each min-w-full, animating in lockstep to -100% — always fills the strip, no gap at any width. */}
      <div className="flex overflow-hidden border-y border-border bg-accent">
        {[0, 1].map((group) => (
          <div
            key={group}
            aria-hidden={group === 1}
            className="flex min-w-full shrink-0 animate-marquee items-center justify-around py-3"
          >
            {[...MARQUEE, ...MARQUEE].map((word, i) => (
              <span key={i} className="flex items-center whitespace-nowrap">
                <span className="font-display text-[15px] font-black uppercase tracking-[0.14em] text-bg">{word}</span>
                <span className="mx-6 h-1.5 w-1.5 rounded-full bg-bg/60" />
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* ───────── FEATURES ───────── */}
      <section id="features" className="scroll-mt-20 bg-bg-surface px-5 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionLabel n="01" label="What you get" />
              <h2 className="mt-4 font-display text-[34px] font-black uppercase leading-[0.95] tracking-[-0.01em] text-text-primary lg:text-[46px]">
                Everything to<br />run the court
              </h2>
            </div>
            <p className="max-w-[24rem] font-body text-[15px] leading-[1.55] text-text-secondary lg:text-[16px]">
              One host runs the game. Every player sees the same live board — no group chats, no arguing who&apos;s next.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 70}>
                <div className="group flex h-full flex-col gap-3.5 rounded-lg border border-border bg-bg-raised p-5 transition-colors hover:border-border-accent">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border-accent bg-accent-glow transition-transform group-hover:-translate-y-0.5">
                    <Icon className="h-[20px] w-[20px] text-accent" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-display text-[17px] font-extrabold uppercase leading-[1.05] tracking-[0.02em] text-text-primary">
                      {title}
                    </span>
                    <span className="font-body text-[13px] leading-[1.5] text-text-secondary">{body}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section id="how" className="scroll-mt-20 bg-bg px-5 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionLabel n="02" label="How it works" />
            <h2 className="mt-4 font-display text-[34px] font-black uppercase leading-[0.95] tracking-[-0.01em] text-text-primary lg:text-[46px]">
              Three steps.<br />Tip-off.
            </h2>
          </Reveal>

          {/* Desktop: 3 columns with a connecting rail. Mobile: vertical timeline. */}
          <div className="relative mt-10 lg:mt-16">
            <div className="pointer-events-none absolute left-0 right-0 top-[22px] hidden h-px bg-border lg:block" />
            <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-3 lg:gap-x-10">
              {STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 90}>
                  {/* mobile row */}
                  <div className="flex gap-5 lg:hidden">
                    <div className="flex flex-col items-center">
                      <span className="font-display text-[44px] font-black leading-none tabular-nums text-accent/25">{step.n}</span>
                      {i < STEPS.length - 1 && <span className="my-2 w-px flex-1 bg-border" />}
                    </div>
                    <div className={cn("flex flex-col gap-1.5 pt-2", i < STEPS.length - 1 && "pb-2")}>
                      <span className="font-display text-[19px] font-extrabold uppercase leading-none tracking-[0.02em] text-text-primary">
                        {step.title}
                      </span>
                      <span className="max-w-[20rem] font-body text-[13.5px] leading-[1.5] text-text-secondary">{step.body}</span>
                    </div>
                  </div>

                  {/* desktop column */}
                  <div className="hidden flex-col lg:flex">
                    <div className="relative mb-6 grid h-11 w-11 place-items-center rounded-full border border-border-accent bg-bg font-display text-[15px] font-black tabular-nums text-accent">
                      {step.n}
                    </div>
                    <span className="font-display text-[22px] font-extrabold uppercase leading-none tracking-[0.02em] text-text-primary">
                      {step.title}
                    </span>
                    <span className="mt-2.5 max-w-[22rem] font-body text-[15px] leading-[1.55] text-text-secondary">{step.body}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── BECOME A HOST (accent band) ───────── */}
      <section id="host" className="relative scroll-mt-20 overflow-hidden bg-accent px-5 py-16 lg:px-10 lg:py-24">
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-64 w-64 rounded-full bg-bg/[0.07] blur-[60px]" />
        <div className="pointer-events-none absolute -top-20 right-10 h-72 w-72 rounded-full bg-bg/[0.05] blur-[80px]" />
        <Reveal className="relative mx-auto flex max-w-6xl flex-col gap-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:justify-between">
            {/* host lane */}
            <div className="flex max-w-[34rem] flex-col">
              <SectionLabel n="03" label="For hosts" tone="dark" />
              <h2 className="mt-4 font-display text-[40px] font-black uppercase leading-[0.85] tracking-[-0.015em] text-bg lg:text-[64px]">
                Run your<br />own court
              </h2>
              <p className="mt-5 max-w-[26rem] font-body text-[15px] font-medium leading-[1.5] text-bg/75 lg:text-[17px]">
                Signing up is free and open to everyone — players don&apos;t even need an account to join a run. Want to run
                your own court? Hosting is a quick request we approve.
              </p>

              <div className="mt-7 flex flex-col gap-2.5 lg:mt-auto lg:pt-7">
                <Link
                  href={signedIn ? "/dashboard?intent=host" : "/signup?intent=host"}
                  className={cn(
                    "flex h-14 w-full items-center justify-center gap-2.5 rounded-md bg-bg text-accent sm:w-auto sm:min-w-[15rem] sm:self-start",
                    "font-display text-[16px] font-extrabold uppercase tracking-[0.1em]",
                    "transition-all duration-150 hover:-translate-y-px active:scale-[0.98]",
                  )}
                >
                  {signedIn ? "Go to Dashboard" : "Request to Host"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* premium / partnership lane */}
            <div className="flex w-full flex-col rounded-2xl border border-bg/15 bg-bg p-6 shadow-xl shadow-black/10 lg:w-[23rem] lg:p-7">
              <span className="w-fit rounded-full border border-border-accent bg-accent-glow px-2.5 py-1 font-display text-[10px] font-black uppercase tracking-[0.16em] text-accent">
                Coming soon · early access
              </span>
              <h3 className="mt-4 font-display text-[24px] font-extrabold uppercase leading-[0.95] tracking-[-0.01em] text-text-primary lg:text-[27px]">
                Running a league or tournament?
              </h3>
              <p className="mt-3 font-body text-[14px] leading-[1.55] text-text-secondary lg:text-[15px]">
                Brackets, standings, and a full digital committee scorebook — fouls, timeouts, points, all of it. The
                premium tournament system is in the works.
              </p>
              <a
                href="mailto:lysander.uy@gmail.com?subject=BallRuns%20%E2%80%94%20League%20%2F%20Tournament%20interest&body=Hi%20Lysander%2C%0D%0A%0D%0AWe%20are%20interested%20in%20running%20a%20league%20or%20tournament%20on%20BallRuns.%20Here%27s%20a%20bit%20about%20us%3A%0D%0A"
                className={cn(
                  "mt-6 flex h-14 items-center justify-center gap-2.5 rounded-md border border-border-accent text-accent lg:mt-auto",
                  "font-display text-[15px] font-extrabold uppercase tracking-[0.1em]",
                  "transition-all duration-150 hover:bg-accent-glow hover:-translate-y-px active:scale-[0.98]",
                )}
              >
                <Mail className="h-4 w-4" />
                Partner With Us
              </a>
            </div>
          </div>

          <p className="font-body text-[13px] font-medium text-bg/65">
            Just here to play? Ask your host for the run code — no signup required.
          </p>
        </Reveal>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer className="bg-bg-raised px-5 pb-8 pt-14 lg:px-10 lg:pt-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            <div className="flex max-w-[18rem] flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <LogoMark className="h-7 w-7" />
                <span className="font-display text-[20px] font-black uppercase leading-none tracking-[0.02em] text-text-primary">
                  BallRuns
                </span>
              </div>
              <span className="font-body text-[13px] leading-[1.5] text-text-secondary">
                Pickup basketball, organized. Built for the court.
              </span>
            </div>

            <div className="flex gap-16">
              <div className="flex flex-col gap-3">
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Product</span>
                {NAV_LINKS.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    className="w-fit font-display text-[13px] font-bold uppercase tracking-[0.04em] text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {label}
                  </a>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Company</span>
                {["About", "Contact", "Privacy"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="w-fit font-display text-[13px] font-bold uppercase tracking-[0.04em] text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="my-8 h-px bg-border" />

          <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
            <span className="font-body text-[12px] text-text-secondary">
              Built by <span className="font-semibold text-text-primary">Lysander Uy</span> &amp;{" "}
              <span className="font-semibold text-text-primary">Benedict Abellana</span>
            </span>
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
              © {new Date().getFullYear()} BallRuns
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
