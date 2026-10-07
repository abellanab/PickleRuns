"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// Note: this hook and useQueueRealtime both subscribe to tables scoped to the
// same run/game. Today only one is mounted at a time (queue/game/lobby are
// different routes), but mounting both on the same page will create duplicate
// channels. Don't co-locate.

export function useGameRealtime(code: string, gameId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!gameId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        () => queryClient.invalidateQueries({ queryKey: ["game", code, gameId] }),
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED" && status !== "CLOSED") {
          console.error(`Realtime channel game-${gameId} failed:`, status);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, gameId, queryClient]);
}
