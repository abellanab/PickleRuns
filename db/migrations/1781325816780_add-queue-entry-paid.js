/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function up(pgm) {
  pgm.addColumn("queue_entries", {
    paid: {
      type: "boolean",
      notNull: true,
      default: false,
    },
  });
}

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export async function down(pgm) {
  pgm.dropColumn("queue_entries", "paid");
}
