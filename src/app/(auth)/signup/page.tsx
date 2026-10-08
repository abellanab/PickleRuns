"use client";

import { Suspense, useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { signUp } from "@/app/(auth)/actions";

function SignupChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell px-5 overflow-y-auto">
      <div className="pt-4 flex items-center">
        <Link
          href="/login"
          className="w-9 h-9 flex items-center justify-center rounded-sm border border-border bg-bg-surface text-text-secondary transition-all hover:border-accent-dim hover:text-accent hover:bg-accent-glow"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
      </div>
      <div className="pt-6 flex flex-col items-center gap-[2px] animate-fade-up">
        <Link
          href="/"
          className="font-display text-[28px] font-black tracking-[-0.01em] uppercase text-text-primary leading-none transition-opacity hover:opacity-70"
        >
          PICKLERUNS
        </Link>
        <div className="w-12 h-0.5 bg-accent rounded-sm mt-2" />
      </div>
      {children}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupChrome>{null}</SignupChrome>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => signUp(_prev, formData),
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const intent = useSearchParams().get("intent") ?? "";

  return (
    <SignupChrome>
      <div className="flex-1 flex flex-col justify-end pb-12">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 animate-fade-up">
            <h2 className="font-display text-[20px] font-black tracking-[-0.01em] uppercase text-text-primary leading-none">
              Create Account
            </h2>
            <p className="font-display text-[13px] font-bold tracking-[0.1em] uppercase text-text-muted">
              Run your own court.
            </p>
          </div>

          <GoogleSignInButton label="Sign up with Google" intent={intent} />

          <div
            className="flex items-center gap-2.5 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex-1 h-px bg-border" />
            <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted">
              or
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="intent" value={intent} />
            <div className="flex flex-col gap-1.5 animate-fade-up" style={{ animationDelay: "0.14s" }}>
              <label className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted pl-[2px]">
                Display Name
              </label>
              <input
                name="displayName"
                type="text"
                autoComplete="nickname"
                required
                maxLength={32}
                className={cn(
                  "w-full h-13 bg-bg-surface border border-border rounded-md",
                  "px-3.5",
                  "font-display text-[18px] font-bold tracking-[0.06em] uppercase text-text-primary",
                  "outline-none transition-all duration-150",
                  "placeholder:text-text-muted placeholder:font-bold",
                  "focus:border-border-accent focus:bg-bg-hover"
                )}
                placeholder=""
              />
            </div>

            <div className="flex flex-col gap-1.5 animate-fade-up" style={{ animationDelay: "0.18s" }}>
              <label className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted pl-[2px]">
                Email
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className={cn(
                  "w-full h-13 bg-bg-surface border border-border rounded-md",
                  "px-3.5",
                  "font-body text-[15px] text-text-primary",
                  "outline-none transition-all duration-150",
                  "placeholder:text-text-muted",
                  "focus:border-border-accent focus:bg-bg-hover"
                )}
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5 animate-fade-up" style={{ animationDelay: "0.22s" }}>
              <label className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted pl-[2px]">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className={cn(
                    "w-full h-13 bg-bg-surface border border-border rounded-md",
                    "px-3.5 pr-11",
                    "font-body text-[15px] text-text-primary",
                    "outline-none transition-all duration-150",
                    "placeholder:text-text-muted",
                    "focus:border-border-accent focus:bg-bg-hover"
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {state?.error && (
              <p className="font-body text-[13px] text-danger animate-slide-in">
                {state.error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-14 mt-4 animate-fade-up"
              style={{ animationDelay: "0.26s" }}
              disabled={isPending}
            >
              {isPending ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <div
            className="flex items-center justify-center gap-1.5 pt-1 animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            <span className="font-body text-[13px] text-text-muted">
              Already have an account?
            </span>
            <Link
              href="/login"
              className="font-body text-[13px] font-semibold text-text-secondary underline underline-offset-2 decoration-border transition-colors hover:text-text-primary"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </SignupChrome>
  );
}
