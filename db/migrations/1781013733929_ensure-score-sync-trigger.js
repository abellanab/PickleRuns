/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function up(pgm) {
  // Ensure the trigger function uses SUM(points) for multi-point support
  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.sync_game_score()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      v_game_id uuid;
    BEGIN
      v_game_id := COALESCE(NEW.game_id, OLD.game_id);

      UPDATE public.games
      SET
        score_a = (
          SELECT COALESCE(SUM(points), 0) FROM public.score_events
          WHERE game_id = v_game_id
            AND team = 'team_a'
            AND voided_at IS NULL
        ),
        score_b = (
          SELECT COALESCE(SUM(points), 0) FROM public.score_events
          WHERE game_id = v_game_id
            AND team = 'team_b'
            AND voided_at IS NULL
        ),
        updated_at = NOW()
      WHERE id = v_game_id;

      RETURN NEW;
    END;
    $$;
  `);

  // Drop and recreate the trigger so it is guaranteed to exist and call the function
  pgm.sql(`
    DROP TRIGGER IF EXISTS trg_score_events_update_game_score ON public.score_events;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_score_events_update_game_score
      AFTER INSERT OR UPDATE OF voided_at ON public.score_events
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_game_score();
  `);
}

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function down(pgm) {
  // Restore COUNT(*) version of the function (pre-points migration)
  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.sync_game_score()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      v_game_id uuid;
    BEGIN
      v_game_id := COALESCE(NEW.game_id, OLD.game_id);

      UPDATE public.games
      SET
        score_a = (
          SELECT COUNT(*) FROM public.score_events
          WHERE game_id = v_game_id
            AND team = 'team_a'
            AND voided_at IS NULL
        ),
        score_b = (
          SELECT COUNT(*) FROM public.score_events
          WHERE game_id = v_game_id
            AND team = 'team_b'
            AND voided_at IS NULL
        ),
        updated_at = NOW()
      WHERE id = v_game_id;

      RETURN NEW;
    END;
    $$;
  `);

  // Recreate the trigger (it should already exist, but ensure it)
  pgm.sql(`
    DROP TRIGGER IF EXISTS trg_score_events_update_game_score ON public.score_events;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_score_events_update_game_score
      AFTER INSERT OR UPDATE OF voided_at ON public.score_events
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_game_score();
  `);
}
