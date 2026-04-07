'use client';

import { useVocab } from '@/lib/hooks/useVocab';
import { useUser } from '@/lib/contexts/UserContext';
import { BookOpen, Zap, Trophy, Settings, Plus, Sparkles, LayoutGrid, ChevronLeft, LogOut, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MenuItem {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  accent: string;
}

export default function Home() {
  const { vocab, loading, streak } = useVocab();
  const { username, logout } = useUser();

  const menuItems: MenuItem[] = [
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
    <div className="max-w-6xl mx-auto pt-4 md:pt-8 pb-12 px-4 selection:bg-indigo-100">
      {/* Top Header Bar */}
      <div className="flex justify-between items-center mb-10 sm:mb-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/50 shadow-sm"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <UserIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 leading-none mb-1">Người học</p>
            <p className="text-xs font-black text-slate-800">{username}</p>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-xs hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100/50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng xuất</span>
        </motion.button>
      </div>

      {/* Hero Section */}
      <div className="mb-12 md:mb-16 text-center relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/20 blur-[60px] -z-10 rounded-full"
        />
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl md:text-6xl font-black mb-6 py-2 leading-tight tracking-tight bg-clip-text text-transparent bg-[linear-gradient(135deg,#6366f1,#ec4899)]"
        >
          Hán Ngữ SRS Cho Yuxin
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-base md:text-xl text-slate-500 font-medium max-w-2xl mx-auto dark:text-slate-400"
        >
          Làm chủ tiếng Trung mỗi ngày với phương pháp lặp lại ngắt quãng và các bài tập tương tác sinh động.
        </motion.p>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <motion.div
          whileHover={{ y: -5 }}
          className="glass p-6 rounded-2xl flex items-center justify-between group overflow-hidden relative"
        >
          <div className="relative z-10">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Tổng từ vựng</p>
            <p className="text-4xl font-black text-indigo-600">{loading ? '...' : vocab.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 relative z-10 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
            <BookOpen className="w-6 h-6" />
          </div>
          <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors" />
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="glass p-6 rounded-2xl flex items-center justify-between group overflow-hidden relative"
        >
          <div className="relative z-10">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Trình độ</p>
            <p className="text-4xl font-black text-rose-500">HSK 4+</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 relative z-10 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-500">
            <Trophy className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="glass p-6 rounded-2xl flex items-center justify-between group overflow-hidden relative"
        >
          <div className="relative z-10">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Chuỗi ngày học</p>
            <p className="text-4xl font-black text-amber-500">{loading ? '...' : streak}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 relative z-10 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-500">
            <Zap className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Quick Practice Section */}
      <div className="mb-10 md:mb-12">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="h-6 md:h-8 w-1.5 bg-indigo-600 rounded-full" />
          <h2 className="text-xl md:text-2xl font-black tracking-tight">Ôn tập nhanh</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

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
