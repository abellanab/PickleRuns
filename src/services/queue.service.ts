import { db } from "@/db";
import { queueEntries, games, gamePlayers, courts } from "@/db/schema";
import { eq, and, ne, sql, inArray, asc } from "drizzle-orm";
import type { QueueEntry } from "@/types/db";

export async function joinQueue(
  runId: string,
  displayName: string,
  userId?: string | null,
) {
  return db.transaction(async (tx) => {
    // Per-run advisory lock (two-int4 space — distinct from the game-creation lock)
    // Serializes concurrent joins so two callers can't both read the same max position
    // and produce a duplicate.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${runId}), 2)`);

    const [{ maxPos }] = await tx
      .select({ maxPos: sql<number>`COALESCE(MAX(${queueEntries.position}), 0)` })
      .from(queueEntries)
      .where(eq(queueEntries.runId, runId));

    const newPosition = (maxPos ?? 0) + 1;

    const [entry] = await tx
      .insert(queueEntries)
      .values({ runId, userId: userId ?? null, displayName, position: newPosition })
      .returning();

    return { entry, position: newPosition };
  });
}

// games_played is not a column — it is derived per request from the count of
// completed games each entry was rostered in (see below). Callers/UI read it
// off this shape, not off the row.
export type QueueEntryWithGames = QueueEntry & {
  gamesPlayed: number;
  courtNumber: number | null;
};

export async function getQueueForRun(
  runId: string,
): Promise<{ onCourt: QueueEntryWithGames[]; waiting: QueueEntryWithGames[] }> {
  const [allEntries, rostered] = await Promise.all([
    db
      .select()
      .from(queueEntries)
      .where(and(eq(queueEntries.runId, runId), ne(queueEntries.status, "removed")))
      .orderBy(asc(queueEntries.position)),
    db
      .select({
        queueEntryId: gamePlayers.queueEntryId,
        courtNumber: courts.number,
      })
      .from(gamePlayers)
      .innerJoin(games, eq(games.id, gamePlayers.gameId))
      .leftJoin(courts, eq(courts.id, games.courtId))
      .where(and(eq(games.runId, runId), inArray(games.status, ["pending", "active"]))),
  ]);

  const courtByEntryId = new Map<string, number | null>();
  for (const row of rostered) {
    if (!courtByEntryId.has(row.queueEntryId)) {
      courtByEntryId.set(row.queueEntryId, row.courtNumber ?? null);
    }
  }

  // Compute games played from completed games — the single source of truth for
  // this number (there is no stored counter).
  const entryIds = allEntries.map((e) => e.id);
  const gamesPlayedMap = new Map<string, number>();
  if (entryIds.length > 0) {
    const counts = await db
      .select({
        queueEntryId: gamePlayers.queueEntryId,
        count: sql<number>`COUNT(*)`,
      })
      .from(gamePlayers)
      .innerJoin(games, eq(games.id, gamePlayers.gameId))
      .where(
        and(
          inArray(gamePlayers.queueEntryId, entryIds),
          eq(games.status, "completed"),
        ),
      )
      .groupBy(gamePlayers.queueEntryId);

    for (const row of counts) {
      gamesPlayedMap.set(row.queueEntryId, Number(row.count));
    }
  }

  const entries: QueueEntryWithGames[] = allEntries.map((entry) => ({
    ...entry,
    gamesPlayed: gamesPlayedMap.get(entry.id) ?? 0,
    courtNumber: courtByEntryId.get(entry.id) ?? null,
  }));

  const onCourt = entries.filter((e) => courtByEntryId.has(e.id));
  const waiting = entries.filter((e) => !courtByEntryId.has(e.id));

  return { onCourt, waiting };
}

export async function updateQueueEntryStatus(
  runId: string,
  entryId: string,
  status: "waiting" | "marked_out" | "removed",
): Promise<QueueEntry | null> {
  const [entry] = await db
    .update(queueEntries)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(queueEntries.id, entryId), eq(queueEntries.runId, runId)))
    .returning();
  return entry ?? null;
}

export async function updateQueueEntryPaid(
  runId: string,
  entryId: string,
  paid: boolean,
): Promise<QueueEntry | null> {
  const [entry] = await db
    .update(queueEntries)
    .set({ paid, updatedAt: new Date() })
    .where(and(eq(queueEntries.id, entryId), eq(queueEntries.runId, runId)))
    .returning();
  return entry ?? null;
}
