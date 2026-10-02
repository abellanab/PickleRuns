import { z } from "zod";

export const joinRunSchema = z.object({
  displayName: z.string().min(1).max(50).transform((s) => s.trim()),
});

export type JoinRunInput = z.infer<typeof joinRunSchema>;

// PATCH schema for a queue entry — either a status change (reinstate / mark out
// / remove) or a paid toggle (host marking the court fee collected). Benching is
// handled entirely in the team-assignment draft state and never hits this endpoint.
// .strict() on each member is load-bearing: the route discriminates on
// `"status" in data`, so a mixed `{ status, paid }` payload must be rejected (400)
// rather than silently matching the first member and dropping the other key.
export const queueEntryPatchSchema = z.union([
  z.object({ status: z.enum(["waiting", "marked_out", "removed"]) }).strict(),
  z.object({ paid: z.boolean() }).strict(),
]);

export type QueueEntryPatchInput = z.infer<typeof queueEntryPatchSchema>;
