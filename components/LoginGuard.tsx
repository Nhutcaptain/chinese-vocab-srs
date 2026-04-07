'use client';

import React, { useState } from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogIn, Sparkles, Languages } from 'lucide-react';

export const LoginGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { username, login, loading } = useUser();
  const [input, setInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!username) {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim() && !isLoggingIn) {
        setIsLoggingIn(true);
        await login(input.trim());
        setIsLoggingIn(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-md overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass max-w-md w-full p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />
          
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-200">
              <Languages className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black mb-3 tracking-tight text-slate-800">
              Chào mừng bạn!
            </h1>
            <p className="text-slate-500 font-medium">
              Vui lòng nhập tên của bạn để bắt đầu học bộ nhớ cách quãng (SRS).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <input
                autoFocus
                required
                type="text"
                placeholder="Ví dụ: Yuxin, Nhut..."
                className="w-full pl-14 pr-6 py-5 bg-white/70 backdrop-blur-xl border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-lg shadow-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoggingIn}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 group active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoggingIn ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-b-white"></div>
              ) : (
                <LogIn className="w-6 h-6 transition-transform group-hover:translate-x-1" />
              )}
              <span>{isLoggingIn ? 'Đang đăng nhập...' : 'Bắt đầu ngay'}</span>
            </button>
          </form>

          <div className="mt-10 flex items-center gap-3 justify-center text-slate-400">
            <Sparkles className="w-4 h-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Powered by MongoDB & SRS</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};
