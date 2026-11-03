import { describe, expect, it } from 'vitest';
import { fcfs } from './fcfs.js';
import { improved } from './improved.js';
import { compareSchedules, computeMetrics, pickWinner, runAlgorithm, validateSchedule } from './metrics.js';
import { validateLab, validateRequest } from './validation.js';
import { toCSV } from '../utils/exportCSV.js';
import { INITIAL_LABS, INITIAL_REQUESTS } from '../data/initialData.js';

const algorithms = { fcfs, improved };
const clone = (x) => structuredClone(x);
const metricsOf = (fn, labs, reqs) => computeMetrics(labs, reqs, fn(clone(labs), clone(reqs)).allocations, 0);

describe.each(Object.entries(algorithms))('%s on official data', (_name, fn) => {
  it('schedules all five requests with zero violations', () => {
    const out = fn(clone(INITIAL_LABS), clone(INITIAL_REQUESTS));
    expect(out.allocations).toHaveLength(5);
    expect(out.unallocatedIds).toEqual([]);
    expect(validateSchedule(INITIAL_LABS, INITIAL_REQUESTS, out.allocations)).toEqual([]);
  });
  it('is deterministic', () => {
    expect(fn(clone(INITIAL_LABS), clone(INITIAL_REQUESTS))).toEqual(fn(clone(INITIAL_LABS), clone(INITIAL_REQUESTS)));
  });
});

describe('official data metrics', () => {
  it('improved wastes fewer seats than FCFS', () => {
    const f = metricsOf(fcfs, INITIAL_LABS, INITIAL_REQUESTS);
    const i = metricsOf(improved, INITIAL_LABS, INITIAL_REQUESTS);
    expect(f.unusedSeats).toBe(60);
    expect(i.unusedSeats).toBe(20);
    expect(pickWinner(f, i).winner).toBe('improved');
  });
});

describe('edge cases', () => {
  it.each(Object.entries(algorithms))('%s: no labs', (_n, fn) => {
    const out = fn([], clone(INITIAL_REQUESTS));
    expect(out.allocations).toEqual([]);
    expect(out.unallocatedIds).toHaveLength(5);
  });
  it.each(Object.entries(algorithms))('%s: no requests', (_n, fn) => {
    expect(fn(clone(INITIAL_LABS), [])).toEqual({ allocations: [], unallocatedIds: [] });
  });
  it.each(Object.entries(algorithms))('%s: insufficient capacity', (_n, fn) => {
    const out = fn(clone(INITIAL_LABS), [{ id: 'R1', department: 'X', computers: 61, slots: ['S1', 'S2', 'S3'] }]);
    expect(out.unallocatedIds).toEqual(['R1']);
  });
  it.each(Object.entries(algorithms))('%s: all slots occupied', (_n, fn) => {
    const labs = [{ id: 'A', name: 'Lab A', capacity: 10, slots: ['S1'] }];
    const reqs = ['R1', 'R2', 'R3'].map((id) => ({ id, department: id, computers: 5, slots: ['S1'] }));
    const out = fn(labs, reqs);
    expect(out.allocations).toHaveLength(1);
    expect(out.unallocatedIds).toHaveLength(2);
  });
  it.each(Object.entries(algorithms))('%s: equal capacity labs never double-book', (_n, fn) => {
    const labs = ['A', 'B'].map((id) => ({ id, name: `Lab ${id}`, capacity: 30, slots: ['S1'] }));
    const reqs = ['R1', 'R2', 'R3'].map((id) => ({ id, department: id, computers: 30, slots: ['S1'] }));
    const out = fn(labs, reqs);
    expect(out.allocations).toHaveLength(2);
    expect(validateSchedule(labs, reqs, out.allocations)).toEqual([]);
  });
  it.each(Object.entries(algorithms))('%s: single-slot requests honour their slot', (_n, fn) => {
    const out = fn(clone(INITIAL_LABS), clone(INITIAL_REQUESTS));
    const slotOf = Object.fromEntries(out.allocations.map((a) => [a.requestId, a.slot]));
    expect(slotOf.R2).toBe('S1');
    expect(slotOf.R3).toBe('S2');
    expect(slotOf.R5).toBe('S3');
  });
  it('improved beats FCFS on a case where FCFS blocks a single-slot request', () => {
    const labs = [{ id: 'A', name: 'Lab A', capacity: 50, slots: ['S1', 'S2'] }];
    const reqs = [
      { id: 'R1', department: 'X', computers: 40, slots: ['S1', 'S2'] },
      { id: 'R2', department: 'Y', computers: 40, slots: ['S1'] },
    ];
    expect(fcfs(labs, reqs).allocations).toHaveLength(1);
    expect(improved(labs, reqs).allocations).toHaveLength(2);
  });
});

describe('validator catches bad schedules', () => {
  const labs = INITIAL_LABS;
  const reqs = INITIAL_REQUESTS;
  it('double booking', () => {
    const v = validateSchedule(labs, reqs, [{ requestId: 'R4', labId: 'D', slot: 'S2' }, { requestId: 'R3', labId: 'D', slot: 'S2' }]);
    expect(v.map((x) => x.type)).toContain('double-booking');
  });
  it('capacity, disallowed slot, unavailable slot, duplicates', () => {
    const v = validateSchedule(labs, reqs, [
      { requestId: 'R1', labId: 'D', slot: 'S1' },
      { requestId: 'R1', labId: 'A', slot: 'S1' },
    ]);
    const types = v.map((x) => x.type);
    expect(types).toEqual(expect.arrayContaining(['capacity', 'unavailable', 'duplicate']));
  });
});

