"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/topbar";
import { Button } from "@/components/ui/button";
import { cn, generateRunCode } from "@/lib/utils";
import { useCreateRunMutation } from "@/hooks/use-run";
import { useHostStatus } from "@/hooks/use-host-request";

type Format = "winner_stays" | "new_ten";
type PointSystem = "one_two" | "two_three";

const TIME_OPTIONS = [
  { label: "10 min", value: 600 },
  { label: "15 min", value: 900 },
  { label: "20 min", value: 1200 },
  { label: "30 min", value: 1800 },
];

const SCORE_MIN = 5;
const SCORE_MAX = 50;

export default function CreateRunPage() {
  const router = useRouter();
  const { data: hostStatus, isLoading: hostStatusLoading } = useHostStatus();

  useEffect(() => {
    if (!hostStatusLoading && hostStatus !== "approved") {
      router.replace("/dashboard");
    }
  }, [hostStatusLoading, hostStatus, router]);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [format, setFormat] = useState<Format>("new_ten");
  const [pointSystem, setPointSystem] = useState<PointSystem>("two_three");
  const [scoreGoal, setScoreGoal] = useState(21);
  const [scoreAnimating, setScoreAnimating] = useState(false);
  const [timeLimitOn, setTimeLimitOn] = useState(false);
  const [selectedTimeSeconds, setSelectedTimeSeconds] = useState(900);
  const createRun = useCreateRunMutation();

  const canSubmit = name.trim() !== "" && location.trim() !== "";

  const bumpScore = useCallback((next: number) => {
    setScoreGoal(next);
    setScoreAnimating(true);
    setTimeout(() => setScoreAnimating(false), 150);
  }, []);

  const handleDecrement = () => {
    if (scoreGoal > SCORE_MIN) bumpScore(scoreGoal - 1);
  };

  const handleIncrement = () => {
    if (scoreGoal < SCORE_MAX) bumpScore(scoreGoal + 1);
  };

  const handleSubmit = () => {
    if (!canSubmit || createRun.isPending) return;

    const payload = {
      name: name.trim(),
      location: location.trim(),
      format,
      scoreGoal,
      pointSystem,
      sessionCode: generateRunCode(),
      ...(timeLimitOn ? { timeLimitSeconds: selectedTimeSeconds } : {}),
    };

    createRun.mutate(payload, {
      onSuccess: (data) => router.push(`/runs/${data.sessionCode}/lobby`),
    });
  };

  const CloseButton = (
    <button
      onClick={() => router.back()}
      className="w-9 h-9 rounded-sm border border-border bg-bg-surface text-text-secondary flex items-center justify-center cursor-pointer transition-all duration-150 hover:border-accent-dim hover:text-accent hover:bg-accent-glow"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );

  if (hostStatusLoading || hostStatus !== "approved") {
    return <div className="app-shell h-[100dvh] flex items-center justify-center" />;
  }

  return (
    <div className="app-shell h-[100dvh] overflow-hidden flex flex-col">
      <Topbar
        label="BallRuns"
        title="New Run"
        rightAction={CloseButton}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-5 py-6 flex flex-col gap-6 [animation:fade-up_0.3s_0.06s_ease-out_both]">

        {/* Run name + location — side-by-side on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
              Run Name
            </label>
            <input
              type="text"
              placeholder="Friday Run"
              maxLength={32}
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              className={cn(
                "h-12 w-full rounded-md border border-border bg-bg-surface",
                "px-3.5 font-display text-[17px] font-bold tracking-[0.02em] uppercase text-text-primary placeholder:text-text-muted placeholder:font-semibold",
                "outline-none transition-all duration-150 caret-accent",
                "focus:border-border-accent focus:bg-bg-hover"
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
              Location
            </label>
            <input
              type="text"
              placeholder="Rucker Park"
              maxLength={32}
              value={location}
              onChange={(e) => setLocation(e.target.value.toUpperCase())}
              className={cn(
                "h-12 w-full rounded-md border border-border bg-bg-surface",
                "px-3.5 font-display text-[17px] font-bold tracking-[0.02em] uppercase text-text-primary placeholder:text-text-muted placeholder:font-semibold",
                "outline-none transition-all duration-150 caret-accent",
                "focus:border-border-accent focus:bg-bg-hover"
              )}
            />
          </div>
        </div>

        {/* Format */}
        <div className="flex flex-col gap-1.5">
          <label className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
            Format
          </label>
          <div className="flex gap-2">
            {(
              [
                { value: "new_ten", label: "Rotation" },
                { value: "winner_stays", label: "Winner Stays" },
              ] as { value: Format; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFormat(opt.value)}
                className={cn(
                  "flex-1 h-10 rounded-md border font-display text-[13px] font-bold tracking-[0.08em] uppercase transition-all duration-150",
                  "flex items-center justify-center gap-1.5",
                  format === opt.value
                    ? "border-border-accent bg-accent-glow text-accent"
                    : "border-border bg-bg-surface text-text-secondary hover:border-text-muted hover:text-text-primary"
                )}
              >
                {format === opt.value && (
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Point system */}
        <div className="flex flex-col gap-1.5">
          <label className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
            Point System
          </label>
          <div className="flex gap-2">
            {(
              [
                { value: "one_two" as const, label: "1s & 2s" },
                { value: "two_three" as const, label: "2s & 3s" },
              ] as { value: PointSystem; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPointSystem(opt.value)}
                className={cn(
                  "flex-1 h-10 rounded-md border font-display text-[13px] font-bold tracking-[0.08em] uppercase transition-all duration-150",
                  "flex items-center justify-center gap-1.5",
                  pointSystem === opt.value
                    ? "border-border-accent bg-accent-glow text-accent"
                    : "border-border bg-bg-surface text-text-secondary hover:border-text-muted hover:text-text-primary"
                )}
              >
                {pointSystem === opt.value && (
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Score goal */}
        <div className="flex flex-col gap-1.5">
          <label className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
            Score Goal
          </label>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDecrement}
              disabled={scoreGoal <= SCORE_MIN}
              className={cn(
                "w-11 h-11 flex-shrink-0 rounded-md border border-border bg-bg-surface",
                "font-display text-[22px] font-bold flex items-center justify-center transition-all duration-150",
                "disabled:text-text-muted disabled:cursor-not-allowed",
                "enabled:text-text-secondary enabled:hover:border-text-muted enabled:hover:text-text-primary enabled:active:scale-95"
              )}
            >
              −
            </button>
            <div className="flex-1 h-11 rounded-md border border-border bg-bg-surface flex items-center justify-center gap-1.5">
              <span
                className="font-display text-[28px] font-black leading-none text-text-primary transition-transform duration-100"
                style={{ transform: scoreAnimating ? "scale(1.15)" : "scale(1)", color: scoreAnimating ? "var(--accent)" : undefined }}
              >
                {scoreGoal}
              </span>
              <span className="font-display text-[12px] font-bold tracking-[0.1em] uppercase text-text-muted pt-1">
                pts
              </span>
            </div>
            <button
              onClick={handleIncrement}
              disabled={scoreGoal >= SCORE_MAX}
              className={cn(
                "w-11 h-11 flex-shrink-0 rounded-md border border-border bg-bg-surface",
                "font-display text-[22px] font-bold flex items-center justify-center transition-all duration-150",
                "disabled:text-text-muted disabled:cursor-not-allowed",
                "enabled:text-text-secondary enabled:hover:border-text-muted enabled:hover:text-text-primary enabled:active:scale-95"
              )}
            >
              +
            </button>
          </div>
        </div>

        {/* Time limit */}
        <div className="flex flex-col gap-2">
          <label className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
            Time Limit
          </label>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setTimeLimitOn((v) => !v)}
            onKeyDown={(e) => e.key === "Enter" && setTimeLimitOn((v) => !v)}
            className={cn(
              "flex items-center justify-between rounded-md border bg-bg-surface px-3.5 py-3 cursor-pointer transition-all duration-150 select-none",
              timeLimitOn ? "border-border-accent" : "border-border hover:border-text-muted"
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-[15px] font-extrabold tracking-[0.03em] uppercase text-text-primary leading-none">
                Game Clock
              </span>
              <span className="font-body text-[12px] text-text-muted">
                Set a time limit per game
              </span>
            </div>
            {/* Toggle switch — purely visual, click handled by parent row */}
            <div
              className={cn(
                "w-11 h-[26px] rounded-full relative flex-shrink-0 ml-4 transition-all duration-200",
                timeLimitOn ? "bg-accent" : "bg-bg-hover border border-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full transition-all duration-200",
                  timeLimitOn ? "translate-x-[22px] bg-bg" : "translate-x-[3px] bg-text-muted"
                )}
              />
            </div>
          </div>

          {timeLimitOn && (
            <div className="flex gap-2">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedTimeSeconds(opt.value)}
                  className={cn(
                    "flex-1 h-10 rounded-md border font-display text-[13px] font-bold tracking-[0.08em] uppercase transition-all duration-150",
                    selectedTimeSeconds === opt.value
                      ? "border-border-accent bg-accent-glow text-accent"
                      : "border-border bg-bg-surface text-text-secondary hover:border-text-muted hover:text-text-primary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-2 flex-shrink-0" />
      </div>

      <div className="px-4 sm:px-5 py-4 border-t border-border flex-shrink-0 [animation:fade-up_0.3s_0.10s_ease-out_both]">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!canSubmit || createRun.isPending}
          onClick={handleSubmit}
        >
          {createRun.isPending ? "Creating..." : "Create Run"}
        </Button>
      </div>
    </div>
  );
}
