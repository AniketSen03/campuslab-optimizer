import { cellKey, feasibleCells } from './core.js';

/** Independent validator: counts every hard-constraint violation in a schedule. */
export function validateSchedule(labs, requests, allocations) {
  const violations = [];
  const labById = new Map(labs.map((l) => [l.id, l]));
  const requestById = new Map(requests.map((r) => [r.id, r]));
  const seenRequests = new Set();
  const seenCells = new Set();

  for (const a of allocations) {
    const request = requestById.get(a.requestId);
    const lab = labById.get(a.labId);
    if (!request) {
      violations.push({ type: 'unknown-request', message: `Allocation refers to unknown request ${a.requestId}.` });
      continue;
    }
    if (seenRequests.has(a.requestId)) {
      violations.push({ type: 'duplicate', message: `${a.requestId} is allocated more than once.` });
    }
    seenRequests.add(a.requestId);
    if (!lab) {
      violations.push({ type: 'unknown-lab', message: `${a.requestId} uses unknown lab ${a.labId}.` });
      continue;
    }
    if (!lab.slots.includes(a.slot)) {
      violations.push({ type: 'unavailable', message: `${lab.name} is not available in ${a.slot} (${a.requestId}).` });
    }
    if (!request.slots.includes(a.slot)) {
      violations.push({ type: 'disallowed-slot', message: `${a.requestId} does not allow ${a.slot}.` });
    }
    if (lab.capacity < request.computers) {
      violations.push({ type: 'capacity', message: `${lab.name} has ${lab.capacity} seats but ${a.requestId} needs ${request.computers}.` });
    }
    const key = cellKey(a.labId, a.slot);
    if (seenCells.has(key)) {
      violations.push({ type: 'double-booking', message: `${lab.name} is booked twice in ${a.slot}.` });
    }
    seenCells.add(key);
  }
  return violations;
}

export function explainUnallocated(request, labs) {
  if (labs.length === 0) return 'There are no laboratories.';
  if (feasibleCells(request, labs).length === 0) {
    return labs.some((l) => l.capacity >= request.computers)
      ? 'No lab with enough seats is available in the allowed slots.'
      : `No lab has ${request.computers} or more computers.`;
  }
  return 'Every suitable lab and slot is taken by other requests.';
}

export function buildRows(labs, requests, allocations) {
  const labById = new Map(labs.map((l) => [l.id, l]));
  const allocByRequest = new Map(allocations.map((a) => [a.requestId, a]));
  return requests.map((request) => {
    const a = allocByRequest.get(request.id);
    const lab = a ? labById.get(a.labId) : null;
    return {
      requestId: request.id,
      department: request.department,
      computers: request.computers,
      labId: a ? a.labId : null,
      labName: lab ? lab.name : null,
      slot: a ? a.slot : null,
      capacity: lab ? lab.capacity : null,
      unused: lab ? lab.capacity - request.computers : null,
      status: a ? 'allocated' : 'unallocated',
      reason: a ? '' : explainUnallocated(request, labs),
    };
  });
}

export function computeMetrics(labs, requests, allocations, runtimeMs) {
  const violations = validateSchedule(labs, requests, allocations);
  const rows = buildRows(labs, requests, allocations);
  const scheduled = rows.filter((r) => r.status === 'allocated').length;
  return {
    scheduled,
    unallocated: requests.length - scheduled,
    unusedSeats: rows.reduce((sum, r) => sum + (r.unused ?? 0), 0),
    conflicts: violations.length,
    violations,
    runtimeMs,
  };
}

/** Runs an algorithm on identical, freshly cloned input and reports the mean runtime. */
export function runAlgorithm(name, algorithm, labs, requests, runs = 25) {
  const copies = Array.from({ length: runs + 1 }, () => [structuredClone(labs), structuredClone(requests)]);
  algorithm(...copies[0]); // warm-up, not timed
  let output;
  const start = performance.now();
  for (let i = 1; i <= runs; i += 1) output = algorithm(...copies[i]);
  const runtimeMs = (performance.now() - start) / runs;
  return {
    name,
    allocations: output.allocations,
    unallocatedIds: output.unallocatedIds,
    rows: buildRows(labs, requests, output.allocations),
    metrics: computeMetrics(labs, requests, output.allocations, runtimeMs),
  };
}

/** Decides which algorithm is better: more scheduled, then fewer unused seats, then fewer conflicts. */
export function pickWinner(fcfsMetrics, improvedMetrics) {
  const f = fcfsMetrics;
  const i = improvedMetrics;
  if (i.conflicts !== f.conflicts) return { winner: i.conflicts < f.conflicts ? 'improved' : 'fcfs', criterion: 'conflicts' };
  if (i.scheduled !== f.scheduled) return { winner: i.scheduled > f.scheduled ? 'improved' : 'fcfs', criterion: 'scheduled' };
  if (i.unusedSeats !== f.unusedSeats) return { winner: i.unusedSeats < f.unusedSeats ? 'improved' : 'fcfs', criterion: 'unused' };
  return { winner: 'tie', criterion: 'none' };
}

/** Compares two schedules for the same requests (before vs after a change). */
export function compareSchedules(requests, beforeAllocations, afterAllocations) {
  const before = new Map(beforeAllocations.map((a) => [a.requestId, a]));
  const after = new Map(afterAllocations.map((a) => [a.requestId, a]));
  const rows = requests.map((r) => {
    const b = before.get(r.id) || null;
    const a = after.get(r.id) || null;
    let change;
    if (b && a) change = b.labId === a.labId && b.slot === a.slot ? 'unchanged' : 'moved';
    else if (b && !a) change = 'lost';
    else if (!b && a) change = 'gained';
    else change = 'still-unallocated';
    return { requestId: r.id, department: r.department, before: b, after: a, change };
  });
  return {
    rows,
    originalCount: beforeAllocations.length,
    changedCount: rows.filter((r) => r.change === 'moved' || r.change === 'lost').length,
    movedCount: rows.filter((r) => r.change === 'moved').length,
    newlyUnallocated: rows.filter((r) => r.change === 'lost').map((r) => r.requestId),
    newlyAllocated: rows.filter((r) => r.change === 'gained').map((r) => r.requestId),
  };
}
