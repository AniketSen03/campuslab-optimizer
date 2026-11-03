import { slotOrder } from '../algorithms/core.js';

/** Lab x slot timetable. Shows booked, free and unavailable cells. */
export default function ScheduleGrid({ labs, rows }) {
  const slots = [...new Set(labs.flatMap((l) => l.slots).concat(rows.filter((r) => r.slot).map((r) => r.slot)))].sort((a, b) => slotOrder(a) - slotOrder(b));
  const booked = new Map(rows.filter((r) => r.status === 'allocated').map((r) => [`${r.labId}|${r.slot}`, r]));
  if (labs.length === 0 || slots.length === 0) return <p className="p-4 text-[13px] text-ink-mute">No laboratories to display.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="th w-32">Laboratory</th>
            {slots.map((s) => <th key={s} className="th font-mono">{s}</th>)}
          </tr>
        </thead>
        <tbody>
          {labs.map((lab) => (
            <tr key={lab.id}>
              <th scope="row" className="td text-left font-medium">
                {lab.name}
                <span className="block text-xs font-normal text-ink-mute">{lab.capacity} seats</span>
              </th>
              {slots.map((slot) => {
                const hit = booked.get(`${lab.id}|${slot}`);
                if (hit) {
                  return (
                    <td key={slot} className="td">
                      <div className="rounded-md border border-accent/30 bg-accent-soft px-2 py-1.5">
                        <div className="font-medium text-accent">{hit.requestId} · {hit.department}</div>
                        <div className="text-xs text-ink-soft">{hit.computers}/{lab.capacity} used, {hit.unused} idle</div>
                      </div>
                    </td>
                  );
                }
                if (!lab.slots.includes(slot)) {
                  return (
                    <td key={slot} className="td">
                      <div className="rounded-md px-2 py-1.5 text-xs text-ink-mute" style={{ backgroundImage: 'repeating-linear-gradient(135deg,#f1eee8,#f1eee8 4px,#faf8f5 4px,#faf8f5 8px)' }}>Unavailable</div>
                    </td>
                  );
                }
                return (
                  <td key={slot} className="td">
                    <div className="rounded-md border border-dashed border-line-strong px-2 py-1.5 text-xs text-ink-mute">Free</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
