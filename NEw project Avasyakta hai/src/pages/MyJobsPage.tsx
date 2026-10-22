import { useEffect, useState } from 'react';
import {
  Loader2,
  Inbox,
  MapPin,
  Users,
  Plus,
  Check,
  X,
  CheckCircle2,
  Building2,
  Phone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Copy,
  Banknote,
  Wallet,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { api, type Job, type Application } from '@/lib/api';
import { formatWage, timeAgo, parseSkills } from '@/lib/format';
import { Link } from '@/router';

type JobWithApps = Job & {
  applications: Application[];
};

export function MyJobsPage() {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const [jobs, setJobs] = useState<JobWithApps[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [jobUpdating, setJobUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const profileId = profile?.id || (profile as any)?._id || '';

  async function loadJobs() {
    if (!profileId) {
      setJobs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const employerJobs = await api.jobs.getByEmployer(profileId);

      const jobsWithApplications: JobWithApps[] = await Promise.all(
        employerJobs.map(async (job) => {
          const jobId = job.id || job._id;
          if (!jobId) {
            return { ...job, applications: [] };
          }
          try {
            const apps = await api.applications.getByJob(jobId);
            return {
              ...job,
              applications: apps,
            };
          } catch (appErr) {
            console.error(`Failed to fetch applications for job ${jobId}:`, appErr);
            return {
              ...job,
              applications: [],
            };
          }
        })
      );

      setJobs(jobsWithApplications);
    } catch (err: any) {
      console.error('Load jobs error:', err);
      setError(err?.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profileId) {
      loadJobs();
    } else {
      setLoading(false);
    }
  }, [profileId]);

  async function updateStatus(
    appId: string,
    status: 'accepted' | 'rejected' | 'hired' | 'completed'
  ) {
    if (!appId) return;

    try {
      setUpdating(appId);
      await api.applications.updateStatus(appId, status);

      setJobs((prevJobs) =>
        prevJobs.map((job) => ({
          ...job,
          applications: job.applications.map((app) =>
            (app.id === appId || (app as any)._id === appId)
              ? { ...app, status }
              : app
          ),
        }))
      );
    } catch (err: any) {
      console.error('Update application status error:', err);
      alert(err?.message || 'Failed to update application');
    } finally {
      setUpdating(null);
    }
  }

  async function toggleJobStatus(job: JobWithApps) {
    const jobId = job.id || job._id;
    if (!jobId) return;

    const currentStatus = job.status === 'active' ? 'open' : job.status;
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';

    try {
      setJobUpdating(jobId);
      await api.jobs.update(jobId, { status: newStatus });

      setJobs((prevJobs) =>
        prevJobs.map((j) => {
          const currentId = j.id || j._id;
          if (currentId === jobId) {
            return { ...j, status: newStatus };
          }
          return j;
        })
      );
    } catch (err: any) {
      console.error('Update job status error:', err);
      alert(err?.message || 'Failed to update job status');
    } finally {
      setJobUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400 dark:text-stone-500">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Inbox size={40} className="mx-auto text-stone-300 dark:text-stone-600" />
        <p className="mt-3 text-stone-500 dark:text-stone-400">User information is not available.</p>
        <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">Please sign in again.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Inbox size={40} className="mx-auto text-stone-300 dark:text-stone-600" />
        <p className="mt-3 font-medium text-rose-600 dark:text-rose-400">{error}</p>
        <button onClick={loadJobs} className="btn-primary mt-4">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in text-stone-900 dark:text-stone-100">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">My Jobs</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Manage your job postings and applications.
          </p>
        </div>
        <Link to="/post-job" className="btn-primary">
          <Plus size={16} />
          Post a Job
        </Link>
      </div>

      {/* Recruiter Welcome & Profile Setup Banner */}
      {(!profile?.phone || !profile?.location) && (
        <div className="mb-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-50/90 via-white to-stone-50 dark:from-emerald-950/40 dark:via-stone-900 dark:to-stone-900 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 mb-2">
                <Sparkles size={13} />
                <span>{language === 'hi' ? 'स्वागत है' : 'Welcome Recruiter'}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                {language === 'hi'
                  ? `नमस्ते ${profile?.full_name || 'नियोक्ता'}, अपनी प्रोफाइल पूरी करें`
                  : `Welcome, ${profile?.full_name || 'Recruiter'}! Complete your company profile`}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl">
                {language === 'hi'
                  ? 'नौकरी पोस्ट करने पर कामगार सीधे आपके फोन नंबर पर संपर्क कर सकें, इसके लिए अपना मोबाइल नंबर और शहर जोड़ें।'
                  : 'Add your contact phone number and business location so workers can directly reach out to you.'}
              </p>

              {/* Status Badges */}
              <div className="mt-3.5 flex flex-wrap gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-medium ${
                    profile?.phone
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  }`}
                >
                  <Phone size={13} />
                  <span>
                    {profile?.phone
                      ? `Phone: ${profile.phone}`
                      : language === 'hi'
                      ? 'फोन नंबर: जोड़ना बाकी'
                      : 'Phone: Pending'}
                  </span>
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-medium ${
                    profile?.location
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  }`}
                >
                  <MapPin size={13} />
                  <span>
                    {profile?.location
                      ? `City: ${profile.location}`
                      : language === 'hi'
                      ? 'शहर: जोड़ना बाकी'
                      : 'City: Pending'}
                  </span>
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-medium ${
                    profile?.company_name
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  }`}
                >
                  <Building2 size={13} />
                  <span>
                    {profile?.company_name
                      ? `Company: ${profile.company_name}`
                      : language === 'hi'
                      ? 'कंपनी / दुकान: जोड़ना बाकी'
                      : 'Company: Pending'}
                  </span>
                </span>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
              <Link
                to="/profile"
                className="btn-secondary text-xs sm:text-sm py-2 px-3.5 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
              >
                <span>{language === 'hi' ? 'प्रोफाइल पूरी करें' : 'Complete Profile'}</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/post-job"
                className="btn-primary text-xs sm:text-sm py-2 px-3.5 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
              >
                <Plus size={14} />
                <span>{language === 'hi' ? 'नौकरी पोस्ट करें' : 'Post a Job'}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox size={40} className="text-stone-300 dark:text-stone-600" />
          <p className="mt-3 text-stone-600 dark:text-stone-300 font-medium">You have not posted any jobs yet.</p>
          <Link to="/post-job" className="btn-primary mt-4">
            Post your first job
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => {
            const jobId = job.id || job._id || '';
            const jobStatus = job.status === 'active' ? 'open' : job.status;

            return (
              <div key={jobId} className="card p-5 border border-stone-200 dark:border-stone-800 dark:bg-stone-900 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                        {job.category}
                      </span>
                      <span
                        className={`badge border capitalize font-semibold ${
                          jobStatus === 'open'
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        {jobStatus}
                      </span>
                    </div>

                    <Link to={`/jobs/${jobId}`}>
                      <h3 className="mt-2 text-base font-bold text-stone-900 dark:text-stone-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                        {job.title}
                      </h3>
                    </Link>

                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-stone-500 dark:text-stone-400">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-emerald-600 dark:text-emerald-400" />
                          {job.location}
                        </span>
                      )}
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatWage(
                          job.wage ? String(job.wage) : null,
                          job.wage_type || job.wageType || null
                        )}
                      </span>
                      {job.created_at && (
                        <span className="text-stone-400 dark:text-stone-500">{timeAgo(job.created_at)}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleJobStatus(job)}
                    disabled={jobUpdating === jobId}
                    className="btn-secondary text-xs"
                  >
                    {jobUpdating === jobId ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : jobStatus === 'open' ? (
                      'Close Job'
                    ) : (
                      'Reopen Job'
                    )}
                  </button>
                </div>

                <div className="mt-4 border-t border-stone-100 dark:border-stone-800 pt-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
                    <Users size={15} className="text-emerald-600 dark:text-emerald-400" />
                    Applications ({job.applications.length})
                  </div>

                  {job.applications.length === 0 ? (
                    <p className="text-sm text-stone-400 dark:text-stone-500">No applications yet.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {job.applications.map((app) => {
                        const appId = app.id || (app as any)._id || '';
                        const worker = app.worker || (app as any).workerIdData;
                        const workerName =
                          worker?.full_name || (worker as any)?.name || 'Worker';
                        const workerSkills = parseSkills(
                          typeof worker?.skills === 'string'
                            ? worker.skills
                            : Array.isArray(worker?.skills)
                            ? worker.skills.join(', ')
                            : null
                        );

                        return (
                          <div
                            key={appId}
                            className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80 p-4 shadow-sm"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  {worker?.avatar_url ? (
                                    <img
                                      src={worker.avatar_url}
                                      alt={workerName}
                                      className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-500/20"
                                    />
                                  ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-lg font-bold text-emerald-700 dark:text-emerald-400">
                                      {workerName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-base font-bold text-stone-900 dark:text-stone-100">
                                        {workerName}
                                      </p>
                                      {(worker?.is_verified ?? true) && (
                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                                          ✓ Verified Candidate
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-stone-500 dark:text-stone-400">
                                      {worker?.experience_level || 'Candidate'} {worker?.primary_skill ? `• ${worker.primary_skill}` : ''}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                  {worker?.phone && (
                                    <div className="rounded-lg bg-stone-50 dark:bg-stone-900/90 border border-stone-200/60 dark:border-stone-700/60 p-3">
                                      <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
                                        Phone
                                      </p>
                                      <p className="mt-1 text-sm font-medium text-stone-800 dark:text-stone-200">
                                        📞 {worker.phone}
                                      </p>
                                    </div>
                                  )}

                                  {worker?.location && (
                                    <div className="rounded-lg bg-stone-50 dark:bg-stone-900/90 border border-stone-200/60 dark:border-stone-700/60 p-3">
                                      <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
                                        Location
                                      </p>
                                      <p className="mt-1 flex items-center gap-1 text-sm font-medium text-stone-800 dark:text-stone-200">
                                        <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
                                        {worker.location}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {workerSkills.length > 0 && (
                                  <div className="mt-3 rounded-lg bg-stone-50 dark:bg-stone-900/90 border border-stone-200/60 dark:border-stone-700/60 p-3">
                                    <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
                                      Skills
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {workerSkills.map((skill) => (
                                        <span
                                          key={skill}
                                          className="badge bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {(app.expected_wage != null ||
                                  (app as any).expectedWage != null) && (
                                  <div className="mt-3 rounded-lg bg-stone-50 dark:bg-stone-900/90 border border-stone-200/60 dark:border-stone-700/60 p-3">
                                    <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
                                      Expected Wage
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                      ₹{app.expected_wage ?? (app as any).expectedWage}
                                    </p>
                                  </div>
                                )}

                                {app.message && (
                                  <div className="mt-3 rounded-lg bg-stone-50 dark:bg-stone-900/90 border border-stone-200/60 dark:border-stone-700/60 p-3">
                                    <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
                                      Application Message
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-stone-700 dark:text-stone-300">
                                      {app.message}
                                    </p>
                                  </div>
                                )}

                                {app.created_at && (
                                  <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">
                                    Applied {timeAgo(app.created_at)}
                                  </p>
                                )}

                                {/* Status Badges */}
                                <div>
                                  {app.status === 'pending' && (
                                    <span className="badge mt-2 border font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/70">
                                      🟡 {language === 'hi' ? 'समीक्षाधीन (Pending Review)' : 'Pending Review'}
                                    </span>
                                  )}
                                  {(app.status === 'accepted' || app.status === 'hired') && (
                                    <span className="badge mt-2 border font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70 inline-flex items-center gap-1">
                                      <CheckCircle2 size={13} />
                                      <span>{language === 'hi' ? 'काम पर रखा गया (Hired ✓)' : 'Hired ✓'}</span>
                                    </span>
                                  )}
                                  {app.status === 'completed' && (
                                    <span className="badge mt-2 border font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/70 inline-flex items-center gap-1">
                                      <CheckCircle2 size={13} />
                                      <span>{language === 'hi' ? 'काम पूरा हुआ (कामगार द्वारा सत्यापित ✓)' : 'Work Done (Marked by Worker ✓)'}</span>
                                    </span>
                                  )}
                                  {app.status === 'paid' && (
                                    <span className="badge mt-2 border font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 inline-flex items-center gap-1">
                                      <ShieldCheck size={13} />
                                      <span>{language === 'hi' ? 'भुगतान संपन्न (Payment Released ✓)' : 'Payment Released ✓'}</span>
                                    </span>
                                  )}
                                  {app.status === 'rejected' && (
                                    <span className="badge mt-2 border font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/70">
                                      {language === 'hi' ? 'अस्वीकृत (Rejected)' : 'Rejected'}
                                    </span>
                                  )}
                                </div>

                                {/* Worker Payout Information (when Completed or Paid) */}
                                {(app.status === 'completed' || app.status === 'paid') && (() => {
                                  const chosenPaymentMode =
                                    app.payment_mode ||
                                    (app as any).paymentMode ||
                                    worker?.payment_mode ||
                                    '';
                                  const chosenUpi =
                                    app.upi_id ||
                                    (app as any).upiId ||
                                    worker?.upi_id ||
                                    '';
                                  const chosenBank =
                                    app.bank_details ||
                                    (app as any).bankDetails ||
                                    worker?.bank_details;

                                  return (
                                    <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-50/70 via-white to-stone-50 dark:from-emerald-950/30 dark:via-stone-900 dark:to-stone-900 p-3.5 sm:p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                                          <Banknote size={15} className="text-emerald-600 dark:text-emerald-400" />
                                          <span>
                                            {language === 'hi'
                                              ? 'कामगार का चुना हुआ भुगतान माध्यम (Worker Payout Details)'
                                              : 'Worker Payout Details'}
                                          </span>
                                        </div>
                                        {app.status === 'paid' && (
                                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                                            {language === 'hi' ? '✓ भुगतान संपन्न' : '✓ Paid'}
                                          </span>
                                        )}
                                      </div>

                                      {chosenPaymentMode === 'cash' ? (
                                        <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-800/80">
                                          <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                                            <Wallet size={16} />
                                          </div>
                                          <div>
                                            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                              {language === 'hi'
                                                ? '💵 भुगतान माध्यम: हाथों-हाथ नकद (Cash on Site)'
                                                : '💵 Payment Mode: Cash in Hand'}
                                            </p>
                                            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                                              {language === 'hi'
                                                ? 'कामगार ने कार्यस्थल पर नकद भुगतान का चयन किया है। कृपया कामगार को सीधे नकद मेहनताना दें।'
                                                : 'Worker selected cash payment. Please pay the wage directly in cash on site.'}
                                            </p>
                                          </div>
                                        </div>
                                      ) : chosenPaymentMode === 'upi' || chosenUpi ? (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-white dark:bg-stone-800 p-2.5 border border-emerald-200/60 dark:border-stone-700">
                                          <div className="flex items-center gap-2">
                                            <Smartphone size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <div>
                                              <p className="text-[10px] text-stone-400 font-medium">UPI ID (Google Pay / PhonePe / Paytm)</p>
                                              <p className="font-mono text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                                {chosenUpi || 'UPI Not set'}
                                              </p>
                                            </div>
                                          </div>
                                          {chosenUpi && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                navigator.clipboard.writeText(chosenUpi);
                                                setCopiedText(chosenUpi);
                                                setTimeout(() => setCopiedText(null), 2000);
                                              }}
                                              className="btn-secondary text-xs py-1.5 px-3 flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                                            >
                                              <Copy size={12} />
                                              <span>
                                                {copiedText === chosenUpi
                                                  ? language === 'hi' ? 'कॉपी हो गया! ✓' : 'Copied! ✓'
                                                  : language === 'hi' ? 'UPI कॉपी करें' : 'Copy UPI'}
                                              </span>
                                            </button>
                                          )}
                                        </div>
                                      ) : chosenBank?.account_number ? (
                                        <div className="rounded-lg bg-white dark:bg-stone-800 p-3 border border-stone-200/80 dark:border-stone-700">
                                          <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                              <span className="text-[10px] text-stone-400 block">Account Holder</span>
                                              <span className="font-semibold text-stone-800 dark:text-stone-200">
                                                {chosenBank.account_holder_name || workerName}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-stone-400 block">Bank Name</span>
                                              <span className="font-semibold text-stone-800 dark:text-stone-200">
                                                {chosenBank.bank_name || 'Bank'}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-stone-400 block">Account Number</span>
                                              <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                                                {chosenBank.account_number}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-stone-400 block">IFSC Code</span>
                                              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                                {chosenBank.ifsc_code}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-2.5 border border-amber-200/70 dark:border-amber-800/70 text-xs text-amber-800 dark:text-amber-300">
                                          ⏳ {language === 'hi'
                                            ? 'कामगार ने अभी UPI/बैंक विवरण नहीं जोड़ा है। आप उन्हें कॉल करके सीधे भुगतान कर सकते हैं।'
                                            : 'Worker has not entered UPI/bank details yet. You can call the worker to pay.'}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Action Buttons based on Status */}
                              {app.status === 'pending' && (
                                <div className="flex gap-2 sm:flex-col shrink-0">
                                  <button
                                    onClick={() => updateStatus(appId, 'hired')}
                                    className="btn-primary text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer font-semibold"
                                    disabled={updating === appId}
                                  >
                                    {updating === appId ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <Check size={14} />
                                    )}
                                    <span>{language === 'hi' ? '✓ कामगार को हायर करें' : '✓ Hire Worker'}</span>
                                  </button>

                                  <button
                                    onClick={() => updateStatus(appId, 'rejected')}
                                    className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1 cursor-pointer"
                                    disabled={updating === appId}
                                  >
                                    <X size={14} />
                                    <span>{language === 'hi' ? 'अस्वीकार करें' : 'Reject'}</span>
                                  </button>
                                </div>
                              )}

                              {(app.status === 'accepted' || app.status === 'hired') && (
                                <div className="flex gap-2 sm:flex-col shrink-0">
                                  {worker?.phone && (
                                    <a
                                      href={`tel:${worker.phone}`}
                                      className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/50 hover:bg-emerald-100"
                                    >
                                      <Phone size={13} className="text-emerald-600 dark:text-emerald-400" />
                                      <span>{language === 'hi' ? 'कामगार को कॉल करें' : 'Call Worker'}</span>
                                    </a>
                                  )}

                                  {/* Recruiter cannot complete work; worker completes it */}
                                  <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs font-medium text-amber-800 dark:text-amber-300">
                                    <Clock size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                    <span>
                                      {language === 'hi'
                                        ? 'काम प्रगति पर है (कामगार द्वारा पूरा मार्क होगा)'
                                        : 'Work in progress (Worker will mark complete)'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {app.status === 'completed' && (
                                <div className="flex gap-2 sm:flex-col sm:items-end shrink-0">
                                  {worker?.phone && (
                                    <a
                                      href={`tel:${worker.phone}`}
                                      className="btn-secondary text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 font-semibold text-stone-700 dark:text-stone-300"
                                    >
                                      <Phone size={13} className="text-emerald-600 dark:text-emerald-400" />
                                      <span>{language === 'hi' ? 'कॉल करें' : 'Call'}</span>
                                    </a>
                                  )}

                                  <button
                                    onClick={() => {
                                      if (
                                        confirm(
                                          language === 'hi'
                                            ? 'क्या आपने कामगार को मेहनताना भेज दिया है? (Mark Payment Released)'
                                            : 'Have you released the payment to this worker? (Mark Payment Released)'
                                        )
                                      ) {
                                        updateStatus(appId, 'paid');
                                      }
                                    }}
                                    className="btn-primary text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer font-bold"
                                    disabled={updating === appId}
                                  >
                                    {updating === appId ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <CheckCircle2 size={14} />
                                    )}
                                    <span>
                                      {language === 'hi' ? '✓ भुगतान कर दिया' : '✓ Mark Paid'}
                                    </span>
                                  </button>
                                </div>
                              )}

                              {app.status === 'paid' && (
                                <div className="flex flex-col gap-1 sm:items-end shrink-0">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>{language === 'hi' ? 'भुगतान संपन्न ✓' : 'Payment Released ✓'}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}