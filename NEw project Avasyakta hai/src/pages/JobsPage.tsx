import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  Loader2,
  Inbox,
  Navigation,
  X,
  Compass,
  MessageCircle,
  Phone,
  CheckCircle2,
  Sparkles,
  Map,
  LayoutGrid,
  Lock,
} from 'lucide-react';
import { api, type Job, JOB_CATEGORIES } from '../hooks/job';
import { formatWage, timeAgo } from '@/lib/format';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Link, useRouter } from '@/router';
import { getDraftField, saveDraft } from '@/lib/draftStorage';
import { LiveGPSMap } from '@/components/LiveGPSMap';
import { VoiceSearchButton } from '@/components/VoiceSearchButton';
import { matchesBilingualJob, isSameCategoryBilingual } from '@/lib/bilingualSearch';
import {
  getCurrentGPSPosition,
  calculateDistanceKm,
  formatDistance,
  resolveCoordinates,
  getDirectionsUrl,
  type Coordinates,
} from '@/lib/geo';

const JOBS_FILTER_KEY = 'draft_jobs_filter';

export function JobsPage() {
  const { search, navigate } = useRouter();
  const { language, t } = useLanguage();
  const { profile, session } = useAuth();
  const isLoggedIn = Boolean(session && profile);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(() => getDraftField(JOBS_FILTER_KEY, 'query', ''));
  const [category, setCategory] = useState(() => getDraftField(JOBS_FILTER_KEY, 'category', ''));
  const [location, setLocation] = useState(() => getDraftField(JOBS_FILTER_KEY, 'location', ''));

  // GPS "Near Me" States
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [userLocality, setUserLocality] = useState<string | null>(null);
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(0); // 0 = all distances
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Save filters across navigation
  useEffect(() => {
    saveDraft(JOBS_FILTER_KEY, { query, category, location });
  }, [query, category, location]);

  // Read URL query params on navigation
  useEffect(() => {
    if (!search) return;
    const params = new URLSearchParams(search);
    const cat = params.get('category');
    const loc = params.get('location');
    const q = params.get('q') || params.get('search');
    const nearMe = params.get('near_me') || params.get('gps');

    if (cat !== null) setCategory(cat);
    if (loc !== null) setLocation(loc);
    if (q !== null) setQuery(q);

    if (nearMe === 'true') {
      handleEnableNearMe();
    }
  }, [search]);

  // Fetch jobs from backend
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const allJobs = await api.jobs.getAll();
        if (!active) return;
        const openJobs = allJobs.filter(
          (j) => j.status === 'open' || (j.status as string) === 'active'
        );
        setJobs(openJobs);
      } catch (err) {
        console.error('Failed to load jobs from backend:', err);
        if (active) {
          setJobs([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // GPS "Near Me" Trigger
  const handleEnableNearMe = async () => {
    setDetectingGps(true);
    setGpsError(null);
    try {
      const pos = await getCurrentGPSPosition();
      setUserCoords({
        latitude: pos.latitude,
        longitude: pos.longitude,
      });
      const name = pos.cityName || '';
      setUserLocality(name);
      setIsNearMeActive(true);
    } catch (err: any) {
      console.warn('Near Me GPS failed:', err);
      setGpsError(
        err?.message ||
          (language === 'hi'
            ? 'जीपीएस स्थान प्राप्त नहीं हो सका। कृपया लोकेशन अनुमति दें।'
            : 'Could not access GPS location. Please allow location permission.')
      );
    } finally {
      setDetectingGps(false);
    }
  };

  const handleClearNearMe = () => {
    setIsNearMeActive(false);
    setUserCoords(null);
    setUserLocality(null);
    setRadiusKm(0);
    setGpsError(null);
  };

  // Filter and sort jobs (including GPS distance calculation)
  const filteredAndSorted = useMemo(() => {
    const listWithDistance = jobs.map((j) => {
      let distanceKm = Infinity;
      if (userCoords) {
        const coords = resolveCoordinates(j);
        if (coords) {
          distanceKm = calculateDistanceKm(
            userCoords.latitude,
            userCoords.longitude,
            coords.latitude,
            coords.longitude
          );
        }
      }
      return {
        job: j,
        distanceKm,
      };
    });

    // Apply standard filters
    const filtered = listWithDistance.filter(({ job: j, distanceKm }) => {
      // Category filter (bilingual support)
      if (category) {
        if (!isSameCategoryBilingual(j.category, category)) {
          return false;
        }
      }

      // Location keyword filter (only if Near Me is not active)
      if (location && !isNearMeActive) {
        const loc = location.toLowerCase().trim();
        const jobLoc = (j.location ?? '').toLowerCase();
        const jobAddr = (j.address ?? '').toLowerCase();
        if (!jobLoc.includes(loc) && !jobAddr.includes(loc) && !loc.includes(jobLoc)) {
          return false;
        }
      }

      // Search query filter (Bilingual matching: Hindi, English, Hinglish synonyms)
      if (query) {
        if (!matchesBilingualJob(j as any, query)) {
          return false;
        }
      }

      // Near Me Radius filter
      if (isNearMeActive && radiusKm > 0) {
        if (distanceKm > radiusKm) return false;
      }

      return true;
    });

    // If GPS is active, sort by nearest first!
    if (isNearMeActive && userCoords) {
      filtered.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return filtered;
  }, [jobs, query, category, location, isNearMeActive, userCoords, radiusKm]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 animate-fade-in text-stone-900 dark:text-stone-100">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
            {t('nav_browse_jobs', 'Browse Jobs')}
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {filteredAndSorted.length}{' '}
            {language === 'hi'
              ? 'नौकरियां उपलब्ध हैं।'
              : filteredAndSorted.length === 1
              ? 'open job found.'
              : 'open jobs found.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher: List vs Map */}
          <div className="inline-flex items-center rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <LayoutGrid size={13} />
              <span>{language === 'hi' ? 'लिस्ट' : 'List'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isLoggedIn) {
                  navigate('/signin');
                  return;
                }
                setViewMode('map');
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                viewMode === 'map'
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

          {/* Quick GPS Status chip if active */}
          {isNearMeActive && userCoords && (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/80 px-3.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                {language === 'hi'
                  ? `📍 निकटतम नौकरियां (${userLocality || 'GPS सक्रिय'})`
                  : `📍 Nearest First (${userLocality || 'GPS Active'})`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Filter Bar */}
      <div className="card mb-4 flex flex-col gap-3 p-4 md:flex-row md:items-center border border-stone-200 dark:border-stone-800 dark:bg-stone-900 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-3 text-stone-400 dark:text-stone-500" />
          <input
            className="input pl-10 pr-20"
            placeholder={t('jobs_search_placeholder', 'Search job title or keyword...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="absolute right-2 top-2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-full p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition cursor-pointer"
                title={language === 'hi' ? 'सर्च हटाएं' : 'Clear search'}
              >
                <X size={15} />
              </button>
            )}
            <VoiceSearchButton
              size="sm"
              onResult={(spokenText) => {
                setQuery(spokenText);
              }}
            />
          </div>
        </div>

        <select
          className="input md:w-48"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">{t('jobs_all_categories', 'All categories')}</option>
          {category && !JOB_CATEGORIES.includes(category as any) && (
            <option value={category}>{category}</option>
          )}
          {JOB_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="relative md:w-48">
          <MapPin size={18} className="absolute left-3 top-3 text-stone-400 dark:text-stone-500" />
          <input
            className="input pl-10"
            placeholder={language === 'hi' ? 'स्थान / शहर...' : 'City / Location...'}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isNearMeActive}
          />
        </div>

        {/* 📍 "Near Me" GPS Button */}
        <button
          type="button"
          id="jobs-near-me-btn"
          onClick={isNearMeActive ? handleClearNearMe : handleEnableNearMe}
          disabled={detectingGps}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer shrink-0 active:scale-95 ${
            isNearMeActive
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
              : 'border border-emerald-400/80 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900'
          }`}
          title={
            isNearMeActive
              ? language === 'hi'
                ? 'जीपीएस बंद करें'
                : 'Turn off GPS sorting'
              : language === 'hi'
              ? 'अपने स्थान के आस-पास की नौकरियां खोजें'
              : 'Find jobs closest to your location'
          }
        >
          {detectingGps ? (
            <>
              <Loader2 size={16} className="animate-spin text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'hi' ? 'खोज रहे हैं...' : 'Detecting...'}</span>
            </>
          ) : isNearMeActive ? (
            <>
              <CheckCircle2 size={16} />
              <span>{language === 'hi' ? '📍 आस-पास सक्रिय ✓' : '📍 Near Me Active ✓'}</span>
              <X size={14} className="ml-1 opacity-70 hover:opacity-100" />
            </>
          ) : (
            <>
              <Navigation size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'hi' ? '📍 मेरे आस-पास (GPS)' : '📍 Near Me (GPS)'}</span>
            </>
          )}
        </button>
      </div>

      {/* GPS Error Alert */}
      {gpsError && (
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-amber-600 shrink-0" />
            <span>{gpsError}</span>
          </div>
          <button
            onClick={() => setGpsError(null)}
            className="text-amber-700 dark:text-amber-400 hover:underline font-bold"
          >
            {language === 'hi' ? 'बंद करें' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Near Me Sub-Bar: Radius Filter & Info */}
      {isNearMeActive && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
            <Navigation size={14} className="text-emerald-600 rotate-45" />
            <span>
              {language === 'hi' ? 'दूरी का दायरा (Distance Radius):' : 'Distance Radius:'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { val: 0, label: language === 'hi' ? 'सभी दूरी (All)' : 'All' },
              { val: 5, label: '< 5 km' },
              { val: 10, label: '< 10 km' },
              { val: 25, label: '< 25 km' },
              { val: 50, label: '< 50 km' },
            ].map((r) => (
              <button
                key={r.val}
                type="button"
                onClick={() => setRadiusKm(r.val)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition active:scale-95 cursor-pointer ${
                  radiusKm === r.val
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-emerald-400'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleClearNearMe}
            className="text-xs font-bold text-stone-500 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400 transition ml-auto"
          >
            {language === 'hi' ? '✕ GPS फ़िल्टर हटाएं' : '✕ Clear GPS'}
          </button>
        </div>
      )}

      {/* Conditional View: Interactive Map vs Job Cards */}
      {viewMode === 'map' ? (
        <div className="animate-fade-in mb-8">
          <LiveGPSMap
            jobs={filteredAndSorted.map((f) => f.job)}
            userLocation={userCoords}
            radiusKm={radiusKm}
            height="560px"
          />
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-stone-400 dark:text-stone-500">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox size={40} className="text-stone-300 dark:text-stone-600" />
          <p className="mt-3 text-stone-600 dark:text-stone-300 font-medium">
            {language === 'hi'
              ? 'आपकी खोज के अनुसार कोई नौकरी नहीं मिली।'
              : 'No jobs match your search right now.'}
          </p>
          <p className="text-sm text-stone-400 dark:text-stone-500 mt-1">
            {isNearMeActive
              ? language === 'hi'
                ? 'दूरी का दायरा बढ़ाएं या GPS फ़िल्टर हटाकर देखें।'
                : 'Try increasing the distance radius or clear the GPS filter.'
              : language === 'hi'
              ? 'फ़िल्टर बदलें या कुछ देर बाद पुनः देखें।'
              : 'Try changing filters or check back later.'}
          </p>
          {isNearMeActive && (
            <button onClick={handleClearNearMe} className="btn-secondary mt-4 text-xs font-bold">
              {language === 'hi' ? 'सभी नौकरियां देखें' : 'View all jobs'}
            </button>
          )}
        </div>
      ) : (
        /* Job Cards Grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSorted.map(({ job, distanceKm }) => (
            <div
              key={job.id}
              className="card group flex flex-col p-5 transition hover:shadow-lg hover:border-emerald-500 dark:hover:border-emerald-500 relative"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="badge bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 font-semibold">
                  {job.category}
                </span>

                {/* Distance Badge or Time Ago */}
                <div className="flex items-center gap-1.5">
                  {distanceKm !== Infinity && !isNaN(distanceKm) ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                        distanceKm <= 5
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700 shadow-xs'
                          : distanceKm <= 15
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                      }`}
                      title={language === 'hi' ? 'आपके वर्तमान स्थान से दूरी' : 'Distance from your location'}
                    >
                      <Navigation size={10} className="rotate-45" />
                      {formatDistance(distanceKm, language)}
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      {timeAgo(job.created_at)}
                    </span>
                  )}
                </div>
              </div>

              <Link to={`/jobs/${job.id}`} className="block mt-3">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {job.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">
                  {job.description}
                </p>
              </Link>

              <div className="mt-4 flex flex-col gap-1.5 text-sm text-stone-600 dark:text-stone-400">
                {(job.location || job.address) && (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 min-w-0 flex-1">
                      <MapPin size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {isLoggedIn
                          ? job.address
                            ? `${job.address}, ${job.location || ''}`
                            : job.location
                          : `${job.location || 'कार्यस्थल'} ••••••`}
                      </span>
                    </span>

                    {isLoggedIn ? (
                      <a
                        href={getDirectionsUrl(job)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline shrink-0"
                        title={language === 'hi' ? 'Google Maps पर रास्ता देखें' : 'View on Google Maps'}
                      >
                        <Navigation size={11} className="rotate-45" />
                        <span>{language === 'hi' ? 'रास्ता' : 'Directions'}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate('/signin')}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                        title={language === 'hi' ? 'रास्ता देखने के लिए लॉगिन करें' : 'Sign in to view directions'}
                      >
                        <Lock size={10} />
                        <span>{language === 'hi' ? 'रास्ता 🔒' : 'Directions 🔒'}</span>
                      </button>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300 truncate">
                    <Briefcase size={14} className="text-stone-400 dark:text-stone-500 shrink-0" />
                    {job.employer?.company_name || job.employer?.full_name || 'Employer'}
                  </span>
                  {(job.employer?.is_verified ?? true) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-3">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {formatWage(job.wage, job.wage_type)}
                </span>

                <div className="flex items-center gap-2">
                  {job.phone && (
                    isLoggedIn ? (
                      <a
                        href={`https://wa.me/91${job.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                          language === 'hi'
                            ? `नमस्ते, मैंने "आवश्यकता है" पर आपकी नौकरी "${job.title}" देखी। क्या यह अभी उपलब्ध है?`
                            : `Hello, I saw your job "${job.title}" on Avashyakta Hai. Is this role open?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition"
                        title="WhatsApp पर बात करें"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate('/signin')}
                        className="inline-flex items-center gap-1 rounded-full bg-stone-100 hover:bg-emerald-50 dark:bg-stone-800 dark:hover:bg-emerald-950/80 px-2.5 py-1 text-xs font-bold text-stone-600 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-300 border border-stone-200 dark:border-stone-700 transition cursor-pointer"
                        title={language === 'hi' ? 'WhatsApp पर बात करने के लिए लॉगिन करें' : 'Sign in to connect on WhatsApp'}
                      >
                        <Lock size={12} className="text-stone-400" />
                        <span>WhatsApp 🔒</span>
                      </button>
                    )
                  )}

                  <Link
                    to={`/jobs/${job.id}`}
                    className="inline-flex items-center rounded-lg bg-stone-900 dark:bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-xs font-semibold transition"
                  >
                    {language === 'hi' ? 'देखें' : 'View'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
