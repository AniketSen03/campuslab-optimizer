const TONES = { default: 'text-ink', good: 'text-ok', bad: 'text-bad', warn: 'text-warn' };

export default function StatCard({ label, value, hint, icon: Icon, tone = 'default' }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between text-ink-mute">
        <span className="text-[13px]">{label}</span>
        {Icon && <Icon size={16} aria-hidden="true" />}
      </div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${TONES[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-mute">{hint}</div>}
    </div>
  );
}
