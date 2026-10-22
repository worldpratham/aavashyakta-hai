import { useEffect, useState } from 'react';
import {
  Loader2,
  Inbox,
  MapPin,
  Trash2,
  Briefcase,
  CheckCircle2,
  Banknote,
  Sparkles,
  Smartphone,
  Building2,
  ShieldCheck,
  Wallet,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { api, type Application } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { timeAgo } from '@/lib/format';
import { Link } from '@/router';
import { WorkerPayoutModal } from '@/components/WorkerPayoutModal';
import { JobWorkplaceDirections } from '@/components/JobWorkplaceDirections';

export function MyApplicationsPage() {
  const { profile, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    app: Application | null;
    isMarkingDone: boolean;
  }>({
    isOpen: false,
    app: null,
    isMarkingDone: false,
  });

  async function load() {
    const workerId = profile?.id || (profile as any)?._id;
    if (!workerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.applications.getByWorker(workerId);
      setApps(data);
    } catch (error) {
      console.error('Failed to load applications from MongoDB:', error);
      setApps([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, (profile as any)?._id]);

  async function withdraw(id: string) {
    if (
      !confirm(
        language === 'hi'
          ? 'क्या आप वाकई यह आवेदन वापस लेना चाहते हैं?'
          : 'Are you sure you want to withdraw this application?'
      )
    )
      return;
    setRemoving(id);
    try {
      await api.applications.delete(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
    } catch (error: any) {
      alert(error?.message || 'Failed to withdraw application');
    } finally {
      setRemoving(null);
    }
  }

  const hasPayoutInfo = Boolean(
    profile?.payment_mode === 'cash' ||
      profile?.upi_id ||
      profile?.bank_details?.account_number
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400 dark:text-stone-500">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in text-stone-900 dark:text-stone-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {language === 'hi' ? 'मेरे आवेदन और कमाई' : 'My Applications & Payouts'}
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {language === 'hi'
              ? 'काम पूरा होने पर "Work Done" मार्क करें और अपना पेमेंट मोड (नकद / UPI / बैंक) चुनें।'
              : 'Track applications, mark work done, and select your payout method.'}
          </p>
        </div>

        {/* Global Payout Setup Quick Button for Worker */}
        <button
          onClick={() => {
            setModalState({
              isOpen: true,
              app: apps[0] || null,
              isMarkingDone: false,
            });
          }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer self-start sm:self-auto"
        >
          <Banknote size={15} className="text-emerald-600 dark:text-emerald-400" />
          <span>
            {hasPayoutInfo
              ? language === 'hi'
                ? '✓ पेमेंट मोड सेट है'
                : '✓ Payment Mode Set'
              : language === 'hi'
              ? '+ पेमेंट मोड चुनें (UPI/बैंक/नकद)'
              : '+ Set Payment Mode'}
          </span>
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox size={40} className="text-stone-300 dark:text-stone-600" />
          <p className="mt-3 text-stone-600 dark:text-stone-300 font-medium">
            {language === 'hi'
              ? 'आपने अभी तक किसी काम के लिए आवेदन नहीं किया है।'
              : 'You have not applied for any jobs yet.'}
          </p>
          <Link to="/jobs" className="btn-primary mt-4">
            {language === 'hi' ? 'उपलब्ध काम खोजें' : 'Browse Jobs'}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {apps.map((app) => {
            const isCompleted = app.status === 'completed';
            const isHired = app.status === 'accepted' || app.status === 'hired';
            const isPaid = app.status === 'paid';
            const wage = app.job?.wage || app.expected_wage;

            // Determine active payment mode for this application / profile
            const activePaymentMode =
              app.payment_mode ||
              (app as any).paymentMode ||
              profile?.payment_mode ||
              'upi';
            const activeUpi =
              app.upi_id || (app as any).upiId || profile?.upi_id || '';
            const activeBank =
              app.bank_details || (app as any).bankDetails || profile?.bank_details;

            return (
              <div
                key={app.id}
                className={`card p-5 border shadow-sm transition ${
                  isPaid
                    ? 'border-emerald-500/70 bg-gradient-to-br from-emerald-50/40 via-white to-stone-50 dark:from-emerald-950/20 dark:via-stone-900 dark:to-stone-900'
                    : isCompleted
                    ? 'border-purple-400 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 via-white to-stone-50 dark:from-purple-950/20 dark:via-stone-900 dark:to-stone-900'
                    : isHired
                    ? 'border-emerald-400/80 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/30 via-white to-stone-50 dark:from-emerald-950/20 dark:via-stone-900 dark:to-stone-900'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-emerald-500'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {app.job && (
                        <span className="badge bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/70 dark:border-stone-700/70">
                          {app.job.category}
                        </span>
                      )}

                      {app.status === 'pending' && (
                        <span className="badge border font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/70">
                          🟡 {language === 'hi' ? 'समीक्षाधीन (Under Review)' : 'Under Review'}
                        </span>
                      )}

                      {isHired && (
                        <span className="badge border font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70 inline-flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          <span>
                            {language === 'hi'
                              ? '🎉 आप हायर हो गए (Hired ✓)'
                              : 'You are Hired! ✓'}
                          </span>
                        </span>
                      )}

                      {isCompleted && (
                        <span className="badge border font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/70 inline-flex items-center gap-1">
                          <Sparkles size={13} />
                          <span>
                            {language === 'hi'
                              ? '🏆 काम पूरा हुआ (Work Done)'
                              : 'Work Done (Awaiting Wage Release)'}
                          </span>
                        </span>
                      )}

                      {isPaid && (
                        <span className="badge border font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 inline-flex items-center gap-1">
                          <ShieldCheck size={13} />
                          <span>
                            {language === 'hi'
                              ? '✓ भुगतान प्राप्त (Wage Paid)'
                              : '✓ Wage Paid Released'}
                          </span>
                        </span>
                      )}

                      {app.status === 'rejected' && (
                        <span className="badge border font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/70">
                          {language === 'hi' ? 'अस्वीकृत (Rejected)' : 'Rejected'}
                        </span>
                      )}
                    </div>

                    {app.job && (
                      <Link to={`/jobs/${app.job.id}`}>
                        <h3 className="mt-2 text-base font-bold text-stone-900 dark:text-stone-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                          {app.job.title}
                        </h3>
                      </Link>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                      {app.job?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-emerald-600 dark:text-emerald-400" />{' '}
                          {app.job.location}
                        </span>
                      )}
                      {wage && (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          💰 ₹{wage}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Briefcase size={12} className="text-stone-400 dark:text-stone-500" /> Applied{' '}
                        {timeAgo(app.created_at)}
                      </span>
                    </div>

                    {/* 📍 Live Work Site Location & Direction Button */}
                    {app.job && (
                      <div className="mt-2.5">
                        <JobWorkplaceDirections job={app.job} compact={true} />
                      </div>
                    )}

                    {app.message && (
                      <p className="mt-3 rounded-xl bg-stone-50 dark:bg-stone-800/70 p-3 text-xs sm:text-sm text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60 leading-relaxed">
                        "{app.message}"
                      </p>
                    )}

                    {/* STATUS: HIRED -> WORKER CAN MARK WORK COMPLETED & CHOOSE PAYMENT MODE */}
                    {isHired && (
                      <div className="mt-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-50 via-white to-stone-50 dark:from-emerald-950/40 dark:via-stone-900 dark:to-stone-900 p-4 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                              <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
                              {language === 'hi'
                                ? 'काम पूरा होने पर "Work Done" मार्क करें'
                                : 'Mark Work Done when finished'}
                            </p>
                            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                              {language === 'hi'
                                ? 'काम खत्म होते ही नीचे दिए गए बटन पर क्लिक करके काम पूरा मार्क करें और अपना पेमेंट मोड (नकद / UPI / बैंक) चुनें।'
                                : 'Click the button below when your work is complete to mark it done and choose your payment method (Cash, UPI, or Bank).'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setModalState({
                                isOpen: true,
                                app,
                                isMarkingDone: true,
                              })
                            }
                            className="btn-primary text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer shrink-0 transition"
                          >
                            <CheckCircle2 size={16} />
                            <span>
                              {language === 'hi'
                                ? '✓ काम पूरा हुआ (Mark Work Done)'
                                : '✓ Mark Work Done'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STATUS: WORK COMPLETED -> SHOWS CHOSEN PAYMENT MODE & BUTTON TO EDIT */}
                    {isCompleted && (
                      <div className="mt-4 rounded-xl border border-purple-200 dark:border-purple-800/70 bg-purple-50/70 dark:bg-purple-950/40 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                              <CheckCircle2 size={15} className="text-purple-600 dark:text-purple-400" />
                              {language === 'hi'
                                ? 'काम पूरा मार्क हो चुका है (Awaiting Employer Payment)'
                                : 'You marked this work as Done!'}
                            </p>

                            <div className="mt-2 p-2.5 rounded-lg bg-white dark:bg-stone-800 border border-purple-200/80 dark:border-stone-700 text-xs">
                              <span className="text-[11px] font-bold text-stone-500 uppercase block mb-1">
                                {language === 'hi' ? 'चुना हुआ भुगतान माध्यम:' : 'Chosen Payment Method:'}
                              </span>

                              {activePaymentMode === 'cash' ? (
                                <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-semibold">
                                  <Wallet size={16} className="text-amber-600 dark:text-amber-400" />
                                  <span>
                                    {language === 'hi'
                                      ? '💵 हाथों-हाथ नकद (Cash on Site) - नियोक्ता से सीधे नकद प्राप्त करें'
                                      : '💵 Cash in Hand - To be collected directly from employer'}
                                  </span>
                                </div>
                              ) : activePaymentMode === 'upi' ? (
                                <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-mono font-bold">
                                  <Smartphone size={16} className="text-emerald-600 dark:text-emerald-400" />
                                  <span>📱 UPI: {activeUpi || 'Not set'}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-semibold">
                                  <Building2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                                  <span>
                                    🏦 बैंक खाता: ****
                                    {activeBank?.account_number?.slice(-4) || '----'} (
                                    {activeBank?.bank_name || 'Bank'})
                                  </span>
                                </div>
                              )}
                            </div>

                            <p className="mt-2 text-[11px] text-purple-700 dark:text-purple-300">
                              {language === 'hi'
                                ? 'नियोक्ता को सूचना भेज दी गई है। भुगतान मिलते ही यह स्थिति "Paid" में बदल जाएगी।'
                                : 'Employer has been informed. Status will update to Paid once they release your wage.'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setModalState({
                                isOpen: true,
                                app,
                                isMarkingDone: false,
                              })
                            }
                            className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Banknote size={13} />
                            <span>
                              {language === 'hi' ? 'पेमेंट मोड बदलें' : 'Change Mode'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STATUS: WAGE PAID -> CONFIRMATION BANNER */}
                    {isPaid && (
                      <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/40 p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={22} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                              {language === 'hi'
                                ? 'मेहनताना ट्रांसफर कर दिया गया है! (Payment Received)'
                                : 'Payment Successfully Released!'}
                            </h4>
                            <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                              {language === 'hi'
                                ? `नियोक्ता द्वारा आपके चुने गए माध्यम (${
                                    activePaymentMode === 'cash'
                                      ? 'नकद'
                                      : activePaymentMode === 'upi'
                                      ? `UPI: ${activeUpi}`
                                      : 'बैंक खाता'
                                  }) पर मेहनताना जारी कर दिया गया है।`
                                : `The employer has released your payout. Please check your account/cash.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Allow withdraw ONLY if still pending or rejected */}
                  {(app.status === 'pending' || app.status === 'rejected') && (
                    <button
                      onClick={() => withdraw(app.id)}
                      className="btn-ghost text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 p-2 rounded-lg"
                      disabled={removing === app.id}
                      title="Withdraw application"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payout Claim & Setup Modal */}
      {modalState.isOpen && (
        <WorkerPayoutModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false, app: null, isMarkingDone: false })}
          jobTitle={modalState.app?.job?.title || 'Job'}
          wageAmount={
            modalState.app?.job?.wage
              ? Number(modalState.app.job.wage)
              : modalState.app?.expected_wage || null
          }
          applicationId={modalState.app?.id}
          isMarkingDone={modalState.isMarkingDone}
          initialPaymentMode={
            (modalState.app?.payment_mode as any) ||
            ((modalState.app as any)?.paymentMode as any) ||
            profile?.payment_mode
          }
          onSuccess={async () => {
            await refreshProfile();
            await load();
          }}
        />
      )}
    </div>
  );
}
