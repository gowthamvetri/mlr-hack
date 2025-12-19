import { memo } from 'react';

const DataTable = memo(({ columns, data, emptyMessage = 'No data available' }) => {
  return (
    <div className="bg-dark-800 rounded-2xl shadow-lg border border-dark-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-900 border-b border-dark-700">
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-dark-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={row._id || row.id || rowIdx} className="hover:bg-dark-700/50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 text-sm text-dark-200">
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
