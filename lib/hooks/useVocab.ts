'use client';

import { useState, useEffect, useCallback } from 'react';
import { VocabItem } from '../types';
import { useUser } from '../contexts/UserContext';

export const useVocab = () => {
  const { username } = useUser();
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [streak, setStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial data from MongoDB
  const fetchData = useCallback(async () => {
    if (!username) return;
    
    setLoading(true);
    try {
      // 1. Fetch vocabulary
      const vocabRes = await fetch(`/api/vocab?username=${encodeURIComponent(username)}`);
      if (vocabRes.ok) {
        const data = await vocabRes.json();
        setVocab(data);
      }

      // 2. Fetch user stats
      const userRes = await fetch(`/api/user?username=${encodeURIComponent(username)}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        setStreak(userData.streak || 0);
        setLastStudyDate(userData.lastStudyDate || null);
      }
    } catch (e) {
      console.error("Failed to fetch data from MongoDB", e);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add vocabulary to MongoDB
  const addVocab = async (item: { chinese: string[], pinyin: string[], vietnamese: string[], type?: 'vocab' | 'idiom' }) => {
    if (!username) return;

    const newItem: Partial<VocabItem> & { username: string } = {
      ...item,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      username,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      level: 0,
    };

    try {
      const res = await fetch('/api/vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (res.ok) {
        const createdItem = await res.json();
        setVocab(prev => [createdItem, ...prev]);
      }
    } catch (e) {
      console.error("Failed to add vocab", e);
    }
  };

  // Update vocabulary in MongoDB
  const updateVocab = async (id: string, updates: Partial<VocabItem>) => {
    if (!username) return;

    try {
      const res = await fetch('/api/vocab', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, username, ...updates }),
      });

      if (res.ok) {
        setVocab(prev => prev.map(item => 
          item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item
        ));
      }
    } catch (e) {
      console.error("Failed to update vocab", e);
    }
  };

  // Delete vocabulary from MongoDB
  const deleteVocab = async (id: string) => {
    if (!username) return;

    try {
      const res = await fetch(`/api/vocab?id=${id}&username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setVocab(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete vocab", e);
    }
  };

  // Record study session and update stats in MongoDB
  const recordStudySession = async (ids?: string[]) => {
    if (!username) return;
    
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Update individual word timestamps
    if (ids && ids.length > 0) {
      // Optimistic update
      setVocab(prev => prev.map(item => 
        ids.includes(item.id) ? { ...item, lastReview: now } : item
      ));

      // Batch update in background
      Promise.all(ids.map(id => updateVocab(id, { lastReview: now })));
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

    // Sync stats to DB
    try {
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, streak: newStreak, lastStudyDate: today }),
      });
    } catch (e) {
      console.error("Failed to sync stats", e);
    }
  };

  return { vocab, addVocab, updateVocab, deleteVocab, loading, streak, recordStudySession };
};

