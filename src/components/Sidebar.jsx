import { ChevronsLeft, ChevronsRight, FlaskConical, X } from 'lucide-react';

export default function Sidebar({ pages, current, onNavigate, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-[transform,width] duration-200 lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'lg:w-[68px]' : 'lg:w-60'}`}
        aria-label="Primary"
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-white"><FlaskConical size={17} /></span>
            <span className={`whitespace-nowrap font-semibold ${collapsed ? 'lg:hidden' : ''}`}>CampusLab</span>
          </div>
          <button className="rounded p-1 text-ink-mute hover:bg-paper lg:hidden" onClick={onCloseMobile} aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {pages.map(({ id, label, icon: Icon }) => {
            const active = id === current;
            return (
              <button
                key={id}
                onClick={() => { onNavigate(id); onCloseMobile(); }}
                title={collapsed ? label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] transition-colors ${active ? 'bg-accent-soft font-medium text-accent' : 'text-ink-soft hover:bg-paper hover:text-ink'}`}
              >
                <Icon size={17} className="shrink-0" aria-hidden="true" />
                <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="hidden border-t border-line p-2 lg:block">
          <button onClick={onToggleCollapse} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] text-ink-mute hover:bg-paper" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
