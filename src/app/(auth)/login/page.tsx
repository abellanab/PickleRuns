"use client";

import { Suspense, useState } from "react";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signIn } from "@/app/(auth)/actions";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
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
          BALLRUNS
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

          <button
            disabled
            className="w-full h-14 flex items-center justify-center gap-3 rounded-md border border-border bg-bg-surface opacity-50 cursor-not-allowed animate-fade-up"
            style={{ animationDelay: "0.06s" }}
          >
            <GoogleIcon />
            <span className="font-display text-[14px] font-bold tracking-[0.08em] uppercase text-text-secondary">
              Sign in with Google
            </span>
          </button>

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
