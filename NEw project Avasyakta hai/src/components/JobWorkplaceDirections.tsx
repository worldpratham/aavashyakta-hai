import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  Compass,
  Route,
  Sparkles,
  Lock,
} from 'lucide-react';
import { getDirectionsUrl, calculateDistanceKm, formatDistance } from '@/lib/geo';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/router';

interface JobWorkplaceDirectionsProps {
  job: {
    location?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    title?: string;
  };
  userCoords?: { latitude: number; longitude: number } | null;
  compact?: boolean;
}

export function JobWorkplaceDirections({
  job,
  userCoords,
  compact = false,
}: JobWorkplaceDirectionsProps) {
  const { language } = useLanguage();
  const { profile, session } = useAuth();
  const { navigate } = useRouter();
  const [copied, setCopied] = useState(false);

  const isLoggedIn = Boolean(session && profile);

  const fullAddress = [job.address, job.location].filter(Boolean).join(', ');
  const directionsUrl = getDirectionsUrl({
    latitude: job.latitude,
    longitude: job.longitude,
    address: job.address,
    location: job.location,
  });

  // Calculate live distance if user coordinates and job coordinates exist
  let liveDistanceKm: number | null = null;
  if (
    userCoords &&
    typeof job.latitude === 'number' &&
    typeof job.longitude === 'number' &&
    job.latitude !== 0 &&
    job.longitude !== 0
  ) {
    liveDistanceKm = calculateDistanceKm(
      userCoords.latitude,
      userCoords.longitude,
      job.latitude,
      job.longitude
    );
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fullAddress) return;
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Compact View (Used in Cards)
  if (compact) {
    if (!isLoggedIn) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <MapPin size={13} className="text-stone-400 shrink-0" />
            <span className="font-semibold text-stone-700 dark:text-stone-300 truncate">
              {job.location || 'कार्यस्थल'} ••••••
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/signin');
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-2.5 py-1 text-[11px] font-bold transition shadow-xs shrink-0 cursor-pointer"
            title="रास्ता और सटीक पता देखने के लिए लॉगिन करें"
          >
            <Lock size={11} />
            <span>{language === 'hi' ? 'रास्ता 🔒 (लॉगिन)' : 'Directions 🔒'}</span>
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <MapPin size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
            {job.address ? `${job.address}, ${job.location || ''}` : job.location || 'कार्यस्थल की लोकेशन'}
          </span>
          {liveDistanceKm !== null && (
            <span className="shrink-0 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              ({formatDistance(liveDistanceKm)})
            </span>
          )}
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-2.5 py-1 text-[11px] font-bold transition shadow-xs shrink-0 cursor-pointer"
          title="Google Maps पर रास्ता देखें"
        >
          <Navigation size={12} className="rotate-45" />
          <span>{language === 'hi' ? 'रास्ता देखें' : 'Directions'}</span>
        </a>
      </div>
    );
  }

  // 2. Full View (Used in JobDetailPage)
  return (
    <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-50/80 via-white to-stone-50 dark:from-emerald-950/40 dark:via-stone-900 dark:to-stone-900 p-4 sm:p-5 shadow-sm transition">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Compass size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>{language === 'hi' ? 'कार्यस्थल का पता एवं रास्ता' : 'Workplace Location & Directions'}</span>
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {language === 'hi'
                ? 'काम करने की जगह पर पहुंचने के लिए लाइव नेविगेशन और पता'
                : 'Live turn-by-turn navigation to reach the job work site'}
            </p>
          </div>
        </div>

        {isLoggedIn && liveDistanceKm !== null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 text-xs font-bold border border-emerald-200 dark:border-emerald-800 shrink-0">
            <Route size={13} />
            <span>{formatDistance(liveDistanceKm)} दूर</span>
          </span>
        )}
      </div>

      {/* Address Card: Authenticated vs Guest */}
      {isLoggedIn ? (
        <>
          <div className="mt-3.5 rounded-xl bg-white dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 p-3.5 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <MapPin size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                {job.address ? (
                  <>
                    <p className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                      {job.address}
                    </p>
                    {job.location && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                        {job.location}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {job.location || (language === 'hi' ? 'सटीक पता नियोक्ता द्वारा प्रदान किया जाएगा' : 'Location provided by employer')}
                  </p>
                )}
              </div>
            </div>

            {fullAddress && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2.5 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition cursor-pointer shrink-0"
                title="पता कॉपी करें"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-emerald-600">{language === 'hi' ? 'कॉपी हुआ' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>{language === 'hi' ? 'कॉपी' : 'Copy'}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Primary Action Button: Open Google Maps Navigation */}
          <div className="mt-3.5 flex flex-col sm:flex-row gap-2.5">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold py-3 px-4 shadow-md shadow-emerald-600/30 transition cursor-pointer"
            >
              <Navigation size={16} className="rotate-45" />
              <span>{language === 'hi' ? '🗺️ Google Maps पर रास्ता देखें (नेविगेट करें)' : '🗺️ Open Turn-by-Turn Navigation'}</span>
              <ExternalLink size={14} className="opacity-75" />
            </a>
          </div>
        </>
      ) : (
        <>
          {/* Guest Protected Address Card */}
          <div className="mt-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700/80 p-3.5 flex items-start gap-3 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
              <Lock size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                {job.location ? `${job.location} ••••••••••` : 'कार्यस्थल का सटीक पता सुरक्षित है'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {language === 'hi'
                  ? 'सुरक्षा कारणों से कार्यस्थल का सटीक पता और लाइव Google Maps नेविगेशन केवल पंजीकृत कामगारों के लिए उपलब्ध है।'
                  : 'For safety, the exact work site address and turn-by-turn navigation are available to logged in workers.'}
              </p>
            </div>
          </div>

          {/* Guest Sign In Call To Action */}
          <div className="mt-3.5">
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold py-3 px-4 shadow-md shadow-emerald-600/30 transition cursor-pointer"
            >
              <Lock size={15} />
              <span>
                {language === 'hi'
                  ? 'कार्यस्थल का रास्ता व पता देखने के लिए लॉगिन करें'
                  : 'Sign in to View Address & Navigation'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
