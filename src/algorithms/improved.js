import { cellKey, feasibleCells } from './core.js';

/**
 * Improved heuristic: constraint-based greedy + best fit + augmenting repair.
 *
 * Phase 1 (order): most constrained requests first
 *   (fewest feasible lab-slot cells, then fewest allowed slots, then larger demand, then input order).
 * Phase 2 (best fit): each request takes the free cell wasting the fewest seats.
 *   Ties: the cell wanted by fewer requests overall, then earlier slot, then earlier lab.
 * Phase 3 (repair): for each request still unplaced, search for an augmenting chain
 *   (move already-placed requests to other feasible cells) that frees a cell for it.
 *   This can only raise the number of scheduled requests; it never drops one.
 *
 * It is a heuristic: the count is maximised by phase 3, but the unused-seat total is NOT guaranteed minimal.
 */
export function improved(labs, requests) {
  const inputIndex = new Map(requests.map((r, i) => [r.id, i]));
  const requestById = new Map(requests.map((r) => [r.id, r]));
  const options = new Map(requests.map((r) => [r.id, feasibleCells(r, labs)]));

  // How many requests could use each cell (static contention measure).
  const demand = new Map();
  for (const cells of options.values()) {
    for (const c of cells) demand.set(cellKey(c.labId, c.slot), (demand.get(cellKey(c.labId, c.slot)) || 0) + 1);
  }

  const compareCells = (a, b) =>
    a.waste - b.waste ||
    demand.get(cellKey(a.labId, a.slot)) - demand.get(cellKey(b.labId, b.slot)) ||
    0; // remaining ties keep the deterministic feasibleCells order (stable sort)

  const ranked = new Map(
    [...options].map(([id, cells]) => [id, [...cells].sort(compareCells)])
  );

  const order = [...requests].sort(
    (a, b) =>
      options.get(a.id).length - options.get(b.id).length ||
      new Set(a.slots).size - new Set(b.slots).size ||
      b.computers - a.computers ||
      inputIndex.get(a.id) - inputIndex.get(b.id)
  );

  const owner = new Map(); // cellKey -> requestId
  const assigned = new Map(); // requestId -> cell

  // Phase 2: best-fit greedy.
  for (const request of order) {
    const cell = ranked.get(request.id).find((c) => !owner.has(cellKey(c.labId, c.slot)));
    if (cell) {
      owner.set(cellKey(cell.labId, cell.slot), request.id);
      assigned.set(request.id, cell);
    }
  }

  // Phase 3: augmenting-path repair for requests left unplaced.
  const tryPlace = (requestId, seen) => {
    for (const cell of ranked.get(requestId)) {
      const key = cellKey(cell.labId, cell.slot);
      if (seen.has(key)) continue;
      seen.add(key);
      const current = owner.get(key);
      if (current === undefined || tryPlace(current, seen)) {
        owner.set(key, requestId);
        assigned.set(requestId, cell);
        return true;
      }
    }
    return false;
  };
  for (const request of order) {
    if (!assigned.has(request.id)) tryPlace(request.id, new Set());
  }

  const allocations = [];
  const unallocatedIds = [];
  for (const request of requests) {
    const cell = assigned.get(request.id);
    if (cell) allocations.push({ requestId: request.id, labId: cell.labId, slot: cell.slot });
    else unallocatedIds.push(request.id);
  }
  // requestById kept for clarity of intent in debugging; not otherwise needed.
  void requestById;
  return { allocations, unallocatedIds };
}
