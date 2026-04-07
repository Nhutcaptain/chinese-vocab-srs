'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useVocab } from '@/lib/hooks/useVocab';
import { ChevronLeft, Timer, CheckCircle, XCircle, RotateCcw, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { playChinese, unlockAudio, stopAudio } from '@/lib/utils/audio';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function QuickReviewContent() {
  const { vocab, loading, recordStudySession } = useVocab();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');

  const [gameState, setGameState] = useState<'settings' | 'playing' | 'results'>('settings');
  const [wordCount, setWordCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [results, setResults] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startSession = () => {
    unlockAudio();
    let filtered = [...vocab];

    if (filter === 'today' || filter === 'yesterday') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfYesterday = startOfToday - (24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(v => {
        const lastActive = Math.max(v.createdAt, v.updatedAt || 0);
        if (filter === 'today') return lastActive >= startOfToday;
        return lastActive >= startOfYesterday && lastActive < startOfToday;
      });
    }

    const session = filtered.sort(() => Math.random() - 0.5).slice(0, wordCount);
    setCurrentSession(session);
    setGameState('playing');
    setTimeLeft(timeLimit);
    setCurrentIndex(0);
    setScore({ correct: 0, wrong: 0 });
    setUserInput('');
    setResults([]);
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('results');
      recordStudySession(currentSession.map(v => v.id));
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, timeLeft, currentSession, recordStudySession]);

  useEffect(() => {
    if (gameState === 'playing' && currentSession[currentIndex]) {
      playChinese(currentSession[currentIndex].chinese.join(', '));
    }
  }, [currentIndex, gameState, currentSession]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentWord = currentSession[currentIndex];
    
    const isCorrect = currentWord.vietnamese.some(
      (vi: string) => userInput.trim().toLowerCase() === vi.trim().toLowerCase()
    );

    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1)
    }));

    setResults(prev => [...prev, { 
      word: currentWord.chinese.join(', '), 
      input: userInput, 
      correct: isCorrect,
      correctMeanings: currentWord.vietnamese
    }]);

    if (currentIndex + 1 < currentSession.length) {
      stopAudio();
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
    } else {
      stopAudio();
      setGameState('results');
      recordStudySession(currentSession.map(v => v.id));
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-3xl mx-auto pb-10 md:pb-20 pt-4 md:pt-8 px-4">
      <div className="flex items-center gap-2 md:gap-4 mb-6 md:mb-8">
        <Link href="/" className="p-2 hover:bg-slate-200 rounded-full transition">
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </Link>
        <h1 className="text-xl md:text-2xl font-black">Nhập nghĩa nhanh</h1>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass p-6 md:p-12 rounded-3xl md:rounded-[2.5rem] shadow-xl"
          >
            <h2 className="text-3xl md:text-4xl font-black mb-8 md:mb-10 tracking-tight">Cài đặt phiên học</h2>
            <div className="space-y-6 md:space-y-8">
              <div>
                <label className="block text-xs md:text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest">Số lượng từ</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {[5, 10, 20, 50].map(n => (
                    <button 
                      key={n}
                      onClick={() => setWordCount(n)}
                      className={cn(
                        "py-3 md:py-4 rounded-xl md:rounded-2xl transition-all font-black text-lg md:text-xl border-2",
                        wordCount === n ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white border-slate-100 hover:border-indigo-200 text-slate-600"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest">Thời gian: {timeLimit}s</label>
                <input 
                  type="range" 
                  min="30" max="300" step="30" 
                  value={timeLimit}
                  onChange={e => setTimeLimit(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>
              <button 
                onClick={startSession}
                className="w-full py-4 md:py-6 bg-indigo-600 text-white rounded-2xl font-black text-xl md:text-2xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-indigo-200 mt-4 md:mt-8"
              >
                Bắt đầu học ngay
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center gap-10"
          >
            <div className="flex flex-col md:flex-row justify-between w-full glass p-4 md:p-6 rounded-2xl md:rounded-[2rem] gap-4">
              <div className="flex items-center justify-between md:justify-start gap-3">
                <div className="flex items-center gap-2">
                  <Timer className={cn("w-5 h-5 md:w-6 md:h-6", timeLeft < 10 ? "text-rose-500 animate-pulse" : "text-indigo-600")} />
                  <span className={cn("text-xl md:text-2xl font-black", timeLeft < 10 ? "text-rose-500" : "text-slate-800")}>{timeLeft}s</span>
                </div>
                <div className="md:hidden text-lg font-black text-slate-300">
                  <span className="text-indigo-600">{currentIndex + 1}</span> / {currentSession.length}
                </div>
              </div>
              <div className="hidden md:block text-xl font-black text-slate-300">
                <span className="text-indigo-600">{currentIndex + 1}</span> / {currentSession.length}
              </div>
              <div className="flex justify-between md:justify-end gap-4">
                <span className="text-emerald-500 font-black px-3 py-1 bg-emerald-50 rounded-full text-sm md:text-base">✓ {score.correct}</span>
                <span className="text-rose-500 font-black px-3 py-1 bg-rose-50 rounded-full text-sm md:text-base">✗ {score.wrong}</span>
              </div>
            </div>

            <div className="glass w-full p-8 md:p-20 rounded-3xl md:rounded-[3.5rem] text-center shadow-2xl relative overflow-hidden border border-white">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-50">
                <motion.div 
                  className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex) / currentSession.length) * 100}%` }}
                />
              </div>
              <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-4 items-center">
                {currentSession[currentIndex].chinese.map((zh: string, i: number) => (
                  <span key={i} className="text-6xl md:text-8xl font-black text-slate-800 tracking-tighter">
                    {zh}{i < currentSession[currentIndex].chinese.length - 1 ? ',' : ''}
                  </span>
                ))}
                <button 
                  onClick={() => playChinese(currentSession[currentIndex].chinese.join(', '))}
                  className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  <Volume2 className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </div>
              <p className="text-lg md:text-2xl text-indigo-500 font-black mb-8 md:mb-16 tracking-widest uppercase">{currentSession[currentIndex].pinyin}</p>

              <form onSubmit={handleSubmit} className="relative max-w-sm md:max-w-md mx-auto">
                <input 
                  autoFocus
                  placeholder="Nghĩa tiếng Việt..."
                  className="w-full text-center py-4 md:py-6 glass border-2 border-indigo-50 rounded-2xl md:rounded-3xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none text-xl md:text-3xl font-black transition-all placeholder:text-slate-300 shadow-inner"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                />
                <p className="hidden md:block text-slate-400 text-sm mt-6 font-bold uppercase tracking-widest opacity-60">Nhấn Enter để gửi</p>
              </form>
            </div>
          </motion.div>
        )}

        {gameState === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-12 rounded-[2.5rem] shadow-xl"
          >
            <h2 className="text-2xl md:text-4xl font-black mb-2 tracking-tight">Thống kê buổi học</h2>
            <p className="text-slate-400 mb-8 md:mb-10 font-bold text-xs md:text-sm uppercase tracking-widest">Bạn đã hoàn thành thử thách!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 md:p-8 rounded-2xl md:rounded-3xl text-center border border-emerald-100">
                <p className="text-[10px] md:text-xs font-black text-emerald-600 mb-1 uppercase tracking-wider">Đúng</p>
                <p className="text-3xl md:text-5xl font-black text-emerald-700">{score.correct}</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/30 p-5 md:p-8 rounded-2xl md:rounded-3xl text-center border border-rose-100">
                <p className="text-[10px] md:text-xs font-black text-rose-600 mb-1 uppercase tracking-wider">Sai</p>
                <p className="text-3xl md:text-5xl font-black text-rose-700">{score.wrong}</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-950/30 p-5 md:p-8 rounded-2xl md:rounded-3xl text-center border border-indigo-100">
                <p className="text-[10px] md:text-xs font-black text-indigo-600 mb-1 uppercase tracking-wider">Độ chính xác</p>
                <p className="text-3xl md:text-5xl font-black text-indigo-700">{currentSession.length > 0 ? Math.round((score.correct / currentSession.length) * 100) : 0}%</p>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 mb-10 pr-2 scrollbar-thin scrollbar-thumb-indigo-200">
              {results.map((res, i) => (
                <div key={i} className={cn(
                  "flex justify-between items-center p-5 rounded-2xl border-l-8 transition-all",
                  res.correct ? "bg-emerald-50/50 border-emerald-400" : "bg-rose-50/50 border-rose-400"
                )}>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      {res.correct ? <CheckCircle className="text-emerald-500 w-5 h-5" /> : <XCircle className="text-rose-500 w-5 h-5" />}
                      <span className="font-black text-xl text-slate-800">{res.word}</span>
                    </div>
                    <div className="mt-1 flex gap-2">
                       {res.correctMeanings.map((m: string, mi: number) => (
                         <span key={mi} className="text-xs font-bold text-slate-400 italic">
                           {m}{mi < res.correctMeanings.length - 1 ? ' • ' : ''}
                         </span>
                       ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn("font-black text-lg", res.correct ? "text-emerald-600" : "text-rose-600")}>
                      {res.input || '(Bỏ trống)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setGameState('settings')}
              className="w-full py-5 md:py-6 bg-indigo-600 text-white rounded-2xl md:rounded-3xl font-black text-xl md:text-2xl flex items-center justify-center gap-4 hover:bg-indigo-700 hover:scale-[1.01] active:scale-95 transition-all shadow-2xl shadow-indigo-100"
            >
              <RotateCcw className="w-6 h-6 md:w-8 md:h-8" /> Học lại ngay
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function QuickReviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}>
      <QuickReviewContent />
    </Suspense>
  );
}
