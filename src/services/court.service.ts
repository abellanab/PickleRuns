import { db } from "@/db";
import { runs, courts, games, gamePlayers, queueEntries, users } from "@/db/schema";
import { and, asc, count, desc, eq, inArray, max, notExists, sql } from "drizzle-orm";
import { RunNotFoundError } from "@/services/run.service";
import { pickNextGroup } from "@/lib/queue-pairs";
import { isHostEntry } from "@/services/queue.service";

const MAX_COURTS = 8;

export class CourtNotFoundError extends Error {
  constructor() {
    super("Court not found");
    this.name = "CourtNotFoundError";
  }
}

export class CourtOccupiedError extends Error {
  constructor() {
    super("Court already has a game in progress");
    this.name = "CourtOccupiedError";
  }
}

export class LastCourtError extends Error {
  constructor() {
    super("A run must keep at least one court");
    this.name = "LastCourtError";
  }
}

export class CourtLimitError extends Error {
  constructor() {
    super(`A run can have at most ${MAX_COURTS} courts`);
    this.name = "CourtLimitError";
  }
}

export class CourtHasHistoryError extends Error {
  constructor() {
    super("Court has game history and cannot be removed");
    this.name = "CourtHasHistoryError";
  }
}

export type CourtPlayer = {
  entryId: string;
  displayName: string;
  avatarUrl: string | null;
  isHost: boolean;
};
export type CourtGame = {
  id: string;
  gameNumber: number;
  status: "pending" | "active";
  scoreA: number;
  scoreB: number;
  scoreGoal: number;
  sideA: CourtPlayer[];
  sideB: CourtPlayer[];
};
export type CourtLastGame = {
  id: string;
  gameNumber: number;
  scoreA: number;
  scoreB: number;
  winner: "team_a" | "team_b" | null;
  sideA: CourtPlayer[];
  sideB: CourtPlayer[];
};
export type CourtState = {
  id: string;
  number: number;
  name: string | null;
  game: CourtGame | null;
  lastGame: CourtLastGame | null;
  fillProposal: FillProposal | null;
};
export type CourtsOverview = { courts: CourtState[]; nextUp: CourtPlayer[] };
export type FillProposal = { sideA: CourtPlayer[]; sideB: CourtPlayer[]; needed: number };

type AllocationContext = {
  run: Pick<typeof runs.$inferSelect, "runMode" | "rotationStyle">;
  courtRows: { id: string; number: number }[];
  busyCourtIds: Set<string>;
};

type Executor = Pick<typeof db, "select">;

const openGameStatuses = ["pending", "active"] as const;

// Waiting entries of the run that are not rostered in a pending/active game,
// in queue order.
export async function getEligiblePlayers(runId: string, executor: Executor = db): Promise<CourtPlayer[]> {
  const rows = await executor
    .select({
      entryId: queueEntries.id,
      displayName: queueEntries.displayName,
      avatarUrl: users.avatarUrl,
      isHost: isHostEntry,
    })
    .from(queueEntries)
    .leftJoin(users, eq(users.id, queueEntries.userId))
    .innerJoin(runs, eq(runs.id, queueEntries.runId))
    .where(
      and(
        eq(queueEntries.runId, runId),
        eq(queueEntries.status, "waiting"),
        notExists(
          executor
            .select({ one: sql`1` })
            .from(gamePlayers)
            .innerJoin(games, eq(games.id, gamePlayers.gameId))
            .where(
              and(
                eq(gamePlayers.queueEntryId, queueEntries.id),
                inArray(games.status, [...openGameStatuses]),
              ),
            ),
        ),
      ),
    )
    .orderBy(asc(queueEntries.position));
  return rows;
}

// entryId -> partner entryId, from each entry's most recent game, only when
// that side had exactly two players and the partner is also in `entryIds`.
export async function getPartnerMap(entryIds: string[]): Promise<Map<string, string>> {
  const partnerOf = new Map<string, string>();
  if (entryIds.length === 0) return partnerOf;

  const history = await db
    .select({ entryId: gamePlayers.queueEntryId, gameId: gamePlayers.gameId, team: gamePlayers.team })
    .from(gamePlayers)
    .innerJoin(games, eq(games.id, gamePlayers.gameId))
    .where(inArray(gamePlayers.queueEntryId, entryIds))
    .orderBy(desc(games.createdAt), desc(games.gameNumber));

  const latest = new Map<string, { gameId: string; team: string }>();
  for (const row of history) {
    if (!latest.has(row.entryId)) latest.set(row.entryId, { gameId: row.gameId, team: row.team });
  }
  if (latest.size === 0) return partnerOf;

  const rosters = await db
    .select({ gameId: gamePlayers.gameId, team: gamePlayers.team, entryId: gamePlayers.queueEntryId })
    .from(gamePlayers)
    .where(inArray(gamePlayers.gameId, [...new Set([...latest.values()].map((l) => l.gameId))]));

  const eligibleIds = new Set(entryIds);
  for (const [entryId, { gameId, team }] of latest) {
    const side = rosters.filter((r) => r.gameId === gameId && r.team === team);
    if (side.length !== 2) continue;
    const partner = side.find((r) => r.entryId !== entryId);
    if (partner && eligibleIds.has(partner.entryId)) partnerOf.set(entryId, partner.entryId);
  }
  return partnerOf;
}

