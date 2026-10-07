"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlayerLiveView } from "@/components/ui/player-live-view";
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

  if (run.runMode === "score_only") {
    return (
      <div className="app-shell px-5">
        <div className="pt-10 flex flex-col items-center justify-center text-center gap-3">
          <span className="font-display text-[16px] font-black tracking-[0.06em] uppercase text-text-primary">
            This run has no queue
          </span>
          <span className="font-body text-[13px] text-text-muted">
            Ask the host to add you.
          </span>
          <Link
            href="/"
            className="mt-4 min-h-[44px] inline-flex items-center font-display text-[13px] font-bold tracking-[0.08em] uppercase text-accent underline underline-offset-2"
          >
            Back to home
          </Link>
        </div>
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
  const [entry, setEntry] = useState<{ id: string; displayName: string | null } | null>(null);
  const [storageChecked, setStorageChecked] = useState(false);
  const addEntry = useAddQueueEntryMutation(runCode, "self_join");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`pickleruns:entry:${runCode}`);
      if (stored) setEntry({ id: stored, displayName: null });
    } catch {
      // Storage can be blocked; fall through to the join form.
    }
    setStorageChecked(true);
  }, [runCode]);

  const handleEntryGone = useCallback(() => {
    try {
      localStorage.removeItem(`pickleruns:entry:${runCode}`);
    } catch {
      // Nothing to clear if storage is blocked.
    }
    setEntry(null);
  }, [runCode]);

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
      try {
        localStorage.setItem(`pickleruns:entry:${runCode}`, data.id);
      } catch {
        // Storage can be blocked; the player status banner simply won't show.
      }
      setEntry({ id: data.id, displayName: trimmed });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (!storageChecked) {
    return (
      <div className="app-shell px-5">
        <div className="pt-10 h-12 w-40 bg-bg-surface rounded-md animate-pulse" />
      </div>
    );
  }

  if (entry) {
    return (
      <PlayerLiveView
        runCode={runCode}
        runName={runName}
        entryId={entry.id}
        displayName={entry.displayName}
        onEntryGone={handleEntryGone}
      />
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
