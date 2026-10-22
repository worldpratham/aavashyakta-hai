import { X, ShieldCheck, CheckCircle, Scale, Clock, HeartHandshake, AlertTriangle, FileText, Check } from 'lucide-react';

interface WorkerTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  isAccepted?: boolean;
}

export function WorkerTermsModal({ isOpen, onClose, onAccept, isAccepted }: WorkerTermsModalProps) {
  if (!isOpen) return null;

  const clauses = [
    {
      id: 1,
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      titleHi: '1. पहचान, आधार व कौशल की सत्यता (Authenticity of Identity & Skills)',
      titleEn: 'Identity & Skill Verification',
      descHi: 'कामगार यह प्रमाणित करता है कि उसके द्वारा दिया गया 12-अंकीय आधार कार्ड, नाम, प्रोफाइल फोटो और कौशल/अनुभव का विवरण पूर्णतः सत्य और उसी का है। किसी अन्य व्यक्ति के नाम या फर्जी दस्तावेज का उपयोग कानूनी अपराध है।',
      descEn: 'The worker affirms that all submitted credentials including 12-digit Aadhaar, photo, experience, and contact details are genuine. Any false representation or identity theft will result in permanent ban and legal reporting.',
      highlightsHi: ['सत्यापित आधार अनिवार्य', 'फर्जी प्रोफाइल पर पूर्ण प्रतिबंध', 'केवल वास्तविक कार्य अनुभव दर्ज करें'],
    },
    {
      id: 2,
      icon: <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      titleHi: '2. समयबद्धता और कार्य के प्रति निष्ठा (Punctuality & Reliability)',
      titleEn: 'Punctuality & Work Commitment',
      descHi: 'जब कोई नियोक्ता कामगार का आवेदन स्वीकार करता है या काम पर रखता है, तो कामगार निर्धारित समय पर कार्यस्थल पर पहुंचने के लिए बाध्य है। बिना पूर्व सूचना अनुपस्थित रहना अनुचित माना जाएगा।',
      descEn: 'Once a job offer or work schedule is confirmed, the worker must report to the worksite on time. Unscheduled absences without at least 4 hours advance notice will hurt worker ratings and may lead to account suspension.',
      highlightsHi: ['समय पर कार्यस्थल पहुंचें', 'आकस्मिक स्थिति में 4 घंटे पूर्व सूचना दें', 'विश्वसनीय कार्यशैली बनाएं'],
    },
    {
      id: 3,
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      titleHi: '3. कार्यस्थल सुरक्षा, शिष्टाचार व नशामुक्ति (Safety & Decent Conduct)',
      titleEn: 'Workplace Safety & Zero-Tolerance Conduct',
      descHi: 'कामगार कार्यस्थल पर सुरक्षा नियमों (जैसे हेलमेट, दस्ताने, सुरक्षा जूते) का पालन करेगा। कार्यस्थल पर शराब, नशा, गुटखा, झगड़ा, गाली-गलौज या किसी भी प्रकार का दुर्व्यवहार पूर्णतः वर्जित है।',
      descEn: 'Workers must follow standard safety guidelines at worksites. Zero-tolerance policy applies to intoxication, substance use, theft, harassment, or verbal abuse. Immediate blacklist upon reported violations.',
      highlightsHi: ['सुरक्षा उपकरणों का उपयोग करें', 'नशा व अभद्र व्यवहार सख्त वर्जित', 'नियोक्ता व साथियों का सम्मान'],
    },
    {
      id: 4,
      icon: <HeartHandshake className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      titleHi: '4. पारदर्शी मजदूरी व भुगतान (Wage Payment & Transparency)',
      titleEn: 'Transparent Wages & Payout Channels',
      descHi: 'काम पूरा होने के बाद तय मजदूरी सीधे चुने हुए माध्यम (बैंक खाता / UPI / दैनिक नकद) से प्राप्त होगी। तय मेहनताने के अलावा अतिरिक्त अनुचित मांग न करें। मजदूरी न मिलने पर "आवश्यकता है" सपोर्ट टीम की सहायता ली जा सकती है।',
      descEn: 'Wages will be settled directly via selected payout method (Direct Bank Transfer, UPI, or Cash). Demanding unagreed surcharges is prohibited. Any payout dispute can be escalated via the in-app support dispute ticket.',
      highlightsHi: ['तय मजदूरी का सीधा भुगतान', 'बैंक/UPI/नकद विकल्प', 'विवाद समाधान के लिए सपोर्ट उपलब्ध'],
    },
    {
      id: 5,
      icon: <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      titleHi: '5. गोपनीयता व नियोक्ता की संपत्ति की रक्षा (Property Care & Privacy)',
      titleEn: 'Confidentiality & Care for Property',
      descHi: 'कामगार नियोक्ता के घर, दुकान, गोदाम या निर्माण स्थल के सामान, औजारों और सामग्री की पूरी सुरक्षा का ध्यान रखेगा। ग्राहक या नियोक्ता की व्यक्तिगत जानकारी व तस्वीरों का अनुचित प्रचार नहीं करेगा।',
      descEn: 'Workers are expected to safeguard employer tools, equipment, and premises. Workers must maintain client confidentiality and never share personal photos or private details of client premises.',
      highlightsHi: ['औजारों व सामान की सुरक्षा', 'ग्राहकों की निजता का सम्मान', 'ईमानदार व जिम्मेदार कार्य'],
    },
    {
      id: 6,
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      titleHi: '6. आधार सत्यापन व खाता निलंबन नीति (Mandatory KYC & Ban Policy)',
      titleEn: 'Mandatory Aadhaar KYC & Account Discipline',
      descHi: 'मंच पर श्रमिकों और नियोक्ताओं की सुरक्षा सुनिश्चित करने हेतु आधार कार्ड प्रमाणीकरण अनिवार्य है। गंभीर शिकायतों, धोखाधड़ी या नियमों के उल्लंघन की स्थिति में "आवश्यकता है" टीम खाते को तत्काल निरस्त करने का अधिकार रखती है।',
      descEn: 'UIDAI Aadhaar OTP verification is compulsory to activate your worker profile. "Aavashyakta Hai" reserves full right to suspend or permanently block accounts found engaging in fraudulent acts.',
      highlightsHi: ['OTP द्वारा आधार सत्यापन अनिवार्य', 'विश्वास व सुरक्षा सर्वोपरि', 'सुरक्षित कार्य अवसर'],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white dark:bg-stone-900 shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 px-6 py-4 bg-stone-50/80 dark:bg-stone-900/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                कामगार नियम एवं शर्तें (Worker Terms & Conditions)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                आवश्यकता है (Aavashyakta Hai) - सुरक्षित एवं भरोसेमंद कामगार नीति
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clauses Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-stone-800 dark:text-stone-200 text-sm">
          <div className="rounded-xl p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">सभी कामगार साथियों का स्वागत है:</span> यह नियम और शर्तें आपके हकों, सुरक्षा और पारदर्शी भुगतान की रक्षा के लिए बनाई गई हैं। पंजीकरण पूरा करने से पहले कृपया इन्हें ध्यान से पढ़ें।
            </div>
          </div>

          <div className="space-y-4">
            {clauses.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-colors"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    {c.icon}
                  </div>
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                    {c.titleHi}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-300 mb-2">
                  {c.descHi}
                </p>
                <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400 italic mb-2.5 border-l-2 border-stone-300 dark:border-stone-700 pl-2">
                  {c.descEn}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.highlightsHi.map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                    >
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 dark:border-stone-800 px-6 py-4 bg-stone-50/80 dark:bg-stone-900/80">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            {isAccepted ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" /> आपने शर्तें स्वीकार कर ली हैं
              </span>
            ) : (
              'जारी रखने के लिए शर्तों को स्वीकार करना आवश्यक है'
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              बंद करें (Close)
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                मैं सहमत हूँ और स्वीकार करता हूँ (I Agree & Accept)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
