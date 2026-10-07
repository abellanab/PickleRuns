"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  valueA: number;
  valueB: number;
  goal: number;
  labelA?: string;
  labelB?: string;
  className?: string;
}

export function ProgressBar({
  valueA,
  valueB,
  labelA,
  labelB,
  className,
}: ProgressBarProps) {
  const total = valueA + valueB;
  const pctA = total > 0 ? (valueA / total) * 100 : 50;
  const pctB = total > 0 ? (valueB / total) * 100 : 50;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(labelA || labelB) && (
        <div className="flex justify-between items-center">
          {labelA && (
            <span className="font-display text-[11px] font-bold tracking-[0.1em] uppercase text-text-muted">
              {labelA}
            </span>
          )}
          {labelB && (
            <span className="font-display text-[11px] font-bold tracking-[0.1em] uppercase text-text-muted">
              {labelB}
            </span>
          )}
        </div>
      )}
      <div className="h-1.5 bg-bg-surface rounded-sm flex gap-0.5 overflow-hidden">
        <div
          className="h-full bg-accent rounded-l-sm transition-all duration-300 ease-out"
          style={{ width: `${pctA}%` }}
        />
        <div
          className="h-full bg-text-secondary rounded-r-sm transition-all duration-300 ease-out"
          style={{ width: `${pctB}%` }}
        />
      </div>
    </div>
  );
}

interface BalanceBarProps {
  countA: number;
  countB: number;
  labelA: string;
  labelB: string;
  className?: string;
}

export function BalanceBar({
  countA,
  countB,
  labelA,
  labelB,
  className,
}: BalanceBarProps) {
  const total = countA + countB;
  const pctA = total > 0 ? (countA / total) * 100 : 50;
  const pctB = total > 0 ? (countB / total) * 100 : 50;
  const diff = Math.abs(countA - countB);

  let statusText = "Even split";
  let statusColor = "text-accent-dim";

  if (diff === 1) {
    statusText = "Off by one";
    statusColor = "text-text-muted";
  } else if (diff > 1) {
    statusText = `${diff} apart`;
    statusColor = "text-[#ff6b35]";
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-px">
          <span
            className={cn(
              "font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted",
              countA > countB && "text-accent-dim"
            )}
          >
            {labelA}
          </span>
          <span
            className={cn(
              "font-display text-[28px] font-black tracking-[-0.02em] leading-none transition-colors",
              diff > 1 && countA > countB ? "text-[#ff6b35]" : "text-text-secondary",
              countA <= countB && diff <= 1 && "text-text-secondary",
              countA === total / 2 && total % 2 === 0 && "text-accent"
            )}
          >
            {countA}
          </span>
        </div>
        <span className="font-display text-[13px] font-bold tracking-[0.1em] uppercase text-text-muted">
          vs
        </span>
        <div className="flex flex-col gap-px items-end">
          <span
            className={cn(
              "font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted",
              countB > countA && "text-accent-dim"
            )}
          >
            {labelB}
          </span>
          <span
            className={cn(
              "font-display text-[28px] font-black tracking-[-0.02em] leading-none transition-colors",
              diff > 1 && countB > countA ? "text-[#ff6b35]" : "text-text-secondary",
              countB <= countA && diff <= 1 && "text-text-secondary",
              countB === total / 2 && total % 2 === 0 && "text-accent"
            )}
          >
            {countB}
          </span>
        </div>
      </div>
      <div className="h-1 bg-bg-surface rounded-sm flex overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out rounded-l-sm"
          style={{ width: `${pctA}%` }}
        />
        <div
          className="h-full bg-text-secondary transition-all duration-300 ease-out rounded-r-sm"
          style={{ width: `${pctB}%` }}
        />
      </div>
      <span
        className={cn(
          "font-display text-[11px] font-bold tracking-[0.1em] uppercase text-center transition-colors",
          statusColor
        )}
      >
        {statusText}
      </span>
    </div>
  );
}
