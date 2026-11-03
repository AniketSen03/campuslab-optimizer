import { useMemo, useState } from 'react';
import { Download, ListChecks } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ScheduleGrid from '../components/ScheduleGrid.jsx';
import { downloadCSV } from '../utils/exportCSV.js';
import { slotOrder } from '../algorithms/core.js';

const ALL = 'all';

export default function Allocations({ labs, results }) {
  const [algo, setAlgo] = useState('improved');
  const [filters, setFilters] = useState({ department: ALL, lab: ALL, slot: ALL, status: ALL });
  const active = results[algo];
  const m = active.metrics;

  const departments = [...new Set(active.rows.map((r) => r.department))];
  const slots = [...new Set(labs.flatMap((l) => l.slots))].sort((a, b) => slotOrder(a) - slotOrder(b));

  const filtered = useMemo(
    () => active.rows.filter((r) =>
      (filters.department === ALL || r.department === filters.department) &&
      (filters.lab === ALL || r.labId === filters.lab) &&
      (filters.slot === ALL || r.slot === filters.slot) &&
      (filters.status === ALL || r.status === filters.status)),
    [active, filters]
  );

  const exportCSV = () =>
    downloadCSV(
      `allocation-${algo}.csv`,
      ['Request ID', 'Department', 'Computers required', 'Laboratory', 'Slot', 'Lab capacity', 'Unused seats', 'Status', 'Reason if unallocated'],
      filtered.map((r) => [r.requestId, r.department, r.computers, r.labName ?? '', r.slot ?? '', r.capacity ?? '', r.unused ?? '', r.status, r.reason])
    );

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const columns = [
    { key: 'requestId', header: 'Request', render: (r) => <span className="font-mono font-medium">{r.requestId}</span> },
    { key: 'department', header: 'Department' },
    { key: 'computers', header: 'Required', align: 'right' },
    { key: 'labName', header: 'Laboratory', render: (r) => r.labName ?? <span className="text-ink-mute">None</span> },
    { key: 'slot', header: 'Slot', render: (r) => (r.slot ? <span className="font-mono">{r.slot}</span> : <span className="text-ink-mute">None</span>) },
    { key: 'capacity', header: 'Lab capacity', align: 'right', render: (r) => r.capacity ?? '' },
    { key: 'unused', header: 'Unused seats', align: 'right', render: (r) => r.unused ?? '' },
    { key: 'status', header: 'Status', render: (r) => <div><StatusBadge status={r.status} />{r.reason && <div className="mt-1 text-xs text-ink-mute">{r.reason}</div>}</div> },
  ];

  const Select = ({ label, value, onChange, options }) => (
    <label className="block">
      <span className="label">{label}</span>
      <select className="input" value={value} onChange={onChange}>
        <option value={ALL}>All</option>
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <PageHeader
        title="Allocation results"
        description="Every request is shown once: either placed in one lab and slot, or unallocated with the reason."
        actions={
          <>
            <div className="inline-flex rounded-md border border-line-strong bg-white p-0.5" role="group" aria-label="Algorithm">
              {[['improved', 'Improved'], ['fcfs', 'FCFS']].map(([id, label]) => (
                <button key={id} onClick={() => setAlgo(id)} aria-pressed={algo === id} className={`rounded px-3 py-1 text-[13px] font-medium ${algo === id ? 'bg-accent text-white' : 'text-ink-soft hover:bg-paper'}`}>{label}</button>
              ))}
            </div>
            <button className="btn" onClick={exportCSV} disabled={filtered.length === 0}><Download size={15} /> Export CSV</button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Scheduled" value={m.scheduled} tone="good" />
        <StatCard label="Unallocated" value={m.unallocated} tone={m.unallocated ? 'bad' : 'default'} />
        <StatCard label="Unused seats" value={m.unusedSeats} />
        <StatCard label="Conflicts" value={m.conflicts} tone={m.conflicts ? 'bad' : 'good'} />
        <StatCard label="Execution time" value={`${m.runtimeMs.toFixed(4)} ms`} hint="mean of 25 runs" />
      </div>

      {m.violations.length > 0 && (
        <ul className="mt-4 rounded-md bg-bad-soft p-3 text-[13px] text-bad">{m.violations.map((v) => <li key={v.message}>{v.message}</li>)}</ul>
      )}

      <section className="card mt-5">
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Department" value={filters.department} onChange={setFilter('department')} options={departments.map((d) => [d, d])} />
          <Select label="Laboratory" value={filters.lab} onChange={setFilter('lab')} options={labs.map((l) => [l.id, l.name])} />
          <Select label="Time slot" value={filters.slot} onChange={setFilter('slot')} options={slots.map((s) => [s, s])} />
          <Select label="Status" value={filters.status} onChange={setFilter('status')} options={[['allocated', 'Allocated'], ['unallocated', 'Unallocated']]} />
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey="requestId"
          empty={<EmptyState icon={ListChecks} title={active.rows.length ? 'No results match these filters' : 'No requests to allocate'}>{active.rows.length ? 'Change or clear a filter to see more rows.' : 'Add department requests to see an allocation.'}</EmptyState>}
        />
      </section>

      <section className="card mt-5">
        <h2 className="border-b border-line px-4 py-3 text-sm">Timetable: {active.name}</h2>
        <ScheduleGrid labs={labs} rows={active.rows} />
      </section>
    </>
  );
}
