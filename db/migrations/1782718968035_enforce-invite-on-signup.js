/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // SECURITY DEFINER so the function runs as its owner (postgres), bypassing
  // RLS on public.invites — same pattern as handle_new_user. Fires BEFORE
  // INSERT on auth.users so enforcement is path-independent (form, direct
  // anon-key GoTrue call, OAuth). Gates on email; the token is only the UX
  // carrier, the DB enforces "this email holds a valid unused invite".
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

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`DROP TRIGGER IF EXISTS trg_enforce_invite_before_user ON auth.users`);
  pgm.sql(`DROP FUNCTION IF EXISTS public.enforce_invite_on_signup()`);
};
