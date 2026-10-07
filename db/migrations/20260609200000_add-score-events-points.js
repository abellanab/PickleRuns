/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function up(pgm) {
  pgm.addColumn("score_events", {
    points: {
      type: "integer",
      notNull: true,
      default: 1,
    },
  });

  // Update trigger to SUM(points) so multi-point baskets (+2/+3) work correctly
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
}

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function down(pgm) {
  // Restore COUNT(*) trigger
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
  pgm.dropColumn("score_events", "points");
}
