import { useState } from 'react';
import { Plus, Power, PowerOff, Edit3, Trash2, AlertCircle } from 'lucide-react';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';

const INITIAL_GUIDELINES = [
  { id: '1', task_id: 'T001', task_type: 'Quiz', description: 'Create a quiz about Neural Networks with 20 MCQs', course: 'Machine Learning', priority: 'High', is_active: true, created_at: '2026-06-13T10:00:00', notes: '20 MCQ questions, Chapter 5' },
  { id: '2', task_id: 'T002', task_type: 'Study Guide', description: 'Focus on Module 5 today', course: 'Data Structures', priority: 'Medium', is_active: true, created_at: '2026-06-13T09:30:00', notes: '' },
  { id: '3', task_id: 'T003', task_type: 'Assignment', description: 'Practice problems for Chapter 3', course: 'Algorithms', priority: 'Low', is_active: false, created_at: '2026-06-12T14:00:00', notes: 'Focus on sorting algorithms' },
];

const PRIORITY_COLORS = {
  High: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400 border-danger-200 dark:border-danger-800',
  Medium: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400 border-warning-200 dark:border-warning-800',
  Low: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 border-accent-200 dark:border-accent-800',
};

const TASK_TYPES = ['Quiz', 'Assignment', 'Study Guide', 'Summary', 'Exam', 'Flashcards'];
const PRIORITIES = ['High', 'Medium', 'Low'];

export default function AdminGuidelines() {
  const [guidelines, setGuidelines] = useState(INITIAL_GUIDELINES);
  const [showModal, setShowModal] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState(null);
  const [form, setForm] = useState({
    task_type: 'Quiz', description: '', course: '', priority: 'Medium', notes: '',
  });
  const toast = useToast();

  const toggleActive = (id) => {
    setGuidelines(prev => prev.map(g =>
      g.id === id ? { ...g, is_active: !g.is_active } : g
    ));
    toast.success('Guideline status updated');
  };

  const openAddModal = () => {
    setEditingGuideline(null);
    setForm({ task_type: 'Quiz', description: '', course: '', priority: 'Medium', notes: '' });
    setShowModal(true);
  };

  const openEditModal = (g) => {
    setEditingGuideline(g);
    setForm({ task_type: g.task_type, description: g.description, course: g.course, priority: g.priority, notes: g.notes || '' });
    setShowModal(true);
  };

  const saveGuideline = () => {
    if (!form.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (editingGuideline) {
      setGuidelines(prev => prev.map(g =>
        g.id === editingGuideline.id ? { ...g, ...form } : g
      ));
      toast.success('Guideline updated');
    } else {
      const newId = String(Date.now());
      const taskId = `T${String(guidelines.length + 1).padStart(3, '0')}`;
      setGuidelines(prev => [...prev, {
        id: newId, task_id: taskId, ...form, is_active: true, created_at: new Date().toISOString(),
      }]);
      toast.success(`Guideline ${taskId} created`);
    }
    setShowModal(false);
  };

  const deleteGuideline = (id) => {
    if (!confirm('Delete this guideline?')) return;
    setGuidelines(prev => prev.filter(g => g.id !== id));
    toast.success('Guideline deleted');
  };

  const activeCount = guidelines.filter(g => g.is_active).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">Guidelines</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {activeCount} active guideline{activeCount !== 1 ? 's' : ''} directing the AI assistant
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-all hover:shadow-glow active:scale-95"
        >
          <Plus size={16} />
          New Guideline
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800">
        <AlertCircle size={18} className="text-primary-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
            How Guidelines Work
          </p>
          <p className="text-xs text-primary-600/70 dark:text-primary-400/70 mt-1">
            Active guidelines are automatically injected into the AI assistant's context when students chat. This steers the conversation toward your instructional objectives.
          </p>
        </div>
      </div>

      {/* Guidelines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {guidelines.map((g) => (
          <div
            key={g.id}
            className={`relative p-5 rounded-2xl border-2 transition-all duration-300 ${
              g.is_active
                ? 'border-primary-200 dark:border-primary-800 bg-white dark:bg-surface-900 shadow-card'
                : 'border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-primary-600 dark:text-primary-400">
                  {g.task_id}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${PRIORITY_COLORS[g.priority]}`}>
                  {g.priority}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
                  {g.task_type}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleActive(g.id)}
                  className={`p-1.5 rounded-lg transition-all ${
                    g.is_active
                      ? 'text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-900/30'
                      : 'text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
                  title={g.is_active ? 'Deactivate' : 'Activate'}
                >
                  {g.is_active ? <Power size={16} /> : <PowerOff size={16} />}
                </button>
                <button onClick={() => openEditModal(g)} className="p-1.5 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => deleteGuideline(g.id)} className="p-1.5 rounded-lg text-surface-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <p className="text-sm text-surface-900 dark:text-surface-100 font-medium mb-1">
              {g.description}
            </p>
            {g.notes && (
              <p className="text-xs text-surface-400 mb-2">{g.notes}</p>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100 dark:border-surface-800/50">
              <span className="text-xs text-surface-400">
                📚 {g.course || 'General'}
              </span>
              <span className="text-xs text-surface-400">
                {new Date(g.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingGuideline ? 'Edit Guideline' : 'New Guideline'}
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all">
              Cancel
            </button>
            <button onClick={saveGuideline} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-all">
              {editingGuideline ? 'Save Changes' : 'Create Guideline'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Task Type</label>
            <select
              value={form.task_type}
              onChange={(e) => setForm(f => ({ ...f, task_type: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 text-surface-900 dark:text-surface-100"
            >
              {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 resize-none text-surface-900 dark:text-surface-100"
              placeholder="What should the AI assistant focus on?"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Course</label>
              <input
                type="text"
                value={form.course}
                onChange={(e) => setForm(f => ({ ...f, course: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 text-surface-900 dark:text-surface-100"
                placeholder="e.g., Machine Learning"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 text-surface-900 dark:text-surface-100"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 text-surface-900 dark:text-surface-100"
              placeholder="Additional parameters or notes"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
