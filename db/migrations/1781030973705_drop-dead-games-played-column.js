/**
 * Drop queue_entries.games_played. It was a denormalized counter that nothing
 * ever incremented (no trigger, no service write), so the column held 0 for
 * every row. The number shown to hosts/viewers is computed live in
 * getQueueForRun() by counting game_players rows joined to completed games, so
 * dropping the column changes no displayed value — it only removes a dead field
 * that falsely looked authoritative.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.dropColumn("queue_entries", "games_played");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.addColumn("queue_entries", {
    games_played: { type: "integer", notNull: true, default: 0 },
  });
};
