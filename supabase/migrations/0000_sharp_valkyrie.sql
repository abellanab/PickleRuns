CREATE TYPE "public"."game_status" AS ENUM('pending', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."game_team" AS ENUM('team_a', 'team_b');--> statement-breakpoint
CREATE TYPE "public"."game_winner" AS ENUM('team_a', 'team_b');--> statement-breakpoint
CREATE TYPE "public"."queue_entry_status" AS ENUM('waiting', 'marked_out', 'removed');--> statement-breakpoint
CREATE TYPE "public"."run_format" AS ENUM('winner_stays', 'new_ten', 'host_decides');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('lobby', 'active', 'completed');--> statement-breakpoint
CREATE TABLE "game_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"queue_entry_id" uuid NOT NULL,
	"team" "game_team" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"game_number" integer NOT NULL,
	"status" "game_status" DEFAULT 'pending' NOT NULL,
	"score_goal" integer NOT NULL,
	"time_limit_seconds" integer,
	"clock_started_at" timestamp with time zone,
	"clock_paused_at" timestamp with time zone,
	"total_paused_seconds" integer DEFAULT 0 NOT NULL,
	"score_a" integer DEFAULT 0 NOT NULL,
	"score_b" integer DEFAULT 0 NOT NULL,
	"winner" "game_winner",
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"user_id" uuid,
	"display_name" text NOT NULL,
	"status" "queue_entry_status" DEFAULT 'waiting' NOT NULL,
	"after_entry_id" uuid,
	"games_played" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" uuid NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"format" "run_format" NOT NULL,
	"status" "run_status" DEFAULT 'lobby' NOT NULL,
	"session_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "score_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"queue_entry_id" uuid NOT NULL,
	"team" "game_team" NOT NULL,
	"voided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_queue_entry_id_queue_entries_id_fk" FOREIGN KEY ("queue_entry_id") REFERENCES "public"."queue_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_after_entry_id_queue_entries_id_fk" FOREIGN KEY ("after_entry_id") REFERENCES "public"."queue_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_events" ADD CONSTRAINT "score_events_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_events" ADD CONSTRAINT "score_events_queue_entry_id_queue_entries_id_fk" FOREIGN KEY ("queue_entry_id") REFERENCES "public"."queue_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_game_players_game_entry" ON "game_players" USING btree ("game_id","queue_entry_id");--> statement-breakpoint
CREATE INDEX "idx_game_players_game_id" ON "game_players" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_game_players_queue_entry_id" ON "game_players" USING btree ("queue_entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_games_run_id_game_number" ON "games" USING btree ("run_id","game_number");--> statement-breakpoint
CREATE INDEX "idx_games_run_id" ON "games" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "idx_games_status" ON "games" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_queue_entries_run_id" ON "queue_entries" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "idx_queue_entries_user_id" ON "queue_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_queue_entries_after_entry_id" ON "queue_entries" USING btree ("after_entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_runs_session_code" ON "runs" USING btree ("session_code");--> statement-breakpoint
CREATE INDEX "idx_runs_host_id" ON "runs" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "idx_runs_status" ON "runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_score_events_game_id" ON "score_events" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_score_events_queue_entry_id" ON "score_events" USING btree ("queue_entry_id");--> statement-breakpoint
CREATE INDEX "idx_score_events_game_voided" ON "score_events" USING btree ("game_id") WHERE voided_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_users_created_at" ON "users" USING btree ("created_at");