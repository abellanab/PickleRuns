-- ─── users ────────────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ─── runs ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Authenticated: own run or a run they have a queue entry in
CREATE POLICY "runs_select_authenticated" ON public.runs
  FOR SELECT TO authenticated
  USING (
    host_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.queue_entries
      WHERE run_id = runs.id AND user_id = auth.uid()
    )
  );

-- Anon: unrestricted read — needed for QR join lookup by session_code
CREATE POLICY "runs_select_anon" ON public.runs
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "runs_insert" ON public.runs
  FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "runs_update" ON public.runs
  FOR UPDATE TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());


-- ─── queue_entries ────────────────────────────────────────────────────────────

ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can read — guests and spectators need the queue list
CREATE POLICY "queue_entries_select" ON public.queue_entries
  FOR SELECT
  USING (true);

-- Anyone can insert — guest join requires no account
CREATE POLICY "queue_entries_insert" ON public.queue_entries
  FOR INSERT
  WITH CHECK (true);

-- Only the run host can update (status changes, reordering)
CREATE POLICY "queue_entries_update" ON public.queue_entries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.runs
      WHERE id = queue_entries.run_id AND host_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.runs
      WHERE id = queue_entries.run_id AND host_id = auth.uid()
    )
  );


-- ─── games ────────────────────────────────────────────────────────────────────

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Anyone can read — spectators need live game state
CREATE POLICY "games_select" ON public.games
  FOR SELECT
  USING (true);

CREATE POLICY "games_insert" ON public.games
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.runs
      WHERE id = games.run_id AND host_id = auth.uid()
    )
  );

CREATE POLICY "games_update" ON public.games
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.runs
      WHERE id = games.run_id AND host_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.runs
      WHERE id = games.run_id AND host_id = auth.uid()
    )
  );


-- ─── game_players ─────────────────────────────────────────────────────────────

ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

-- Anyone can read — spectators and players need to see team rosters
CREATE POLICY "game_players_select" ON public.game_players
  FOR SELECT
  USING (true);

CREATE POLICY "game_players_insert" ON public.game_players
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.runs r ON r.id = g.run_id
      WHERE g.id = game_players.game_id AND r.host_id = auth.uid()
    )
  );


-- ─── score_events ─────────────────────────────────────────────────────────────

ALTER TABLE public.score_events ENABLE ROW LEVEL SECURITY;

-- Anyone can read — score log is public within a run
CREATE POLICY "score_events_select" ON public.score_events
  FOR SELECT
  USING (true);

CREATE POLICY "score_events_insert" ON public.score_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.runs r ON r.id = g.run_id
      WHERE g.id = score_events.game_id AND r.host_id = auth.uid()
    )
  );

-- Only update voided_at — undo flow
CREATE POLICY "score_events_update" ON public.score_events
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.runs r ON r.id = g.run_id
      WHERE g.id = score_events.game_id AND r.host_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.runs r ON r.id = g.run_id
      WHERE g.id = score_events.game_id AND r.host_id = auth.uid()
    )
  );