describe('property test on random instances', () => {
  let seed = 12345;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  it('both algorithms are always valid and improved never schedules fewer', () => {
    for (let t = 0; t < 300; t += 1) {
      const slots = ['S1', 'S2', 'S3', 'S4'];
      const pick = () => slots.filter(() => rand() < 0.5).concat(slots[Math.floor(rand() * 4)]);
      const labs = Array.from({ length: 1 + Math.floor(rand() * 5) }, (_, i) => ({
        id: `L${i}`, name: `L${i}`, capacity: 10 + Math.floor(rand() * 60), slots: [...new Set(pick())],
      }));
      const reqs = Array.from({ length: Math.floor(rand() * 14) }, (_, i) => ({
        id: `R${i}`, department: 'D', computers: 5 + Math.floor(rand() * 60), slots: [...new Set(pick())],
      }));
      const f = metricsOf(fcfs, labs, reqs);
      const i = metricsOf(improved, labs, reqs);
      expect(f.conflicts).toBe(0);
      expect(i.conflicts).toBe(0);
      expect(i.scheduled).toBeGreaterThanOrEqual(f.scheduled);
    }
  });
});

describe('dynamic update: Lab A unavailable in S2', () => {
  const after = INITIAL_LABS.map((l) => (l.id === 'A' ? { ...l, slots: l.slots.filter((s) => s !== 'S2') } : l));
  it.each(Object.entries(algorithms))('%s stays valid and changes are counted', (_n, fn) => {
    const b = fn(clone(INITIAL_LABS), clone(INITIAL_REQUESTS));
    const a = fn(clone(after), clone(INITIAL_REQUESTS));
    expect(validateSchedule(after, INITIAL_REQUESTS, a.allocations)).toEqual([]);
    const cmp = compareSchedules(INITIAL_REQUESTS, b.allocations, a.allocations);
    const manual = INITIAL_REQUESTS.filter((r) => {
      const x = b.allocations.find((q) => q.requestId === r.id);
      const y = a.allocations.find((q) => q.requestId === r.id);
      return x && (!y || x.labId !== y.labId || x.slot !== y.slot);
    }).length;
    expect(cmp.changedCount).toBe(manual);
  });
  it('FCFS moves exactly R3 (A/S2 -> C/S2); improved never used A/S2 so nothing changes', () => {
    const run = (fn, labs) => fn(clone(labs), clone(INITIAL_REQUESTS)).allocations;
    const f = compareSchedules(INITIAL_REQUESTS, run(fcfs, INITIAL_LABS), run(fcfs, after));
    const i = compareSchedules(INITIAL_REQUESTS, run(improved, INITIAL_LABS), run(improved, after));
    expect(f.changedCount).toBe(1);
    expect(f.rows.find((r) => r.change === 'moved').requestId).toBe('R3');
    expect(i.changedCount).toBe(0);
    expect(run(fcfs, after)).toHaveLength(5);
    expect(run(improved, after)).toHaveLength(5);
  });
});

describe('runAlgorithm', () => {
  it('reports metrics computed from the actual output', () => {
    const r = runAlgorithm('FCFS', fcfs, INITIAL_LABS, INITIAL_REQUESTS);
    expect(r.metrics.scheduled + r.metrics.unallocated).toBe(5);
    expect(r.metrics.runtimeMs).toBeGreaterThanOrEqual(0);
  });
});

describe('validation', () => {
  const labs = INITIAL_LABS;
  it('rejects bad labs', () => {
    expect(validateLab({ id: '', name: '', capacity: '0', slots: [] }, labs).errors).toMatchObject({ id: expect.any(String), name: expect.any(String), capacity: expect.any(String), slots: expect.any(String) });
    expect(validateLab({ id: 'a', name: 'Dup', capacity: 10, slots: ['S1'] }, labs).errors.id).toMatch(/already exists/);
    expect(validateLab({ id: 'E', name: 'E', capacity: '3.5', slots: ['S1'] }, labs).errors.capacity).toBeDefined();
    expect(validateLab({ id: 'E', name: 'E', capacity: 10, slots: ['S9'] }, labs).errors.slots).toBeDefined();
  });
  it('rejects duplicate request IDs and invalid fields', () => {
    expect(validateRequest({ id: 'r1', department: 'X', computers: 5, slots: ['S1'] }, INITIAL_REQUESTS, labs).errors.id).toMatch(/already exists/);
    const bad = validateRequest({ id: 'R9', department: ' ', computers: -4, slots: [] }, INITIAL_REQUESTS, labs).errors;
    expect(Object.keys(bad).sort()).toEqual(['computers', 'department', 'slots']);
  });
  it('warns (not errors) when a request fits nowhere', () => {
    const r = validateRequest({ id: 'R9', department: 'X', computers: 500, slots: ['S1'] }, INITIAL_REQUESTS, labs);
    expect(r.errors).toEqual({});
    expect(r.warnings).toHaveLength(1);
  });
});

describe('CSV', () => {
  it('escapes commas, quotes and newlines', () => {
    expect(toCSV(['a', 'b'], [['x,y', 'say "hi"'], ['l1\nl2', null]])).toBe('a,b\r\n"x,y","say ""hi"""\r\n"l1\nl2",');
  });
});
