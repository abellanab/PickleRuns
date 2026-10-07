"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Check } from "lucide-react";
import { deriveInitials } from "@/lib/utils";
import { Topbar } from "@/components/ui/topbar";
import HostRequestSheet from "@/components/ui/HostRequestSheet";
import { useHostStatus } from "@/hooks/use-host-request";
import { signOut } from "@/app/(auth)/actions";

type InitialUser = {
  id: string;
  email: string;
  metadata: Record<string, unknown> | undefined;
};

export type AccountClientProps = {
  initialUser: InitialUser;
};

const LABEL_CLASS =
  "font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted";

export default function AccountClient({ initialUser }: AccountClientProps) {
  const router = useRouter();
  const [showSheet, setShowSheet] = useState(false);
  const { data: hostStatus, isError, refetch } = useHostStatus();

  const initials = deriveInitials(initialUser.metadata, initialUser.email);
  const metaName = initialUser.metadata?.displayName;
  const displayName = typeof metaName === "string" ? metaName : "";

  const isPending = hostStatus === "pending";
  const isApproved = hostStatus === "approved";
  const canRequest = !isPending && !isApproved;

  return (
    <div className="app-shell">
      <Topbar label="Your profile" title="Account" onBack={() => router.push("/dashboard")} />

      <div className="flex flex-col gap-6 px-5 pt-6 pb-10">
        <div className="flex items-center gap-4 animate-fade-up">
          <div className="w-16 h-16 flex-shrink-0 rounded-full bg-bg-hover border border-border-accent flex items-center justify-center font-display text-[22px] font-extrabold tracking-[0.04em] text-accent">
            {initials}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            {displayName && (
              <span className="font-display text-[20px] font-extrabold tracking-[0.02em] uppercase text-text-primary leading-none truncate">
                {displayName}
              </span>
            )}
            <span className="font-body text-[13px] text-text-muted truncate">
              {initialUser.email}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <span className={LABEL_CLASS}>Hosting</span>
          <div className="flex flex-col gap-4 px-[18px] py-4 rounded-md border border-border bg-bg-surface">
            {isPending && (
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 flex-shrink-0 text-text-muted" />
                <span className="font-body text-[14px] text-text-secondary leading-[1.5]">
                  Host request pending — we&apos;ll approve it soon
                </span>
              </div>
            )}

            {isApproved && (
              <>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 flex-shrink-0 text-accent" />
                  <span className="font-body text-[14px] text-text-secondary leading-[1.5]">
                    You&apos;re approved to host
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/create-run")}
                  className="w-full h-12 flex items-center justify-center rounded-md bg-accent text-bg font-display text-[15px] font-extrabold tracking-[0.1em] uppercase transition-all duration-150 hover:-translate-y-px hover:bg-[#d4f545] active:scale-[0.98]"
                >
                  Start a run
                </button>
              </>
            )}

            {canRequest && (
              <>
                <span className="font-body text-[14px] text-text-secondary leading-[1.5]">
                  {hostStatus === "denied"
                    ? "Your last request wasn't approved. You can send a new request."
                    : "Hosting is approval-gated. Send a quick request and we'll get you set up."}
                </span>
                {isError && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-body text-[13px] text-[#ff6060]">
                      Couldn&apos;t load your host status.
                    </span>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="h-11 px-3 flex items-center justify-center font-display text-[13px] font-bold tracking-[0.08em] uppercase text-accent"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowSheet(true)}
                  className="w-full h-12 flex items-center justify-center rounded-md bg-accent text-bg font-display text-[15px] font-extrabold tracking-[0.1em] uppercase transition-all duration-150 hover:-translate-y-px hover:bg-[#d4f545] active:scale-[0.98]"
                >
                  {hostStatus === "denied" ? "Request again" : "Request to host"}
                </button>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="w-full h-12 flex items-center justify-center rounded-md border border-danger/40 bg-danger/[0.06] text-[#ff6060] font-display text-[13px] font-black tracking-[0.08em] uppercase transition-all hover:bg-danger/[0.12] animate-fade-up"
          style={{ animationDelay: "0.16s" }}
        >
          Sign out
        </button>
      </div>

      <HostRequestSheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        defaultName={displayName}
      />
    </div>
  );
}
