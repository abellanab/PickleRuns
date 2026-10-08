export type Candidate = { entryId: string; displayName: string; avatarUrl: string | null };

type Unit = { members: Candidate[] };

export function pickNextGroup(
  candidates: Candidate[],
  partnerOf: Map<string, string>,
  size = 4,
): { sideA: Candidate[]; sideB: Candidate[] } {
  const byId = new Map(candidates.map((c) => [c.entryId, c]));
  const consumed = new Set<string>();
  const units: Unit[] = [];

  for (const c of candidates) {
    if (consumed.has(c.entryId)) continue;
    const partnerId = partnerOf.get(c.entryId);
    const partner = partnerId ? byId.get(partnerId) : undefined;
    if (partner && partner.entryId !== c.entryId && !consumed.has(partner.entryId)) {
      consumed.add(c.entryId);
      consumed.add(partner.entryId);
      units.push({ members: [c, partner] });
    } else {
      consumed.add(c.entryId);
      units.push({ members: [c] });
    }
  }

  const chosen: Unit[] = [];
  let taken = 0;
  for (const unit of units) {
    if (taken >= size) break;
    if (unit.members.length <= size - taken) {
      chosen.push(unit);
      taken += unit.members.length;
    }
  }

  const pairs = chosen.filter((u) => u.members.length === 2);
  const singles = chosen.filter((u) => u.members.length === 1).map((u) => u.members[0]);

  const sideA: Candidate[] = pairs[0] ? [...pairs[0].members] : [];
  const sideB: Candidate[] = pairs[1] ? [...pairs[1].members] : [];
  for (const s of singles) {
    if (sideA.length < 2) sideA.push(s);
    else if (sideB.length < 2) sideB.push(s);
  }
  return { sideA, sideB };
}
