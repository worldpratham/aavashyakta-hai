import React, { useState } from 'react';
import {
  Scale,
  ShieldAlert,
  Ban,
  AlertTriangle,
  DollarSign,
  ShieldCheck,
  UserCheck,
  HeartHandshake,
  ArrowLeft,
  Printer,
  Sparkles,
  Check,
  FileText,
} from 'lucide-react';
import { Link, useRouter } from '@/router';
import { useLanguage } from '@/context/LanguageContext';

export function TermsPage() {
  const { language } = useLanguage();
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'liability' | 'conduct' | 'wages'>('all');

  const clauses = [
    {
      id: 1,
      category: 'legal',
      icon: <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      titleHi: '1. मंच की भूमिका - केवल तकनीकी मध्यस्थ (Intermediary & Technology Platform Only)',
      titleEn: 'Platform Role: Technology Intermediary Only',
      descHi:
        '"आवश्यकता है" (Aavashyakta Hai) केवल नियोक्ताओं (Employers) और कामगारों (Workers) को एक दूसरे से सीधे जोड़ने वाला एक स्वतंत्र डिजिटल सूचना मंच (Technology Facilitator / Intermediary) है। वेबसाइट या इसके मालिक (Website Owner / Developers / Admins) किसी भी उपयोगकर्ता के नियोक्ता, ठेकेदार, भर्ती एजेंसी, पार्टनर या कानूनी प्रतिनिधि नहीं हैं। सूचना प्रौद्योगिकी अधिनियम (IT Act 2000, Section 79) के अंतर्गत यह मंच पूर्णतः मध्यस्थ सुरक्षा का हकदार है।',
      descEn:
        '"Aavashyakta Hai" operates strictly as an independent technology intermediary facilitating direct contact between local employers and job seekers. The website owners, founders, and administrators do NOT act as an employer, contractor, recruiter agency, partner, or legal representative for any user. The platform qualifies for intermediary safe harbor protections.',
      keyTakeaways: [
        'वेबसाइट केवल एक डिजिटल सूचना माध्यम है।',
        'प्लेटफॉर्म किसी भी कामगार का नियोक्ता या ठेकेदार नहीं है।',
        'काम का निर्णय व शर्तें दोनों पक्षों के बीच सीधे तय होती हैं।',
      ],
    },
    {
      id: 2,
      category: 'liability',
      icon: <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      titleHi: '2. वेबसाइट मालिक की शून्य जवाबदेही (Absolute Zero Owner Liability & Platform Disclaimer)',
      titleEn: 'Absolute Zero Owner Liability & Platform Disclaimer',
      descHi:
        'वेबसाइट मालिक, संचालक, एडमिन या डेवलपर्स की कार्यस्थल पर, फोन कॉल पर या व्यक्तिगत मुलाकातों में हुए किसी भी विवाद, दुर्व्यवहार, वित्तीय नुकसान, चोरी, दुर्घटना, चोट, जान-माल की हानि, धोखाधड़ी या आपराधिक घटना के लिए 0% जिम्मेदारी (Zero Responsibility / Zero Liability) होगी। दोनों पक्ष अपनी स्वयं की समझ, विवेक और व्यक्तिगत जोखिम (At Own Risk) पर एक-दूसरे से संपर्क और अनुबंध करते हैं।',
      descEn:
        'The website owner, developers, and administrators bear ABSOLUTE ZERO LIABILITY for any dispute, verbal/physical abuse, property damage, theft, accident, bodily injury, death, fraud, or criminal incident occurring between users on or off the platform. All interactions and assignments are executed solely at the users\' own independent personal risk.',
      keyTakeaways: [
        'वेबसाइट मालिक किसी भी विवाद में कानूनी रूप से जिम्मेदार नहीं होंगे।',
        'कार्यस्थल पर होने वाली किसी भी घटना की जिम्मेदारी संबंधित पक्षों की होगी।',
        'उपयोगकर्ता अपनी सुरक्षा व जोखिम की जिम्मेदारी स्वयं लेते हैं।',
      ],
    },
    {
      id: 3,
      category: 'conduct',
      icon: <Ban className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      titleHi: '3. दुर्व्यवहार, हिंसा, उत्पीड़न व गाली-गलौज पर पूर्ण प्रतिबंध (Zero Tolerance for Abuse & Personal Liability)',
      titleEn: 'Strict Ban on Misbehavior, Abuse, Harassment & Assault',
      descHi:
        'कार्यस्थल, फोन कॉल, व्हाट्सएप या व्यक्तिगत मुलाकात के दौरान किसी भी कामगार या नियोक्ता के साथ गाली-गलौज (Verbal Abuse), मारपीट (Physical Violence), लैंगिक उत्पीड़न (Sexual Harassment / छेड़छाड़), जातिगत/धार्मिक भेदभाव या बंधुआ व्यवहार पूर्णतः वर्जित और गैर-कानूनी है। ऐसा करने पर दोषी व्यक्ति स्वयं व्यक्तिगत रूप से भारतीय कानून (BNS / IPC / POSH Act / SC-ST Act) के तहत जेल व दंड का भागीदार होगा; वेबसाइट मालिक की इसमें कोई संलिप्तता या कानूनी जिम्मेदारी नहीं होगी।',
      descEn:
        'Any form of verbal abuse, physical violence, assault, sexual harassment, discrimination, or exploitation is strictly illegal. The individual committing such acts bears 100% personal criminal and civil liability before police and courts under Indian law. The website owner has zero tolerance and zero legal responsibility for individual misconduct.',
      keyTakeaways: [
        'गाली-गलौज, मारपीट या छेड़छाड़ पर सीधी पुलिस कार्रवाई होगी।',
        'दोषी व्यक्ति स्वयं कानूनी व व्यक्तिगत रूप से जवाबदेह होगा।',
        'पीड़ित पक्ष सीधे स्थानीय पुलिस थाने में शिकायत दर्ज करा सकता है।',
      ],
    },
    {
      id: 4,
      category: 'conduct',
      icon: <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />,
      titleHi: '4. गैर-कानूनी गतिविधियों व बाल मजदूरी पर पूर्ण रोक (Zero Tolerance for Illegal Tasks & Crime)',
      titleEn: 'Zero Tolerance for Illegal Tasks, Crime & Child Labor',
      descHi:
        'मंच पर किसी भी प्रकार के गैर-कानूनी कार्य (जैसे चोरी, नशीले पदार्थों या अवैध शराब का परिवहन, अनधिकृत खतरनाक कार्य, वेश्यावृत्ति या 18 वर्ष से कम उम्र के बच्चों से बाल मजदूरी / Child Labour) की पोस्टिंग या काम स्वीकार करना पूर्णतः प्रतिबंधित है। संलिप्त पाए जाने पर खाता तत्काल स्थायी रूप से बैन किया जाएगा और उपयोगकर्ता का समस्त डिजिटल विवरण (फोन, आईपी, आधार) स्थानीय पुलिस प्रशासन को सौंप दिया जाएगा।',
      descEn:
        'Posting, hiring for, or accepting illegal, hazardous, or prohibited tasks (including child labor under 18, transport of contraband/liquor, theft, or unlicensed dangerous activities) is strictly prohibited. Violators will face immediate permanent account termination and evidence will be handed over to law enforcement agencies.',
      keyTakeaways: [
        '18 वर्ष से कम आयु के बच्चों से कार्य करवाना सख्त गैर-कानूनी है।',
        'किसी भी अवैध वस्तु या काम पर तुरंत खाता बैन व कानूनी FIR।',
        'वेबसाइट का उपयोग केवल वैध और सुरक्षित स्थानीय कार्यों के लिए ही मान्य है।',
      ],
    },
    {
      id: 5,
      category: 'wages',
      icon: <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      titleHi: '5. मजदूरी व वित्तीय लेन-देन का सीधा निपटारा (Direct Wages & Financial Settlement)',
      titleEn: 'Direct Wage Settlement - No Platform Financial Guarantee',
      descHi:
        'दैनिक मजदूरी, साप्ताहिक या मासिक वेतन सीधे नियोक्ता द्वारा कामगार को देय है। आवश्यकता है प्लेटफॉर्म 0% कमीशन मॉडल पर काम करता है और किसी भी उपयोगकर्ता का पैसा रोककर या एस्क्रो (Escrow) में नहीं रखता। मजदूरी न मिलने, कम मिलने, देर होने, या कामगार द्वारा पेशगी (Advance) लेकर भाग जाने पर वेबसाइट मालिक किसी भी प्रकार के वित्तीय मुआवजे या वसूली के जिम्मेदार नहीं होंगे। दोनों पक्ष अपने वित्तीय लेन-देन का हिसाब व रसीद स्वयं रखें।',
      descEn:
        'All wages, payment rates, and commercial terms are mutually agreed upon and settled directly between employer and worker. The platform takes 0% commission and does not hold user funds. The platform owner is not liable for unpaid wages, deductions, delays, or unrecovered cash advances.',
      keyTakeaways: [
        'मजदूरी का सीधा भुगतान (नकद, UPI या बैंक ट्रांसफर)।',
        'प्लेटफॉर्म किसी भी पक्ष से कोई कमीशन नहीं काटता।',
        'वेतन या एडवांस के विवाद में वेबसाइट मालिक जिम्मेदार नहीं हैं।',
      ],
    },
    {
      id: 6,
      category: 'liability',
      icon: <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
      titleHi: '6. कार्यस्थल सुरक्षा, दुर्घटना व जीवन जोखिम (Workplace Accidents, Injuries & Safety Waiver)',
      titleEn: 'Workplace Safety & Accidental Injury Waiver',
      descHi:
        'निर्माण कार्य, बिजली मरम्मत, भारी वजन, ऊंचाई पर कार्य, वेल्डिंग या वाहन चालन में जोखिम होते हैं। कार्यस्थल पर सुरक्षा उपकरण (हेलमेट, जूते, सुरक्षा हार्नेस, दस्ताने) व प्राथमिक उपचार (First Aid) की व्यवस्था नियोक्ता और कामगार की आपसी जिम्मेदारी है। कार्य के दौरान होने वाली किसी भी चोट, अंग-हानि, दुर्घटना या मृत्यु के लिए वेबसाइट या इसके मालिक उत्तरदायी नहीं होंगे।',
      descEn:
        'Manual, electrical, high-rise, construction, and driving tasks carry physical risks. Providing personal protective equipment (PPE) and maintaining safe working conditions is the sole responsibility of the employer and worker. The platform owner assumes no liability for workplace injuries, fatalities, or medical compensation.',
      keyTakeaways: [
        'सुरक्षा उपकरण व हेलमेट का उपयोग अनिवार्य है।',
        'कार्यस्थल दुर्घटना या चोट में वेबसाइट मालिक की कोई देनदारी नहीं है।',
        'नियोक्ता को प्राथमिक उपचार और सुरक्षा का पूरा ध्यान रखना चाहिए।',
      ],
    },
    {
      id: 7,
      category: 'legal',
      icon: <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      titleHi: '7. स्वतंत्र पहचान, पता व चरित्र सत्यापन (Mandatory Due Diligence & Identity Verification)',
      titleEn: 'Mandatory Due Diligence & Physical Verification',
      descHi:
        'यद्यपि मंच पर मोबाइल व आधार सत्यापन की सुविधा दी गई है, तथापि किसी व्यक्ति को अपने घर/दुकान/कार्यालय में बुलाने या किसी के कार्यस्थल पर जाने से पूर्व दोनों पक्षों को एक-दूसरे के मूल पहचान पत्र (Original Aadhaar Card / Voter ID / DL) और पते का भौतिक सत्यापन अनिवार्य रूप से स्वयं करना चाहिए। मंच किसी उपयोगकर्ता के पिछले आपराधिक रिकॉर्ड की गारंटी नहीं लेता।',
      descEn:
        'While basic phone OTP and self-declared Aadhaar checks exist on the platform, both employers and workers must independently verify original government identity cards (Aadhaar / Voter ID / DL) and address before granting premises access or starting work. The platform does not guarantee background history.',
      keyTakeaways: [
        'काम शुरू करने से पहले मूल पहचान पत्र स्वयं जांचें।',
        'घर या निजी परिसर में बुलाने से पहले पूरी पुष्टि करें।',
        'पारस्परिक सतर्कता और आत्म-सुरक्षा सर्वोपरि है।',
      ],
    },
    {
      id: 8,
      category: 'legal',
      icon: <HeartHandshake className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      titleHi: '8. क्षतिपूर्ति व कानूनी सुरक्षा अनुबंध (Full Indemnification & Legal Waiver)',
      titleEn: 'Full Indemnification & Legal Waiver',
      descHi:
        'उपयोगकर्ता (चाहे कामगार हो या नियोक्ता) यह कानूनी वचन देता है कि वह वेबसाइट, इसके संस्थापकों, स्वामियों, कर्मचारियों और तकनीकी साझीदारों को उपयोगकर्ता के किसी भी विवाद, पुलिस शिकायत, कोर्ट केस, दावे, नुकसान या जुर्माने से पूरी तरह सुरक्षित और क्षतिमुक्त (Indemnify & Hold Harmless) रखेगा। किसी भी विवाद की स्थिति में न्यायिक क्षेत्र भारत के सक्षम स्थानीय न्यायालय होंगे।',
      descEn:
        'Users agree to indemnify, defend, and hold harmless "Aavashyakta Hai", its owners, developers, founders, and affiliates against any and all claims, liabilities, damages, losses, or legal expenses arising from user actions, disputes, breach of terms, or misconduct. Indian laws and local jurisdiction shall apply.',
      keyTakeaways: [
        'उपयोगकर्ता वेबसाइट को किसी भी कानूनी विवाद से सुरक्षित रखेगा।',
        'पंजीकरण के साथ यह कानूनी अनुबंध स्वतः प्रभावी हो जाता है।',
        'भारतीय न्यायालयों का क्षेत्राधिकार मान्य होगा।',
      ],
    },
  ];

  const filteredClauses =
    activeTab === 'all'
      ? clauses
      : clauses.filter((c) => c.category === activeTab);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 py-10 px-4 transition-colors">
      <div className="mx-auto max-w-4xl">
        {/* Top Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3.5 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:border-emerald-500 transition cursor-pointer shadow-xs"
          >
            <ArrowLeft size={16} />
            <span>{language === 'hi' ? 'वापस जाएं (Go Back)' : 'Go Back'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3.5 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer shadow-xs"
          >
            <Printer size={15} />
            <span>{language === 'hi' ? 'प्रिंट / सेव PDF' : 'Print / Save PDF'}</span>
          </button>
        </div>

        {/* Hero Title Card */}
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-10 shadow-xl mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 mb-4">
            <Scale size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'hi' ? 'कानूनी नियम, शर्तें व अस्वीकरण' : 'Terms, Conditions & Legal Disclaimer'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
            {language === 'hi'
              ? 'आवश्यकता है — नियम, शर्तें एवं दायित्व मुक्ति'
              : 'Aavashyakta Hai — Terms & Platform Disclaimer'}
          </h1>

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed max-w-3xl">
            {language === 'hi'
              ? 'यह दस्तावेज आवश्यकता है (Aavashyakta Hai) मंच के उपयोग हेतु उपयोगकर्ताओं (कामगारों एवं नियोक्ताओं) के बीच एक वैधानिक अनुबंध है। कृपया पंजीकरण करने या मंच का उपयोग करने से पूर्व इन सभी शर्तों को ध्यानपूर्वक पढ़ें।'
              : 'This document forms a legally binding agreement for all users (workers and employers) using the Aavashyakta Hai platform. Please read all terms carefully prior to registering or using the services.'}
          </p>

          {/* Legal Critical Banner */}
          <div className="mt-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 sm:p-5 flex items-start gap-3.5">
            <ShieldAlert size={24} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-bold">
                {language === 'hi' ? 'शून्य मालिक जवाबदेही (Zero Owner Liability Policy):' : 'Zero Owner Liability Policy:'}
              </span>{' '}
              {language === 'hi'
                ? 'यह वेबसाइट केवल स्थानीय कामगारों और नियोक्ताओं को आपस में जोड़ने का तकनीकी साधन है। कार्यस्थल पर किसी भी दुर्व्यवहार, गाली-गलौज, मारपीट, आपराधिक घटना, मजदूरी के विवाद या दुर्घटना में वेबसाइट मालिक की शून्य (0%) जवाबदेही होगी। सभी कार्यों और लेन-देन के लिए नियोक्ता और कामगार व्यक्तिगत रूप से जिम्मेदार होंगे।'
                : 'This website is strictly a technology platform to connect local workers and employers. The website owner bears zero (0%) liability for any misbehavior, abuse, crime, wage dispute, or workplace injury. Employers and workers are solely and personally responsible for their agreements and conduct.'}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', labelHi: 'सभी शर्तें (All Clauses)', labelEn: 'All Clauses' },
            { key: 'liability', labelHi: '🛡️ दायित्व मुक्ति (Zero Liability)', labelEn: '🛡️ Zero Liability' },
            { key: 'conduct', labelHi: '🚫 आचरण व गैर-कानूनी रोक (Conduct & Ban)', labelEn: '🚫 Conduct & Ban' },
            { key: 'wages', labelHi: '💰 वेतन व मजदूरी (Wages & Payments)', labelEn: '💰 Wages' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-emerald-400'
              }`}
            >
              {language === 'hi' ? tab.labelHi : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Clauses List */}
        <div className="space-y-5">
          {filteredClauses.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-sm hover:border-emerald-400/80 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0">
                  {c.icon}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {language === 'hi' ? c.titleHi : c.titleEn}
                </h2>
              </div>

              {/* Hindi Description */}
              <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-medium mb-3">
                {c.descHi}
              </p>

              {/* English Description */}
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed italic mb-4 pl-3 border-l-2 border-stone-300 dark:border-stone-700">
                {c.descEn}
              </p>

              {/* Key Takeaways */}
              <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/50 p-4 border border-stone-100 dark:border-stone-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2">
                  {language === 'hi' ? '📌 मुख्य बिंदु (Key Takeaways):' : '📌 Key Takeaways:'}
                </h4>
                <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                  {c.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Signup Action Banner */}
        <div className="mt-10 rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-stone-900 p-8 text-center text-white shadow-xl">
          <Sparkles className="w-8 h-8 text-emerald-300 mx-auto mb-3" />
          <h3 className="text-xl sm:text-2xl font-black mb-2">
            {language === 'hi' ? 'सुरक्षित व पारदर्शी मंच से जुड़ें' : 'Join a Safe & Verified Community'}
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto mb-6 leading-relaxed">
            {language === 'hi'
              ? 'आवश्यकता है पर पंजीकरण करके आप इन सभी नियमों व शर्तों को स्वीकार करते हैं और एक जिम्मेदार स्थानीय समुदाय का हिस्सा बनते हैं।'
              : 'By registering on Aavashyakta Hai, you affirm adherence to these terms and become part of a transparent local workforce network.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup?role=worker"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-emerald-900 text-sm font-bold shadow-md hover:bg-emerald-50 transition"
            >
              {language === 'hi' ? 'कामगार रजिस्ट्रेशन करें' : 'Register as Worker'}
            </Link>
            <Link
              to="/signup?role=employer"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-400/40 text-white text-sm font-bold transition"
            >
              {language === 'hi' ? 'नियोक्ता रजिस्ट्रेशन करें' : 'Register as Employer'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
