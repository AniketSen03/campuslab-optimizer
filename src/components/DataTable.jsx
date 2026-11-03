/** columns: [{ key, header, render?(row), align? }] */
export default function DataTable({ columns, rows, rowKey, empty }) {
  if (rows.length === 0) return empty ?? null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[13px]">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`th ${c.align === 'right' ? 'text-right' : ''}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]} className="hover:bg-paper/70">
              {columns.map((c) => (
                <td key={c.key} className={`td ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
