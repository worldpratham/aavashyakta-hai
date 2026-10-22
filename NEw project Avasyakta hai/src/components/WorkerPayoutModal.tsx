import { useState, useEffect } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Banknote,
  Sparkles,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface WorkerPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  wageAmount?: number | null;
  applicationId?: string | null;
  isMarkingDone?: boolean;
  initialPaymentMode?: 'upi' | 'bank_transfer' | 'cash';
  onSuccess?: () => void;
}

export function WorkerPayoutModal({
  isOpen,
  onClose,
  jobTitle,
  wageAmount,
  applicationId,
  isMarkingDone = false,
  initialPaymentMode,
  onSuccess,
}: WorkerPayoutModalProps) {
  const { profile, refreshProfile } = useAuth();
  const { language } = useLanguage();

  const [paymentMode, setPaymentMode] = useState<'upi' | 'bank_transfer' | 'cash'>(
    initialPaymentMode ||
      (profile?.payment_mode === 'cash'
        ? 'cash'
        : profile?.payment_mode === 'bank_transfer'
        ? 'bank_transfer'
        : 'upi')
  );
  const [upiId, setUpiId] = useState(profile?.upi_id || '');
  const [accountHolderName, setAccountHolderName] = useState(
    profile?.bank_details?.account_holder_name || profile?.full_name || ''
  );
  const [accountNumber, setAccountNumber] = useState(
    profile?.bank_details?.account_number || ''
  );
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(
    profile?.bank_details?.account_number || ''
  );
  const [ifscCode, setIfscCode] = useState(
    profile?.bank_details?.ifsc_code || ''
  );
  const [bankName, setBankName] = useState(
    profile?.bank_details?.bank_name || ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync existing profile details on open
  useEffect(() => {
    if (profile) {
      if (initialPaymentMode) {
        setPaymentMode(initialPaymentMode);
      } else if (profile.payment_mode === 'cash') {
        setPaymentMode('cash');
      } else if (profile.payment_mode === 'bank_transfer') {
        setPaymentMode('bank_transfer');
      } else {
        setPaymentMode('upi');
      }

      if (profile.upi_id) setUpiId(profile.upi_id);
      if (profile.bank_details) {
        setAccountHolderName(profile.bank_details.account_holder_name || profile.full_name || '');
        setAccountNumber(profile.bank_details.account_number || '');
        setConfirmAccountNumber(profile.bank_details.account_number || '');
        setIfscCode(profile.bank_details.ifsc_code || '');
        setBankName(profile.bank_details.bank_name || '');
      }
    }
  }, [profile, isOpen, initialPaymentMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const userId = profile?.id || (profile as any)?._id;
    if (!userId) {
      setError(language === 'hi' ? 'कृपया दोबारा लॉगिन करें।' : 'User session not found. Please log in again.');
      return;
    }

    if (paymentMode === 'upi') {
      const cleanUpi = upiId.trim();
      if (!cleanUpi) {
        setError(language === 'hi' ? 'कृपया अपनी UPI ID दर्ज करें' : 'Please enter your UPI ID');
        return;
      }
      if (!cleanUpi.includes('@')) {
        setError(
          language === 'hi'
            ? 'कृपया सही UPI ID दर्ज करें (जैसे 9876543210@upi या name@oksbi)'
            : 'Please enter a valid UPI ID (e.g. mobile@upi)'
        );
        return;
      }
    } else if (paymentMode === 'bank_transfer') {
      if (!accountNumber.trim()) {
        setError(language === 'hi' ? 'बैंक खाता संख्या दर्ज करें' : 'Account number is required');
        return;
      }
      if (accountNumber.trim() !== confirmAccountNumber.trim()) {
        setError(
          language === 'hi' ? 'दोनों खाता संख्याएं मेल नहीं खा रही हैं' : 'Account numbers do not match'
        );
        return;
      }
      if (!ifscCode.trim() || ifscCode.trim().length < 9) {
        setError(language === 'hi' ? 'मान्य IFSC कोड दर्ज करें' : 'Valid IFSC code is required');
        return;
      }
    }

    setLoading(true);
    try {
      const upiValue = paymentMode === 'upi' ? upiId.trim() : (profile?.upi_id || '');
      const bankDetailsObj = {
        account_holder_name: accountHolderName.trim() || profile?.full_name || '',
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
        bank_name: bankName.trim(),
      };

      // If marking work as completed, update application status directly
      if (isMarkingDone && applicationId) {
        await api.applications.updateStatus(applicationId, 'completed', {
          payment_mode: paymentMode,
          upi_id: upiValue,
          bank_details: paymentMode === 'bank_transfer' ? bankDetailsObj : undefined,
        });
      } else if (applicationId) {
        // Just updating payout mode for this application
        await api.applications.updateStatus(applicationId, 'completed', {
          payment_mode: paymentMode,
          upi_id: upiValue,
          bank_details: paymentMode === 'bank_transfer' ? bankDetailsObj : undefined,
        }).catch(() => null);
      }

      // Update worker's profile so default payment mode is saved
      await api.users.update(userId, {
        payment_mode: paymentMode,
        upi_id: upiValue,
        bank_details: paymentMode === 'bank_transfer' ? bankDetailsObj : (profile?.bank_details || null),
      });

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Update payout details error:', err);
      setError(err?.message || 'Failed to save payout details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400">
            {isMarkingDone ? <CheckCircle2 size={24} /> : <Banknote size={24} />}
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-0.5">
              <Sparkles size={12} />
              <span>
                {isMarkingDone
                  ? language === 'hi'
                    ? 'काम पूरा मार्क करें'
                    : 'Mark Work Completed'
                  : language === 'hi'
                  ? 'भुगतान माध्यम'
                  : 'Payout Preferences'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {isMarkingDone
                ? language === 'hi'
                  ? 'काम पूरा हुआ एवं पेमेंट मोड चुनें'
                  : 'Mark Work Done & Select Payment Mode'
                : language === 'hi'
                ? 'भुगतान विवरण (Payout Details)'
                : 'Claim Wage Payout'}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {jobTitle} • {wageAmount ? `₹${wageAmount}` : 'Earned Wage'}
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="my-8 flex flex-col items-center justify-center py-6 text-center animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-3">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {isMarkingDone
                ? language === 'hi'
                  ? 'काम पूरा मार्क हो गया! ✓'
                  : 'Work Marked as Completed! ✓'
                : language === 'hi'
                ? 'भुगतान विवरण सुरक्षित! ✓'
                : 'Payout Details Saved! ✓'}
            </h3>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 max-w-sm">
              {isMarkingDone
                ? language === 'hi'
                  ? `नियोक्ता को काम पूरा होने और आपके चुने गए पेमेंट मोड (${
                      paymentMode === 'cash'
                        ? 'नकद'
                        : paymentMode === 'upi'
                        ? 'UPI'
                        : 'बैंक ट्रांसफर'
                    }) की सूचना भेज दी गई है।`
                  : 'Employer has been notified that work is done with your chosen payment method.'
                : language === 'hi'
                ? 'नियोक्ता को आपका बैंक/UPI विवरण भेज दिया गया है। भुगतान जल्द ही प्रोसेस होगा।'
                : 'Your payout details are shared with the recruiter for wage release.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Label for Payment Mode */}
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                {language === 'hi'
                  ? 'आप अपना मेहनताना किस माध्यम से लेना चाहते हैं?'
                  : 'Select your preferred payment method:'}
                <span className="text-rose-500 ml-1">*</span>
              </label>

              {/* 3 Payment Mode Buttons */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-stone-100 dark:bg-stone-800/60 p-1.5 border border-stone-200/60 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setPaymentMode('upi')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                    paymentMode === 'upi'
                      ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 shadow-xs border border-emerald-300/80 dark:border-emerald-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <Smartphone size={16} />
                  <span>UPI (GPay/PhonePe)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('bank_transfer')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                    paymentMode === 'bank_transfer'
                      ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 shadow-xs border border-emerald-300/80 dark:border-emerald-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <Building2 size={16} />
                  <span>{language === 'hi' ? 'बैंक खाता' : 'Bank A/C'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('cash')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                    paymentMode === 'cash'
                      ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 shadow-xs border border-emerald-300/80 dark:border-emerald-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <Wallet size={16} />
                  <span>{language === 'hi' ? '💵 नकद (Cash)' : '💵 Cash'}</span>
                </button>
              </div>
            </div>

            {/* Mode 1: UPI Input */}
            {paymentMode === 'upi' && (
              <div className="flex flex-col gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/30 p-4 animate-fade-in">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  {language === 'hi' ? 'आपकी UPI आईडी (VPA)' : 'Your UPI ID (VPA)'}
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. 9876543210@upi or yourname@oksbi"
                  className="input font-mono"
                  required
                />
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                  <span>{language === 'hi' ? 'त्वरित जोड़ें:' : 'Quick Suffix:'}</span>
                  {['@ybl', '@oksbi', '@paytm', '@okicici', '@axl'].map((suf) => (
                    <button
                      type="button"
                      key={suf}
                      onClick={() => {
                        const base = upiId.split('@')[0] || (profile?.phone || '9876543210');
                        setUpiId(`${base}${suf}`);
                      }}
                      className="px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 font-mono text-[10px] cursor-pointer"
                    >
                      {suf}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                  💡 {language === 'hi'
                    ? 'नियोक्ता आपके इस UPI पर PhonePe, Google Pay या Paytm से तुरंत पैसे भेज देगा।'
                    : 'Recruiter will send your wage directly to this UPI address.'}
                </p>
              </div>
            )}

            {/* Mode 2: Bank Transfer Fields */}
            {paymentMode === 'bank_transfer' && (
              <div className="flex flex-col gap-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/30 p-4 animate-fade-in">
                <div>
                  <label className="label">
                    {language === 'hi' ? 'खाता धारक का नाम' : 'Account Holder Name'}
                  </label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="As per bank passbook"
                    className="input"
                    required
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">
                      {language === 'hi' ? 'खाता संख्या' : 'Account Number'}
                    </label>
                    <input
                      type="password"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 10023456789"
                      className="input font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">
                      {language === 'hi' ? 'खाता संख्या दोबारा दर्ज करें' : 'Confirm Account Number'}
                    </label>
                    <input
                      type="text"
                      value={confirmAccountNumber}
                      onChange={(e) => setConfirmAccountNumber(e.target.value)}
                      placeholder="Re-enter account number"
                      className="input font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">
                      {language === 'hi' ? 'IFSC कोड' : 'IFSC Code'}
                    </label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      className="input uppercase font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">
                      {language === 'hi' ? 'बैंक का नाम' : 'Bank & Branch Name (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mode 3: Cash in Hand Option */}
            {paymentMode === 'cash' && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-900/60 bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-950/30 dark:to-stone-900 p-4 animate-fade-in">
                <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200 font-bold text-sm">
                  <Wallet size={20} className="text-amber-600 dark:text-amber-400" />
                  <span>{language === 'hi' ? 'हाथों-हाथ नकद भुगतान (Cash on Site)' : 'Cash in Hand Payment'}</span>
                </div>
                <p className="mt-2 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  {language === 'hi'
                    ? 'काम पूरा होने पर नियोक्ता आपको सीधे कार्यस्थल पर नकद (Cash) मेहनताना देगा। इसके लिए किसी बैंक खाते या UPI की आवश्यकता नहीं है।'
                    : 'The employer will pay you directly in cash at the work location upon finishing the task. No bank or UPI details needed.'}
                </p>
                {wageAmount && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-amber-200 dark:border-stone-700 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <span>{language === 'hi' ? 'नकद प्राप्य राशि:' : 'Cash Receivable:'}</span>
                    <span>₹{wageAmount}</span>
                  </div>
                )}
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 p-3 text-xs text-rose-700 dark:text-rose-300 font-medium">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Trust note */}
            <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
              <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {language === 'hi'
                  ? 'सुरक्षित भुगतान: आपका यह पेमेंट मोड नियोक्ता को भेज दिया जाएगा ताकि वह भुगतान कर सके।'
                  : 'Safe & Secure: Your payment choice will be shared with the employer to release your wage.'}
              </span>
            </div>

            {/* Submit Button */}
            <div className="mt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs py-2.5 px-4 cursor-pointer"
                disabled={loading}
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>

              <button
                type="submit"
                className="btn-primary text-xs py-2.5 px-5 font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>
                  {isMarkingDone
                    ? language === 'hi'
                      ? '✓ काम पूरा मार्क करें'
                      : '✓ Confirm Work Done'
                    : language === 'hi'
                    ? 'भुगतान विवरण सुरक्षित करें'
                    : 'Save Payout Details'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
