/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql(`DROP POLICY IF EXISTS queue_entries_insert ON public.queue_entries;`);
  pgm.sql(`DROP POLICY IF EXISTS courts_insert ON public.courts;`);
  pgm.sql(`DROP POLICY IF EXISTS courts_update ON public.courts;`);
  pgm.sql(`DROP POLICY IF EXISTS courts_delete ON public.courts;`);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql(`
    CREATE POLICY queue_entries_insert ON public.queue_entries
      FOR INSERT WITH CHECK (true);
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
};
