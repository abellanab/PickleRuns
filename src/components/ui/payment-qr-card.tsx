"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface PaymentQrCardProps {
  url: string;
  caption?: string;
  compact?: boolean;
}

export function PaymentQrCard({ url, caption, compact = false }: PaymentQrCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={cn("flex flex-col items-center gap-2", compact && "flex-shrink-0")}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Enlarge payment QR code"
          className={cn(
            "rounded-md bg-white p-2 touch-manipulation active:scale-[0.98] transition-transform",
            compact ? "w-[72px] h-[72px] p-1" : "w-full max-w-[260px]"
          )}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- remote Supabase storage URL, not covered by next/image config */}
          <img src={url} alt="Payment QR code" className="w-full h-full object-contain" />
        </button>
        {!compact && caption && (
          <span className="font-display text-[12px] font-bold tracking-[0.1em] uppercase text-text-secondary">
            {caption}
          </span>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Payment QR code"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center gap-4 p-5"
        >
          <div
            className="bg-white rounded-md p-3 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote Supabase storage URL, not covered by next/image config */}
            <img
              src={url}
              alt="Payment QR code"
              className="object-contain max-w-[calc(100vw-64px)] max-h-[calc(100dvh-160px)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-[44px] min-w-[120px] px-6 rounded-md border border-border bg-bg-surface text-text-primary font-display text-[13px] font-bold tracking-[0.08em] uppercase active:bg-bg-hover"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
