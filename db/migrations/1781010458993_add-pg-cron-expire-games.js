/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const up = (pgm) => {
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS pg_cron;`);

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
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const down = (pgm) => {
  pgm.sql(`SELECT cron.unschedule('expire-timed-games');`);
};
