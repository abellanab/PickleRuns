"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showNav = !pathname.endsWith("/game");

  return (
    <div className="app-shell h-dvh overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {children}
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}
