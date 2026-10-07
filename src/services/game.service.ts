import { db } from "@/db";
import { runs, courts, games, gamePlayers, queueEntries, scoreEvents } from "@/db/schema";
import { eq, desc, inArray, and, sql, isNull } from "drizzle-orm";
import { RunNotFoundError, isUniqueViolationOn } from "@/services/run.service";
import { CourtNotFoundError, CourtOccupiedError, getEligiblePlayers } from "@/services/court.service";
import type { Game, ScoreEvent } from "@/types/db";

// Thrown when submitted queue entry IDs do not belong to the target run.
// The route catches this and returns 400 rather than letting it bubble as 500.
export class InvalidEntryIdsError extends Error {
  constructor() {
    super("One or more queue entry IDs do not belong to this run");
    this.name = "InvalidEntryIdsError";
  }
}

export class PlayerUnavailableError extends Error {
  constructor() {
    super("One or more players are not available for a new game");
    this.name = "PlayerUnavailableError";
  }
}

export class InvalidRosterError extends Error {
  constructor() {
    super("Each side needs 1-2 players with no duplicates");
    this.name = "InvalidRosterError";
  }
}

export class WinnerRequiredError extends Error {
  constructor() {
    super("A winner must be chosen for a tied game in winner-stays mode");
    this.name = "WinnerRequiredError";
  }
}

const COURT_OPEN_GAME_CONSTRAINT = "uq_games_court_open";
const GAMES_COURT_FK_CONSTRAINT = "games_court_id_fkey";

function isForeignKeyViolation(err: unknown): boolean {
  let current: unknown = err;
  for (let depth = 0; depth < 3 && typeof current === "object" && current !== null; depth++) {
    const e = current as { code?: unknown; constraint_name?: unknown; message?: unknown; cause?: unknown };
    if (
      e.code === "23503" &&
      (e.constraint_name === GAMES_COURT_FK_CONSTRAINT ||
        (typeof e.message === "string" && e.message.includes(GAMES_COURT_FK_CONSTRAINT)))
    ) {
      return true;
    }
    current = e.cause;
  }
  return false;
}

// Thrown when a game-creation attempt targets a run that has already been
// closed. Maps to 409 — a completed run is terminal; no new games.
export class RunCompletedError extends Error {
  constructor() {
    super("Run is already completed");
    this.name = "RunCompletedError";
  }
}

// Thrown when a gameId does not exist or does not belong to the target run.
// The route catches this and returns 404 so a host cannot act on a game in a
// run they do not own (the URL only carries the run code, not the game's run).
export class GameNotFoundError extends Error {
  constructor() {
    super("Game not found");
    this.name = "GameNotFoundError";
  }
}

// Thrown when a mutation targets a game that has already completed. Maps to
// 409 — completed games are immutable (no scores or undos).
export class GameCompletedError extends Error {
  constructor() {
    super("Game is already completed");
    this.name = "GameCompletedError";
  }
}

// Thrown when a score is attributed to a queue entry that is not a player on
// on this game's roster on the given side. The FK only enforces queue_entry_id
// existence, not roster membership, so without this check a point could be
// credited to a player from another game or the wrong side.
export class PlayerNotInGameError extends Error {
  constructor() {
    super("Player is not on this team in this game");
    this.name = "PlayerNotInGameError";
  }
}

// Thrown when an identical score event (same game, player, team) was
// already recorded within SCORE_DEDUP_MS. Replaces the old in-memory rate
// limiter, which did not hold on serverless (per-instance Map). This check runs
// inside the FOR UPDATE transaction, so the second submit blocks on the first's
// row lock and reliably sees it — a true cross-instance guard against double-taps.
export class DuplicateScoreError extends Error {
  constructor() {
    super("Duplicate score — ignored");
    this.name = "DuplicateScoreError";
  }
}

// Window for treating an identical score event as an accidental duplicate. Short
// enough that intentional consecutive rally taps on the same player still count.
const SCORE_DEDUP_MS = 300;

export async function getGamesByRunId(runId: string): Promise<Game[]> {
  return db
    .select()
    .from(games)
    .where(eq(games.runId, runId))
    .orderBy(desc(games.gameNumber));
}

