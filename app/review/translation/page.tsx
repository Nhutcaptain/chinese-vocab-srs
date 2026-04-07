'use client';

import { useState, Suspense, useEffect } from 'react';
import { useVocab } from '@/lib/hooks/useVocab';
import { useUser } from '@/lib/contexts/UserContext';
import { ChevronLeft, Send, CheckCircle2, XCircle, RotateCcw, Sparkles, BookOpen, Languages, Volume2, Info, ArrowRightCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getDiff, DiffPart } from '@/lib/utils';
import { playChinese, unlockAudio, stopAudio } from '@/lib/utils/audio';
import Link from 'next/link';

type GameState = 'settings' | 'practice' | 'results';
type Exercise = {
  vietnamese: string;
  chinese: string;
  pinyin: string;
  explanation: string;
};

function TranslationContent() {
  const { username } = useUser();
  const { recordStudySession } = useVocab();

  const [gameState, setGameState] = useState<GameState>('settings');
  const [mode, setMode] = useState<'topic' | 'recent'>('topic');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [score, setScore] = useState(0);

  const startPractice = async () => {
    if (mode === 'topic' && !topic.trim()) {
      alert("Vui lòng nhập chủ đề!");
      return;
    }

    setLoading(true);
    unlockAudio();
    try {
      const res = await fetch('/api/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, mode, topic, count }),
      });

      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setExercises(data);
      setGameState('practice');
      setCurrentIndex(0);
      setHistory([]);
      setScore(0);
    } catch (e) {
      console.error(e);
      alert("Có lỗi xảy ra khi tạo bài tập. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    if (!userInput.trim()) return;
    
    setIsChecking(true);
    try {
      const res = await fetch('/api/evaluate-translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vietnamese: exercises[currentIndex].vietnamese, 
          userInput: userInput.trim() 
        }),
      });

      if (!res.ok) throw new Error("Evaluation failed");
      const evaluation = await res.json();
      
      setCurrentEvaluation(evaluation);
      setIsChecked(true);
      
      if (evaluation.isCorrect) {
        setScore(s => s + 1);
      }
    } catch (e) {
      console.error(e);
      alert("Không thể đánh giá bài làm lúc này. Vui lòng thử lại!");
    } finally {
      setIsChecking(false);
    }
  };

  const nextQuestion = () => {
    const current = exercises[currentIndex];
    setHistory([...history, { 
      ...current, 
      userInput, 
      evaluation: currentEvaluation 
    }]);

    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setIsChecked(false);
      setCurrentEvaluation(null);
      stopAudio();
    } else {
      setGameState('results');
    }
  };

  const renderDiff = (diff: DiffPart[]) => {
    return (
      <div className="flex flex-wrap gap-0.5 text-2xl md:text-3xl font-bold tracking-tight">
        {diff.map((part, i) => (
          <span 
            key={i} 
            className={cn(
              part.type === 'added' && "text-emerald-500 bg-emerald-50 px-0.5 rounded",
              part.type === 'removed' && "text-rose-500 bg-rose-50 px-0.5 rounded line-through opacity-50",
              part.type === 'equal' && "text-slate-800"
            )}
          >
            {part.value}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto pb-10 md:pb-20 pt-4 md:pt-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="p-2 hover:bg-slate-200 rounded-full transition">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-black">Luyện dịch AI</h1>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass p-8 md:p-12 rounded-[2.5rem] shadow-2xl space-y-10"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Languages className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Cấu hình bài tập</h2>
              <p className="text-slate-400 font-medium text-sm max-w-sm mx-auto">AI sẽ tạo câu hỏi dựa trên yêu cầu của bạn. Hãy chọn nguồn câu hỏi bên dưới.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => setMode('topic')}
                className={cn(
                  "p-6 rounded-2xl border-4 cursor-pointer transition-all space-y-3",
                  mode === 'topic' ? "bg-indigo-50 border-indigo-500 shadow-lg" : "bg-white border-slate-50 hover:border-slate-200"
                )}
              >
                <Sparkles className={cn("w-6 h-6", mode === 'topic' ? "text-indigo-600" : "text-slate-300")} />
                <h3 className="text-lg font-black">Theo chủ đề</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Nhập bất kỳ chủ đề nào (văn phòng, du lịch, hẹn hò...)</p>
              </div>

              <div 
                onClick={() => setMode('recent')}
                className={cn(
                  "p-6 rounded-2xl border-4 cursor-pointer transition-all space-y-3",
                  mode === 'recent' ? "bg-indigo-50 border-indigo-500 shadow-lg" : "bg-white border-slate-50 hover:border-slate-200"
                )}
              >
                <BookOpen className={cn("w-6 h-6", mode === 'recent' ? "text-indigo-600" : "text-slate-300")} />
                <h3 className="text-lg font-black">Từ vựng mới</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Sử dụng các từ vựng bạn đã thêm trong 3 ngày qua.</p>
              </div>
            </div>

            <div className="space-y-6">
              {mode === 'topic' && (
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Chủ đề của bạn</label>
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ví dụ: Phỏng vấn xin việc, Đi ăn nhà hàng..."
                    className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:border-indigo-500 outline-none transition-all font-bold text-lg"
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Số lượng câu</label>
                <div className="grid grid-cols-4 gap-4">
                  {[5, 10, 15, 20].map(n => (
                    <button 
                      key={n}
                      onClick={() => setCount(n)}
                      className={cn(
                        "py-4 rounded-2xl font-black text-xl transition-all border-2",
                        count === n ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white border-slate-100 hover:border-indigo-200"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              disabled={loading}
              onClick={startPractice}
              className={cn(
                "w-full py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black text-2xl shadow-2xl shadow-indigo-200 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? "Đang tạo bài tập..." : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Bắt đầu luyện tập
                </>
              )}
            </button>
          </motion.div>
        )}

        {gameState === 'practice' && exercises.length > 0 && (
          <motion.div 
            key="practice"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* Progress Header */}
            <div className="flex flex-col md:flex-row justify-between w-full glass p-6 rounded-[2rem] gap-4 relative overflow-hidden">
               <div className="absolute top-0 left-0 h-1 bg-indigo-600 shadow-lg" style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }} />
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xl">
                    {currentIndex + 1}
                 </div>
                 <div>
                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Tiến độ</h4>
                    <p className="text-slate-400 font-bold ml-0.5">{currentIndex + 1} / {exercises.length}</p>
                 </div>
               </div>
               <div className="flex items-center gap-8 pr-4">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-emerald-500 uppercase">Đúng</p>
                    <p className="text-xl font-black">{score}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase">Còn lại</p>
                    <p className="text-xl font-black text-slate-300">{exercises.length - currentIndex}</p>
                  </div>
               </div>
            </div>

            {/* Question Card */}
            <div className="glass p-8 md:p-12 rounded-3xl shadow-xl space-y-6 relative border-2 border-white">
              <div className="space-y-2">
                <p className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
                  {exercises[currentIndex].vietnamese}
                </p>
              </div>

              <div className="space-y-4">
                <textarea 
                  disabled={isChecked}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Nhập đáp án tiếng Trung của bạn..."
                  className={cn(
                    "w-full h-28 px-6 py-5 rounded-2xl text-xl font-bold bg-slate-50 border-4 outline-none transition-all resize-none",
                    !isChecked ? "border-slate-100 focus:border-indigo-300 focus:bg-white" : "",
                    isChecked && userInput.trim() === exercises[currentIndex].chinese ? "border-emerald-500 bg-emerald-50" : "",
                    isChecked && userInput.trim() !== exercises[currentIndex].chinese ? "border-rose-500 bg-rose-50" : ""
                  )}
                />

                {!isChecked ? (
                  <button 
                    onClick={handleCheck}
                    disabled={!userInput.trim() || isChecking}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-black active:scale-95 transition-all shadow-xl disabled:opacity-30"
                  >
                    {isChecking ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang chấm điểm...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Kiểm tra đáp án
                      </>
                    )}
                  </button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Correct Answer Column (Always Visible) */}
                      <div className="p-5 bg-emerald-50/50 rounded-2xl border-2 border-emerald-100 space-y-2 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Đáp án gợi ý</p>
                        </div>
                        <div className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                          {currentEvaluation?.suggested || exercises[currentIndex].chinese}
                        </div>
                        <div className="flex items-center gap-2 text-emerald-700/70 font-bold text-xs">
                           <Volume2 className="w-3.5 h-3.5" />
                           <span>{currentEvaluation?.pinyin || exercises[currentIndex].pinyin}</span>
                           <button 
                            onClick={() => playChinese(currentEvaluation?.suggested || exercises[currentIndex].chinese)} 
                            className="ml-auto p-1 bg-white rounded-lg hover:bg-emerald-100 transition shadow-sm"
                           >
                              <Volume2 className="w-4 h-4 text-emerald-600" />
                           </button>
                        </div>
                      </div>

                      {/* User Input Column */}
                      <div className={cn(
                        "p-5 rounded-2xl border-2 space-y-2 relative overflow-hidden",
                        currentEvaluation?.score >= 80 ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"
                      )}>
                        <div className="flex items-center justify-between mb-1">
                           <div className="flex items-center gap-2">
                             {currentEvaluation?.score >= 80 
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                              : <XCircle className="w-4 h-4 text-rose-500" />
                             }
                             <p className={cn(
                               "text-[10px] font-black uppercase tracking-widest",
                               currentEvaluation?.score >= 80 ? "text-emerald-600" : "text-rose-600"
                             )}>Bài làm của bạn</p>
                           </div>
                           <div className={cn(
                             "px-2 py-0.5 rounded-full text-[10px] font-black",
                             currentEvaluation?.score >= 80 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                           )}>
                             {currentEvaluation?.score}%
                           </div>
                        </div>
                        <div className="min-h-[2.5rem] flex items-center">
                          {currentEvaluation?.score >= 80 ? (
                            <span className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{userInput}</span>
                          ) : (
                            renderDiff(getDiff(userInput.trim(), currentEvaluation?.suggested || ''))
                          )}
                        </div>
                        {currentEvaluation?.score >= 80 && (
                          <button 
                            onClick={() => playChinese(userInput)} 
                            className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1 mt-1"
                          >
                             <Volume2 className="w-3 h-3" /> Nghe bài của bạn
                          </button>
                        )}
                      </div>
                    </div>

                    {/* AI Feedback & Explanation */}
                    <div className="p-6 bg-white rounded-2xl border-2 border-slate-100 shadow-xl shadow-slate-100/50 space-y-4">
                      <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                         <div className="p-2 bg-amber-100 rounded-lg">
                            <Info className="w-4 h-4 text-amber-600" />
                         </div>
                         <div>
                            <h5 className="font-black text-slate-800 text-sm">AI Nhận xét & Ngữ pháp</h5>
                         </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-600 italic leading-relaxed">
                          "{currentEvaluation?.feedback}"
                        </div>
                        
                        <div className="text-slate-700 leading-relaxed font-medium text-sm md:text-base whitespace-pre-line">
                          {currentEvaluation?.grammarAnalysis}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={nextQuestion}
                      className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-4 transition-all hover:bg-indigo-700 hover:scale-[1.02]"
                    >
                      {currentIndex + 1 === exercises.length ? "Xem kết quả" : "Câu tiếp theo"}
                      <ArrowRightCircle className="w-6 h-6" />
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 md:p-12 rounded-3xl shadow-2xl text-center space-y-10 overflow-hidden relative"
          >
            {/* Confetti-like decor */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-500/10 blur-3xl rounded-full" />

            <div className="space-y-4">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-4xl font-black">Xong bài dịch!</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Thống kê phiên học của bạn</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="glass-white p-8 rounded-3xl border-b-4 border-emerald-500">
                <p className="text-4xl font-black text-emerald-600">{score}</p>
                <p className="text-xs font-black text-slate-400 uppercase mt-1">Chính xác</p>
              </div>
              <div className="glass-white p-8 rounded-3xl border-b-4 border-rose-500">
                <p className="text-4xl font-black text-rose-600">{exercises.length - score}</p>
                <p className="text-xs font-black text-slate-400 uppercase mt-1">Cần xem lại</p>
              </div>
              <div className="glass-white p-8 rounded-3xl border-b-4 border-indigo-500">
                <p className="text-4xl font-black text-indigo-600">{Math.round((score / exercises.length) * 100)}%</p>
                <p className="text-xs font-black text-slate-400 uppercase mt-1">Tổng điểm</p>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <button 
                onClick={() => setGameState('settings')}
                className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-4 transition-all hover:bg-indigo-700 hover:scale-[1.02] shadow-xl shadow-indigo-100"
              >
                <RotateCcw className="w-6 h-6" /> Luyện tập tiếp
              </button>
              <Link 
                href="/"
                className="block w-full py-6 glass rounded-2xl font-black text-xl transition-all hover:bg-white border-2 border-slate-50"
              >
                Quay lại trang chủ
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TranslationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}>
      <TranslationContent />
    </Suspense>
  );
}
