import { useState, useMemo } from 'react';
import {
  ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight,
  Edit3, Trash2, Plus, X, Check, Download, Database
} from 'lucide-react';

export default function DataTable({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  onAdd,
  title = 'Data',
  loading = false,
  pageSize = 15,
}) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const filteredData = useMemo(() => {
    let result = [...data];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(row =>
        columns.some(col => String(row[col.key] ?? '').toLowerCase().includes(q))
      );
    }
    if (sortCol) {
      result.sort((a, b) => {
        const av = a[sortCol] ?? '';
        const bv = b[sortCol] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, searchQuery, sortCol, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key) => {
    if (sortCol === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(key);
      setSortDir('asc');
    }
  };

  const startEdit = (rowIndex, colKey, value) => {
    setEditingCell({ rowIndex, colKey });
    setEditValue(String(value ?? ''));
  };

  const saveEdit = (row) => {
    if (onEdit) {
      onEdit(row, editingCell.colKey, editValue);
    }
    setEditingCell(null);
  };

  const cancelEdit = () => setEditingCell(null);

  const exportCSV = () => {
    const header = columns.map(c => c.label).join(',');
    const rows = filteredData.map(row =>
      columns.map(c => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-800">
        <div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-100">{title}</h3>
          <p className="text-xs text-surface-400 mt-0.5">
            {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 rounded-xl px-3 py-2">
            <Search size={14} className="text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search..."
              className="bg-transparent outline-none text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 w-40"
            />
          </div>
          {/* Export */}
          <button
            onClick={exportCSV}
            className="p-2 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
            title="Export CSV"
          >
            <Download size={18} />
          </button>
          {/* Add Row */}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-all hover:shadow-glow active:scale-95"
            >
              <Plus size={16} />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left px-5 py-3 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer hover:text-surface-700 dark:hover:text-surface-200 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortCol === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="text-right px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-surface-100 dark:border-surface-800/50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3">
                      <div className="skeleton h-4 w-3/4 rounded" />
                    </td>
                  ))}
                  {(onEdit || onDelete) && <td className="px-5 py-3"><div className="skeleton h-4 w-16 rounded ml-auto" /></td>}
                </tr>
              ))
            ) : pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="text-center py-16 text-surface-400">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                      <Database size={24} className="text-surface-300 dark:text-surface-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-500 dark:text-surface-400">No data found</p>
                      <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">Try adjusting your search or add new entries</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              pagedData.map((row, rowIndex) => {
                const globalIndex = (currentPage - 1) * pageSize + rowIndex;
                return (
                  <tr
                    key={row._id || row.id || globalIndex}
                    className="border-b border-surface-100 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                  >
                    {columns.map((col) => {
                      const isEditing = editingCell?.rowIndex === globalIndex && editingCell?.colKey === col.key;
                      return (
                        <td key={col.key} className="px-5 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit(row);
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                className="bg-white dark:bg-surface-800 border border-primary-500 rounded-lg px-2 py-1 text-sm outline-none w-full"
                              />
                              <button onClick={() => saveEdit(row)} className="p-1 text-accent-500 hover:bg-accent-500/10 rounded">
                                <Check size={14} />
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-danger-500 hover:bg-danger-500/10 rounded">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span
                              onDoubleClick={() => col.editable !== false && startEdit(globalIndex, col.key, row[col.key])}
                              className={`text-surface-700 dark:text-surface-300 ${col.editable !== false ? 'cursor-text' : ''}`}
                              title={col.editable !== false ? 'Double-click to edit' : ''}
                            >
                              {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {(onEdit || onDelete) && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-1.5 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-primary-500/10 transition-all"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="p-1.5 rounded-lg text-surface-400 hover:text-danger-500 hover:bg-danger-500/10 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-surface-200 dark:border-surface-800">
          <span className="text-xs text-surface-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    currentPage === page
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
