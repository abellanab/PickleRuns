/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // The on_auth_user_created trigger (from supabase/migrations/0002_triggers.sql)
  // is not present in the live DB — auth.users has no triggers and handle_new_user
  // does not exist, so signups land in auth.users with no public.users row. Every
  // FK into users (host_requests.user_id, runs.host_id, ...) then fails. Recreate
  // the function + trigger idempotently so public.users is populated on signup.
  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      INSERT INTO public.users (id, display_name)
      VALUES (
        NEW.id,
        COALESCE(
          NEW.raw_user_meta_data->>'displayName',
          split_part(NEW.email, '@', 1),
          'Player'
        )
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $$
  `);

  pgm.sql(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`);
  pgm.sql(`
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user()
  `);

  // Backfill the auth.users rows created while the trigger was missing.
  pgm.sql(`
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
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Drops the trigger + function only. The backfilled users rows are left in
  // place — removing them would cascade into runs/host_requests history.
  pgm.sql(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`);
  pgm.sql(`DROP FUNCTION IF EXISTS public.handle_new_user()`);
};
