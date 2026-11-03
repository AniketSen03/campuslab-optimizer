import { cellKey, feasibleCells } from './core.js';

/**
 * Baseline: First Come First Served.
 * Requests are processed in input order. Each takes the first free feasible
 * cell, scanning its allowed slots in slot order and labs in input order.
 * It never revisits or moves an earlier decision.
 */
export function fcfs(labs, requests) {
  const booked = new Set();
  const allocations = [];
  const unallocatedIds = [];

  for (const request of requests) {
    const cell = feasibleCells(request, labs).find((c) => !booked.has(cellKey(c.labId, c.slot)));
    if (cell) {
      booked.add(cellKey(cell.labId, cell.slot));
      allocations.push({ requestId: request.id, labId: cell.labId, slot: cell.slot });
    } else {
      unallocatedIds.push(request.id);
    }
  }
  return { allocations, unallocatedIds };
}
