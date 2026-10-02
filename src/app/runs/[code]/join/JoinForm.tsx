"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAddQueueEntryMutation } from "@/hooks/use-queue";
import { useRun } from "@/hooks/use-run";
import { ApiError } from "@/lib/api/client";

interface Props {
  runCode: string;
  currentUser: { id: string; displayName: string | null } | null;
}

const inputClass = cn(
  "w-full h-13 bg-bg-surface border border-border rounded-md",
  "px-3.5",
  "font-body text-[15px] text-text-primary",
  "outline-none transition-all duration-150",
  "placeholder:text-text-muted",
  "focus:border-border-accent focus:bg-bg-hover"
);

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function JoinPageClient({ runCode, currentUser }: Props) {
  const { data: run, isPending, isError } = useRun(runCode);

  if (isError) {
    return (
      <div className="app-shell px-5">
        <div className="pt-10 flex flex-col items-center justify-center text-center gap-3">
          <span className="font-display text-[16px] font-black tracking-[0.06em] uppercase text-text-primary">
            Run not found
          </span>
          <span className="font-body text-[13px] text-text-muted">
            Check the code and try again.
          </span>
          <Link
            href="/"
            className="mt-4 font-display text-[13px] font-bold tracking-[0.08em] uppercase text-accent underline underline-offset-2"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (isPending || !run) {
    return (
      <div className="app-shell px-5">
        <div className="pt-10 h-12 w-40 bg-bg-surface rounded-md animate-pulse" />
      </div>
    );
  }

  return <JoinForm runCode={runCode} runName={run.name} currentUser={currentUser} />;
}

interface JoinFormProps {
  runCode: string;
  runName: string;
  currentUser: { id: string; displayName: string | null } | null;
}

export default function JoinForm({ runCode, runName, currentUser }: JoinFormProps) {

  const [name, setName] = useState(currentUser?.displayName ?? "");
  const [error, setError] = useState("");
  const [joined, setJoined] = useState<{ displayName: string; position: number } | null>(null);
  const addEntry = useAddQueueEntryMutation(runCode);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    setError("");

    try {
      const data = await addEntry.mutateAsync(trimmed);
      setJoined({ displayName: trimmed, position: data.position });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (joined) {
    const ahead = joined.position - 1;
    const isFirst = joined.position === 1;

    return (
      <div className="app-shell px-5">
        {/* Top context bar */}
        <div
          className="pt-10 flex items-center justify-between animate-fade-up"
          style={{ animationDelay: "0s" }}
        >
          <span className="font-display text-[11px] font-bold tracking-[0.16em] uppercase text-text-muted">
            {runName}
          </span>
          <span className="font-display text-[11px] font-bold tracking-[0.16em] uppercase text-accent">
            You&apos;re in
          </span>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <span
            className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-muted mb-3 animate-fade-up"
            style={{ animationDelay: "0.06s" }}
          >
            Queue position
          </span>

          {/* Number with glow */}
          <div
            className="relative flex items-center justify-center animate-fade-up"
            style={{ animationDelay: "0.12s" }}
          >
            <div className="absolute w-56 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            <span
              className={cn(
                "relative font-display font-black tracking-[-0.02em] leading-none",
                "text-[96px]",
                isFirst ? "text-accent" : "text-text-primary"
              )}
            >
              {ordinal(joined.position)}
            </span>
          </div>

          {/* Status line */}
          <span
            className={cn(
              "font-display text-[16px] font-black tracking-[0.08em] uppercase leading-none mt-3 animate-fade-up",
              isFirst ? "text-accent" : "text-text-secondary"
            )}
            style={{ animationDelay: "0.18s" }}
          >
            {isFirst
              ? "Next up"
              : `${ahead} ${ahead === 1 ? "player" : "players"} ahead`}
          </span>

          {/* Divider + name */}
          <div
            className="mt-10 w-full border-t border-border pt-5 flex items-center justify-center gap-2 animate-fade-up"
            style={{ animationDelay: "0.24s" }}
          >
            <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
              Playing as
            </span>
            <span className="font-display text-[13px] font-black tracking-[0.08em] uppercase text-text-primary">
              {joined.displayName}
            </span>
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          className="pb-12 animate-fade-up"
          style={{ animationDelay: "0.30s" }}
        >
          <Link href={`/runs/${runCode}/queue`}>
            <Button variant="primary" size="lg" className="w-full">
              View Queue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell px-5">
      <div className="pt-4 flex items-center">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-sm border border-border bg-bg-surface text-text-secondary transition-all hover:border-accent-dim hover:text-accent hover:bg-accent-glow"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
      </div>
      <div className="pt-8 flex flex-col gap-[2px] animate-fade-up">
        <p className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-accent mb-1">
          {runName}
        </p>
        <h1 className="font-display text-[52px] font-black tracking-[-0.01em] uppercase text-text-primary leading-none">
          Join
          <br />
          Queue
        </h1>
        <div className="w-12 h-0.5 bg-accent rounded-sm mt-2.5" />
        <p className="font-display text-[14px] font-bold tracking-[0.1em] uppercase text-text-muted mt-2.5">
          Enter your name to get in line
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-end pb-12">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div
            className="flex flex-col gap-1.5 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <label className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted pl-[2px]">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              autoFocus
              maxLength={50}
              className={inputClass}
              placeholder="e.g. Kobe"
            />
          </div>

          {error && (
            <p className="font-body text-[13px] text-danger animate-slide-in">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full animate-fade-up"
            style={{ animationDelay: "0.16s" }}
            disabled={addEntry.isPending}
          >
            {addEntry.isPending ? "Joining…" : "Join Queue"}
          </Button>

          {!currentUser && (
            <p
              className="text-center font-body text-[13px] text-text-muted animate-fade-up"
              style={{ animationDelay: "0.22s" }}
            >
              Already have an account?{" "}
              <Link
                href={`/login?next=/runs/${runCode}/join`}
                className="font-semibold text-text-secondary underline underline-offset-2 decoration-border hover:text-text-primary transition-colors"
              >
                Sign in
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
