import { Menu, RotateCcw } from 'lucide-react';

export default function Navbar({ title, onOpenMobile, onResetData, snapshotActive }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button className="rounded p-1.5 text-ink-soft hover:bg-white lg:hidden" onClick={onOpenMobile} aria-label="Open menu"><Menu size={20} /></button>
        <span className="font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        {snapshotActive && <span className="hidden rounded bg-warn-soft px-2 py-0.5 text-xs font-medium text-warn sm:inline">Lab A / S2 outage applied</span>}
        <button className="btn" onClick={onResetData} title="Restore the official problem-statement data">
          <RotateCcw size={14} aria-hidden="true" /> <span className="hidden sm:inline">Reset to official data</span><span className="sm:hidden">Reset</span>
        </button>
      </div>
    </header>
  );
}
