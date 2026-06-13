import { useState } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';

const TABS = [
  { key: 'guidelines', label: 'Guidelines' },
  { key: 'projects', label: 'Projects' },
  { key: 'assets', label: 'Assets' },
];

const MOCK_GUIDELINES = [
  { _id: '1', task_id: 'T001', task_type: 'Quiz', description: 'Create a quiz about Neural Networks', course: 'Machine Learning', priority: 'High', status: 'Pending', is_active: true, created_at: '2026-06-13T10:00:00' },
  { _id: '2', task_id: 'T002', task_type: 'Study Guide', description: 'Focus on Module 5 today', course: 'Data Structures', priority: 'Medium', status: 'Completed', is_active: true, created_at: '2026-06-13T09:30:00' },
  { _id: '3', task_id: 'T003', task_type: 'Assignment', description: 'Practice problems for Chapter 3', course: 'Algorithms', priority: 'Low', status: 'Pending', is_active: false, created_at: '2026-06-12T14:00:00' },
];

const MOCK_PROJECTS = [
  { _id: '1', project_id: 'machinelearning' },
  { _id: '2', project_id: 'datastructures' },
  { _id: '3', project_id: 'testproject1' },
];

const MOCK_ASSETS = [
  { _id: '1', asset_name: 'ML_Lecture_1.pdf', asset_type: 'FILE', asset_size: 2048576, project: 'machinelearning' },
  { _id: '2', asset_name: 'DS_Session_3.pdf', asset_type: 'FILE', asset_size: 1572864, project: 'datastructures' },
];

const COLUMN_DEFS = {
  guidelines: [
    { key: 'task_id', label: 'Task ID', editable: false },
    { key: 'task_type', label: 'Type', render: (v) => (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">{v}</span>
    )},
    { key: 'description', label: 'Description' },
    { key: 'course', label: 'Course' },
    { key: 'priority', label: 'Priority', render: (v) => {
      const colors = { High: 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400', Medium: 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400', Low: 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400' };
      return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[v] || ''}`}>{v}</span>;
    }},
    { key: 'status', label: 'Status', render: (v) => {
      const colors = { Pending: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', Completed: 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400', 'In Progress': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' };
      return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[v] || ''}`}>{v}</span>;
    }},
    { key: 'is_active', label: 'Active', render: (v) => (
      <span className={`w-2.5 h-2.5 rounded-full inline-block ${v ? 'bg-accent-500' : 'bg-surface-300'}`} />
    )},
  ],
  projects: [
    { key: 'project_id', label: 'Project ID' },
  ],
  assets: [
    { key: 'asset_name', label: 'File Name', editable: false },
    { key: 'asset_type', label: 'Type' },
    { key: 'asset_size', label: 'Size', render: (v) => {
      const kb = v / 1024;
      return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
    }},
    { key: 'project', label: 'Project' },
  ],
};

const MOCK_DATA = {
  guidelines: MOCK_GUIDELINES,
  projects: MOCK_PROJECTS,
  assets: MOCK_ASSETS,
};

export default function AdminData() {
  const [activeTab, setActiveTab] = useState('guidelines');
  const [data, setData] = useState(MOCK_DATA);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRow, setNewRow] = useState({});
  const toast = useToast();

  const handleEdit = (row, colKey, newValue) => {
    setData(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(r =>
        r._id === row._id ? { ...r, [colKey]: newValue } : r
      ),
    }));
    toast.success('Record updated');
  };

  const handleDelete = (row) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    setData(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(r => r._id !== row._id),
    }));
    toast.success('Record deleted');
  };

  const handleAdd = () => {
    setNewRow({});
    setShowAddModal(true);
  };

  const saveNewRow = () => {
    const id = String(Date.now());
    setData(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], { ...newRow, _id: id }],
    }));
    setShowAddModal(false);
    toast.success('Record added');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">Data Management</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          View, edit, and manage all system records
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs text-surface-400">
              ({data[tab.key]?.length || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        title={TABS.find(t => t.key === activeTab)?.label || ''}
        data={data[activeTab] || []}
        columns={COLUMN_DEFS[activeTab] || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
      />

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add ${TABS.find(t => t.key === activeTab)?.label?.replace(/s$/, '') || 'Record'}`}
        footer={
          <>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveNewRow}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-all"
            >
              Add Record
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {(COLUMN_DEFS[activeTab] || []).filter(c => c.editable !== false).map(col => (
            <div key={col.key}>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                {col.label}
              </label>
              <input
                type="text"
                value={newRow[col.key] || ''}
                onChange={(e) => setNewRow(prev => ({ ...prev, [col.key]: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-surface-900 dark:text-surface-100 outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder={`Enter ${col.label.toLowerCase()}`}
              />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
