import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUsers, updateUserRole, getUserResults } from '../../services/api';
import { useToast } from '../../components/Toast';
import {
  Users, Shield, GraduationCap, Search, ChevronDown, ChevronUp,
  Trophy, Target, CheckCircle, XCircle, Eye, X, BarChart3,
  TrendingUp, Award, Clock
} from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'goharhany@gmail.com';

export default function AdminStudents() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userResults, setUserResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState(null);

  const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast(`Role updated to ${newRole}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  const openUserDetails = async (u) => {
    setSelectedUser(u);
    setResultsLoading(true);
    setExpandedQuiz(null);
    try {
      const data = await getUserResults(u.id);
      setUserResults(data.results || []);
    } catch (err) {
      setUserResults([]);
      showToast('Failed to load results', 'error');
    } finally {
      setResultsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedUser(null);
    setUserResults(null);
    setExpandedQuiz(null);
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;

  // ── Stats for selected user ──
  const avgScore = userResults && userResults.length > 0
    ? Math.round(userResults.reduce((acc, r) => acc + (r.total > 0 ? (r.score / r.total) * 100 : 0), 0) / userResults.length)
    : 0;
  const totalQuizzes = userResults?.length || 0;
  const bestScore = userResults && userResults.length > 0
    ? Math.max(...userResults.map(r => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0))
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
          Student Management
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Manage users, view student performance, and control access roles
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center">
            <Users size={22} className="text-primary-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{users.length}</p>
            <p className="text-xs text-surface-400">Total Users</p>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-50 dark:bg-accent-950/50 flex items-center justify-center">
            <GraduationCap size={22} className="text-accent-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{totalStudents}</p>
            <p className="text-xs text-surface-400">Students</p>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center">
            <Shield size={22} className="text-violet-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{totalAdmins}</p>
            <p className="text-xs text-surface-400">Admins</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-sm text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'student', 'admin'].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                roleFilter === role
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-300 hover:border-primary-300'
              }`}
            >
              {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-surface-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="text-surface-300 mx-auto mb-3" />
            <p className="text-sm text-surface-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Role</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-surface-100 dark:border-surface-800/50 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-surface-900 dark:text-surface-100">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-surface-500 dark:text-surface-400">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'admin'
                          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                          : 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400'
                      }`}>
                        {u.role === 'admin' ? <Shield size={12} /> : <GraduationCap size={12} />}
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openUserDetails(u)}
                          className="p-2 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {isSuperAdmin && u.email !== SUPER_ADMIN_EMAIL && (
                          <button
                            onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'student' : 'admin')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              u.role === 'admin'
                                ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 hover:bg-warning-200'
                                : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200'
                            }`}
                          >
                            {u.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Student Details Modal ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeDetails}>
          <div
            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center text-white text-lg font-bold">
                  {selectedUser.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">{selectedUser.name}</h2>
                  <p className="text-sm text-surface-400">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={closeDetails} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <X size={20} className="text-surface-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
              {resultsLoading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-surface-400">Loading results...</p>
                </div>
              ) : (
                <>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 text-center">
                      <BarChart3 size={20} className="text-primary-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-surface-900 dark:text-surface-100">{totalQuizzes}</p>
                      <p className="text-[10px] text-surface-400 uppercase font-medium">Quizzes Taken</p>
                    </div>
                    <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 text-center">
                      <TrendingUp size={20} className="text-accent-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-surface-900 dark:text-surface-100">{avgScore}%</p>
                      <p className="text-[10px] text-surface-400 uppercase font-medium">Avg Score</p>
                    </div>
                    <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 text-center">
                      <Award size={20} className="text-warning-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-surface-900 dark:text-surface-100">{bestScore}%</p>
                      <p className="text-[10px] text-surface-400 uppercase font-medium">Best Score</p>
                    </div>
                  </div>

                  {/* Quiz Results List */}
                  {userResults.length === 0 ? (
                    <div className="py-8 text-center">
                      <Target size={36} className="text-surface-300 mx-auto mb-3" />
                      <p className="text-sm text-surface-400">No quiz attempts yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-2">Quiz History</h3>
                      {userResults.map((result, idx) => {
                        const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
                        const isExpanded = expandedQuiz === idx;
                        const answersArr = result.answers
                          ? Object.keys(result.answers)
                              .sort((a, b) => parseInt(a) - parseInt(b))
                              .map(k => result.answers[k])
                          : [];

                        return (
                          <div key={idx} className="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden">
                            <button
                              onClick={() => setExpandedQuiz(isExpanded ? null : idx)}
                              className="w-full flex items-center justify-between p-4 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                                  pct >= 80 ? 'bg-accent-500' : pct >= 60 ? 'bg-warning-500' : 'bg-danger-500'
                                }`}>
                                  {pct}%
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                                    Quiz {result.task_id || `#${idx + 1}`}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-surface-400">
                                    <span>{result.score}/{result.total} correct</span>
                                    {result.completed_at && (
                                      <>
                                        <span>•</span>
                                        <Clock size={11} className="inline" />
                                        <span>{result.completed_at}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isExpanded ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
                            </button>

                            {/* Expanded Answers */}
                            {isExpanded && answersArr.length > 0 && (
                              <div className="border-t border-surface-200 dark:border-surface-800 p-4 space-y-3 bg-surface-50 dark:bg-surface-800/20">
                                {answersArr.map((a, qi) => (
                                  <div
                                    key={qi}
                                    className={`p-3 rounded-lg border ${
                                      a.isCorrect
                                        ? 'border-accent-200 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-950/20'
                                        : 'border-danger-200 dark:border-danger-800 bg-danger-50/50 dark:bg-danger-950/20'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                                        a.isCorrect ? 'bg-accent-500 text-white' : 'bg-danger-500 text-white'
                                      }`}>
                                        {a.isCorrect ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-surface-900 dark:text-surface-100 mb-1">
                                          {qi + 1}. {a.question}
                                        </p>
                                        {!a.isCorrect ? (
                                          <p className="text-[11px] text-surface-400">
                                            Answer: <span className="text-danger-500 font-medium">{a.selectedText || a.selected}</span>
                                            {' • '}
                                            Correct: <span className="text-accent-500 font-medium">{a.correctText || a.correct}</span>
                                          </p>
                                        ) : (
                                          <p className="text-[11px] text-surface-400">
                                            Answer: <span className="text-accent-500 font-medium">{a.correctText || a.correct}</span>
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
