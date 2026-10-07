-- Link public.users to Supabase auth.users.
-- Drizzle cannot express cross-schema FKs, so this lives here.
ALTER TABLE public.users
  ADD CONSTRAINT users_id_fk
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
