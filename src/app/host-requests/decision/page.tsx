"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { useDecideHostRequest, useHostRequestDecisionPreview } from "@/hooks/use-host-request";

type Decision = "approved" | "denied";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell px-5 overflow-y-auto">
      <div className="pt-6 flex flex-col items-center gap-[2px]">
        <span className="font-display text-[28px] font-black tracking-[-0.01em] uppercase text-text-primary leading-none">
          PICKLERUNS
        </span>
        <div className="w-12 h-0.5 bg-accent rounded-sm mt-2" />
      </div>
      <div className="flex-1 flex flex-col justify-center pb-12">{children}</div>
    </div>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h2 className="font-display text-[24px] font-black tracking-[-0.01em] uppercase text-text-primary leading-none">
        {title}
      </h2>
      <p className="font-body text-[14px] text-text-secondary leading-relaxed max-w-[300px]">
        {body}
      </p>
    </div>
  );
}

function DecisionContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const action = params.get("action");
  const decision: Decision | null =
    action === "approve" ? "approved" : action === "deny" ? "denied" : null;

  const preview = useHostRequestDecisionPreview(token);
  const decide = useDecideHostRequest();

  if (!token || !decision) {
    return (
      <Message
        title="Link not valid"
        body="This link is invalid or has expired. Use the buttons in the original email."
      />
    );
  }

  if (preview.isPending) {
    return <p className="font-body text-[14px] text-text-muted text-center">Loading...</p>;
  }

  if (preview.isError) {
    const code = preview.error instanceof ApiError ? preview.error.code : null;
    if (code === "HOST_REQUEST_NOT_FOUND") {
      return <Message title="Not found" body="This host request no longer exists." />;
    }
    return (
      <Message
        title="Link not valid"
        body="This link is invalid or has expired. Use the buttons in the original email."
      />
    );
  }

  const { displayName, email, status } = preview.data;
  const verb = decision === "approved" ? "Approve" : "Deny";

  if (decide.isSuccess) {
    return (
      <Message
        title={decision === "approved" ? "Approved" : "Denied"}
        body={`${displayName} has been ${decision}. They have been notified by email.`}
      />
    );
  }

  const decidedStatus: Decision | null =
    status !== "pending"
      ? status
      : decide.error instanceof ApiError && decide.error.code === "HOST_REQUEST_ALREADY_DECIDED"
        ? decide.error.message.includes("approved")
          ? "approved"
          : "denied"
        : null;

  if (decidedStatus) {
    return (
      <Message
        title="Already decided"
        body={`The request from ${displayName} was already ${decidedStatus}. Nothing more to do.`}
      />
    );
  }

  const errorMessage =
    decide.isError && !(decide.error instanceof ApiError && decide.error.code === "INVALID_TOKEN")
      ? "Something went wrong. Please try again."
      : decide.isError
        ? "This link is invalid or has expired."
        : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="font-display text-[24px] font-black tracking-[-0.01em] uppercase text-text-primary leading-none">
          {verb} host request
        </h2>
        <p className="font-body text-[14px] text-text-secondary leading-relaxed">
          Confirm to {verb.toLowerCase()} this request.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-bg-surface p-4 flex flex-col gap-1">
        <span className="font-body text-[12px] uppercase tracking-wide text-text-muted">
          Requester
        </span>
        <span className="font-display text-[20px] font-black uppercase text-text-primary break-words">
          {displayName}
        </span>
        <span className="font-body text-[14px] text-text-secondary break-all">
          {email ?? "No email on file"}
        </span>
      </div>

      {errorMessage ? (
        <p className="font-body text-[13px] text-text-secondary text-center" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="button"
        disabled={decide.isPending}
        onClick={() => decide.mutate({ token, decision })}
        className="min-h-[48px] w-full rounded-lg bg-accent text-bg font-display text-[16px] font-black uppercase tracking-wide transition-opacity disabled:opacity-50 active:opacity-80"
      >
        {decide.isPending ? "Working..." : `Confirm ${verb.toLowerCase()}`}
      </button>
    </div>
  );
}

export default function HostRequestDecisionPage() {
  return (
    <Shell>
      <Suspense
        fallback={<p className="font-body text-[14px] text-text-muted text-center">Loading...</p>}
      >
        <DecisionContent />
      </Suspense>
    </Shell>
  );
}
