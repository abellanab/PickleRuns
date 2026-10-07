"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/topbar";
import { Button } from "@/components/ui/button";
import { cn, generateRunCode } from "@/lib/utils";
import { useCreateRunMutation, type CreateRunPayload } from "@/hooks/use-run";
import { useHostStatus } from "@/hooks/use-host-request";

type RunMode = CreateRunPayload["runMode"];
type RotationStyle = CreateRunPayload["rotationStyle"];
type ScoreGoal = CreateRunPayload["scoreGoal"];

const RUN_MODES: { value: RunMode; title: string; description: string }[] = [
  { value: "score_only", title: "Score only", description: "Host sets matches per court and scores them" },
  { value: "queue_only", title: "Queue only", description: "Paddle-stack queue and court rotation, no points" },
  { value: "score_and_queue", title: "Score + queue", description: "Both" },
];

const ROTATION_OPTIONS: { value: RotationStyle; label: string }[] = [
  { value: "rotate_all", label: "Rotate all" },
  { value: "winner_stays", label: "Winner stays" },
];

const SCORE_GOALS: ScoreGoal[] = [11, 15];

const COURT_MIN = 1;
const COURT_MAX = 8;

const LABEL_CLASS = "font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted";

const toggleClass = (selected: boolean) =>
  cn(
    "flex-1 h-11 rounded-md border font-display text-[13px] font-bold tracking-[0.08em] uppercase transition-all duration-150",
    "flex items-center justify-center gap-1.5 active:scale-[0.98]",
    selected
      ? "border-border-accent bg-accent-glow text-accent"
      : "border-border bg-bg-surface text-text-secondary active:border-text-muted active:text-text-primary"
  );

