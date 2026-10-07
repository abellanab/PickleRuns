export const shorthands = undefined;

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const up = (pgm) => {
  pgm.sql(`CREATE TYPE run_mode AS ENUM ('score_only', 'queue_only', 'score_and_queue');`);
  pgm.sql(`CREATE TYPE rotation_style AS ENUM ('winner_stays', 'rotate_all');`);

  pgm.sql(`
    ALTER TABLE public.runs
      ADD COLUMN run_mode run_mode NOT NULL DEFAULT 'score_and_queue',
      ADD COLUMN rotation_style rotation_style NOT NULL DEFAULT 'rotate_all',
      ADD COLUMN court_count integer NOT NULL DEFAULT 1 CHECK (court_count >= 1),
      ADD COLUMN win_by_two boolean NOT NULL DEFAULT false;
  `);
  pgm.sql(`ALTER TABLE public.runs ALTER COLUMN score_goal SET DEFAULT 11;`);

  pgm.sql(`
    CREATE TABLE public.courts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id uuid NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
      number integer NOT NULL CHECK (number >= 1),
      name text,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT uq_courts_run_id_number UNIQUE (run_id, number)
    );
  `);
  pgm.sql(`CREATE INDEX idx_courts_run_id ON public.courts (run_id);`);
  pgm.sql(`ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;`);
  pgm.sql(`
    CREATE POLICY courts_select ON public.courts
      FOR SELECT USING (true);
  `);
  pgm.sql(`
    CREATE POLICY courts_insert ON public.courts
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.runs WHERE runs.id = courts.run_id AND runs.host_id = auth.uid())
      );
  `);
  pgm.sql(`
    CREATE POLICY courts_update ON public.courts
      FOR UPDATE
      USING (
        EXISTS (SELECT 1 FROM public.runs WHERE runs.id = courts.run_id AND runs.host_id = auth.uid())
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.runs WHERE runs.id = courts.run_id AND runs.host_id = auth.uid())
      );
  `);
  pgm.sql(`
    CREATE POLICY courts_delete ON public.courts
      FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.runs WHERE runs.id = courts.run_id AND runs.host_id = auth.uid())
      );
  `);

  pgm.sql(`ALTER TABLE public.games ADD COLUMN court_id uuid REFERENCES public.courts(id) ON DELETE RESTRICT;`);
  pgm.sql(`
    CREATE UNIQUE INDEX uq_games_court_open ON public.games (court_id)
      WHERE status IN ('pending', 'active');
  `);
  pgm.sql(`CREATE INDEX idx_games_court_id ON public.games (court_id);`);

  // 'lobby' and 'active' both: runs are created as 'lobby' and never set to 'active'.
  pgm.sql(`
    CREATE UNIQUE INDEX uq_runs_one_open_per_host ON public.runs (host_id)
      WHERE status IN ('lobby', 'active');
  `);

  pgm.sql(`ALTER TABLE public.games DROP COLUMN IF EXISTS serving_team;`);
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-timed-games') THEN
        PERFORM cron.unschedule('expire-timed-games');
      END IF;
    END $$;
  `);
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const down = (pgm) => {
  pgm.sql(`
    SELECT cron.schedule(
      'expire-timed-games',
      '* * * * *',
      $$
        UPDATE public.games
        SET
          status          = 'completed',
          ended_at        = NOW(),
          clock_paused_at = NOW(),
          winner          = CASE
                              WHEN score_a >= score_b THEN 'team_a'::game_winner
                              ELSE 'team_b'::game_winner
                            END
        WHERE status = 'active'
          AND time_limit_seconds IS NOT NULL
          AND clock_started_at IS NOT NULL
          AND clock_paused_at IS NULL
          AND EXTRACT(EPOCH FROM (NOW() - clock_started_at))::integer - total_paused_seconds >= time_limit_seconds;
      $$
    );
  `);
  pgm.sql(`ALTER TABLE public.games ADD COLUMN IF NOT EXISTS serving_team game_team NOT NULL DEFAULT 'team_a';`);

  pgm.sql(`DROP INDEX IF EXISTS public.uq_runs_one_open_per_host;`);

  pgm.sql(`DROP INDEX IF EXISTS public.idx_games_court_id;`);
  pgm.sql(`DROP INDEX IF EXISTS public.uq_games_court_open;`);
  pgm.sql(`ALTER TABLE public.games DROP COLUMN IF EXISTS court_id;`);

  pgm.sql(`DROP TABLE IF EXISTS public.courts;`);

  pgm.sql(`ALTER TABLE public.runs ALTER COLUMN score_goal SET DEFAULT 21;`);
  pgm.sql(`
    ALTER TABLE public.runs
      DROP COLUMN IF EXISTS win_by_two,
      DROP COLUMN IF EXISTS court_count,
      DROP COLUMN IF EXISTS rotation_style,
      DROP COLUMN IF EXISTS run_mode;
  `);

  pgm.sql(`DROP TYPE IF EXISTS rotation_style;`);
  pgm.sql(`DROP TYPE IF EXISTS run_mode;`);
};
