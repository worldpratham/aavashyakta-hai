import { useState, useEffect, useRef, FormEvent } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  RotateCcw,
  ChevronDown,
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle2,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { useRouter } from '@/router';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useUserActivityTracker, playChime } from '@/hooks/useUserActivityTracker';
import { getProactiveHelp, getBotAnswer, BotAction } from '@/lib/aiBotKnowledge';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actions?: BotAction[];
  followUps?: string[];
}

export function AiChatbot() {
  const { pathname, navigate } = useRouter();
  const { language } = useLanguage();
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Activity Tracker Hook (30s stuck threshold)
  const {
    secondsOnCurrentStep,
    activeField,
    isStuck,
    stuckContext,
    dismissStuckAlert,
    triggerStuckAlertManually,
  } = useUserActivityTracker({
    stuckThresholdSeconds: 30,
    snoozeDurationSeconds: 90,
    soundEnabled,
  });

  const isHi = language === 'hi';

  // Chat message history
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'init-1',
      sender: 'bot',
      text:
        'नमस्ते! मैं **आवश्यकता AI सहायक (Abasyakta AI Assistant)** हूँ। 🙏✨\n\nमैं आपकी हर गतिविधि में मदद के लिए यहाँ हूँ। अगर आप कहीं भी अटकते हैं या 30 सेकंड से ज्यादा समय लग रहा है, तो मैं तुरंत सहायता करूंगा!\n\nआप मुझसे नौकरी खोजने, कामगार रखने, रजिस्ट्रेशन, OTP या मजदूरी के बारे में कुछ भी पूछ सकते हैं।',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: '👷 काम ढूंढें', path: '/jobs', actionType: 'navigate' },
        { label: '📢 फ्री जॉब पोस्ट करें', path: '/post-job', actionType: 'navigate' },
        { label: '📝 नया खाता बनाएं', path: '/signup', actionType: 'navigate' },
      ],
      followUps: [
        'काम कैसे मिलेगा?',
        'बिना रिज्यूमे के कैसे अप्लाई करें?',
        'डायरेक्ट मालिक/HR को फोन कैसे करें?',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Text to Speech playback with Hindi voice priority
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Remove markdown bold/bullets for cleaner speech
      const cleanText = text.replace(/[*#_`]/g, '').replace(/•/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis not available
    }
  };

  // Web Speech Recognition for Hindi voice input
  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('आपके ब्राउज़र में वॉइस इनपुट सपोर्ट नहीं है।');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN'; // Default to Hindi speech recognition

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(transcript);
          sendMessage(transcript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Send a user message and get NLP bot response in simple Hindi
  const sendMessage = (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    const userMsg: Message = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Natural NLP processing delay
    setTimeout(() => {
      const answer = getBotAnswer(query, pathname, 'hi');
      const botMsg: Message = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: answer.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: answer.actions,
        followUps: answer.followUps,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      if (voiceSpeechEnabled) {
        speakText(answer.text);
      }
    }, 500);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  // Handle action click
  const handleActionClick = (action: BotAction) => {
    if (action.actionType === 'navigate' && action.path) {
      navigate(action.path);
    } else if (action.actionType === 'query' && action.queryText) {
      sendMessage(action.queryText);
    } else if (action.path) {
      navigate(action.path);
    }
  };

  // Proactive help content when stuck
  const proactiveData = stuckContext ? getProactiveHelp(stuckContext, language) : null;

  // Handler when user clicks "Haan, help chahiye" in the 30-sec popup
  const handleAcceptProactiveHelp = () => {
    dismissStuckAlert();
    setIsOpen(true);
    setIsMinimized(false);

    if (proactiveData) {
      const proactiveMsg: Message = {
        id: 'proactive-' + Date.now(),
        sender: 'bot',
        text: `🤝 **${proactiveData.headline}**\n\n${proactiveData.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: proactiveData.suggestedAction ? [proactiveData.suggestedAction] : undefined,
        followUps: proactiveData.quickQuestions,
      };
      setMessages((prev) => [...prev, proactiveMsg]);
      if (voiceSpeechEnabled) {
        speakText(proactiveData.message);
      }
    }
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([
      {
        id: 'reset-' + Date.now(),
        sender: 'bot',
        text: isHi
          ? 'चैट रीसेट कर दी गई है। मैं आपकी क्या मदद कर सकता हूँ?'
          : 'Chat history cleared. How can I assist you?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Contextual helper title
  const getPageContextLabel = () => {
    if (pathname.includes('/signup')) return isHi ? 'रजिस्ट्रेशन पेज' : 'Registration Page';
    if (pathname.includes('/signin')) return isHi ? 'लॉगिन पेज' : 'Sign In Page';
    if (pathname.includes('/post-job')) return isHi ? 'नौकरी पोस्ट करें' : 'Post Job Page';
    if (pathname.includes('/jobs')) return isHi ? 'नौकरियां ब्राउज' : 'Browse Jobs';
    if (pathname.includes('/profile')) return isHi ? 'प्रोफाइल पेज' : 'Profile Page';
    if (pathname.includes('/my-jobs')) return isHi ? 'मेरी पोस्टेड जॉब्स' : 'My Jobs';
    if (pathname.includes('/my-applications')) return isHi ? 'मेरे आवेदन' : 'My Applications';
    return isHi ? 'होम पेज' : 'Home Page';
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. 30-SECOND STUCK PROACTIVE SPEECH BUBBLE                                  */}
      {/* ========================================================================= */}
      {isStuck && !isOpen && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-24 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] animate-slide-up"
        >
          <div className="relative rounded-2xl bg-white dark:bg-stone-900 border-2 border-emerald-500/80 shadow-2xl p-4 sm:p-5 backdrop-blur-xl transition-all">
            {/* Pulsing ring indicator */}
            <div className="absolute -top-2 -left-2 flex items-center justify-center">
              <span className="relative flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-600 border-2 border-white dark:border-stone-900"></span>
              </span>
            </div>

            {/* Header with Bot Icon & Close */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md">
                  <Bot size={22} className="animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {proactiveData?.headline || (isHi ? 'क्या मैं मदद कर सकता हूँ?' : 'May I help you?')}
                    </h4>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-400">
                      <Clock size={10} /> 30s+ Dwell
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {getPageContextLabel()} {activeField ? `• Field: ${activeField}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismissStuckAlert()}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition p-1"
                title={isHi ? 'बंद करें' : 'Dismiss'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Contextual stuck text */}
            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed mb-3.5 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-lg border border-stone-200/60 dark:border-stone-700/60">
              {proactiveData?.message ||
                (isHi
                  ? 'आप इस पेज पर कुछ देर से रुके हुए हैं। क्या मैं आपको आगे की प्रोसेस में मदद करूँ?'
                  : 'You seem to have spent some time on this step. May I guide you forward?')}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptProactiveHelp}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow-md transition"
              >
                <Sparkles size={16} />
                {isHi ? 'हाँ, मदद चाहिए' : 'Yes, Help Me'}
              </button>
              <button
                type="button"
                onClick={() => dismissStuckAlert()}
                className="inline-flex items-center justify-center rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-xs sm:text-sm font-medium px-3.5 py-2 transition"
              >
                {isHi ? 'नहीं, ठीक है' : 'I am fine'}
              </button>
            </div>

            {/* Bubble arrow pointing down-right */}
            <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-r border-b border-emerald-500/80 bg-white dark:bg-stone-900"></div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FLOATING TRIGGER BUTTON (Always visible at bottom right)                */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2">
        {/* Quick Help Pill when closed */}
        {!isOpen && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              dismissStuckAlert();
            }}
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-800 px-3.5 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 shadow-lg backdrop-blur-md hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{isHi ? 'AI सहायक (24/7 Sahayak)' : 'AI Assistant (24/7 Help)'}</span>
            <span className="text-[10px] text-stone-400 group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        )}

        {/* Main Floating Circle Bot Button */}
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
            } else {
              setIsOpen(true);
              setIsMinimized(false);
              dismissStuckAlert();
            }
          }}
          className={`relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl transition-all duration-300 active:scale-95 ${
            isOpen
              ? 'bg-stone-800 text-white dark:bg-stone-700'
              : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white hover:shadow-emerald-500/25 hover:shadow-2xl hover:scale-105'
          }`}
          title={isOpen ? (isHi ? 'चैट बंद करें' : 'Close chat') : (isHi ? 'AI सहायक खोलें' : 'Open AI Assistant')}
          aria-label="Open AI Assistant"
        >
          {isOpen ? (
            <X size={26} />
          ) : (
            <>
              <Bot size={28} />
              {/* Active animated pulse dot */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-white dark:border-stone-900"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. FULL CHAT WINDOW                                                       */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 animate-slide-up ${
            isMinimized ? 'h-16' : 'h-[580px] max-h-[80vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-4 py-3 text-white flex items-center justify-between shadow-sm select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner backdrop-blur-sm">
                <Bot size={20} />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-300 border-2 border-emerald-700"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5 leading-tight">
                  <span>आवश्यकता AI सहायक</span>
                  <Sparkles size={13} className="text-amber-300" />
                </h3>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <Activity size={10} className="animate-pulse" />
                  <span>{getPageContextLabel()}</span>
                  <span>• {secondsOnCurrentStep}s</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/90">
              {/* Sound chime toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg transition hover:bg-white/20 ${soundEnabled ? 'text-white' : 'text-white/50'}`}
                title={soundEnabled ? 'आवाज म्यूट करें' : 'आवाज चालू करें'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {/* Clear chat */}
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-lg transition hover:bg-white/20"
                title="चैट साफ़ करें"
              >
                <RotateCcw size={16} />
              </button>

              {/* Minimize toggle */}
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg transition hover:bg-white/20"
                title={isMinimized ? 'बड़ा करें' : 'छोटा करें'}
              >
                <ChevronDown size={18} className={`transition-transform duration-300 ${isMinimized ? 'rotate-180' : ''}`} />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition hover:bg-white/20"
                title="बंद करें"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Context Banner */}
              <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/40 px-3.5 py-1.5 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>
                    लाइव ट्रैकिंग सक्रिय • {getPageContextLabel()}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={triggerStuckAlertManually}
                  className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
                  title="30 सेकंड ड्वेल अलर्ट टेस्ट करें"
                >
                  30s अलर्ट टेस्ट
                </button>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50 dark:bg-stone-950/30">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 rounded-bl-xs'
                      }`}
                    >
                      {/* Message Content with simple bold and list rendering */}
                      <div className="whitespace-pre-line leading-relaxed">
                        {msg.text.split('\n').map((line, idx) => {
                          const isHeading = line.startsWith('🎯') || line.startsWith('📢') || line.startsWith('🔐') || line.startsWith('🔑') || line.startsWith('📄') || line.startsWith('💰') || line.startsWith('🛠️') || line.startsWith('📍') || line.startsWith('📋') || line.startsWith('🤖') || line.startsWith('🤝');
                          return (
                            <p key={idx} className={isHeading ? 'font-bold my-1 text-emerald-800 dark:text-emerald-300' : 'my-0.5'}>
                              {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                            </p>
                          );
                        })}
                      </div>

                      {/* Interactive Action Buttons */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-stone-700 flex flex-wrap gap-1.5">
                          {msg.actions.map((act, actIdx) => (
                            <button
                              key={actIdx}
                              type="button"
                              onClick={() => handleActionClick(act)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95 transition"
                            >
                              <span>{act.label}</span>
                              <ArrowRight size={11} />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Follow-up Quick Prompts */}
                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {msg.followUps.map((fu, fIdx) => (
                            <button
                              key={fIdx}
                              type="button"
                              onClick={() => sendMessage(fu)}
                              className="text-[11px] rounded-full bg-stone-100 dark:bg-stone-700/60 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 px-2 py-0.5 transition"
                            >
                              💬 {fu}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[10px] text-stone-400">{msg.timestamp}</span>
                      {msg.sender === 'bot' && (
                        <button
                          type="button"
                          onClick={() => speakText(msg.text)}
                          className="text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                          title={isHi ? 'आवाज में सुनें' : 'Listen with voice'}
                        >
                          <Volume2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-stone-400 text-xs py-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                      <Bot size={14} />
                    </div>
                    <span className="flex gap-1 items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {isHi ? 'सहायक सोच रहा है...' : 'AI is thinking...'}
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions row */}
              <div className="px-3 py-2 bg-stone-100/70 dark:bg-stone-800/40 border-t border-stone-200/60 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 shrink-0">
                  त्वरित प्रश्न:
                </span>
                <button
                  type="button"
                  onClick={() => sendMessage('काम कैसे मिलेगा?')}
                  className="rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1 text-[11px] font-medium text-stone-700 dark:text-stone-300 hover:border-emerald-500 hover:text-emerald-600 shrink-0 transition"
                >
                  काम कैसे मिलेगा?
                </button>
                <button
                  type="button"
                  onClick={() => sendMessage('क्या बीना (Bina) में सेवा उपलब्ध है?')}
                  className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 shrink-0 transition"
                >
                  बीना (Bina) में उपलब्ध है?
                </button>
                <button
                  type="button"
                  onClick={() => sendMessage('जॉब पोस्ट कैसे करें?')}
                  className="rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1 text-[11px] font-medium text-stone-700 dark:text-stone-300 hover:border-emerald-500 hover:text-emerald-600 shrink-0 transition"
                >
                  जॉब पोस्ट कैसे करें?
                </button>
                <button
                  type="button"
                  onClick={() => sendMessage('क्या यह 100% फ्री है?')}
                  className="rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1 text-[11px] font-medium text-stone-700 dark:text-stone-300 hover:border-emerald-500 hover:text-emerald-600 shrink-0 transition"
                >
                  क्या यह फ्री है?
                </button>
                <button
                  type="button"
                  onClick={() => sendMessage('OTP नहीं आया तो क्या करें?')}
                  className="rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1 text-[11px] font-medium text-stone-700 dark:text-stone-300 hover:border-emerald-500 hover:text-emerald-600 shrink-0 transition"
                >
                  OTP नहीं आया?
                </button>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSubmit}
                className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2"
              >
                {/* Voice input mic button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl border transition shrink-0 ${
                    isListening
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-emerald-600'
                  }`}
                  title={isListening ? 'सुनना बंद करें' : 'बोलकर पूछें (Voice Input)'}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    isListening
                      ? 'सुन रहा हूँ, बोलिए...'
                      : 'वेबसाइट से जुड़ा कोई भी प्रश्न पूछें (जैसे: काम कैसे मिलेगा, बीना में जॉब)...'
                  }
                  className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold transition shrink-0 active:scale-95 shadow-md"
                  title="संदेश भेजें"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
