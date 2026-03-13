import React, { useState } from 'react';
import { quizService, QuizQuestion, QuizSubmitResponse } from '../services/api';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizPanelProps {
  topic: string;
  onClose: () => void;
}

const QuizPanel: React.FC<QuizPanelProps> = ({ topic, onClose }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await quizService.getQuiz(topic);
        setQuestions(data.questions);
      } catch (error) {
        console.error('Failed to fetch quiz:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [topic]);

  const handleOptionSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setSubmitting(true);
      try {
        const res = await quizService.submitQuiz({
          topic,
          answers,
          questions: questions.map(q => ({ answerIndex: q.answerIndex })),
        });
        setResult(res);
      } catch (error) {
        console.error('Failed to submit quiz:', error);
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-xl">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Generating your quiz on {topic}...</p>
      </div>
    );
  }

  if (result) {
    const percentage = Math.round((result.score / result.total) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center"
      >
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 text-indigo-600">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Quiz Complete!</h2>
        <p className="text-slate-500 mb-8">You scored {result.score} out of {result.total}</p>
        
        <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-8">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-0 left-0 h-full bg-indigo-600"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            Back to Chat
          </button>
          <button
            onClick={() => {
              setResult(null);
              setCurrentStep(0);
              setAnswers([]);
            }}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 bg-white rounded-3xl border border-slate-200 shadow-xl"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Question {currentStep + 1} of {questions.length}</span>
          <h3 className="text-lg font-bold text-slate-900">Topic: {topic}</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <XCircle size={24} />
        </button>
      </div>

      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-8">
        <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="mb-8">
        <p className="text-xl font-medium text-slate-800 leading-relaxed">
          {currentQuestion.question}
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionSelect(index)}
            className={`w-full text-left px-6 py-4 rounded-2xl border-2 transition-all ${
              answers[currentStep] === index
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 bg-white text-slate-600'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className={`w-8 h-8 flex items-center justify-center rounded-full border text-sm font-bold ${
                answers[currentStep] === index ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}>
                {String.fromCharCode(65 + index)}
              </span>
              {option}
            </div>
          </button>
        ))}
      </div>

      <button
        disabled={answers[currentStep] === undefined || submitting}
        onClick={handleNext}
        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <>
            {currentStep === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
            <ArrowRight size={20} />
          </>
        )}
      </button>
    </motion.div>
  );
};

export default QuizPanel;
