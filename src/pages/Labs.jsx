import { useState } from 'react';
import { FlaskConical, Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import FormModal, { Field } from '../components/FormModal.jsx';
import SlotPicker from '../components/SlotPicker.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { validateLab } from '../algorithms/validation.js';

const BLANK = { id: '', name: '', capacity: '', slots: [] };

export default function Labs({ labs, setLabs, notify }) {
  const [form, setForm] = useState(null); // null = closed
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  const open = (lab) => { setEditingId(lab ? lab.id : null); setForm(lab ? { ...lab } : BLANK); setErrors({}); };
  const close = () => setForm(null);

  const save = () => {
    const { errors: e, value } = validateLab(form, labs, editingId);
    setErrors(e);
    if (Object.keys(e).length) return;
    setLabs(editingId ? labs.map((l) => (l.id === editingId ? value : l)) : [...labs, value]);
    notify('success', editingId ? `${value.name} updated.` : `${value.name} added.`);
    close();
  };

  const remove = (lab) => {
    if (!window.confirm(`Delete ${lab.name}? Requests will be re-allocated without it.`)) return;
    setLabs(labs.filter((l) => l.id !== lab.id));
    notify('success', `${lab.name} deleted.`);
  };

  const columns = [
    { key: 'id', header: 'ID', render: (l) => <span className="font-mono">{l.id}</span> },
    { key: 'name', header: 'Name' },
    { key: 'capacity', header: 'Computers', align: 'right' },
    { key: 'slots', header: 'Available slots', render: (l) => <span className="font-mono">{l.slots.join(', ')}</span> },
    {
      key: 'actions', header: '', align: 'right',
      render: (l) => (
        <div className="flex justify-end gap-1">
          <button className="btn px-2" onClick={() => open(l)} aria-label={`Edit ${l.name}`}><Pencil size={14} /></button>
          <button className="btn btn-danger px-2" onClick={() => remove(l)} aria-label={`Delete ${l.name}`}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  return (
    <>
      <PageHeader title="Labs management" description="Add, edit or remove laboratories. Allocations recalculate immediately." actions={<button className="btn btn-primary" onClick={() => open(null)}><Plus size={15} /> Add lab</button>} />
      <div className="card">
        <DataTable columns={columns} rows={labs} rowKey="id" empty={<EmptyState icon={FlaskConical} title="No laboratories yet">Add a lab to start allocating. Until then every request stays unallocated.</EmptyState>} />
      </div>
      <FormModal open={form !== null} title={editingId ? 'Edit laboratory' : 'Add laboratory'} onClose={close} onSubmit={save} submitLabel={editingId ? 'Save changes' : 'Add lab'}>
        {form && (
          <>
            <Field label="Lab ID" htmlFor="lab-id" error={errors.id}><input id="lab-id" className="input font-mono" value={form.id} readOnly={Boolean(editingId)} onChange={(e) => set({ id: e.target.value })} placeholder="E" /></Field>
            <Field label="Lab name" htmlFor="lab-name" error={errors.name}><input id="lab-name" className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Lab E" /></Field>
            <Field label="Computers (capacity)" htmlFor="lab-cap" error={errors.capacity}><input id="lab-cap" className="input" inputMode="numeric" value={form.capacity} onChange={(e) => set({ capacity: e.target.value })} placeholder="45" /></Field>
            <Field label="Available slots" error={errors.slots}><SlotPicker value={form.slots} onChange={(slots) => set({ slots })} /></Field>
          </>
        )}
      </FormModal>
    </>
  );
}
