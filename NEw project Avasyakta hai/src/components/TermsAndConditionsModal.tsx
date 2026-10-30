import React from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle,
  Scale,
  Clock,
  HeartHandshake,
  AlertTriangle,
  FileText,
  Check,
  Ban,
  DollarSign,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  isAccepted?: boolean;
}

export function TermsAndConditionsModal({
  isOpen,
  onClose,
  onAccept,
  isAccepted = false,
}: TermsModalProps) {
  const { language } = useLanguage();

  if (!isOpen) return null;

  const clauses = [
    {
      id: 1,
      icon: <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      titleHi: '1. मंच की भूमिका - केवल तकनीकी मध्यस्थ (Intermediary & Technology Platform Only)',
      titleEn: 'Platform Role: Technology Intermediary Only',
      descHi:
        '"आवश्यकता है" (Aavashyakta Hai) केवल नियोक्ताओं (Employers) और कामगारों (Workers) को एक दूसरे से सीधे जोड़ने वाला एक डिजिटल सूचना मंच (Technology Facilitator / Intermediary) है। वेबसाइट या इसके मालिक (Website Owner / Developers / Admins) किसी भी उपयोगकर्ता के नियोक्ता, ठेकेदार, भर्ती एजेंसी, पार्टनर या कानूनी प्रतिनिधि नहीं हैं।',
      descEn:
        '"Aavashyakta Hai" operates strictly as an independent technology intermediary connecting local employers and workers. The platform and its owners/developers do not act as an employer, contractor, recruiter agency, partner, or legal representative for any party.',
      highlightsHi: ['केवल सूचना व संपर्क मंच', 'कोई एजेंसी या ठेकेदार नहीं', 'दोनों पक्ष स्वतंत्र उपयोगकर्ता'],
    },
    {
      id: 2,
      icon: <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      titleHi: '2. वेबसाइट मालिक की शून्य जवाबदेही (Absolute Zero Owner Liability & Disclaimer)',
      titleEn: 'Absolute Zero Owner Liability & Platform Disclaimer',
      descHi:
        'वेबसाइट मालिक, संचालक या डेवलपर्स की कार्यस्थल पर हुए किसी भी विवाद, दुर्व्यवहार, वित्तीय नुकसान, चोरी, दुर्घटना, चोट, जान-माल की हानि, धोखाधड़ी या आपराधिक घटना के लिए 0% जिम्मेदारी (Zero Responsibility / Zero Liability) होगी। दोनों पक्ष अपनी स्वयं की समझ, विवेक और जोखिम (At Own Risk) पर एक-दूसरे से संपर्क और कार्य करते हैं।',
      descEn:
        'The website owner, developers, and administrators bear ABSOLUTE ZERO LIABILITY for any dispute, misbehavior, property loss, theft, accident, bodily injury, fatality, fraud, or criminal incident occurring between users on or off the platform. All interactions and jobs are executed at users\' own personal risk.',
      highlightsHi: ['मालिक की 0% जवाबदेही', 'समस्त जोखिम उपयोगकर्ता का', 'किसी नुकसान के लिए उत्तरदायी नहीं'],
    },
    {
      id: 3,
      icon: <Ban className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      titleHi: '3. दुर्व्यवहार, हिंसा, उत्पीड़न व गाली-गलौज पर पूर्ण प्रतिबंध (Zero Tolerance for Abuse & Personal Liability)',
      titleEn: 'Strict Ban on Misbehavior, Abuse, Harassment & Assault',
      descHi:
        'कार्यस्थल, फोन कॉल, चैट या व्यक्तिगत मुलाकात के दौरान किसी भी कामगार या नियोक्ता के साथ गाली-गलौज (Verbal Abuse), मारपीट (Physical Violence), लैंगिक उत्पीड़न (Sexual Harassment / छेड़छाड़), जातिगत/धार्मिक भेदभाव या बंधुआ व्यवहार पूर्णतः वर्जित है। ऐसा करने पर दोषी व्यक्ति स्वयं व्यक्तिगत रूप से भारतीय कानून (BNS / IPC / POSH Act) के तहत जेल व दंड का भागीदार होगा; वेबसाइट मालिक की इसमें कोई संलिप्तता या जिम्मेदारी नहीं होगी।',
      descEn:
        'Any form of verbal abuse, physical violence, harassment, sexual misconduct, discrimination, or exploitation is strictly illegal. The perpetrating individual bears 100% personal criminal and civil liability under Indian law. The website owner has zero tolerance and zero legal liability for such personal misconduct.',
      highlightsHi: ['दुर्व्यवहार पर सख्त कानूनी कार्रवाई', 'दोषी व्यक्ति स्वयं जिम्मेदार', 'थाना/कोर्ट में व्यक्तिगत उत्तरदायित्व'],
    },
    {
      id: 4,
      icon: <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />,
      titleHi: '4. गैर-कानूनी गतिविधियों व बाल मजदूरी पर पूर्ण रोक (Strict Ban on Illegal Tasks & Crime)',
      titleEn: 'Zero Tolerance for Illegal Tasks, Crime & Child Labor',
      descHi:
        'मंच पर किसी भी प्रकार के गैर-कानूनी कार्य (जैसे चोरी, नशीले पदार्थों या अवैध शराब की आपूर्ति, अनधिकृत खतरनाक कार्य, वेश्यावृत्ति या 18 वर्ष से कम उम्र के बच्चों से बाल मजदूरी / Child Labour) की पोस्टिंग या काम स्वीकार करना पूर्णतः प्रतिबंधित है। संलिप्त पाए जाने पर खाता तत्काल स्थायी रूप से बैन होगा और समस्त विवरण स्थानीय पुलिस को सौंप दिया जाएगा।',
      descEn:
        'Posting or accepting illegal, hazardous, or prohibited tasks (including child labor under 18, contraband/liquor transport, theft, unlicensed dangerous activities) is strictly prohibited. Violators will face immediate permanent account termination and evidence will be handed over to police authorities.',
      highlightsHi: ['बाल मजदूरी सख्त वर्जित', 'अवैध कार्यों पर तुरंत पुलिस FIR', 'खाता तुरंत स्थायी ब्लॉक'],
    },
    {
      id: 5,
      icon: <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      titleHi: '5. मजदूरी व वित्तीय लेन-देन का सीधा निपटारा (Direct Wages & Financial Settlement)',
      titleEn: 'Direct Wage Settlement - No Platform Financial Guarantee',
      descHi:
        'दैनिक मजदूरी, साप्ताहिक या मासिक वेतन सीधे नियोक्ता द्वारा कामगार को देय है। प्लेटफॉर्म 0% कमीशन पर काम करता है और किसी भी उपयोगकर्ता का पैसा रोककर या एस्क्रो (Escrow) में नहीं रखता। मजदूरी न मिलने, कम मिलने, देर होने, या कामगार द्वारा पेशगी (Advance) लेकर भाग जाने पर वेबसाइट मालिक किसी भी प्रकार के वित्तीय मुआवजे का पात्र या जिम्मेदार नहीं होगा।',
      descEn:
        'All wage rates, daily cash payouts, and work conditions are settled directly between employer and worker. The platform charges 0% commission and does not hold user funds. The platform owner is not liable for unpaid wages, deductions, payment delays, or unrecovered cash advances.',
      highlightsHi: ['0% कमीशन प्लेटफॉर्म', 'सीधा बैंक/UPI/नकद भुगतान', 'भुगतान विवाद में मालिक उत्तरदायी नहीं'],
    },
    {
      id: 6,
      icon: <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      titleHi: '6. कार्यस्थल सुरक्षा, दुर्घटना व जीवन जोखिम (Workplace Accidents, Injuries & Safety Waiver)',
      titleEn: 'Workplace Safety & Accidental Injury Waiver',
      descHi:
        'निर्माण कार्य, बिजली मरम्मत, भारी वजन, ऊंचाई पर कार्य, वेल्डिंग या वाहन चालन में निहित जोखिम होते हैं। कार्यस्थल पर सुरक्षा उपकरण (हेलमेट, जूते, सुरक्षा हार्नेस) व प्राथमिक उपचार (First Aid) की जिम्मेदारी नियोक्ता और कामगार की है। कार्य के दौरान होने वाली किसी भी चोट, अंग-हानि या दुर्घटना के लिए वेबसाइट या इसके मालिक उत्तरदायी नहीं होंगे।',
      descEn:
        'Manual, electrical, high-rise, construction, and driving tasks carry inherent physical risks. Providing safety equipment (PPE) and maintaining safe conditions is the sole responsibility of the employer and worker. The platform owner assumes no liability for workplace injuries, damages, or medical expenses.',
      highlightsHi: ['सुरक्षा उपकरण अनिवार्य', 'दुर्घटना में मालिक से कोई मुआवजा नहीं', 'दोनों पक्ष सतर्क रहें'],
    },
    {
      id: 7,
      icon: <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      titleHi: '7. स्वतंत्र पहचान, पता व चरित्र सत्यापन (Mandatory Due Diligence & Identity Verification)',
      titleEn: 'Mandatory Due Diligence & Physical Verification',
      descHi:
        'यद्यपि मंच पर मोबाइल व आधार सत्यापन की व्यवस्था है, तथापि किसी व्यक्ति को अपने घर/दुकान/प्रतिष्ठान में प्रवेश देने या किसी के कार्यस्थल पर जाने से पूर्व दोनों पक्षों को एक-दूसरे के मूल पहचान पत्र (Original Aadhaar Card / Voter ID / DL) और पते का भौतिक सत्यापन अनिवार्य रूप से स्वयं करना होगा।',
      descEn:
        'While basic phone OTP and self-declared Aadhaar checks exist on the platform, both employers and workers must independently verify original government identity cards (Aadhaar / Voter ID / DL) and address before granting premises access or starting work.',
      highlightsHi: ['मूल पहचान पत्र स्वयं जांचें', 'घर बुलाने से पहले सत्यापन करें', 'पारस्परिक सुरक्षा अनिवार्य'],
    },
    {
      id: 8,
      icon: <HeartHandshake className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      titleHi: '8. क्षतिपूर्ति व कानूनी सुरक्षा अनुबंध (Full Indemnification & Hold Harmless)',
      titleEn: 'Full Indemnification & Legal Waiver',
      descHi:
        'उपयोगकर्ता (चाहे कामगार हो या नियोक्ता) यह कानूनी वचन देता है कि वह वेबसाइट, इसके संस्थापकों, स्वामियों, कर्मचारियों और तकनीकी साझीदारों को उपयोगकर्ता के किसी भी विवाद, पुलिस शिकायत, कोर्ट केस, दावे, नुकसान या जुर्माने से पूरी तरह सुरक्षित और क्षतिमुक्त (Indemnify & Hold Harmless) रखेगा।',
      descEn:
        'Users agree to indemnify, defend, and hold harmless "Aavashyakta Hai", its owners, developers, founders, and affiliates against any and all claims, liabilities, damages, losses, or legal expenses arising from user actions, disputes, breach of terms, or misconduct.',
      highlightsHi: ['प्लेटफॉर्म को पूर्ण क्षतिमुक्ति', 'कानूनी दावों से सुरक्षा', 'नियमों की पाबंदी आवश्यक'],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-3xl bg-white dark:bg-stone-900 shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 px-5 sm:px-6 py-4 bg-stone-50/90 dark:bg-stone-900/90">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-tight">
                {language === 'hi'
                  ? 'नियम, शर्तें एवं कानूनी अस्वीकरण'
                  : 'Terms, Conditions & Legal Disclaimer'}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                आवश्यकता है (Aavashyakta Hai) • शून्य मालिक दायित्व नीति (Zero Owner Liability)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Notice Banner */}
        <div className="px-5 sm:px-6 pt-4 pb-2 bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-200/70 dark:border-amber-800/50">
          <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">
                {language === 'hi' ? 'महत्वपूर्ण कानूनी सूचना (Important Notice):' : 'Important Legal Notice:'}
              </span>{' '}
              {language === 'hi'
                ? 'यह वेबसाइट केवल एक सूचना मैचमेकिंग मंच है। किसी भी दुर्व्यवहार, अवैध कार्य, मजदूरी विवाद या कार्यस्थल दुर्घटना में वेबसाइट मालिक की कोई जिम्मेदारी नहीं होगी। समस्त कानूनी जिम्मेदारी संबंधित नियोक्ता व कामगार की स्वयं की होगी।'
                : 'This platform is solely a technology matchmaking intermediary. The website owner bears zero liability for misbehavior, unlawful acts, wage disputes, or workplace injuries. Users act strictly on their own personal responsibility.'}
            </div>
          </div>
        </div>

        {/* Clauses Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-stone-800 dark:text-stone-200 text-sm">
          {clauses.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-colors"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0">
                  {c.icon}
                </div>
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm leading-snug">
                  {language === 'hi' ? c.titleHi : c.titleEn}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-stone-700 dark:text-stone-300 mb-2 font-medium">
                {c.descHi}
              </p>
              <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400 italic mb-2.5 border-l-2 border-stone-300 dark:border-stone-700 pl-2.5">
                {c.descEn}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {c.highlightsHi.map((h, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60"
                  >
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    {h}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200 dark:border-stone-800 px-5 sm:px-6 py-4 bg-stone-50/90 dark:bg-stone-900/90">
          <div className="text-xs text-stone-600 dark:text-stone-400 text-center sm:text-left">
            {isAccepted ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" />{' '}
                {language === 'hi' ? 'आपने नियम व शर्तें स्वीकार कर ली हैं' : 'Terms & Conditions Accepted'}
              </span>
            ) : (
              <span className="text-stone-500">
                {language === 'hi'
                  ? 'रजिस्ट्रेशन करने के लिए इन शर्तों को स्वीकार करना अनिवार्य है।'
                  : 'Acceptance of these terms is mandatory for registration.'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              {language === 'hi' ? 'बंद करें (Close)' : 'Close'}
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>
                  {language === 'hi' ? 'मैं सहमत हूँ और स्वीकार करता हूँ' : 'I Agree & Accept'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
