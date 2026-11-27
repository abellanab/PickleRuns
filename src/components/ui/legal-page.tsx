import Link from "next/link";
import type { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  otherHref: "/privacy" | "/terms";
  otherLabel: string;
  children: ReactNode;
}

export function LegalPage({ title, lastUpdated, otherHref, otherLabel, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg-raised">
        <div className="mx-auto flex max-w-3xl items-center px-5">
          <Link
            href="/"
            className="flex min-h-[44px] items-center font-display text-[15px] font-black uppercase tracking-[0.08em] text-text-primary"
          >
            PickleRuns
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-[34px] font-black uppercase leading-[0.95] tracking-[-0.01em] text-text-primary">
          {title}
        </h1>
        <p className="mt-3 font-body text-[13px] text-text-muted">Last updated: {lastUpdated}</p>
        <div className="mt-8 flex flex-col gap-8">{children}</div>
      </main>
      <footer className="border-t border-border">
        <nav className="mx-auto flex max-w-3xl flex-wrap gap-x-6 px-5 py-4 font-body text-[14px]">
          <Link href={otherHref} className="flex min-h-[44px] items-center text-accent underline underline-offset-4">
            {otherLabel}
          </Link>
          <Link href="/" className="flex min-h-[44px] items-center text-accent underline underline-offset-4">
            Back to home
          </Link>
        </nav>
      </footer>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-[20px] font-black uppercase leading-[1.05] tracking-[0.01em] text-text-primary">
        {heading}
      </h2>
      <div className="flex flex-col gap-3 font-body text-[15px] leading-[1.55] text-text-secondary">{children}</div>
    </section>
  );
}
