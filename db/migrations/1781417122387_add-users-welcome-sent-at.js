/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function up(pgm) {
  pgm.addColumn("users", {
    welcome_sent_at: { type: "timestamptz", notNull: false },
  });
}

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function down(pgm) {
  pgm.dropColumn("users", "welcome_sent_at");
}
