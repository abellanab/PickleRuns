/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function up(pgm) {
  pgm.sql("ALTER TABLE public.host_requests ADD COLUMN email text");
}

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function down(pgm) {
  pgm.sql("ALTER TABLE public.host_requests DROP COLUMN email");
}
