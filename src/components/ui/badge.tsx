"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "live" | "accent";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "font-display text-[12px] font-bold tracking-[0.1em] uppercase",
        "px-2.5 py-1 rounded",
        "flex items-center gap-1.25",
        className
      )}
    >
      {variant === "live" && (
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-live-pulse flex-shrink-0" />
      )}
      {children}
    </span>
  );
}

interface LiveBadgeProps {
  className?: string;
}

export function LiveBadge({ className }: LiveBadgeProps) {
  return (
    <Badge
      variant="live"
      className={cn(
        "text-accent bg-accent-glow border border-border-accent",
        className
      )}
    >
      Live
    </Badge>
  );
}

interface GameBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function GameBadge({ children, className }: GameBadgeProps) {
  return (
    <Badge
      className={cn(
        "text-text-secondary bg-bg-surface border border-border",
        className
      )}
    >
      {children}
    </Badge>
  );
}
