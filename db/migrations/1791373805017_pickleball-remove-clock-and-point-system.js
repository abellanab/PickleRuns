/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE games
      DROP COLUMN clock_started_at,
      DROP COLUMN clock_paused_at,
      DROP COLUMN total_paused_seconds,
      DROP COLUMN time_limit_seconds;
  `);
  pgm.sql(`
    ALTER TABLE runs
      DROP COLUMN time_limit_seconds,
      DROP COLUMN point_system;
  `);
  pgm.sql(`DROP TYPE run_point_system;`);
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const down = (pgm) => {
  pgm.sql(`CREATE TYPE run_point_system AS ENUM ('one_two', 'two_three');`);
  pgm.sql(`
    ALTER TABLE runs
      ADD COLUMN point_system run_point_system NOT NULL DEFAULT 'two_three',
      ADD COLUMN time_limit_seconds integer;
  `);
  pgm.sql(`
    ALTER TABLE games
      ADD COLUMN clock_started_at timestamptz NULL,
      ADD COLUMN clock_paused_at timestamptz NULL,
      ADD COLUMN total_paused_seconds integer NOT NULL DEFAULT 0,
      ADD COLUMN time_limit_seconds integer NULL;
  `);
};
