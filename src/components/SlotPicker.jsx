import { SLOTS } from '../algorithms/validation.js';

export default function SlotPicker({ value, onChange }) {
  const toggle = (slot) => onChange(value.includes(slot) ? value.filter((s) => s !== slot) : [...value, slot]);
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Time slots">
      {SLOTS.map((slot) => {
        const on = value.includes(slot);
        return (
          <button
            key={slot}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(slot)}
            className={`rounded-md border px-3 py-1 font-mono text-[13px] transition-colors ${on ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong bg-white text-ink-soft hover:bg-paper'}`}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
}
