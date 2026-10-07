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
  remove: (entryId: string) => void;
  reset: () => void;
};

const empty = () => ({ courtId: null, sideA: [] as string[], sideB: [] as string[], selected: null });

function swapIds(ids: string[], a: string, b: string): string[] {
  return ids.map((id) => (id === a ? b : id === b ? a : id));
}

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

  remove: (entryId) =>
    set((s) => ({
      sideA: s.sideA.filter((id) => id !== entryId),
      sideB: s.sideB.filter((id) => id !== entryId),
      selected: s.selected?.entryId === entryId ? null : s.selected,
    })),

  reset: () => set(empty()),
}));
