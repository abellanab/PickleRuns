import { cn } from "@/lib/utils";

export function HostTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex-shrink-0 inline-flex items-center h-[16px] px-1.5 rounded-sm border border-border-accent bg-accent-glow text-accent font-display text-[10px] font-extrabold tracking-[0.12em] uppercase leading-none",
        className,
      )}
    >
      Host
    </span>
  );
}
