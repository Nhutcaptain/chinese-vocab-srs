'use client';

import { useState, useEffect, Suspense } from 'react';
import { useVocab } from '@/lib/hooks/useVocab';
import { ChevronLeft, Shuffle, Volume2, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playChinese, unlockAudio, stopAudio } from '@/lib/utils/audio';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function FlashcardsContent() {
  const { vocab, loading, recordStudySession } = useVocab();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledVocab, setShuffledVocab] = useState<any[]>([]);
  const [showStart, setShowStart] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'vocab' | 'idiom'>('all');

  useEffect(() => {
    if (vocab.length > 0 && shuffledVocab.length === 0) {
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

      if (selectedType !== 'all') {
        filtered = filtered.filter(v => (v.type || 'vocab') === selectedType);
      }

      setShuffledVocab(filtered.sort(() => Math.random() - 0.5));
    }
  }, [vocab, filter, shuffledVocab.length, selectedType]);

  const startReview = () => {
    setShowStart(false);
    unlockAudio();
  };

  const handleNext = () => {
    if (shuffledVocab.length === 0) return;
    stopAudio();
    setIsFlipped(false);
    if (shuffledVocab[currentIndex]) {
      recordStudySession([shuffledVocab[currentIndex].id]);
    }
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledVocab.length);
    }, 150);
  };

  const handlePrev = () => {
    if (shuffledVocab.length === 0) return;
    stopAudio();
    setIsFlipped(false);
    if (shuffledVocab[currentIndex]) {
      recordStudySession([shuffledVocab[currentIndex].id]);
    }
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + shuffledVocab.length) % shuffledVocab.length);
    }, 150);
  };

  const handleShuffle = () => {
    stopAudio();
    setIsFlipped(false);
    setShuffledVocab([...shuffledVocab].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
  };

  if (loading) return null;

  if (vocab.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-2xl font-bold mb-4">Chưa có từ vựng nào!</h2>
        <Link href="/vocab" className="btn-primary">Thêm từ ngay</Link>
      </div>
    );
  }

  const currentItem = shuffledVocab[currentIndex];
  if (!currentItem) return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <h2 className="text-2xl font-bold mb-4">Không tìm thấy từ vựng phù hợp!</h2>
      <Link href="/" className="btn-primary">Quay lại</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto h-[100dvh] md:h-[80vh] flex flex-col pt-4 md:pt-8 px-4">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <Link href="/" className="p-2 hover:bg-slate-200 rounded-full transition dark:hover:bg-slate-800">
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </Link>
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-black tracking-tight">Flashcards</h1>
          <p className="text-slate-400 font-bold text-[10px] md:text-sm tracking-widest uppercase">{currentIndex + 1} / {shuffledVocab.length}</p>
        </div>
        <button onClick={handleShuffle} className="p-2 hover:bg-slate-200 rounded-full transition dark:hover:bg-slate-800">
          <Shuffle className="w-5 h-5 text-indigo-600" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showStart ? (
          <motion.div 
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <div className="glass p-8 md:p-12 rounded-3xl md:rounded-[3rem] shadow-2xl max-w-sm w-full mx-auto">
               <Volume2 className="w-16 h-16 md:w-20 md:h-20 text-indigo-600 mx-auto mb-6 md:mb-8 animate-pulse" />
               <h2 className="text-2xl md:text-3xl font-black mb-4">Sẵn sàng ôn tập?</h2>
               
               <div className="flex p-1 bg-slate-100 rounded-2xl mb-8 w-full border border-slate-200/50">
                 {[
                   { id: 'all', label: 'Tất cả' },
                   { id: 'vocab', label: 'Từ vựng' },
                   { id: 'idiom', label: 'Thành ngữ' }
                 ].map((tab) => (
                   <button
                     key={tab.id}
                     onClick={() => {
                       setSelectedType(tab.id as any);
                       setShuffledVocab([]); // Trigger re-filter
                     }}
                     className={cn(
                       "flex-1 py-3 rounded-xl text-xs font-black transition-all",
                       selectedType === tab.id 
                         ? "bg-white text-indigo-600 shadow-sm" 
                         : "text-slate-400 hover:text-slate-600"
                     )}
                   >
                     {tab.label}
                   </button>
                 ))}
               </div>

               <p className="text-slate-500 font-bold mb-8 md:mb-10 text-sm md:text-base leading-relaxed">Nhấn nút bên dưới để bắt đầu học.</p>
               <button 
                onClick={startReview}
                className="w-full py-4 md:py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg md:text-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-100"
               >
                 Bắt đầu ngay
               </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="review"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-12 w-full"
          >
            <div 
              className="relative w-full max-w-sm aspect-[3/4] cursor-pointer group perspective-2000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div 
                className="w-full h-full relative preserve-3d"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <div className="absolute inset-0 backface-hidden glass flex flex-col items-center justify-center p-6 md:p-12 rounded-3xl md:rounded-[3.5rem] shadow-2xl border border-white">
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4">
                    {currentItem.chinese.map((zh: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 group/item">
                        <span className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight">
                          {zh}{i < currentItem.chinese.length - 1 ? ',' : ''}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); playChinese(zh); }}
                          className="text-slate-300 hover:text-indigo-600 transition p-1.5 hover:bg-indigo-50 rounded-xl group-hover/item:text-slate-400"
                        >
                           <Volume2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <span className="text-xl md:text-2xl text-indigo-500 font-black mb-8 md:mb-10">
                    {Array.isArray(currentItem.pinyin) ? currentItem.pinyin.join(', ') : currentItem.pinyin}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); playChinese(currentItem.chinese.join(', ')); }}
                    className="p-3 md:p-4 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition duration-500"
                  >
                    <Volume2 className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                  <p className="absolute bottom-8 md:bottom-12 text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-60">Chạm để xem nghĩa</p>
                </div>

                <div 
                  className="absolute inset-0 backface-hidden glass flex flex-col items-center justify-center p-6 md:p-12 rounded-3xl md:rounded-[3.5rem] shadow-2xl rotate-y-180 bg-gradient-to-br from-indigo-50/50 to-rose-50/50 dark:from-indigo-950/50 dark:to-rose-950/50 border border-indigo-100"
                >
                  <div className="flex flex-col items-center gap-2 md:gap-4 text-center">
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                      {currentItem.vietnamese.map((vi: string, i: number) => (
                        <span key={i} className="text-2xl md:text-3xl font-black text-rose-600 leading-tight">
                          {vi}{i < currentItem.vietnamese.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                    <p className="text-indigo-500 font-bold text-sm md:text-base">
                      {Array.isArray(currentItem.pinyin) ? currentItem.pinyin.join(', ') : currentItem.pinyin}
                    </p>
                    <div className="mt-4 md:mt-8 flex flex-wrap justify-center gap-2 md:gap-3">
                       {currentItem.chinese.map((zh: string, i: number) => (
                         <div key={i} className="flex items-center gap-1 group/item-back">
                            <span className="px-2 py-0.5 md:px-3 md:py-1 bg-white/50 rounded-lg text-slate-400 font-bold text-[10px] md:text-sm">
                              {zh}
                            </span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); playChinese(zh); }}
                              className="text-slate-300 hover:text-indigo-600 transition p-1 hover:bg-white rounded-lg group-hover/item-back:text-slate-400"
                            >
                               <Volume2 className="w-3.5 h-3.5" />
                            </button>
                         </div>
                       ))}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); playChinese(currentItem.chinese.join(', ')); }}
                      className="mt-4 md:mt-6 p-2 md:p-3 bg-white/50 hover:bg-white rounded-xl transition text-indigo-600"
                    >
                      <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </div>
                  <p className="absolute bottom-8 md:bottom-12 text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-60">Chạm để lật lại</p>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center gap-6 md:gap-8">
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="p-4 md:p-5 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all text-slate-600 hover:text-indigo-600 border border-slate-100"
              >
                <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="p-4 md:p-5 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-200 hover:scale-110 active:scale-95 transition-all"
              >
                <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .perspective-2000 { perspective: 2000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}

export default function FlashcardsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}>
      <FlashcardsContent />
    </Suspense>
  );
}
