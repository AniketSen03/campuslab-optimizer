const STYLES = {
  allocated: ['bg-ok-soft text-ok', 'Allocated'],
  unallocated: ['bg-bad-soft text-bad', 'Unallocated'],
  unchanged: ['bg-paper text-ink-soft border border-line', 'Unchanged'],
  moved: ['bg-warn-soft text-warn', 'Moved'],
  lost: ['bg-bad-soft text-bad', 'Newly unallocated'],
  gained: ['bg-ok-soft text-ok', 'Newly allocated'],
  'still-unallocated': ['bg-paper text-ink-soft border border-line', 'Still unallocated'],
};

export default function StatusBadge({ status }) {
  const [cls, label] = STYLES[status] || STYLES.unchanged;
  return <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}
