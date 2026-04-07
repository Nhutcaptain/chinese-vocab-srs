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
          className="glass max-w-sm w-full p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-5 shadow-xl shadow-indigo-200">
              <Languages className="w-8 h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight text-slate-800">
              Chào mừng bạn!
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Vui lòng nhập tên của bạn để bắt đầu học bộ nhớ cách quãng (SRS).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <User className="w-4 h-4" />
              </div>
              <input
                autoFocus
                required
                type="text"
                placeholder="Ví dụ: Yuxin, Nhut..."
                className="w-full pl-12 pr-5 py-4 bg-white/70 backdrop-blur-xl border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-base shadow-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoggingIn}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 group active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoggingIn ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-b-white"></div>
              ) : (
                <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              )}
              <span>{isLoggingIn ? 'Đang đăng nhập...' : 'Bắt đầu ngay'}</span>
            </button>
          </form>

          <div className="mt-8 flex items-center gap-2 justify-center text-slate-400">
            <Sparkles className="w-3.5 h-3.5" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Powered by MongoDB & SRS</p>
          </div>
        </motion.div>

      </div>
    );
  }

  return <>{children}</>;
};
