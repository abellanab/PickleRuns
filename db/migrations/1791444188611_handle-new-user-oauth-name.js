/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function up(pgm) {
  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
    BEGIN
      INSERT INTO public.users (id, display_name)
      VALUES (
        NEW.id,
        COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'displayName', ''),
          NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
          NULLIF(NEW.raw_user_meta_data->>'name', ''),
          split_part(NEW.email, '@', 1),
          'Player'
        )
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $function$;
  `);
}

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function down(pgm) {
  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
    BEGIN
      INSERT INTO public.users (id, display_name)
      VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'displayName', split_part(NEW.email, '@', 1), 'Player'))
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $function$;
  `);
}
