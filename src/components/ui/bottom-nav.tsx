"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePaymentQr } from "@/hooks/use-payment-qr";
import { useRun } from "@/hooks/use-run";
import { useSessionUser } from "@/hooks/use-session";

export function BottomNav() {
  const pathname = usePathname();
  const match = pathname.match(/^\/runs\/([^/]+)/);
  const code = match?.[1] ?? "";

  const { data: run } = useRun(code);
  const { data: userId } = useSessionUser();
  const isHost = !!userId && !!run && userId === run.hostId;
  const { data: paymentQr } = usePaymentQr(code);
  const showPayment = isHost || !!paymentQr?.paymentQrUrl;

  const tabs = [
    {
      href: `/runs/${code}/lobby`,
      label: "Lobby",
      active: pathname.includes("/lobby"),
      icon: <Home className="w-5 h-5" />,
    },
    ...(run?.runMode !== "score_only"
      ? [
          {
            href: `/runs/${code}/queue`,
            label: "Queue",
            active: pathname.includes("/queue"),
            icon: <List className="w-5 h-5" />,
          },
        ]
      : []),
    ...(showPayment
      ? [
          {
            href: `/runs/${code}/payment`,
            label: "Payment",
            active: pathname.includes("/payment"),
            icon: <Wallet className="w-5 h-5" />,
          },
        ]
      : []),
  ];

  return (
    <nav
      className="flex-shrink-0 flex items-center border-t border-border bg-bg-raised px-2 h-[58px]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-[3px] py-2 transition-colors",
            tab.active ? "text-accent" : "text-text-muted hover:text-text-secondary"
          )}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          {tab.icon}
          <span className="font-display text-[10px] font-bold tracking-[0.1em] uppercase">
            {tab.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
