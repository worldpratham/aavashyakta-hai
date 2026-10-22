import { useEffect, useState } from 'react';
import { MapPin, Clock, ArrowLeft, CheckCircle2, Loader2, Phone, Briefcase, Navigation } from 'lucide-react';
import { api, type Job } from '@/hooks/job';
import { useAuth } from '@/context/AuthContext';
import { formatWage, formatDate } from '@/lib/format';
import { Link, useRouter } from '@/router';
import { getDraftField, saveDraft, clearDraft } from '@/lib/draftStorage';
import { JobWorkplaceDirections } from '@/components/JobWorkplaceDirections';

export function JobDetailPage({ jobId }: { jobId: string }) {
  const { profile, session } = useAuth();
  const { navigate } = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [message, setMessage] = useState(() => getDraftField(`draft_apply_${jobId}`, 'message', ''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [expectedWage, setExpectedWage] = useState(() => getDraftField(`draft_apply_${jobId}`, 'expectedWage', ''));

  // Save entered message and expected wage so navigating away and returning preserves data
  useEffect(() => {
    saveDraft(`draft_apply_${jobId}`, { message, expectedWage });
  }, [jobId, message, expectedWage]);

  // Attempt fast silent GPS retrieval for live distance calculation
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {},
        { timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const fetchedJob = await api.jobs.getById(jobId);
        if (!active) return;
        setJob(fetchedJob);

        const workerId = profile?.id || session?.user.id;
        if (workerId) {
          try {
            const myApps = await api.applications.getByWorker(workerId);
            if (!active) return;
            const applied = myApps.some(
              (app) =>
                app.job_id === jobId ||
                app.job?.id === jobId ||
                (app as any).jobId === jobId ||
                (app as any).jobId?._id === jobId
            );
            if (applied) setHasApplied(true);
          } catch (appErr) {
            console.warn('Could not check prior applications:', appErr);
          }
        }
      } catch (err) {
        console.error('Failed to load job detail from MongoDB:', err);
        if (active) setJob(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [jobId, session, profile?.id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const workerId = profile?.id || session?.user.id;
    if (!session || !profile || !workerId) {
      navigate('/signin');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.applications.create({
        jobId,
        workerId,
        message: message || '',
        expectedWage: Number(expectedWage) || 0,
      });
      setHasApplied(true);
      setSuccess(true);
      clearDraft(`draft_apply_${jobId}`);
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to submit application';
      setError(
        errMsg.toLowerCase().includes('already') || errMsg.includes('duplicate')
          ? 'You have already applied for this job.'
          : errMsg
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400 dark:text-stone-500">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-stone-900 dark:text-stone-100">
        <p className="text-stone-500 dark:text-stone-400">This job could not be found.</p>
        <Link to="/jobs" className="btn-secondary mt-4">Back to Jobs</Link>
      </div>
    );
  }

  const isOwner = profile?.id === job.employer_id;
  const isLoggedIn = Boolean(session && profile);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in text-stone-900 dark:text-stone-100">
      <Link to="/jobs" className="btn-ghost mb-4 -ml-2"><ArrowLeft size={16} /> Back to Jobs</Link>

      <div className="card overflow-hidden">
        <div className="border-b border-stone-100 dark:border-stone-800 p-6">
          <span className="badge bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">{job.category}</span>
          <h1 className="mt-3 text-2xl font-bold text-stone-900 dark:text-stone-100">{job.title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-stone-600 dark:text-stone-400">
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-emerald-600 dark:text-emerald-400" />{' '}
                {isLoggedIn ? job.location : `${job.location.split(',')[0]} ••••••`}
              </span>
            )}
            <span className="flex items-center gap-1.5"><Clock size={15} className="text-stone-400 dark:text-stone-500" /> Posted {formatDate(job.created_at)}</span>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatWage(job.wage, job.wage_type)}</span>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Job Description</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-600 dark:text-stone-300">{job.description}</p>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-stone-50 dark:bg-stone-800/80 p-4 border border-stone-200/60 dark:border-stone-700/60">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-base font-bold text-white shadow-sm">
                {(job.employer?.company_name || job.employer?.full_name)?.charAt(0).toUpperCase() ?? 'E'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {job.employer?.company_name || job.employer?.full_name || 'Employer'}
                  </p>
                  {(job.employer?.is_verified ?? true) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                      ✓ Verified Hirer
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {job.employer?.company_type || 'Verified Employer'} • Posted by {job.employer?.full_name || 'Hirer'}
                </p>
              </div>
            </div>
          </div>

          {/* 📍 Live Workplace Location & Navigation Card */}
          <div className="mt-6">
            <JobWorkplaceDirections job={job} userCoords={userCoords} />
          </div>
        </div>

        {!isOwner && (
          <div className="border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 p-6">
            {success || hasApplied ? (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 p-4 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={20} />
                <p className="text-sm font-medium">You have applied for this job. The employer will contact you.</p>
              </div>
            ) : !session ? (
              <div className="text-center">
                <p className="text-sm text-stone-600 dark:text-stone-400">Sign in as a worker to apply for this job.</p>
                <Link to="/signin" className="btn-primary mt-3">Sign in to apply</Link>
              </div>
              
            ) : profile?.role === 'employer' ? (
              <p className="text-center text-sm text-stone-500 dark:text-stone-400">You are signed in as an employer. Only worker accounts can apply for jobs.</p>
            ) : (
              <form onSubmit={handleApply} className="flex flex-col gap-3">
                <label className="label">Message to employer (optional)</label>
                <textarea
                  className="input min-h-[90px] resize-y"
                  placeholder="Tell the employer why you are a good fit..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div>
                  <label className="label">Expected Wage (₹)</label>

                  <input
                    type="number"
                    min="0"
                    className="input"
                    placeholder="e.g. 600"
                    value={expectedWage}
                    onChange={(e) => setExpectedWage(e.target.value)}
                    required
                  />

                  <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                    Enter the amount you expect for this job.
                  </p>
                </div>
                {error && <p className="rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-400">{error}</p>}
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Applying....' : 'Apply Now'}
                </button>
              </form>
              
            )}
             
          </div>
          
        )}

        {isOwner && (
          <div className="border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 p-6 text-center">
            <p className="text-sm text-stone-600 dark:text-stone-400">This is your job posting.</p>
            <Link to="/my-jobs" className="btn-secondary mt-3">View Applications</Link>
          </div>
        )}
      </div>
    </div>
  );
}

// VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiaGVzemFwbHlibGhoZW12bWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NjI3MzIsImV4cCI6MjEwMjUzODczMn0.Cd9lYX68S6_DblYApWo-kebrlo01JtQJ_pnSXHcMigA
// VITE_SUPABASE_URL=https://gbheszaplyblhhemvmeo.supabase.co
// VITE_API_URL=http://localhost:5000/api
