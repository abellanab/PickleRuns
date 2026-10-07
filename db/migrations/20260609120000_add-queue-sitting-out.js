/**
 * Add sitting_out flag to queue_entries.
 *
 * "Bench for next game" sets sitting_out = true — the player stays in the queue
 * at their original position but is excluded from the current team assignment.
 * The trigger below auto-clears the flag the moment any game for that run
 * transitions out of 'pending' (i.e. starts or is marked completed), so the
 * player surfaces naturally in the next round without the host having to manually
 * restore them. This is intentionally separate from the existing 'marked_out'
 * status, which is a hard removal for the rest of the day.
 */

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function up(pgm) {
  pgm.addColumn("queue_entries", {
    sitting_out: {
      type: "boolean",
      notNull: true,
      default: false,
    },
  });

  // Trigger function: clear sitting_out for all entries in a run whenever a
  // game in that run first leaves the 'pending' state (goes active or completed).
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
}

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function down(pgm) {
  pgm.sql("DROP TRIGGER IF EXISTS trg_clear_sitting_out_on_game_advance ON games;");
  pgm.sql("DROP FUNCTION IF EXISTS clear_sitting_out_on_game_advance();");
  pgm.dropColumn("queue_entries", "sitting_out");
}
