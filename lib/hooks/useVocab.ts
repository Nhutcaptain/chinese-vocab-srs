'use client';

import { useState, useEffect } from 'react';
import { VocabItem } from '../types';

export const useVocab = () => {
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [streak, setStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to migrate data from single string to arrays
  const migrateData = (data: any[]): VocabItem[] => {
    return data.map(item => ({
      ...item,
      chinese: Array.isArray(item.chinese) ? item.chinese : [item.chinese],
      vietnamese: Array.isArray(item.vietnamese) ? item.vietnamese : [item.vietnamese],
    }));
  };

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('chinese_vocab_srs');
    const storedStreak = localStorage.getItem('chinese_vocab_streak');
    const storedLastDate = localStorage.getItem('chinese_vocab_last_date');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setVocab(migrateData(parsed).map(item => ({
          ...item,
          updatedAt: item.updatedAt || item.createdAt
        })));
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }

    if (storedStreak) setStreak(parseInt(storedStreak));
    if (storedLastDate) setLastStudyDate(storedLastDate);

    setLoading(false);
  }, []);

  // Save to localStorage
  const saveVocab = (newList: VocabItem[]) => {
    setVocab(newList);
    localStorage.setItem('chinese_vocab_srs', JSON.stringify(newList));
  };

  const addVocab = (item: { chinese: string[], pinyin: string, vietnamese: string[] }) => {
    const newItem: VocabItem = {
      ...item,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      level: 0,
    };
    saveVocab([...vocab, newItem]);
  };

  const updateVocab = (id: string, updates: Partial<VocabItem>) => {
    const newList = vocab.map((item) =>
      item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item
    );
    saveVocab(newList);
  };

  const deleteVocab = (id: string) => {
    const newList = vocab.filter((item) => item.id !== id);
    saveVocab(newList);
  };

  const recordStudySession = (ids?: string[]) => {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Update individual word timestamps
    if (ids && ids.length > 0) {
      const newList = vocab.map(item => 
        ids.includes(item.id) ? { ...item, lastReview: now } : item
      );
      saveVocab(newList);
    }

    // 2. Update overall study streak
    if (lastStudyDate === today) return; // Already updated streak today

    let newStreak = 1;
    if (lastStudyDate) {
      const last = new Date(lastStudyDate);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak = streak + 1;
      }
    }

    setStreak(newStreak);
    setLastStudyDate(today);
    localStorage.setItem('chinese_vocab_streak', newStreak.toString());
    localStorage.setItem('chinese_vocab_last_date', today);
  };

  return { vocab, addVocab, updateVocab, deleteVocab, loading, streak, recordStudySession };
};
