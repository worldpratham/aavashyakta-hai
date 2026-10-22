import { useEffect, useState } from 'react';
import {
  Users,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Search,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Phone,
  MapPin,
  Banknote,
  Smartphone,
  Wallet,
  Building2,
  Sparkles,
  BarChart3,
  UserCheck,
  UserX,
} from 'lucide-react';
import { api, isAdminUser } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { timeAgo, formatWage } from '@/lib/format';
import { Link, useRouter } from '@/router';

export function AdminPage() {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { navigate } = useRouter();

  // If not admin, access control
  const isAdmin = isAdminUser(profile);

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'applications'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'worker' | 'employer'>('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  async function loadAdminData() {
    try {
      setRefreshing(true);
      const [statsData, usersData, jobsData, appsData] = await Promise.all([
        api.admin.getStats().catch(() => null),
        api.admin.getUsers().catch(() => []),
        api.admin.getJobs().catch(() => []),
        api.admin.getApplications().catch(() => []),
      ]);

      setStats(statsData);
      setUsers(usersData);
      setJobs(jobsData);
      setApplications(appsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // Actions
  async function handleToggleVerify(userId: string, currentStatus: boolean) {
    try {
      setActionInProgress(userId);
      await api.admin.toggleUserVerification(userId, !currentStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId || u._id === userId
            ? { ...u, is_verified: !currentStatus, verification_status: !currentStatus ? 'verified' : 'unverified' }
            : u
        )
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update verification');
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleToggleBan(userId: string, currentBanned: boolean) {
    const confirmMsg = currentBanned
      ? language === 'hi'
        ? 'क्या आप इस यूजर को अनब्लॉक करना चाहते हैं?'
        : 'Unblock this user account?'
      : language === 'hi'
      ? 'क्या आप वाकई इस यूजर को ब्लॉक / सस्पेंड करना चाहते हैं?'
      : 'Are you sure you want to suspend this user?';

    if (!confirm(confirmMsg)) return;

    try {
      setActionInProgress(userId);
      await api.admin.toggleUserBan(userId, !currentBanned);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId || u._id === userId ? { ...u, is_banned: !currentBanned } : u
        )
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update ban status');
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleDeleteJob(jobId: string, jobTitle: string) {
    const confirmMsg =
      language === 'hi'
        ? `क्या आप वाकई जॉब "${jobTitle}" को डिलीट करना चाहते हैं?`
        : `Delete job posting "${jobTitle}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      setActionInProgress(jobId);
      await api.admin.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => (j.id || j._id) !== jobId));
      if (stats) {
        setStats({ ...stats, totalJobs: Math.max(0, stats.totalJobs - 1) });
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to delete job');
    } finally {
      setActionInProgress(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-400">
        <Loader2 className="animate-spin text-purple-600 mb-2" size={32} />
        <p className="text-sm">Loading Manager Console...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center animate-fade-in">
        <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Access Restricted</h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {language === 'hi'
            ? 'यह पेज केवल प्लेटफॉर्म मैनेजर / ओनर (manager@gmail.com) के लिए उपलब्ध है।'
            : 'This page is only accessible to the Platform Manager / Owner (manager@gmail.com).'}
        </p>
        <Link to="/signin" className="btn-primary mt-6 inline-flex">
          {language === 'hi' ? 'मैनेजर के रूप में लॉगिन करें' : 'Sign in as Manager'}
        </Link>
      </div>
    );
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (u.name || u.full_name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.phone || '').includes(query) ||
      (u.location || '').toLowerCase().includes(query) ||
      (u.company_name || '').toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 animate-fade-in text-stone-900 dark:text-stone-100">
      {/* Top Banner */}
      <div className="mb-6 rounded-2xl border border-purple-200 dark:border-purple-800/80 bg-gradient-to-br from-purple-50/90 via-white to-stone-50 dark:from-purple-950/40 dark:via-stone-900 dark:to-stone-900 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 mb-2">
              <ShieldCheck size={14} />
              <span>{language === 'hi' ? 'ओनर / मैनेजर कंट्रोल' : 'Owner / Manager Control'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
              {language === 'hi' ? 'आवश्यकता है — एडमिन डैशबोर्ड' : 'Abasyakta — Manager Console'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              {language === 'hi'
                ? 'लॉगिन खाता: manager@gmail.com • प्लेटफॉर्म के सभी कामगार, रिक्रूटर, नौकरियां और पेमेंट्स प्रबंधित करें।'
                : 'Logged in as manager@gmail.com • Manage workers, employers, jobs, and wage payouts.'}
            </p>
          </div>

          <button
            onClick={loadAdminData}
            disabled={refreshing}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{language === 'hi' ? 'रिफ्रेश करें' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <BarChart3 size={16} />
          <span>{language === 'hi' ? 'ओवरव्यू (Overview)' : 'Overview'}</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Users size={16} />
          <span>
            {language === 'hi' ? 'यूजर प्रबंधन' : 'Users Management'} ({users.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'jobs'
              ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Briefcase size={16} />
          <span>
            {language === 'hi' ? 'जॉब मॉडरेशन' : 'Job Moderation'} ({jobs.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'applications'
              ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Banknote size={16} />
          <span>
            {language === 'hi' ? 'काम एवं पेमेंट्स' : 'Work & Payouts'} ({applications.length})
          </span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-stone-900 shadow-xs">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {language === 'hi' ? 'कुल कामगार' : 'Total Workers'}
                </span>
                <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                {stats?.totalWorkers ?? 0}
              </p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {language === 'hi' ? 'उपलब्ध कामगार' : 'Registered Candidates'}
              </p>
            </div>

            <div className="card p-5 border border-sky-200 dark:border-sky-800/80 bg-white dark:bg-stone-900 shadow-xs">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {language === 'hi' ? 'कुल नियोक्ता' : 'Total Employers'}
                </span>
                <Building2 size={18} className="text-sky-600 dark:text-sky-400" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                {stats?.totalEmployers ?? 0}
              </p>
              <p className="mt-1 text-xs text-sky-600 dark:text-sky-400 font-medium">
                {language === 'hi' ? 'दुकानें / कंपनियां' : 'Registered Businesses'}
              </p>
            </div>

            <div className="card p-5 border border-amber-200 dark:border-amber-800/80 bg-white dark:bg-stone-900 shadow-xs">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {language === 'hi' ? 'कुल नौकरियां' : 'Total Jobs'}
                </span>
                <Briefcase size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                {stats?.totalJobs ?? 0}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {stats?.openJobs ?? 0} {language === 'hi' ? 'एक्टिव' : 'Open'} • {stats?.closedJobs ?? 0}{' '}
                {language === 'hi' ? 'बंद' : 'Closed'}
              </p>
            </div>

            <div className="card p-5 border border-purple-200 dark:border-purple-800/80 bg-white dark:bg-stone-900 shadow-xs">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {language === 'hi' ? 'काम पूरा / भुगतान' : 'Completed / Paid'}
                </span>
                <CheckCircle2 size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                {stats?.completedApplications ?? 0}
              </p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ {stats?.paidApplications ?? 0} {language === 'hi' ? 'भुगतान संपन्न' : 'Paid Out'}
              </p>
            </div>
          </div>

          {/* Payment Mode Breakdown */}
          <div className="card p-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-2">
              <Banknote size={18} className="text-emerald-600" />
              <span>
                {language === 'hi'
                  ? 'पेमेंट माध्यम विश्लेषण (Payment Mode Breakdown)'
                  : 'Payout Methods Selected by Workers'}
              </span>
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {language === 'hi'
                ? 'कामगारों द्वारा काम पूरा करने पर चुने गए पेमेंट मोड का विवरण।'
                : 'Preferred payout modes chosen when workers mark tasks as completed.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 p-4">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                  <Wallet size={16} className="text-amber-600" />
                  <span>{language === 'hi' ? '💵 नकद (Cash on Site)' : '💵 Cash in Hand'}</span>
                </div>
                <p className="mt-2 text-2xl font-black text-amber-900 dark:text-amber-100">
                  {stats?.payouts?.cash ?? 0}
                </p>
                <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                  {language === 'hi' ? 'कार्यस्थल पर नकद भुगतान' : 'Direct on-site cash'}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-4">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                  <Smartphone size={16} className="text-emerald-600" />
                  <span>📱 UPI (GPay/PhonePe)</span>
                </div>
                <p className="mt-2 text-2xl font-black text-emerald-900 dark:text-emerald-100">
                  {stats?.payouts?.upi ?? 0}
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                  {language === 'hi' ? 'इंस्टेंट UPI ट्रांसफर' : 'Instant UPI transfers'}
                </p>
              </div>

              <div className="rounded-xl border border-sky-200/80 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/30 p-4">
                <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-bold text-xs">
                  <Building2 size={16} className="text-sky-600" />
                  <span>{language === 'hi' ? '🏦 बैंक ट्रांसफर' : '🏦 Bank Transfer'}</span>
                </div>
                <p className="mt-2 text-2xl font-black text-sky-900 dark:text-sky-100">
                  {stats?.payouts?.bank ?? 0}
                </p>
                <p className="mt-0.5 text-[11px] text-sky-700 dark:text-sky-300">
                  {language === 'hi' ? 'बैंक खाता एवं IFSC' : 'Direct bank deposits'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Search & Filter Bar */}
          <div className="card p-4 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'hi' ? 'नाम, फोन, शहर से खोजें...' : 'Search by name, phone, city...'}
                className="input pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-stone-500">{language === 'hi' ? 'रोल:' : 'Role:'}</span>
              <div className="flex rounded-lg bg-stone-100 dark:bg-stone-800 p-1 text-xs">
                {(['all', 'worker', 'employer'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1 rounded-md font-bold transition capitalize cursor-pointer ${
                      userRoleFilter === r
                        ? 'bg-white dark:bg-stone-700 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {r === 'all'
                      ? language === 'hi'
                        ? 'सभी'
                        : 'All'
                      : r === 'worker'
                      ? language === 'hi'
                        ? 'कामगार'
                        : 'Workers'
                      : language === 'hi'
                      ? 'नियोक्ता'
                      : 'Employers'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User List */}
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <Users size={36} className="mx-auto mb-2 text-stone-300 dark:text-stone-600" />
              <p>{language === 'hi' ? 'कोई यूजर नहीं मिला।' : 'No users match criteria.'}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredUsers.map((u) => {
                const isWorker = u.role === 'worker';
                const isBanned = Boolean(u.is_banned);
                const isVerified = Boolean(u.is_verified);

                return (
                  <div
                    key={u.id || u._id}
                    className={`card p-4 border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isBanned
                        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-stone-700 dark:text-stone-200 text-base shrink-0">
                        {(u.full_name || u.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                            {u.full_name || u.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isWorker
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            }`}
                          >
                            {isWorker ? 'Worker' : 'Employer'}
                          </span>

                          {isVerified ? (
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              ✓ Verified
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                              Unverified
                            </span>
                          )}

                          {isBanned && (
                            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-full">
                              Blocked / Suspended
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                          <span>📧 {u.email}</span>
                          {u.phone && <span>📞 {u.phone}</span>}
                          {u.location && <span>📍 {u.location}</span>}
                          {u.company_name && <span>🏢 {u.company_name}</span>}
                          {u.primary_skill && <span>🛠️ {u.primary_skill}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Manager Actions on User */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleToggleVerify(u.id || u._id, isVerified)}
                        disabled={actionInProgress === (u.id || u._id)}
                        className={`text-xs py-1.5 px-3 rounded-lg font-bold border transition cursor-pointer flex items-center gap-1 ${
                          isVerified
                            ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                        }`}
                      >
                        {isVerified ? (
                          <>
                            <UserX size={13} />
                            <span>{language === 'hi' ? 'वेरिफिकेशन हटाएं' : 'Unverify'}</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={13} />
                            <span>{language === 'hi' ? 'वेरिफाई करें ✓' : 'Verify Badge ✓'}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleBan(u.id || u._id, isBanned)}
                        disabled={actionInProgress === (u.id || u._id)}
                        className={`text-xs py-1.5 px-3 rounded-lg font-bold border transition cursor-pointer flex items-center gap-1 ${
                          isBanned
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {isBanned ? (
                          <>
                            <UserCheck size={13} />
                            <span>{language === 'hi' ? 'अनब्लॉक करें' : 'Unblock'}</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={13} />
                            <span>{language === 'hi' ? 'सस्पेंड / बैन' : 'Suspend / Ban'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: JOB MODERATION */}
      {activeTab === 'jobs' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {jobs.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <Briefcase size={36} className="mx-auto mb-2 text-stone-300 dark:text-stone-600" />
              <p>{language === 'hi' ? 'कोई नौकरी उपलब्ध नहीं।' : 'No jobs posted yet.'}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {jobs.map((job) => {
                const jobId = job.id || job._id;
                const employerName = job.employer_id?.full_name || job.employer_id?.name || 'Employer';

                return (
                  <div
                    key={jobId}
                    className="card p-4 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200">
                          {job.category}
                        </span>
                        <span
                          className={`badge border capitalize font-bold ${
                            job.status === 'open'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border-stone-200'
                          }`}
                        >
                          {job.status}
                        </span>
                        <span className="text-xs text-stone-400">
                          {job.applicationsCount ?? 0} {language === 'hi' ? 'आवेदक' : 'applicants'}
                        </span>
                      </div>

                      <Link to={`/jobs/${jobId}`}>
                        <h4 className="mt-1.5 font-bold text-base text-stone-900 dark:text-stone-100 hover:text-purple-600 transition">
                          {job.title}
                        </h4>
                      </Link>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                        <span>🏢 {employerName}</span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-emerald-600" />
                            {job.location}
                          </span>
                        )}
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {formatWage(job.wage, job.wage_type)}
                        </span>
                        <span>{timeAgo(job.createdAt || job.created_at)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteJob(jobId, job.title)}
                      disabled={actionInProgress === jobId}
                      className="btn-ghost text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 text-xs py-2 px-3 flex items-center gap-1.5 shrink-0 cursor-pointer rounded-lg border border-rose-200 dark:border-rose-900"
                      title="Delete this job posting"
                    >
                      <Trash2 size={14} />
                      <span>{language === 'hi' ? 'जॉब हटाएं' : 'Delete Job'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WORK & PAYOUTS MONITOR */}
      {activeTab === 'applications' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {applications.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <Banknote size={36} className="mx-auto mb-2 text-stone-300 dark:text-stone-600" />
              <p>{language === 'hi' ? 'कोई आवेदन या कार्य नहीं मिला।' : 'No applications found.'}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {applications.map((app) => {
                const appId = app.id || app._id;
                const worker = app.worker_id || app.worker;
                const job = app.job_id || app.job;
                const workerName = worker?.full_name || worker?.name || 'Worker';
                const jobTitle = job?.title || 'Job';
                const paymentMode = app.payment_mode || (app as any).paymentMode || worker?.payment_mode;

                return (
                  <div
                    key={appId}
                    className="card p-4 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs flex flex-col gap-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`badge border text-[11px] font-bold uppercase tracking-wider ${
                              app.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : app.status === 'completed'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : app.status === 'hired'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                          >
                            {app.status === 'paid'
                              ? '✓ Paid'
                              : app.status === 'completed'
                              ? '🏆 Work Completed'
                              : app.status}
                          </span>
                          <span className="text-xs text-stone-400">{timeAgo(app.createdAt || app.created_at)}</span>
                        </div>

                        <h4 className="mt-1 font-bold text-sm text-stone-900 dark:text-stone-100">
                          {workerName} ➔ {jobTitle}
                        </h4>
                      </div>

                      {/* Payment Mode Highlight */}
                      <div className="text-xs shrink-0">
                        {paymentMode === 'cash' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 font-bold">
                            <Wallet size={14} className="text-amber-600" />
                            <span>💵 {language === 'hi' ? 'हाथों-हाथ नकद (Cash)' : 'Cash in Hand'}</span>
                          </div>
                        ) : paymentMode === 'upi' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono font-bold">
                            <Smartphone size={14} className="text-emerald-600" />
                            <span>UPI: {app.upi_id || worker?.upi_id || 'Not set'}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 font-bold">
                            <Building2 size={14} className="text-sky-600" />
                            <span>Bank Transfer</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-2 border-t border-stone-100 dark:border-stone-800">
                      <span>👷 Worker: {workerName} ({worker?.phone || 'No phone'})</span>
                      {job?.wage && (
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          Wage: ₹{job.wage} ({job.wage_type || 'daily'})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
