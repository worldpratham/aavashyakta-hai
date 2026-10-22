import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  isSpeechRecognitionSupported,
  cleanVoiceJobQuery,
  playMicTone,
  type SpeechRecognitionEvent,
  type SpeechRecognitionErrorEvent,
} from '@/lib/voiceSearch';
import { resolveToPrimaryCategory } from '@/lib/bilingualSearch';
import { useLanguage } from '@/context/LanguageContext';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (query: string) => void;
  title?: string;
}

const POPULAR_VOICE_SUGGESTIONS = [
  { hi: 'प्लंबर', en: 'Plumber' },
  { hi: 'ड्राइवर', en: 'Driver' },
  { hi: 'डिलीवरी बॉय', en: 'Delivery Boy' },
  { hi: 'इलेक्ट्रीशियन', en: 'Electrician' },
  { hi: 'सिक्योरिटी गार्ड', en: 'Security Guard' },
  { hi: 'कारपेंटर', en: 'Carpenter' },
  { hi: 'ऑफिस हेल्पर / प्यून', en: 'Office Peon' },
  { hi: 'रसोइया / कुक', en: 'Cook / Chef' },
  { hi: 'हाउसकीपिंग / सफाई', en: 'Housekeeping' },
  { hi: 'पेंटर', en: 'Painter' },
];

