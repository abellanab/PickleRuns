/**
 * Drop the sitting_out mechanism. It existed only to persist a "bench for next
 * game" decision from the team-assignment draft screen, but the draft never
 * persisted anything else (team composition is recomputed on each load), so the
 * immediate sitting_out write was the sole thing a host could leave behind by
 * abandoning the draft — stranding a player off-screen until the run's next game
 * advanced. Benching is now purely local draft state: a benched player stays
 * 'waiting' and is simply not rostered into the confirmed game, so no column or
 * trigger is needed. Reverses migration 20260609120000_add-queue-sitting-out.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql("DROP TRIGGER IF EXISTS trg_clear_sitting_out_on_game_advance ON games;");
  pgm.sql("DROP FUNCTION IF EXISTS clear_sitting_out_on_game_advance();");
  pgm.dropColumn("queue_entries", "sitting_out");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.addColumn("queue_entries", {
    sitting_out: { type: "boolean", notNull: true, default: false },
  });

  pgm.sql(`
    CREATE OR REPLACE FUNCTION clear_sitting_out_on_game_advance()
    RETURNS trigger AS $$
    BEGIN
      IF OLD.status = 'pending' AND NEW.status IN ('active', 'completed') THEN
        UPDATE queue_entries
        SET sitting_out = false, updated_at = NOW()
        WHERE run_id = NEW.run_id AND sitting_out = true;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_clear_sitting_out_on_game_advance
    AFTER UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION clear_sitting_out_on_game_advance();
  `);
};
