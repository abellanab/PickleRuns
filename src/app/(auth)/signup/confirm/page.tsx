import Link from "next/link";
import { Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

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

      <div className="flex-1 flex flex-col justify-center pb-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <div
            className="w-16 h-16 flex items-center justify-center rounded-lg border border-border-accent bg-accent-glow animate-fade-up"
          >
            <Mail className="w-7 h-7 text-accent" />
          </div>

          <div
            className="flex flex-col gap-2 animate-fade-up"
            style={{ animationDelay: "0.06s" }}
          >
            <h2 className="font-display text-[24px] font-black tracking-[-0.01em] uppercase text-text-primary leading-none">
              Check your email
            </h2>
            <p className="font-body text-[14px] text-text-secondary leading-relaxed max-w-[300px]">
              We sent a confirmation link to{" "}
              {email ? (
                <span className="font-semibold text-text-primary break-all">{email}</span>
              ) : (
                "your inbox"
              )}
              . Tap it to verify your account and get in the queue.
            </p>
          </div>

          <p
            className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            Didn&apos;t get it? Check your spam folder.
          </p>
        </div>
      </div>

      <div
        className="pb-12 flex items-center justify-center gap-1.5 animate-fade-up"
        style={{ animationDelay: "0.14s" }}
      >
        <span className="font-body text-[13px] text-text-muted">
          Already confirmed?
        </span>
        <Link
          href="/login"
          className="font-body text-[13px] font-semibold text-text-secondary underline underline-offset-2 decoration-border transition-colors hover:text-text-primary"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
