import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types/api";
import {
  InvalidEntryIdsError,
  PlayerUnavailableError,
  InvalidRosterError,
  WinnerRequiredError,
  RunCompletedError,
  GameNotFoundError,
  GameCompletedError,
  PlayerNotInGameError,
  DuplicateScoreError,
} from "@/services/game.service";
import {
  CourtNotFoundError,
  CourtOccupiedError,
  LastCourtError,
  CourtLimitError,
  CourtHasHistoryError,
} from "@/services/court.service";
import {
  RunNotFoundError,
  HostAlreadyHasActiveRunError,
  RunModeNotSupportedError,
} from "@/services/run.service";
import {
  InviteNotFoundError,
  InviteUsedError,
  InviteExpiredError,
} from "@/services/invite.service";
import {
  HostNotApprovedError,
  AlreadyHostError,
  HostRequestPendingError,
} from "@/services/host-request.service";
import { AlreadyInQueueError } from "@/services/queue.service";
import { ProfileNotFoundError } from "@/services/profile.service";
import { InvalidAvatarError } from "@/lib/supabase/avatar-storage";
import { InvalidPaymentQrError } from "@/lib/supabase/payment-qr-storage";

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiError(
  code: string,
  message: string,
  status = 500,
  details?: unknown,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

// Single place a route catches. Maps service error classes to HTTP statuses so
// route handlers can stay a one-liner: `try { ... } catch (e) { return handleApiError(e) }`.
export function handleApiError(err: unknown): NextResponse<ApiResponse<never>> {
  if (err instanceof ZodError) {
    return apiError("VALIDATION", "Invalid request payload", 400, err.flatten());
  }
  if (err instanceof InvalidEntryIdsError) {
    return apiError("INVALID_ENTRY_IDS", err.message, 400);
  }
  if (err instanceof GameNotFoundError) {
    return apiError("GAME_NOT_FOUND", err.message, 404);
  }
  if (err instanceof RunNotFoundError) {
    return apiError("NOT_FOUND", err.message, 404);
  }
  if (err instanceof HostAlreadyHasActiveRunError) {
    return apiError("HOST_HAS_ACTIVE_RUN", err.message, 409);
  }
  if (err instanceof RunModeNotSupportedError) {
    return apiError("MODE_NOT_SUPPORTED", err.message, 409);
  }
  if (err instanceof GameCompletedError) {
    return apiError("GAME_COMPLETED", err.message, 409);
  }
  if (err instanceof PlayerNotInGameError) {
    return apiError("PLAYER_NOT_IN_GAME", err.message, 422);
  }
  if (err instanceof CourtNotFoundError) {
    return apiError("COURT_NOT_FOUND", err.message, 404);
  }
  if (err instanceof CourtOccupiedError) {
    return apiError("COURT_OCCUPIED", err.message, 409);
  }
  if (err instanceof PlayerUnavailableError) {
    return apiError("PLAYER_UNAVAILABLE", err.message, 409);
  }
  if (err instanceof InvalidRosterError) {
    return apiError("INVALID_ROSTER", err.message, 422);
  }
  if (err instanceof WinnerRequiredError) {
    return apiError("WINNER_REQUIRED", err.message, 422);
  }
  if (err instanceof LastCourtError) {
    return apiError("LAST_COURT", err.message, 409);
  }
  if (err instanceof CourtLimitError) {
    return apiError("COURT_LIMIT", err.message, 409);
  }
  if (err instanceof CourtHasHistoryError) {
    return apiError("COURT_HAS_HISTORY", err.message, 409);
  }
  if (err instanceof RunCompletedError) {
    return apiError("RUN_COMPLETED", err.message, 409);
  }
  if (err instanceof DuplicateScoreError) {
    return apiError("DUPLICATE_SCORE", err.message, 409);
  }
  if (err instanceof InviteNotFoundError) {
    return apiError("INVITE_NOT_FOUND", err.message, 404);
  }
  if (err instanceof InviteExpiredError) {
    return apiError("INVITE_EXPIRED", err.message, 410);
  }
  if (err instanceof InviteUsedError) {
    return apiError("INVITE_USED", err.message, 410);
  }
  if (err instanceof HostNotApprovedError) {
    return apiError("HOST_NOT_APPROVED", err.message, 403);
  }
  if (err instanceof AlreadyHostError) {
    return apiError("ALREADY_HOST", err.message, 409);
  }
  if (err instanceof HostRequestPendingError) {
    return apiError("HOST_REQUEST_PENDING", err.message, 409);
  }
  if (err instanceof AlreadyInQueueError) {
    return apiError("ALREADY_IN_QUEUE", err.message, 409);
  }
  if (err instanceof ProfileNotFoundError) {
    return apiError("PROFILE_NOT_FOUND", err.message, 404);
  }
  if (err instanceof InvalidAvatarError) {
    return apiError("INVALID_AVATAR", err.message, 422);
  }
  if (err instanceof InvalidPaymentQrError) {
    return apiError("INVALID_PAYMENT_QR", err.message, 422);
  }
  // Anything unrecognized is an internal failure — log it server-side and
  // return a generic message so internals never leak to the client.
  console.error(err);
  return apiError("INTERNAL", "Internal server error", 500);
}
