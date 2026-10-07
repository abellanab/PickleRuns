import { create } from "zustand";
import type { FillProposal } from "@/hooks/use-courts";

export const MAX_PER_SIDE = 2;

export type SlotSide = "A" | "B" | "pool";
export type Selection = { side: SlotSide; entryId: string };
export type SlotTarget = { side: SlotSide; entryId: string | null };

type CourtAssignmentState = {
  courtId: string | null;
  sideA: string[];
  sideB: string[];
  selected: Selection | null;
  init: (courtId: string, proposal: FillProposal) => void;
  select: (selection: Selection | null) => void;
  swapOrPlace: (target: SlotTarget) => void;
  drop: (entryId: string, target: SlotTarget) => void;
  scramble: () => void;
  remove: (entryId: string) => void;
  reset: () => void;
};

const empty = () => ({ courtId: null, sideA: [] as string[], sideB: [] as string[], selected: null });

function swapIds(ids: string[], a: string, b: string): string[] {
  return ids.map((id) => (id === a ? b : id === b ? a : id));
}

function shuffle(ids: string[]): string[] {
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function sameMembers(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

const MAX_SCRAMBLE_ATTEMPTS = 10;

export const useCourtAssignmentStore = create<CourtAssignmentState>((set, get) => ({
  ...empty(),

  init: (courtId, proposal) =>
    set({
      courtId,
      sideA: proposal.sideA.map((p) => p.entryId),
      sideB: proposal.sideB.map((p) => p.entryId),
      selected: null,
    }),

  select: (selection) => set({ selected: selection }),

  swapOrPlace: (target) => {
    const { selected, sideA, sideB } = get();
    if (!selected) return;

    if (target.entryId === selected.entryId) {
      set({ selected: null });
      return;
    }

    if (target.entryId) {
      if (selected.side === "pool" && target.side === "pool") {
        set({ selected: { side: "pool", entryId: target.entryId } });
        return;
      }
      // An id that is in neither side simply drops out of the draft, which is how
      // a pool player swapped with a side player ends up back in the pool.
      set({
        sideA: swapIds(sideA, selected.entryId, target.entryId),
        sideB: swapIds(sideB, selected.entryId, target.entryId),
        selected: null,
      });
      return;
    }

    if (target.side === "pool") {
      set({
        sideA: sideA.filter((id) => id !== selected.entryId),
        sideB: sideB.filter((id) => id !== selected.entryId),
        selected: null,
      });
      return;
    }

    const nextA = sideA.filter((id) => id !== selected.entryId);
    const nextB = sideB.filter((id) => id !== selected.entryId);
    if (target.side === "A" && nextA.length < MAX_PER_SIDE) nextA.push(selected.entryId);
    else if (target.side === "B" && nextB.length < MAX_PER_SIDE) nextB.push(selected.entryId);
    else return;
    set({ sideA: nextA, sideB: nextB, selected: null });
  },

  drop: (entryId, target) => {
    const { sideA, sideB } = get();

    if (target.side === "pool") {
      set({
        sideA: sideA.filter((id) => id !== entryId),
        sideB: sideB.filter((id) => id !== entryId),
        selected: null,
      });
      return;
    }

    if (target.entryId) {
      if (target.entryId === entryId) {
        set({ selected: null });
        return;
      }
      set({
        sideA: swapIds(sideA, entryId, target.entryId),
        sideB: swapIds(sideB, entryId, target.entryId),
        selected: null,
      });
      return;
    }

    const nextA = sideA.filter((id) => id !== entryId);
    const nextB = sideB.filter((id) => id !== entryId);
    if (target.side === "A" && nextA.length < MAX_PER_SIDE) nextA.push(entryId);
    else if (target.side === "B" && nextB.length < MAX_PER_SIDE) nextB.push(entryId);
    else return;
    set({ sideA: nextA, sideB: nextB, selected: null });
  },

  scramble: () => {
    const { sideA, sideB } = get();
    const ids = [...sideA, ...sideB];
    if (ids.length < 2) return;

    let nextA = sideA;
    let nextB = sideB;
    for (let attempt = 0; attempt < MAX_SCRAMBLE_ATTEMPTS; attempt++) {
      const shuffled = shuffle(ids);
      nextA = shuffled.slice(0, sideA.length);
      nextB = shuffled.slice(sideA.length);
      // Compare team membership, not slot order, so the result is a visibly different matchup.
      if (!sameMembers(nextA, sideA)) break;
    }
    set({ sideA: nextA, sideB: nextB, selected: null });
  },

  remove: (entryId) =>
    set((s) => ({
      sideA: s.sideA.filter((id) => id !== entryId),
      sideB: s.sideB.filter((id) => id !== entryId),
      selected: s.selected?.entryId === entryId ? null : s.selected,
    })),

  reset: () => set(empty()),
}));
