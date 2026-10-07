// Single source of truth for the wire shape between route handlers and the
// browser-side api client. Discriminated union on `ok` so TypeScript narrows.

import type { Run } from "@/types/db";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

// Wire types: same shape as the Drizzle row, except Date fields arrive as
// JSON strings over the wire. Use these on the client side in place of
// `Run`, `NewRun`, etc. when consuming apiGet<...>.
export type RunWire = Omit<Run, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};
