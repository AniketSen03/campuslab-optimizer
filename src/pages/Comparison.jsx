import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Trophy } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import DataTable from '../components/DataTable.jsx';
import { pickWinner } from '../algorithms/metrics.js';

const COLORS = { FCFS: '#a39b8a', Improved: '#4338ca' };

function MetricChart({ title, data, unit }) {
  return (
    <section className="card p-4">
      <h2 className="mb-3 text-sm">{title}</h2>
      <div className="h-56" role="img" aria-label={`${title} chart comparing FCFS and Improved`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e2da" vertical={false} />
            <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#4b5058' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#7a7f87' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => `${v}${unit || ''}`} cursor={{ fill: '#f4f1ea' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="FCFS" fill={COLORS.FCFS} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Improved" fill={COLORS.Improved} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function Comparison({ requests, results }) {
  const f = results.fcfs.metrics;
  const i = results.improved.metrics;
  const { winner, criterion } = pickWinner(f, i);

  const explanation = (() => {
    if (requests.length === 0) return 'There are no requests, so both algorithms produce an empty schedule.';
    if (winner === 'tie') return 'Both algorithms scheduled the same number of requests with the same unused seats and no conflicts.';
    const name = winner === 'improved' ? 'Improved' : 'FCFS';
    const w = winner === 'improved' ? i : f;
    const l = winner === 'improved' ? f : i;
    if (criterion === 'conflicts') return `${name} wins because the other schedule has hard-constraint violations (${l.conflicts} vs ${w.conflicts}).`;
    if (criterion === 'scheduled') return `${name} wins because it scheduled ${w.scheduled - l.scheduled} more request(s) (${w.scheduled} vs ${l.scheduled}). Scheduled count is compared first.`;
    return `Both schedule ${w.scheduled} requests, so the tie-break applies: ${name} leaves ${l.unusedSeats - w.unusedSeats} fewer computer seats idle (${w.unusedSeats} vs ${l.unusedSeats}).`;
  })();

  const tradeOff = (() => {
    if (i.scheduled > f.scheduled && i.unusedSeats > f.unusedSeats) return 'Trade-off visible on this input: Improved scheduled more requests but left more seats idle, because scheduling count has priority over seat usage.';
    if (f.scheduled > i.scheduled) return 'Failure case visible on this input: the Improved heuristic scheduled fewer requests than FCFS. Report this result as it is; it does not guarantee optimality.';
    if (winner === 'improved' && i.scheduled === f.scheduled) return 'Trade-off: on this input both place every schedulable request, so the gain is only in wasted seats. Improved costs a little more computation to get there.';
    return 'See the Methodology page for known failure cases of each approach.';
  })();

  const rowsData = [
    ['Scheduled requests', 'scheduled', 'high'],
    ['Unallocated requests', 'unallocated', 'low'],
    ['Unused computer seats', 'unusedSeats', 'low'],
    ['Conflicts', 'conflicts', 'low'],
    ['Runtime (ms, mean of 25 runs)', 'runtimeMs', 'low'],
  ].map(([label, key, better]) => {
    const a = f[key];
    const b = i[key];
    const best = a === b ? 'tie' : (better === 'high' ? (b > a ? 'improved' : 'fcfs') : (b < a ? 'improved' : 'fcfs'));
    return { key, label, fcfs: key === 'runtimeMs' ? a.toFixed(4) : a, improved: key === 'runtimeMs' ? b.toFixed(4) : b, best: key === 'runtimeMs' ? 'n/a' : best };
  });

  const perRequest = requests.map((r, idx) => {
    const a = results.fcfs.rows[idx];
    const b = results.improved.rows[idx];
    const place = (x) => (x.status === 'allocated' ? `${x.labName} / ${x.slot}` : 'Unallocated');
    return { id: r.id, department: r.department, computers: r.computers, fcfs: place(a), improved: place(b), same: place(a) === place(b) };
  });

  const cols = [
    { key: 'label', header: 'Metric' },
    { key: 'fcfs', header: 'FCFS', align: 'right' },
    { key: 'improved', header: 'Improved', align: 'right' },
    { key: 'best', header: 'Better', render: (r) => (r.best === 'tie' || r.best === 'n/a' ? <span className="text-ink-mute">{r.best === 'tie' ? 'Equal' : 'Not scored'}</span> : <span className="font-medium text-accent">{r.best === 'improved' ? 'Improved' : 'FCFS'}</span>) },
  ];

  return (
    <>
      <PageHeader title="Algorithm comparison" description="Both algorithms receive an identical copy of the current labs and requests. Every number below is measured from their actual output." />

      <section className="card flex items-start gap-3 p-4">
        <Trophy size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
        <div>
          <p className="font-medium">{winner === 'tie' ? 'No difference on this input' : `${winner === 'improved' ? 'Improved algorithm' : 'FCFS'} performs better on this input`}</p>
          <p className="mt-1 text-[13px] text-ink-soft">{explanation}</p>
          <p className="mt-2 text-[13px] text-ink-soft">{tradeOff}</p>
        </div>
      </section>

      <section className="card mt-5">
        <DataTable columns={cols} rows={rowsData} rowKey="key" />
        <p className="border-t border-line px-4 py-2.5 text-xs text-ink-mute">Runtime is wall-clock time in your browser and varies between runs. It is not the theoretical complexity. For data this small both finish in a fraction of a millisecond.</p>
      </section>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <MetricChart title="Scheduling outcome" data={[{ metric: 'Scheduled', FCFS: f.scheduled, Improved: i.scheduled }, { metric: 'Unallocated', FCFS: f.unallocated, Improved: i.unallocated }, { metric: 'Conflicts', FCFS: f.conflicts, Improved: i.conflicts }]} />
        <MetricChart title="Unused computer seats" data={[{ metric: 'Unused seats', FCFS: f.unusedSeats, Improved: i.unusedSeats }]} />
        <MetricChart title="Runtime (ms)" unit=" ms" data={[{ metric: 'Runtime', FCFS: Number(f.runtimeMs.toFixed(4)), Improved: Number(i.runtimeMs.toFixed(4)) }]} />
      </div>

      <section className="card mt-5">
        <h2 className="border-b border-line px-4 py-3 text-sm">Placement by request</h2>
        <DataTable
          rowKey="id"
          rows={perRequest}
          columns={[
            { key: 'id', header: 'Request', render: (r) => <span className="font-mono font-medium">{r.id}</span> },
            { key: 'department', header: 'Department' },
            { key: 'computers', header: 'Computers', align: 'right' },
            { key: 'fcfs', header: 'FCFS', render: (r) => (r.fcfs === 'Unallocated' ? <StatusBadge status="unallocated" /> : r.fcfs) },
            { key: 'improved', header: 'Improved', render: (r) => (r.improved === 'Unallocated' ? <StatusBadge status="unallocated" /> : r.improved) },
            { key: 'same', header: 'Same?', render: (r) => (r.same ? 'Yes' : <span className="font-medium text-warn">Different</span>) },
          ]}
        />
      </section>
    </>
  );
}
