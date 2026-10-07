/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const up = (pgm) => {
  pgm.sql(`ALTER TYPE game_winner ADD VALUE 'tie';`);

  // Update pg_cron expire job to treat equal scores as a tie
  pgm.sql(`SELECT cron.unschedule('expire-timed-games');`);

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
                              WHEN score_a = score_b THEN 'tie'::game_winner
                              WHEN score_a > score_b THEN 'team_a'::game_winner
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

  // Restore previous cron logic (ties go to team_a)
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

  // PostgreSQL does not support removing enum values.
  // The 'tie' value will remain in game_winner but will not be used by app code.
};
