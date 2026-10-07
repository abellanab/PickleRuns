-- ─── User creation trigger ────────────────────────────────────────────────────
-- Inserts a public.users row whenever a new auth.users row is created.
-- display_name is pulled from signup metadata; falls back to email prefix.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'displayName',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ─── Score sync trigger ───────────────────────────────────────────────────────
-- Keeps games.score_a and games.score_b in sync with score_events.
-- Fires on INSERT and on UPDATE OF voided_at only — no other updates trigger it.
-- SECURITY DEFINER allows it to write to games even when RLS would block the caller.

CREATE OR REPLACE FUNCTION public.sync_game_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game_id uuid;
BEGIN
  v_game_id := COALESCE(NEW.game_id, OLD.game_id);

  UPDATE public.games
  SET
    score_a = (
      SELECT COUNT(*) FROM public.score_events
      WHERE game_id = v_game_id
        AND team = 'team_a'
        AND voided_at IS NULL
    ),
    score_b = (
      SELECT COUNT(*) FROM public.score_events
      WHERE game_id = v_game_id
        AND team = 'team_b'
        AND voided_at IS NULL
    ),
    updated_at = NOW()
  WHERE id = v_game_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_score_events_update_game_score
  AFTER INSERT OR UPDATE OF voided_at ON public.score_events
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_game_score();
