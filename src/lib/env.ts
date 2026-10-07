import "server-only";
import { z } from "zod";

// Lazy memoization: each getter reads process.env on first access, then caches.
// Avoids module-level process.env reads so a missing var only fails the call
// site that needs it (and so test mocks can stub between calls).

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const mailSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().min(1),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

type ServerEnv = z.infer<typeof serverSchema>;
type MailEnv = z.infer<typeof mailSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

let cachedServer: ServerEnv | undefined;
let cachedMail: MailEnv | undefined;
let cachedClient: ClientEnv | undefined;

function readServer(): ServerEnv {
  if (cachedServer) return cachedServer;
  const parsed = serverSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(`Invalid server env: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  }
  cachedServer = parsed.data;
  return cachedServer;
}

// Separate from readServer so missing mail vars never break DB/auth call sites.
function readMail(): MailEnv {
  if (cachedMail) return cachedMail;
  const parsed = mailSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  });
  if (!parsed.success) {
    throw new Error(`Invalid mail env: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  }
  cachedMail = parsed.data;
  return cachedMail;
}

function readClient(): ClientEnv {
  if (cachedClient) return cachedClient;
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(`Invalid client env: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  }
  cachedClient = parsed.data;
  return cachedClient;
}

export const env = {
  get DATABASE_URL(): string {
    return readServer().DATABASE_URL;
  },
  get DIRECT_URL(): string {
    return readServer().DIRECT_URL;
  },
  get NEXT_PUBLIC_SUPABASE_URL(): string {
    return readClient().NEXT_PUBLIC_SUPABASE_URL;
  },
  get NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY(): string {
    return readClient().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  },
  get SUPABASE_SERVICE_ROLE_KEY(): string | undefined {
    return readServer().SUPABASE_SERVICE_ROLE_KEY;
  },
  get RESEND_API_KEY(): string {
    return readMail().RESEND_API_KEY;
  },
  get RESEND_FROM_EMAIL(): string {
    return readMail().RESEND_FROM_EMAIL;
  },
};
