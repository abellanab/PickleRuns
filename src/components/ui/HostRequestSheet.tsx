"use client";

import { useState, type FormEvent } from "react";
import { useRequestHostMutation } from "@/hooks/use-host-request";

export type HostRequestSheetProps = {
  open: boolean;
  onClose: () => void;
  defaultName: string;
};

function HostRequestForm({ onClose, defaultName }: Omit<HostRequestSheetProps, "open">) {
  const [hostName, setHostName] = useState(defaultName.slice(0, 50));
  const requestHost = useRequestHostMutation();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const displayName = hostName.trim();
    if (displayName.length === 0 || requestHost.isPending) return;
    requestHost.mutate({ displayName }, { onSuccess: onClose });
  }

  return (
    <>
      <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[111] flex items-center justify-center px-5">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[320px] bg-bg-raised border border-border rounded-xl p-6 flex flex-col gap-5 animate-slide-up"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="font-display text-[16px] font-black tracking-[0.06em] uppercase text-text-primary">
                Request to Host
              </span>
              <span className="font-body text-[13px] text-text-secondary leading-[1.5]">
                Tell us your name so we know who is asking.
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex-shrink-0 w-11 h-11 -mt-2 -mr-2 flex items-center justify-center rounded-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              maxLength={50}
              placeholder="Your name"
              aria-label="Your name"
              autoComplete="name"
              className="w-full h-11 px-3 rounded-md border border-border bg-bg-surface font-body text-[15px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            />
            {requestHost.isError && (
              <span role="alert" className="font-body text-[13px] text-[#ff6060]">
                {requestHost.error.message}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              type="submit"
              disabled={requestHost.isPending || hostName.trim().length === 0}
              className="w-full h-11 flex items-center justify-center rounded-md bg-accent text-bg font-display text-[13px] font-black tracking-[0.08em] uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {requestHost.isPending ? "Sending…" : "Send"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 flex items-center justify-center rounded-md border border-border bg-bg-surface text-text-secondary font-display text-[13px] font-bold tracking-[0.08em] uppercase transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function HostRequestSheet({ open, onClose, defaultName }: HostRequestSheetProps) {
  if (!open) return null;
  return <HostRequestForm onClose={onClose} defaultName={defaultName} />;
}
