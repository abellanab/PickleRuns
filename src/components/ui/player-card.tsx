"use client";

import { cn } from "@/lib/utils";

interface PlayerCardProps {
  name: string;
  points?: number;
  games?: number;
  position?: number;
  time?: string;
  onClick?: () => void;
  onRemove?: () => void;
  onMore?: () => void;
  variant?: "queue" | "game" | "result" | "assignment";
  justScored?: boolean;
  markedOut?: boolean;
  draggable?: boolean;
  className?: string;
}

export function PlayerCard({
  name,
  points,
  games,
  position,
  time,
  onClick,
  onRemove,
  onMore,
  variant = "queue",
  justScored = false,
  markedOut = false,
  draggable = false,
  className,
}: PlayerCardProps) {
  const baseClasses = cn(
    "bg-bg-surface border border-border rounded-md",
    "flex items-center gap-2.5",
    "transition-all duration-120",
    "relative overflow-hidden",
    "-webkit-tap-highlight-transparent",
    {
      "p-2.5 cursor-pointer": variant === "queue" || variant === "assignment",
      "p-3 cursor-pointer": variant === "game",
      "p-2": variant === "result",
      "opacity-45": markedOut,
      "border-accent bg-[rgba(200,241,53,0.25)]": justScored,
    },
    className
  );

  const hoverClasses = cn({
    "hover:border-border-accent hover:-translate-y-px":
      variant === "queue" || variant === "game" || variant === "assignment",
    "hover:bg-accent-glow": variant === "game",
  });

  return (
    <div
      className={cn(baseClasses, hoverClasses)}
      onClick={onClick}
      draggable={draggable}
    >
      {/* Drag handle for assignment/queue */}
      {draggable && (
        <div className="text-text-muted flex items-center cursor-grab active:cursor-grabbing">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-2.5 h-2.5"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </div>
      )}

      {/* Position number */}
      {position !== undefined && variant === "queue" && (
        <span
          className={cn(
            "font-display text-[13px] font-extrabold tracking-[0.04em] text-text-muted w-5 text-center flex-shrink-0 leading-none",
            variant === "queue" && "text-accent-dim"
          )}
        >
          {position}
        </span>
      )}

      {/* Player info */}
      <div className="flex flex-col gap-px flex-1 min-w-0">
        <span
          className={cn(
            "font-display font-extrabold uppercase leading-none text-text-primary text-truncate",
            {
              "text-[16px] tracking-[0.03em]":
                variant === "queue" || variant === "assignment",
              "text-[15px] tracking-[0.03em]": variant === "game",
              "text-[13px] tracking-[0.03em]": variant === "result",
            }
          )}
        >
          {name}
        </span>

        {/* Variant-specific secondary info */}
        {variant === "queue" && time && (
          <span className="font-display text-[11px] font-semibold tracking-[0.08em] uppercase text-text-muted flex-shrink-0">
            {time}
          </span>
        )}

        {variant === "game" && (
          <span className="font-display text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted">
            pts
          </span>
        )}

        {variant === "result" && (
          <span className="font-display text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted">
            pts
          </span>
        )}

        {variant === "assignment" && (
          <span className="font-display text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted">
            Drag to balance
          </span>
        )}
      </div>

      {/* Points display (game/result variants) */}
      {(variant === "game" || variant === "result") && points !== undefined && (
        <span
          className={cn(
            "font-display font-black leading-none flex-shrink-0 transition-colors",
            {
              "text-[22px] tracking-[-0.01em] text-text-secondary":
                variant === "game",
              "text-[20px] tracking-[-0.01em]": variant === "result",
              "text-accent transform scale-115": justScored,
              "text-text-muted text-[16px]": variant === "result" && points === 0,
            }
          )}
        >
          {points}
        </span>
      )}

      {/* Games played (queue variant) */}
      {variant === "queue" && games !== undefined && (
        <span className="font-display text-[12px] font-semibold tracking-[0.06em] text-text-muted flex-shrink-0 whitespace-nowrap">
          {games} {games === 1 ? "game" : "games"}
        </span>
      )}

      {/* Move button (assignment variant) */}
      {variant === "assignment" && onMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMore();
          }}
          className="w-6 h-6 rounded-sm border border-border bg-bg-hover text-text-muted flex items-center justify-center cursor-pointer transition-all duration-120 hover:border-text-muted hover:text-text-secondary"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-2.75 h-2.75"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Remove button (queue variant) */}
      {variant === "queue" && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="w-7 h-7 rounded-sm border border-border bg-bg-hover text-text-muted flex items-center justify-center cursor-pointer transition-all duration-120 hover:border-text-muted hover:text-text-secondary"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* More button (queue context menu) */}
      {variant === "queue" && onMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMore();
          }}
          className="w-7.5 h-7.5 rounded-sm border border-border bg-bg-hover text-text-muted flex items-center justify-center cursor-pointer transition-all duration-120 hover:border-text-muted hover:text-text-secondary"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.25 h-3.25"
          >
            <circle cx="12" cy="5" r="1" fill="currentColor" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <circle cx="12" cy="19" r="1" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
}
