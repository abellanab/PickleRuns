/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const up = (pgm) => {
  pgm.sql(`CREATE TYPE run_point_system AS ENUM ('one_two', 'two_three');`);
  pgm.sql(`ALTER TABLE runs ADD COLUMN point_system run_point_system NOT NULL DEFAULT 'two_three';`);
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const down = (pgm) => {
  pgm.sql(`ALTER TABLE runs DROP COLUMN point_system;`);
  pgm.sql(`DROP TYPE IF EXISTS run_point_system;`);
};
