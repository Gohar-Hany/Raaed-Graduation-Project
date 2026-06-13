import { useState } from 'react';
import ChatInterface from '../../components/ChatInterface';
import { chatWithAgent, clearSession } from '../../services/api';
import { useToast } from '../../components/Toast';

export default function StudentChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [projectId] = useState('testproject1');
  const toast = useToast();

  const handleSend = async (message) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', content: message, timestamp }]);
    setLoading(true);

    try {
      const result = await chatWithAgent(projectId, message, sessionId);
      setSessionId(result.session_id);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}\n\nPlease make sure the backend server is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (sessionId) {
      try {
        await clearSession(sessionId);
      } catch {}
    }
    setMessages([]);
    setSessionId(null);
    toast.info('Chat cleared');
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
          Chat with <span className="text-gradient font-arabic">رائد</span>
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Ask me anything about your course materials
          {sessionId && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-100 dark:bg-surface-800 text-surface-400">
              Session: {sessionId.slice(0, 8)}...
            </span>
          )}
        </p>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-card h-[calc(100vh-220px)]">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSend}
          loading={loading}
          onClear={handleClear}
          botName="رائد"
          botSubtitle="Study Assistant • Online"
          placeholder="Ask about your course materials..."
        />
      </div>
    </div>
  );
}
