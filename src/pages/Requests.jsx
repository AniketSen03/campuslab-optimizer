import { useState } from 'react';
import { ClipboardList, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import FormModal, { Field } from '../components/FormModal.jsx';
import SlotPicker from '../components/SlotPicker.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { validateRequest } from '../algorithms/validation.js';
import { feasibleCells } from '../algorithms/core.js';

const BLANK = { id: '', department: '', computers: '', slots: [] };

export default function Requests({ labs, requests, setRequests, notify }) {
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState([]);

  const open = (req) => { setEditingId(req ? req.id : null); setForm(req ? { ...req } : { ...BLANK, id: `R${requests.length + 1}` }); setErrors({}); setWarnings([]); };
  const close = () => setForm(null);

  const save = () => {
    const { errors: e, warnings: w, value } = validateRequest(form, requests, labs, editingId);
    setErrors(e);
    setWarnings(w);
    if (Object.keys(e).length) return;
    setRequests(editingId ? requests.map((r) => (r.id === editingId ? value : r)) : [...requests, value]);
    notify(w.length ? 'error' : 'success', w.length ? `${value.id} saved, but no lab can host it. It is unallocated.` : editingId ? `${value.id} updated.` : `${value.id} added.`);
    close();
  };

  const remove = (req) => {
    if (!window.confirm(`Delete request ${req.id} (${req.department})?`)) return;
    setRequests(requests.filter((r) => r.id !== req.id));
    notify('success', `${req.id} deleted.`);
  };

  const columns = [
    { key: 'id', header: 'Request', render: (r) => <span className="font-mono font-medium">{r.id}</span> },
    { key: 'department', header: 'Department' },
    { key: 'computers', header: 'Computers needed', align: 'right' },
    { key: 'slots', header: 'Allowed slots', render: (r) => <span className="font-mono">{r.slots.join(', ')}</span> },
    {
      key: 'fit', header: 'Fits a lab?',
      render: (r) => (feasibleCells(r, labs).length ? <span className="text-ok">Yes</span> : <span className="inline-flex items-center gap-1 text-bad"><TriangleAlert size={13} /> No</span>),
    },
    {
      key: 'actions', header: '', align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button className="btn px-2" onClick={() => open(r)} aria-label={`Edit ${r.id}`}><Pencil size={14} /></button>
          <button className="btn btn-danger px-2" onClick={() => remove(r)} aria-label={`Delete ${r.id}`}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  return (
    <>
      <PageHeader title="Department requests" description="Each request is one indivisible session. Input order matters for FCFS." actions={<button className="btn btn-primary" onClick={() => open(null)}><Plus size={15} /> Add request</button>} />
      <div className="card">
        <DataTable columns={columns} rows={requests} rowKey="id" empty={<EmptyState icon={ClipboardList} title="No department requests">Add a request to see how each algorithm schedules it.</EmptyState>} />
      </div>
      <FormModal open={form !== null} title={editingId ? 'Edit request' : 'Add request'} onClose={close} onSubmit={save} submitLabel={editingId ? 'Save changes' : 'Add request'}>
        {form && (
          <>
            <Field label="Request ID" htmlFor="req-id" error={errors.id}><input id="req-id" className="input font-mono" value={form.id} readOnly={Boolean(editingId)} onChange={(e) => set({ id: e.target.value })} /></Field>
            <Field label="Department" htmlFor="req-dept" error={errors.department}><input id="req-dept" className="input" value={form.department} onChange={(e) => set({ department: e.target.value })} placeholder="EEE" /></Field>
            <Field label="Computers required" htmlFor="req-n" error={errors.computers}><input id="req-n" className="input" inputMode="numeric" value={form.computers} onChange={(e) => set({ computers: e.target.value })} placeholder="30" /></Field>
            <Field label="Allowed slots" error={errors.slots}><SlotPicker value={form.slots} onChange={(slots) => set({ slots })} /></Field>
            {warnings.map((w) => <p key={w} className="rounded-md bg-warn-soft px-3 py-2 text-[13px] text-warn">{w}</p>)}
          </>
        )}
      </FormModal>
    </>
  );
}
