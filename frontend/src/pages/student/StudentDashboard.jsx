import { MessageSquare, BrainCircuit, BookOpen, Sparkles, Lightbulb, FileEdit, RefreshCw, Bell, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getProjects, getAssignedQuizzes, getCompletedQuizzes } from '../../services/api';
import { useToast } from '../../components/Toast';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const list = await getProjects();
        if (list.length > 0) {
          let allQuizzes = [];
          let completedTaskIds = [];
          
          try {
             const res = await getCompletedQuizzes(user?.id);
             completedTaskIds = res.completed_tasks ? res.completed_tasks.map(ct => ct.task_id) : [];
          } catch (e) {
             console.error("Failed to fetch completed quizzes", e);
          }
          
          for (const project of list) {
            try {
              const projectQuizzes = await getAssignedQuizzes(project.project_id);
              if (projectQuizzes && projectQuizzes.length > 0) {
                 const enrichedQuizzes = projectQuizzes
                   .filter(q => !completedTaskIds.includes(q.task_id))
                   .map(q => ({...q, project_id: project.project_id}));
                 allQuizzes = [...allQuizzes, ...enrichedQuizzes];
              }
            } catch (err) {
              console.error(`Failed to load quizzes for ${project.project_id}:`, err);
            }
          }
          setAssignedQuizzes(allQuizzes);
        }
      } catch (err) {
        console.error('Failed to load projects/quizzes:', err);
      }
    };

    fetchQuizzes();
    const intervalId = setInterval(fetchQuizzes, 30000);
    return () => clearInterval(intervalId);
  }, [user?.id]);

  const STUDY_TIPS = [
    { icon: Lightbulb, iconColor: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/30', title: 'Ask Specific Questions', desc: 'The more specific your question, the better the AI can find relevant content.' },
    { icon: FileEdit, iconColor: 'text-primary-500', bgColor: 'bg-primary-50 dark:bg-primary-950/30', title: 'Quiz Regularly', desc: 'Take short quizzes after each study session to reinforce your learning.' },
    { icon: RefreshCw, iconColor: 'text-accent-500', bgColor: 'bg-accent-50 dark:bg-accent-950/30', title: 'Follow Instructor Guidance', desc: "The AI adapts to your instructor's active guidelines for focused studying." },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 lg:p-10 shadow-glow-lg">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-white/80" />
            <span className="text-white/70 text-sm font-medium">AI Learning Assistant</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-2 font-arabic">
            مرحباً بك في رائد
          </h1>
          <h2 className="text-xl text-white/90 font-semibold mb-2">
            Welcome to Raaed
          </h2>
          <p className="text-white/60 max-w-xl text-sm leading-relaxed">
            Your AI-powered study companion. Chat with me to explore course materials,
            get answers grounded in your lectures, or take interactive quizzes to test your knowledge.
          </p>
        </div>
      </div>

      {/* Notifications / Assigned Quizzes */}
      {assignedQuizzes.length > 0 && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border-2 border-accent-400 dark:border-accent-500 p-6 shadow-card animate-slide-up relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-accent-100 dark:bg-accent-900/50 flex items-center justify-center shrink-0">
                <Bell size={24} className="text-accent-500 animate-pulse-soft" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-1">
                  You have {assignedQuizzes.length} Assigned {assignedQuizzes.length === 1 ? 'Quiz' : 'Quizzes'}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Your instructor has assigned quizzes for you to complete. 
                  Check the latest topics to ensure you are up to date!
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/quiz')}
              className="shrink-0 w-full md:w-auto px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-semibold shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Go to Quizzes <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Chat Card */}
        <button
          onClick={() => navigate('/student/chat')}
          className="group text-left bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-7 shadow-card hover:shadow-card-hover transition-all duration-300 hover:border-primary-300 dark:hover:border-primary-700 hover:scale-[1.02]"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center mb-5 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors group-hover:scale-110 duration-300">
            <MessageSquare size={26} className="text-primary-500" />
          </div>
          <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
            Study Chat
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed mb-4">
            Ask questions about your course materials. I'll search through lecture content
            and provide accurate, grounded answers.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Course Q&A', 'Study Help', 'Explanations'].map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-surface-100 dark:bg-surface-800 text-surface-500">
                {tag}
              </span>
            ))}
          </div>
        </button>

        {/* Quiz Card */}
        <button
          onClick={() => navigate('/student/quiz')}
          className="group text-left bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-7 shadow-card hover:shadow-card-hover transition-all duration-300 hover:border-accent-300 dark:hover:border-accent-700 hover:scale-[1.02]"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent-50 dark:bg-accent-950/50 flex items-center justify-center mb-5 group-hover:bg-accent-100 dark:group-hover:bg-accent-900/50 transition-colors group-hover:scale-110 duration-300">
            <BrainCircuit size={26} className="text-accent-500" />
          </div>
          <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
            Take a Quiz
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed mb-4">
            Test your knowledge with AI-generated quizzes. Choose a topic and number of questions,
            then get instant feedback with explanations.
          </p>
          <div className="flex flex-wrap gap-2">
            {['MCQ', 'Instant Feedback', 'Score Tracking'].map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-surface-100 dark:bg-surface-800 text-surface-500">
                {tag}
              </span>
            ))}
          </div>
        </button>
      </div>

      {/* Tips Section */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-card">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-primary-500" />
          Study Tips
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {STUDY_TIPS.map((tip, i) => (
            <div key={i} className={`p-4 rounded-xl ${tip.bgColor}`}>
              <div className={`w-9 h-9 rounded-lg bg-white/60 dark:bg-white/10 flex items-center justify-center mb-3`}>
                <tip.icon size={18} className={tip.iconColor} />
              </div>
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-1">{tip.title}</p>
              <p className="text-xs text-surface-400 leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

