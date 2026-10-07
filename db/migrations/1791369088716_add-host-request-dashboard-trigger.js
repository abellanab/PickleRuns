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
  // Create a trigger that automatically approves host requests
  // when a specific admin-level condition is met or for a dashboard action.
  // Since the user wants the "trigger in DB from the dashboard",
  // we'll ensure the table and logic are ready for an external update.

  // In a real dashboard scenario, the "trigger" is usually a direct update
  // to the host_requests table. But if they want a DB-level trigger
  // for some automatic approval logic:

  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.auto_approve_host_request()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Logic for automatic approval could go here
      -- For now, this is a placeholder to enable the dashboard-driven flow
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_auto_approve_host_request
      BEFORE INSERT ON public.host_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.auto_approve_host_request();
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS trg_auto_approve_host_request ON public.host_requests;');
  pgm.sql('DROP FUNCTION IF EXISTS public.auto_approve_host_request();');
};
