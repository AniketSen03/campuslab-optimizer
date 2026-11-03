import { useMemo, useState } from 'react';
import { CalendarClock, Undo2 } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import DataTable from '../components/DataTable.jsx';
import ScheduleGrid from '../components/ScheduleGrid.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { fcfs } from '../algorithms/fcfs.js';
import { improved } from '../algorithms/improved.js';
import { compareSchedules, runAlgorithm } from '../algorithms/metrics.js';

// Dynamic update required by the problem statement: Lab A becomes unavailable in slot S2.
const TARGET = { labId: 'A', slot: 'S2' };
const ALGORITHMS = { fcfs: ['FCFS', fcfs], improved: ['Improved', improved] };

const place = (a, labs) => (a ? `${labs.find((l) => l.id === a.labId)?.name ?? a.labId} / ${a.slot}` : 'Unallocated');

export default function Rescheduling({ labs, setLabs, requests, snapshot, setSnapshot, notify }) {
  const [algo, setAlgo] = useState('improved');

  const apply = () => {
    const lab = labs.find((l) => l.id === TARGET.labId);
    if (!lab) return notify('error', 'Lab A does not exist, so it cannot be made unavailable. Use "Reset to official data" first.');
    if (!lab.slots.includes(TARGET.slot)) return notify('error', 'Lab A is already unavailable in S2.');
    const labsAfter = labs.map((l) => (l.id === TARGET.labId ? { ...l, slots: l.slots.filter((s) => s !== TARGET.slot) } : l));
    setSnapshot({ labsBefore: labs, labsAfter, requests, appliedAt: new Date().toISOString() });
    setLabs(labsAfter);
    return notify('success', 'Lab A is now unavailable in S2. Both algorithms were recalculated.');
  };

  const revert = () => {
    setLabs(snapshot.labsBefore);
    setSnapshot(null);
    notify('success', 'Original availability restored.');
  };

  // Original schedule is preserved in the snapshot; both before and after are recomputed from stored inputs.
  const view = useMemo(() => {
    if (!snapshot) return null;
    const out = {};
    Object.entries(ALGORITHMS).forEach(([key, [name, fn]]) => {
      const before = runAlgorithm(name, fn, snapshot.labsBefore, snapshot.requests);
      const after = runAlgorithm(name, fn, snapshot.labsAfter, snapshot.requests);
      out[key] = { before, after, diff: compareSchedules(snapshot.requests, before.allocations, after.allocations) };
    });
    return out;
  }, [snapshot]);

  const preview = useMemo(() => {
    const lab = labs.find((l) => l.id === TARGET.labId);
    return lab ? { exists: true, available: lab.slots.includes(TARGET.slot) } : { exists: false, available: false };
  }, [labs]);

  const header = (
    <PageHeader
      title="Dynamic rescheduling"
      description="Scenario from the problem statement: Lab A becomes unavailable in slot S2. The original schedule is kept so you can compare before and after."
      actions={snapshot
        ? <button className="btn" onClick={revert}><Undo2 size={15} /> Restore original availability</button>
        : <button className="btn btn-primary" onClick={apply}><CalendarClock size={15} /> Reschedule: Lab A unavailable in S2</button>}
    />
  );

  if (!snapshot) {
    return (
      <>
        {header}
        <div className="card">
          <EmptyState icon={CalendarClock} title="No outage applied yet">
            {!preview.exists
              ? 'Lab A is missing from the current data. Reset to the official data to run this scenario.'
              : !preview.available
                ? 'Lab A is already unavailable in S2 in the current data.'
                : 'Press Reschedule to remove S2 from Lab A and recompute both algorithms. The current schedule is saved as the "before" state.'}
          </EmptyState>
        </div>
      </>
    );
  }

  const { before, after, diff } = view[algo];
  const columns = [
    { key: 'requestId', header: 'Request', render: (r) => <span className="font-mono font-medium">{r.requestId}</span> },
    { key: 'department', header: 'Department' },
    { key: 'before', header: 'Before', render: (r) => place(r.before, snapshot.labsBefore) },
    { key: 'after', header: 'After', render: (r) => place(r.after, snapshot.labsAfter) },
    { key: 'change', header: 'Change', render: (r) => <StatusBadge status={r.change} /> },
  ];

  return (
    <>
      {header}
      <div className="mb-4 inline-flex rounded-md border border-line-strong bg-white p-0.5" role="group" aria-label="Algorithm">
        {Object.entries(ALGORITHMS).map(([id, [label]]) => (
          <button key={id} onClick={() => setAlgo(id)} aria-pressed={algo === id} className={`rounded px-3 py-1 text-[13px] font-medium ${algo === id ? 'bg-accent text-white' : 'text-ink-soft hover:bg-paper'}`}>{label}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Original assignments changed" value={`${diff.changedCount} of ${diff.originalCount}`} tone={diff.changedCount ? 'warn' : 'good'} hint={`${diff.movedCount} moved, ${diff.newlyUnallocated.length} lost`} />
        <StatCard label="Newly unallocated" value={diff.newlyUnallocated.length} tone={diff.newlyUnallocated.length ? 'bad' : 'good'} hint={diff.newlyUnallocated.join(', ') || 'None'} />
        <StatCard label="Scheduled" value={`${before.metrics.scheduled} → ${after.metrics.scheduled}`} />
        <StatCard label="Unused seats" value={`${before.metrics.unusedSeats} → ${after.metrics.unusedSeats}`} hint={`Conflicts after: ${after.metrics.conflicts}`} />
      </div>

      <section className="card mt-5">
        <h2 className="border-b border-line px-4 py-3 text-sm">Changes by request ({before.name})</h2>
        <DataTable columns={columns} rows={diff.rows} rowKey="requestId" />
        {diff.changedCount === 0 && (
          <p className="border-t border-line px-4 py-2.5 text-[13px] text-ink-soft">No original assignment used Lab A in S2 under {before.name}, so nothing needed to move.</p>
        )}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="card"><h2 className="border-b border-line px-4 py-3 text-sm">Before: original schedule</h2><ScheduleGrid labs={snapshot.labsBefore} rows={before.rows} /></section>
        <section className="card"><h2 className="border-b border-line px-4 py-3 text-sm">After: Lab A unavailable in S2</h2><ScheduleGrid labs={snapshot.labsAfter} rows={after.rows} /></section>
      </div>
    </>
  );
}
