import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function FormModal({ open, title, onClose, onSubmit, submitLabel = 'Save', children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={title}
        noValidate
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl border border-line bg-white shadow-pop sm:max-w-md sm:rounded-lg"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-base">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-ink-mute hover:bg-paper" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="space-y-4 px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}

export function Field({ label, error, children, htmlFor }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-bad" role="alert">{error}</p>}
    </div>
  );
}
