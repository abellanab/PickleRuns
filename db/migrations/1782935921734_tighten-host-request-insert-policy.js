/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Tighten host_requests INSERT: an authenticated user may only self-insert a
  // 'pending' row. Without the status clause a user could POST directly to
  // PostgREST with status='approved' and self-grant hosting, bypassing the
  // approval gate that POST /api/runs relies on.
  pgm.sql(`DROP POLICY IF EXISTS host_requests_insert_own ON public.host_requests`);
  pgm.sql(`
    CREATE POLICY host_requests_insert_own ON public.host_requests
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() AND status = 'pending')
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`DROP POLICY IF EXISTS host_requests_insert_own ON public.host_requests`);
  pgm.sql(`
    CREATE POLICY host_requests_insert_own ON public.host_requests
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid())
  `);
};
