'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useVocab } from '@/lib/hooks/useVocab';
import { ChevronLeft, Timer, CheckCircle, XCircle, RotateCcw, ArrowRightLeft, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { playChinese, unlockAudio, stopAudio } from '@/lib/utils/audio';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type QuizDirection = 'zh-to-vi' | 'vi-to-zh';

function QuizContent() {
  const { vocab, loading, recordStudySession } = useVocab();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');

  const [gameState, setGameState] = useState<'settings' | 'playing' | 'results'>('settings');
  const [direction, setDirection] = useState<QuizDirection>('zh-to-vi');
  const [wordCount, setWordCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(15);
  const [timeLeft, setTimeLeft] = useState(15);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [results, setResults] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startSession = () => {
    unlockAudio();
    let filteredVocab = [...vocab];

    if (filter === 'today' || filter === 'yesterday') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfYesterday = startOfToday - (24 * 60 * 60 * 1000);
      
      filteredVocab = filteredVocab.filter(v => {
        const lastActive = Math.max(v.createdAt, v.updatedAt || 0);
        if (filter === 'today') return lastActive >= startOfToday;
        return lastActive >= startOfYesterday && lastActive < startOfToday;
      });
    }

    const shuffled = filteredVocab.sort(() => Math.random() - 0.5);
    const session = shuffled.slice(0, wordCount).map(item => {
      const otherVocab = vocab.filter(v => v.id !== item.id);
      
      const correctOption = direction === 'zh-to-vi' 
        ? item.vietnamese[Math.floor(Math.random() * item.vietnamese.length)] 
        : item.chinese[Math.floor(Math.random() * item.chinese.length)];

      const distractors = otherVocab
        .filter(v => {
          if (direction === 'zh-to-vi') {
            return !v.vietnamese.some(m => item.vietnamese.includes(m));
          } else {
            return !v.chinese.some(m => item.chinese.includes(m));
          }
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(v => direction === 'zh-to-vi' ? v.vietnamese[0] : v.chinese[0]);
      
      const options = [...distractors, correctOption].sort(() => Math.random() - 0.5);
      
      return { ...item, options, correctOption };
    });

    setCurrentSession(session);
    setGameState('playing');
    setTimeLeft(timeLimit);
    setCurrentIndex(0);
    setScore({ correct: 0, wrong: 0 });
    setResults([]);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !selectedOption) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !selectedOption) {
      handleOptionSelect('');
      recordStudySession(currentSession.map(v => v.id));
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, timeLeft, selectedOption, currentSession, recordStudySession]);

  useEffect(() => {
    if (gameState === 'playing' && direction === 'zh-to-vi' && currentSession[currentIndex]) {
      playChinese(currentSession[currentIndex].chinese.join(', '));
    }
  }, [currentIndex, gameState, direction, currentSession]);

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return;
    
    const currentWord = currentSession[currentIndex];
    const correct = option === currentWord.correctOption;
    
    setSelectedOption(option);
    setIsCorrect(correct);
    
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1)
    }));
    
    setResults(prev => [...prev, { 
      word: currentWord.chinese.join(', '), 
      selected: option, 
      correct,
      correctOption: currentWord.correctOption
    }]);

    setTimeout(() => {
      if (currentIndex + 1 < currentSession.length) {
        stopAudio();
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsCorrect(null);
        setTimeLeft(timeLimit);
      } else {
        stopAudio();
        setGameState('results');
        recordStudySession(currentSession.map(v => v.id));
      }
    }, 1200);
  };

  if (loading) return null;

  if (vocab.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
        <h2 className="text-3xl font-black mb-4">Cần ít nhất 4 từ để bắt đầu Quiz!</h2>
        <p className="text-slate-500 mb-8 max-w-md font-bold">Vui lòng thêm thêm từ vựng để hệ thống có thể tạo ra các đáp án gây nhiễu.</p>
        <Link href="/vocab" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-indigo-100 transition hover:scale-[1.02]">Thêm từ ngay</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-10 md:pb-20 pt-4 md:pt-8 px-4">
      <div className="flex items-center gap-2 md:gap-4 mb-6 md:mb-8">
        <Link href="/" className="p-2 hover:bg-slate-200 rounded-full transition">
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </Link>
        <h1 className="text-xl md:text-2xl font-black">Trắc nghiệm</h1>
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
                <label className="block text-xs md:text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest">Số lượng câu hỏi</label>
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
                <label className="block text-xs md:text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest">Hướng câu hỏi</label>
                <button 
                  onClick={() => setDirection(prev => prev === 'zh-to-vi' ? 'vi-to-zh' : 'zh-to-vi')}
                  className="w-full py-4 md:py-5 glass border-2 border-indigo-50 rounded-2xl flex items-center justify-center gap-4 font-black text-lg md:text-xl hover:border-indigo-200 transition-all text-slate-700"
                >
                  <span className={cn(direction === 'zh-to-vi' ? "text-indigo-600" : "text-slate-400")}>{direction === 'zh-to-vi' ? 'Trung' : 'Việt'}</span>
                  <ArrowRightLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-300" />
                  <span className={cn(direction === 'vi-to-zh' ? "text-indigo-600" : "text-slate-400")}>{direction === 'zh-to-vi' ? 'Việt' : 'Trung'}</span>
                </button>
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="space-y-6 md:space-y-10"
          >
            <div className="flex flex-col md:flex-row justify-between w-full glass p-4 md:p-6 rounded-2xl md:rounded-[2rem] gap-4">
              <div className="flex items-center justify-between md:justify-start gap-3">
                <div className="flex items-center gap-2">
                  <Timer className={cn("w-5 h-5 md:w-6 md:h-6", timeLeft < 5 ? "text-rose-500 animate-pulse" : "text-indigo-600")} />
                  <span className={cn("text-xl md:text-2xl font-black", timeLeft < 5 ? "text-rose-500" : "text-slate-800")}>{timeLeft}s</span>
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

            <div className="glass w-full p-8 md:p-14 rounded-3xl md:rounded-[3.5rem] text-center shadow-2xl relative overflow-hidden border border-white">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-50">
                <motion.div 
                  className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex) / currentSession.length) * 100}%` }}
                />
              </div>
              
              <div className="min-h-[140px] md:min-h-[180px] flex flex-col justify-center items-center">
                <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-4 items-center">
                  {currentSession[currentIndex].chinese.map((zh: string, i: number) => (
                    <span key={i} className={cn(
                      "font-black text-slate-800 tracking-tighter",
                      direction === 'zh-to-vi' ? "text-6xl md:text-8xl" : "text-3xl md:text-5xl"
                    )}>
                      {zh}{i < currentSession[currentIndex].chinese.length - 1 ? ',' : ''}
                    </span>
                  ))}
                  {direction === 'zh-to-vi' && (
                    <button 
                      onClick={() => playChinese(currentSession[currentIndex].chinese.join(', '))}
                      className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      <Volume2 className="w-5 h-5 md:w-8 md:h-8" />
                    </button>
                  )}
                </div>

                {direction === 'vi-to-zh' && (
                  <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                    {currentSession[currentIndex].vietnamese.map((vi: string, i: number) => (
                      <span key={i} className="text-3xl md:text-5xl font-black text-indigo-600">
                        {vi}{i < currentSession[currentIndex].vietnamese.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-lg md:text-2xl text-slate-400 font-bold mt-4 md:mt-6 tracking-widest uppercase">
                  {direction === 'zh-to-vi' ? currentSession[currentIndex].pinyin : 'Chọn chữ Hán đúng'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full">
              {currentSession[currentIndex].options.map((opt: any, i: number) => (
                <button
                  key={i}
                  disabled={selectedOption !== null}
                  onClick={() => handleOptionSelect(opt)}
                  className={cn(
                    "p-5 md:p-6 rounded-2xl md:rounded-3xl text-lg md:text-xl font-bold transition-all border-2 text-left flex justify-between items-center group",
                    selectedOption === opt
                      ? (isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-rose-50 border-rose-500 text-rose-700")
                      : "glass border-transparent hover:border-indigo-200 text-slate-700"
                  )}
                >
                  <span className="flex-1">
                    {direction === 'zh-to-vi' ? opt.vietnamese.join(', ') : opt.chinese.join(', ')}
                  </span>
                  {selectedOption === opt && (
                    isCorrect ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {gameState === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center"
          >
            <h2 className="text-2xl md:text-4xl font-black mb-2 tracking-tight">Thống kê buổi học</h2>
            <p className="text-slate-400 mb-8 md:mb-10 font-bold text-xs md:text-sm uppercase tracking-widest">Bạn đã hoàn thành thử thách!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
              <div className="bg-emerald-50 p-5 md:p-8 rounded-2xl md:rounded-3xl text-center border border-emerald-100">
                <p className="text-[10px] md:text-xs font-black text-emerald-600 mb-1 uppercase tracking-wider">Đúng</p>
                <p className="text-3xl md:text-5xl font-black text-emerald-700">{score.correct}</p>
              </div>
              <div className="bg-rose-50 p-5 md:p-8 rounded-2xl md:rounded-3xl text-center border border-rose-100">
                <p className="text-[10px] md:text-xs font-black text-rose-600 mb-1 uppercase tracking-wider">Sai</p>
                <p className="text-3xl md:text-5xl font-black text-rose-700">{score.wrong}</p>
              </div>
              <div className="bg-indigo-50 p-5 md:p-8 rounded-2xl md:rounded-3xl text-center border border-indigo-100">
                <p className="text-[10px] md:text-xs font-black text-indigo-600 mb-1 uppercase tracking-wider">Độ chính xác</p>
                <p className="text-3xl md:text-5xl font-black text-indigo-700">{currentSession.length > 0 ? Math.round((score.correct / currentSession.length) * 100) : 0}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-sm mx-auto">
              <button 
                onClick={() => setGameState('settings')}
                className="w-full py-5 md:py-6 bg-indigo-600 text-white rounded-2xl md:rounded-3xl font-black text-xl md:text-2xl flex items-center justify-center gap-4 hover:bg-indigo-700 hover:scale-[1.01] active:scale-95 transition-all shadow-2xl shadow-indigo-100"
              >
                <RotateCcw className="w-6 h-6 md:w-8 md:h-8" /> Học lại ngay
              </button>
              <Link 
                href="/"
                className="py-5 md:py-6 glass rounded-2xl md:rounded-3xl font-black text-xl text-center hover:bg-white hover:shadow-xl transition-all border border-slate-100"
              >
                Trang chủ
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}>
      <QuizContent />
    </Suspense>
  );
}
