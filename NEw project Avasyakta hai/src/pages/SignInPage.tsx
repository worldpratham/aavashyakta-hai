import { useEffect, useState } from 'react';
import {
  Mail,
  Lock,
  EyeOff,
  Eye,
  HardHat,
  Briefcase,
  AlertCircle,
  ArrowRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/router';
import type { Role } from '../hooks/job';
import { ForgotPasswordModal } from '@/components/ForgotPasswordModal';
import { getDraftField, saveDraft, clearDraft } from '@/lib/draftStorage';

const SIGNIN_DRAFT_KEY = 'draft_signin';

export function SignInPage() {
  const { signIn } = useAuth();
  const { language, t } = useLanguage();
  const { search, navigate } = useRouter();

  const [role, setRole] = useState<Role>('worker');
  const [email, setEmail] = useState(() => getDraftField(SIGNIN_DRAFT_KEY, 'email', ''));
  const [password, setPassword] = useState('');

  // Persist email across back/forward navigation
  useEffect(() => {
    saveDraft(SIGNIN_DRAFT_KEY, { email });
  }, [email]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalNotice, setModalNotice] = useState<{
    isOpen: boolean;
    targetRole: 'employer' | 'worker';
    message: string;
  } | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Auto-detect role from URL if present
  useEffect(() => {
    const params = new URLSearchParams(search || window.location.search);
    const urlRole = params.get('role');
    if (urlRole === 'employer' || urlRole === 'worker') {
      setRole(urlRole);
    }
  }, [search]);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setError(null);
    setModalNotice(null);
  };

  const handleShiftToTarget = () => {
    if (!modalNotice) return;
    setRole(modalNotice.targetRole);
    setError(null);
    setModalNotice(null);
  };

  const handleForgotPasswordSuccess = (accountEmail: string, resetRole: Role) => {
    if (accountEmail) {
      setEmail(accountEmail);
    }
    if (resetRole) {
      setRole(resetRole);
    }
    setPassword('');
    setError(null);
    setResetSuccessMessage(
      language === 'hi'
        ? 'पासवर्ड सफलतापूर्वक रीसेट हो गया! कृपया अपने नए पासवर्ड से लॉगिन करें।'
        : 'Password reset successfully! Please log in with your new password.'
    );
    setIsForgotPasswordOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      setError(language === 'hi' ? 'कृपया अपना ईमेल पता दर्ज करें।' : 'Please enter your email address.');
      return;
    }
    if (!emailRegex.test(cleanEmail)) {
      setError(
        language === 'hi'
          ? 'कृपया सही ईमेल पता दर्ज करें (उदा. user@example.com)।'
          : 'Please enter a valid email address (e.g. user@example.com).'
      );
      return;
    }

    setLoading(true);

    const result = await signIn(cleanEmail, password, role);
    setLoading(false);

    if (result.error) {
      if (result.roleMismatch) {
        setModalNotice({
          isOpen: true,
          targetRole:
            (result.targetRole as 'employer' | 'worker') ||
            (role === 'worker' ? 'employer' : 'worker'),
          message:
            result.message ||
            (role === 'worker'
              ? 'Please Shift to Recruiter login'
              : 'Please Shift to Worker login'),
        });
      }
      setError(result.error);
      return;
    }

    // Role-based smart redirection using verified account role
    clearDraft(SIGNIN_DRAFT_KEY);
    const userEmail = (result.user?.email || email || '').toLowerCase().trim();
    const activeRole = result.user?.role || role;
    if (activeRole === 'admin' || userEmail === 'manager@gmail.com') {
      navigate('/admin');
    } else if (activeRole === 'employer') {
      navigate('/my-jobs');
    } else {
      navigate('/jobs');
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 animate-fade-in relative text-stone-900 dark:text-stone-100">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-stone-900 dark:text-stone-100">
          {t('auth_welcome_back', 'Welcome Back')}
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {role === 'employer'
            ? (language === 'hi' ? 'अपने नियोक्ता डैशबोर्ड में जाने के लिए लॉगिन करें' : 'Sign in to access your Recruiter dashboard')
            : (language === 'hi' ? 'अपने कामगार डैशबोर्ड में जाने के लिए लॉगिन करें' : 'Sign in to access your Worker dashboard')}
        </p>
      </div>

      {/* Role Switcher Tabs */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 dark:bg-stone-900 p-1.5 shadow-inner border border-stone-200/60 dark:border-stone-800">
        <button
          type="button"
          onClick={() => handleRoleChange('worker')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-sm font-semibold transition-all cursor-pointer ${
            role === 'worker'
              ? 'bg-white dark:bg-stone-800 text-emerald-800 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/20'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <HardHat size={18} className={role === 'worker' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'} />
          <span>{t('auth_worker_login', 'Worker Login')}</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('employer')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-sm font-semibold transition-all cursor-pointer ${
            role === 'employer'
              ? 'bg-white dark:bg-stone-800 text-emerald-800 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/20'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Briefcase size={18} className={role === 'employer' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'} />
          <span>{t('auth_recruiter_login', 'Recruiter Login')}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-6 shadow-md border border-stone-200 dark:border-stone-800 dark:bg-stone-900">
        <div>
          <label className="label">
            {role === 'employer' ? t('auth_official_email', 'Official / Contact Email') : t('auth_email_label', 'Email Address')}
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-3.5 text-stone-400 dark:text-stone-500" />
            <input
              type="email"
              className="input pl-10"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">{t('auth_password_label', 'Password')}</label>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setResetSuccessMessage(null);
                setIsForgotPasswordOpen(true);
              }}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition hover:underline cursor-pointer"
            >
              {t('auth_forgot_password', 'Forgot Password?')}
            </button>
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-3.5 text-stone-400 dark:text-stone-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="input pl-10 pr-10"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
                if (resetSuccessMessage) setResetSuccessMessage(null);
              }}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {resetSuccessMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 p-3.5 text-sm text-emerald-800 dark:text-emerald-300 animate-fade-in">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">{resetSuccessMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col gap-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 p-3.5 text-sm text-red-700 dark:text-red-300 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
              <span className="font-semibold">{error}</span>
            </div>
            {error.toLowerCase().includes('shift to') && (
              <button
                type="button"
                onClick={() => {
                  const targetRole = role === 'worker' ? 'employer' : 'worker';
                  handleRoleChange(targetRole);
                }}
                className="mt-1 self-start inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline underline-offset-2 cursor-pointer"
              >
                <span>{language === 'hi' ? `यहां क्लिक करके ${role === 'worker' ? 'नियोक्ता' : 'कामगार'} लॉगिन पर जाएं` : `Click here to switch to ${role === 'worker' ? 'Recruiter' : 'Worker'} Login`}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary mt-2 py-2.5 font-semibold shadow-sm cursor-pointer"
          disabled={loading}
        >
          {loading
            ? (language === 'hi' ? 'लॉगिन हो रहा है...' : 'Signing in...')
            : role === 'employer'
            ? (language === 'hi' ? 'नियोक्ता लॉगिन करें' : 'Sign in as Recruiter')
            : (language === 'hi' ? 'कामगार लॉगिन करें' : 'Sign in as Worker')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
        {t('auth_dont_have_account', 'New to Abasyakta?')}{' '}
        <Link
          to={`/signup?role=${role}`}
          className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
        >
          {language === 'hi'
            ? `${role === 'employer' ? 'नियोक्ता' : 'कामगार'} खाता बनाएं`
            : `Create ${role === 'employer' ? 'Employer' : 'Worker'} Account`}
        </Link>
      </p>

      {/* Role Mismatch Popup Modal Dialog */}
      {modalNotice?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-100 dark:border-stone-800 text-center transition-all animate-scale-up"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setModalNotice(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            {/* Icon Graphic */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-8 ring-amber-50/50 dark:ring-amber-950/30">
              {modalNotice.targetRole === 'employer' ? (
                <Briefcase size={32} className="text-amber-600 dark:text-amber-400" />
              ) : (
                <HardHat size={32} className="text-emerald-600 dark:text-emerald-400" />
              )}
            </div>

            {/* Main Prompt Title as Requested */}
            <h3 id="modal-title" className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {modalNotice.message}
            </h3>

            {/* Clarification Message */}
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
              {modalNotice.targetRole === 'employer'
                ? 'This email address is registered as a Recruiter account. Please shift to Recruiter login to access your employer account.'
                : 'This email address is registered as a Worker account. Please shift to Worker login to access your worker account.'}
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleShiftToTarget}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] transition"
              >
                <span>
                  {modalNotice.targetRole === 'employer'
                    ? 'Shift to Recruiter Login'
                    : 'Shift to Worker Login'}
                </span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => setModalNotice(null)}
                className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2.5 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition"
              >
                Stay Here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password OTP Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialRole={role}
        initialIdentifier={email}
        onSuccessReset={handleForgotPasswordSuccess}
      />
    </div>
  );
}
