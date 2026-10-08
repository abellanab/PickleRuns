/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql(`ALTER TABLE public.users ADD COLUMN avatar_url text`);

  pgm.sql(`
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
    ON CONFLICT (id) DO UPDATE SET
      public = true,
      file_size_limit = 2097152,
      allowed_mime_types = EXCLUDED.allowed_mime_types
  `);

  pgm.sql(`DROP POLICY IF EXISTS avatars_insert_own ON storage.objects`);
  pgm.sql(`
    CREATE POLICY avatars_insert_own ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
  `);

  pgm.sql(`DROP POLICY IF EXISTS avatars_update_own ON storage.objects`);
  pgm.sql(`
    CREATE POLICY avatars_update_own ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
  `);

  pgm.sql(`DROP POLICY IF EXISTS avatars_delete_own ON storage.objects`);
  pgm.sql(`
    CREATE POLICY avatars_delete_own ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql(`DROP POLICY IF EXISTS avatars_delete_own ON storage.objects`);
  pgm.sql(`DROP POLICY IF EXISTS avatars_update_own ON storage.objects`);
  pgm.sql(`DROP POLICY IF EXISTS avatars_insert_own ON storage.objects`);

  pgm.sql(`
    DELETE FROM storage.buckets
    WHERE id = 'avatars'
      AND NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'avatars')
  `);

  pgm.sql(`ALTER TABLE public.users DROP COLUMN avatar_url`);
};
