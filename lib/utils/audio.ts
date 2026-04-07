/**
 * Utility to play Chinese pronunciation using multiple TTS APIs.
 * v4: Singleton Audio object, immediate cancellation, and improved auto-play support.
 */

// Simple singleton for the Audio element to bypass multiple browser instance restrictions
let audioInstance: HTMLAudioElement | null = null;

const getAudioInstance = () => {
  if (typeof window === 'undefined') return null;
  if (!audioInstance) {
    audioInstance = new Audio();
  }
  return audioInstance;
};

/**
 * Stops any ongoing audio playback or speech synthesis immediately.
 */
export const stopAudio = () => {
  if (typeof window === 'undefined') return;

  // Stop HTML Audio
  const audio = getAudioInstance();
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.src = ""; // Clear src to stop loading
  }

  // Stop Web Speech API
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Plays Chinese text. Non-blocking (doesn't wait for finish).
 * Automatically cancels previous audio.
 */
export const playChinese = async (text: string) => {
  if (!text || typeof window === 'undefined') return;
  
  // 1. Stop current playback first
  stopAudio();

  const cleanText = text.split(',')[0].trim();
  const encoded = encodeURIComponent(cleanText);
  const timestamp = Date.now();
  const proxyUrl = `/api/tts?text=${encoded}&t=${timestamp}`;

  const audio = getAudioInstance();
  if (!audio) return;

  return new Promise<void>((resolve) => {
    // 2. Try Local Proxy first
    audio.src = proxyUrl;
    
    const playTimeout = setTimeout(() => {
      console.warn("TTS Proxy timed out, attempting Web Speech API fallback...");
      fallbackToSpeechSynthesis(cleanText);
      resolve();
    }, 4500);

    audio.play()
      .then(() => {
        clearTimeout(playTimeout);
        resolve();
      })
      .catch(err => {
        clearTimeout(playTimeout);
        if (err.name !== 'AbortError') { // Ignore expected aborts from stopAudio()
          console.warn(`Local Proxy TTS failed (${err.name}), falling back to Web Speech API...`);
          fallbackToSpeechSynthesis(cleanText);
        }
        resolve();
      });
  });
};

/**
 * Fallback to Web Speech API.
 */
const fallbackToSpeechSynthesis = (text: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;

  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(v => v.lang.includes('zh-CN')) 
                || voices.find(v => v.lang.includes('zh-HK')) 
                || voices.find(v => v.lang.includes('zh-TW'))
                || voices.find(v => v.lang.includes('zh'));
  
  if (zhVoice) {
    utterance.voice = zhVoice;
  }
  
  window.speechSynthesis.speak(utterance);
};

/**
 * Pre-unlocks audio context - MUST be called on a user-initiated event (like 'Start' button).
 */
export const unlockAudio = () => {
  if (typeof window === 'undefined') return;

  // 1. Warm up HTML Audio
  const audio = getAudioInstance();
  if (audio) {
    audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"; // Silence
    audio.play().catch(() => {});
  }

  // 2. Warm up Web Speech API
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(utterance);
  }
};
