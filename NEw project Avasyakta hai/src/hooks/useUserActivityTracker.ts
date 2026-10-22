import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from '@/router';
import { ActivityContext } from '@/lib/aiBotKnowledge';

// Gentle 2-tone harmonic chime using Web Audio API
export function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    
    // Note 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Note 2: B5 (987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.15);
    gain2.gain.setValueAtTime(0.001, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.7);
  } catch {
    // AudioContext blocked or not supported, ignore gracefully
  }
}

interface UseUserActivityTrackerOptions {
  stuckThresholdSeconds?: number; // Defaults to 30s as requested
  snoozeDurationSeconds?: number; // Defaults to 90s
  soundEnabled?: boolean;
}

export function useUserActivityTracker(options: UseUserActivityTrackerOptions = {}) {
  const {
    stuckThresholdSeconds = 30, // 30 seconds requirement
    snoozeDurationSeconds = 90,
    soundEnabled = true,
  } = options;

  const { pathname } = useRouter();
  const [secondsOnCurrentStep, setSecondsOnCurrentStep] = useState(0);
  const [activeField, setActiveField] = useState<string>('');
  const [isStuck, setIsStuck] = useState(false);
  const [stuckContext, setStuckContext] = useState<ActivityContext | null>(null);

  const lastInteractionTimeRef = useRef<number>(Date.now());
  const snoozedUntilRef = useRef<number>(0);
  const currentPathRef = useRef<string>(pathname);
  const fieldRef = useRef<string>('');

  // Update path ref and reset timer on navigation
  useEffect(() => {
    currentPathRef.current = pathname;
    setSecondsOnCurrentStep(0);
    setIsStuck(false);
    setStuckContext(null);
    lastInteractionTimeRef.current = Date.now();
  }, [pathname]);

  // Track active inputs or focused elements
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const identifier = target.getAttribute('name') || target.getAttribute('id') || target.getAttribute('placeholder') || target.tagName.toLowerCase();
        fieldRef.current = identifier;
        setActiveField(identifier);
      }
    };

    const handleFocusOut = () => {
      // Keep previous field or clear
    };

    window.addEventListener('focusin', handleFocusIn, true);
    window.addEventListener('focusout', handleFocusOut, true);

    return () => {
      window.removeEventListener('focusin', handleFocusIn, true);
      window.removeEventListener('focusout', handleFocusOut, true);
    };
  }, []);

  // Main 1-second interval tracker
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if document is active / visible
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      setSecondsOnCurrentStep((prev) => {
        const next = prev + 1;

        // Check if 30-second threshold is reached and not currently snoozed
        const now = Date.now();
        const isSnoozed = now < snoozedUntilRef.current;

        if (next >= stuckThresholdSeconds && !isStuck && !isSnoozed) {
          const context: ActivityContext = {
            pathname: currentPathRef.current,
            focusedField: fieldRef.current || undefined,
            dwellSeconds: next,
            pageTitle: typeof document !== 'undefined' ? document.title : '',
          };
          setIsStuck(true);
          setStuckContext(context);
          if (soundEnabled) {
            playChime();
          }
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stuckThresholdSeconds, isStuck, soundEnabled]);

  // Dismiss / Snooze the stuck prompt
  const dismissStuckAlert = useCallback((snoozeTime = snoozeDurationSeconds) => {
    setIsStuck(false);
    snoozedUntilRef.current = Date.now() + snoozeTime * 1000;
  }, [snoozeDurationSeconds]);

  // Manual trigger for testing or immediate help
  const triggerStuckAlertManually = useCallback(() => {
    const context: ActivityContext = {
      pathname: currentPathRef.current,
      focusedField: fieldRef.current || undefined,
      dwellSeconds: stuckThresholdSeconds,
      pageTitle: typeof document !== 'undefined' ? document.title : '',
    };
    setIsStuck(true);
    setStuckContext(context);
    if (soundEnabled) {
      playChime();
    }
  }, [stuckThresholdSeconds, soundEnabled]);

  const resetActivityTimer = useCallback(() => {
    setSecondsOnCurrentStep(0);
    lastInteractionTimeRef.current = Date.now();
  }, []);

  return {
    secondsOnCurrentStep,
    activeField,
    isStuck,
    stuckContext,
    dismissStuckAlert,
    triggerStuckAlertManually,
    resetActivityTimer,
  };
}
