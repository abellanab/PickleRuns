"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { LogOut, User, Mail, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AccountPage() {
  const router = useRouter();

  return (
    <div className="app-shell px-5 pt-14 pb-12 flex flex-col gap-8 animate-fade-up">
      {/* HEADER */}
      <div className="flex flex-col gap-4 items-center text-center">
        <div className="w-20 h-20 rounded-full bg-bg-surface border-2 border-accent flex items-center justify-center text-accent font-display text-3xl font-black tracking-tighter uppercase">
          User
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-black tracking-tight uppercase text-text-primary">
            My Account
          </h1>
          <p className="font-body text-sm text-text-muted">
            Manage your profile and settings
          </p>
        </div>
      </div>

      {/* PROFILE CARD */}
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-bg-surface">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-md bg-bg-hover flex items-center justify-center text-text-muted">
            <User className="w-4 h-4" />
          </div>
          <span className="font-display text-xs font-bold tracking-wider uppercase text-text-muted">
            Personal Info
          </span>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-hover border border-border transition-colors">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-text-muted" />
              <span className="font-body text-sm text-text-secondary">Email Address</span>
            </div>
            <span className="font-body text-sm font-medium text-text-primary italic">
              user@example.com
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-hover border border-border transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-text-muted" />
              <span className="font-body text-sm text-text-secondary">Display Name</span>
            </div>
            <span className="font-body text-sm font-medium text-text-primary italic">
              Player One
            </span>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex-1 flex flex-col justify-end gap-5">
        <button
          onClick={() => signOut()}
          className="w-full h-14 rounded-md bg-[#ff4040] text-white font-display text-[16px] font-black tracking-[0.1em] uppercase flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:bg-[#e63a3a]"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