export async function getCourtsOverview(runId: string): Promise<CourtsOverview> {
  const [[run], courtRows, openGames] = await Promise.all([
    db.select().from(runs).where(eq(runs.id, runId)).limit(1),
    db.select().from(courts).where(eq(courts.runId, runId)).orderBy(asc(courts.number)),
    db
      .select()
      .from(games)
      .where(and(eq(games.runId, runId), inArray(games.status, [...openGameStatuses]))),
  ]);
  if (!run) throw new RunNotFoundError();

  const loadRoster = async () =>
    openGames.length === 0
      ? []
      : db
          .select({
            gameId: gamePlayers.gameId,
            team: gamePlayers.team,
            entryId: queueEntries.id,
            displayName: queueEntries.displayName,
            avatarUrl: users.avatarUrl,
      isHost: isHostEntry,
            position: queueEntries.position,
          })
          .from(gamePlayers)
          .innerJoin(queueEntries, eq(queueEntries.id, gamePlayers.queueEntryId))
          .leftJoin(users, eq(users.id, queueEntries.userId))
    .innerJoin(runs, eq(runs.id, queueEntries.runId))
          .where(inArray(gamePlayers.gameId, openGames.map((g) => g.id)))
          .orderBy(asc(queueEntries.position));

  const loadLast = async () => {
    if (courtRows.length === 0) return { lastGames: [], lastRosterRows: [] };
    const lastGames = await db
      .selectDistinctOn([games.courtId])
      .from(games)
      .where(
        and(
          eq(games.status, "completed"),
          inArray(games.courtId, courtRows.map((c) => c.id)),
        ),
      )
      .orderBy(games.courtId, desc(games.gameNumber));
    if (lastGames.length === 0) return { lastGames, lastRosterRows: [] };
    const lastRosterRows = await db
      .select({
        gameId: gamePlayers.gameId,
        team: gamePlayers.team,
        entryId: queueEntries.id,
        displayName: queueEntries.displayName,
        avatarUrl: users.avatarUrl,
      isHost: isHostEntry,
      })
      .from(gamePlayers)
      .innerJoin(queueEntries, eq(queueEntries.id, gamePlayers.queueEntryId))
      .leftJoin(users, eq(users.id, queueEntries.userId))
    .innerJoin(runs, eq(runs.id, queueEntries.runId))
      .where(inArray(gamePlayers.gameId, lastGames.map((g) => g.id)))
      .orderBy(asc(queueEntries.position));
    return { lastGames, lastRosterRows };
  };

  const [rosterRows, { lastGames, lastRosterRows }, allocation] = await Promise.all([
    loadRoster(),
    loadLast(),
    allocateFillProposalsFor(runId, {
      run,
      courtRows,
      busyCourtIds: new Set(openGames.map((g) => g.courtId)),
    }),
  ]);
  const { proposals, nextUp } = allocation;

  const toLastGame = (courtId: string): CourtLastGame | null => {
    const last = lastGames.find((g) => g.courtId === courtId);
    if (!last) return null;
    const side = (team: "team_a" | "team_b"): CourtPlayer[] =>
      lastRosterRows
        .filter((r) => r.gameId === last.id && r.team === team)
        .map((r) => ({ entryId: r.entryId, displayName: r.displayName, avatarUrl: r.avatarUrl, isHost: r.isHost }));
    return {
      id: last.id,
      gameNumber: last.gameNumber,
      scoreA: last.scoreA,
      scoreB: last.scoreB,
      winner: last.winner === "team_a" || last.winner === "team_b" ? last.winner : null,
      sideA: side("team_a"),
      sideB: side("team_b"),
    };
  };

  const courtStates: CourtState[] = courtRows.map((court) => {
    const lastGame = toLastGame(court.id);
    const game = openGames.find((g) => g.courtId === court.id);
    if (!game || (game.status !== "pending" && game.status !== "active")) {
      return {
        id: court.id,
        number: court.number,
        name: court.name,
        game: null,
        lastGame,
        fillProposal: proposals.get(court.id) ?? null,
      };
    }
    const toSide = (team: "team_a" | "team_b"): CourtPlayer[] =>
      rosterRows
        .filter((r) => r.gameId === game.id && r.team === team)
        .map((r) => ({ entryId: r.entryId, displayName: r.displayName, avatarUrl: r.avatarUrl, isHost: r.isHost }));
    return {
      id: court.id,
      number: court.number,
      name: court.name,
      game: {
        id: game.id,
        gameNumber: game.gameNumber,
        status: game.status,
        scoreA: game.scoreA,
        scoreB: game.scoreB,
        scoreGoal: game.scoreGoal,
        sideA: toSide("team_a"),
        sideB: toSide("team_b"),
      },
      lastGame,
      fillProposal: null,
    };
  });

  return { courts: courtStates, nextUp };
}

