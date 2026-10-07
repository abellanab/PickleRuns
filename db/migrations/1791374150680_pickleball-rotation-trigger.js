/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  // a. Multi-court rotation function.
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
    --   4. Rotating players are appended to the back, keeping their relative
    --      order: new_pos = MAX(position of non-removed entries) + rank by old
    --      position. Winners who stay keep their positions.
    --   Each completion appends after the current max under the lock, so courts
    --   finishing in any order yield completion order, with relative order
    --   preserved within a game.
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

  // b. Drop 'tie' from game_winner (tied games become winner = NULL).
  pgm.sql(`
    CREATE TYPE game_winner_new AS ENUM ('team_a', 'team_b');
    ALTER TABLE games ALTER COLUMN winner TYPE game_winner_new
      USING (CASE WHEN winner::text = 'tie' THEN NULL ELSE winner::text::game_winner_new END);
    DROP TYPE game_winner;
    ALTER TYPE game_winner_new RENAME TO game_winner;
  `);

  // c. Drop legacy run format.
  pgm.sql(`
    ALTER TABLE runs DROP COLUMN format;
    DROP TYPE run_format;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql(`
    CREATE TYPE run_format AS ENUM ('winner_stays', 'new_ten', 'host_decides');
    ALTER TABLE runs ADD COLUMN format run_format NOT NULL DEFAULT 'new_ten';
  `);

  pgm.sql(`
    CREATE TYPE game_winner_old AS ENUM ('team_a', 'team_b', 'tie');
    ALTER TABLE games ALTER COLUMN winner TYPE game_winner_old
      USING (winner::text::game_winner_old);
    DROP TYPE game_winner;
    ALTER TYPE game_winner_old RENAME TO game_winner;
  `);

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
};