export async function createGame(
  runId: string,
  courtId: string,
  sideAIds: string[],
  sideBIds: string[],
): Promise<Game> {
  const [run] = await db.select().from(runs).where(eq(runs.id, runId)).limit(1);
  if (!run) throw new RunNotFoundError();
  if (run.status === "completed") throw new RunCompletedError();

  const allEntryIds = [...sideAIds, ...sideBIds];
  const sizesValid =
    sideAIds.length >= 1 &&
    sideAIds.length <= 2 &&
    sideBIds.length >= 1 &&
    sideBIds.length <= 2 &&
    Math.abs(sideAIds.length - sideBIds.length) <= 1;
  if (!sizesValid || new Set(allEntryIds).size !== allEntryIds.length) throw new InvalidRosterError();

  try {
    return await db.transaction(async (tx) => {
      // Per-run advisory lock so concurrent creations read a consistent MAX and
      // eligibility snapshot instead of colliding on game_number.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${runId}))`);

      const [court] = await tx
        .select({ id: courts.id })
        .from(courts)
        .where(and(eq(courts.id, courtId), eq(courts.runId, runId)))
        .limit(1);
      if (!court) throw new CourtNotFoundError();

      const valid = await tx
        .select({ id: queueEntries.id })
        .from(queueEntries)
        .where(and(inArray(queueEntries.id, allEntryIds), eq(queueEntries.runId, runId)));
      if (valid.length !== allEntryIds.length) throw new InvalidEntryIdsError();

      const eligible = new Set((await getEligiblePlayers(runId, tx)).map((p) => p.entryId));
      if (!allEntryIds.every((id) => eligible.has(id))) throw new PlayerUnavailableError();

      const [{ maxNum }] = await tx
        .select({ maxNum: sql<number>`COALESCE(MAX(${games.gameNumber}), 0)` })
        .from(games)
        .where(eq(games.runId, runId));

      const [game] = await tx
        .insert(games)
        .values({
          runId,
          courtId,
          gameNumber: (maxNum ?? 0) + 1,
          status: "active",
          startedAt: new Date(),
          scoreGoal: run.scoreGoal,
        })
        .returning();

      await tx.insert(gamePlayers).values([
        ...sideAIds.map((id) => ({ gameId: game.id, queueEntryId: id, team: "team_a" as const })),
        ...sideBIds.map((id) => ({ gameId: game.id, queueEntryId: id, team: "team_b" as const })),
      ]);

      return game;
    });
  } catch (err) {
    if (isUniqueViolationOn(err, COURT_OPEN_GAME_CONSTRAINT)) throw new CourtOccupiedError();
    if (isForeignKeyViolation(err)) throw new CourtNotFoundError();
    throw err;
  }
}

// ─── Game detail types ────────────────────────────────────────────────────────

export type PlayerWithStats = {
  queueEntryId: string;
  displayName: string;
  team: "team_a" | "team_b";
  points: number;
};

export type ScoreEventEntry = {
  id: string;
  queueEntryId: string;
  displayName: string;
  team: "team_a" | "team_b";
  points: number;
  createdAt: string;
};

export type GameWithDetails = {
  game: Game;
  players: PlayerWithStats[];
  recentEvents: ScoreEventEntry[];
};

// ─── Game detail query ────────────────────────────────────────────────────────