export async function createCourt(runId: string): Promise<CourtState> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${runId}))`);

    const [stats] = await tx
      .select({ total: count(), maxNumber: max(courts.number) })
      .from(courts)
      .where(eq(courts.runId, runId));
    if (stats.total >= MAX_COURTS) throw new CourtLimitError();

    const [court] = await tx
      .insert(courts)
      .values({ runId, number: (stats.maxNumber ?? 0) + 1 })
      .returning();

    await tx.update(runs).set({ courtCount: stats.total + 1 }).where(eq(runs.id, runId));

    return {
      id: court.id,
      number: court.number,
      name: court.name,
      game: null,
      lastGame: null,
      fillProposal: null,
    };
  });
}

export async function deleteCourt(runId: string, courtId: string): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${runId}))`);

    const [court] = await tx
      .select({ id: courts.id })
      .from(courts)
      .where(and(eq(courts.id, courtId), eq(courts.runId, runId)))
      .limit(1);
    if (!court) throw new CourtNotFoundError();

    const [{ total }] = await tx
      .select({ total: count() })
      .from(courts)
      .where(eq(courts.runId, runId));
    if (total <= 1) throw new LastCourtError();

    const [open] = await tx
      .select({ id: games.id })
      .from(games)
      .where(and(eq(games.courtId, courtId), inArray(games.status, [...openGameStatuses])))
      .limit(1);
    if (open) throw new CourtOccupiedError();

    const [history] = await tx
      .select({ id: games.id })
      .from(games)
      .where(eq(games.courtId, courtId))
      .limit(1);
    if (history) throw new CourtHasHistoryError();

    await tx.delete(courts).where(eq(courts.id, courtId));
    await tx.update(runs).set({ courtCount: total - 1 }).where(eq(runs.id, runId));

    return { id: courtId };
  });
}

// Winning-side entry ids of the latest completed game with a winner, per court.
async function getLatestWinnersByCourt(
  runId: string,
  courtIds: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (courtIds.length === 0) return result;

  const completed = await db
    .select({ id: games.id, courtId: games.courtId, winner: games.winner })
    .from(games)
    .where(
      and(
        eq(games.runId, runId),
        eq(games.status, "completed"),
        inArray(games.courtId, courtIds),
        sql`${games.winner} IS NOT NULL`,
      ),
    )
    .orderBy(desc(games.gameNumber));

  const latestByCourt = new Map<string, { id: string; winner: "team_a" | "team_b" }>();
  for (const g of completed) {
    if ((g.winner === "team_a" || g.winner === "team_b") && !latestByCourt.has(g.courtId)) {
      latestByCourt.set(g.courtId, { id: g.id, winner: g.winner });
    }
  }
  if (latestByCourt.size === 0) return result;

  const rosters = await db
    .select({
      gameId: gamePlayers.gameId,
      team: gamePlayers.team,
      entryId: gamePlayers.queueEntryId,
    })
    .from(gamePlayers)
    .where(inArray(gamePlayers.gameId, [...latestByCourt.values()].map((g) => g.id)));

  for (const [courtId, game] of latestByCourt) {
    result.set(
      courtId,
      rosters.filter((r) => r.gameId === game.id && r.team === game.winner).map((r) => r.entryId),
    );
  }
  return result;
}

const EMPTY_PROPOSAL: FillProposal = { sideA: [], sideB: [], needed: 4 };

