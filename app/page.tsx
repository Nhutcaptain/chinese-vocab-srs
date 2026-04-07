'use client';

import { useVocab } from '@/lib/hooks/useVocab';
import { BookOpen, Zap, Trophy, Settings, Plus, Sparkles, LayoutGrid, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Home() {
  const { vocab, loading, streak } = useVocab();

  const menuItems = [
    {
      title: "Quản lý từ vựng",
      description: "Xem, thêm, sửa, xóa danh sách từ",
      icon: LayoutGrid,
      href: "/vocab",
      color: "from-rose-500 to-pink-600",
      accent: "bg-rose-500/10 text-rose-600"
    },
    {
      title: "Flashcards",
      description: "Ghi nhớ từ vựng qua thẻ lật 3D",
      icon: BookOpen,
      href: "/review/flashcards",
      color: "from-blue-500 to-indigo-600",
      accent: "bg-blue-500/10 text-blue-600"
    },
    {
      title: "Nhập nghĩa nhanh",
      description: "Thử thách gõ nghĩa nhanh dưới áp lực",
      icon: Zap,
      href: "/review/quick",
      color: "from-amber-400 to-orange-600",
      accent: "bg-amber-500/10 text-amber-600"
    },
    {
      title: "Trắc nghiệm",
      description: "Chọn đáp án đúng từ danh sách",
      icon: Trophy,
      href: "/review/quiz",
      color: "from-emerald-400 to-teal-700",
      accent: "bg-emerald-500/10 text-emerald-600"
    }
  ];

  const getFilteredCounts = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - (24 * 60 * 60 * 1000);

    const todayWords = vocab.filter(v => {
      const lastActive = Math.max(v.createdAt, v.updatedAt || 0);
      return lastActive >= startOfToday;
    }).length;

    const yesterdayWords = vocab.filter(v => {
      const lastActive = Math.max(v.createdAt, v.updatedAt || 0);
      return lastActive >= startOfYesterday && lastActive < startOfToday;
    }).length;

    return { todayWords, yesterdayWords };
  };

  const { todayWords, yesterdayWords } = getFilteredCounts();

  return (
    <div className="max-w-6xl mx-auto pt-16 md:pt-20 pb-12 px-4 selection:bg-indigo-100">
      {/* Hero Section */}
      <div className="mb-16 md:mb-24 text-center relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-500/20 blur-[80px] -z-10 rounded-full"
        />
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl md:text-8xl font-black mb-8 py-2 leading-tight tracking-tight bg-clip-text text-transparent bg-[linear-gradient(135deg,#6366f1,#ec4899)]"
        >
          Hán Ngữ SRS Cho Yuxin
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto dark:text-slate-400"
        >
          Làm chủ tiếng Trung mỗi ngày với phương pháp lặp lại ngắt quãng và các bài tập tương tác sinh động.
        </motion.p>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div
          whileHover={{ y: -5 }}
          className="glass p-8 rounded-[2.5rem] flex items-center justify-between group overflow-hidden relative"
        >
          <div className="relative z-10">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Tổng từ vựng</p>
            <p className="text-5xl font-black text-indigo-600">{loading ? '...' : vocab.length}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 relative z-10 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
            <BookOpen className="w-8 h-8" />
          </div>
          <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors" />
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="glass p-8 rounded-[2.5rem] flex items-center justify-between group overflow-hidden relative"
        >
          <div className="relative z-10">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Trình độ</p>
            <p className="text-5xl font-black text-rose-500">HSK 4+</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 relative z-10 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-500">
            <Trophy className="w-8 h-8" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="glass p-8 rounded-[2.5rem] flex items-center justify-between group overflow-hidden relative"
        >
          <div className="relative z-10">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Chuỗi ngày học</p>
            <p className="text-5xl font-black text-amber-500">{loading ? '...' : streak}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 relative z-10 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-500">
            <Zap className="w-8 h-8" />
          </div>
        </motion.div>
      </div>

      {/* Quick Practice Section */}
      <div className="mb-12 md:mb-16">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="h-6 md:h-8 w-2 bg-indigo-600 rounded-full" />
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Ôn tập nhanh</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href={`/review/flashcards?filter=today`} className={cn("block group", todayWords === 0 && "pointer-events-none opacity-60")}>
            <div className="glass p-8 rounded-[2.5rem] flex items-center justify-between border-2 border-transparent hover:border-indigo-200 transition-all shadow-lg hover:shadow-2xl">
              <div>
                <h4 className="text-xl font-black mb-1">Đã học hôm nay</h4>
                <p className="text-slate-400 font-bold">{todayWords} từ cần ôn lại</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-inner">
                <ChevronLeft className="w-8 h-8 rotate-180" />
              </div>
            </div>
          </Link>
          <Link href={`/review/flashcards?filter=yesterday`} className={cn("block group", yesterdayWords === 0 && "pointer-events-none opacity-60")}>
            <div className="glass p-8 rounded-[2.5rem] flex items-center justify-between border-2 border-transparent hover:border-rose-200 transition-all shadow-lg hover:shadow-2xl">
              <div>
                <h4 className="text-xl font-black mb-1">Đã học hôm qua</h4>
                <p className="text-slate-400 font-bold">{yesterdayWords} từ cần ôn lại</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors shadow-inner">
                <ChevronLeft className="w-8 h-8 rotate-180" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {menuItems.map((item, index) => (
          <Link key={index} href={item.href}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer"
            >
              <div className="glass h-full p-8 rounded-[3rem] relative overflow-hidden flex flex-col justify-between hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-indigo-100">
                <div className="flex justify-between items-start mb-12 relative z-10">
                  <div className={cn("p-4 rounded-3xl", item.accent)}>
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">
                    <Plus className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-base md:text-lg text-slate-500 font-medium">{item.description}</p>
                </div>

                {/* Background Decor */}
                <div className={cn(
                  "absolute -right-16 -bottom-16 w-64 h-64 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity bg-gradient-to-br",
                  item.color
                )} />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-20 text-center py-10 opacity-30 font-bold tracking-widest text-xs uppercase">
        Built with ❤️ for Chinese Learners
      </footer>
    </div>
  );
}
