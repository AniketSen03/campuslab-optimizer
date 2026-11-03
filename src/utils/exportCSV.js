export function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCSV(headers, rows) {
  const lines = [headers.map(escapeCSV).join(',')];
  rows.forEach((row) => lines.push(row.map(escapeCSV).join(',')));
  return lines.join('\r\n');
}

export function downloadCSV(filename, headers, rows) {
  const blob = new Blob([toCSV(headers, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