export async function getGameWithDetails(gameId: string): Promise<GameWithDetails | null> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!game) return null;

  const [playerRows, recentRows] = await Promise.all([
    db
      .select({
        queueEntryId: gamePlayers.queueEntryId,
        displayName: queueEntries.displayName,
        team: gamePlayers.team,
        points: sql<number>`COALESCE(SUM(${scoreEvents.points}), 0)`,
      })
      .from(gamePlayers)
      .innerJoin(queueEntries, eq(queueEntries.id, gamePlayers.queueEntryId))
      .leftJoin(
        scoreEvents,
        and(
          eq(scoreEvents.queueEntryId, gamePlayers.queueEntryId),
          eq(scoreEvents.gameId, gameId),
          isNull(scoreEvents.voidedAt),
        ),
      )
      .where(eq(gamePlayers.gameId, gameId))
      .groupBy(gamePlayers.queueEntryId, queueEntries.displayName, gamePlayers.team)
      // Sort at the SQL layer so the leader is always first. Tie-break by
      // displayName ASC for a stable order when two players finish on the
      // same points total.
      .orderBy(
        desc(sql`COALESCE(SUM(${scoreEvents.points}), 0)`),
        queueEntries.displayName,
      ),

    db
      .select({
        id: scoreEvents.id,
        queueEntryId: scoreEvents.queueEntryId,
        displayName: queueEntries.displayName,
        team: scoreEvents.team,
        points: scoreEvents.points,
        createdAt: scoreEvents.createdAt,
      })
      .from(scoreEvents)
      .innerJoin(queueEntries, eq(queueEntries.id, scoreEvents.queueEntryId))
      .where(and(eq(scoreEvents.gameId, gameId), isNull(scoreEvents.voidedAt)))
      .orderBy(desc(scoreEvents.createdAt))
      .limit(10),
  ]);

  return {
    game,
    players: playerRows.map((r) => ({
      queueEntryId: r.queueEntryId,
      displayName: r.displayName,
      team: r.team,
      points: Number(r.points),
    })),
    recentEvents: recentRows.map((r) => ({
      id: r.id,
      queueEntryId: r.queueEntryId,
      displayName: r.displayName,
      team: r.team,
      points: r.points,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export async function recordScore(
  gameId: string,
  runId: string,
  queueEntryId: string,
): Promise<{ event: ScoreEvent; game: Game }> {
  return db.transaction(async (tx) => {
    // Row lock so a concurrent endGame (which also locks this row) cannot close
    // the game between our status check and the score insert — serializes the
    // read-check-insert against game completion.
    const [game] = await tx
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1)
      .for("update");
    if (!game || game.runId !== runId) throw new GameNotFoundError();
    if (game.status === "completed") throw new GameCompletedError();

    const [run] = await tx.select().from(runs).where(eq(runs.id, runId)).limit(1);
    if (!run) throw new RunNotFoundError();

    const [member] = await tx
      .select({ team: gamePlayers.team })
      .from(gamePlayers)
      .where(and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.queueEntryId, queueEntryId)))
      .limit(1);
    if (!member) throw new PlayerNotInGameError();
    const team = member.team;

    // Dedup guard — reject an identical score event landing within the window.
    // Safe because the FOR UPDATE lock above serializes scores for this game, so
    // a rapid second submit waits for the first to commit and then sees it here.
    const [recent] = await tx
      .select({ id: scoreEvents.id })
      .from(scoreEvents)
      .where(
        and(
          eq(scoreEvents.gameId, gameId),
          eq(scoreEvents.queueEntryId, queueEntryId),
          eq(scoreEvents.team, team),
          isNull(scoreEvents.voidedAt),
          sql`${scoreEvents.createdAt} >= NOW() - (${SCORE_DEDUP_MS} || ' milliseconds')::interval`,
        ),
      )
      .limit(1);
    if (recent) throw new DuplicateScoreError();

    if (game.status === "pending") {
      await tx
        .update(games)
        .set({ status: "active", startedAt: new Date() })
        .where(eq(games.id, gameId));
    }

    const [event] = await tx
      .insert(scoreEvents)
      .values({ gameId, queueEntryId, team, points: 1 })
      .returning();

    // Re-read to get trigger-updated scores
    const [updated] = await tx.select().from(games).where(eq(games.id, gameId)).limit(1);
    const leaderScore = Math.max(updated.scoreA, updated.scoreB);
    const lead = Math.abs(updated.scoreA - updated.scoreB);
    const reachedGoal = leaderScore >= updated.scoreGoal && (!run.winByTwo || lead >= 2);
    if (!reachedGoal) return { event, game: updated };

    const [completed] = await tx
      .update(games)
      .set({
        status: "completed",
        winner: updated.scoreA > updated.scoreB ? "team_a" : "team_b",
        endedAt: new Date(),
      })
      .where(eq(games.id, gameId))
      .returning();
    // Queue rotation is handled by the trg_rotate_queue_on_game_complete
    // trigger that fires on this status → 'completed' transition.

    return { event, game: completed };
  });
}

export async function undoLastScore(
  gameId: string,
  runId: string,
): Promise<{ event: ScoreEvent; game: Game } | null> {
  return db.transaction(async (tx) => {
    // Row lock so a concurrent recordScore/endGame (which lock the same row)
    // serializes against the void, and two rapid undos cannot both read the
    // same "last" event. Also blocks voiding after the game is completed,
    // which would change the score without re-evaluating winner or rotation.
    const [game] = await tx
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1)
      .for("update");
    if (!game || game.runId !== runId) throw new GameNotFoundError();
    if (game.status === "completed") throw new GameCompletedError();

    const [event] = await tx
      .select()
      .from(scoreEvents)
      .where(and(eq(scoreEvents.gameId, gameId), isNull(scoreEvents.voidedAt)))
      .orderBy(desc(scoreEvents.createdAt))
      .limit(1);

    if (!event) return null;

    const [voided] = await tx
      .update(scoreEvents)
      .set({ voidedAt: new Date() })
      .where(eq(scoreEvents.id, event.id))
      .returning();

    const [updated] = await tx.select().from(games).where(eq(games.id, gameId)).limit(1);

    return { event: voided, game: updated };
  });
}

// ─── End game ─────────────────────────────────────────────────────────────────

export async function endGame(
  gameId: string,
  runId: string,
  explicitWinner?: "team_a" | "team_b",
): Promise<Game> {
  return db.transaction(async (tx) => {
    // Row lock on the game so a concurrent recordScore (whose trigger takes
    // the same row lock) blocks until we commit, and its updates are visible
    // in our subsequent read.
    const [game] = await tx
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1)
      .for("update");
    if (!game || game.runId !== runId) throw new GameNotFoundError();
    if (game.status === "completed") return game;

    // Per-run advisory lock — same key as createGame — so court and
    // eligibility reads in a concurrent createGame are serialized against
    // this completion.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${game.runId}))`);

    const [run] = await tx.select().from(runs).where(eq(runs.id, runId)).limit(1);
    if (!run) throw new RunNotFoundError();

    let winner: "team_a" | "team_b" | null = null;
    if (explicitWinner) winner = explicitWinner;
    else if (game.scoreA > game.scoreB) winner = "team_a";
    else if (game.scoreB > game.scoreA) winner = "team_b";
    else if (run.rotationStyle === "winner_stays") throw new WinnerRequiredError();

    const now = new Date();

    const [updated] = await tx
      .update(games)
      .set({
        status: "completed",
        winner,
        endedAt: now,
      })
      .where(eq(games.id, gameId))
      .returning();
    // Queue rotation is handled by the trg_rotate_queue_on_game_complete
    // trigger that fires on this status → 'completed' transition.

    return updated;
  });
}
