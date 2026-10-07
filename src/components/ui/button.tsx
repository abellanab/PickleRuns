"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "icon" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "font-display uppercase transition-all duration-150",
          "flex items-center justify-center gap-2",
          "rounded-md",
          "disabled:cursor-not-allowed disabled:transform-none",
          {
            // Primary - accent background (forward action)
            "bg-accent text-bg font-extrabold tracking-[0.1em] hover:bg-[#d4f545] hover:-translate-y-px active:scale-98 disabled:bg-bg-hover disabled:text-text-muted disabled:border disabled:border-border":
              variant === "primary",
            // Secondary - surface background (reversible/supporting)
            "bg-bg-surface border border-border text-text-secondary font-bold tracking-[0.08em] hover:border-text-muted hover:text-text-primary":
              variant === "secondary",
            // Icon button
            "w-9 h-9 rounded-sm border border-border bg-bg-surface text-text-secondary flex items-center justify-center cursor-pointer transition-all duration-150 hover:border-accent-dim hover:text-accent hover:bg-accent-glow":
              variant === "icon",
            // Danger - destructive action
            "border border-[#ff4040] bg-[rgba(255,64,64,0.08)] text-[#ff6060] font-extrabold tracking-[0.1em] hover:bg-[rgba(255,64,64,0.16)] hover:text-[#ff8080]":
              variant === "danger",
            // Ghost - no background
            "bg-transparent text-accent-dim hover:text-accent":
              variant === "ghost",
          },
          {
            // Note: size only applies to secondary/ghost - primary/danger have fixed heights per docs
            "h-10 px-4 text-[11px]": size === "sm",
            "h-[40px] px-4 text-[13px]": size === "md",
            "h-[52px] px-5 text-[13px]": size === "lg",
          },
          // Primary/danger fixed heights per docs Section 12
          {
            "h-[52px] text-[16px]": variant === "primary" && size === "lg",
            "h-[52px] text-[15px]": variant === "danger" && size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
