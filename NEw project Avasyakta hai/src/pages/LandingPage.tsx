import { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  HardHat,
  Briefcase,
  ShieldCheck,
  Zap,
  Users,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  PhoneCall,
  MapPin,
  CheckCircle2,
  Sparkles,
  Truck,
  Car,
  PackageCheck,
  Factory,
  Paintbrush,
  Wrench,
  UtensilsCrossed,
  ShoppingBag,
  Droplets,
  X,
  Phone,
  Lock,
  Clock,
  Globe,
  ChevronDown,
  Navigation,
  MessageCircle,
  Map,
  LayoutGrid,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/router';
import { api, type Job, type Profile } from '../hooks/job';
import { formatWage, timeAgo } from '@/lib/format';
import { LocationHierarchyDropdown } from '../components/LocationHierarchyDropdown';
import { HeroWorkerSlider } from '../components/HeroWorkerSlider';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { getDraftField, saveDraft } from '@/lib/draftStorage';
import { InstantAvailableModal } from '../components/InstantAvailableModal';
import { LiveGPSMap } from '../components/LiveGPSMap';
import { VoiceSearchButton } from '../components/VoiceSearchButton';
import {
  getCurrentGPSPosition,
  calculateDistanceKm,
  formatDistance,
  resolveCoordinates,
} from '@/lib/geo';

export function LandingPage() {
  const { profile, session, refreshProfile } = useAuth();
  const { language, t } = useLanguage();
  const { navigate } = useRouter();
  const isLoggedIn = Boolean(session && profile);

  const [stats, setStats] = useState<{
    totalJobs: number;
    byCategory: { _id: string; count: number; appliedCount?: number }[];
    byCity: { _id: string; count: number }[];
  }>({ totalJobs: 0, byCategory: [], byCity: [] });

  const [allOpenJobs, setAllOpenJobs] = useState<Job[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [workerApplications, setWorkerApplications] = useState<any[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<Profile[]>([]);
  const [userWorkerCoords, setUserWorkerCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [detectingWorkerGps, setDetectingWorkerGps] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workerViewMode, setWorkerViewMode] = useState<'cards' | 'map'>('cards');
  const [loading, setLoading] = useState(true);
  const [showAllRoles, setShowAllRoles] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [heroSearch, setHeroSearch] = useState(() => getDraftField('draft_hero_search', 'heroSearch', ''));
  const [heroCity, setHeroCity] = useState(() => getDraftField('draft_hero_search', 'heroCity', ''));

  // Persist search inputs across navigation
  useEffect(() => {
    saveDraft('draft_hero_search', { heroSearch, heroCity });
  }, [heroSearch, heroCity]);

  const cityScrollRef = useRef<HTMLDivElement>(null);

  // Scroll reveal observers for aesthetic section transitions
  const [recentJobsSectionRef, recentJobsRevealed] = useScrollReveal<HTMLElement>();
  const [citiesSectionRef, citiesRevealed] = useScrollReveal<HTMLElement>();
  const [rolesSectionRef, rolesRevealed] = useScrollReveal<HTMLElement>();

  // Fetch real live stats & recent jobs
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [statsData, allJobs, liveWorkers] = await Promise.all([
          api.jobs.getStats(),
          api.jobs.getAll(),
          api.workers.getAvailable().catch(() => []),
        ]);
        if (!active) return;
        if (statsData && statsData.success) {
          setStats(statsData);
        }
        if (allJobs && Array.isArray(allJobs)) {
          const openOnly = allJobs.filter(
            (j) => j.status === 'open' || (j.status as string) === 'active'
          );
          setAllOpenJobs(openOnly);
          setRecentJobs(openOnly.slice(0, 6));
        }
        if (liveWorkers && Array.isArray(liveWorkers)) {
          setAvailableWorkers(liveWorkers);
        }

        // If signed in as worker, fetch their applications to check approval status
        if (profile?.id && profile.role === 'worker') {
          try {
            const apps = await api.applications.getByWorker(profile.id);
            if (active && Array.isArray(apps)) {
              setWorkerApplications(apps);
            }
          } catch (e) {
            console.warn('Failed to load worker applications:', e);
          }
        }
      } catch (err) {
        console.error('Failed to load landing page data:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [profile?.id, profile?.role]);

  // Prevent background page scroll when role details modal is open
  useEffect(() => {
    if (selectedRole) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSelectedRole(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedRole]);

  const scrollCities = (direction: 'left' | 'right') => {
    if (cityScrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      cityScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (heroSearch.trim()) params.set('q', heroSearch.trim());
    if (heroCity.trim()) params.set('location', heroCity.trim());
    navigate(`/jobs${params.toString() ? `?${params.toString()}` : ''}`);
  };


  // Dynamic icon helper for roles
  const getRoleIcon = (cat: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('deliver')) return Truck;
    if (c.includes('driv')) return Car;
    if (c.includes('warehous') || c.includes('logistic')) return PackageCheck;
    if (c.includes('manufactur')) return Factory;
    if (c.includes('peon') || c.includes('office')) return Briefcase;
    if (c.includes('housekeep') || c.includes('clean')) return Sparkles;
    if (c.includes('secur')) return ShieldCheck;
    if (c.includes('paint')) return Paintbrush;
    if (c.includes('labour') || c.includes('helper') || c.includes('construct')) return HardHat;
    if (c.includes('technician')) return Wrench;
    if (c.includes('cook') || c.includes('chef')) return UtensilsCrossed;
    if (c.includes('retail') || c.includes('store')) return ShoppingBag;
    if (c.includes('electric')) return Zap;
    if (c.includes('plumb')) return Droplets;
    return Briefcase;
  };

  // Daily randomized roles: deterministic shuffle based on current date (YYYY-MM-DD)
  const dailyShuffledRoles = useMemo(() => {
    const roles = stats.byCategory || [];
    if (roles.length <= 1) return roles;

    // Daily seed using today's local date
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    let seed = 0;
    for (let i = 0; i < dateKey.length; i++) {
      seed = (seed << 5) - seed + dateKey.charCodeAt(i);
      seed |= 0;
    }
    let s = Math.abs(seed) || 1;

    // Mulberry32 deterministic pseudo-random generator
    const random = () => {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    // Clone array and shuffle using Fisher-Yates algorithm
    const shuffled = [...roles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }, [stats.byCategory]);

  const availableRoles = dailyShuffledRoles;
  const visibleRoles = showAllRoles ? availableRoles : availableRoles.slice(0, 5);
  const availableCities = stats.byCity || [];
  const visibleCities = showAllCities ? availableCities : availableCities.slice(0, 10);

  const features = [
    {
      icon: Briefcase,
      title: t('feature_1_title', 'Post Jobs Free'),
      desc: t('feature_1_desc', 'Employers can post unlimited jobs and reach verified workers in their city within minutes.'),
    },
    {
      icon: HardHat,
      title: t('feature_2_title', 'Direct HR Call'),
      desc: t('feature_2_desc', 'Call employers directly on verified mobile numbers without middleman commissions or fees.'),
    },
    {
      icon: Zap,
      title: t('feature_3_title', 'Instant 1-Click Apply'),
      desc: t('feature_3_desc', 'No heavy resume or paperwork required. Connect directly via WhatsApp or direct call.'),
    },
    {
      icon: ShieldCheck,
      title: t('feature_4_title', '100% Verified Profiles'),
      desc: t('feature_4_desc', 'Every business and candidate is phone-verified for genuine and secure local hiring.'),
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans overflow-x-hidden transition-colors duration-300">
      {/* ========================================================================= */}
      {/* HERO SECTION (Jobhai Style with Floating White Center Card) */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-stone-50 to-white dark:from-emerald-950/20 dark:via-stone-950 dark:to-stone-900 py-12 md:py-20">
        {/* Dynamic sliding background project worker imagery */}
        <HeroWorkerSlider />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          {/* Floating White Card (Jobhai Hero Centerpiece) */}
          <div className="rounded-3xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-8 md:p-12 shadow-2xl shadow-emerald-900/10 dark:shadow-emerald-950/40 border border-stone-100 dark:border-stone-800 ring-1 ring-black/5 dark:ring-white/5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 mb-4">
              <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t('hero_badge', "India's Trusted Direct Hiring Platform")}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              {/* Primary Hindi Conversational Title: Styled to match project's emerald & teal gradient theme */}
              <span className="block text-2xl sm:text-3xl md:text-5xl font-black tracking-tight mb-2">
                <span className="text-emerald-600 dark:text-emerald-400">काम चाहिए</span>{' '}
                <span className="text-stone-400 dark:text-stone-500 font-light text-xl sm:text-2xl md:text-3xl mx-1 sm:mx-2">या</span>{' '}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent">
                  कामवाला <span className="text-emerald-600 dark:text-emerald-400">?</span>
                </span>
              </span>

              {/* Core Brand Action Title */}
              <span className="inline-flex items-center justify-center flex-wrap gap-2 sm:gap-3 text-xl sm:text-2xl md:text-4xl font-extrabold">
                <span className="text-stone-900 dark:text-stone-100">
                  {t('hero_title_1', 'Work | Hire')}
                </span>
                <span className="text-stone-300 dark:text-stone-700 font-light">•</span>
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent">
                  {t('hero_title_connect', 'Connect')}
                </span>
              </span>
            </h1>

            <p className="mt-4 text-base md:text-lg font-medium text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
              {t('hero_subtitle', 'Everything you need to find work or find the right worker.')}
            </p>

            {/* Main Action Button */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/jobs')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-base font-bold px-8 py-3.5 shadow-lg shadow-emerald-600/30 transition duration-200"
              >
                {t('hero_get_job', 'Get a Job Now')}
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() =>
                  navigate(profile ? (profile.role === 'employer' ? '/post-job' : '/jobs') : '/signup?role=employer')
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 dark:border-stone-700 hover:border-emerald-500 bg-stone-50 dark:bg-stone-800/80 hover:bg-emerald-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 hover:text-emerald-800 dark:hover:text-emerald-400 text-sm font-semibold px-6 py-3.5 transition"
              >
                <Briefcase size={16} className="text-emerald-600 dark:text-emerald-400" />
                {t('hero_hire_staff', 'Hire Local Staff (Free)')}
              </button>
            </div>

            {/* Quick Search Bar */}
            <form onSubmit={handleHeroSearch} className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-3.5 text-stone-400 dark:text-stone-500" />
                <input
                  type="text"
                  placeholder={t('hero_search_placeholder', 'Job title, role or skills (e.g. Delivery, Driver, Peon)...')}
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/90 py-3 pl-10 pr-12 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:bg-white dark:focus:bg-stone-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
                <div className="absolute right-2 top-2"> 
                  <VoiceSearchButton
                    size="sm"
                    onResult={(spokenText) => {
                      setHeroSearch(spokenText);
                      // Auto-trigger navigation with spoken keyword
                      const params = new URLSearchParams();
                      if (spokenText.trim()) params.set('q', spokenText.trim());
                      if (heroCity.trim()) params.set('location', heroCity.trim());
                      navigate(`/jobs${params.toString() ? `?${params.toString()}` : ''}`);
                    }}
                  />
                </div>
              </div>

              <div className="relative md:w-56">
                <MapPin size={18} className="absolute left-3.5 top-3.5 text-stone-400 dark:text-stone-500" />
                <input
                  type="text"
                  placeholder={t('hero_city_placeholder', 'City (e.g. Delhi, Bhopal)...')}
                  value={heroCity}
                  onChange={(e) => setHeroCity(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/90 py-3 pl-10 pr-4 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:bg-white dark:focus:bg-stone-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 md:flex-initial rounded-xl bg-stone-900 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white text-sm font-semibold px-6 py-3 transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {t('hero_search_btn', 'Search')}
                </button>

                {/* 📍 Quick Near Me GPS Button in Hero */}
                <button
                  type="button"
                  onClick={() => navigate('/jobs?near_me=true')}
                  className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-sm font-bold px-4 py-3 transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  title={language === 'hi' ? 'जीपीएस द्वारा आस-पास की नौकरियां खोजें' : 'Find jobs near you via GPS'}
                >
                  <Navigation size={16} className="text-emerald-600 dark:text-emerald-400 rotate-45" />
                  <span className="hidden sm:inline">{language === 'hi' ? 'मेरे पास (GPS)' : 'Near Me (GPS)'}</span>
                  <span className="sm:hidden">{language === 'hi' ? 'GPS' : 'GPS'}</span>
                </button>
              </div>
            </form>

            {/* Quick stats pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> {t('hero_pill_free', '100% Free for Workers')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> {t('hero_pill_verified', 'Verified Mobile Numbers')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> {t('hero_pill_calls', 'Direct Interview Calls')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: Live Real Job Openings from Database */}
      {/* ========================================================================= */}
      {recentJobs.length > 0 && (
        <section
          ref={recentJobsSectionRef}
          className={`full-width-hover-section w-full py-14 md:py-20 bg-white dark:bg-stone-950 ${recentJobsRevealed ? 'section-full-entering' : ''
            }`}
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  {t('live_openings_badge', 'Live Openings')}
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                  {t('live_openings_title', 'Latest verified jobs on Abasyakta')}
                </h2>
              </div>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition group"
              >
                <span>{t('browse_all_jobs', 'Browse all jobs')} {stats.totalJobs > 0 ? `(${stats.totalJobs})` : ''}</span>
                <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 pt-4 pb-4">
              {recentJobs.map((job, idx) => (
                <div
                  key={job.id}
                  style={{ animationDelay: `${idx * 70}ms` }}
                  className={`pro-card group flex flex-col justify-between p-5 rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 ${recentJobsRevealed ? 'animate-slide-up' : ''
                    }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="badge bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200/60 dark:border-emerald-800/60 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                        {job.category}
                      </span>
                      <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">{timeAgo(job.created_at)}</span>
                    </div>

                    <Link to={`/jobs/${job.id}`} className="block mt-3">
                      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 line-clamp-1 transition-colors duration-200">
                        {job.title}
                      </h3>
                    </Link>

                    <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    <div className="mt-4 flex flex-col gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                      {job.location && (
                        <span className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 font-medium">
                          <MapPin size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" /> {job.location}
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300 truncate">
                          <Briefcase size={13} className="text-stone-400 shrink-0" />
                          {job.employer?.company_name || job.employer?.full_name || t('direct_employer', 'Direct Employer')}
                        </span>
                        {(job.employer?.is_verified ?? true) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                            ✓ {t('verified_badge', 'Verified')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight">
                      {formatWage(job.wage, job.wage_type)}
                    </span>

                    <Link
                      to={`/jobs/${job.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white dark:hover:text-white px-3.5 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 group/btn shadow-sm"
                    >
                      <span>{t('view_and_apply', 'View & Apply')}</span>
                      <ArrowRight size={13} className="transform group-hover/btn:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION: Instant Available Workers (तत्काल उपलब्ध कारीगर) */}
      {/* ========================================================================= */}
      <section className="w-full py-14 md:py-20 bg-stone-50/70 dark:bg-stone-900/40 border-t border-b border-stone-200/80 dark:border-stone-800/80">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <Zap size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'hi' ? 'तत्काल सेवा (Instant Service)' : 'Instant Service'}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {language === 'hi' ? '⚡ तत्काल उपलब्ध कारीगर (Available Workers)' : '⚡ Instant Available Workers Near You'}
              </h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {language === 'hi'
                  ? 'तुरंत काम शुरू करने के लिए तैयार कामगार — सीधे कॉल करें या WhatsApp पर बात करें'
                  : 'Workers ready for same-day hiring — call directly or connect on WhatsApp'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* View Mode Toggle: Cards vs Live Map */}
              <div className="inline-flex items-center rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setWorkerViewMode('cards')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${workerViewMode === 'cards'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                >
                  <LayoutGrid size={13} />
                  <span>{language === 'hi' ? 'कार्ड्स' : 'Cards'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoggedIn) {
                      navigate('/signin');
                      return;
                    }
                    setWorkerViewMode('map');
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${workerViewMode === 'map'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  title={!isLoggedIn ? (language === 'hi' ? 'लाइव मैप देखने के लिए लॉगिन करें' : 'Sign in to view live map') : undefined}
                >
                  <Map size={13} />
                  <span>{language === 'hi' ? 'लाइव मैप' : 'Live Map'}</span>
                  {!isLoggedIn && <Lock size={11} className="text-stone-400" />}
                </button>
              </div>

              {/* Detect GPS Distance Button */}
              <button
                type="button"
                onClick={async () => {
                  setDetectingWorkerGps(true);
                  try {
                    const pos = await getCurrentGPSPosition();
                    setUserWorkerCoords({ latitude: pos.latitude, longitude: pos.longitude });
                  } catch (e) {
                    console.warn('GPS failed:', e);
                  } finally {
                    setDetectingWorkerGps(false);
                  }
                }}
                disabled={detectingWorkerGps}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 ${userWorkerCoords
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-stone-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-stone-700'
                  }`}
              >
                {detectingWorkerGps ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Navigation size={13} className="rotate-45" />
                )}
                <span>
                  {userWorkerCoords
                    ? language === 'hi'
                      ? '📍 दूरी सक्रिय ✓'
                      : '📍 Distance Active ✓'
                    : language === 'hi'
                      ? '📍 मेरे पास के (GPS)'
                      : '📍 Near Me (GPS)'}
                </span>
              </button>

              {/* Set My Availability shortcut for logged in worker */}
              {profile?.role === 'worker' && (
                <button
                  type="button"
                  onClick={() => setShowWorkerModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Zap size={13} />
                  <span>{language === 'hi' ? 'मेरी उपलब्धता सेट करें' : 'Set My Availability'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Conditional View: Live Map vs Cards Grid */}
          {workerViewMode === 'map' ? (
            <div className="animate-fade-in">
              <LiveGPSMap
                workers={availableWorkers}
                userLocation={userWorkerCoords}
                height="500px"
              />
            </div>
          ) : availableWorkers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 text-center shadow-xs">
              <Zap size={32} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {language === 'hi' ? 'वर्तमान में कोई ऑनलाइन कारीगर नहीं है' : 'No workers are currently marked online'}
              </h3>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                {language === 'hi'
                  ? 'यदि आप एक कामगार हैं, तो अपनी प्रोफाइल से "तत्काल उपलब्ध" चालू करें और सीधे कॉल प्राप्त करें!'
                  : 'If you are a worker, turn on "Instant Available" in your profile to receive direct hirer calls!'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableWorkers.slice(0, 6).map((worker) => {
                let dist = Infinity;
                if (userWorkerCoords) {
                  const coords = resolveCoordinates(worker);
                  if (coords) {
                    dist = calculateDistanceKm(
                      userWorkerCoords.latitude,
                      userWorkerCoords.longitude,
                      coords.latitude,
                      coords.longitude
                    );
                  }
                }

                const cleanPhone = (worker.phone || '').replace(/\D/g, '');

                return (
                  <div
                    key={worker.id}
                    className="card flex flex-col p-5 border border-stone-200 dark:border-stone-800 dark:bg-stone-900 hover:shadow-lg hover:border-emerald-500 transition-all group relative"
                  >
                    {/* Top Row: Avatar & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-base shadow-sm">
                            {worker.avatar_url ? (
                              <img
                                src={worker.avatar_url}
                                alt={worker.full_name}
                                className="h-full w-full rounded-2xl object-cover"
                              />
                            ) : (
                              (worker.full_name || 'W').charAt(0).toUpperCase()
                            )}
                          </span>
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-stone-900">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-stone-900"></span>
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-base">
                            <span>{worker.full_name}</span>
                            {worker.is_verified && (
                              <span className="text-emerald-600 text-xs font-bold" title="Verified Worker">
                                ✓
                              </span>
                            )}
                          </h3>
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            {worker.primary_skill || (worker.skills ? worker.skills.split(',')[0] : 'General Worker')}
                          </span>
                        </div>
                      </div>

                      {/* Online Pulse Badge */}
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{language === 'hi' ? 'उपलब्ध' : 'Ready'}</span>
                      </span>
                    </div>

                    {/* Status note */}
                    {worker.available_status_text && (
                      <p className="mt-3 text-xs italic text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-800">
                        "{worker.available_status_text}"
                      </p>
                    )}

                    {/* Location & Distance */}
                    <div className="mt-3 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={13} className="text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {isLoggedIn ? (worker.location || 'India') : `${(worker.location || 'India').split(',')[0]} ••••••`}
                        </span>
                      </span>

                      {dist !== Infinity && (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                          <Navigation size={10} className="rotate-45" />
                          <span>{formatDistance(dist, language)}</span>
                        </span>
                      )}
                    </div>

                    {/* Direct Contact Buttons */}
                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
                      {!isLoggedIn ? (
                        <button
                          type="button"
                          onClick={() => navigate('/signin')}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-100 hover:bg-emerald-50 dark:bg-stone-800 dark:hover:bg-emerald-950/80 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-300 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <Lock size={13} className="text-stone-400" />
                          <span>{language === 'hi' ? 'संपर्क व रास्ता देखने के लिए लॉगिन करें 🔒' : 'Sign in to Contact & Navigate 🔒'}</span>
                        </button>
                      ) : cleanPhone ? (
                        <>
                          <a
                            href={`tel:${cleanPhone}`}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 text-white py-2 text-xs font-bold transition shadow-xs"
                          >
                            <Phone size={13} />
                            <span>{language === 'hi' ? 'कॉल करें' : 'Call'}</span>
                          </a>

                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                              language === 'hi'
                                ? `नमस्ते ${worker.full_name}, मैंने आवश्यकता है पर आपकी प्रोफाइल देखी। क्या आप काम के लिए उपलब्ध हैं?`
                                : `Hello ${worker.full_name}, I saw your profile on Avashyakta Hai. Are you available for work?`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-xs font-bold transition shadow-xs shadow-emerald-600/20"
                          >
                            <MessageCircle size={13} />
                            <span>WhatsApp</span>
                          </a>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate('/signin')}
                          className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 text-white py-2 text-xs font-bold"
                        >
                          {language === 'hi' ? 'संपर्क करने के लिए लॉगिन करें' : 'Login to Contact'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: Explore Jobs by City (Live Recruiter Postings - No Dummy Data) */}
      {/* ========================================================================= */}
      <section
        ref={citiesSectionRef}
        className={`full-width-hover-section w-full py-14 md:py-20 bg-stone-50/80 dark:bg-stone-900/60 ${citiesRevealed ? 'section-full-entering' : ''
          }`}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 mb-2">
                <MapPin size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t('cities_badge', 'Real Local Hiring')}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {t('cities_title', 'Explore Jobs by City')}
              </h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {t('cities_sub', 'Direct openings posted by verified recruiters across active cities')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className={`inline-flex items-center gap-2 rounded-2xl text-xs sm:text-sm font-bold px-4 py-2.5 transition active:scale-95 shadow-sm border ${showLocationDropdown
                    ? 'bg-stone-900 dark:bg-emerald-700 text-white border-stone-900 dark:border-emerald-700 shadow-stone-900/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/20'
                  }`}
                id="location-filter-btn"
              >
                <Globe size={16} className={showLocationDropdown ? 'text-emerald-400 dark:text-emerald-200' : 'text-emerald-100'} />
                <span>{t('filter_by_state_city', 'Filter by State & City')}</span>
                <ChevronDown size={15} className={`transition-transform duration-200 ${showLocationDropdown ? 'rotate-180' : ''}`} />
              </button>

              {availableCities.length > 5 && !showAllCities && (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => scrollCities('left')}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition shadow-sm"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => scrollCities('right')}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition shadow-sm"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Regional Location Hierarchy Filter Dropdown */}
          <LocationHierarchyDropdown
            isOpen={showLocationDropdown}
            onClose={() => setShowLocationDropdown(false)}
            allJobs={allOpenJobs}
            availableCities={availableCities}
            onSearch={(targetLocation) => {
              if (targetLocation) {
                navigate(`/jobs?location=${encodeURIComponent(targetLocation)}`);
              } else {
                navigate('/jobs');
              }
            }}
          />

          {/* Cities list or empty state */}
          {availableCities.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-10 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <MapPin size={24} />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">No active city job posts yet</h3>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                Be the first recruiter to post jobs and get your city featured on the homepage!
              </p>
              <button
                onClick={() =>
                  navigate(profile ? (profile.role === 'employer' ? '/post-job' : '/jobs') : '/signup?role=employer')
                }
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
              >
                <Briefcase size={14} />
                {t('cta_post_job', 'Post a Job for Free')}
              </button>
            </div>
          ) : (
            <div
              ref={cityScrollRef}
              className={`${showAllCities
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4'
                  : 'flex gap-4 overflow-x-auto pt-6 pb-6 px-1 scrollbar-none snap-x'
                }`}
            >
              {visibleCities.map((city, idx) => (
                <div
                  key={city._id}
                  style={{ animationDelay: `${Math.min(idx, 9) * 60}ms` }}
                  onClick={() => navigate(`/jobs?location=${encodeURIComponent(city._id)}`)}
                  className={`pro-card group cursor-pointer rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 transition-all duration-300 hover:border-emerald-500 hover:shadow-xl flex flex-col justify-between ${citiesRevealed ? 'animate-slide-up' : ''
                    } ${showAllCities ? 'w-full' : 'w-48 sm:w-52 shrink-0 snap-start'}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="pro-icon-box flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-sm">
                        <MapPin size={18} />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition truncate">
                      {city._id}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {city.count} {city.count === 1 ? t('job_opening_single', 'Job Opening') : t('job_opening_plural', 'Job Openings')}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-400 dark:text-stone-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    <span className="font-semibold">{t('explore_jobs', 'Explore Jobs')}</span>
                    <ChevronRight size={14} className="transform group-hover:translate-x-1.5 transition-transform duration-200" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {availableCities.length > 10 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowAllCities(!showAllCities)}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-600/60 bg-white dark:bg-stone-800 px-6 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-stone-700 transition active:scale-95 shadow-sm hover:shadow-md"
              >
                {showAllCities ? t('show_fewer_cities', 'Show fewer cities') : (language === 'hi' ? `सभी ${availableCities.length} शहर देखें` : `View all ${availableCities.length} cities`)}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: "What kind of a role do you want?" (Real Dynamic Categories) */}
      {/* ========================================================================= */}
      <section
        ref={rolesSectionRef}
        className={`full-width-hover-section w-full py-14 md:py-20 bg-white dark:bg-stone-950 ${rolesRevealed ? 'section-full-entering' : ''
          }`}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 mb-2">
              <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t('roles_badge', 'Real Verified Job Roles')}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              {t('roles_title', 'What kind of a role do you want?')}
            </h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
              {t('roles_sub', 'Select your job profile to directly view live vacancies across active roles')}
            </p>
          </div>

          {/* Grid of Real Job Roles (No Dummy Data, No Images) */}
          {availableRoles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 p-10 text-center">
              <Briefcase size={32} className="mx-auto text-stone-400 mb-2" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No active job roles posted yet</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Recruiters can post jobs to feature job roles on this section.</p>
              <button
                onClick={() =>
                  navigate(profile ? (profile.role === 'employer' ? '/post-job' : '/jobs') : '/signup?role=employer')
                }
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                Post Job for Free
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5 pt-4 pb-4">
              {visibleRoles.map((role, idx) => {
                const IconComponent = getRoleIcon(role._id);
                return (
                  <div
                    key={role._id}
                    style={{ animationDelay: `${idx * 70}ms` }}
                    onClick={() => setSelectedRole(role._id)}
                    className={`pro-card group cursor-pointer rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 transition-all duration-300 hover:border-emerald-500 hover:shadow-xl flex flex-col justify-between ${rolesRevealed ? 'animate-slide-up' : ''
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="pro-icon-box flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-sm">
                          <IconComponent size={20} />
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition line-clamp-1">
                        {role._id}
                      </h3>

                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {role.count} {role.count === 1 ? (language === 'hi' ? 'रिक्ति' : 'Opening') : (language === 'hi' ? 'रिक्तियां' : 'Openings')}
                        </p>
                        <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1">
                          <Users size={11} className="text-stone-400" />
                          {role.appliedCount && role.appliedCount > 0
                            ? `${role.appliedCount} ${role.appliedCount === 1 ? t('roles_worker_applied', 'Worker Applied') : t('roles_workers_applied', 'Workers Applied')}`
                            : (language === 'hi' ? '0 श्रमिकों ने आवेदन किया' : '0 Workers Applied')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-400 dark:text-stone-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      <span className="font-semibold">{t('view_full_details', 'View Full Details')}</span>
                      <ChevronRight size={14} className="transform group-hover:translate-x-1.5 transition-transform duration-200" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {availableRoles.length > 5 && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setShowAllRoles(!showAllRoles)}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-600/60 bg-white dark:bg-stone-800 px-6 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-stone-700 transition active:scale-95 shadow-sm hover:shadow-md"
              >
                {showAllRoles ? t('show_fewer_roles', 'Show fewer roles') : (language === 'hi' ? `सभी ${availableRoles.length} कार्य प्रोफाइल्स देखें` : `Show all ${availableRoles.length} job roles`)}
              </button>
            </div>
          )}
        </div>
      </section>



      {/* ========================================================================= */}
      {/* SECTION 4: Why Abasyakta / Built for Both Sides */}
      {/* ========================================================================= */}
      <section className="full-width-hover-section w-full py-14 md:py-20 bg-stone-100 dark:bg-stone-900/70">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
              {t('features_title', 'Built for both sides')}
            </h2>
            <p className="mt-2 text-stone-500 dark:text-stone-400">
              {t('features_sub', 'Everything you need to hire staff or get high-paying local work.')}
            </p>
          </div>


          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="card p-6 bg-white dark:bg-stone-900 transition hover:shadow-md">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <f.icon size={22} />
                </span>
                <h3 className="mt-4 text-base font-bold text-stone-900 dark:text-stone-100">{f.title}</h3>
                <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl bg-white dark:bg-stone-900 p-6 md:p-8 shadow-sm border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <HardHat size={22} />
                <h3 className="text-lg font-bold">{t('guide_workers_title', 'For Workers')}</h3>
              </div>
              <ol className="mt-5 space-y-4">
                {[
                  t('guide_workers_step_1', 'Create your free account and select your skill category.'),
                  t('guide_workers_step_2', 'Browse verified openings in your city or neighborhood.'),
                  t('guide_workers_step_3', 'Directly call HR or apply with 1-click to schedule an interview.'),
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-stone-700 dark:text-stone-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl bg-white dark:bg-stone-900 p-6 md:p-8 shadow-sm border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Users size={22} />
                <h3 className="text-lg font-bold">{t('guide_employers_title', 'For Employers')}</h3>
              </div>
              <ol className="mt-5 space-y-4">
                {[
                  t('guide_employers_step_1', 'Employer account banayein (Free registration).'),
                  t('guide_employers_step_2', 'Job role, required workers, salary aur location post karein.'),
                  t('guide_employers_step_3', 'Nearby verified candidates ki call aur application receive karein.'),
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-stone-700 dark:text-stone-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL CTA BANNER */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-stone-900 px-6 py-12 text-center text-white shadow-xl">
          <h2 className="text-2xl md:text-4xl font-extrabold">{t('cta_title', 'Ready to get started?')}</h2>
          <p className="mx-auto mt-2 max-w-md text-emerald-100 text-sm md:text-base">
            {t('cta_desc', 'Join Abasyakta today. Free for workers, fast for employers.')}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate(profile ? '/jobs' : '/signup?role=worker')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-900 shadow-md hover:bg-emerald-50 transition active:scale-95"
            >
              {profile ? t('nav_browse_jobs', 'Browse Jobs') : t('cta_register_worker', 'Register as Worker')}
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate(profile ? '/post-job' : '/signup?role=employer')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-emerald-950/40 px-6 py-3 text-sm font-bold text-white backdrop-blur hover:bg-emerald-950/70 transition active:scale-95"
            >
              <Briefcase size={16} />
              {t('cta_post_job', 'Post a Job for Free')}
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ROLE DETAILS MODAL (Real Details of Jobs in Clicked Role) */}
      {/* ========================================================================= */}
      {selectedRole && typeof document !== 'undefined' && createPortal(
        (() => {
          const roleJobs = allOpenJobs.filter((j) =>
            (j.category || '').toLowerCase() === selectedRole.toLowerCase() ||
            (j.category || '').toLowerCase().includes(selectedRole.toLowerCase())
          );
          const selectedRoleStats = availableRoles.find(
            (r) => r._id.toLowerCase() === selectedRole.toLowerCase()
          );

          return (
            <div
              onClick={() => setSelectedRole(null)}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
              style={{ margin: 0 }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl md:max-w-3xl max-h-[82vh] bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col min-h-0 overflow-hidden text-stone-900 dark:text-stone-100"
              >
                {/* Modal Header */}
                <div className="shrink-0 p-5 md:p-6 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between bg-stone-50/80 dark:bg-stone-900/90">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 mb-2">
                      <Briefcase size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Real Verified Openings</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
                      {selectedRole} Openings
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-xs font-medium text-stone-500 dark:text-stone-400">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {selectedRoleStats?.count || roleJobs.length} {((selectedRoleStats?.count || roleJobs.length) === 1) ? 'Active Opening' : 'Active Openings'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-stone-600 dark:text-stone-300 font-semibold">
                        <Users size={13} className="text-emerald-600 dark:text-emerald-400" />
                        {selectedRoleStats?.appliedCount || 0} {selectedRoleStats?.appliedCount === 1 ? 'Worker Applied' : 'Workers Applied'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedRole(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-white transition active:scale-95"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body - Jobs List with Full Details & Scroll */}
                <div className="flex-1 min-h-0 overflow-y-auto p-5 md:p-6 pb-8 md:pb-8 space-y-4 divide-y divide-stone-100 dark:divide-stone-800 overscroll-contain">
                  {roleJobs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 mb-3">
                        <Briefcase size={28} />
                      </div>
                      <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">No active job listings for this role right now</h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm">Check back soon or explore other active categories across our platform.</p>
                      <button
                        onClick={() => {
                          setSelectedRole(null);
                          navigate('/jobs');
                        }}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                      >
                        Browse All Jobs <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    roleJobs.map((job) => (
                      <div key={job.id} className="pt-5 first:pt-0 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition">
                              {job.title}
                            </h4>
                            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-0.5">
                              Posted by <span className="font-semibold text-stone-700 dark:text-stone-300">{job.employer?.company_name || job.employer?.full_name || 'Verified Employer'}</span>
                              {job.employer?.is_verified && (
                                <span className="ml-1.5 inline-flex items-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/50">
                                  ✓ Verified
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="inline-block rounded-xl bg-emerald-50 dark:bg-emerald-950/70 px-3 py-1.5 text-sm font-extrabold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                              {formatWage(job.wage, job.wage_type)}
                            </span>
                          </div>
                        </div>

                        {/* Location & Address */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-stone-400">
                          {job.location && (
                            <span className="flex items-center gap-1 font-medium text-stone-700 dark:text-stone-300">
                              <MapPin size={13} className="text-emerald-600 dark:text-emerald-400" /> {job.location}
                            </span>
                          )}
                          {job.address && (
                            <span className="text-stone-400 dark:text-stone-500">({job.address})</span>
                          )}
                        </div>

                        {/* Description */}
                        {job.description && (
                          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/70 p-3.5 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
                            {job.description}
                          </p>
                        )}

                        {/* Task Details */}
                        {job.task_details && (
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            <strong className="text-stone-700 dark:text-stone-300">Work Duties / Tasks:</strong> {job.task_details}
                          </p>
                        )}

                        {/* Action Buttons with Strict Approval & Role Permissions */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-2">
                          {/* 1. APPLY BUTTON LOGIC */}
                          {!profile ? (
                            // Not signed in -> Must sign in as worker to apply
                            <button
                              onClick={() => {
                                setSelectedRole(null);
                                navigate('/signin');
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 dark:border-emerald-500 bg-white dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-stone-700 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-4 py-2 transition shadow-sm"
                            >
                              Sign in as Worker to Apply <ArrowRight size={13} />
                            </button>
                          ) : profile.role === 'worker' ? (
                            // Signed in as worker -> Check if already applied
                            (() => {
                              const workerApp = workerApplications.find((app) => {
                                const appId = app.job_id || app.job?.id || app.job?._id || app.jobId;
                                return appId && String(appId) === String(job.id);
                              });

                              if (workerApp) {
                                const isAccepted = workerApp.status === 'accepted';
                                const isRejected = workerApp.status === 'rejected';
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${isAccepted
                                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                        : isRejected
                                          ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                          : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                      }`}
                                  >
                                    {isAccepted
                                      ? '✓ Application Approved'
                                      : isRejected
                                        ? 'Application Rejected'
                                        : '✓ Applied (Under Review)'}
                                  </span>
                                );
                              }

                              return (
                                <button
                                  onClick={() => {
                                    setSelectedRole(null);
                                    navigate(`/jobs/${job.id}`);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 transition shadow-sm"
                                >
                                  Apply for this Job <ArrowRight size={13} />
                                </button>
                              );
                            })()
                          ) : (
                            // Recruiter / Employer -> Do not show apply button
                            <span className="text-xs text-stone-400 font-medium italic">
                              Recruiter View
                            </span>
                          )}

                          {/* 2. RECRUITER PHONE NUMBER (Only visible after application is APPROVED) */}
                          {(() => {
                            const workerApp = workerApplications.find((app) => {
                              const appId = app.job_id || app.job?.id || app.job?._id || app.jobId;
                              return appId && String(appId) === String(job.id);
                            });

                            const isApproved = workerApp?.status === 'accepted';
                            const isPending = workerApp?.status === 'pending';

                            if (isApproved && job.phone) {
                              return (
                                <a
                                  href={`tel:${job.phone}`}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 transition shadow-sm"
                                >
                                  <Phone size={13} />
                                  Call HR ({job.phone})
                                </a>
                              );
                            }

                            if (isPending) {
                              return (
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800/70 text-amber-800 dark:text-amber-300 text-xs font-medium px-3 py-1.5">
                                  <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                                  Application Pending — HR phone unlocked upon approval
                                </span>
                              );
                            }

                            // If not approved yet (not applied or not logged in)
                            return (
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-xs font-medium px-3 py-1.5">
                                <Lock size={13} className="text-stone-400" />
                                HR phone unlocked after application approval
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Modal Footer */}
                <div className="shrink-0 px-5 py-4 md:px-6 md:py-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const r = selectedRole;
                      setSelectedRole(null);
                      navigate(`/jobs?category=${encodeURIComponent(r)}`);
                    }}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    Browse all {selectedRole} jobs on Jobs Page <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })(),
        document.body
      )}

      {/* Instant Available Modal */}
      <InstantAvailableModal
        isOpen={showWorkerModal}
        onClose={() => setShowWorkerModal(false)}
        profile={profile}
        onUpdated={async () => {
          await refreshProfile();
          const liveWorkers = await api.workers.getAvailable().catch(() => []);
          if (Array.isArray(liveWorkers)) setAvailableWorkers(liveWorkers);
        }}
      />
    </div>
  );
}