// Idle courts get disjoint proposals, allocated earliest-free first from a
// shrinking pool; `nextUp` is the group drawn from whoever remains.
async function allocateFillProposalsFor(
  runId: string,
  { run, courtRows, busyCourtIds }: AllocationContext,
): Promise<{ proposals: Map<string, FillProposal>; nextUp: CourtPlayer[] }> {
  const proposals = new Map<string, FillProposal>();
  if (run.runMode === "score_only") return { proposals, nextUp: [] };

  const idleIds = courtRows.filter((c) => !busyCourtIds.has(c.id)).map((c) => c.id);
  const winnerStays = run.rotationStyle === "winner_stays";

  const [eligible, lastEnded, winnersByCourt] = await Promise.all([
    getEligiblePlayers(runId),
    idleIds.length === 0
      ? Promise.resolve([])
      : db
          .select({ courtId: games.courtId, endedAt: max(games.endedAt) })
          .from(games)
          .where(and(eq(games.status, "completed"), inArray(games.courtId, idleIds)))
          .groupBy(games.courtId),
    winnerStays ? getLatestWinnersByCourt(runId, idleIds) : Promise.resolve(new Map<string, string[]>()),
  ]);
  const partnerOf = await getPartnerMap(eligible.map((p) => p.entryId));

  const freedAt = new Map<string, number>();
  for (const row of lastEnded) {
    if (row.endedAt) freedAt.set(row.courtId, new Date(row.endedAt).getTime());
  }
  const order = courtRows
    .filter((c) => !busyCourtIds.has(c.id))
    .sort((a, b) => {
      const ta = freedAt.get(a.id);
      const tb = freedAt.get(b.id);
      if (ta !== undefined && tb !== undefined && ta !== tb) return ta - tb;
      if (ta !== undefined && tb === undefined) return -1;
      if (ta === undefined && tb !== undefined) return 1;
      return a.number - b.number;
    });

  let pool = eligible;
  for (let i = 0; i < order.length; i++) {
    const courtId = order[i].id;
    let courtPool = pool;
    let sideA: CourtPlayer[] = [];

    if (winnerStays) {
      const reserved = new Set<string>();
      for (const later of order.slice(i + 1)) {
        for (const entryId of winnersByCourt.get(later.id) ?? []) reserved.add(entryId);
      }
      const ownWinners = new Set(winnersByCourt.get(courtId) ?? []);
      courtPool = pool.filter((p) => !reserved.has(p.entryId));
      sideA = courtPool.filter((p) => ownWinners.has(p.entryId)).slice(0, 2);
      const sideAIds = new Set(sideA.map((p) => p.entryId));
      courtPool = courtPool.filter((p) => !sideAIds.has(p.entryId));
    }

    const group = pickNextGroup(courtPool, partnerOf, 4 - sideA.length);
    let sideB: CourtPlayer[];
    if (sideA.length === 0) {
      sideA = group.sideA;
      sideB = group.sideB;
    } else {
      const rest = [...group.sideA, ...group.sideB];
      const topUp = rest.slice(0, 2 - sideA.length);
      sideA = [...sideA, ...topUp];
      sideB = rest.slice(topUp.length);
    }

    proposals.set(courtId, { sideA, sideB, needed: 4 - (sideA.length + sideB.length) });
    const placed = new Set([...sideA, ...sideB].map((p) => p.entryId));
    pool = pool.filter((p) => !placed.has(p.entryId));
  }

  const next = pickNextGroup(pool, partnerOf);
  return { proposals, nextUp: [...next.sideA, ...next.sideB] };
}

export async function getFillProposal(runId: string, courtId: string): Promise<FillProposal> {
  const [[run], courtRows, busy] = await Promise.all([
    db.select().from(runs).where(eq(runs.id, runId)).limit(1),
    db
      .select({ id: courts.id, number: courts.number })
      .from(courts)
      .where(eq(courts.runId, runId)),
    db
      .select({ courtId: games.courtId })
      .from(games)
      .where(and(eq(games.runId, runId), inArray(games.status, [...openGameStatuses]))),
  ]);
  if (!run) throw new RunNotFoundError();
  if (!courtRows.some((c) => c.id === courtId)) throw new CourtNotFoundError();

  if (run.runMode === "score_only") return { ...EMPTY_PROPOSAL };

  const { proposals } = await allocateFillProposalsFor(runId, {
    run,
    courtRows,
    busyCourtIds: new Set(busy.map((b) => b.courtId)),
  });
  return proposals.get(courtId) ?? { ...EMPTY_PROPOSAL };
}
