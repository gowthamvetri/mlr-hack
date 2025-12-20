import { memo } from 'react';

const DataTable = memo(({ columns, data, emptyMessage = 'No data available' }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-zinc-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={row._id || row.id || rowIdx} className="hover:bg-zinc-50/50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 text-sm text-zinc-700">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

DataTable.displayName = 'DataTable';

export default DataTable;
