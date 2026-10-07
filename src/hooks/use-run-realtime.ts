"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const DEBOUNCE_MS = 150;

// One channel for the whole run dashboard. Don't co-mount with
// useQueueRealtime / useGameRealtime — they would open duplicate channels.
export function useRunRealtime(runId: string | null, code: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!runId) return;
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const gameIds = new Set<string>();

    // The rotation trigger rewrites many queue rows at once; coalesce the burst
    // into a single refetch round.
    function schedule(gameId?: string) {
      if (gameId) gameIds.add(gameId);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        queryClient.invalidateQueries({ queryKey: ["courts", code] });
        queryClient.invalidateQueries({ queryKey: ["queue", code] });
        queryClient.invalidateQueries({ queryKey: ["games", code] });
        queryClient.invalidateQueries({ queryKey: ["run", code] });
        queryClient.invalidateQueries({ queryKey: ["fill-proposal", code] });
        for (const id of gameIds) {
          queryClient.invalidateQueries({ queryKey: ["game", code, id] });
        }
        gameIds.clear();
      }, DEBOUNCE_MS);
    }

    const runFilter = `run_id=eq.${runId}`;
    const channel = supabase
      .channel(`run-${runId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: runFilter },
        (payload) => {
          const row = (payload.new as { id?: unknown } | null) ?? (payload.old as { id?: unknown } | null);
          schedule(typeof row?.id === "string" ? row.id : undefined);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "courts", filter: runFilter },
        () => schedule(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_entries", filter: runFilter },
        () => schedule(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "runs", filter: `id=eq.${runId}` },
        () => schedule(),
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED" && status !== "CLOSED") {
          console.error(`Realtime channel run-${runId} failed:`, status);
        }
      });

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [runId, code, queryClient]);
}
