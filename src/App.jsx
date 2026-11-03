import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarClock, ClipboardList, FlaskConical, GitCompare, Info, LayoutDashboard, CheckCircle2, AlertTriangle } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Labs from './pages/Labs.jsx';
import Requests from './pages/Requests.jsx';
import Allocations from './pages/Allocations.jsx';
import Comparison from './pages/Comparison.jsx';
import Rescheduling from './pages/Rescheduling.jsx';
import Methodology from './pages/Methodology.jsx';
import { fcfs } from './algorithms/fcfs.js';
import { improved } from './algorithms/improved.js';
import { runAlgorithm } from './algorithms/metrics.js';
import { INITIAL_LABS, INITIAL_REQUESTS } from './data/initialData.js';
import { usePersistentState } from './utils/usePersistentState.js';

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'labs', label: 'Labs Management', icon: FlaskConical },
  { id: 'requests', label: 'Department Requests', icon: ClipboardList },
  { id: 'allocations', label: 'Allocation Results', icon: BarChart3 },
  { id: 'comparison', label: 'Algorithm Comparison', icon: GitCompare },
  { id: 'rescheduling', label: 'Rescheduling', icon: CalendarClock },
  { id: 'methodology', label: 'About / Methodology', icon: Info },
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [labs, setLabs] = usePersistentState('campuslab.labs.v1', INITIAL_LABS);
  const [requests, setRequests] = usePersistentState('campuslab.requests.v1', INITIAL_REQUESTS);
  const [snapshot, setSnapshot] = usePersistentState('campuslab.snapshot.v1', null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((type, message) => setToast({ type, message, id: Date.now() }), []);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Both algorithms always run on the same labs and requests.
  const results = useMemo(
    () => ({
      fcfs: runAlgorithm('FCFS', fcfs, labs, requests),
      improved: runAlgorithm('Improved', improved, labs, requests),
    }),
    [labs, requests]
  );

  const resetData = () => {
    if (!window.confirm('Replace all labs and requests with the official problem-statement data?')) return;
    setLabs(INITIAL_LABS);
    setRequests(INITIAL_REQUESTS);
    setSnapshot(null);
    notify('success', 'Official data restored.');
  };

  const shared = { labs, setLabs, requests, setRequests, results, snapshot, setSnapshot, notify, navigate: setPage };
  const current = PAGES.find((p) => p.id === page);

  return (
    <div className="flex h-full">
      <Sidebar pages={PAGES} current={page} onNavigate={setPage} collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Navbar title={current.label} onOpenMobile={() => setMobileOpen(true)} onResetData={resetData} snapshotActive={Boolean(snapshot)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          {page === 'dashboard' && <Dashboard {...shared} />}
          {page === 'labs' && <Labs {...shared} />}
          {page === 'requests' && <Requests {...shared} />}
          {page === 'allocations' && <Allocations {...shared} />}
          {page === 'comparison' && <Comparison {...shared} />}
          {page === 'rescheduling' && <Rescheduling {...shared} />}
          {page === 'methodology' && <Methodology />}
        </main>
      </div>
      {toast && (
        <div key={toast.id} role="status" className={`fixed bottom-4 right-4 z-[60] flex max-w-sm items-start gap-2 rounded-md border px-4 py-3 text-[13px] shadow-pop ${toast.type === 'error' ? 'border-bad/30 bg-bad-soft text-bad' : 'border-ok/30 bg-ok-soft text-ok'}`}>
          {toast.type === 'error' ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
