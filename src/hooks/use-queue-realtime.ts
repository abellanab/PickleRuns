"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// Note: this hook and useGameRealtime both subscribe to tables scoped to the
// same run/game. Today only one is mounted at a time (queue/game/lobby are
// different routes), but mounting both on the same page will create duplicate
// channels. Don't co-locate.

export function useQueueRealtime(runId: string | null, onInvalidate: () => void) {
  const onInvalidateRef = useRef(onInvalidate);
  useEffect(() => {
    onInvalidateRef.current = onInvalidate;
  }, [onInvalidate]);

  useEffect(() => {
    if (!runId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`queue-${runId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_entries", filter: `run_id=eq.${runId}` },
        () => onInvalidateRef.current(),
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED" && status !== "CLOSED") {
          console.error(`Realtime channel queue-${runId} failed:`, status);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [runId]);
}