const stepperButtonClass = cn(
  "w-11 h-11 flex-shrink-0 rounded-md border border-border bg-bg-surface",
  "font-display text-[22px] font-bold flex items-center justify-center transition-all duration-150",
  "disabled:text-text-muted disabled:cursor-not-allowed",
  "enabled:text-text-secondary enabled:active:border-text-muted enabled:active:text-text-primary enabled:active:scale-95"
);

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

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
  const [runMode, setRunMode] = useState<RunMode>("score_and_queue");
  const [courtCount, setCourtCount] = useState(1);
  const [rotationStyle, setRotationStyle] = useState<RotationStyle>("rotate_all");
  const [scoreGoal, setScoreGoal] = useState<ScoreGoal>(11);
  const [winByTwo, setWinByTwo] = useState(false);
  const createRun = useCreateRunMutation();

  const canSubmit = name.trim() !== "" && location.trim() !== "";

  const handleSubmit = () => {
    if (!canSubmit || createRun.isPending) return;

    createRun.mutate(
      {
        name: name.trim(),
        location: location.trim(),
        runMode,
        rotationStyle,
        courtCount,
        scoreGoal,
        winByTwo,
        sessionCode: generateRunCode(),
      },
      { onSuccess: (data) => router.push(`/runs/${data.sessionCode}/lobby`) }
    );
  };

  const CloseButton = (
    <button
      onClick={() => router.back()}
      className="w-11 h-11 rounded-sm border border-border bg-bg-surface text-text-secondary flex items-center justify-center cursor-pointer transition-all duration-150 active:border-accent-dim active:text-accent active:bg-accent-glow"
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
        label="PickleRuns"
        title="New Run"
        rightAction={CloseButton}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-5 py-6 flex flex-col gap-6 [animation:fade-up_0.3s_0.06s_ease-out_both]">

        {/* Run name + location — side-by-side on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Run Name</label>
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
            <label className={LABEL_CLASS}>Location</label>
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

        {/* Run mode */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>Run Mode</label>
          <div className="flex flex-col gap-2">
            {RUN_MODES.map((opt) => {
              const selected = runMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRunMode(opt.value)}
                  aria-pressed={selected}
                  className={cn(
                    "min-h-[56px] w-full rounded-md border px-3.5 py-2.5 text-left flex flex-col justify-center gap-0.5",
                    "transition-all duration-150 active:scale-[0.99]",
                    selected
                      ? "border-border-accent bg-accent-glow"
                      : "border-border bg-bg-surface active:border-text-muted"
                  )}
                >
                  <span
                    className={cn(
                      "font-display text-[15px] font-extrabold tracking-[0.03em] uppercase leading-none",
                      selected ? "text-accent" : "text-text-primary"
                    )}
                  >
                    {opt.title}
                  </span>
                  <span className="font-body text-[12px] text-text-muted">{opt.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Courts */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>Courts</label>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Fewer courts"
              onClick={() => setCourtCount((n) => Math.max(COURT_MIN, n - 1))}
              disabled={courtCount <= COURT_MIN}
              className={stepperButtonClass}
            >
              −
            </button>
            <div className="flex-1 h-11 rounded-md border border-border bg-bg-surface flex items-center justify-center gap-1.5">
              <span className="font-display text-[28px] font-black leading-none text-text-primary">
                {courtCount}
              </span>
              <span className="font-display text-[12px] font-bold tracking-[0.1em] uppercase text-text-muted pt-1">
                {courtCount === 1 ? "court" : "courts"}
              </span>
            </div>
            <button
              type="button"
              aria-label="More courts"
              onClick={() => setCourtCount((n) => Math.min(COURT_MAX, n + 1))}
              disabled={courtCount >= COURT_MAX}
              className={stepperButtonClass}
            >
              +
            </button>
          </div>
        </div>

        {/* Rotation */}
        {runMode !== "score_only" && (
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Rotation</label>
            <div className="flex gap-2">
              {ROTATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRotationStyle(opt.value)}
                  aria-pressed={rotationStyle === opt.value}
                  className={toggleClass(rotationStyle === opt.value)}
                >
                  {rotationStyle === opt.value && <CheckIcon />}
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="font-body text-[12px] text-text-muted">
              {rotationStyle === "rotate_all"
                ? "All four go to the back — winners queue ahead of losers, partners stay paired."
                : "Winner stays: winners stay on court, losers go to the back."}
            </span>
          </div>
        )}

        {/* Play to */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>Play to</label>
          <div className="flex gap-2">
            {SCORE_GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => setScoreGoal(goal)}
                aria-pressed={scoreGoal === goal}
                className={toggleClass(scoreGoal === goal)}
              >
                {scoreGoal === goal && <CheckIcon />}
                {goal}
              </button>
            ))}
          </div>
        </div>

        {/* Win by 2 */}
        <div className="flex flex-col gap-2">
          <div
            role="button"
            tabIndex={0}
            aria-pressed={winByTwo}
            onClick={() => setWinByTwo((v) => !v)}
            onKeyDown={(e) => e.key === "Enter" && setWinByTwo((v) => !v)}
            className={cn(
              "flex items-center justify-between rounded-md border bg-bg-surface px-3.5 py-3 min-h-[56px] cursor-pointer transition-all duration-150 select-none",
              winByTwo ? "border-border-accent" : "border-border active:border-text-muted"
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-[15px] font-extrabold tracking-[0.03em] uppercase text-text-primary leading-none">
                Win by 2
              </span>
              <span className="font-body text-[12px] text-text-muted">
                Game continues until one side leads by two
              </span>
            </div>
            {/* Toggle switch — purely visual, click handled by parent row */}
            <div
              className={cn(
                "w-11 h-[26px] rounded-full relative flex-shrink-0 ml-4 transition-all duration-200",
                winByTwo ? "bg-accent" : "bg-bg-hover border border-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full transition-all duration-200",
                  winByTwo ? "translate-x-[22px] bg-bg" : "translate-x-[3px] bg-text-muted"
                )}
              />
            </div>
          </div>
        </div>

        <div className="h-2 flex-shrink-0" />
      </div>

      <div className="px-4 sm:px-5 py-4 border-t border-border flex-shrink-0 flex flex-col gap-2 [animation:fade-up_0.3s_0.10s_ease-out_both]">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!canSubmit || createRun.isPending}
          onClick={handleSubmit}
        >
          {createRun.isPending ? "Creating..." : "Create Run"}
        </Button>
        {createRun.error && (
          <p role="alert" className="font-body text-[13px] text-danger text-center">
            {createRun.error.message}
          </p>
        )}
      </div>
    </div>
  );
}
