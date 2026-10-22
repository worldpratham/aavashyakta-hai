import { useState } from 'react';
import { Menu, X, Briefcase, User, LogOut, Plus, Search, Sun, Moon, Globe, ShieldAlert, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/router';
import { isAdminUser } from '@/lib/api';
import { InstantAvailableModal } from './InstantAvailableModal';

export function Header() {
  const { profile, signOut, refreshProfile } = useAuth();
  const isAdmin = isAdminUser(profile);
  const { theme, isDark, toggleTheme } = useTheme();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const { pathname, navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const [showAvailableModal, setShowAvailableModal] = useState(false);

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
        pathname === to
          ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60'
          : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white'
      }`}
    >
      {label}
    </Link>
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 dark:border-stone-800 dark:bg-stone-900/90 backdrop-blur transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-emerald-700 dark:text-emerald-400">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <Briefcase size={18} />
          </span>
          {t('brand_name', 'Abasyakta')}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLink('/jobs', t('nav_browse_jobs', 'Browse Jobs'))}
          {profile?.role === 'employer' && navLink('/post-job', t('nav_post_job', 'Post a Job'))}
          {profile?.role === 'employer' && navLink('/my-jobs', t('nav_my_jobs', 'My Jobs'))}
          {profile?.role === 'worker' && navLink('/my-applications', t('nav_my_applications', 'My Applications'))}
          {profile && navLink('/profile', t('nav_profile', 'Profile'))}
          {isAdmin && (
            <Link
              to="/admin"
              id="navbar-admin-link"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
                pathname === '/admin'
                  ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400'
                  : 'bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900'
              }`}
            >
              <ShieldAlert size={14} className={pathname === '/admin' ? 'text-white' : 'text-purple-600 dark:text-purple-400'} />
              <span>{language === 'hi' ? '🛡️ मैनेजर पैनल' : '🛡️ Manager Panel'}</span>
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          {/* Language Switcher (EN | हिंदी) Segmented Pill */}
          <div
            id="navbar-language-switcher"
            className="inline-flex items-center gap-0.5 rounded-full border border-stone-300 dark:border-stone-700 bg-stone-100/90 dark:bg-stone-800/90 p-0.5 text-xs font-semibold shadow-sm"
          >
            <span className="pl-2 pr-1 text-stone-500 dark:text-stone-400" title={language === 'en' ? 'Language' : 'भाषा'}>
              <Globe size={13} className="text-emerald-600 dark:text-emerald-400" />
            </span>
            <button
              type="button"
              id="lang-btn-en"
              onClick={() => setLanguage('en')}
              aria-label="Switch to English"
              title="English"
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-200 cursor-pointer ${
                language === 'en'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              id="lang-btn-hi"
              onClick={() => setLanguage('hi')}
              aria-label="हिंदी में बदलें"
              title="हिंदी (Hindi)"
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-200 cursor-pointer ${
                language === 'hi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Mode Switch Toggle Button with sliding track and clear label */}
          <button
            type="button"
            id="navbar-theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={isDark ? (language === 'hi' ? 'लाइट मोड में बदलें' : 'Switch to Light Mode') : (language === 'hi' ? 'डार्क मोड में बदलें' : 'Switch to Dark Mode')}
            className="group relative inline-flex items-center gap-2 rounded-full border border-stone-300 dark:border-stone-700 bg-stone-100/90 dark:bg-stone-800/90 py-1.5 pl-2 pr-3 text-xs font-bold text-stone-800 dark:text-stone-100 shadow-sm transition-all duration-300 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow active:scale-95 cursor-pointer"
          >
            {/* Sliding Switch Capsule Track */}
            <span
              className={`relative flex h-5 w-9 items-center rounded-full p-0.5 transition-colors duration-300 ${
                isDark ? 'bg-emerald-600' : 'bg-stone-300'
              }`}
            >
              <span
                className={`flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${
                  isDark ? 'translate-x-4 bg-stone-900' : 'translate-x-0 bg-white'
                }`}
              >
                {isDark ? (
                  <Sun size={10} className="text-amber-400 transform rotate-0 transition-transform" />
                ) : (
                  <Moon size={10} className="text-stone-700 transform -rotate-12 transition-transform" />
                )}
              </span>
            </span>

            {/* Clear Mode Label */}
            <span className="select-none tracking-tight">
              {isDark ? (language === 'hi' ? 'लाइट मोड' : 'Light Mode') : (language === 'hi' ? 'डार्क मोड' : 'Dark Mode')}
            </span>
          </button>

          {!profile ? (
            <>
              <Link to="/signin" className="btn-ghost">{t('nav_sign_in', 'Sign in')}</Link>
              <Link to="/signup?role=worker" className="btn-secondary text-xs font-semibold">{t('nav_find_work', '👷 Find Work')}</Link>
              <Link to="/signup?role=employer" className="btn-primary text-xs font-semibold flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800">
                <Briefcase size={14} /> {t('nav_hire_workers', 'Hire Workers')}
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Instant Available live toggle pill button for Workers */}
              {profile.role === 'worker' && (
                <button
                  type="button"
                  id="navbar-worker-instant-available-btn"
                  onClick={() => setShowAvailableModal(true)}
                  title={
                    profile.is_available_now
                      ? language === 'hi'
                        ? '🟢 आप तत्काल काम के लिए लाइव हैं - बदलने के लिए क्लिक करें'
                        : '🟢 You are live for instant hire - click to change'
                      : language === 'hi'
                      ? '⚪ आप ऑफलाइन हैं - लाइव होने के लिए क्लिक करें'
                      : '⚪ You are offline - click to go live'
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 ${
                    profile.is_available_now
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 shadow-emerald-500/10'
                      : 'bg-stone-100 text-stone-600 border border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span className="relative flex h-2.5 w-2.5">
                    {profile.is_available_now && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        profile.is_available_now ? 'bg-emerald-500' : 'bg-stone-400'
                      }`}
                    ></span>
                  </span>
                  <span>
                    {profile.is_available_now
                      ? language === 'hi'
                        ? 'तत्काल उपलब्ध'
                        : 'Instant Available'
                      : language === 'hi'
                      ? 'ऑफलाइन'
                      : 'Offline'}
                  </span>
                </button>
              )}
              <div className="flex items-center gap-2 rounded-full bg-stone-100 dark:bg-stone-800 py-1 pl-1 pr-3 border border-stone-200 dark:border-stone-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm">
                  {profile.full_name.charAt(0).toUpperCase()}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                    {profile.company_name || profile.full_name.split(' ')[0]}
                    {profile.is_verified && (
                      <span className="inline-flex items-center text-emerald-600 font-bold text-[10px]" title="Verified User">
                        ✓
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 capitalize leading-none">
                    {profile.role === 'employer' ? (language === 'hi' ? 'नियोक्ता' : 'Recruiter') : (language === 'hi' ? 'कामगार' : 'Worker')}
                  </span>
                </div>
              </div>
              <button onClick={handleSignOut} className="btn-ghost text-stone-500 hover:text-red-600 dark:hover:text-red-400" title={t('nav_sign_out', 'Sign out')}>
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile top bar language toggle button */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Switch Language"
            title={language === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
            className="inline-flex items-center gap-1 rounded-full border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 py-1 px-2.5 text-xs font-bold text-stone-800 dark:text-stone-100 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Globe size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold">{language === 'en' ? 'हिंदी' : 'EN'}</span>
          </button>

          {/* Mobile top bar theme toggle button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 py-1 px-2.5 text-xs font-bold text-stone-800 dark:text-stone-100 shadow-sm transition active:scale-95"
          >
            {isDark ? (
              <>
                <Sun size={13} className="text-amber-400" />
                <span className="text-[11px]">Light</span>
              </>
            ) : (
              <>
                <Moon size={13} className="text-stone-700 dark:text-stone-300" />
                <span className="text-[11px]">Dark</span>
              </>
            )}
          </button>
          <button className="p-1 text-stone-700 dark:text-stone-200" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 px-4 py-3 md:hidden transition-colors duration-300">
          <nav className="flex flex-col gap-1">
            {/* Language Switch inside mobile drawer */}
            <div className="mb-2 flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700">
              <span className="flex items-center gap-2">
                <Globe size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'hi' ? 'भाषा चुनें' : 'Language'}</span>
              </span>
              <div className="inline-flex items-center rounded-lg bg-stone-200 dark:bg-stone-700 p-0.5">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                    language === 'en' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-300'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                    language === 'hi' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-300'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>

            {/* Mode switch inside mobile drawer */}
            <button
              type="button"
              onClick={() => {
                toggleTheme();
              }}
              className="mb-2 flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 transition active:scale-95 border border-stone-200 dark:border-stone-700"
            >
              <span className="flex items-center gap-2">
                {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-stone-700" />}
                <span>{isDark ? (language === 'hi' ? 'लाइट मोड में बदलें' : 'Switch to Light Mode') : (language === 'hi' ? 'डार्क मोड में बदलें' : 'Switch to Dark Mode')}</span>
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {isDark ? (language === 'hi' ? 'डार्क सक्रिय' : 'Dark Active') : (language === 'hi' ? 'लाइट सक्रिय' : 'Light Active')}
              </span>
            </button>

            {/* Mobile Instant Available toggle for Workers */}
            {profile?.role === 'worker' && (
              <button
                type="button"
                onClick={() => {
                  setShowAvailableModal(true);
                  setOpen(false);
                }}
                className="mb-2 flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 transition active:scale-95 border border-emerald-300 dark:border-emerald-700 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    {profile.is_available_now && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        profile.is_available_now ? 'bg-emerald-500' : 'bg-stone-400'
                      }`}
                    ></span>
                  </span>
                  <span>
                    {language === 'hi' ? 'तत्काल उपलब्धता (Instant Available)' : 'Instant Availability'}
                  </span>
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    profile.is_available_now
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
                  }`}
                >
                  {profile.is_available_now
                    ? language === 'hi'
                      ? 'ऑनलाइन 🟢'
                      : 'ONLINE 🟢'
                    : language === 'hi'
                    ? 'ऑफलाइन ⚪'
                    : 'OFFLINE ⚪'}
                </span>
              </button>
            )}

            <Link to="/jobs" className="btn-ghost justify-start" onClick={() => setOpen(false)}>
              <Search size={16} /> {t('nav_browse_jobs', 'Browse Jobs')}
            </Link>
            {profile?.role === 'employer' && (
              <>
                <Link to="/post-job" className="btn-ghost justify-start" onClick={() => setOpen(false)}>
                  <Plus size={16} /> {t('nav_post_job', 'Post a Job')}
                </Link>
                <Link to="/my-jobs" className="btn-ghost justify-start" onClick={() => setOpen(false)}>
                  <Briefcase size={16} /> {t('nav_my_jobs', 'My Jobs')}
                </Link>
              </>
            )}
            {profile?.role === 'worker' && (
              <Link to="/my-applications" className="btn-ghost justify-start" onClick={() => setOpen(false)}>
                <Briefcase size={16} /> {t('nav_my_applications', 'My Applications')}
              </Link>
            )}
            {profile && (
              <Link to="/profile" className="btn-ghost justify-start" onClick={() => setOpen(false)}>
                <User size={16} /> {t('nav_profile', 'Profile')}
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                onClick={() => setOpen(false)}
              >
                <ShieldAlert size={16} className="text-purple-600 dark:text-purple-400" />
                <span>{language === 'hi' ? '🛡️ मैनेजर पैनल' : '🛡️ Manager Panel'}</span>
              </Link>
            )}
            {!profile ? (
              <div className="mt-3 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/signup?role=worker"
                    className="btn-secondary text-xs font-semibold text-center"
                    onClick={() => setOpen(false)}
                  >
                    {t('nav_find_work', '👷 Find Work')}
                  </Link>
                  <Link
                    to="/signup?role=employer"
                    className="btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800"
                    onClick={() => setOpen(false)}
                  >
                    <Briefcase size={14} /> {t('nav_hire_workers', 'Hire Workers')}
                  </Link>
                </div>
                <Link
                  to="/signin"
                  className="btn-ghost text-center text-xs py-2 text-stone-600 dark:text-stone-300"
                  onClick={() => setOpen(false)}
                >
                  {t('nav_sign_in', 'Sign in')}
                </Link>
              </div>
            ) : (
              <button onClick={handleSignOut} className="btn-secondary mt-2 justify-start">
                <LogOut size={16} /> {t('nav_sign_out', 'Sign out')}
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Instant Availability Modal for Workers */}
      <InstantAvailableModal
        isOpen={showAvailableModal}
        onClose={() => setShowAvailableModal(false)}
        profile={profile}
        onUpdated={async () => {
          await refreshProfile();
        }}
      />
    </header>
  );
}
