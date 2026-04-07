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
  const [activeTab, setActiveTab] = useState<'all' | 'vocab' | 'idiom'>('all');

  // Helper to check if any string in an array matches the search
  const matchesSearch = (arr: string[] | string) => {
    const list = Array.isArray(arr) ? arr : [arr];
    return list.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const filteredVocab = vocab.filter(item => {
    const chineseMatch = item.chinese.some(zh => zh.toLowerCase().includes(searchTerm.toLowerCase()));
    const vietnameseMatch = item.vietnamese.some(vi => vi.toLowerCase().includes(searchTerm.toLowerCase()));
    const pinyinList = Array.isArray(item.pinyin) ? item.pinyin : [item.pinyin];
    const pinyinMatch = pinyinList.some(p => p?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSearch = chineseMatch || vietnameseMatch || pinyinMatch;
    
    if (activeTab === 'all') return matchesSearch;
    const itemType = item.type || 'vocab';
    return matchesSearch && itemType === activeTab;
  });

  const [formData, setFormData] = useState({
    chinese: [''],
    pinyin: [''],
    vietnamese: [''],
    type: 'vocab' as 'vocab' | 'idiom'
  });

  const addInputField = (type: 'chinese' | 'vietnamese') => {
    if (type === 'chinese') {
      setFormData(prev => ({
        ...prev,
        chinese: [...prev.chinese, ''],
        pinyin: [...prev.pinyin, '']
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        vietnamese: [...prev.vietnamese, '']
      }));
    }
  };

  const removeInputField = (type: 'chinese' | 'vietnamese', index: number) => {
    if (type === 'chinese') {
      setFormData(prev => ({
        ...prev,
        chinese: prev.chinese.filter((_, i) => i !== index),
        pinyin: prev.pinyin.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        vietnamese: prev.vietnamese.filter((_, i) => i !== index)
      }));
    }
  };

  const updateInputField = (type: 'chinese' | 'pinyin' | 'vietnamese', index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...(prev[type as keyof typeof prev] as string[])];
      newArray[index] = value;
      return { ...prev, [type]: newArray };
    });
  };

  const handleAutoPinyin = () => {
    const generatedPinyin = formData.chinese.map(zh => 
      zh ? pinyin(zh, { toneType: 'symbol' }) : ''
    );
    setFormData(prev => ({ ...prev, pinyin: generatedPinyin }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter empty strings and trim whitespace
    const chineseArr = formData.chinese.map(s => s.trim()).filter(Boolean);
    const pinyinArr = formData.pinyin.map(s => s.trim()).filter(Boolean);
    const vietnameseArr = formData.vietnamese.map(s => s.trim()).filter(Boolean);

    if (chineseArr.length === 0 || vietnameseArr.length === 0) return;

    if (editingItem) {
      updateVocab(editingItem.id, {
        chinese: chineseArr,
        pinyin: pinyinArr,
        vietnamese: vietnameseArr,
        type: formData.type
      });
      setEditingItem(null);
    } else {
      addVocab({
        chinese: chineseArr,
        pinyin: pinyinArr,
        vietnamese: vietnameseArr,
        type: formData.type
      });
      setIsAdding(false);
    }
    setFormData({ chinese: [''], pinyin: [''], vietnamese: [''], type: 'vocab' });
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditingItem(null);
    setFormData({ chinese: [''], pinyin: [''], vietnamese: [''], type: 'vocab' });
  };

  const handleEdit = (item: VocabItem) => {
    setEditingItem(item);
    setFormData({
      chinese: item.chinese,
      pinyin: Array.isArray(item.pinyin) ? item.pinyin : [item.pinyin],
      vietnamese: item.vietnamese,
      type: item.type || 'vocab'
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-4 md:pt-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="p-1.5 hover:bg-slate-200 rounded-xl transition dark:hover:bg-slate-800">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-600">
          Quản lý từ vựng
        </h1>
      </div>

      {/* Stats and Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="glass p-4 rounded-xl flex justify-between items-center overflow-hidden border border-indigo-50/50 shadow-sm shrink-0 md:w-40">
          <div>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-0.5">Tổng cộng</p>
            <p className="text-2xl md:text-3xl font-black text-indigo-600 leading-none">{vocab.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 md:hidden">
            <LayoutGrid className="w-4 h-4" />
          </div>
        </div>

        <div className="relative flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors group-focus-within:text-indigo-600 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Tìm kiếm từ, pinyin hoặc nghĩa..." 
              className="w-full pl-12 pr-5 py-3.5 bg-white/70 backdrop-blur-xl border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold h-[54px] md:h-[60px] text-sm shadow-sm placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full md:w-auto px-5 h-[54px] md:h-[60px] bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all font-black shadow-lg shadow-indigo-100 group active:scale-95 shrink-0 text-sm"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            <span>Thêm từ mới</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex p-1 bg-slate-100/50 backdrop-blur-md rounded-2xl mb-8 w-fit border border-slate-200/50">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'vocab', label: 'Từ vựng' },
          { id: 'idiom', label: 'Thành ngữ' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-black transition-all",
              activeTab === tab.id 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vocab List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence>
          {filteredVocab.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "glass p-5 rounded-2xl group relative hover:shadow-lg transition-all border",
                item.type === 'idiom' ? "border-amber-200/50 bg-amber-50/20" : "border-slate-200"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                      item.type === 'idiom' ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                    )}>
                      {item.type === 'idiom' ? 'Thành ngữ' : 'Từ vựng'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mb-0.5 items-center">
                    {item.chinese.map((zh, i) => (
                      <div key={i} className="flex items-center gap-1 group/item">
                        <span className="text-xl font-bold text-slate-800 dark:text-white">
                          {zh}{i < item.chinese.length - 1 ? ',' : ''}
                        </span>
                        <button 
                          onClick={() => playChinese(zh)}
                          className="text-slate-300 hover:text-indigo-600 transition p-1 hover:bg-indigo-50 rounded-lg group-hover/item:text-slate-400"
                        >
                           <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-indigo-500 font-bold text-sm tracking-wide">
                    {Array.isArray(item.pinyin) ? item.pinyin.join(' / ') : item.pinyin}
                  </p>
                </div>
                <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-2 bg-indigo-50 md:bg-transparent text-indigo-600 md:text-slate-400 hover:text-blue-500 transition-colors rounded-lg"
                    title="Sửa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteVocab(item.id)}
                    className="p-2 bg-rose-50 md:bg-transparent text-rose-600 md:text-slate-400 hover:text-rose-500 transition-colors rounded-lg"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Meanings as Tags */}
              <div className="flex flex-wrap gap-1.5 border-t pt-3.5 border-slate-100/60">
                {item.vietnamese.map((vi, i) => (
                  <span key={i} className="px-2 py-0.5 bg-indigo-50/80 text-indigo-600 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-tight">
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
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass max-w-md w-full p-6 md:p-8 rounded-2xl md:rounded-3xl z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-black">{editingItem ? 'Sửa từ vựng' : 'Thêm từ mới'}</h2>
                <button onClick={closeModal} className="p-1.5 hover:bg-slate-100 rounded-full transition">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest">Loại từ vựng</label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'vocab' }))}
                      className={cn(
                        "py-3 rounded-xl text-sm font-black transition-all",
                        formData.type === 'vocab' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                      )}
                    >
                      Từ vựng
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'idiom' }))}
                      className={cn(
                        "py-3 rounded-xl text-sm font-black transition-all",
                        formData.type === 'idiom' ? "bg-white text-amber-600 shadow-sm" : "text-slate-400"
                      )}
                    >
                      Thành ngữ
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2 items-center">
                    <label className="block text-sm font-bold text-slate-500">Từ vựng & Pinyin</label>
                    <button 
                      type="button"
                      onClick={handleAutoPinyin}
                      className="text-[10px] font-black text-indigo-600 flex items-center gap-1 hover:text-indigo-700 transition-colors uppercase tracking-widest"
                    >
                      <Sparkles className="w-3 h-3" /> Tự động điền Pinyin
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.chinese.map((zh, index) => (
                      <div key={index} className="space-y-2 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100/50">
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-2">
                            <input 
                              required={index === 0}
                              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold"
                              value={zh}
                              onChange={e => updateInputField('chinese', index, e.target.value)}
                              placeholder="Chữ Hán (Ví dụ: 你好)"
                            />
                            <div className="relative">
                              <input 
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium text-indigo-500 text-sm"
                                value={formData.pinyin[index] || ''}
                                onChange={e => updateInputField('pinyin', index, e.target.value)}
                                placeholder="Pinyin (Ví dụ: nǐ hǎo)"
                              />
                              <button 
                                type="button"
                                onClick={() => playChinese(zh)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {formData.chinese.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => removeInputField('chinese', index)}
                              className="self-start p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => addInputField('chinese')}
                      className="w-full py-3 border-2 border-dashed border-indigo-100 text-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50/50 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" /> Thêm từ đồng nghĩa
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">Nghĩa tiếng Việt</label>
                  <div className="space-y-2">
                    {formData.vietnamese.map((vi, index) => (
                      <div key={index} className="flex gap-2">
                        <input 
                          required={index === 0}
                          className="flex-1 px-5 py-4 bg-slate-100/50 dark:bg-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium"
                          value={vi}
                          onChange={e => updateInputField('vietnamese', index, e.target.value)}
                          placeholder="Ví dụ: Xin chào"
                        />
                        {formData.vietnamese.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeInputField('vietnamese', index)}
                            className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => addInputField('vietnamese')}
                      className="w-full py-3 border-2 border-dashed border-indigo-100 text-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50/50 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Thêm nghĩa
                    </button>
                  </div>
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
