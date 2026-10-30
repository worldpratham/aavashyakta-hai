import { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  HardHat,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { api, type Role } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: Role;
  initialIdentifier?: string;
  onSuccessReset?: (accountEmail: string, role: Role) => void;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  initialRole = 'worker',
  initialIdentifier = '',
  onSuccessReset,
}: ForgotPasswordModalProps) {
  const { language, t } = useLanguage();

  // Wizard Step: 'identify' | 'verify' | 'success'
  const [step, setStep] = useState<'identify' | 'verify' | 'success'>('identify');
  const [role, setRole] = useState<Role>(initialRole);
  const [identifier, setIdentifier] = useState(initialIdentifier);

  // OTP & Password states
  const [maskedTarget, setMaskedTarget] = useState('');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [debugOtp, setDebugOtp] = useState<string | undefined>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback states
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetAccountEmail, setResetAccountEmail] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync initial props when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('identify');
      setRole(initialRole);
      setIdentifier(initialIdentifier || '');
      setDigits(['', '', '', '', '', '']);
      setDebugOtp(undefined);
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMsg(null);
      setTimer(30);
    }
  }, [isOpen, initialRole, initialIdentifier]);

  // Resend Countdown
  useEffect(() => {
    if (!isOpen || step !== 'verify' || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, step, timer]);

  if (!isOpen) return null;

  // Step 1: Send OTP to verified phone number
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError(language === 'hi' ? 'कृपया अपना ईमेल या 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Please enter your email or 10-digit mobile number');
      return;
    }

    if (cleanId.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanId)) {
        setError(language === 'hi' ? 'कृपया सही ईमेल पता दर्ज करें (उदा. user@example.com)' : 'Please enter a valid email address (e.g. user@example.com)');
        return;
      }
    } else {
      const phoneDigits = cleanId.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        setError(language === 'hi' ? 'कृपया सही 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
        return;
      }
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.auth.forgotPasswordSendOtp({
        identifier: cleanId,
        role,
      });

      setMaskedTarget(res.target || cleanId);
      if (res.debugOtp) {
        setDebugOtp(res.debugOtp);
      }
      if (res.accountEmail) {
        setResetAccountEmail(res.accountEmail);
      }

      setStep('verify');
      setTimer(30);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      console.error('Send forgot password OTP error:', err);
      setError(err?.message || (language === 'hi' ? 'ओटीपी भेजने में असमर्थ। कृपया पुनः प्रयास करें।' : 'Failed to send verification OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // OTP Digit handling
  const handleOtpChange = (index: number, val: string) => {
    setError(null);
    const cleaned = val.replace(/[^0-9]/g, '');

    if (cleaned.length > 1) {
      handlePastedCode(cleaned);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned.slice(-1);
    setDigits(newDigits);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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
  };

  // Step 2: Resend OTP
  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.auth.forgotPasswordSendOtp({
        identifier: identifier.trim(),
        role,
      });

      setTimer(30);
      setDigits(['', '', '', '', '', '']);
      if (res.debugOtp) {
        setDebugOtp(res.debugOtp);
      }
      setSuccessMsg(language === 'hi' ? 'सत्यापित नंबर पर नया ओटीपी भेज दिया गया है!' : 'New 6-digit OTP sent to verified number!');
      inputRefs.current[0]?.focus();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || (language === 'hi' ? 'ओटीपी पुनः भेजने में विफल।' : 'Failed to resend OTP.'));
    } finally {
      setResending(false);
    }
  };

  // Step 2: Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = digits.join('');

    if (fullOtp.length !== 6) {
      setError(language === 'hi' ? 'कृपया 6 अंकों का पूरा ओटीपी दर्ज करें' : 'Please enter the complete 6-digit OTP');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(language === 'hi' ? 'दोनों पासवर्ड मेल नहीं खाते हैं' : 'Passwords do not match');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.auth.forgotPasswordReset({
        identifier: identifier.trim(),
        otp: fullOtp,
        newPassword,
        role,
      });

      setStep('success');
      if (onSuccessReset) {
        onSuccessReset(res.user?.email || resetAccountEmail || identifier.trim(), role);
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err?.message || (language === 'hi' ? 'पासवर्ड रीसेट नहीं हो सका। कृपया पुनः प्रयास करें।' : 'Failed to reset password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in text-stone-900 dark:text-stone-100">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-modal-title"
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-2xl border border-stone-200/80 dark:border-stone-800 transition-all animate-scale-up overflow-hidden"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* STEP 1: Find Account & Send OTP */}
        {step === 'identify' && (
          <div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 shadow-inner">
                <ShieldCheck size={32} />
              </div>
              <h3 id="forgot-password-modal-title" className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
                {t('auth_forgot_password_title', 'Reset Your Password')}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                {t(
                  'auth_forgot_password_subtitle',
                  'Enter your registered email or mobile number to receive a 6-digit OTP on your verified number.'
                )}
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 p-1.5 border border-stone-200/60 dark:border-stone-700">
              <button
                type="button"
                onClick={() => {
                  setRole('worker');
                  setError(null);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  role === 'worker'
                    ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/20'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <HardHat size={16} className={role === 'worker' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'} />
                <span>{language === 'hi' ? 'कामगार (Worker)' : 'Worker Account'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('employer');
                  setError(null);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  role === 'employer'
                    ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/20'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Briefcase size={16} className={role === 'employer' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'} />
                <span>{language === 'hi' ? 'नियोक्ता (Recruiter)' : 'Recruiter Account'}</span>
              </button>
            </div>

            {/* Identification Form */}
            <form onSubmit={handleSendOtp} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="label">
                  {t('auth_enter_identifier', 'Email or Mobile Number')}
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-3.5 text-stone-400 dark:text-stone-500" />
                  <input
                    type="text"
                    className="input pl-10"
                    value={identifier}
                    onChange={(e) => {
                      let val = e.target.value.trim();
                      // If user is entering digits only (mobile number), cap strictly at 10 digits
                      if (/^\d+$/.test(val)) {
                        val = val.slice(0, 10);
                      }
                      setIdentifier(val);
                      if (error) setError(null);
                    }}
                    placeholder={
                      role === 'employer'
                        ? 'employer@company.com or 9876543210'
                        : 'worker@example.com or 9876543210'
                    }
                    autoFocus
                    required
                  />
                </div>
                <p className="mt-1.5 text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
                  {language === 'hi'
                    ? '🔒 आपके खाते से जुड़े सत्यापित मोबाइल नंबर पर ओटीपी भेजा जाएगा।'
                    : '🔒 The OTP will be sent to the verified mobile number linked to this account.'}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 p-3 text-xs sm:text-sm text-red-700 dark:text-red-300 animate-fade-in">
                  <AlertCircle size={16} className="shrink-0 text-red-600 dark:text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="btn-primary mt-2 w-full py-3 text-sm sm:text-base font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>{language === 'hi' ? 'ओटीपी भेजा जा रहा है...' : 'Sending OTP...'}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth_send_reset_otp', 'Send Verification OTP')}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Verify OTP & Enter New Password */}
        {step === 'verify' && (
          <div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 shadow-inner">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
                {language === 'hi' ? 'सत्यापन कोड दर्ज करें' : 'Verify & Set Password'}
              </h3>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                {t('auth_reset_otp_sent_to', 'We sent a 6-digit verification code to your verified mobile number')}
              </p>
              <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 font-mono">
                <span>📱 {maskedTarget}</span>
              </div>
            </div>

            {/* Developer Testing Badge (Auto-fill Demo OTP) */}
            {debugOtp && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 px-3 py-1.5 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-medium">
                  <KeyRound size={14} className="text-amber-700 dark:text-amber-400 shrink-0" />
                  <span>Demo OTP: <strong className="font-mono text-amber-950 dark:text-amber-300 font-bold">{debugOtp}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePastedCode(debugOtp)}
                  className="inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-200 hover:underline bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded text-[11px] transition hover:bg-amber-200 dark:hover:bg-amber-800 cursor-pointer"
                >
                  <Sparkles size={11} /> Auto-fill
                </button>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="mt-4 flex flex-col gap-3.5">
              {/* 6 Digit OTP Input Boxes */}
              <div>
                <label className="label text-xs">
                  {language === 'hi' ? '6-अंकीय ओटीपी कोड' : '6-Digit Verification Code'}
                </label>
                <div className="flex justify-between gap-1.5 sm:gap-2">
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={(e) => {
                        e.preventDefault();
                        handlePastedCode(e.clipboardData.getData('text').trim());
                      }}
                      className={`h-11 w-10 sm:h-12 sm:w-11 rounded-xl text-center text-lg font-bold transition shadow-sm ${
                        digit
                          ? 'border-2 border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/50 text-stone-900 dark:text-stone-100 ring-2 ring-emerald-500/20'
                          : 'border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:border-emerald-600 focus:bg-white dark:focus:bg-stone-800 focus:ring-2 focus:ring-emerald-500/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* New Password Input */}
              <div>
                <label className="label text-xs">
                  {t('auth_enter_new_password', 'Enter New Password')}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-stone-400 dark:text-stone-500" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="input pl-9 pr-9 text-sm"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 cursor-pointer"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="label text-xs">
                  {t('auth_confirm_new_password', 'Confirm New Password')}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-stone-400 dark:text-stone-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`input pl-9 pr-9 text-sm ${
                      confirmPassword && newPassword === confirmPassword
                        ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                        : ''
                    }`}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check size={13} /> {language === 'hi' ? 'पासवर्ड मेल खा रहे हैं' : 'Passwords match perfectly'}
                  </p>
                )}
              </div>

              {/* Feedback messages */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 p-2.5 text-xs text-red-700 dark:text-red-300 animate-fade-in">
                  <AlertCircle size={15} className="shrink-0 text-red-600 dark:text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || digits.some((d) => !d) || !newPassword || newPassword !== confirmPassword}
                className="btn-primary mt-1 w-full py-3 text-sm sm:text-base font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading
                  ? (language === 'hi' ? 'पासवर्ड अपडेट हो रहा है...' : 'Resetting Password...')
                  : (language === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Password')}
              </button>

              {/* Resend & Change Identifier Actions */}
              <div className="mt-2 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <button
                  type="button"
                  onClick={() => {
                    setStep('identify');
                    setError(null);
                  }}
                  className="font-medium text-stone-600 dark:text-stone-400 hover:underline hover:text-stone-900 dark:hover:text-stone-200 cursor-pointer"
                >
                  ← {language === 'hi' ? 'नंबर बदलें' : 'Change Number'}
                </button>

                {timer > 0 ? (
                  <span>
                    {language === 'hi' ? 'पुनः भेजें: ' : 'Resend in '}
                    <strong className="font-mono text-stone-800 dark:text-stone-200">{timer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                    <span>{language === 'hi' ? 'ओटीपी पुनः भेजें' : 'Resend OTP'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Success Confirmation */}
        {step === 'success' && (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 shadow-inner ring-8 ring-emerald-50 dark:ring-emerald-950/30">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
              {t('auth_password_reset_success', 'Password Reset Successful!')}
            </h3>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 max-w-xs mx-auto">
              {t(
                'auth_password_reset_success_desc',
                'Your password has been reset successfully. You can now sign in with your new password.'
              )}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="btn-primary mt-6 w-full py-3 font-bold text-base shadow-lg cursor-pointer"
            >
              {t('auth_back_to_sign_in', 'Back to Sign In')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
