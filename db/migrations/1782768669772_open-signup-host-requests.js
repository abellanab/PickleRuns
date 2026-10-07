/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Account creation is no longer invite-gated — drop the BEFORE INSERT enforcement
  // on auth.users. Hosting becomes a separately-granted capability (host_requests).
  pgm.sql(`DROP TRIGGER IF EXISTS trg_enforce_invite_before_user ON auth.users`);
  pgm.sql(`DROP FUNCTION IF EXISTS public.enforce_invite_on_signup()`);

  pgm.sql(`CREATE TYPE host_request_status AS ENUM ('pending', 'approved', 'denied')`);

  pgm.sql(`
    CREATE TABLE public.host_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      status host_request_status NOT NULL DEFAULT 'pending',
      note text,
      created_at timestamptz NOT NULL DEFAULT now(),
      decided_at timestamptz
    )
  `);

  // One open request per user — the partial unique index is the race backstop the
  // service relies on alongside its pre-insert check.
  pgm.sql(`
    CREATE UNIQUE INDEX uq_host_requests_one_pending
      ON public.host_requests (user_id)
      WHERE status = 'pending'
  `);
  pgm.sql(`CREATE INDEX idx_host_requests_user_id ON public.host_requests (user_id)`);

  // RLS on. SELECT/INSERT are scoped to the authenticated owner so a signed-in user
  // can read and create only their own requests. No UPDATE/DELETE policy: approval
  // runs from the CLI as the BYPASSRLS postgres role, which reaches the table
  // directly while anon/authenticated cannot mutate decisions.
  pgm.sql(`ALTER TABLE public.host_requests ENABLE ROW LEVEL SECURITY`);

  pgm.sql(`
    CREATE POLICY host_requests_select_own ON public.host_requests
      FOR SELECT TO authenticated
      USING (user_id = auth.uid())
  `);
  pgm.sql(`
    CREATE POLICY host_requests_insert_own ON public.host_requests
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid())
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS public.host_requests`);
  pgm.sql(`DROP TYPE IF EXISTS host_request_status`);

  // Restore the invite-on-signup enforcement exactly as migration
  // 1782718968035 created it.
  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.enforce_invite_on_signup()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      claimed_id uuid;
    BEGIN
      UPDATE public.invites
         SET used_at = now()
       WHERE ctid IN (
         SELECT ctid
           FROM public.invites
          WHERE lower(email) = lower(NEW.email)
            AND used_at IS NULL
            AND expires_at > now()
          LIMIT 1
       )
      RETURNING id INTO claimed_id;

      IF claimed_id IS NULL THEN
        RAISE EXCEPTION 'invite_required'
          USING MESSAGE = 'An invitation is required to create an account.';
      END IF;

      RETURN NEW;
    END;
    $$
  `);

  pgm.sql(`
    CREATE TRIGGER trg_enforce_invite_before_user
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_invite_on_signup()
  `);
};
