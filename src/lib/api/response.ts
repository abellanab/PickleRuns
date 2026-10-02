import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types/api";
import {
  InvalidEntryIdsError,
  OngoingGameError,
  RunCompletedError,
  GameNotFoundError,
  GameCompletedError,
  PlayerNotInGameError,
  DuplicateScoreError,
  InvalidPointsError,
} from "@/services/game.service";
import { RunNotFoundError } from "@/services/run.service";
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
  if (err instanceof GameCompletedError) {
    return apiError("GAME_COMPLETED", err.message, 409);
  }
  if (err instanceof PlayerNotInGameError) {
    return apiError("PLAYER_NOT_IN_GAME", err.message, 422);
  }
  if (err instanceof OngoingGameError) {
    return apiError("ONGOING_GAME", err.message, 409);
  }
  if (err instanceof RunCompletedError) {
    return apiError("RUN_COMPLETED", err.message, 409);
  }
  if (err instanceof DuplicateScoreError) {
    return apiError("DUPLICATE_SCORE", err.message, 409);
  }
  if (err instanceof InvalidPointsError) {
    return apiError("INVALID_POINTS", err.message, 400);
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
  // Anything unrecognized is an internal failure — log it server-side and
  // return a generic message so internals never leak to the client.
  console.error(err);
  return apiError("INTERNAL", "Internal server error", 500);
}
