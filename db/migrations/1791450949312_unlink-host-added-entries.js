/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const up = (pgm) => {
  pgm.sql(`
    UPDATE public.queue_entries qe
    SET user_id = NULL
    FROM public.runs r, public.users u
    WHERE qe.run_id = r.id
      AND u.id = r.host_id
      AND qe.user_id = r.host_id
      AND lower(trim(qe.display_name)) <> lower(trim(u.display_name));
  `);
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const down = () => {
  // Intentional no-op: the original host links are not recoverable, and
  // re-linking guests to the host would reintroduce the bug this fixes.
};
