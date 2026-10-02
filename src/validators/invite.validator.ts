import { z } from "zod";

export const inviteTokenSchema = z.string().min(1);

export type InviteTokenInput = z.infer<typeof inviteTokenSchema>;
