import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, FileText, Layers, BookOpen, Activity, RefreshCw,
  MessageSquare, BarChart3, ClipboardList, Upload
} from 'lucide-react';
import StatsCard from '../../components/StatsCard';
import { healthCheck } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');
  const toast = useToast();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const health = await healthCheck();
      setServerStatus('online');
      setStats({
        appName: health.app_name || 'Raaed',
        version: health.app_version || '0.2',
        services: health.services || {
          mongodb: 'offline',
          qdrant: 'offline',
          openai: 'offline'
        },
        stats: health.stats || {
          projects_count: 0,
          documents_count: 0,
          guidelines_count: 0
        }
      });
    } catch {
      setServerStatus('offline');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const QUICK_ACTIONS = [
    { label: 'Upload Files', desc: 'Add course materials', href: '/admin/upload', icon: Upload, color: 'bg-primary-50 dark:bg-primary-950/30', iconColor: 'text-primary-500' },
    { label: 'Command Chat', desc: 'Issue admin commands', href: '/admin/chat', icon: MessageSquare, color: 'bg-violet-50 dark:bg-violet-950/30', iconColor: 'text-violet-500' },
    { label: 'Data Manager', desc: 'View & edit records', href: '/admin/data', icon: BarChart3, color: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-500' },
    { label: 'Guidelines', desc: 'Manage directives', href: '/admin/guidelines', icon: ClipboardList, color: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
            Dashboard
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Welcome back, {user?.name || 'Admin'} — here's your system overview
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-sm font-medium text-surface-600 dark:text-surface-300 hover:border-primary-300 hover:text-primary-600 transition-all shadow-card hover:shadow-card-hover"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Server Status"
          value={serverStatus === 'online' ? 'Online' : serverStatus === 'checking' ? '...' : 'Offline'}
          subtitle={stats ? `v${stats.version}` : 'Backend unreachable'}
          icon={Activity}
          color={serverStatus === 'online' ? 'accent' : 'danger'}
          loading={loading}
        />
        <StatsCard
          title="Projects"
          value={stats?.stats?.projects_count !== undefined ? stats.stats.projects_count : '\u2014'}
          subtitle="Manage via Data tab"
          icon={FolderOpen}
          color="primary"
          loading={loading}
        />
        <StatsCard
          title="Documents"
          value={stats?.stats?.documents_count !== undefined ? stats.stats.documents_count : '\u2014'}
          subtitle="Upload new materials"
          icon={FileText}
          color="warning"
          loading={loading}
        />
        <StatsCard
          title="Active Guidelines"
          value={stats?.stats?.guidelines_count !== undefined ? stats.stats.guidelines_count : '\u2014'}
          subtitle="View in Guidelines tab"
          icon={BookOpen}
          color="accent"
          loading={loading}
        />
      </div>

      {/* Quick Actions & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Info */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-card">
          <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
            <Layers size={18} className="text-primary-500" />
            System Architecture
          </h3>
          <div className="space-y-3">
            {[
              { label: 'RAG Pipeline', desc: 'GTE Embedding + BGE Reranker + GPT-4o-mini', status: stats?.services?.openai || 'offline' },
              { label: 'Vector Database', desc: 'Qdrant (Local Persistent)', status: stats?.services?.qdrant || 'offline' },
              { label: 'Document Store', desc: 'MongoDB Atlas', status: stats?.services?.mongodb || 'offline' },
              { label: 'Agent Framework', desc: 'CrewAI Multi-Agent', status: stats?.services?.openai || 'offline' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{item.label}</p>
                  <p className="text-xs text-surface-400">{item.desc}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  item.status === 'online'
                    ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'online' ? 'bg-accent-500' : 'bg-surface-400'}`} />
                  {item.status === 'online' ? 'Connected' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>


        {/* Quick Actions */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-card">
          <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className={`${action.color} rounded-xl p-4 hover:scale-[1.03] transition-all duration-200 group`}
              >
                <div className={`w-10 h-10 rounded-lg bg-white/60 dark:bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon size={20} className={action.iconColor} />
                </div>
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{action.label}</p>
                <p className="text-xs text-surface-400 mt-0.5">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* API Endpoints Reference */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-card">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
          API Endpoints
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-800">
                <th className="text-left px-3 py-2 text-xs font-semibold text-surface-500 uppercase">Method</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-surface-500 uppercase">Endpoint</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-surface-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                { method: 'POST', endpoint: '/api/v1/data/upload/{project_id}', desc: 'Upload PDF/TXT file' },
                { method: 'POST', endpoint: '/api/v1/data/process/{project_id}', desc: 'Process & chunk files' },
                { method: 'POST', endpoint: '/api/v1/nlp/index/push/{project_id}', desc: 'Index to vector DB' },
                { method: 'POST', endpoint: '/api/v1/agent/chat/{project_id}', desc: 'Chat with AI agent' },
                { method: 'POST', endpoint: '/api/v1/agent/quiz/{project_id}', desc: 'Generate quiz' },
                { method: 'POST', endpoint: '/api/v1/admin/task/create', desc: 'Create admin task' },
              ].map((api, i) => (
                <tr key={i} className="border-b border-surface-100 dark:border-surface-800/50 last:border-0">
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                      {api.method}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-surface-600 dark:text-surface-300">{api.endpoint}</td>
                  <td className="px-3 py-2.5 text-surface-500 dark:text-surface-400">{api.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
