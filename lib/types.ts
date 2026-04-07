export interface VocabItem {
  id: string;
  chinese: string[]; // Support multiple synonyms
  pinyin: string[]; // Support multiple pinyin for same word
  vietnamese: string[]; // Support multiple meanings
  createdAt: number;
  updatedAt?: number;
  lastReview?: number;
  level: number;
  type?: 'vocab' | 'idiom';
}

export type ReviewMode = 'flashcards' | 'quick' | 'quiz';

export interface ReviewSessionSettings {
  count: number;
  timeLimit: number; // in seconds
  mode: ReviewMode;
}
