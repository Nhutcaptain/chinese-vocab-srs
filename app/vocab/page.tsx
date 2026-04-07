'use client';

import { useState } from 'react';
import { useVocab } from '@/lib/hooks/useVocab';
import { VocabItem } from '@/lib/types';
import { Plus, Trash2, Edit2, X, Search, Check, ChevronLeft, Volume2, Info, Sparkles, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { pinyin } from 'pinyin-pro';
import { playChinese, unlockAudio } from '@/lib/utils/audio';
import Link from 'next/link';

export default function VocabPage() {
  const { vocab, addVocab, updateVocab, deleteVocab, loading } = useVocab();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<VocabItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Helper to check if any string in an array matches the search
  const matchesSearch = (arr: string[] | string) => {
    const list = Array.isArray(arr) ? arr : [arr];
    return list.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const filteredVocab = vocab.filter(item => 
    matchesSearch(item.chinese) ||
    matchesSearch(item.vietnamese) ||
    item.pinyin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState({
    chinese: '',
    pinyin: '',
    vietnamese: ''
  });

  const handleAutoPinyin = () => {
    if (!formData.chinese) return;
    // Take the first synonym for pinyin generation
    const firstZh = formData.chinese.split(',')[0].trim();
    const generated = pinyin(firstZh, { toneType: 'symbol' });
    setFormData(prev => ({ ...prev, pinyin: generated }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Split comma strings into arrays and trim whitespace
    const chineseArr = formData.chinese.split(',').map(s => s.trim()).filter(Boolean);
    const vietnameseArr = formData.vietnamese.split(',').map(s => s.trim()).filter(Boolean);

    if (editingItem) {
      updateVocab(editingItem.id, {
        chinese: chineseArr,
        pinyin: formData.pinyin,
        vietnamese: vietnameseArr
      });
      setEditingItem(null);
    } else {
      addVocab({
        chinese: chineseArr,
        pinyin: formData.pinyin,
        vietnamese: vietnameseArr
      });
      setIsAdding(false);
    }
    setFormData({ chinese: '', pinyin: '', vietnamese: '' });
  };

  const handleEdit = (item: VocabItem) => {
    setEditingItem(item);
    setFormData({
      chinese: item.chinese.join(', '),
      pinyin: item.pinyin,
      vietnamese: item.vietnamese.join(', ')
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="p-2 hover:bg-slate-200 rounded-full transition dark:hover:bg-slate-800">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-600">
          Quản lý từ vựng
        </h1>
      </div>

      {/* Stats and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="glass p-5 md:p-6 rounded-2xl flex justify-between items-center overflow-hidden border-2 border-indigo-50/50 shadow-sm shrink-0 md:w-48">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Tổng cộng</p>
            <p className="text-3xl md:text-4xl font-black text-indigo-600 leading-none">{vocab.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 md:hidden">
            <LayoutGrid className="w-5 h-5" />
          </div>
        </div>

        <div className="relative flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 transition-colors group-focus-within:text-indigo-600 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Tìm kiếm từ, pinyin hoặc nghĩa..." 
              className="w-full pl-14 pr-6 py-4 bg-white/70 backdrop-blur-xl border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold h-[60px] md:h-[72px] text-base shadow-sm placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full md:w-auto px-6 h-[60px] md:h-[72px] bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all font-black shadow-xl shadow-indigo-200 group active:scale-95 shrink-0"
          >
            <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
            <span>Thêm từ mới</span>
          </button>
        </div>
      </div>

      {/* Vocab List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredVocab.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass p-6 rounded-3xl group relative hover:shadow-xl transition-all border border-slate-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex flex-wrap gap-1 mb-1 items-center">
                    {item.chinese.map((zh, i) => (
                      <span key={i} className="text-2xl font-bold text-slate-800 dark:text-white">
                        {zh}{i < item.chinese.length - 1 ? ',' : ''}
                      </span>
                    ))}
                    <button 
                      onClick={() => playChinese(item.chinese.join(', '))}
                      className="text-slate-400 hover:text-indigo-600 transition ml-2 p-1 hover:bg-indigo-50 rounded-lg"
                    >
                       <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-indigo-500 font-bold">{item.pinyin}</p>
                </div>
                <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-3 md:p-2 bg-indigo-50 md:bg-transparent text-indigo-600 md:text-slate-400 hover:text-blue-500 transition-colors rounded-xl md:rounded-lg"
                    title="Sửa"
                  >
                    <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                  <button 
                    onClick={() => deleteVocab(item.id)}
                    className="p-3 md:p-2 bg-rose-50 md:bg-transparent text-rose-600 md:text-slate-400 hover:text-rose-500 transition-colors rounded-xl md:rounded-lg"
                    title="Xóa"
                  >
                    <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>

              {/* Meanings as Tags */}
              <div className="flex flex-wrap gap-2 border-t pt-4 border-slate-100">
                {item.vietnamese.map((vi, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold">
                    {vi}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAdding || editingItem) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAdding(false); setEditingItem(null); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass max-w-md w-full p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] z-10"
            >
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-black">{editingItem ? 'Sửa từ vựng' : 'Thêm từ mới'}</h2>
                <button onClick={() => { setIsAdding(false); setEditingItem(null); }} className="p-2 hover:bg-slate-100 rounded-full transition">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-500">Tiếng Trung</label>
                  </div>
                  <input 
                    required
                    className="w-full px-5 py-4 bg-slate-100/50 dark:bg-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium"
                    value={formData.chinese}
                    onChange={e => setFormData({...formData, chinese: e.target.value})}
                    placeholder="你好, 您好"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-500">Pinyin</label>
                    <button 
                      type="button"
                      onClick={handleAutoPinyin}
                      className="text-xs font-black text-indigo-600 flex items-center gap-1 hover:text-indigo-700 transition-colors uppercase tracking-widest"
                    >
                      <Sparkles className="w-3 h-3" /> Tự động điền
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      required
                      className="w-full px-5 py-4 bg-slate-100/50 dark:bg-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium pr-14"
                      value={formData.pinyin}
                      onChange={e => setFormData({...formData, pinyin: e.target.value})}
                      placeholder="nǐ hǎo"
                    />
                    <button 
                      type="button"
                      onClick={() => playChinese(formData.chinese)}
                      className="absolute right-4 text-slate-400 hover:text-indigo-600 transition p-2"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">Nghĩa tiếng Việt</label>
                  <input 
                    required
                    className="w-full px-5 py-4 bg-slate-100/50 dark:bg-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium"
                    value={formData.vietnamese}
                    onChange={e => setFormData({...formData, vietnamese: e.target.value})}
                    placeholder="Xin chào, Chào bạn"
                  />
                </div>
                
                <div className="bg-indigo-50/50 p-4 rounded-xl flex gap-3 text-indigo-600">
                  <Info className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-semibold leading-relaxed">
                    Bạn có thể nhập nhiều nghĩa hoặc từ đồng nghĩa bằng cách ngăn cách chúng bằng **dấu phẩy (,)**.
                  </p>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 md:py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg md:text-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  {editingItem ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  {editingItem ? 'Cập nhật' : 'Thêm từ ngay'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
