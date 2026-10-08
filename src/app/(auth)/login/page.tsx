"use client";

import { Suspense, useState } from "react";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { signIn } from "@/app/(auth)/actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const oauthError = ["callback_error", "oauth_start_failed"].includes(searchParams.get("error") ?? "");
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => signIn(_prev, formData),
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="app-shell px-5 overflow-y-auto">
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
      <div className="pt-6 flex flex-col items-center gap-[2px] animate-fade-up">
        <Link
          href="/"
          className="font-display text-[28px] font-black tracking-[-0.01em] uppercase text-text-primary leading-none transition-opacity hover:opacity-70"
        >
          PICKLERUNS
        </Link>
        <div className="w-12 h-0.5 bg-accent rounded-sm mt-2" />
      </div>

      <div className="flex-1 flex flex-col justify-end pb-12">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 animate-fade-up">
            <h2 className="font-display text-[20px] font-black tracking-[-0.01em] uppercase text-text-primary leading-none">
              Sign In
            </h2>
            <p className="font-display text-[13px] font-bold tracking-[0.1em] uppercase text-text-muted">
              Back on the court.
            </p>
          </div>

          <GoogleSignInButton label="Sign in with Google" next={next} />

          {oauthError && (
            <p className="font-body text-[13px] text-danger animate-slide-in">
              Google sign-in didn&apos;t complete. Please try again.
            </p>
          )}

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
            <input type="hidden" name="next" value={next} />

            <div className="flex flex-col gap-1.5 animate-fade-up" style={{ animationDelay: "0.14s" }}>
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

            <div className="flex flex-col gap-1.5 animate-fade-up" style={{ animationDelay: "0.18s" }}>
              <label className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted pl-[2px]">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
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
              style={{ animationDelay: "0.22s" }}
              disabled={isPending}
            >
              {isPending ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="app-shell" />}>
      <LoginForm />
    </Suspense>
  );
}
