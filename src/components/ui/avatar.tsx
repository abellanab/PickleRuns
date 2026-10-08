"use client";

import { useState } from "react";
import { cn, deriveInitials } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-10 h-10 text-[14px]",
  lg: "w-24 h-24 text-[32px]",
};

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!src && src !== failedSrc;

  return (
    <span
      className={cn(
        "flex-shrink-0 rounded-full overflow-hidden inline-flex items-center justify-center",
        SIZE_CLASS[size],
        !showImage &&
          "bg-bg-hover border border-border-accent text-accent font-display font-extrabold tracking-[0.04em]",
        className,
      )}
    >
      {showImage ? (
        // Remote Supabase Storage URLs; next/image has no remotePatterns configured.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
          className="w-full h-full object-cover"
        />
      ) : (
        deriveInitials({ display_name: name }, undefined)
      )}
    </span>
  );
}
