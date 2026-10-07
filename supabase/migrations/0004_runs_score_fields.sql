-- Add score_goal and time_limit_seconds to runs.
-- score_goal: NOT NULL DEFAULT 21 — fills existing rows with 21.
-- time_limit_seconds: nullable — NULL means no clock.
ALTER TABLE public.runs
  ADD COLUMN "score_goal" integer NOT NULL DEFAULT 21,
  ADD COLUMN "time_limit_seconds" integer;
