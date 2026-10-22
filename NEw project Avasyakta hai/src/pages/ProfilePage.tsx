import { useEffect, useState } from 'react';
import {
  Loader2,
  MapPin,
  Phone,
  CheckCircle2,
  Briefcase,
  HardHat,
  ShieldCheck,
  Building2,
  Award,
  Sparkles,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Plus,
  Check,
  Fingerprint,
  AlertCircle,
  Zap,
  Navigation,
} from 'lucide-react';
import { api, type Profile, JOB_CATEGORIES } from '@/lib/api';
import { getCurrentGPSPosition } from '@/lib/geo';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { parseSkills } from '@/lib/format';
import { OtpModal } from '@/components/OtpModal';
import { Link, useRouter } from '@/router';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { language, t } = useLanguage();
  const { navigate } = useRouter();

  // Wizard Step State (1: Personal & Contact, 2: Business/Skills Verification)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  // Common Profile State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  // Aadhaar Verification State
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [aadhaarOtpLoading, setAadhaarOtpLoading] = useState(false);
  const [aadhaarError, setAadhaarError] = useState<string | null>(null);
  const [aadhaarSuccessMsg, setAadhaarSuccessMsg] = useState<string | null>(null);

  // Worker specific
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [primarySkill, setPrimarySkill] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [isAvailableNow, setIsAvailableNow] = useState(false);
  const [availableStatusText, setAvailableStatusText] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [detectingProfileGps, setDetectingProfileGps] = useState(false);

  // Employer specific
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('Registered Company');
  const [gstOrId, setGstOrId] = useState('');

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<'phone_verify' | 'aadhaar_verify'>('aadhaar_verify');
  const [currentDebugOtp, setCurrentDebugOtp] = useState<string | undefined>();
  const [sendingOtp, setSendingOtp] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setFullName(profile.full_name || (profile as any).name || '');
    setPhone(profile.phone ?? '');
    setBio(profile.bio ?? '');
    setLocation(profile.location ?? '');

    // Format existing Aadhaar if available
    const rawAadhaar = (profile.aadhaar_number || '').replace(/\D/g, '');
    if (rawAadhaar) {
      const parts = rawAadhaar.match(/.{1,4}/g);
      setAadhaarNumber(parts ? parts.join(' ') : rawAadhaar);
    }
    if (profile.aadhaar_verified) {
      setIsAadhaarVerified(true);
    }

    // Worker fields
    setSkills(parseSkills(profile.skills));
    setPrimarySkill(profile.primary_skill || (parseSkills(profile.skills)[0] ?? 'Construction'));
    setExperienceLevel(profile.experience_level || '1-2 Years');
    setIsAvailableNow(profile.is_available_now ?? false);
    setAvailableStatusText(profile.available_status_text || '');
    setLatitude(profile.latitude ?? null);
    setLongitude(profile.longitude ?? null);

    // Employer fields
    setCompanyName(profile.company_name || '');
    setCompanyType(profile.company_type || 'Registered Company');
    setGstOrId(profile.gst_or_id || '');

    setLoading(false);
  }, [profile]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
    }
    setSkillInput('');
  };

  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  // Aadhaar Input Formatter (XXXX XXXX XXXX)
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    const parts = raw.match(/.{1,4}/g);
    setAadhaarNumber(parts ? parts.join(' ') : raw);

    const verifiedDigits = (profile?.aadhaar_number || '').replace(/\D/g, '');
    if (raw !== verifiedDigits) {
      setIsAadhaarVerified(false);
      setAadhaarSuccessMsg(null);
    }
    setAadhaarError(null);
  };

  // Dedicated Aadhaar OTP Trigger
  const handleInitiateAadhaarVerification = async () => {
    setAadhaarError(null);
    setAadhaarSuccessMsg(null);
    const rawAadhaar = aadhaarNumber.replace(/\s+/g, '');

    if (!rawAadhaar) {
      setAadhaarError(
        language === 'hi' ? '12-अंकीय आधार कार्ड नंबर दर्ज करें *' : 'Enter 12-digit Aadhaar number *'
      );
      return;
    }

    if (rawAadhaar.length !== 12) {
      setAadhaarError(
        language === 'hi' ? 'मान्य 12-अंकीय आधार नंबर अनिवार्य है *' : '12 Digits required *'
      );
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setAadhaarError(
        language === 'hi'
          ? 'आधार OTP प्राप्त करने के लिए Step 1 में 10-अंकीय मोबाइल नंबर आवश्यक है।'
          : 'Valid mobile number in Step 1 is required to receive OTP.'
      );
      return;
    }

    setAadhaarOtpLoading(true);
    try {
      const otpRes = await api.auth.sendOtp({
        phone: cleanPhone,
        email: profile?.email || '',
        purpose: 'aadhaar_verify',
      });

      setCurrentDebugOtp(otpRes.debugOtp);
      setOtpPurpose('aadhaar_verify');
      setShowOtpModal(true);
    } catch (err: any) {
      console.error('Aadhaar OTP error:', err);
      setAadhaarError(err?.message || 'Failed to send Aadhaar verification OTP. Please try again.');
    } finally {
      setAadhaarOtpLoading(false);
    }
  };

  // Step 1 Validation -> Navigate to Step 2
  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStepError(null);

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanLoc = location.trim();

    if (!cleanName) {
      setStepError(
        language === 'hi'
          ? 'कृपया अपना पूरा नाम दर्ज करें *'
          : 'Please enter your full name *'
      );
      return;
    }

    if (!cleanPhone) {
      setStepError(
        language === 'hi'
          ? 'कृपया अपना मोबाइल नंबर दर्ज करें *'
          : 'Please enter your mobile number *'
      );
      return;
    }

    if (cleanPhone.replace(/\D/g, '').length < 10) {
      setStepError(
        language === 'hi'
          ? 'कृपया मान्य 10-अंकीय मोबाइल नंबर दर्ज करें *'
          : 'Please enter a valid 10-digit mobile number *'
      );
      return;
    }

    if (!cleanLoc) {
      setStepError(
        language === 'hi'
          ? 'कृपया अपना शहर / इलाका दर्ज करें *'
          : 'Please enter your city / location *'
      );
      return;
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Save Handler (Step 2 Submit)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = profile?.id;
    if (!userId) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await api.users.update(userId, {
        full_name: fullName.trim(),
        name: fullName.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        aadhaar_number: aadhaarNumber.replace(/\s+/g, '') || null,
        aadhaar_verified: isAadhaarVerified,
        latitude: latitude,
        longitude: longitude,
        ...(profile.role === 'employer'
          ? {
              company_name: companyName.trim() || null,
              company_type: companyType || null,
              gst_or_id: gstOrId.trim() || null,
              is_verified: true,
              verification_status: 'verified',
            }
          : {
              skills: skills,
              primary_skill: primarySkill || null,
              experience_level: experienceLevel || null,
              is_available_now: isAvailableNow,
              available_status_text: availableStatusText.trim() || null,
              is_verified: true,
              verification_badge: 'verified_worker',
            }),
      });

      await refreshProfile();
      setSaved(true);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in text-stone-900 dark:text-stone-100">
      {/* 6-Digit OTP Modal for Aadhaar or Phone */}
      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerify={async (otpCode) => {
          try {
            await api.auth.verifyOtp({
              phone: phone.trim(),
              email: profile.email,
              otp: otpCode,
            });
            setShowOtpModal(false);

            if (otpPurpose === 'aadhaar_verify') {
              const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '');
              setIsAadhaarVerified(true);
              setAadhaarSuccessMsg(
                language === 'hi'
                  ? '✓ आधार कार्ड OTP द्वारा सफलतापूर्वक सत्यापित हो गया!'
                  : '✓ Aadhaar Card verified successfully via UIDAI OTP!'
              );

              // Persist directly to backend database
              if (profile?.id) {
                try {
                  await api.users.update(profile.id, {
                    aadhaar_number: cleanAadhaar,
                    aadhaar_verified: true,
                    is_verified: true,
                    verification_status: 'verified',
                  });
                } catch (e) {
                  console.error('Failed to update aadhaar status on backend:', e);
                }
              }

              await refreshProfile();
              setIsAadhaarVerified(true);
            } else {
              setSaved(true);
              await refreshProfile();
            }

            return { success: true };
          } catch (err: any) {
            return { success: false, error: err?.message || 'Invalid OTP code.' };
          }
        }}
        onResend={async () => {
          try {
            const res = await api.auth.sendOtp({
              phone: phone.trim(),
              email: profile.email,
              purpose: otpPurpose === 'aadhaar_verify' ? 'aadhaar_reverify' : 'phone_reverify',
            });
            setCurrentDebugOtp(res.debugOtp);
            return { success: true, debugOtp: res.debugOtp };
          } catch (err: any) {
            return { success: false, error: err?.message || 'Failed to resend OTP.' };
          }
        }}
        target={
          otpPurpose === 'aadhaar_verify'
            ? `${language === 'hi' ? 'आधार' : 'Aadhaar'}: ${aadhaarNumber || '12-Digits'} (+91 ${phone})`
            : (phone ? `+91 ${phone}` : profile.email || '')
        }
        title={
          otpPurpose === 'aadhaar_verify'
            ? (language === 'hi' ? 'UIDAI आधार OTP सत्यापन' : 'UIDAI Aadhaar OTP Verification')
            : (language === 'hi' ? 'मोबाइल नंबर OTP सत्यापन' : 'Verify Mobile Number with OTP')
        }
        initialDebugOtp={currentDebugOtp}
      />

      {/* Header Profile Info Card */}
      <div className="mb-6 card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-stone-200 dark:border-stone-800 dark:bg-stone-900 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white shadow-md">
              {(fullName || profile.full_name || 'U').charAt(0).toUpperCase()}
            </span>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-stone-900">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {fullName || profile.full_name}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <ShieldCheck size={13} />
                {profile.role === 'employer' ? 'Verified Recruiter' : 'Verified Candidate'}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1">
                {profile.role === 'employer' ? <Briefcase size={14} /> : <HardHat size={14} />}
                <span className="capitalize">
                  {profile.role === 'employer' ? 'Employer / Recruiter' : 'Worker / Candidate'}
                </span>
              </span>
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" /> {location}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3 text-xs text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60 max-w-xs">
          <p className="font-semibold text-stone-800 dark:text-stone-200">
            Account ID: <span className="font-mono text-stone-500 dark:text-stone-400">{profile.id.slice(-8)}</span>
          </p>
          <p className="mt-0.5 text-emerald-700 dark:text-emerald-400 font-medium">
            {isAadhaarVerified
              ? '✓ Aadhaar KYC Verified'
              : '✓ Level 1 Profile Active'}
          </p>
        </div>
      </div>

      {/* 2-Step Interactive Wizard Progress Bar */}
      <div className="mb-6 card p-3 sm:p-4 border border-stone-200 dark:border-stone-800 dark:bg-stone-900 shadow-xs">
        <div className="grid grid-cols-2 gap-3">
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left border ${
              currentStep === 1
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-xs'
                : 'border-transparent text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800/40 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                currentStep === 1
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : fullName && phone && location
                  ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              {fullName && phone && location ? <Check size={14} /> : '1'}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {language === 'hi' ? 'पहला कदम' : 'Step 1'}
              </p>
              <p className="text-xs sm:text-sm font-bold truncate">
                {language === 'hi' ? 'व्यक्तिगत व संपर्क' : 'Personal & Contact'}
              </p>
            </div>
          </button>

          {/* Step 2 Pill */}
          <button
            type="button"
            onClick={() => {
              if (!fullName.trim() || !phone.trim() || !location.trim()) {
                handleNextStep();
              } else {
                setCurrentStep(2);
              }
            }}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left border ${
              currentStep === 2
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-xs'
                : 'border-transparent text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800/40 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                currentStep === 2
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isAadhaarVerified
                  ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              {isAadhaarVerified ? <Check size={14} /> : '2'}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {language === 'hi' ? 'दूसरा कदम' : 'Step 2'}
              </p>
              <p className="text-xs sm:text-sm font-bold truncate">
                {profile.role === 'employer'
                  ? (language === 'hi' ? 'व्यापार व सत्यापन' : 'Business & KYC')
                  : (language === 'hi' ? 'हुनर व सत्यापन' : 'Skills & KYC')}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Profile Form */}
      <div className="card flex flex-col gap-6 p-6 sm:p-7 shadow-md border border-stone-200 dark:border-stone-800 dark:bg-stone-900">
        {/* ========================================================= */}
        {/* STEP 1: PERSONAL & CONTACT INFORMATION */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                {language === 'hi' ? 'व्यक्तिगत व संपर्क जानकारी' : 'Personal & Contact Information'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                {language === 'hi'
                  ? 'यह जानकारी संपर्क व पहचान के लिए उपयोग की जाएगी।'
                  : 'Please enter your personal details and active mobile number.'}
              </p>
            </div>

            {/* Error in Step 1 */}
            {stepError && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 p-3.5 text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium animate-shake">
                {stepError}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className="label">
                  {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <input
                  className="input"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (stepError) setStepError(null);
                  }}
                  placeholder={language === 'hi' ? 'उदा. राजेश शर्मा' : 'e.g. Rajesh Sharma'}
                  required
                />
              </div>

              {/* Mobile Number */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">
                    {language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
                    <span className="text-rose-500 ml-1">*</span>
                  </label>
                  {phone && phone.replace(/\D/g, '').length >= 10 && (
                    <button
                      type="button"
                      onClick={async () => {
                        setError(null);
                        setSendingOtp(true);
                        try {
                          const res = await api.auth.sendOtp({
                            phone: phone.trim(),
                            email: profile.email,
                            purpose: 'phone_verify',
                          });
                          setCurrentDebugOtp(res.debugOtp);
                          setOtpPurpose('phone_verify');
                          setShowOtpModal(true);
                        } catch (err: any) {
                          setError(err?.message || 'Could not send OTP.');
                        } finally {
                          setSendingOtp(false);
                        }
                      }}
                      disabled={sendingOtp}
                      className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound size={12} />
                      {sendingOtp
                        ? (language === 'hi' ? 'भेजा जा रहा है...' : 'Sending...')
                        : (language === 'hi' ? 'OTP से फोन सत्यापित करें' : 'Verify Mobile OTP')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-3.5 text-stone-400 dark:text-stone-500" />
                  <input
                    className="input pl-10"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (stepError) setStepError(null);
                    }}
                    placeholder="9876543210"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Location */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">
                    {language === 'hi' ? 'शहर / इलाका' : 'Location (City, Area)'}
                    <span className="text-rose-500 ml-1">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      setDetectingProfileGps(true);
                      try {
                        const res = await getCurrentGPSPosition();
                        setLatitude(res.latitude);
                        setLongitude(res.longitude);
                        if (res.cityName) setLocation(res.cityName);
                      } catch (e) {
                        console.warn('GPS detection failed:', e);
                      } finally {
                        setDetectingProfileGps(false);
                      }
                    }}
                    disabled={detectingProfileGps}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    {detectingProfileGps ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Navigation size={12} className="rotate-45" />
                    )}
                    <span>{language === 'hi' ? '📍 GPS स्थान भरें' : '📍 Auto-detect GPS'}</span>
                  </button>
                </div>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3.5 top-3.5 text-stone-400 dark:text-stone-500" />
                  <input
                    className="input pl-10"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      if (stepError) setStepError(null);
                    }}
                    placeholder={language === 'hi' ? 'उदा. भोपाल, दिल्ली, जयपुर' : 'e.g. Bhopal, South Delhi, Jaipur'}
                    required
                  />
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div>
                <label className="label">
                  {language === 'hi' ? 'ईमेल पता (पंजीकृत)' : 'Email Address (Registered)'}
                </label>
                <input
                  className="input bg-stone-100 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 cursor-not-allowed"
                  value={profile.email}
                  disabled
                />
              </div>
            </div>

            {/* Bottom Next Button */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                className="btn-primary py-3.5 px-6 font-semibold shadow-md flex items-center gap-2 cursor-pointer text-sm"
              >
                <span>
                  {profile.role === 'employer'
                    ? (language === 'hi' ? 'अगला: व्यापार व आधार सत्यापन' : 'Next: Business & Aadhaar Verification')
                    : (language === 'hi' ? 'अगला: हुनर व आधार सत्यापन' : 'Next: Skills & Aadhaar Verification')}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: BUSINESS & HIRING VERIFICATION (EMPLOYER) OR SKILLS */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <form onSubmit={handleSave} className="flex flex-col gap-5 animate-fade-in">
            {/* Header */}
            {profile.role === 'employer' ? (
              <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <Building2 size={22} className="text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">
                    {language === 'hi' ? 'व्यापार व आधार सत्यापन' : 'Business & Aadhaar Verification'}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                    {language === 'hi'
                      ? 'कंपनी और आधार सत्यापन विवरण भरें ताकि कामगारों को पूर्ण विश्वास मिल सके।'
                      : 'Provide business credentials and verify Aadhaar via OTP for instant credibility.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <Award size={22} className="text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">
                    {language === 'hi' ? 'हुनर और आधार सत्यापन' : 'Skills & Aadhaar Verification'}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                    {language === 'hi'
                      ? 'अपने काम की श्रेणी जोड़ें और आधार कार्ड OTP द्वारा सत्यापित करें।'
                      : 'Add your trade skills and verify Aadhaar via UIDAI OTP.'}
                  </p>
                </div>
              </div>
            )}

            {/* 1. Dedicated Aadhaar Card Number & OTP Verification Component */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Fingerprint size={22} className="text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {language === 'hi' ? 'आधार कार्ड नंबर व OTP सत्यापन' : 'Aadhaar Card Number & UIDAI OTP'}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {language === 'hi'
                        ? 'सुरक्षा व प्रामाणिकता के लिए आधार कार्ड OTP द्वारा सत्यापित करें'
                        : 'Verify identity via UIDAI security code sent to your linked phone'}
                    </p>
                  </div>
                </div>

                <div>
                  {isAadhaarVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 size={13} />
                      <span>{language === 'hi' ? 'सत्यापित (Verified ✓)' : 'Verified via UIDAI ✓'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <AlertCircle size={13} />
                      <span>{language === 'hi' ? 'असत्यापित (Unverified)' : 'Unverified'}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={handleAadhaarChange}
                    placeholder="XXXX XXXX XXXX (12 Digits)"
                    maxLength={14}
                    className="input tracking-wider font-mono text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-200"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleInitiateAadhaarVerification}
                  disabled={aadhaarOtpLoading || isAadhaarVerified}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shrink-0 ${
                    isAadhaarVerified
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm cursor-pointer'
                  }`}
                >
                  {aadhaarOtpLoading ? (
                    <div className="flex items-center gap-1.5">
                      <Loader2 size={15} className="animate-spin" />
                      <span>{language === 'hi' ? 'OTP भेजा जा रहा है...' : 'Sending OTP...'}</span>
                    </div>
                  ) : isAadhaarVerified ? (
                    <>
                      <CheckCircle2 size={15} />
                      <span>{language === 'hi' ? 'आधार सत्यापित ✓' : 'Aadhaar Verified ✓'}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={15} />
                      <span>{language === 'hi' ? 'OTP से सत्यापित करें' : 'Verify via OTP'}</span>
                    </>
                  )}
                </button>
              </div>

              {aadhaarError && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{aadhaarError}</span>
                </div>
              )}

              {aadhaarSuccessMsg && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{aadhaarSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Employer Specific Fields */}
            {profile.role === 'employer' && (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">
                      {language === 'hi' ? 'कंपनी / दुकान का नाम' : 'Company / Business Name'}
                    </label>
                    <input
                      className="input"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={
                        language === 'hi'
                          ? 'उदा. शर्मा कंस्ट्रक्शन या Apex Facilities'
                          : 'e.g. Apex Electricals & Facilities'
                      }
                    />
                  </div>

                  <div>
                    <label className="label">
                      {language === 'hi' ? 'व्यवसाय का प्रकार' : 'Business Category'}
                    </label>
                    <select
                      className="input"
                      value={companyType}
                      onChange={(e) => setCompanyType(e.target.value)}
                    >
                      <option value="Registered Company">Registered Company / Enterprise</option>
                      <option value="Small Business / Shop">Local Shop / Store / Workshop</option>
                      <option value="Contractor / Agency">Contractor / Labor Agency</option>
                      <option value="Individual Hirer">Individual / Private Residence</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">
                    {language === 'hi'
                      ? 'GST / Trade License / PAN नंबर (वैकल्पिक)'
                      : 'GST / Trade License / PAN Verification Number (Optional)'}
                  </label>
                  <input
                    className="input"
                    value={gstOrId}
                    onChange={(e) => setGstOrId(e.target.value)}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                  />
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    {language === 'hi'
                      ? 'सत्यापित व्यवसायों को कामगारों द्वारा प्राथमिकता और अधिक विश्वास मिलता है।'
                      : 'Verified businesses receive priority candidate applications and higher trust.'}
                  </p>
                </div>
              </div>
            )}

            {/* Worker Specific Fields */}
            {profile.role === 'worker' && (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">
                      {language === 'hi' ? 'मुख्य कार्य / हुनर' : 'Primary Trade / Skill'}
                    </label>
                    <select
                      className="input"
                      value={primarySkill}
                      onChange={(e) => setPrimarySkill(e.target.value)}
                    >
                      {JOB_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      {language === 'hi' ? 'कार्य अनुभव' : 'Experience Level'}
                    </label>
                    <select
                      className="input"
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                    >
                      <option value="Fresher / <1 Year">Fresher (0-1 Year)</option>
                      <option value="1-2 Years">1 - 2 Years</option>
                      <option value="3-5 Years">3 - 5 Years</option>
                      <option value="5+ Years">5+ Years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">
                    {language === 'hi' ? 'अतिरिक्त हुनर (Tags)' : 'Additional Skill Tags'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="Type a skill and press Enter"
                      list="skill-suggestions"
                    />
                    <button type="button" onClick={addSkill} className="btn-secondary">
                      Add
                    </button>
                  </div>
                  <datalist id="skill-suggestions">
                    {JOB_CATEGORIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  {skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {skills.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => removeSkill(s)}
                          className="badge bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 border border-emerald-200/60 dark:border-emerald-800/60 transition cursor-pointer"
                          title="Click to remove"
                        >
                          {s} ×
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Worker Live Instant Availability Card */}
            {profile.role === 'worker' && (
              <div
                className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                  isAvailableNow
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-4 w-4">
                      {isAvailableNow && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-4 w-4 ${
                          isAvailableNow ? 'bg-emerald-500' : 'bg-stone-400'
                        }`}
                      ></span>
                    </span>
                    <div>
                      <p className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <span>
                          {isAvailableNow
                            ? language === 'hi'
                              ? '🟢 तत्काल काम के लिए उपलब्ध (Online)'
                              : '🟢 Online - Ready for Work Now'
                            : language === 'hi'
                            ? '⚪ ऑफलाइन (Offline)'
                            : '⚪ Offline - Not Available Now'}
                        </span>
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {isAvailableNow
                          ? language === 'hi'
                            ? 'नियोक्ता आपको होमपेज पर शीर्ष पर देख सकते हैं और सीधे कॉल कर सकते हैं'
                            : 'Recruiters can see you on the live showcase and call you directly'
                          : language === 'hi'
                          ? 'चालू करें ताकि नए काम के लिए नियोक्ता आपसे तुरंत संपर्क कर सकें'
                          : 'Turn on to get urgent same-day job opportunities'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAvailableNow(!isAvailableNow)}
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isAvailableNow ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isAvailableNow ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {isAvailableNow && (
                  <div className="mt-3.5 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60">
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      {language === 'hi' ? 'स्टेटस नोट (उपलब्धता विवरण):' : 'Status Note (Availability Details):'}
                    </label>
                    <input
                      type="text"
                      value={availableStatusText}
                      onChange={(e) => setAvailableStatusText(e.target.value)}
                      placeholder={
                        language === 'hi'
                          ? 'उदा. 2 घंटे में शुरू कर सकता हूँ, प्लंबिंग / इलेक्ट्रीशियन कार्य...'
                          : 'e.g. Ready in 2 hours, Available for Plumber / Electrician jobs...'
                      }
                      className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* About / Bio */}
            <div>
              <label className="label">{language === 'hi' ? 'अपने बारे में / परिचय' : 'About / Bio'}</label>
              <textarea
                className="input min-h-[90px] resize-y"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={
                  profile.role === 'employer'
                    ? language === 'hi'
                      ? 'अपनी कंपनी, काम के माहौल या भर्ती की जरूरतों के बारे में बताएं...'
                      : 'Describe your company, work culture, or hiring requirements...'
                    : language === 'hi'
                    ? 'अपने काम, अनुभव और समय के बारे में बताएं...'
                    : 'Describe your background, past work, and availability...'
                }
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300">
                {error}
              </p>
            )}

            {/* Success Message Card with Next Actions */}
            {saved && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 p-4 animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? '✓ प्रोफाइल व आधार सत्यापन विवरण सफलतापूर्वक सुरक्षित हो गया!'
                      : '✓ Profile & Aadhaar verification details saved successfully!'}
                  </span>
                </div>
                {profile.role === 'employer' ? (
                  <Link
                    to="/post-job"
                    className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0"
                  >
                    <Plus size={14} />
                    <span>{language === 'hi' ? 'नौकरी पोस्ट करें' : 'Post a Job Now'}</span>
                  </Link>
                ) : (
                  <Link
                    to="/jobs"
                    className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0"
                  >
                    <span>{language === 'hi' ? 'काम ढूंढें' : 'Browse Jobs'}</span>
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            )}

            {/* Bottom Actions: Back to Step 1 & Save Profile */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn-secondary py-3 px-4 font-semibold flex items-center gap-2 cursor-pointer text-sm"
              >
                <ArrowLeft size={16} />
                <span>{language === 'hi' ? 'पिछला कदम' : 'Back to Personal Info'}</span>
              </button>

              <button
                type="submit"
                className="btn-primary py-3.5 px-6 font-semibold shadow-md flex items-center gap-2 cursor-pointer text-sm"
                disabled={saving}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>{language === 'hi' ? 'सुरक्षित किया जा रहा है...' : 'Saving changes...'}</span>
                  </div>
                ) : (
                  <>
                    <Check size={16} />
                    <span>
                      {language === 'hi' ? 'प्रोफाइल सुरक्षित करें' : 'Save Profile Changes'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
