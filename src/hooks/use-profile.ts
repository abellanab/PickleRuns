"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPostForm } from "@/lib/api/client";

export interface Profile {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

const PROFILE_KEY = ["profile"] as const;

export function useProfile({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => apiGet<Profile>("/api/users/me"),
    staleTime: 60_000,
    enabled,
  });
}

function patchProfile(queryClient: QueryClient, patch: Partial<Profile>) {
  queryClient.setQueryData<Profile>(PROFILE_KEY, (old) => (old ? { ...old, ...patch } : old));
}

function invalidateAvatarConsumers(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["host-status"] });
  queryClient.invalidateQueries({ queryKey: ["queue"] });
  queryClient.invalidateQueries({ queryKey: ["courts"] });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ displayName }: { displayName: string }) =>
      apiPatch<{ id: string; displayName: string; avatarUrl: string | null }>("/api/users/me", {
        displayName,
      }),
    onSuccess: (data) => {
      patchProfile(queryClient, { displayName: data.displayName, avatarUrl: data.avatarUrl });
      invalidateAvatarConsumers(queryClient);
    },
  });
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (image: Blob) => {
      const formData = new FormData();
      formData.append("file", image, "avatar.webp");
      return apiPostForm<{ avatarUrl: string }>("/api/users/me/avatar", formData);
    },
    onSuccess: (data) => {
      patchProfile(queryClient, { avatarUrl: data.avatarUrl });
      invalidateAvatarConsumers(queryClient);
    },
  });
}

export function useRemoveAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete<{ avatarUrl: null }>("/api/users/me/avatar"),
    onSuccess: () => {
      patchProfile(queryClient, { avatarUrl: null });
      invalidateAvatarConsumers(queryClient);
    },
  });
}
