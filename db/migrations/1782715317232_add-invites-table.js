/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE public.invites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL,
      token text NOT NULL,
      used_at timestamptz,
      expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  pgm.sql(`CREATE UNIQUE INDEX uq_invites_token ON public.invites (token)`);
  pgm.sql(`CREATE INDEX idx_invites_lower_email ON public.invites (lower(email))`);

  // RLS on with no policies: Drizzle connects as the BYPASSRLS postgres role and
  // reaches the table, while anon/authenticated are denied by default.
  pgm.sql(`ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS public.invites`);
};
