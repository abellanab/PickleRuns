/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql(`
    -- Queue rotation on game completion (multi-court).
    --
    -- Fires when a game transitions into 'completed'.
    --   1. run_mode = 'score_only' has no queue: do nothing.
    --   2. Takes pg_advisory_xact_lock(hashtext(run_id), 2) first. This is the
    --      same key joinQueue uses, so concurrent court completions and joins
    --      serialize and positions never collide.
    --   3. Who rotates:
    --        rotate_all   -> every player of the game
    --        winner_stays -> only the losing side (team <> winner)
    --        no winner recorded -> everyone, in either style
    --      Entries with status = 'removed' never move.
    --   4. Rotating players are appended to the back: new_pos = MAX(position of
    --      non-removed entries) + rank. Winners who stay keep their positions.
    --      Rank order:
    --        rotate_all with a winner -> winners first, then losers; old
    --                                    relative order within each group
    --        otherwise                -> old relative order
    --   Each completion appends after the current max under the lock, so courts
    --   finishing in any order yield completion order.
    CREATE OR REPLACE FUNCTION public.rotate_queue_on_game_complete()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      v_run_mode       run_mode;
      v_rotation_style rotation_style;
      v_max_pos        integer;
    BEGIN
      IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
        RETURN NEW;
      END IF;

      SELECT run_mode, rotation_style INTO v_run_mode, v_rotation_style
      FROM public.runs WHERE id = NEW.run_id;

      IF v_run_mode = 'score_only' THEN
        RETURN NEW;
      END IF;

      PERFORM pg_advisory_xact_lock(hashtext(NEW.run_id::text), 2);

      SELECT COALESCE(MAX(position), 0) INTO v_max_pos
      FROM public.queue_entries
      WHERE run_id = NEW.run_id AND status <> 'removed';

      WITH to_rotate AS (
        SELECT gp.queue_entry_id, gp.team, qe.position AS old_pos
        FROM public.game_players gp
        JOIN public.queue_entries qe ON qe.id = gp.queue_entry_id
        WHERE gp.game_id = NEW.id
          AND qe.status <> 'removed'
          AND (
            NEW.winner IS NULL
            OR v_rotation_style = 'rotate_all'
            OR (v_rotation_style = 'winner_stays' AND gp.team::text <> NEW.winner::text)
          )
      ),
      ranked AS (
        SELECT queue_entry_id,
               v_max_pos + ROW_NUMBER() OVER (
                 ORDER BY
                   CASE
                     WHEN NEW.winner IS NOT NULL AND v_rotation_style = 'rotate_all'
                       THEN (team::text <> NEW.winner::text)
                     ELSE FALSE
                   END ASC,
                   old_pos ASC
               ) AS new_pos
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
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.rotate_queue_on_game_complete()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      v_run_mode       run_mode;
      v_rotation_style rotation_style;
      v_max_pos        integer;
    BEGIN
      IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
        RETURN NEW;
      END IF;

      SELECT run_mode, rotation_style INTO v_run_mode, v_rotation_style
      FROM public.runs WHERE id = NEW.run_id;

      IF v_run_mode = 'score_only' THEN
        RETURN NEW;
      END IF;

      PERFORM pg_advisory_xact_lock(hashtext(NEW.run_id::text), 2);

      SELECT COALESCE(MAX(position), 0) INTO v_max_pos
      FROM public.queue_entries
      WHERE run_id = NEW.run_id AND status <> 'removed';

      WITH to_rotate AS (
        SELECT gp.queue_entry_id, qe.position AS old_pos
        FROM public.game_players gp
        JOIN public.queue_entries qe ON qe.id = gp.queue_entry_id
        WHERE gp.game_id = NEW.id
          AND qe.status <> 'removed'
          AND (
            NEW.winner IS NULL
            OR v_rotation_style = 'rotate_all'
            OR (v_rotation_style = 'winner_stays' AND gp.team::text <> NEW.winner::text)
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
};
