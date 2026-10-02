"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useRuns, type RunSummary } from "@/hooks/use-run";

type Filter = "all" | "created" | "joined";
type PageState = "pending" | "ready";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

function InlineStatus({ status }: { status: RunSummary["status"] }) {
  if (status === "active") {
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-[6px] h-[6px] rounded-full bg-[#3ddc84] flex-shrink-0 animate-pulse" />
        <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-[#3ddc84]">Live</span>
      </div>
    );
  }
  if (status === "lobby") {
    return (
      <span className="font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted flex-shrink-0">
        Lobby
      </span>
    );
  }
  return null;
}

const CREATED_COLOR = "#d4f545";
const JOINED_COLOR = "#f5a842";

export default function HistoryPage() {
  const router = useRouter();
  const { data: queryData, isPending } = useRuns();
  const [filter, setFilter] = useState<Filter>("all");

  const pageState: PageState = isPending ? "pending" : "ready";
  const runs = useMemo<RunSummary[]>(() => {
    if (!queryData) return [];
    return [...queryData].sort((a, b) => {
      const aActive = a.status === "active" || a.status === "lobby" ? 0 : 1;
      const bActive = b.status === "active" || b.status === "lobby" ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [queryData]);

  const counts = useMemo(() => ({
    all: runs.length,
    created: runs.filter(r => r.isHost).length,
    joined: runs.filter(r => !r.isHost).length,
  }), [runs]);

  const filtered = runs.filter((r) => {
    if (filter === "created") return r.isHost;
    if (filter === "joined") return !r.isHost;
    return true;
  });

  const hasActive = filtered.some(r => r.status === "active" || r.status === "lobby");

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "created", label: "Created" },
    { key: "joined", label: "Joined" },
  ];

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 flex items-center justify-center rounded-sm border border-border bg-bg-surface text-text-secondary transition-all hover:border-accent-dim hover:text-accent hover:bg-accent-glow"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className="flex flex-col gap-[3px]">
            <span className="font-display text-[22px] font-extrabold tracking-[0.04em] uppercase text-text-primary leading-none">
              History
            </span>
            <div className="w-7 h-[2px] bg-accent rounded-sm" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-4 pb-1">
          <div className="flex bg-bg-surface border border-border rounded-md p-[3px]">
            {filters.map(({ key, label }) => {
              const count = counts[key];
              const isActive = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={[
                    "flex-1 flex items-center justify-center gap-1.5 py-[7px] rounded transition-all duration-150",
                    "font-display text-[12px] font-bold tracking-[0.12em] uppercase",
                    isActive
                      ? "bg-bg-hover text-text-primary"
                      : "text-text-muted hover:text-text-secondary",
                  ].join(" ")}
                >
                  {label}
                  {pageState === "ready" && count > 0 && (
                    <span
                      className={[
                        "text-[10px] font-bold leading-none px-[5px] py-[3px] rounded-sm",
                        isActive ? "bg-accent/15 text-accent" : "bg-bg-hover text-text-muted",
                      ].join(" ")}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 pt-3 pb-10">
          {pageState === "pending" && (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[80px] rounded-md border border-border bg-bg-surface animate-pulse"
                  style={{ animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          )}

          {pageState === "ready" && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="w-14 h-14 flex items-center justify-center rounded-full border border-border bg-bg-surface">
                <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 text-text-muted/50" stroke="currentColor" strokeLinecap="round">
                  <circle cx="16" cy="16" r="12" strokeWidth="1.5" />
                  <path d="M16 4 C16 4 11.5 10 11.5 16 C11.5 22 16 28 16 28" strokeWidth="1.2" />
                  <path d="M16 4 C16 4 20.5 10 20.5 16 C20.5 22 16 28 16 28" strokeWidth="1.2" />
                  <path d="M4 16 L28 16" strokeWidth="1.2" />
                  <path d="M5.5 11 Q16 14 26.5 11" strokeWidth="1.2" />
                  <path d="M5.5 21 Q16 18 26.5 21" strokeWidth="1.2" />
                </svg>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="font-display text-[15px] font-bold tracking-[0.08em] uppercase text-text-secondary">
                  {filter === "all" ? "No runs yet" : filter === "created" ? "No runs created" : "No runs joined"}
                </span>
                <span className="font-body text-[13px] text-text-muted">
                  {filter === "created" ? "Runs you host will appear here" : filter === "joined" ? "Runs you joined will appear here" : "Start a run to see it here"}
                </span>
              </div>
            </div>
          )}

          {pageState === "ready" && filtered.length > 0 && (
            <div className="flex flex-col gap-2">
              {filtered.map((run, i) => {
                const prevRun = filtered[i - 1];
                const isActiveRun = run.status === "active" || run.status === "lobby";
                const isFirstActive = isActiveRun && i === 0;
                const isFirstCompleted = run.status === "completed" && prevRun?.status !== "completed" && hasActive;
                const roleColor = run.isHost ? CREATED_COLOR : JOINED_COLOR;

                return (
                  <Fragment key={run.id}>
                    {isFirstActive && (
                      <div className="flex items-center gap-2 pb-1">
                        <span className="w-[5px] h-[5px] rounded-full bg-[#3ddc84] flex-shrink-0 animate-pulse" />
                        <span className="font-display text-[10px] font-bold tracking-[0.18em] uppercase text-[#3ddc84]/80">
                          On The Court
                        </span>
                      </div>
                    )}
                    {isFirstCompleted && (
                      <div className="flex items-center gap-3 pt-3 pb-1">
                        <div className="flex-1 h-px bg-border" />
                        <span className="font-display text-[10px] font-bold tracking-[0.18em] uppercase text-text-muted">
                          Completed
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}
                    <button
                      onClick={() => router.push(`/runs/${run.sessionCode}/lobby`)}
                      className="w-full flex gap-0 rounded-md border border-border bg-bg-surface hover:bg-bg-hover text-left transition-colors overflow-hidden animate-fade-up"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      {/* Role accent bar */}
                      <div
                        className="w-[3px] flex-shrink-0"
                        style={{ backgroundColor: roleColor }}
                      />

                      <div className="flex flex-col gap-2 px-4 py-4 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-display text-[20px] font-extrabold tracking-[0.02em] uppercase text-text-primary leading-none truncate">
                            {run.name}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <InlineStatus status={run.status} />
                            <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Role pill */}
                          <span
                            className="font-display text-[10px] font-bold tracking-[0.14em] uppercase px-1.5 py-0.5 rounded"
                            style={{
                              color: roleColor,
                              backgroundColor: `${roleColor}18`,
                            }}
                          >
                            {run.isHost ? "Host" : "Joined"}
                          </span>

                          {run.location && (
                            <>
                              <span className="text-border/60 select-none text-[10px]">·</span>
                              <span className="font-display text-[11px] font-bold tracking-[0.1em] uppercase text-text-muted">{run.location}</span>
                            </>
                          )}
                          <span className="text-border/60 select-none text-[10px]">·</span>
                          <span className="font-display text-[11px] font-bold tracking-[0.1em] uppercase text-text-muted">{formatDate(run.createdAt)}</span>
                          {run.gameCount > 0 && (
                            <>
                              <span className="text-border/60 select-none text-[10px]">·</span>
                              <span className="font-display text-[11px] font-bold tracking-[0.1em] uppercase text-text-muted">
                                {run.gameCount} {run.gameCount === 1 ? "Game" : "Games"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
