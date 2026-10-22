import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, X, RefreshCw, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<{ success: boolean; error?: string }>;
  onResend: () => Promise<{ success: boolean; debugOtp?: string; error?: string }>;
  target: string; // Phone number or email
  title?: string;
  initialDebugOtp?: string;
}

export function OtpModal({
  isOpen,
  onClose,
  onVerify,
  onResend,
  target,
  title = 'Verify Mobile Number',
  initialDebugOtp,
}: OtpModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [debugOtp, setDebugOtp] = useState<string | undefined>(initialDebugOtp);
  const [timer, setTimer] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update debugOtp when prop changes
  useEffect(() => {
    if (initialDebugOtp) {
      setDebugOtp(initialDebugOtp);
    }
  }, [initialDebugOtp]);

  // Focus first input and reset countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError(null);
      setSuccessMsg(null);
      setTimer(30);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (!isOpen || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  if (!isOpen) return null;

  const handleChange = (index: number, val: string) => {
    setError(null);
    const cleaned = val.replace(/[^0-9]/g, '');

    // If user pasted multiple digits into one field
    if (cleaned.length > 1) {
      handlePastedCode(cleaned);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned.slice(-1);
    setDigits(newDigits);

    // Auto-advance to next box
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when 6th digit is entered
    if (cleaned && index === 5 && newDigits.every((d) => d !== '')) {
      triggerVerification(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    handlePastedCode(pasteData);
  };

  const handlePastedCode = (code: string) => {
    const numbers = code.replace(/[^0-9]/g, '').slice(0, 6);
    if (!numbers) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < numbers.length; i++) {
      newDigits[i] = numbers[i];
    }
    setDigits(newDigits);

    const nextIndex = Math.min(numbers.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (numbers.length === 6) {
      triggerVerification(numbers);
    }
  };

  const triggerVerification = async (codeToVerify?: string) => {
    const fullOtp = codeToVerify || digits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await onVerify(fullOtp);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Invalid OTP code. Please try again.');
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError(null);
    setSuccessMsg(null);

    const result = await onResend();
    setResending(false);

    if (result.success) {
      setTimer(30);
      setDigits(['', '', '', '', '', '']);
      if (result.debugOtp) {
        setDebugOtp(result.debugOtp);
      }
      setSuccessMsg('New 6-digit OTP has been sent!');
      inputRefs.current[0]?.focus();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setError(result.error || 'Failed to resend OTP. Please try again.');
    }
  };

  // Quick auto-fill button using debug OTP for seamless testing
  const handleAutoFillDebug = () => {
    if (debugOtp && debugOtp.length === 6) {
      handlePastedCode(debugOtp);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-2xl border border-stone-100 dark:border-stone-800 text-stone-900 dark:text-stone-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Modal Icon & Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{title}</h3>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            We sent a 6-digit verification code to
          </p>
          <p className="mt-0.5 font-semibold text-emerald-800 dark:text-emerald-400 tracking-wide font-mono text-sm sm:text-base">
            {target}
          </p>
        </div>

        {/* Demo OTP Testing Banner */}
        {debugOtp && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 px-3.5 py-2 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-1.5 font-medium">
              <KeyRound size={15} className="text-amber-700 dark:text-amber-400 shrink-0" />
              <span>Demo OTP: <strong className="font-mono text-amber-950 dark:text-amber-300 font-bold">{debugOtp}</strong></span>
            </div>
            <button
              type="button"
              onClick={handleAutoFillDebug}
              className="inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-200 hover:underline bg-amber-100 dark:bg-amber-900/60 px-2 py-1 rounded-md transition hover:bg-amber-200 dark:hover:bg-amber-800"
            >
              <Sparkles size={12} /> Auto-fill
            </button>
          </div>
        )}

        {/* 6 Digit Inputs */}
        <div className="mt-6 flex justify-between gap-2 sm:gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`h-12 w-11 sm:h-14 sm:w-13 rounded-2xl text-center text-xl font-bold transition shadow-sm ${
                digit
                  ? 'border-2 border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/50 text-stone-900 dark:text-stone-100 ring-2 ring-emerald-500/20'
                  : 'border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:border-emerald-600 focus:bg-white dark:focus:bg-stone-800 focus:ring-2 focus:ring-emerald-500/30'
              }`}
            />
          ))}
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 px-3.5 py-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 px-3.5 py-2 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Verify Button */}
        <button
          type="button"
          onClick={() => triggerVerification()}
          disabled={loading || digits.some((d) => d === '')}
          className="btn-primary mt-6 w-full py-3.5 text-base font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying Code...' : 'Verify & Continue'}
        </button>

        {/* Resend Section */}
        <div className="mt-5 text-center text-xs sm:text-sm text-stone-500 dark:text-stone-400">
          {timer > 0 ? (
            <p>
              Didn't receive the code? Resend in{' '}
              <span className="font-semibold text-stone-800 dark:text-stone-200 font-mono">{timer}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:underline"
            >
              <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
              {resending ? 'Sending new code...' : 'Resend 6-Digit OTP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
