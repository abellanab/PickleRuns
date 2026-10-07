/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // 1. Ensure score_goal and time_limit_seconds exist on runs.
  //    These were added in supabase/migrations/0004 via the legacy system.
  //    If that migration wasn't applied through node-pg-migrate, the columns
  //    are missing and every INSERT from Drizzle fails.
  pgm.sql(`
    ALTER TABLE public.runs
      ADD COLUMN IF NOT EXISTS "score_goal" integer NOT NULL DEFAULT 21,
      ADD COLUMN IF NOT EXISTS "time_limit_seconds" integer
  `);

  // 2. Grant BYPASSRLS to the postgres role so Drizzle (which connects as
  //    postgres via DATABASE_URL) can INSERT/UPDATE without RLS interference.
  //    In some Supabase projects the postgres role loses BYPASSRLS; this
  //    restores it. Wrapped in DO so it doesn't fail if already set.
  pgm.sql(`
    DO $$
    BEGIN
      ALTER ROLE postgres BYPASSRLS;
    EXCEPTION WHEN others THEN
      NULL;
    END;
    $$
  `);

  // 3. Backfill public.users for any auth.users rows that were created before
  //    the on_auth_user_created trigger was set up. Without this, INSERT into
  //    runs fails with a FK violation on host_id -> users.id.
  pgm.sql(`
    DO $$
    BEGIN
      INSERT INTO public.users (id, display_name)
      SELECT
        au.id,
        COALESCE(
          au.raw_user_meta_data->>'displayName',
          split_part(au.email, '@', 1),
          'Player'
        )
      FROM auth.users au
      WHERE NOT EXISTS (
        SELECT 1 FROM public.users pu WHERE pu.id = au.id
      );
    EXCEPTION WHEN others THEN
      NULL;
    END;
    $$
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql(`ALTER ROLE postgres NOBYPASSRLS`);
};
