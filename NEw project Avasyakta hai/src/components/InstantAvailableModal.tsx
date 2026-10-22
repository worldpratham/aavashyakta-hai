import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Zap,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api, type Profile } from '@/lib/api';
import { getCurrentGPSPosition } from '@/lib/geo';
import { useLanguage } from '@/context/LanguageContext';

interface InstantAvailableModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onUpdated?: () => Promise<void> | void;
}

export function InstantAvailableModal({
  isOpen,
  onClose,
  profile,
  onUpdated,
}: InstantAvailableModalProps) {
  const { language } = useLanguage();
  const [isAvailable, setIsAvailable] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [detectedLocality, setDetectedLocality] = useState<string>('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && profile) {
      setIsAvailable(profile.is_available_now ?? false);
      setStatusText(
        profile.available_status_text ||
          (language === 'hi'
            ? 'काम के लिए तुरंत उपलब्ध (Ready to work now)'
            : 'Available for immediate work')
      );
      setLatitude(profile.latitude ?? null);
      setLongitude(profile.longitude ?? null);
      setDetectedLocality(profile.location || '');
      setGpsError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, profile, language]);

  if (!isOpen || !profile) return null;

  const handleDetectGPS = async () => {
    setDetectingGps(true);
    setGpsError(null);
    try {
      const res = await getCurrentGPSPosition();
      setLatitude(res.latitude);
      setLongitude(res.longitude);
      const name = res.cityName || res.formattedAddress || '';
      if (name) {
        setDetectedLocality(name);
      }
    } catch (err: any) {
      console.warn('GPS detection error:', err);
      setGpsError(err?.message || (language === 'hi' ? 'जीपीएस स्थान प्राप्त करने में विफल' : 'Failed to get GPS location'));
    } finally {
      setDetectingGps(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setGpsError(null);
    setSuccessMsg(null);

    try {
      await api.workers.updateAvailability(
        profile.id,
        isAvailable,
        statusText.trim(),
        {
          latitude,
          longitude,
        }
      );

      // If locality detected, also sync location
      if (detectedLocality && (!profile.location || detectedLocality !== profile.location)) {
        await api.users.update(profile.id, {
          location: detectedLocality,
        }).catch(() => {});
      }

      setSuccessMsg(
        isAvailable
          ? language === 'hi'
            ? '✓ आप अब "तत्काल उपलब्ध" के रूप में लाइव हैं!'
            : '✓ You are now live as "Instant Available"!'
          : language === 'hi'
          ? '✓ आपका स्टेटस ऑफलाइन कर दिया गया है।'
          : '✓ Your status has been set to offline.'
      );

      if (onUpdated) {
        await onUpdated();
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to update availability:', err);
      setGpsError(err?.message || (language === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 md:p-8 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={saving}
          className="absolute right-4 top-4 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition"
        >
          <X size={20} />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              isAvailable
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
            }`}
          >
            <Zap size={24} className={isAvailable ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>{language === 'hi' ? 'तत्काल उपलब्धता (Instant Available)' : 'Instant Availability'}</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {language === 'hi'
                ? 'तुरंत काम पाने के लिए अपनी लाइव उपलब्धता सेट करें'
                : 'Set your live availability to get hired immediately'}
            </p>
          </div>
        </div>

        {/* Live Status Toggle Card */}
        <div
          className={`rounded-2xl p-4 border transition-all ${
            isAvailable
              ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30'
              : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-4 w-4">
                {isAvailable && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-4 w-4 ${
                    isAvailable ? 'bg-emerald-500' : 'bg-stone-400'
                  }`}
                ></span>
              </span>
              <div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {isAvailable
                    ? language === 'hi'
                      ? '🟢 ऑनलाइन - तत्काल काम के लिए उपलब्ध'
                      : '🟢 ONLINE - Ready to Work Now'
                    : language === 'hi'
                    ? '⚪ ऑफलाइन - अभी काम नहीं चाहिए'
                    : '⚪ OFFLINE - Not Available Now'}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {isAvailable
                    ? language === 'hi'
                      ? 'नियोक्ता आपको होमपेज पर सबसे ऊपर देख सकते हैं'
                      : 'Hirers can see you on top of the live available list'
                    : language === 'hi'
                    ? 'चालू करने पर आस-पास के नियोक्ता सीधे संपर्क कर सकेंगे'
                    : 'Turn on to let nearby hirers contact you directly'}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAvailable ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isAvailable ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Custom Status Message */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            {language === 'hi' ? 'स्टेटस नोट (Status Note / क्या काम कर सकते हैं):' : 'Status Note (What work are you ready for?):'}
          </label>
          <input
            type="text"
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'उदा. 2 घंटे में शुरू कर सकता हूँ, प्लंबर/इलेक्ट्रीशियन कार्य...'
                : 'e.g. Ready in 2 hours, Electrician / Plumbing jobs...'
            }
            className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* GPS Location Section */}
        <div className="mt-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-stone-200">
              <MapPin size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'hi' ? 'वर्तमान GPS स्थान (Live Location)' : 'Live GPS Location'}</span>
            </div>

            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={detectingGps}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition"
            >
              {detectingGps ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>{language === 'hi' ? 'खोज रहे हैं...' : 'Detecting...'}</span>
                </>
              ) : (
                <>
                  <Navigation size={13} />
                  <span>{language === 'hi' ? '📍 GPS डिटेक्ट करें' : '📍 Detect GPS'}</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-2 text-xs text-stone-600 dark:text-stone-400">
            {latitude && longitude ? (
              <p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 size={13} />
                <span>
                  {detectedLocality ? `${detectedLocality} • ` : ''}
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
              </p>
            ) : (
              <p className="text-stone-400 dark:text-stone-500 italic">
                {language === 'hi'
                  ? 'जीपीएस स्थान जोड़ने से केवल आपके पास के नियोक्ता ही आपको प्राथमिकता देंगे'
                  : 'Adding GPS location helps nearby employers discover you first'}
              </p>
            )}
          </div>
        </div>

        {/* Error / Success Notice */}
        {gpsError && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/50 p-2.5 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
            <AlertCircle size={14} className="shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 p-2.5 text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-2 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            {language === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 text-sm font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{language === 'hi' ? 'सेव हो रहा है...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>{language === 'hi' ? 'सेव करें (Save)' : 'Save & Update'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
