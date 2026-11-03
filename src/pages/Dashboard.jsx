import { useState } from 'react';
import { AlertOctagon, ClipboardList, FlaskConical, Armchair, CheckCircle2, XCircle } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ScheduleGrid from '../components/ScheduleGrid.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { pickWinner } from '../algorithms/metrics.js';

export default function Dashboard({ labs, requests, results, navigate }) {
  const [algo, setAlgo] = useState('improved');
  const active = results[algo];
  const m = active.metrics;
  const { winner } = pickWinner(results.fcfs.metrics, results.improved.metrics);
  const unallocated = active.rows.filter((r) => r.status === 'unallocated');

  return (
    <>
      <PageHeader
        title="Laboratory allocation overview"
        description="Live results from both algorithms on the current labs and requests."
        actions={
          <div className="inline-flex rounded-md border border-line-strong bg-white p-0.5" role="group" aria-label="Algorithm shown">
            {[['improved', 'Improved'], ['fcfs', 'FCFS']].map(([id, label]) => (
              <button key={id} onClick={() => setAlgo(id)} aria-pressed={algo === id} className={`rounded px-3 py-1 text-[13px] font-medium ${algo === id ? 'bg-accent text-white' : 'text-ink-soft hover:bg-paper'}`}>{label}</button>
            ))}
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Laboratories" value={labs.length} icon={FlaskConical} />
        <StatCard label="Department requests" value={requests.length} icon={ClipboardList} />
        <StatCard label="Allocated sessions" value={m.scheduled} tone="good" icon={CheckCircle2} hint={`of ${requests.length} requests`} />
        <StatCard label="Unallocated sessions" value={m.unallocated} tone={m.unallocated ? 'bad' : 'default'} icon={XCircle} />
        <StatCard label="Unused computer seats" value={m.unusedSeats} icon={Armchair} hint="across assigned sessions" />
        <StatCard label="Conflicts" value={m.conflicts} tone={m.conflicts ? 'bad' : 'good'} icon={AlertOctagon} hint="hard-constraint violations" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <section className="card lg:col-span-3">
          <h2 className="border-b border-line px-4 py-3 text-sm">Timetable: {active.name}</h2>
          <ScheduleGrid labs={labs} rows={active.rows} />
        </section>
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm">Algorithm performance</h2>
            <button className="text-[13px] font-medium text-accent hover:underline" onClick={() => navigate('comparison')}>Full comparison</button>
          </div>
          <table className="w-full text-[13px]">
            <thead><tr><th className="th">Metric</th><th className="th text-right">FCFS</th><th className="th text-right">Improved</th></tr></thead>
            <tbody>
              {[['Scheduled', 'scheduled'], ['Unallocated', 'unallocated'], ['Unused seats', 'unusedSeats'], ['Conflicts', 'conflicts']].map(([label, key]) => (
                <tr key={key}><td className="td">{label}</td><td className="td text-right tabular-nums">{results.fcfs.metrics[key]}</td><td className="td text-right tabular-nums">{results.improved.metrics[key]}</td></tr>
              ))}
              <tr><td className="td">Runtime (ms)</td><td className="td text-right tabular-nums">{results.fcfs.metrics.runtimeMs.toFixed(4)}</td><td className="td text-right tabular-nums">{results.improved.metrics.runtimeMs.toFixed(4)}</td></tr>
            </tbody>
          </table>
          <p className="px-4 py-3 text-[13px] text-ink-soft">
            {winner === 'tie' ? 'Both algorithms give equivalent results on this input.' : `${winner === 'improved' ? 'Improved' : 'FCFS'} performs better on this input.`}
          </p>
        </section>
      </div>

      {unallocated.length > 0 && (
        <section className="card mt-5">
          <h2 className="border-b border-line px-4 py-3 text-sm">Unallocated requests ({active.name})</h2>
          <ul className="divide-y divide-line">
            {unallocated.map((r) => (
              <li key={r.requestId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[13px]">
                <span><b>{r.requestId}</b> · {r.department} · {r.computers} computers</span>
                <span className="flex items-center gap-2 text-ink-soft"><StatusBadge status="unallocated" />{r.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