export function VoiceSearchModal({
  isOpen,
  onClose,
  onResult,
  title,
}: VoiceSearchModalProps) {
  const { language } = useLanguage();
  const [langCode, setLangCode] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [isListening, setIsListening] = useState(false);
  const [rawTranscript, setRawTranscript] = useState('');
  const [cleanedTranscript, setCleanedTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check support on mount
  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  // Cleanup speech recognition on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setRawTranscript('');
      setCleanedTranscript('');
      setErrorMessage(null);
    } else {
      // Auto-start listening when modal opens if supported
      if (isSpeechRecognitionSupported()) {
        startListening(langCode);
      }
    }

    return () => {
      stopListening();
    };
  }, [isOpen]);

  const startListening = (selectedLang: 'hi-IN' | 'en-IN') => {
    if (!isSpeechRecognitionSupported()) {
      setIsSupported(false);
      return;
    }

    // Clear any previous auto-submit
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }

    stopListening();
    setErrorMessage(null);
    setRawTranscript('');
    setCleanedTranscript('');

    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      const recognition = new SpeechRecognitionClass();
      recognition.lang = selectedLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        playMicTone('start');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const spoken = (final || interim).trim();
        if (spoken) {
          setRawTranscript(spoken);
          const cleaned = cleanVoiceJobQuery(spoken);
          setCleanedTranscript(cleaned);

          // If final result obtained, auto-submit after a brief 1.2s delay
          if (final) {
            playMicTone('stop');
            if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
            autoSubmitTimerRef.current = setTimeout(() => {
              handleSubmit(cleaned || spoken);
            }, 1200);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        playMicTone('stop');

        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMessage(
            language === 'hi'
              ? 'माइक्रोफ़ोन अनुमति नहीं मिली। कृपया ब्राउज़र एड्रेस बार में 🔒 या ⚙️ आइकन पर क्लिक करके माइक की अनुमति दें।'
              : 'Microphone permission denied. Please allow microphone access in your browser settings.'
          );
        } else if (event.error === 'no-speech') {
          setErrorMessage(
            language === 'hi'
              ? 'कोई आवाज़ नहीं सुनी गई। कृपया माइक के पास आकर दोबारा बोलें।'
              : 'No speech was detected. Please try speaking again.'
          );
        } else if (event.error === 'network') {
          setErrorMessage(
            language === 'hi'
              ? 'नेटवर्क समस्या। कृपया अपने इंटरनेट कनेक्शन की जांच करें।'
              : 'Network error. Please check your internet connection.'
          );
        } else {
          setErrorMessage(
            language === 'hi'
              ? 'आवाज़ पहचानने में समस्या हुई। कृपया दोबारा प्रयास करें।'
              : 'Could not recognize speech. Please try again.'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setErrorMessage(
        language === 'hi'
          ? 'माइक्रोफोन शुरू करने में विफल। कृपया पेज रिफ्रेश करें।'
          : 'Failed to access microphone. Please refresh the page.'
      );
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleSubmit = (queryToSubmit?: string) => {
    const finalQuery = (queryToSubmit || cleanedTranscript || rawTranscript).trim();
    if (finalQuery) {
      stopListening();
      onResult(finalQuery);
      onClose();
    }
  };

  const handleSuggestionClick = (phrase: string) => {
    handleSubmit(phrase);
  };

  const toggleLanguage = (lang: 'hi-IN' | 'en-IN') => {
    setLangCode(lang);
    if (isOpen) {
      startListening(lang);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-7 text-stone-900 dark:text-stone-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
            <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'hi' ? 'आवाज़ से नौकरी खोजें' : 'Voice Job Search'}</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {title || (language === 'hi' ? 'बोलिए, क्या काम चाहिए?' : 'Speak: What job do you need?')}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {language === 'hi'
              ? 'जैसे बोलें: "प्लंबर", "ड्राइवर", या "डिलीवरी बॉय"'
              : 'e.g. "Driver", "Plumber", or "Delivery Boy"'}
          </p>
        </div>

        {/* Language Selector Chips */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => toggleLanguage('hi-IN')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              langCode === 'hi-IN'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            🇮🇳 हिंदी (Hindi)
          </button>
          <button
            type="button"
            onClick={() => toggleLanguage('en-IN')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              langCode === 'en-IN'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            🇬🇧 English
          </button>
        </div>

        {/* Main Microphone Action Center */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative flex items-center justify-center">
            {/* Pulsing Ripple Rings when listening */}
            {isListening && (
              <>
                <span className="absolute h-32 w-32 rounded-full bg-emerald-500/20 animate-ping"></span>
                <span className="absolute h-24 w-24 rounded-full bg-emerald-500/30 animate-pulse"></span>
              </>
            )}

            <button
              type="button"
              onClick={() => (isListening ? stopListening() : startListening(langCode))}
              disabled={!isSupported}
              className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 active:scale-95 cursor-pointer ${
                !isSupported
                  ? 'bg-stone-400 cursor-not-allowed'
                  : isListening
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/40 ring-4 ring-rose-300 dark:ring-rose-900/60'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/40 ring-4 ring-emerald-200 dark:ring-emerald-950'
              }`}
              title={isListening ? 'रोकने के लिए क्लिक करें' : 'बोलने के लिए क्लिक करें'}
            >
              {isListening ? (
                <Mic size={34} className="animate-bounce" />
              ) : (
                <Mic size={32} />
              )}
            </button>
          </div>

          <div className="mt-4 text-center">
            <span
              className={`text-sm font-bold ${
                isListening
                  ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              {isListening
                ? language === 'hi'
                  ? '🎙️ सुन रहे हैं... कृपया बोलिए'
                  : '🎙️ Listening... speak now'
                : language === 'hi'
                ? 'बोलने के लिए माइक दबाएं'
                : 'Tap microphone to speak'}
            </span>
          </div>
        </div>

        {/* Real-Time Transcript Display */}
        {(rawTranscript || cleanedTranscript) && (() => {
          const currentText = cleanedTranscript || rawTranscript;
          const detectedCat = resolveToPrimaryCategory(currentText);

          return (
            <div className="mt-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 text-center transition animate-fade-in">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 dark:text-emerald-400 block mb-1">
                {language === 'hi' ? 'पहचाना गया शब्द:' : 'Recognized:'}
              </span>

              <div className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex flex-wrap items-center justify-center gap-2">
                <span>"{currentText}"</span>
                {detectedCat && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 shadow-xs">
                    <span>{detectedCat}</span>
                    <Check size={12} />
                  </span>
                )}
              </div>

              {/* If cleaned differed from raw sentence, show what was spoken */}
              {cleanedTranscript && cleanedTranscript !== rawTranscript && (
                <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">
                  {language === 'hi' ? 'आपने कहा:' : 'You said:'} "{rawTranscript}"
                </span>
              )}

              <button
                type="button"
                onClick={() => handleSubmit()}
                className="mt-3 inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-2.5 px-4 shadow-sm transition cursor-pointer"
              >
                <Check size={14} />
                <span>{language === 'hi' ? 'यह सर्च करें' : 'Search This'}</span>
              </button>
            </div>
          );
        })()}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1">
              <p>{errorMessage}</p>
              <button
                type="button"
                onClick={() => startListening(langCode)}
                className="mt-1.5 inline-flex items-center gap-1 font-bold text-rose-800 dark:text-rose-200 underline cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>{language === 'hi' ? 'दोबारा कोशिश करें' : 'Try Again'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Not Supported Notification */}
        {!isSupported && (
          <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p>
              {language === 'hi'
                ? 'आपके वर्तमान ब्राउज़र में वॉइस रिकॉग्निशन सपोर्ट नहीं है। कृपया Google Chrome या Microsoft Edge ब्राउज़र का उपयोग करें।'
                : 'Voice recognition is not supported in this browser. Please open in Google Chrome or Microsoft Edge.'}
            </p>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-2 text-center">
            {language === 'hi' ? 'या इन लोकप्रिय कामों पर टैप करें:' : 'Or tap a popular role:'}
          </span>
          <div className="flex flex-wrap justify-center gap-1.5 max-h-28 overflow-y-auto pr-1">
            {POPULAR_VOICE_SUGGESTIONS.map((item, idx) => {
              const label = langCode === 'hi-IN' ? item.hi : item.en;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(label)}
                  className="rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 px-2.5 py-1 text-xs text-stone-700 dark:text-stone-300 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 transition cursor-pointer active:scale-95"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
