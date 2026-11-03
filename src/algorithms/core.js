// Shared helpers for both allocation algorithms.

export const slotOrder = (slot) => parseInt(String(slot).replace(/\D/g, ''), 10) || 0;
export const sortSlots = (slots) => [...new Set(slots)].sort((a, b) => slotOrder(a) - slotOrder(b));
export const cellKey = (labId, slot) => `${labId}|${slot}`;

/**
 * All (lab, slot) cells that could legally host `request` ignoring other requests:
 * lab offers the slot, request allows the slot, lab capacity >= demand.
 * Order is deterministic: slot order first, then lab input order.
 */
export function feasibleCells(request, labs) {
  const cells = [];
  for (const slot of sortSlots(request.slots)) {
    for (const lab of labs) {
      if (lab.slots.includes(slot) && lab.capacity >= request.computers) {
        cells.push({ labId: lab.id, slot, waste: lab.capacity - request.computers });
      }
    }
  }
  return cells;
}
