/**
 * Move queue rotation from application code into a DB trigger so it happens on
 * EVERY game-completion path, not just the host's "End game" / score-to-goal
 * flows. Previously the pg_cron time-expiry job (and any other completion path)
 * closed a game without rotating the queue, leaving the losing team stuck at the
 * front. Making rotation a side-effect of the status → 'completed' transition
 * gives a single source of truth shared by the app, the score auto-complete, and
 * the cron expiry job.
 *
 * Mirrors the old application rotateQueue() logic exactly:
 *   - host_decides : no auto-rotation (host manages the queue manually)
 *   - new_ten / tie: rotate every player in the game to the back
 *   - winner_stays : rotate only the losing team to the back
 * Rotated players keep their relative order and are appended after the current
 * max position among non-removed entries.
 */

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.rotate_queue_on_game_complete()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      v_format  run_format;
      v_max_pos integer;
    BEGIN
      -- Only act when a game first transitions into 'completed'.
      IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
        RETURN NEW;
      END IF;

      SELECT format INTO v_format FROM public.runs WHERE id = NEW.run_id;

      -- host_decides: the host controls the queue manually — never auto-rotate.
      IF v_format = 'host_decides' THEN
        RETURN NEW;
      END IF;

      SELECT COALESCE(MAX(position), 0) INTO v_max_pos
      FROM public.queue_entries
      WHERE run_id = NEW.run_id AND status <> 'removed';

      WITH to_rotate AS (
        SELECT gp.queue_entry_id, qe.position AS old_pos
        FROM public.game_players gp
        JOIN public.queue_entries qe ON qe.id = gp.queue_entry_id
        WHERE gp.game_id = NEW.id
          AND (
            v_format = 'new_ten'
            OR NEW.winner = 'tie'
            OR (v_format = 'winner_stays' AND gp.team::text <> NEW.winner::text)
          )
      ),
      ranked AS (
        SELECT queue_entry_id,
               v_max_pos + ROW_NUMBER() OVER (ORDER BY old_pos) AS new_pos
        FROM to_rotate
      )
      UPDATE public.queue_entries qe
      SET position = ranked.new_pos, updated_at = NOW()
      FROM ranked
      WHERE qe.id = ranked.queue_entry_id;

      RETURN NEW;
    END;
    $$;
  `);

  // Fire only when the status column itself is updated — avoids running on every
  // score-sync UPDATE (which touches score_a/score_b, not status).
  pgm.sql(`
    DROP TRIGGER IF EXISTS trg_rotate_queue_on_game_complete ON public.games;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_rotate_queue_on_game_complete
      AFTER UPDATE OF status ON public.games
      FOR EACH ROW
      EXECUTE FUNCTION public.rotate_queue_on_game_complete();
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql(`DROP TRIGGER IF EXISTS trg_rotate_queue_on_game_complete ON public.games;`);
  pgm.sql(`DROP FUNCTION IF EXISTS public.rotate_queue_on_game_complete();`);
};
