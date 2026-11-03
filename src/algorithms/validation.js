import { feasibleCells } from './core.js';

export const SLOTS = ['S1', 'S2', 'S3', 'S4'];

const isPositiveInteger = (value) => /^\d+$/.test(String(value).trim()) && parseInt(value, 10) > 0;
const cleanSlots = (slots) => (Array.isArray(slots) ? [...new Set(slots)] : []);

/** Returns { errors: {field: message}, value } where value is the normalised lab. */
export function validateLab(input, existingLabs, editingId = null) {
  const errors = {};
  const id = String(input.id ?? '').trim().toUpperCase();
  const name = String(input.name ?? '').trim();
  const slots = cleanSlots(input.slots);

  if (!id) errors.id = 'Enter a lab ID, for example "E".';
  else if (editingId === null && existingLabs.some((l) => l.id === id)) errors.id = `Lab ID "${id}" already exists. Choose a different ID.`;
  if (!name) errors.name = 'Enter a lab name.';
  if (!isPositiveInteger(input.capacity)) errors.capacity = 'Capacity must be a whole number greater than 0.';
  if (slots.length === 0) errors.slots = 'Select at least one available slot.';
  else if (slots.some((s) => !SLOTS.includes(s))) errors.slots = `Slots must be one of ${SLOTS.join(', ')}.`;

  return {
    errors,
    value: { id, name, capacity: isPositiveInteger(input.capacity) ? parseInt(input.capacity, 10) : input.capacity, slots: SLOTS.filter((s) => slots.includes(s)) },
  };
}

/** Returns { errors, warnings, value }. Requests that fit nowhere get a warning, not an error. */
export function validateRequest(input, existingRequests, labs, editingId = null) {
  const errors = {};
  const warnings = [];
  const id = String(input.id ?? '').trim().toUpperCase();
  const department = String(input.department ?? '').trim();
  const slots = cleanSlots(input.slots);

  if (!id) errors.id = 'Enter a request ID, for example "R6".';
  else if (editingId === null && existingRequests.some((r) => r.id === id)) errors.id = `Request ID "${id}" already exists. Choose a different ID.`;
  if (!department) errors.department = 'Enter a department name.';
  if (!isPositiveInteger(input.computers)) errors.computers = 'Computers required must be a whole number greater than 0.';
  if (slots.length === 0) errors.slots = 'Select at least one allowed slot.';
  else if (slots.some((s) => !SLOTS.includes(s))) errors.slots = `Slots must be one of ${SLOTS.join(', ')}.`;

  const value = {
    id,
    department,
    computers: isPositiveInteger(input.computers) ? parseInt(input.computers, 10) : input.computers,
    slots: SLOTS.filter((s) => slots.includes(s)),
  };
  if (Object.keys(errors).length === 0 && feasibleCells(value, labs).length === 0) {
    warnings.push(`No available lab can host ${value.computers} computers in ${value.slots.join(', ')}. It will be saved and shown as unallocated.`);
  }
  return { errors, warnings, value };
}

/** Validates a whole instance (e.g. imported or stored data). Returns a list of messages. */
export function validateInstance(labs, requests) {
  const problems = [];
  const labIds = new Set();
  labs.forEach((lab) => {
    const { errors } = validateLab(lab, [], 'self');
    Object.values(errors).forEach((m) => problems.push(`Lab ${lab.id || '?'}: ${m}`));
    if (labIds.has(lab.id)) problems.push(`Duplicate lab ID "${lab.id}".`);
    labIds.add(lab.id);
  });
  const requestIds = new Set();
  requests.forEach((req) => {
    const { errors } = validateRequest(req, [], labs, 'self');
    Object.values(errors).forEach((m) => problems.push(`Request ${req.id || '?'}: ${m}`));
    if (requestIds.has(req.id)) problems.push(`Duplicate request ID "${req.id}".`);
    requestIds.add(req.id);
  });
  return problems;
}
