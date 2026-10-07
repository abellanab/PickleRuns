/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // 1. Add position column (nullable initially)
  pgm.addColumn("queue_entries", {
    position: { type: "integer", notNull: false },
  });

  // 2. Backfill positions from linked list using recursive CTE
  pgm.sql(`
    WITH RECURSIVE queue_order AS (
      SELECT id, run_id, after_entry_id, 1 AS position
      FROM queue_entries
      WHERE after_entry_id IS NULL
      UNION ALL
      SELECT q.id, q.run_id, q.after_entry_id, queue_order.position + 1
      FROM queue_entries q
      JOIN queue_order ON q.after_entry_id = queue_order.id
    )
    UPDATE queue_entries
    SET position = queue_order.position
    FROM queue_order
    WHERE queue_entries.id = queue_order.id;
  `);

  // 3. Handle orphans/gaps with a high fallback position
  pgm.sql(`
    UPDATE queue_entries
    SET position = 100000 + floor(random() * 100000)::int
    WHERE position IS NULL;
  `);

  // 4. Make position NOT NULL
  pgm.alterColumn("queue_entries", "position", { notNull: true });

  // 5. Add new index on run_id + position
  pgm.createIndex("queue_entries", ["run_id", "position"], {
    name: "idx_queue_entries_run_id_position",
  });

  // 6. Drop old linked-list index
  pgm.sql('DROP INDEX IF EXISTS "idx_queue_entries_after_entry_id"');

  // 7. Drop after_entry_id column (self-referencing FK drops automatically)
  pgm.dropColumn("queue_entries", "after_entry_id");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Restore linked-list column
  pgm.addColumn("queue_entries", {
    after_entry_id: { type: "uuid", notNull: false },
  });

  pgm.sql(`
    ALTER TABLE queue_entries
    ADD CONSTRAINT queue_entries_after_entry_id_fkey
    FOREIGN KEY (after_entry_id) REFERENCES queue_entries(id)
    ON DELETE SET NULL;
  `);

  // Restore old index
  pgm.createIndex("queue_entries", ["after_entry_id"], {
    name: "idx_queue_entries_after_entry_id",
  });

  // Drop new index
  pgm.sql('DROP INDEX IF EXISTS "idx_queue_entries_run_id_position"');

  // Drop position column
  pgm.dropColumn("queue_entries", "position");
};
