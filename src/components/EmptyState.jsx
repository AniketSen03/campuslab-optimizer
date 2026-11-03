export default function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && <Icon size={28} className="mb-3 text-ink-mute" aria-hidden="true" />}
      <p className="font-medium">{title}</p>
      {children && <p className="mt-1 max-w-sm text-[13px] text-ink-mute">{children}</p>}
    </div>
  );
}
