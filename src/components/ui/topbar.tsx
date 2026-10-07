"use client";

import { cn } from "@/lib/utils";

interface TopbarProps {
  label: string;
  title: string;
  badge?: React.ReactNode;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export function Topbar({
  label,
  title,
  badge,
  onBack,
  rightAction,
  className,
}: TopbarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        "px-5 py-4 pb-3",
        "border-b border-border",
        "animate-fade-up",
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-text-muted">
          {label}
        </span>
        <span className="font-display text-[20px] font-extrabold tracking-[0.02em] uppercase text-text-primary leading-none">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {badge}
        {rightAction}
        {onBack && (
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-sm border border-border bg-bg-surface text-text-secondary flex items-center justify-center cursor-pointer transition-all duration-150 hover:border-accent-dim hover:text-accent hover:bg-accent-glow"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
