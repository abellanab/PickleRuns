import { db } from "@/db";
import { runs, courts, games, queueEntries, scoreEvents, gamePlayers } from "@/db/schema";
import { eq, count, desc, inArray, and, or, sql, isNull } from "drizzle-orm";
import type { CreateRunInput } from "@/validators";
import type { Run } from "@/types/db";

// Thrown when a runId resolved by the route no longer matches a run row.
// handleApiError maps this to 404 instead of leaking an internal message.
export class RunNotFoundError extends Error {
  constructor() {
    super("Run not found");
    this.name = "RunNotFoundError";
  }
}

export class HostAlreadyHasActiveRunError extends Error {
  constructor() {
    super("You already have an active run");
    this.name = "HostAlreadyHasActiveRunError";
  }
}

export class RunModeNotSupportedError extends Error {
  constructor() {
    super("This run does not support that action");
    this.name = "RunModeNotSupportedError";
  }
}

export function assertRunModeAllows(
  run: Pick<Run, "runMode">,
  feature: "queue" | "score",
): void {
  if (feature === "queue" && run.runMode === "score_only") {
    throw new RunModeNotSupportedError();
  }
  if (feature === "score" && run.runMode === "queue_only") {
    throw new RunModeNotSupportedError();
  }
}

const ONE_OPEN_RUN_CONSTRAINT = "uq_runs_one_open_per_host";

export function isUniqueViolationOn(err: unknown, constraint: string): boolean {
  let current: unknown = err;
  for (let depth = 0; depth < 3 && typeof current === "object" && current !== null; depth++) {
    const e = current as { code?: unknown; constraint_name?: unknown; message?: unknown; cause?: unknown };
    if (
      e.code === "23505" &&
      (e.constraint_name === constraint ||
        (typeof e.message === "string" && e.message.includes(constraint)))
    ) {
      return true;
    }
    current = e.cause;
  }
  return false;
}

export async function getRunByCode(code: string) {
  const [run] = await db
    .select()
    .from(runs)
    .where(eq(runs.sessionCode, code))
    .limit(1);
  return run ?? null;
}

export async function getRunsForUser(userId: string) {
  const joined = await db
    .selectDistinct({ runId: queueEntries.runId })
    .from(queueEntries)
    .where(eq(queueEntries.userId, userId));

  const joinedIds = joined.map((e) => e.runId);
  const condition =
    joinedIds.length > 0
      ? or(eq(runs.hostId, userId), inArray(runs.id, joinedIds))
      : eq(runs.hostId, userId);

  return db
    .select({
      id: runs.id,
      hostId: runs.hostId,
      name: runs.name,
      location: runs.location,
      status: runs.status,
      runMode: runs.runMode,
      courtCount: runs.courtCount,
      sessionCode: runs.sessionCode,
      createdAt: runs.createdAt,
      gameCount: count(games.id),
    })
    .from(runs)
    .leftJoin(games, eq(games.runId, runs.id))
    .where(condition)
    .groupBy(runs.id)
    .orderBy(desc(runs.createdAt));
}

export async function getActiveRunByHostId(hostId: string): Promise<Run | null> {
  const [run] = await db
    .select()
    .from(runs)
    .where(and(eq(runs.hostId, hostId), inArray(runs.status, ["lobby", "active"])))
    .limit(1);
  return run ?? null;
}

export async function createRun(
  input: CreateRunInput & { hostId: string }
): Promise<Run> {
  const { hostId, name, location, runMode, rotationStyle, courtCount, scoreGoal, winByTwo, sessionCode } = input;
  try {
    return await db.transaction(async (tx) => {
      const [run] = await tx
        .insert(runs)
        .values({ hostId, name, location, runMode, rotationStyle, courtCount, scoreGoal, winByTwo, sessionCode })
        .returning();
      await tx.insert(courts).values(
        Array.from({ length: courtCount }, (_, i) => ({ runId: run.id, number: i + 1 }))
      );
      return run;
    });
  } catch (err) {
    if (isUniqueViolationOn(err, ONE_OPEN_RUN_CONSTRAINT)) {
      throw new HostAlreadyHasActiveRunError();
    }
    throw err;
  }
}

export async function closeRun(runId: string): Promise<Run> {
  const [updated] = await db
    .update(runs)
    .set({ status: "completed" })
    .where(eq(runs.id, runId))
    .returning();
  if (!updated) throw new RunNotFoundError();
  return updated;
}

// Run-level totals for the "Run ended" summary block. Read-only, scoped to
// one run. Only completed games count — the feature is "once a game ended"
// and the live game doesn't have a final score yet.
export type RunStats = {
  gameCount: number;
  playerCount: number;
  startedAt: string;
  topScorers: { displayName: string; points: number }[];
};

export async function getRunStats(runId: string, startedAt: Date): Promise<RunStats> {
  const [totals] = await db
    .select({
      gameCount: sql<number>`COUNT(DISTINCT ${games.id})`,
      playerCount: sql<number>`COUNT(DISTINCT ${gamePlayers.queueEntryId})`,
    })
    .from(games)
    .leftJoin(gamePlayers, eq(gamePlayers.gameId, games.id))
    .where(and(eq(games.runId, runId), eq(games.status, "completed")));

  // Top scorers across the run — sum score events per queue entry, scoped to
  // completed games in this run. Tie-break by displayName ASC for stable
  // ordering when players finish on the same total. Top 3 for the leaderboard.
  const top = await db
    .select({
      displayName: queueEntries.displayName,
      points: sql<number>`COALESCE(SUM(${scoreEvents.points}), 0)`,
    })
    .from(scoreEvents)
    .innerJoin(queueEntries, eq(queueEntries.id, scoreEvents.queueEntryId))
    .innerJoin(games, eq(games.id, scoreEvents.gameId))
    .where(
      and(
        eq(games.runId, runId),
        eq(games.status, "completed"),
        isNull(scoreEvents.voidedAt),
      ),
    )
    .groupBy(scoreEvents.queueEntryId, queueEntries.displayName)
    .orderBy(
      desc(sql`COALESCE(SUM(${scoreEvents.points}), 0)`),
      queueEntries.displayName,
    )
    .limit(3);

  return {
    gameCount: Number(totals?.gameCount ?? 0),
    playerCount: Number(totals?.playerCount ?? 0),
    startedAt: startedAt.toISOString(),
    topScorers: top
      .filter((t) => Number(t.points) > 0)
      .map((t) => ({ displayName: t.displayName, points: Number(t.points) })),
  };
}
