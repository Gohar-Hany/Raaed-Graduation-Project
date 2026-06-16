import { useState } from 'react';
import ChatInterface from '../../components/ChatInterface';
import { createTask } from '../../services/api';
import { useToast } from '../../components/Toast';

export default function AdminChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionTasks, setSessionTasks] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const toast = useToast();

  const handleSend = async (message) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', content: message, timestamp }]);
    setLoading(true);

    try {
      const result = await createTask(message, sessionId);
      if (result.session_id) {
        setSessionId(result.session_id);
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      if (result.status === 'created') {
        setSessionTasks(prev => [...prev, result]);
        toast.success(`Task ${result.task_id} created successfully`);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message}\n\nPlease make sure the backend server is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      toast.error('Failed to process message');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setSessionTasks([]);
    setSessionId(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">Command Chat</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Issue natural language commands to the Admin Agent
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="xl:col-span-3 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-card h-[calc(100vh-220px)]">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSend}
            loading={loading}
            onClear={handleClear}
            botName="Admin Agent"
            botSubtitle="Task Manager"
            placeholder="e.g., Create a quiz about Machine Learning Chapter 3 with 20 MCQs..."
          />
        </div>

        {/* Sidebar — Task History */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-card p-5">
          <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
            Session Tasks
          </h3>
          {sessionTasks.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-8">
              No tasks created yet. Use the chat to issue commands.
            </p>
          ) : (
            <div className="space-y-3">
              {sessionTasks.map((task, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/50 animate-slide-up"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 font-mono">
                      {task.task_id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400">
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Example Commands */}
          <div className="mt-6 pt-4 border-t border-surface-200 dark:border-surface-800">
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-3 uppercase tracking-wider">
              Example Commands
            </p>
            <div className="space-y-2">
              {[
                'Create a quiz about Neural Networks with 10 MCQs',
                'Focus today with students on Module 5',
                'Generate a study guide for Chapter 3',
                'Create an assignment on Data Structures',
              ].map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(cmd)}
                  disabled={loading}
                  className="w-full text-left text-xs p-2.5 rounded-lg bg-surface-50 dark:bg-surface-800/50 text-surface-600 dark:text-surface-300 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all disabled:opacity-50"
                >
                  "{cmd}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
