const Table = ({ columns = [], rows = [] }) => (
  <div className="card-panel overflow-auto">
    <table className="min-w-full text-sm">
      <thead className="bg-slate-50">
        <tr>
          {columns.map((col) => (
            <th key={col} className="text-left px-4 py-3 font-semibold text-slate-700">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx} className="border-t border-slate-100">
            {row.map((cell, c) => (
              <td key={c} className="px-4 py-3 text-slate-700">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Table;
