import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatInterface from '../../components/ChatInterface';
import { chatWithAgent, clearSession, getProjects, getActiveGuidelines } from '../../services/api';
import { useToast } from '../../components/Toast';

export default function StudentChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('testproject1');
  const toast = useToast();
  const navigate = useNavigate();

  const fetchGuidance = async (projId) => {
    if (!projId) return;
    try {
      const guidelines = await getActiveGuidelines(projId);
      if (guidelines && guidelines.length > 0) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let welcomeText = "أهلاً بك! يوجهنا المعلم اليوم للتركيز على المواضيع التالية:\nWelcome! Today, our focus is on the following topics:\n\n";
        
        let hasQuiz = false;
        guidelines.forEach(g => {
          // Clean up the description just in case it contains internal system prompt artifacts
          const cleanDesc = g.description.replace(/Create a quiz|Generate a quiz|Focus on/gi, '').trim();
          
          if (g.task_type.toLowerCase() === 'quiz') {
            welcomeText += `• كويز مطلوب (Assigned Quiz): ${cleanDesc}\n\n`;
            hasQuiz = true;
          } else {
            welcomeText += `• تركيز (Focus Topic): ${cleanDesc}\n\n`;
          }
        });
        
        welcomeText += "كيف يمكنني مساعدتك اليوم؟\nHow can I help you today?";
        
        const welcomeMessage = {
          role: 'assistant',
          content: welcomeText,
          timestamp
        };
        
        if (hasQuiz) {
          welcomeMessage.action = {
             label: 'الذهاب إلى صفحة الكويز (Take Quiz)',
             onClick: () => navigate('/student/quiz')
          };
        }
        
        setMessages([welcomeMessage]);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load active guidelines:', err);
      setMessages([]);
    }
  };

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const list = await getProjects();
        setProjects(list);
        if (list.length > 0) {
          const hasTest = list.some(p => p.project_id === 'testproject1');
          const selectedId = hasTest ? 'testproject1' : list[0].project_id;
          setProjectId(selectedId);
          fetchGuidance(selectedId);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    loadProjects();
  }, []);

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

  const handleClear = async (targetProjId) => {
    if (sessionId) {
      try {
        await clearSession(sessionId);
      } catch {}
    }
    setSessionId(null);
    toast.info('Chat cleared');
    fetchGuidance(targetProjId || projectId);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
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
        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-surface-600 dark:text-surface-400">Course:</span>
            <select
              value={projectId}
              onChange={(e) => {
                const newProjId = e.target.value;
                setProjectId(newProjId);
                handleClear(newProjId);
              }}
              className="px-3 py-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-surface-900 dark:text-surface-100 outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              {projects.map(p => (
                <option key={p.project_id} value={p.project_id}>{p.project_id}</option>
              ))}
            </select>
          </div>
        )}
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
