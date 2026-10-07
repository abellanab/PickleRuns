"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function JoinByCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stripped = code.replace("-", "");
  const codeReady = stripped.length >= 6;

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
    if (val.length > 3) val = val.slice(0, 3) + "-" + val.slice(3);
    setInvalid(false);
    setCode(val);
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!codeReady) {
      setInvalid(true);
      const el = inputRef.current;
      if (!el) return;
      el.style.borderColor = "#ff4040";
      el.style.animation = "";
      void el.offsetWidth;
      el.style.animation = "shake 0.4s ease-out";
      setTimeout(() => {
        el.style.borderColor = "";
        el.style.animation = "";
      }, 500);
      return;
    }
    router.push(`/runs/${code}/join`);
  }

  return (
    <form onSubmit={handleJoin} className="flex gap-2">
      <input
        ref={inputRef}
        value={code}
        onChange={handleCodeChange}
        placeholder="ABC-123"
        maxLength={7}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Run code"
        aria-invalid={invalid}
        className={cn(
          "h-14 min-w-0 flex-1 rounded-md border border-border bg-bg-surface px-4",
          "font-display text-[22px] font-black uppercase tracking-[0.18em] text-text-primary",
          "outline-none transition-colors duration-150",
          "placeholder:font-bold placeholder:normal-case placeholder:tracking-[0.12em] placeholder:text-text-muted",
          "focus:border-border-accent focus:bg-bg-hover",
          "[caret-color:theme(colors.accent)]",
        )}
      />
      <button
        type="submit"
        className={cn(
          "h-14 flex-shrink-0 rounded-md border px-6",
          "font-display text-[15px] font-extrabold uppercase tracking-[0.1em]",
          "flex items-center transition-all duration-150",
          codeReady
            ? "border-accent bg-accent text-bg hover:-translate-y-px shadow-[0_0_24px_-6px_rgba(200,241,53,0.5)]"
            : "border-border bg-bg-surface text-text-secondary hover:border-text-muted hover:text-text-primary",
        )}
      >
        Join
      </button>
    </form>
  );
}
