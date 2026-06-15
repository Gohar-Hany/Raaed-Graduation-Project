import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { generateQuiz, getProjects, getAssignedQuizzes, submitQuizResult, getCompletedQuizzes } from '../../services/api';
import { useToast } from '../../components/Toast';
import {
  BrainCircuit, Loader2, CheckCircle, XCircle, ArrowRight,
  RotateCcw, Trophy, Target, Clock, Sparkles, Lightbulb
} from 'lucide-react';

const STATES = { SETUP: 'setup', LOADING: 'loading', QUIZ: 'quiz', RESULTS: 'results' };

export default function StudentQuiz() {
  const [state, setState] = useState(STATES.SETUP);
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('testproject1');
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [animatedOffset, setAnimatedOffset] = useState(2 * Math.PI * 60);
  const { user } = useAuth();

  const [answers, setAnswers] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [quizScore, setQuizScore] = useState(null);
  const [quizTotal, setQuizTotal] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (state === STATES.RESULTS) {
      const correctCount = quizScore !== null ? quizScore : answers.filter(a => a.isCorrect).length;
      const totalCount = quizTotal !== null ? quizTotal : answers.length;
      const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
      const circumference = 2 * Math.PI * 60;
      const offset = circumference - (percentage / 100) * circumference;
      
      const timer = setTimeout(() => {
        setAnimatedOffset(offset);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // safe fallback
      setAnimatedOffset(2 * Math.PI * 60);
    }
  }, [state, quizScore, quizTotal, answers]);

  const [assignedQuizzes, setAssignedQuizzes] = useState([]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const list = await getProjects();
        setProjects(list);
        if (list.length > 0) {
          const hasTest = list.some(p => p.project_id === 'testproject1');
          setProjectId(hasTest ? 'testproject1' : list[0].project_id);
          
          let allQuizzes = [];
          
          let completedTasksMap = {};
          try {
             const res = await getCompletedQuizzes(user?.id);
             if (res.completed_tasks) {
               res.completed_tasks.forEach(ct => {
                 completedTasksMap[ct.task_id] = ct;
               });
             }
          } catch (e) {
             console.error("Failed to fetch completed quizzes", e);
          }
          
          for (const project of list) {
            try {
              const projectQuizzes = await getAssignedQuizzes(project.project_id);
              if (projectQuizzes && projectQuizzes.length > 0) {
                 const enrichedQuizzes = projectQuizzes
                   .map(q => {
                     const completedData = completedTasksMap[q.task_id];
                     return {
                       ...q, 
                       project_id: project.project_id,
                       isCompleted: !!completedData,
                       score: completedData?.score,
                       total: completedData?.total,
                       pastAnswers: completedData?.answers
                     };
                   })
                   .filter(q => q.topic && q.topic !== 'N/A' && q.quiz?.questions?.length > 0);
                 allQuizzes = [...allQuizzes, ...enrichedQuizzes];
              }
            } catch (err) {
              console.error(`Failed to load quizzes for ${project.project_id}:`, err);
            }
          }
          // Sort: Uncompleted first, then completed
          allQuizzes.sort((a, b) => (a.isCompleted === b.isCompleted) ? 0 : a.isCompleted ? 1 : -1);
          setAssignedQuizzes(allQuizzes);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    fetchQuizzes();
    
    const intervalId = setInterval(fetchQuizzes, 30000);
    return () => clearInterval(intervalId);
  }, [user?.id]);

  const startAssignedQuiz = (quizItem) => {
    setQuizData(quizItem.quiz);
    setTopic(quizItem.topic);
    setActiveTaskId(quizItem.task_id);
    
    if (quizItem.isCompleted) {
      if (quizItem.pastAnswers) {
        const pastAnswersObj = quizItem.pastAnswers;
        const pastAnswersArray = Object.keys(pastAnswersObj)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(k => pastAnswersObj[k]);
        setAnswers(pastAnswersArray);
      } else {
        setAnswers([]);
      }
      setQuizScore(quizItem.score);
      setQuizTotal(quizItem.total);
      setState(STATES.RESULTS);
    } else {
      setCurrentQuestion(0);
      setAnswers([]);
      setQuizScore(null);
      setQuizTotal(null);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setState(STATES.QUIZ);
    }
  };


  const startQuiz = async () => {
    if (!topic.trim()) {
      toast.warning('Please enter a topic');
      return;
    }
    setState(STATES.LOADING);
    try {
      const result = await generateQuiz(projectId, topic, numQuestions);
      setQuizData(result.quiz);
      setCurrentQuestion(0);
      setAnswers([]);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setState(STATES.QUIZ);
    } catch (err) {
      toast.error(`Failed to generate quiz: ${err.message}`);
      setState(STATES.SETUP);
    }
  };

  const handleAnswer = (optionKey) => {
    if (selectedAnswer) return;
    setSelectedAnswer(optionKey);
    setShowExplanation(true);
    const question = quizData.questions[currentQuestion];
    const correctAnsKey = question.correct_answer ? question.correct_answer.trim() : "";
    setAnswers(prev => [...prev, {
      question: question.question,
      selected: optionKey,
      selectedText: question.options[optionKey],
      correct: correctAnsKey,
      correctText: question.options[correctAnsKey],
      isCorrect: optionKey === correctAnsKey,
    }]);
  };

  const nextQuestion = async () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Calculate Score for both assigned and custom quizzes
      const score = answers.filter(a => a.isCorrect).length;
      setQuizScore(score);
      setQuizTotal(quizData.questions.length);

      if (activeTaskId) {
        try {
            await submitQuizResult({
              student_id: user?.id,
              task_id: activeTaskId,
              score: score,
              total: quizData.questions.length,
              answers: answers.reduce((acc, curr, index) => {
                 acc[index] = curr;
                 return acc;
              }, {})
            });
            setAssignedQuizzes(prev => {
              const updated = prev.map(q => 
                q.task_id === activeTaskId 
                  ? { ...q, isCompleted: true, score: score, total: quizData.questions.length }
                  : q
              );
              return updated.sort((a, b) => (a.isCompleted === b.isCompleted) ? 0 : a.isCompleted ? 1 : -1);
            });
          } catch (e) {
            toast.error("Failed to save quiz result");
          }
      }
      setState(STATES.RESULTS);
    }
  };

  const resetQuiz = () => {
    setState(STATES.SETUP);
    setQuizData(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setQuizScore(null);
    setQuizTotal(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setActiveTaskId(null);
    setTopic('');
    setAnimatedOffset(2 * Math.PI * 60);
  };

  const retryQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setQuizScore(null);
    setQuizTotal(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setState(STATES.QUIZ);
  };

  // ── SETUP SCREEN ──────────────────────────────────────────
  if (state === STATES.SETUP) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">Take a Quiz</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            AI-generated quizzes based on your course materials
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-8 shadow-card">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-glow mx-auto">
              <BrainCircuit size={30} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-center text-surface-900 dark:text-surface-100 mb-6">
              Configure Your Quiz
            </h2>

            <div className="space-y-5">
              {projects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    Course
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-surface-900 dark:text-surface-100"
                  >
                    {projects.map(p => (
                      <option key={p.project_id} value={p.project_id}>{p.project_id}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-surface-900 dark:text-surface-100"
                  placeholder="e.g., Neural Networks, Data Structures, Sorting Algorithms"
                  onKeyDown={(e) => e.key === 'Enter' && startQuiz()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Number of Questions
                </label>
                <div className="flex gap-2">
                  {[3, 5, 10, 15].map(n => (
                    <button
                      key={n}
                      onClick={() => setNumQuestions(n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        numQuestions === n
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startQuiz}
                className="w-full py-3.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-all hover:shadow-glow active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Generate Quiz
              </button>

              {assignedQuizzes.length > 0 && (
                <div className="mt-6 border-t border-surface-200 dark:border-surface-800 pt-6 animate-fade-in">
                  <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-1.5">
                    <BrainCircuit size={16} className="text-primary-500" />
                    Assigned Quizzes from Instructor
                  </h3>
                  <div className="space-y-2.5">
                    {assignedQuizzes.map((q, idx) => (
                      <button
                        key={q.task_id || idx}
                        onClick={() => startAssignedQuiz(q)}
                        className="w-full text-left p-3.5 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 dark:hover:border-primary-600 bg-surface-50 dark:bg-surface-800/40 hover:bg-primary-50/20 dark:hover:bg-primary-950/10 transition-all flex items-center justify-between group"
                      >
                        <div className="min-w-0 flex-1 pr-2 flex items-center gap-2">
                          {q.isCompleted && <CheckCircle size={16} className="text-green-500 shrink-0" />}
                          <div>
                            <p className={`text-sm font-semibold truncate ${q.isCompleted ? 'text-surface-500 dark:text-surface-400 line-through decoration-surface-300' : 'text-surface-900 dark:text-surface-100'}`}>
                              {q.topic}
                            </p>
                            <p className="text-xs text-surface-400 mt-0.5">
                              {q.quiz?.questions?.length || 5} Questions • Priority: {q.priority || 'High'}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          {q.isCompleted && q.score !== undefined && (
                            <span className="text-xs font-bold text-green-600 dark:text-green-400">
                              Score: {q.score}/{q.total}
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            q.isCompleted 
                              ? 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-surface-200' 
                              : 'bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 group-hover:bg-primary-600 group-hover:text-white'
                          }`}>
                            {q.isCompleted ? 'Review' : 'Take Quiz'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LOADING SCREEN ──────────────────────────────────────────
  if (state === STATES.LOADING) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-glow-lg animate-pulse-soft">
          <BrainCircuit size={36} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
          Generating Quiz...
        </h2>
        <p className="text-surface-400 text-sm mb-6">
          Our AI is searching course materials and creating questions on "{topic}"
        </p>
        <Loader2 size={28} className="animate-spin text-primary-500" />
      </div>
    );
  }

  // ── QUIZ SCREEN ────────────────────────────────────────────
  if (state === STATES.QUIZ && quizData) {
    const question = quizData.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
    const correctSoFar = answers.filter(a => a.isCorrect).length;

    return (
      <div className="animate-fade-in">
        <div className="max-w-3xl mx-auto">
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-surface-400 font-medium uppercase tracking-wider mb-1">
                {quizData.topic}
              </p>
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                Question {currentQuestion + 1} of {quizData.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-accent-500 font-medium">
                <Target size={16} />
                {correctSoFar}/{answers.length}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-surface-200 dark:bg-surface-800 rounded-full mb-8 overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question Card */}
          <div
            key={currentQuestion}
            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-8 shadow-card mb-6 animate-slide-up"
          >
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-6 leading-relaxed">
              {question.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {Object.entries(question.options).map(([key, value]) => {
                const isSelected = selectedAnswer === key;
                const isCorrect = key === question.correct_answer;
                const showResult = selectedAnswer !== null;

                let optionStyle = 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20';
                if (showResult) {
                  if (isCorrect) {
                    optionStyle = 'border-accent-500 bg-accent-50 dark:bg-accent-950/30';
                  } else if (isSelected && !isCorrect) {
                    optionStyle = 'border-danger-500 bg-danger-50 dark:bg-danger-950/30';
                  } else {
                    optionStyle = 'border-surface-200 dark:border-surface-800 opacity-50';
                  }
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleAnswer(key)}
                    disabled={selectedAnswer !== null}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-300 ${optionStyle} disabled:cursor-default`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      showResult && isCorrect ? 'bg-accent-500 text-white' :
                      showResult && isSelected && !isCorrect ? 'bg-danger-500 text-white' :
                      'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300'
                    }`}>
                      {showResult && isCorrect ? <CheckCircle size={18} /> :
                       showResult && isSelected && !isCorrect ? <XCircle size={18} /> :
                       key}
                    </span>
                    <span className={`text-sm font-medium ${
                      showResult && isCorrect ? 'text-accent-700 dark:text-accent-300' :
                      showResult && isSelected && !isCorrect ? 'text-danger-700 dark:text-danger-300' :
                      'text-surface-700 dark:text-surface-300'
                    }`}>
                      {value}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="mt-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 animate-slide-up">
                <p className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-1 flex items-center gap-1.5">
                  <Lightbulb size={14} />
                  Explanation
                </p>
                <p className="text-sm text-primary-600/80 dark:text-primary-400/80 leading-relaxed">
                  {question.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Next Button */}
          {selectedAnswer && (
            <div className="flex justify-end animate-fade-in">
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-all hover:shadow-glow active:scale-95"
              >
                {currentQuestion < quizData.questions.length - 1 ? (
                  <>Next Question <ArrowRight size={16} /></>
                ) : (
                  <>View Results <Trophy size={16} /></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RESULTS SCREEN ──────────────────────────────────────────
  if (state === STATES.RESULTS) {
    const correctCount = quizScore !== null ? quizScore : answers.filter(a => a.isCorrect).length;
    const totalCount = quizTotal !== null ? quizTotal : answers.length;
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const circumference = 2 * Math.PI * 60;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let gradeColor = 'text-danger-500';
    let gradeBg = 'from-danger-500 to-red-600';
    let gradeMessage = 'Keep practicing! Review the material and try again.';
    if (percentage >= 80) {
      gradeColor = 'text-accent-500';
      gradeBg = 'from-accent-500 to-emerald-600';
      gradeMessage = 'Excellent work! You have a strong understanding of this topic.';
    } else if (percentage >= 60) {
      gradeColor = 'text-warning-500';
      gradeBg = 'from-warning-500 to-amber-600';
      gradeMessage = 'Good effort! Review the questions you missed to improve.';
    }

    return (
      <div className="animate-fade-in">
        <div className="max-w-3xl mx-auto">
          {/* Score Card */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-8 shadow-card text-center mb-6">
            <div className="relative flex items-center justify-center mb-6">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="60" fill="none" stroke="currentColor" strokeWidth="8"
                  className="text-surface-200 dark:text-surface-800" />
                <circle cx="70" cy="70" r="60" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
                  className={gradeColor}
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: animatedOffset,
                    transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </svg>
              <div className="absolute">
                <p className={`text-4xl font-extrabold ${gradeColor}`}>{percentage}%</p>
                <p className="text-xs text-surface-400 mt-0.5">Score</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy size={20} className={gradeColor} />
              <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                {correctCount} / {totalCount} Correct
              </h2>
            </div>
            <p className="text-sm text-surface-400 max-w-md mx-auto">{gradeMessage}</p>

            <div className="flex items-center justify-center gap-3 mt-6">
              {!activeTaskId && (
                <button
                  onClick={retryQuiz}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
                >
                  <RotateCcw size={16} />
                  Retry Quiz
                </button>
              )}
              <button
                onClick={resetQuiz}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-all hover:shadow-glow"
              >
                <BrainCircuit size={16} />
                {activeTaskId ? 'Back to Setup' : 'New Quiz'}
              </button>
            </div>
          </div>

          {/* Answer Review */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-card">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Review Answers
            </h3>
            <div className="space-y-3">
              {answers.map((a, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border ${
                    a.isCorrect
                      ? 'border-accent-200 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-950/20'
                      : 'border-danger-200 dark:border-danger-800 bg-danger-50/50 dark:bg-danger-950/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      a.isCorrect ? 'bg-accent-500 text-white' : 'bg-danger-500 text-white'
                    }`}>
                      {a.isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100 mb-1">
                        {i + 1}. {a.question}
                      </p>
                      {!a.isCorrect ? (
                        <p className="text-xs text-surface-400 mt-2">
                          Your answer: <span className="text-danger-500 font-medium bg-danger-50 dark:bg-danger-900/30 px-2 py-0.5 rounded">{a.selectedText || a.selected}</span>
                          <br className="my-1"/>
                          Correct answer: <span className="text-accent-500 font-medium bg-accent-50 dark:bg-accent-900/30 px-2 py-0.5 rounded">{a.correctText || a.correct}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-surface-400 mt-2">
                          Correct answer: <span className="text-accent-500 font-medium bg-accent-50 dark:bg-accent-900/30 px-2 py-0.5 rounded">{a.correctText || a.correct}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
