/**
 * Real Web Speech API helper for "Aavashyakta Hai"
 * 100% Free & Native to modern browsers (Chrome, Edge, Safari, Android WebView)
 * Supports Hindi (hi-IN) and Indian English (en-IN)
 */

// Safe Speech Recognition interface declarations
export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

/**
 * Intelligent keyword cleaner for Indian job search
 * Workers commonly speak full sentences like:
 * "मुझे प्लंबर की नौकरी चाहिए" -> "प्लंबर"
 * "ड्राइवर का काम दिखाओ" -> "ड्राइवर"
 * "इलेक्ट्रीशियन चाहिए दिल्ली में" -> "इलेक्ट्रीशियन दिल्ली"
 */
export function cleanVoiceJobQuery(rawText: string): string {
  if (!rawText) return '';
  let text = rawText.trim();

  // Common Hindi conversational filler prefixes
  const hindiPrefixes = [
    /^(मुझे|हमे|हमको|कृपया|जरा|भाई|सर)\s+/i,
    /^(i need|i want|looking for|find me|search for|please give me)\s+/i,
  ];

  for (const rx of hindiPrefixes) {
    text = text.replace(rx, '');
  }

  // Common Hindi conversational filler suffixes
  const hindiSuffixes = [
    /\s+(की नौकरी|की जॉब|का काम|का काम चाहिए|की आवश्यकता है|चाहिए|ढूंढो|दिखाओ|बताओ|मिल सकता है क्या|होगी क्या)$/i,
    /\s+(jobs?|work|vacancy|vacancies|needed|required|chahiye|ki job|ka kaam)$/i,
  ];

  for (const rx of hindiSuffixes) {
    text = text.replace(rx, '');
  }

  // Clean trailing punctuation
  text = text.replace(/[।.,?!]+$/g, '').trim();

  return text || rawText.trim();
}

/**
 * Play a subtle soft audio chime when speech starts/stops
 */
export function playMicTone(type: 'start' | 'stop') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    }

    // Trigger slight haptic vibration on Android phones
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(type === 'start' ? 40 : 25);
    }
  } catch {
    // Audio context may fail if user hasn't interacted or is blocked - safe to ignore
  }
}
