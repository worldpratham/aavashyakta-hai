import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, RotateCcw, MapPin, Navigation } from 'lucide-react';
import { api, JOB_CATEGORIES, WAGE_TYPES, type WageType } from '@/lib/api';
import { getCurrentGPSPosition, resolveCoordinates } from '@/lib/geo';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/router';
import { getDraftField, saveDraft, clearDraft, hasDraft } from '@/lib/draftStorage';

const DRAFT_KEY = 'draft_post_job';

export function PostJobPage() {
  const { profile } = useAuth();
  const { language, t } = useLanguage();
  const { navigate } = useRouter();

  const [title, setTitle] = useState(() => getDraftField(DRAFT_KEY, 'title', ''));
  const [category, setCategory] = useState<string>(() => getDraftField(DRAFT_KEY, 'category', JOB_CATEGORIES[0]));
  const [customCategory, setCustomCategory] = useState(() => getDraftField(DRAFT_KEY, 'customCategory', ''));
  const [job, setJob] = useState(() => getDraftField(DRAFT_KEY, 'job', ''));
  const [taskRate, setTaskRate] = useState(() => getDraftField(DRAFT_KEY, 'taskRate', ''));
  const [description, setDescription] = useState(() => getDraftField(DRAFT_KEY, 'description', ''));
  const [location, setLocation] = useState(() => getDraftField(DRAFT_KEY, 'location', ''));
  const [address, setAddress] = useState(() => getDraftField(DRAFT_KEY, 'address', ''));
  const [wage, setWage] = useState(() => getDraftField(DRAFT_KEY, 'wage', ''));
  const [wageType, setWageType] = useState<WageType>(() => getDraftField(DRAFT_KEY, 'wageType', 'daily' as WageType));
  const [phone, setPhone] = useState(() => getDraftField(DRAFT_KEY, 'phone', ''));
  const [latitude, setLatitude] = useState<number | null>(() => getDraftField(DRAFT_KEY, 'latitude', null));
  const [longitude, setLongitude] = useState<number | null>(() => getDraftField(DRAFT_KEY, 'longitude', null));
  const [detectingGps, setDetectingGps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [draftRestored, setDraftRestored] = useState(() => hasDraft(DRAFT_KEY));

  // Auto-fill phone and location from recruiter's profile if available
  useEffect(() => {
    if (profile) {
      if (!phone && profile.phone) {
        setPhone(profile.phone);
      }
      if (!location && profile.location) {
        setLocation(profile.location);
      }
    }
  }, [profile]);

  // Persist form fields on any input change so data is never lost when navigating back/away
  useEffect(() => {
    saveDraft(DRAFT_KEY, {
      title,
      category,
      customCategory,
      job,
      taskRate,
      description,
      location,
      address,
      wage,
      wageType,
      phone,
      latitude,
      longitude,
    });
  }, [title, category, customCategory, job, taskRate, description, location, address, wage, wageType, phone, latitude, longitude]);

  const handleDetectGPS = async () => {
    setDetectingGps(true);
    try {
      const res = await getCurrentGPSPosition();
      setLatitude(res.latitude);
      setLongitude(res.longitude);
      if (res.cityName) {
        setLocation(res.cityName);
      }
      if (res.formattedAddress && !address) {
        setAddress(res.formattedAddress);
      }
    } catch (err: any) {
      console.warn('GPS detection error in PostJobPage:', err);
    } finally {
      setDetectingGps(false);
    }
  };

  const handleClearForm = () => {
    clearDraft(DRAFT_KEY);
    setTitle('');
    setCategory(JOB_CATEGORIES[0]);
    setCustomCategory('');
    setJob('');
    setTaskRate('');
    setDescription('');
    setLocation('');
    setAddress('');
    setWage('');
    setWageType('daily');
    setPhone('');
    setLatitude(null);
    setLongitude(null);
    setDraftRestored(false);
  };

  const profileId = (profile as any)?.id || (profile as any)?._id || '';

  if (profile && profile.role !== 'employer') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-stone-600 dark:text-stone-400">
          {language === 'hi' ? 'केवल नियोक्ता खाते ही नौकरी पोस्ट कर सकते हैं।' : 'Only employer accounts can post jobs.'}
        </p>
        <Link to="/jobs" className="btn-secondary mt-4">
          {t('nav_browse_jobs', 'Browse Jobs instead')}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profile) {
      navigate('/signin');
      return;
    }

    if (!profileId) {
      setError(language === 'hi' ? 'नियोक्ता आईडी अनुपलब्ध है। कृपया पुनः लॉगिन करें।' : 'Employer ID is missing. Please login again.');
      return;
    }

    if (!wage) {
      setError(language === 'hi' ? 'कृपया वेतन दर्ज करें।' : 'Please enter wage.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(0, 10);
    if (cleanPhone && cleanPhone.length !== 10) {
      setError(
        language === 'hi'
          ? 'कृपया सही 10-अंकीय मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    setLoading(true);

    try {
      const resolvedCategory =
        category === 'Other'
          ? customCategory.trim() || job.trim() || 'Other'
          : category;

      const coords =
        latitude && longitude
          ? { latitude, longitude }
          : resolveCoordinates({ location, address });

      const payload = {
        title,
        description,
        category: resolvedCategory,
        location,
        address,
        job: job.trim() || resolvedCategory,
        taskDetails: wageType === 'task' ? taskRate : '',
        wage: Number(wage),
        wageType,
        phone: cleanPhone,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      };

      const createdJob = await api.jobs.create(payload);

      // Automatically sync phone & location to recruiter profile if not previously set
      if (profileId && (cleanPhone || location)) {
        api.users.update(profileId, {
          phone: profile?.phone || cleanPhone || null,
          location: profile?.location || location || null,
        }).catch(() => {});
      }

      // Clear draft once job is successfully created
      clearDraft(DRAFT_KEY);
      setSuccess(true);
      const createdJobId = createdJob.id || createdJob._id;

      setTimeout(() => {
        if (createdJobId) {
          navigate(`/jobs/${createdJobId}`);
        } else {
          navigate('/my-jobs');
        }
      }, 1200);
    } catch (err: any) {
      console.error('Create job error:', err);
      setError(err?.message || (language === 'hi' ? 'नौकरी पोस्ट करने में विफल' : 'Failed to create job'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center text-stone-900 dark:text-stone-100">
        <CheckCircle2 size={48} className="text-emerald-600 dark:text-emerald-400" />
        <h1 className="mt-4 text-xl font-bold text-stone-900 dark:text-stone-100">
          {t('post_job_success_title', 'Job posted!')}
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {t('post_job_success_sub', 'Your job is now live for workers to find.')}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in text-stone-900 dark:text-stone-100">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
        {t('post_job_title', 'Post a Job')}
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        {t('post_job_sub', 'Fill in the details below to reach workers nearby.')}
      </p>

      {draftRestored && (title || description || location || wage) && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 p-3 text-xs text-emerald-900 dark:text-emerald-200 animate-fade-in">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            {language === 'hi'
              ? 'आपका पहले से भरा हुआ विवरण सुरक्षित है और वापस लोड कर दिया गया है।'
              : 'Your previously entered job details have been restored.'}
          </span>
          <button
            type="button"
            onClick={handleClearForm}
            className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 underline hover:text-emerald-900 ml-2 cursor-pointer shrink-0"
          >
            <RotateCcw size={13} />
            {language === 'hi' ? 'खाली करें' : 'Clear'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card mt-6 flex flex-col gap-5 p-6 border border-stone-200 dark:border-stone-800 dark:bg-stone-900">
        <div>
          <label className="label">{t('post_job_job_title', 'Job title')}</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter Title"
            required
          />
        </div>



        <div>
          <label className="label">
            {t('post_job_category_role', 'Category *')}
          </label>

          <select
            className="input"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
            }}
            required
          >
            <option value=" ">
              Select Category
            </option>

            {JOB_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>





        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              {t('post_job_location_heading', 'Job Location Details')}
            </span>
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={detectingGps}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition active:scale-95 cursor-pointer"
            >
              {detectingGps ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>{language === 'hi' ? 'GPS खोज रहे हैं...' : 'Detecting GPS...'}</span>
                </>
              ) : (
                <>
                  <Navigation size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{language === 'hi' ? '📍 वर्तमान GPS स्थान भरें' : '📍 Auto-detect GPS'}</span>
                </>
              )}
            </button>
          </div>

          {latitude && longitude && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>
                {language === 'hi'
                  ? `✓ GPS पिन सेट है: (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) - कामगारों को सटीक दूरी दिखेगी`
                  : `✓ GPS coordinates captured: (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) - Workers will see exact distance`}
              </span>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label">{t('post_job_city_location', 'City / Location *')}</label>
              <input
                className="input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Jaipur, Delhi, Mumbai, Lucknow"
                required
              />
            </div>

            <div>
              <label className="label">{t('post_job_area_optional', 'Area / Full Address (Optional)')}</label>
              <input
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Sector 12, Malviya Nagar"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label">{t('post_job_desc', 'Description')}</label>
          <textarea
            className="input min-h-[120px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the work, hours, requirements, and any other details..."
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">{t('post_job_wage', 'Wage (₹)')}</label>
            <input
              type="number"
              min="0"
              className="input"
              value={wage}
              onChange={(e) => setWage(e.target.value)}
              placeholder="e.g. 500"
              required
            />
          </div>

          <div>
            <label className="label">{t('post_job_wage_type', 'Wage type')}</label>
            <select
              className="input"
              value={wageType}
              onChange={(e) => setWageType(e.target.value as WageType)}
            >
              {WAGE_TYPES.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {wageType === 'task' && (
          <div>
            <label className="label">{t('post_job_task_details', 'Task Details / Task Rate')}</label>
            <input
              className="input"
              value={taskRate}
              onChange={(e) => setTaskRate(e.target.value)}
              placeholder="Describe your specific task milestone"
            />
          </div>
        )}

        <div>
          <label className="label">{t('post_job_phone', 'Contact phone')}</label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            className="input"
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
              setPhone(val);
              if (error) setError(null);
            }}
            placeholder={language === 'hi' ? 'कामगारों के संपर्क के लिए आपका 10-अंकीय मोबाइल नंबर' : 'Your 10-digit phone number for workers to reach you'}
          />
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {language === 'hi'
              ? 'यह फोन नंबर नौकरी के विज्ञापन में दिखेगा ताकि कामगार आपसे सीधे बात कर सकें।'
              : 'Workers will use this number to directly call and inquire about this job.'}
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : t('post_job_submit', 'Post Job')}
        </button>
      </form>
    </div>
  );
}