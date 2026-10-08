"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiGet, apiPost, apiPatch } from "@/lib/api/client";
import { useProfile } from "@/hooks/use-profile";

export type QueueEntry = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  status: "waiting" | "marked_out" | "removed";
  paid: boolean;
  gamesPlayed: number;
  courtNumber: number | null;
  isHost: boolean;
};

export type QueueData = {
  onCourt: QueueEntry[];
  waiting: QueueEntry[];
};

export function useQueue(code: string) {
  return useQuery({
    queryKey: ["queue", code],
    queryFn: () => apiGet<QueueData>(`/api/runs/${code}/queue`),
  });
}

export function useUpdateQueueStatusMutation(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      entryId: string;
      status: "waiting" | "marked_out" | "removed";
    }) =>
      apiPatch(`/api/runs/${code}/queue/${input.entryId}`, { status: input.status }),
    // Realtime is the fast path; this is the seatbelt for flaky court wifi or
    // a dead websocket — refetch the queue so the host's screen reflects the
    // server truth even when the realtime push never arrived.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue", code] });
    },
  });
}

// Optimistic, unlike useUpdateQueueStatusMutation above. A paid toggle is an
// in-place scalar flip — the player never moves between onCourt/waiting or gets
// repositioned — so the cache patch always matches what the server returns, with
// no risk of guessing wrong. Hosts also tap down the list rapidly at collection
// time and need instant feedback; an invalidate-then-refetch round trip per tap
// would feel laggy. Status changes can move/reorder players, so they stay
// non-optimistic and lean on the realtime + invalidate path instead.
export function useUpdateQueuePaidMutation(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { entryId: string; paid: boolean }) =>
      apiPatch(`/api/runs/${code}/queue/${input.entryId}`, { paid: input.paid }),
    onMutate: async ({ entryId, paid }) => {
      await queryClient.cancelQueries({ queryKey: ["queue", code] });
      const previous = queryClient.getQueryData<QueueData>(["queue", code]);
      queryClient.setQueryData<QueueData>(["queue", code], (old) =>
        old
          ? {
              onCourt: old.onCourt.map((e) => (e.id === entryId ? { ...e, paid } : e)),
              waiting: old.waiting.map((e) => (e.id === entryId ? { ...e, paid } : e)),
            }
          : old,
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["queue", code], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["queue", code] });
    },
  });
}

export function useAddQueueEntryMutation(
  code: string,
  mode: "self_join" | "host_add" = "self_join",
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (displayName: string) =>
      apiPost<{ id: string; position: number }>(`/api/runs/${code}/queue`, { displayName, mode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue", code] });
    },
  });
}

export function useJoinAsHostMutation(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (displayName: string) =>
      apiPost<{ id: string; position: number }>(`/api/runs/${code}/queue`, {
        displayName,
        mode: "host_self",
      }),
    onSuccess: (data) => {
      try {
        localStorage.setItem(`pickleruns:entry:${code}`, data.id);
      } catch {
        // storage unavailable; the entry is still in the rotation
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["queue", code] });
      queryClient.invalidateQueries({ queryKey: ["courts", code] });
    },
  });
}

export function useHostJoinAsPlayer(code: string, isHost: boolean) {
  const queueQuery = useQueue(code);
  const profileQuery = useProfile({ enabled: isHost });
  const mutation = useJoinAsHostMutation(code);

  const queue = queueQuery.data;
  const alreadyIn = !!queue && [...queue.onCourt, ...queue.waiting].some((e) => e.isHost);
  const displayName = profileQuery.data?.displayName?.trim() || null;
  const alreadyInQueueError =
    mutation.error instanceof ApiError && mutation.error.code === "ALREADY_IN_QUEUE";

  return {
    visible: isHost && !!queue && !alreadyIn,
    displayName,
    pending: mutation.isPending,
    error: mutation.isError && !alreadyInQueueError ? mutation.error.message : null,
    join: () => {
      if (displayName) mutation.mutate(displayName);
    },
  };
}
