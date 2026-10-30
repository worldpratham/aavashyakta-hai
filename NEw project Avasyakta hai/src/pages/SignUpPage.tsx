import { useEffect, useState } from 'react';
import {
  Briefcase,
  HardHat,
  Mail,
  Lock,
  User as UserIcon,
  EyeOff,
  Eye,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { type Role } from '@/lib/api';
import { Link, useRouter } from '@/router';
import { getDraftField, saveDraft, clearDraft } from '@/lib/draftStorage';
import { TermsAndConditionsModal } from '@/components/TermsAndConditionsModal';

const SIGNUP_DRAFT_KEY = 'draft_signup_simple';

export function SignUpPage() {
  const { signUp } = useAuth();
  const { language, t } = useLanguage();
  const { search, navigate } = useRouter();

  // Role state - initialized from URL (?role=employer or ?role=worker)
  const [role, setRole] = useState<Role>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role');
      if (urlRole === 'employer' || urlRole === 'worker') {
        return urlRole;
      }
    }
    return 'worker';
  });

  // Core simple signup fields
  const [fullName, setFullName] = useState(() => getDraftField(SIGNUP_DRAFT_KEY, 'fullName', ''));
  const [email, setEmail] = useState(() => getDraftField(SIGNUP_DRAFT_KEY, 'email', ''));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Auto-detect role from URL if present
  useEffect(() => {
    const params = new URLSearchParams(search || window.location.search);
    const urlRole = params.get('role');
    if (urlRole === 'employer' || urlRole === 'worker') {
      setRole(urlRole);
    }
  }, [search]);

  // Persist form input across back/forward navigation
  useEffect(() => {
    saveDraft(SIGNUP_DRAFT_KEY, {
      fullName,
      email,
      role,
    });
  }, [fullName, email, role]);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setError(null);
    setFieldErrors({});
  };

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Field-level validations
    const errors: Record<string, string> = {};

    if (!cleanName) {
      errors.fullName =
        language === 'hi'
          ? (role === 'employer' ? 'कृपया अपना या कंपनी का नाम लिखें *' : 'कृपया अपना नाम लिखें *')
          : (role === 'employer' ? 'Please enter your name or company name *' : 'Please enter your full name *');
    }

    if (!cleanEmail) {
      errors.email = language === 'hi' ? 'ईमेल पता दर्ज करना अनिवार्य है *' : 'Email address is required *';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = language === 'hi' ? 'कृपया सही ईमेल पता दर्ज करें *' : 'Please enter a valid email address *';
    }

    if (!cleanPassword) {
      errors.password = language === 'hi' ? 'पासवर्ड दर्ज करना अनिवार्य है *' : 'Password is required *';
    } else if (cleanPassword.length < 6) {
      errors.password =
        language === 'hi'
          ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए *'
          : 'Password must be at least 6 characters *';
    }

    if (!termsAccepted) {
      errors.termsAccepted =
        language === 'hi'
          ? 'खाता बनाने के लिए आपको नियम, शर्तें व दायित्वमुक्ति (Terms & Conditions) स्वीकार करना अनिवार्य है *'
          : 'You must accept the Terms & Conditions and Platform Disclaimer to register *';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const payload = {
        fullName: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role,
        terms_accepted: true,
        termsAccepted: true,
        // Sensible defaults so user is never blocked
        company_name: role === 'employer' ? cleanName : '',
      };

      const result = await signUp(payload);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Success: clean up draft and navigate to profile page for 2-step setup
      clearDraft(SIGNUP_DRAFT_KEY);
      navigate('/profile');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(
        err?.message ||
          (language === 'hi'
            ? 'खाता बनाने में समस्या आई। कृपया पुनः प्रयास करें।'
            : 'Could not create account. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10 animate-fade-in text-stone-900 dark:text-stone-100">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 border shadow-xs bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
          <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
          <span>
            {role === 'employer'
              ? (language === 'hi' ? 'नियोक्ता खाता' : 'Employer Account')
              : (language === 'hi' ? 'कामगार खाता' : 'Job Seeker Account')}
          </span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
          {language === 'hi' ? 'नया खाता बनाएं' : 'Create Account'}
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {role === 'employer'
            ? (language === 'hi'
                ? 'कामगारों को तुरंत काम पर रखने के लिए अकाउंट बनाएं'
                : 'Sign up to post jobs and hire verified local workers')
            : (language === 'hi'
                ? 'दैनिक व मासिक काम तुरंत पाने के लिए अकाउंट बनाएं'
                : 'Sign up in 30 seconds to find jobs and connect with employers')}
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
          <HardHat
            size={18}
            className={role === 'worker' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'}
          />
          <span>{language === 'hi' ? 'कामगार (Worker)' : 'Worker / Job Seeker'}</span>
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
          <Briefcase
            size={18}
            className={role === 'employer' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'}
          />
          <span>{language === 'hi' ? 'नियोक्ता (Employer)' : 'Employer / Hirer'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-800 dark:text-rose-300 animate-shake">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="leading-relaxed font-medium">{error}</div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="card rounded-2xl p-6 sm:p-7 shadow-lg border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* 1. Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
              {role === 'employer'
                ? (language === 'hi' ? 'आपका नाम / कंपनी का नाम' : 'Your Name / Company Name')
                : (language === 'hi' ? 'पूरा नाम' : 'Full Name')}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="relative">
              <UserIcon
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearFieldError('fullName');
                }}
                placeholder={
                  role === 'employer'
                    ? (language === 'hi' ? 'उदा. शर्मा कंस्ट्रक्शन या राजेश शर्मा' : 'e.g. Sharma Builders or Rajesh Sharma')
                    : (language === 'hi' ? 'उदा. रमेश कुमार' : 'e.g. Ramesh Kumar')
                }
                className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm transition-all outline-hidden bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 ${
                  fieldErrors.fullName
                    ? 'border-rose-500 ring-2 ring-rose-500/10'
                    : 'border-stone-200 dark:border-stone-700 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15'
                }`}
              />
            </div>
            {fieldErrors.fullName && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium">{fieldErrors.fullName}</p>
            )}
          </div>

          {/* 2. Email Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
              {language === 'hi' ? 'ईमेल पता' : 'Email Address'}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value.trim());
                  clearFieldError('email');
                }}
                placeholder="name@example.com"
                className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm transition-all outline-hidden bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 ${
                  fieldErrors.email
                    ? 'border-rose-500 ring-2 ring-rose-500/10'
                    : 'border-stone-200 dark:border-stone-700 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          {/* 3. Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
              {language === 'hi' ? 'पासवर्ड' : 'Password'}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
                placeholder={
                  language === 'hi' ? 'कम से कम 6 अक्षर' : 'At least 6 characters'
                }
                className={`w-full rounded-xl border pl-10 pr-11 py-3 text-sm transition-all outline-hidden bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 ${
                  fieldErrors.password
                    ? 'border-rose-500 ring-2 ring-rose-500/10'
                    : 'border-stone-200 dark:border-stone-700 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          {/* Easy & Trust Reassurance Notice */}
          <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold">
                  {language === 'hi' ? 'सरल व तुरंत रजिस्ट्रेशन' : 'Fast & Easy Setup'}:
                </span>{' '}
                {language === 'hi'
                  ? 'फोटो, आधार सत्यापन, और बैंक डिटेल्स आप बाद में अपनी प्रोफाइल से आसानी से जोड़ सकते हैं।'
                  : 'You can add your photo, skills, Aadhaar verification, and bank details anytime later from your Profile.'}
              </div>
            </div>
          </div>

          {/* Mandatory Terms & Conditions Checkbox */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 p-3.5">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (e.target.checked) clearFieldError('termsAccepted');
                }}
                className="mt-0.5 h-4 w-4 rounded-md border-stone-300 dark:border-stone-700 text-emerald-600 focus:ring-emerald-500/30 cursor-pointer accent-emerald-600 shrink-0"
              />
              <span className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {language === 'hi' ? (
                  <>
                    मैंने आवश्यकता है के{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline cursor-pointer"
                    >
                      नियम, शर्तें (Terms & Conditions)
                    </button>{' '}
                    एवं{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline cursor-pointer"
                    >
                      दायित्व मुक्ति (Zero Owner Liability)
                    </button>{' '}
                    को पढ़ लिया है और मैं उनसे पूर्णतः सहमत हूँ।
                  </>
                ) : (
                  <>
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline cursor-pointer"
                    >
                      Terms & Conditions
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline cursor-pointer"
                    >
                      Zero Owner Liability Policy
                    </button>
                    .
                  </>
                )}
                <span className="text-rose-500 ml-1 font-bold">*</span>
              </span>
            </label>
            {fieldErrors.termsAccepted && (
              <p className="mt-2 text-xs text-rose-500 font-semibold pl-6.5">
                {fieldErrors.termsAccepted}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3.5 px-4 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-1"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{language === 'hi' ? 'खाता बनाया जा रहा है...' : 'Creating Account...'}</span>
              </div>
            ) : (
              <>
                <span>{language === 'hi' ? 'खाता बनाएं' : 'Create Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Link to Sign In */}
        <div className="mt-6 pt-5 border-t border-stone-200/70 dark:border-stone-800 text-center text-xs sm:text-sm text-stone-600 dark:text-stone-400">
          <span>
            {language === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
          </span>
          <Link
            to={`/signin?role=${role}`}
            className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 ml-1 inline-flex items-center gap-1 hover:underline"
          >
            <span>{language === 'hi' ? 'लॉगिन करें' : 'Sign in'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Full Terms, Conditions & Zero-Liability Disclaimer Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true);
          clearFieldError('termsAccepted');
        }}
        isAccepted={termsAccepted}
      />
    </div>
  );
}
