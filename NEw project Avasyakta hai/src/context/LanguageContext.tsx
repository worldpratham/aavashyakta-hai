import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
}

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    brand_name: 'Abasyakta',
    nav_browse_jobs: 'Browse Jobs',
    nav_post_job: 'Post a Job',
    nav_my_jobs: 'My Jobs',
    nav_my_applications: 'My Applications',
    nav_profile: 'Profile',
    nav_sign_in: 'Sign in',
    nav_find_work: '👷 Find Work',
    nav_hire_workers: 'Hire Workers',
    nav_sign_out: 'Sign out',
    theme_dark: 'Dark Mode',
    theme_light: 'Light Mode',
    lang_switch: 'English',

    // Hero Section
    hero_badge: "India's Trusted Direct Hiring Platform",
    hero_kaam_title: 'काम चाहिए या काम वाला?',
    hero_title_1: 'Work | Hire',
    hero_title_connect: 'Connect',
    hero_subtitle: 'Everything you need to find work or find the right worker.',
    hero_get_job: 'Get a Job Now',
    hero_hire_staff: 'Hire Local Staff (Free)',
    hero_search_placeholder: 'Job title, role or skills (e.g. Delivery, Driver, Peon)...',
    hero_city_placeholder: 'City (e.g. Delhi, Bhopal)...',
    hero_search_btn: 'Search',
    hero_pill_free: '100% Free for Workers',
    hero_pill_verified: 'Verified Mobile Numbers',
    hero_pill_calls: 'Direct Interview Calls',

    // Live Openings Section
    live_openings_badge: 'Live Openings',
    live_openings_title: 'Latest verified jobs on Abasyakta',
    browse_all_jobs: 'Browse all jobs',
    view_and_apply: 'View & Apply',
    verified_badge: 'Verified',
    direct_employer: 'Direct Employer',

    // Cities Section
    cities_badge: 'Real Local Hiring',
    cities_title: 'Explore Jobs by City',
    cities_sub: 'Direct openings posted by verified recruiters across active cities',
    filter_by_state_city: 'Filter by State & City (Country Wise)',
    explore_jobs: 'Explore Jobs',
    show_fewer_cities: 'Show fewer cities',
    view_all_cities: 'View all cities',
    job_opening_single: 'Job Opening',
    job_opening_plural: 'Job Openings',

    // Roles Section
    roles_badge: 'Real Verified Job Roles',
    roles_title: 'What kind of a role do you want?',
    roles_sub: 'Select your job profile to directly view live vacancies across active roles',
    roles_workers_applied: 'Workers Applied',
    roles_worker_applied: 'Worker Applied',
    view_full_details: 'View Full Details',
    show_fewer_roles: 'Show fewer roles',
    show_all_roles: 'Show all job roles',

    // Why Abasyakta / Features
    features_title: 'Built for both sides',
    features_sub: 'Everything you need to hire staff or get high-paying local work.',
    feature_1_title: 'Post Jobs Free',
    feature_1_desc: 'Employers can post unlimited jobs and reach verified workers in their city within minutes.',
    feature_2_title: 'Direct HR Call',
    feature_2_desc: 'Call employers directly on verified mobile numbers without middleman commissions or fees.',
    feature_3_title: 'Instant 1-Click Apply',
    feature_3_desc: 'No heavy resume or paperwork required. Connect directly via WhatsApp or direct call.',
    feature_4_title: '100% Verified Profiles',
    feature_4_desc: 'Every business and candidate is phone-verified for genuine and secure local hiring.',

    // For Workers / Employers Guide
    guide_workers_title: 'For Workers',
    guide_workers_step_1: 'Create your free account and select your skill category.',
    guide_workers_step_2: 'Browse verified openings in your city or neighborhood.',
    guide_workers_step_3: 'Directly call HR or apply with 1-click to schedule an interview.',

    guide_employers_title: 'For Employers',
    guide_employers_step_1: 'Create an Employer account with free instant registration.',
    guide_employers_step_2: 'Post required staff roles, salary, and location in minutes.',
    guide_employers_step_3: 'Directly receive phone calls and applications from nearby verified workers.',

    // CTA
    cta_title: 'Ready to get started?',
    cta_desc: 'Join Abasyakta today. Free for workers, fast for employers.',
    cta_register_worker: 'Register as Worker',
    cta_post_job: 'Post a Job for Free',

    // Auth & Sign In
    auth_welcome_back: 'Welcome Back',
    auth_signin_sub: 'Sign in to access your dashboard',
    auth_worker_login: 'Worker Login',
    auth_recruiter_login: 'Recruiter Login',
    auth_create_account: 'Create Your Account',
    auth_email_label: 'Email Address',
    auth_password_label: 'Password',
    auth_submit_signin: 'Sign in',
    auth_dont_have_account: 'New to Abasyakta?',
    auth_already_have_account: 'Already have an account?',
    auth_official_email: 'Official / Contact Email',

    // Sign Up & Role Specific Form Labels (No bracketed Hindi in English mode!)
    signup_sub: "India's trusted blue-collar & local workforce portal",
    signup_tab_worker: 'Job Seeker / Worker',
    signup_tab_worker_sub: 'I need work',
    signup_tab_employer: 'Employer / Hirer',
    signup_tab_employer_sub: 'I want to hire staff',
    signup_otp_active: '6-Digit Mobile OTP Verification Active',
    signup_otp_desc_employer: 'We will send a 6-digit verification code to your mobile number to ensure verified recruiter status.',
    signup_otp_desc_worker: 'We will verify your mobile number with a quick 6-digit OTP code to protect you from fake jobs.',
    signup_contact_person: 'Contact Person Name',
    signup_full_name: 'Full Name',
    signup_company_name: 'Company / Shop / Business Name',
    signup_business_category: 'Business Category',
    signup_company_type_registered: 'Registered Company / Enterprise',
    signup_company_type_small: 'Local Shop / Store / Workshop',
    signup_company_type_contractor: 'Contractor / Labor Agency',
    signup_company_type_individual: 'Individual / Private Residence',
    signup_gst_optional: 'GST / Trade License / PAN (Optional)',
    signup_aadhaar_label: 'Aadhaar Card Number',
    signup_aadhaar_placeholder: 'XXXX XXXX XXXX (12 Digits)',
    signup_aadhaar_helper: 'OTP will be sent to the mobile number linked with your Aadhaar Card',
    signup_aadhaar_linked_phone: 'Aadhaar-Linked Mobile Number (6-Digit OTP)',
    signup_primary_skill: 'Primary Work Skill',
    signup_experience_level: 'Experience Level',
    signup_exp_fresher: 'Fresher (<1 Year)',
    signup_exp_1_2: '1 - 2 Years',
    signup_exp_3_5: '3 - 5 Years',
    signup_exp_5_plus: '5+ Years (Experienced)',
    signup_mobile_number: 'Mobile Number (6-Digit OTP)',
    signup_city_location: 'City / Location',
    signup_email: 'Email Address',
    signup_password: 'Password',
    signup_submit_employer: 'Verify Aadhaar OTP & Register as Recruiter',
    signup_submit_worker: 'Verify Phone & Register as Worker',
    signup_submitting: 'Sending 6-Digit OTP...',

    // Post Job Page
    post_job_title: 'Post a Job',
    post_job_sub: 'Fill in the details below to reach workers nearby.',
    post_job_job_title: 'Job title',
    post_job_category_role: 'Category / Role *',
    post_job_custom_role: 'Enter New Role / Category Name *',
    post_job_tag_optional: 'Job role / Tag (Optional)',
    post_job_city_location: 'City / Location *',
    post_job_area_optional: 'Area / Full Address (Optional)',
    post_job_desc: 'Description',
    post_job_wage: 'Wage (₹)',
    post_job_wage_type: 'Wage type',
    post_job_task_details: 'Task Details / Task Rate',
    post_job_phone: 'Contact phone',
    post_job_submit: 'Post Job',
    post_job_success_title: 'Job posted!',
    post_job_success_sub: 'Your job is now live for workers to find.',

    // Browse Jobs
    jobs_search_placeholder: 'Search job title or keyword...',
    jobs_all_categories: 'All categories',
    jobs_found: 'open jobs found.',

    // Auth & Forgot Password
    auth_forgot_password: 'Forgot Password?',
    auth_forgot_password_title: 'Reset Your Password',
    auth_forgot_password_subtitle: 'Enter your registered email or mobile number to receive a 6-digit OTP on your verified number.',
    auth_enter_identifier: 'Email or Mobile Number',
    auth_send_reset_otp: 'Send Verification OTP',
    auth_reset_otp_sent_to: 'We sent a 6-digit verification code to your verified mobile number',
    auth_enter_new_password: 'Enter New Password',
    auth_confirm_new_password: 'Confirm New Password',
    auth_password_reset_success: 'Password Reset Successful!',
    auth_password_reset_success_desc: 'Your password has been reset successfully. You can now sign in with your new password.',
    auth_back_to_sign_in: 'Back to Sign In',
  },
  hi: {
    // Brand & Header
    brand_name: 'आवश्यकता',
    nav_browse_jobs: 'नौकरियां देखें',
    nav_post_job: 'नौकरी पोस्ट करें',
    nav_my_jobs: 'मेरी नौकरियां',
    nav_my_applications: 'मेरे आवेदन',
    nav_profile: 'प्रोफ़ाइल',
    nav_sign_in: 'लॉग इन',
    nav_find_work: '👷 काम पाएं',
    nav_hire_workers: 'स्टाफ रखें',
    nav_sign_out: 'लॉग आउट',
    theme_dark: 'डार्क मोड',
    theme_light: 'लाइट मोड',
    lang_switch: 'हिंदी',

    // Hero Section
    hero_badge: 'भारत का भरोसेमंद डायरेक्ट हायरिंग प्लेटफॉर्म',
    hero_kaam_title: 'काम चाहिए या काम वाला?',
    hero_title_1: 'Work | Hire',
    hero_title_connect: 'Connect',
    hero_subtitle: 'काम पाने या सही कर्मचारी ढूंढने के लिए आपकी हर जरूरत एक जगह।',
    hero_get_job: 'अभी काम पाएं',
    hero_hire_staff: 'लोकल स्टाफ रखें (फ्री)',
    hero_search_placeholder: 'काम, पद या हुनर (उदा. डिलीवरी, ड्राइवर, प्यून)...',
    hero_city_placeholder: 'शहर (उदा. दिल्ली, भोपाल, लखनऊ)...',
    hero_search_btn: 'खोजें',
    hero_pill_free: 'श्रमिकों के लिए 100% मुफ्त',
    hero_pill_verified: 'सत्यापित मोबाइल नंबर',
    hero_pill_calls: 'सीधे इंटरव्यू कॉल',

    // Live Openings Section
    live_openings_badge: 'लाइव नौकरियां',
    live_openings_title: 'आवश्यकता पर सत्यापित नई नौकरियां',
    browse_all_jobs: 'सभी नौकरियां देखें',
    view_and_apply: 'देखें और आवेदन करें',
    verified_badge: 'वेरिफाइड',
    direct_employer: 'डायरेक्ट नियोक्ता',

    // Cities Section
    cities_badge: 'स्थानीय भर्ती',
    cities_title: 'शहर अनुसार नौकरियां देखें',
    cities_sub: 'सक्रिय शहरों में सत्यापित नियोक्ताओं द्वारा सीधे पोस्ट की गई नौकरियां',
    filter_by_state_city: 'राज्य व शहर अनुसार चुनें (Country Wise)',
    explore_jobs: 'नौकरियां देखें',
    show_fewer_cities: 'कम शहर दिखाएं',
    view_all_cities: 'सभी शहर देखें',
    job_opening_single: 'नौकरी उपलब्ध',
    job_opening_plural: 'नौकरियां उपलब्ध',

    // Roles Section
    roles_badge: 'वेरिफाइड जॉब प्रोफाइल्स',
    roles_title: 'आपको किस प्रकार का काम चाहिए?',
    roles_sub: 'लाइव रिक्तियां सीधे देखने के लिए अपनी कार्य प्रोफ़ाइल चुनें',
    roles_workers_applied: 'श्रमिकों ने आवेदन किया',
    roles_worker_applied: 'श्रमिक ने आवेदन किया',
    view_full_details: 'पूरा विवरण देखें',
    show_fewer_roles: 'कम रोल दिखाएं',
    show_all_roles: 'सभी कार्य प्रोफाइल्स देखें',

    // Why Abasyakta / Features
    features_title: 'दोनों पक्षों के लिए फायदेमंद',
    features_sub: 'स्टाफ हायर करने या अच्छा वेतन पाने के लिए हर जरूरी सुविधा।',
    feature_1_title: 'फ्री में जॉब पोस्ट करें',
    feature_1_desc: 'नियोक्ता जितनी चाहें नौकरियां पोस्ट कर सकते हैं और मिनटों में अपने शहर के कामगारों तक पहुंच सकते हैं।',
    feature_2_title: 'सीधे HR से कॉल',
    feature_2_desc: 'बिना किसी बिचौलिए या दलाली के सीधे सत्यापित नंबरों पर कॉल करें।',
    feature_3_title: '1-क्लिक में तुरंत आवेदन',
    feature_3_desc: 'किसी भारी रिज्यूमे या कागजी कार्रवाई की जरूरत नहीं। डायरेक्ट बात करें।',
    feature_4_title: '100% सत्यापित प्रोफाइल्स',
    feature_4_desc: 'सुरक्षित और असली भर्ती के लिए प्रत्येक नियोक्ता और उम्मीदवार का नंबर सत्यापित होता है।',

    // For Workers / Employers Guide
    guide_workers_title: 'कामगारों के लिए',
    guide_workers_step_1: 'अपना मुफ्त खाता बनाएं और अपने हुनर का चयन करें।',
    guide_workers_step_2: 'अपने शहर या आसपास के क्षेत्र में उपलब्ध नौकरियां देखें।',
    guide_workers_step_3: 'सीधे HR को कॉल करें या 1-क्लिक में आवेदन करके इंटरव्यू तय करें।',

    guide_employers_title: 'नियोक्ताओं के लिए',
    guide_employers_step_1: 'फ्री में नियोक्ता खाता बनाएं।',
    guide_employers_step_2: 'नौकरी का प्रकार, जरूरी वर्कर, वेतन और पता पोस्ट करें।',
    guide_employers_step_3: 'आसपास के सत्यापित कामगारों से सीधे कॉल और आवेदन प्राप्त करें।',

    // CTA
    cta_title: 'शुरू करने के लिए तैयार हैं?',
    cta_desc: 'आज ही आवश्यकता से जुड़ें। कामगारों के लिए मुफ्त, नियोक्ताओं के लिए आसान।',
    cta_register_worker: 'कामगार के रूप में रजिस्टर करें',
    cta_post_job: 'फ्री जॉब पोस्ट करें',

    // Auth & Sign In
    auth_welcome_back: 'वापसी पर स्वागत है',
    auth_signin_sub: 'अपने डैशबोर्ड में जाने के लिए लॉगिन करें',
    auth_worker_login: 'कामगार लॉगिन',
    auth_recruiter_login: 'नियोक्ता लॉगिन',
    auth_create_account: 'नया खाता बनाएं',
    auth_email_label: 'ईमेल पता',
    auth_password_label: 'पासवर्ड',
    auth_submit_signin: 'लॉगिन करें',
    auth_dont_have_account: 'आवश्यकता पर नए हैं?',
    auth_already_have_account: 'पहले से खाता है?',
    auth_official_email: 'ऑफिशियल / संपर्क ईमेल',

    // Sign Up & Role Specific Form Labels (Pure Hindi in Hindi mode!)
    signup_sub: 'भारत का भरोसेमंद स्थानीय कार्यबल व रोजगार पोर्टल',
    signup_tab_worker: 'काम ढूंढने वाले / कामगार',
    signup_tab_worker_sub: 'मुझे काम चाहिए',
    signup_tab_employer: 'नियोक्ता / भर्तीकर्ता',
    signup_tab_employer_sub: 'मुझे कर्मचारी चाहिए',
    signup_otp_active: '6-अंकीय मोबाइल OTP सत्यापन सक्रिय',
    signup_otp_desc_employer: 'सत्यापित नियोक्ता स्थिति सुनिश्चित करने के लिए आपके मोबाइल पर 6-अंकीय कोड भेजा जाएगा।',
    signup_otp_desc_worker: 'नकली नौकरियों से सुरक्षा के लिए आपके मोबाइल नंबर को त्वरित 6-अंकीय OTP से सत्यापित किया जाएगा।',
    signup_contact_person: 'संपर्क व्यक्ति का नाम',
    signup_full_name: 'पूरा नाम',
    signup_company_name: 'कंपनी / दुकान / व्यापार का नाम',
    signup_business_category: 'व्यापार का प्रकार',
    signup_company_type_registered: 'पंजीकृत कंपनी / एंटरप्राइज',
    signup_company_type_small: 'स्थानीय दुकान / स्टोर / वर्कशॉप',
    signup_company_type_contractor: 'ठेकेदार / लेबर एजेंसी',
    signup_company_type_individual: 'व्यक्तिगत नियोक्ता / घरेलू',
    signup_gst_optional: 'जीएसटी / ट्रेड लाइसेंस / पैन (वैकल्पिक)',
    signup_aadhaar_label: 'आधार कार्ड नंबर',
    signup_aadhaar_placeholder: 'XXXX XXXX XXXX (12 अंक)',
    signup_aadhaar_helper: 'OTP आपके आधार कार्ड से लिंक मोबाइल नंबर पर भेजा जाएगा',
    signup_aadhaar_linked_phone: 'आधार लिंक मोबाइल नंबर (6-अंकीय OTP)',
    signup_primary_skill: 'मुख्य काम / हुनर',
    signup_experience_level: 'कार्य अनुभव',
    signup_exp_fresher: 'फ्रेशर (0-1 वर्ष)',
    signup_exp_1_2: '1 से 2 वर्ष',
    signup_exp_3_5: '3 से 5 वर्ष',
    signup_exp_5_plus: '5+ वर्ष (अनुभवी)',
    signup_mobile_number: 'मोबाइल नंबर (6-अंकीय OTP)',
    signup_city_location: 'शहर / इलाका',
    signup_email: 'ईमेल पता',
    signup_password: 'पासवर्ड',
    signup_submit_employer: 'आधार OTP सत्यापित करें और नियोक्ता रजिस्टर करें',
    signup_submit_worker: 'फोन सत्यापित करें और कामगार रजिस्टर करें',
    signup_submitting: '6-अंकीय OTP भेजा जा रहा है...',

    // Post Job Page
    post_job_title: 'नौकरी पोस्ट करें',
    post_job_sub: 'आसपास के कामगारों तक पहुंचने के लिए नीचे विवरण भरें।',
    post_job_job_title: 'काम का शीर्षक',
    post_job_category_role: 'काम का प्रकार *',
    post_job_custom_role: 'नई श्रेणी / पद का नाम लिखें *',
    post_job_tag_optional: 'पद / टैग (वैकल्पिक)',
    post_job_city_location: 'शहर / इलाका *',
    post_job_area_optional: 'क्षेत्र / पूरा पता (वैकल्पिक)',
    post_job_desc: 'काम का विवरण',
    post_job_wage: 'वेतन / मजदूरी (₹)',
    post_job_wage_type: 'वेतन का प्रकार',
    post_job_task_details: 'कार्य विवरण / कार्य दर',
    post_job_phone: 'संपर्क फोन नंबर',
    post_job_submit: 'नौकरी पोस्ट करें',
    post_job_success_title: 'नौकरी पोस्ट हो गई!',
    post_job_success_sub: 'आपकी नौकरी अब कामगारों के लिए लाइव है।',

    // Browse Jobs
    jobs_search_placeholder: 'काम का नाम या कीवर्ड खोजें...',
    jobs_all_categories: 'सभी श्रेणियां',
    jobs_found: 'उपलब्ध नौकरियां मिलीं।',

    // Auth & Forgot Password
    auth_forgot_password: 'पासवर्ड भूल गए?',
    auth_forgot_password_title: 'अपना पासवर्ड रीसेट करें',
    auth_forgot_password_subtitle: 'अपने वेरिफाइड नंबर पर 6-अंकीय OTP प्राप्त करने के लिए अपना पंजीकृत ईमेल या मोबाइल नंबर दर्ज करें।',
    auth_enter_identifier: 'ईमेल या मोबाइल नंबर',
    auth_send_reset_otp: 'सत्यापन OTP भेजें',
    auth_reset_otp_sent_to: 'हमने आपके सत्यापित मोबाइल नंबर पर 6-अंकों का ओटीपी भेजा है',
    auth_enter_new_password: 'नया पासवर्ड दर्ज करें',
    auth_confirm_new_password: 'नए पासवर्ड की पुष्टि करें',
    auth_password_reset_success: 'पासवर्ड सफलतापूर्वक रीसेट हो गया!',
    auth_password_reset_success_desc: 'आपका पासवर्ड सफलतापूर्वक अपडेट हो गया है। अब आप अपने नए पासवर्ड के साथ लॉगिन कर सकते हैं।',
    auth_back_to_sign_in: 'साइन इन पर वापस जाएं',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('language');
      if (saved === 'hi' || saved === 'en') {
        return saved;
      }
    } catch (e) {}
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('language', lang);
    } catch (e) {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
