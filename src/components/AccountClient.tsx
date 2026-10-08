"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Clock, Check } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Topbar } from "@/components/ui/topbar";
import HostRequestSheet from "@/components/ui/HostRequestSheet";
import { useHostStatus } from "@/hooks/use-host-request";
import {
  useProfile,
  useRemoveAvatarMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from "@/hooks/use-profile";
import { cropToSquareWebp } from "@/lib/image";
import { signOut } from "@/app/(auth)/actions";

type InitialUser = {
  id: string;
  email: string;
  metadata: Record<string, unknown> | undefined;
};

export type AccountClientProps = {
  initialUser: InitialUser;
};

const LABEL_CLASS =
  "font-display text-[11px] font-bold tracking-[0.14em] uppercase text-text-muted";

const SECONDARY_BUTTON_CLASS =
  "h-11 px-4 flex items-center justify-center rounded-md border border-border bg-bg-surface text-text-secondary font-display text-[13px] font-bold tracking-[0.08em] uppercase transition-colors active:bg-bg-hover disabled:opacity-50";

export default function AccountClient({ initialUser }: AccountClientProps) {
  const router = useRouter();
  const [showSheet, setShowSheet] = useState(false);
  const { data: hostStatus, isError, refetch } = useHostStatus();
  const { data: profile } = useProfile();

  const metaName = initialUser.metadata?.displayName;
  const fallbackName = typeof metaName === "string" ? metaName : "";
  const displayName = profile?.displayName ?? fallbackName;
  const avatarUrl = profile?.avatarUrl ?? null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  const uploadAvatar = useUploadAvatarMutation();
  const removeAvatar = useRemoveAvatarMutation();
  const photoBusy = cropping || uploadAvatar.isPending || removeAvatar.isPending;

  const [draftName, setDraftName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const updateProfile = useUpdateProfileMutation();
  const nameValue = draftName ?? displayName;
  const trimmedName = nameValue.trim();
  const canSave =
    trimmedName.length > 0 && trimmedName !== displayName && !updateProfile.isPending;

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    setCropping(true);
    try {
      const image = await cropToSquareWebp(file);
      await uploadAvatar.mutateAsync(image);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Could not upload that photo.");
    } finally {
      setCropping(false);
    }
  }

  function handleRemovePhoto() {
    setPhotoError(null);
    removeAvatar.mutate(undefined, {
      onError: (err) => setPhotoError(err.message),
    });
  }

  function handleSaveName(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSave) return;
    setSaved(false);
    updateProfile.mutate(
      { displayName: trimmedName },
      {
        onSuccess: () => {
          setDraftName(null);
          setSaved(true);
        },
      },
    );
  }

  const isPending = hostStatus === "pending";
  const isApproved = hostStatus === "approved";
  const canRequest = !isPending && !isApproved;

  return (
    <div className="app-shell">
      <Topbar label="Your profile" title="Account" onBack={() => router.push("/dashboard")} />

      <div className="flex flex-col gap-6 px-5 pt-6 pb-10">
        <div className="flex items-center gap-4 animate-fade-up">
          <Avatar name={displayName || initialUser.email} src={avatarUrl} size="md" />
          <div className="flex min-w-0 flex-col gap-1">
            {displayName && (
              <span className="font-display text-[20px] font-extrabold tracking-[0.02em] uppercase text-text-primary leading-none truncate">
                {displayName}
              </span>
            )}
            <span className="font-body text-[13px] text-text-muted truncate">
              {initialUser.email}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 animate-fade-up" style={{ animationDelay: "0.04s" }}>
          <span className={LABEL_CLASS}>Profile</span>
          <div className="flex flex-col gap-5 px-[18px] py-4 rounded-md border border-border bg-bg-surface">
            <div className="flex items-center gap-4">
              <Avatar name={displayName || initialUser.email} src={avatarUrl} size="lg" />
              <div className="flex min-w-0 flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoBusy}
                  className={SECONDARY_BUTTON_CLASS}
                >
                  {cropping || uploadAvatar.isPending ? "Uploading…" : "Change photo"}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={photoBusy}
                    className="h-11 px-4 flex items-center justify-center font-display text-[13px] font-bold tracking-[0.08em] uppercase text-[#ff6060] disabled:opacity-50"
                  >
                    {removeAvatar.isPending ? "Removing…" : "Remove photo"}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {photoError && (
              <span role="alert" className="font-body text-[13px] text-[#ff6060]">
                {photoError}
              </span>
            )}

            <form onSubmit={handleSaveName} className="flex flex-col gap-2">
              <label htmlFor="profile-name" className={LABEL_CLASS}>
                Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={nameValue}
                onChange={(e) => {
                  setDraftName(e.target.value);
                  setSaved(false);
                }}
                maxLength={50}
                autoComplete="name"
                className="w-full h-12 px-3.5 rounded-md border border-border bg-bg-surface font-body text-[15px] text-text-primary outline-none focus:border-border-accent focus:bg-bg-hover"
              />
              <button
                type="submit"
                disabled={!canSave}
                className="w-full h-12 flex items-center justify-center rounded-md bg-accent text-bg font-display text-[15px] font-extrabold tracking-[0.1em] uppercase transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
              >
                {updateProfile.isPending ? "Saving…" : "Save"}
              </button>
              {updateProfile.isError && (
                <span role="alert" className="font-body text-[13px] text-[#ff6060]">
                  {updateProfile.error.message}
                </span>
              )}
              {saved && !updateProfile.isError && (
                <span role="status" className="font-body text-[13px] text-accent">
                  Saved
                </span>
              )}
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <span className={LABEL_CLASS}>Hosting</span>
          <div className="flex flex-col gap-4 px-[18px] py-4 rounded-md border border-border bg-bg-surface">
            {isPending && (
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 flex-shrink-0 text-text-muted" />
                <span className="font-body text-[14px] text-text-secondary leading-[1.5]">
                  Host request pending — we&apos;ll approve it soon
                </span>
              </div>
            )}

            {isApproved && (
              <>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 flex-shrink-0 text-accent" />
                  <span className="font-body text-[14px] text-text-secondary leading-[1.5]">
                    You&apos;re approved to host
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/create-run")}
                  className="w-full h-12 flex items-center justify-center rounded-md bg-accent text-bg font-display text-[15px] font-extrabold tracking-[0.1em] uppercase transition-all duration-150 hover:-translate-y-px hover:bg-[#d4f545] active:scale-[0.98]"
                >
                  Start a run
                </button>
              </>
            )}

            {canRequest && (
              <>
                <span className="font-body text-[14px] text-text-secondary leading-[1.5]">
                  {hostStatus === "denied"
                    ? "Your last request wasn't approved. You can send a new request."
                    : "Hosting is approval-gated. Send a quick request and we'll get you set up."}
                </span>
                {isError && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-body text-[13px] text-[#ff6060]">
                      Couldn&apos;t load your host status.
                    </span>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="h-11 px-3 flex items-center justify-center font-display text-[13px] font-bold tracking-[0.08em] uppercase text-accent"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowSheet(true)}
                  className="w-full h-12 flex items-center justify-center rounded-md bg-accent text-bg font-display text-[15px] font-extrabold tracking-[0.1em] uppercase transition-all duration-150 hover:-translate-y-px hover:bg-[#d4f545] active:scale-[0.98]"
                >
                  {hostStatus === "denied" ? "Request again" : "Request to host"}
                </button>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="w-full h-12 flex items-center justify-center rounded-md border border-danger/40 bg-danger/[0.06] text-[#ff6060] font-display text-[13px] font-black tracking-[0.08em] uppercase transition-all hover:bg-danger/[0.12] animate-fade-up"
          style={{ animationDelay: "0.16s" }}
        >
          Sign out
        </button>
      </div>

      <HostRequestSheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        defaultName={displayName}
      />
    </div>
  );
}
