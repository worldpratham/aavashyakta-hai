// ============================================================================
// Abasyakta (आवश्यकता) Platform AI Brain & Natural Language Engine
// प्रशिक्षित: पूरी तरह वेबसाइट के फीचर्स, लोकेशन्स और प्रक्रियाओं के अनुसार
// ============================================================================

export interface BotAction {
  label: string;
  path?: string;
  actionType?: 'navigate' | 'query' | 'help';
  queryText?: string;
}

export interface BotResponse {
  text: string;
  actions?: BotAction[];
  followUps?: string[];
  matchedIntent?: string;
  detectedEntities?: {
    role?: string;
    city?: string;
    action?: string;
  };
}

export interface ActivityContext {
  pathname: string;
  focusedField?: string;
  dwellSeconds: number;
  userRole?: string;
  pageTitle?: string;
}

// ----------------------------------------------------------------------------
// 1. ROBUST TEXT NORMALIZATION (हिंग्लिश व हिंदी टेक्स्ट को समझना)
// ----------------------------------------------------------------------------

function squashRepeatedChars(text: string): string {
  return text.replace(/(.)\1{2,}/g, '$1$1');
}

export function normalizeNlpText(raw: string): string {
  if (!raw) return '';
  let str = raw.toLowerCase().trim();
  str = squashRepeatedChars(str);
  // Remove special symbols like ? ! , . / \ : ; ( ) [ ] { }
  str = str.replace(/[?!,.:;\-_/\\()[\]{}'"`~@#$%^&*+=<>|]/g, ' ');
  return str.replace(/\s+/g, ' ').trim();
}

// Helper to check if any of the target phrases or keywords exist in text (Works for both Hindi & English)
function hasWord(text: string, ...phrases: string[]): boolean {
  for (const p of phrases) {
    const cleanP = p.toLowerCase().trim();
    if (text.includes(cleanP)) {
      return true;
    }
  }
  return false;
}

// ----------------------------------------------------------------------------
// 2. LOCATION & CITY EXTRACTION (बीना, सागर, भोपाल, दिल्ली व सभी शहर)
// ----------------------------------------------------------------------------

interface CityMapping {
  canonical: string;
  hindiName: string;
  state: string;
  aliases: string[];
}

const POPULAR_CITIES: CityMapping[] = [
  { canonical: 'bina', hindiName: 'बीना (Bina - Sagar MP)', state: 'Madhya Pradesh', aliases: ['bina', 'beena', 'बीना'] },
  { canonical: 'sagar', hindiName: 'सागर (Sagar MP)', state: 'Madhya Pradesh', aliases: ['sagar', 'saagar', 'सागर'] },
  { canonical: 'bhopal', hindiName: 'भोपाल (Bhopal)', state: 'Madhya Pradesh', aliases: ['bhopal', 'bhopl', 'भोपाल'] },
  { canonical: 'indore', hindiName: 'इंदौर (Indore)', state: 'Madhya Pradesh', aliases: ['indore', 'indor', 'इंदौर'] },
  { canonical: 'gwalior', hindiName: 'ग्वालियर (Gwalior)', state: 'Madhya Pradesh', aliases: ['gwalior', 'ग्वालियर'] },
  { canonical: 'jabalpur', hindiName: 'जबलपुर (Jabalpur)', state: 'Madhya Pradesh', aliases: ['jabalpur', 'जबलपुर'] },
  { canonical: 'vidisha', hindiName: 'विदिशा (Vidisha)', state: 'Madhya Pradesh', aliases: ['vidisha', 'विदिशा'] },
  { canonical: 'delhi', hindiName: 'दिल्ली NCR (Delhi)', state: 'Delhi (NCT)', aliases: ['delhi', 'dilli', 'ncr', 'noida', 'gurgaon', 'gurugram', 'ghaziabad', 'faridabad', 'दिल्ली', 'नोएडा'] },
  { canonical: 'jaipur', hindiName: 'जयपुर (Jaipur)', state: 'Rajasthan', aliases: ['jaipur', 'jaypur', 'जयपुर'] },
  { canonical: 'lucknow', hindiName: 'लखनऊ (Lucknow)', state: 'Uttar Pradesh', aliases: ['lucknow', 'lko', 'लखनऊ'] },
  { canonical: 'kanpur', hindiName: 'कानपुर (Kanpur)', state: 'Uttar Pradesh', aliases: ['kanpur', 'कानपुर'] },
  { canonical: 'mumbai', hindiName: 'मुंबई (Mumbai)', state: 'Maharashtra', aliases: ['mumbai', 'bombay', 'thane', 'मुंबई'] },
  { canonical: 'pune', hindiName: 'पुणे (Pune)', state: 'Maharashtra', aliases: ['pune', 'poona', 'पुणे'] },
  { canonical: 'patna', hindiName: 'पटना (Patna)', state: 'Bihar', aliases: ['patna', 'पटना'] },
  { canonical: 'ahmedabad', hindiName: 'अहमदाबाद (Ahmedabad)', state: 'Gujarat', aliases: ['ahmedabad', 'अहमदाबाद'] },
  { canonical: 'surat', hindiName: 'सूरत (Surat)', state: 'Gujarat', aliases: ['surat', 'सूरत'] },
  { canonical: 'kolkata', hindiName: 'कोलकाता (Kolkata)', state: 'West Bengal', aliases: ['kolkata', 'कोलकाता'] },
];

function extractCity(text: string): CityMapping | null {
  for (const city of POPULAR_CITIES) {
    for (const alias of city.aliases) {
      if (text.includes(alias)) {
        return city;
      }
    }
  }

  // Generic regex to catch "[city_name] m available" or "[city_name] me available"
  const match = text.match(/(?:in|me|m|mein|mai|में)\s+([a-zA-Z\u0900-\u097F]+)/i) ||
                text.match(/([a-zA-Z\u0900-\u097F]+)\s+(?:m|me|mein|mai|में)\s+(?:available|uplabdh|chalta|chal|job|kaam)/i);

  if (match && match[1]) {
    const rawCity = match[1].trim();
    const stopWords = ['kya', 'aap', 'ye', 'yeh', 'yaha', 'waha', 'kaam', 'job', 'naukri', 'bina', 'resume'];
    if (!stopWords.includes(rawCity.toLowerCase()) && rawCity.length > 2) {
      return {
        canonical: rawCity.toLowerCase(),
        hindiName: rawCity.toUpperCase(),
        state: 'India',
        aliases: [rawCity.toLowerCase()],
      };
    }
  }

  return null;
}

// ----------------------------------------------------------------------------
// 3. ROLE EXTRACTION (ड्राइवर, गार्ड, प्यून, डिलीवरी, इलेक्ट्रीशियन, आदि)
// ----------------------------------------------------------------------------

interface RoleMapping {
  canonical: string;
  hindiName: string;
  aliases: string[];
}

const KNOWN_ROLES: RoleMapping[] = [
  { canonical: 'driver', hindiName: 'ड्राइवर (कार/बस/कैब चालक)', aliases: ['driver', 'chalak', 'gadi', 'car', 'cab', 'taxi', 'bus', 'draivar', 'drivar', 'ड्राइवर', 'चालक'] },
  { canonical: 'peon', hindiName: 'प्यून / ऑफिस बॉय / चपरासी', aliases: ['peon', 'office boy', 'chaprasi', 'boy', 'pion', 'pyun', 'प्यून', 'चपरासी', 'हेल्पर बॉय'] },
  { canonical: 'guard', hindiName: 'सुरक्षा गार्ड (Security Guard)', aliases: ['guard', 'security', 'chaukidar', 'darban', 'sekurity', 'gard', 'गार्ड', 'चौकीदार', 'सिक्योरिटी'] },
  { canonical: 'delivery', hindiName: 'डिलीवरी बॉय / राइडर', aliases: ['delivery', 'rider', 'courier', 'delivri', 'zomato', 'swiggy', 'राइडर', 'डिलीवरी'] },
  { canonical: 'electrician', hindiName: 'इलेक्ट्रीशियन (बिजली मिस्त्री)', aliases: ['electrician', 'bijli', 'wiring', 'wireman', 'इलेक्ट्रीशियन', 'बिजली'] },
  { canonical: 'plumber', hindiName: 'प्लंबर (नल मिस्त्री)', aliases: ['plumber', 'nal', 'pipe', 'plamber', 'प्लंबर', 'नल मिस्त्री'] },
  { canonical: 'cook', hindiName: 'रसोइया / कुक / हलवाई', aliases: ['cook', 'khana', 'rasoiya', 'bavarchi', 'halwai', 'chef', 'कुक', 'रसोइया', 'हलवाई'] },
  { canonical: 'cleaner', hindiName: 'सफाईकर्मी / हाउसकीपिंग / मेड', aliases: ['cleaner', 'safai', 'maid', 'housekeeping', 'jhadu', 'kamwali', 'ponchha', 'सफाईकर्मी', 'मेड', 'सफाई'] },
  { canonical: 'mason', hindiName: 'राजमिस्त्री / निर्माण श्रमिक (Labour)', aliases: ['mason', 'rajmistri', 'mistri', 'beldaar', 'lebar', 'labour', 'majdoor', 'राजमिस्त्री', 'मजदूर', 'लेबर'] },
  { canonical: 'painter', hindiName: 'पेंटर (पुताई वाला)', aliases: ['painter', 'paint', 'putai', 'rang', 'रंगकर्मी', 'पेंटर', 'पुताई'] },
  { canonical: 'carpenter', hindiName: 'बढ़ई / कारपेंटर (लकड़ी मिस्त्री)', aliases: ['carpenter', 'badhai', 'lakdi', 'karpentar', 'बढ़ई', 'कारपेंटर'] },
  { canonical: 'tailor', hindiName: 'टेलर (दर्जी / सिलाई)', aliases: ['tailor', 'darji', 'silai', 'सिलाई', 'दर्जी', 'टेलर'] },
  { canonical: 'welder', hindiName: 'वेल्डर / फैब्रिकेशन', aliases: ['welder', 'welding', 'fabrication', 'वेल्डर'] },
  { canonical: 'helper', hindiName: 'हेल्पर / सहायक', aliases: ['helper', 'sahayak', 'helpar', 'हेल्पर', 'सहायक'] },
];

function extractRole(text: string): RoleMapping | null {
  for (const role of KNOWN_ROLES) {
    for (const alias of role.aliases) {
      if (text.includes(alias)) {
        return role;
      }
    }
  }
  return null;
}

// ----------------------------------------------------------------------------
// 4. WEBSITE-AWARE INTENT CLASSIFICATION & KNOWLEDGE ENGINE
// ----------------------------------------------------------------------------

export function getBotAnswer(query: string, currentPath: string, _language: 'hi' | 'en' = 'hi'): BotResponse {
  const norm = normalizeNlpText(query);
  const city = extractCity(norm);
  const role = extractRole(norm);

  // --------------------------------------------------------------------------
  // CASE 1: CITY & LOCATION AVAILABILITY (उदा. "bina m available h ya nhi", "delhi me kaam milega?")
  // --------------------------------------------------------------------------
  const isAskingAvailability = hasWord(norm, 'available', 'uplabdh', 'chalta', 'chal raha', 'chalu', 'karta h', 'hai ya nahi', 'h ya nhi', 'milega', 'mil sakta', 'उपलब्ध', 'चलता है', 'मिलेगा');

  if (city && (isAskingAvailability || hasWord(norm, 'me', 'm', 'mein', 'in', 'shehar', 'shahar', 'city', 'स्थान', 'शहर'))) {
    return {
      text: `📍 **हाँ! आवश्यकता (Abasyakta) ${city.hindiName} में पूरी तरह उपलब्ध है!**\n\n• **स्थानीय भर्ती पोर्टल**: आवश्यकता पूरे भारत के प्रमुख शहरों, कस्बों और तहसीलों (जैसे **${city.hindiName}**) में सक्रिय है।\n• **काम ढूंढने वालों के लिए**: आप ${city.hindiName} में उपलब्ध ड्राइवर, गार्ड, प्यून, डिलीवरी, इलेक्ट्रीशियन आदि के काम सीधे देख सकते हैं।\n• **दुकान व कंपनी मालिकों के लिए**: आप ${city.hindiName} के नजदीकी कामगारों को रखने के लिए **1 मिनट में फ्री जॉब पोस्ट** कर सकते हैं।\n\n👉 **${city.hindiName} में काम कैसे देखें?**\n1. नीचे दिए **"🔍 ${city.hindiName} में नौकरियां देखें"** बटन पर क्लिक करें।\n2. सर्च बार में **"${city.canonical}"** लिखकर फिल्टर करें।\n3. सीधे मालिक/HR के नंबर पर कॉल या 1-क्लिक में अप्लाई करें!`,
      actions: [
        { label: `🔍 ${city.hindiName} में नौकरियां देखें`, path: '/jobs', actionType: 'navigate' },
        { label: '📢 यहां फ्री जॉब पोस्ट करें', path: '/post-job', actionType: 'navigate' },
        { label: '📝 नया खाता बनाएं', path: '/signup', actionType: 'navigate' },
      ],
      followUps: [
        `${city.hindiName} में सीधे फोन नंबर कैसे मिलेगा?`,
        'बिना रिज्यूमे के कैसे अप्लाई करें?',
        'क्या रजिस्ट्रेशन बिल्कुल मुफ्त है?',
      ],
      matchedIntent: 'CITY_AVAILABILITY',
      detectedEntities: { city: city.canonical },
    };
  }

  // --------------------------------------------------------------------------
  // CASE 2: HOW TO GET WORK / HOW TO FIND JOBS (उदा. "काम कैसे मिलेगा?", "kaise apply kare")
  // --------------------------------------------------------------------------
  if (
    hasWord(norm, 'काम कैसे मिलेगा', 'kaam kaise milega', 'kam kaise milega', 'kaise milega', 'job kaise milegi', 'naukri kaise milegi', 'kaam dhoondhna', 'kaise search kare', 'kaise apply kare', 'apply kaise kare', 'apply karne ka tarika', 'काम कैसे ढूँढें') ||
    (hasWord(norm, 'kaam', 'kam', 'job', 'naukri', 'rojgar', 'काम', 'नौकरी') && hasWord(norm, 'kaise', 'kese', 'tarika', 'step', 'batao', 'chahiye', 'dhoondhe', 'पाएं', 'ढूंढें', 'कैसे'))
  ) {
    return {
      text: `🎯 **आवश्यकता (Abasyakta) पर काम पाने की 4 आसान प्रक्रिया:**\n\n1. **'Jobs' पेज खोलें**: नीचे दिए बटन **"🔍 सभी नौकरियां देखें"** पर क्लिक करें।\n2. **अपना काम व शहर चुनें**: सर्च बार या **लोकेशन फ़िल्टर** से अपना शहर (उदा. बीना, भोपाल, इंदौर, दिल्ली) और काम का प्रकार चुनें।\n3. **सीधे मालिक/HR को फोन लगाएं**: हर जॉब कार्ड पर आपको **"Call"** और **"WhatsApp"** का डायरेक्ट बटन मिलेगा। बिचौलिए या दलाल के बिना सीधे बात करें।\n4. **1-क्लिक अप्लाई करें**: बिना किसी अंग्रेजी रिज्यूमे के **"1-Click Apply"** बटन दबाकर तुरंत आवेदन भेजें!\n\n👉 **श्रमिकों और कामगारों के लिए यह सेवा 100% मुफ्त है — कोई भी फीस या कमीशन नहीं लिया जाता!**`,
      actions: [
        { label: '🔍 सभी नौकरियां देखें (Browse Jobs)', path: '/jobs', actionType: 'navigate' },
        { label: '📝 फ्री कामगार खाता बनाएं', path: '/signup', actionType: 'navigate' },
      ],
      followUps: [
        'क्या बिना रिज्यूमे के अप्लाई हो जाएगा?',
        'मालिक का फोन नंबर कहाँ दिखेगा?',
        'दैनिक मजदूरी और वेतन कैसे मिलेगा?',
      ],
      matchedIntent: 'FIND_WORK_PROCESS',
    };
  }

  // --------------------------------------------------------------------------
  // CASE 3: SPECIFIC JOB ROLE QUERIES (उदा. "driver ki job", "guard chahiye")
  // --------------------------------------------------------------------------
  if (role) {
    const isHiring = hasWord(norm, 'chahiye worker', 'hire', 'rakhna', 'chahiye mujhe', 'hiring', 'रखना है', 'चाहिए लड़का');
    if (isHiring) {
      return {
        text: `📢 **${role.hindiName} रखने के लिए:**\n\n1. **फ्री जॉब पोस्ट करें**: नीचे दिए गए बटन पर क्लिक करें।\n2. काम के प्रकार में **"${role.hindiName}"** चुनें।\n3. दैनिक या मासिक मजदूरी और अपना शहर भरें।\n4. पोस्ट होते ही आपके नजदीकी सत्यापित ${role.hindiName} सीधे आपके फोन पर कॉल करेंगे!\n\n👉 वेबसाइट पर जॉब पोस्ट करना 100% मुफ्त है।`,
        actions: [
          { label: `➕ ${role.hindiName} की जॉब पोस्ट करें`, path: '/post-job', actionType: 'navigate' },
          { label: '🏢 नियोक्ता रजिस्ट्रेशन', path: '/signup', actionType: 'navigate' },
        ],
        followUps: [
          'वेतन (मजदूरी) कैसे तय करें?',
          'आधार वेरिफिकेशन क्यों जरूरी है?',
        ],
        matchedIntent: 'ROLE_HIRE',
        detectedEntities: { role: role.canonical },
      };
    }

    return {
      text: `🛠️ **${role.hindiName} की नौकरियां:**\n\n• आवश्यकता वेबसाइट पर **${role.hindiName}** की सत्यापित नौकरियां उपलब्ध हैं।\n• आप सीधे जॉब्स पेज पर जाकर इसे फिल्टर कर सकते हैं और नियोक्ता के नंबर पर डायरेक्ट कॉल कर सकते हैं।\n• किसी भी अंग्रेजी रिज्यूमे की आवश्यकता नहीं है, बस 1-क्लिक में अप्लाई करें!`,
      actions: [
        { label: `🔍 ${role.hindiName} की जॉब्स देखें`, path: '/jobs', actionType: 'navigate' },
        { label: '📝 कामगार प्रोफाइल बनाएं', path: '/signup', actionType: 'navigate' },
      ],
      followUps: [
        'डायरेक्ट मालिक से कैसे बात करें?',
        'वेतन (मजदूरी) कैसे तय होती है?',
      ],
      matchedIntent: 'ROLE_SEARCH',
      detectedEntities: { role: role.canonical },
    };
  }

  // --------------------------------------------------------------------------
  // CASE 4: PRICING & CHARGES (क्या फीस है? क्या यह फ्री है?)
  // --------------------------------------------------------------------------
  if (hasWord(norm, 'free', 'charges', 'charge', 'fees', 'paisa lagega', 'kitna paisa', 'cost', 'rupaye lagenge', 'commission', 'दलाली', 'फीस', 'मुफ्त', 'फ्री')) {
    return {
      text: `💎 **आवश्यकता (Abasyakta) पर फीस व चार्ज की जानकारी:**\n\n• **कामगारों / श्रमिकों के लिए 100% मुफ्त**: जॉब ढूंढने, अप्लाई करने और सीधे कॉल करने का **0 रुपये** शुल्क है। हम कामगारों से कभी कोई कमीशन नहीं लेते।\n• **दुकान व कंपनी मालिकों के लिए**: बुनियादी जॉब पोस्टिंग भी बिल्कुल मुफ्त है, ताकि वे स्थानीय कामगारों से सीधे जुड़ सकें।\n\n👉 कोई भी दलाल या बिचौलिया बीच में नहीं है!`,
      actions: [
        { label: '🔍 फ्री में नौकरियां देखें', path: '/jobs', actionType: 'navigate' },
        { label: '📢 फ्री में जॉब पोस्ट करें', path: '/post-job', actionType: 'navigate' },
      ],
      followUps: [
        'काम कैसे मिलेगा?',
        'मालिक से सीधे फोन पर बात कैसे करें?',
      ],
      matchedIntent: 'PRICING_INFO',
    };
  }

  // --------------------------------------------------------------------------
  // CASE 5: NO RESUME / PAPERWORK (क्या रिज्यूमे या कागजात चाहिए?)
  // --------------------------------------------------------------------------
  if (hasWord(norm, 'resume', 'cv', 'biodata', 'kagaj', 'document', 'dastavej', 'bina resume', 'रिज्यूमे', 'बायोडाटा', 'कागजात')) {
    return {
      text: `📄 **आवश्यकता पर किसी अंग्रेजी रिज्यूमे (Resume) की जरूरत नहीं है!**\n\n• हमारी वेबसाइट विशेष रूप से कुशल व अकुशल कामगारों (जैसे ड्राइवर, गार्ड, डिलीवरी, इलेक्ट्रीशियन, हेल्पर) के लिए बनाई गई है।\n• आपको केवल अपना नाम, मोबाइल नंबर और हुनर (Skill) चुनना होता है।\n• आप सीधे नियोक्ता के नंबर पर कॉल कर सकते हैं या **1-क्लिक अप्लाई** कर सकते हैं।`,
      actions: [
        { label: '🔍 अभी नौकरियां देखें', path: '/jobs', actionType: 'navigate' },
        { label: '📝 बिना रिज्यूमे खाता बनाएं', path: '/signup', actionType: 'navigate' },
      ],
      followUps: [
        'काम कैसे मिलेगा?',
        'डायरेक्ट HR को कॉल कैसे करें?',
      ],
      matchedIntent: 'NO_RESUME_INFO',
    };
  }

  // --------------------------------------------------------------------------
  // CASE 6: DIRECT HR / OWNER CALL & WHATSAPP (सीधे फोन पर बात कैसे होगी?)
  // --------------------------------------------------------------------------
  if (hasWord(norm, 'phone', 'mobile', 'call', 'number', 'sampark', 'baat', 'whatsapp', 'owner', 'hr', 'बात', 'फोन', 'नंबर', 'कॉल')) {
    return {
      text: `📞 **सीधे कंपनी या दुकान मालिक से संपर्क करने का तरीका:**\n\n1. **Jobs** पेज पर जाकर किसी भी नौकरी पर क्लिक करें।\n2. जॉब विवरण पेज पर आपको **"Call Employer"** और **"WhatsApp"** का हरा बटन दिखाई देगा।\n3. उस बटन पर क्लिक करते ही नियोक्ता का सत्यापित मोबाइल नंबर डायल हो जाएगा या WhatsApp चैट खुल जाएगी।\n4. आप सीधे इंटरव्यू और मजदूरी की बात कर सकते हैं!`,
      actions: [
        { label: '🔍 नौकरियां खोजें', path: '/jobs', actionType: 'navigate' },
      ],
      followUps: [
        'क्या बिना रिज्यूमे के अप्लाई कर सकते हैं?',
        'काम कैसे मिलेगा?',
      ],
      matchedIntent: 'CALL_EMPLOYER',
    };
  }

  // --------------------------------------------------------------------------
  // CASE 7: HOW TO POST A JOB (नियोक्ता जॉब पोस्ट कैसे करें?)
  // --------------------------------------------------------------------------
  if (hasWord(norm, 'post job', 'job post', 'naukri dalna', 'staff chahiye', 'worker chahiye', 'kaise post kare', 'hire kaise kare', 'जॉब पोस्ट', 'स्टाफ चाहिए', 'कर्मचारी चाहिए')) {
    return {
      text: `📢 **आवश्यकता पर 1 मिनट में जॉब पोस्ट करने का तरीका:**\n\n1. ऊपर मेनू में **"Post a Job"** बटन पर क्लिक करें।\n2. **काम का नाम** (जैसे: ऑफिस बॉय, ड्राइवर, गार्ड) और श्रेणी चुनें।\n3. **मजदूरी दर** चुनें: दैनिक (Daily), मासिक (Monthly), या कार्य दर (Per Task)।\n4. अपना **शहर** और **संपर्क फोन नंबर** डालें और **"Post Job"** दबाएं।\n5. पोस्ट होते ही आसपास के सत्यापित कामगार सीधे आपके फोन पर कॉल करेंगे!`,
      actions: [
        { label: '➕ फ्री में जॉब पोस्ट करें', path: '/post-job', actionType: 'navigate' },
        { label: '🏢 नियोक्ता रजिस्ट्रेशन', path: '/signup', actionType: 'navigate' },
      ],
      followUps: [
        'आधार वेरिफिकेशन क्यों जरूरी है?',
        'वेतन (मजदूरी) कैसे तय करें?',
      ],
      matchedIntent: 'POST_JOB_HELP',
    };
  }

  // --------------------------------------------------------------------------
  // CASE 8: OTP & VERIFICATION ISSUES (OTP नहीं आया, आधार क्यों चाहिए?)
  // --------------------------------------------------------------------------
  if (hasWord(norm, 'otp', 'code', 'sms', 'resend', 'verify', 'aadhaar', 'aadhar', 'adhar', 'ओटीपी', 'सत्यापन', 'आधार')) {
    return {
      text: `🔐 **OTP और आधार वेरिफिकेशन की जानकारी:**\n\n• **कामगारों के लिए**: आपके 10-अंकों के मोबाइल नंबर पर 6-अंकीय SMS OTP आता है ताकि आपके खाते को सुरक्षित किया जा सके।\n• **नियोक्ताओं के लिए**: सुरक्षा और फर्जी नौकरियों से कामगारों के बचाव हेतु आधार कार्ड से लिंक नंबर पर 6-अंकीय OTP भेजा जाता है।\n\n💡 **अगर OTP नहीं आया तो:**\n1. 30 सेकंड का टाइमर पूरा होने पर **"Resend OTP"** दबाएं।\n2. अपना मोबाइल नंबर जांचें कि सही 10 अंक भरे हैं या नहीं।\n3. नेटवर्क कवरेज चेक करें।`,
      actions: [
        { label: '📝 रजिस्ट्रेशन पेज पर जाएं', path: '/signup', actionType: 'navigate' },
        { label: '🔑 लॉगिन पेज पर जाएं', path: '/signin', actionType: 'navigate' },
      ],
      followUps: [
        'पासवर्ड कैसे रीसेट करें?',
        'नया खाता कैसे बनाएं?',
      ],
      matchedIntent: 'OTP_HELP',
    };
  }

  // --------------------------------------------------------------------------
  // CASE 9: PASSWORD RESET (पासवर्ड भूल गए?)
  // --------------------------------------------------------------------------
  if (hasWord(norm, 'password', 'pasword', 'bhool gaya', 'bhol gya', 'reset', 'login nahi', 'signin nahi', 'पासवर्ड', 'लॉगिन नहीं')) {
    return {
      text: `🔑 **पासवर्ड रीसेट करने के 3 आसान कदम:**\n\n1. **Sign In** पेज पर जाएं।\n2. पासवर्ड बॉक्स के नीचे **"Forgot Password?" (पासवर्ड भूल गए?)** पर क्लिक करें।\n3. अपना पंजीकृत ईमेल या 10-अंकीय मोबाइल नंबर दर्ज करें।\n4. आपके फोन पर 6-अंकीय OTP आएगा, उसे भरकर तुरंत नया पासवर्ड बना लें!`,
      actions: [
        { label: '🔑 साइन इन पेज पर जाएं', path: '/signin', actionType: 'navigate' },
      ],
      matchedIntent: 'PASSWORD_RESET',
    };
  }

  // --------------------------------------------------------------------------
  // CASE 10: SALARY, WAGE & PAYOUT (मजदूरी, दिहाड़ी, बैंक, UPI)
  // --------------------------------------------------------------------------
  if (hasWord(norm, 'salary', 'wage', 'tankha', 'tankhwah', 'vetan', 'dihadi', 'rupaye', 'paisa', 'payment', 'payout', 'upi', 'bank', 'मजदूरी', 'वेतन', 'दिहाड़ी', 'पैसे')) {
    return {
      text: `💰 **वेतन, दिहाड़ी और भुगतान (Wages & Payments):**\n\n• **दो प्रकार की मजदूरी**: वेबसाइट पर दैनिक दिहाड़ी (Daily ₹400-₹800/दिन) और मासिक वेतन (Monthly ₹12,000-₹25,000+) दोनों प्रकार की नौकरियां हैं।\n• **सीधा भुगतान**: नियोक्ता सीधे कामगार के बैंक खाते या UPI (Google Pay, PhonePe, Paytm) में भुगतान करते हैं।\n• **प्रोफाइल में जोड़ें**: कामगार अपनी प्रोफाइल में UPI ID जोड़ सकते हैं ताकि भुगतान सीधे प्राप्त हो।\n• **0% कमीशन**: आवश्यकता प्लेटफॉर्म कामगार की मजदूरी से कोई कटौती नहीं करता!`,
      actions: [
        { label: '👤 प्रोफाइल में पेमेंट मोड जोड़ें', path: '/profile', actionType: 'navigate' },
        { label: '🔍 नौकरियां देखें', path: '/jobs', actionType: 'navigate' },
      ],
      followUps: [
        'काम कैसे मिलेगा?',
        'मालिक से सीधे फोन पर बात कैसे करें?',
      ],
      matchedIntent: 'SALARY_PAYOUT',
    };
  }

  // --------------------------------------------------------------------------
  // CASE 11: WEBSITE FEATURES & TOOLS (लोकेशन फिल्टर, जीपीएस मैप, इंस्टेंट अवेलेबल)
  // --------------------------------------------------------------------------
  if (hasWord(norm, 'map', 'gps', 'location', 'filter', 'instant available', 'features', 'website', 'app', 'सुविधा', 'मैप', 'फीचर्स')) {
    return {
      text: `✨ **आवश्यकता (Abasyakta) वेबसाइट के प्रमुख फीचर्स:**\n\n1. **लोकेशन फ़िल्टर (State & City)**: देश के किसी भी राज्य व शहर (जैसे बीना, सागर, भोपाल, इंदौर आदि) की नौकरियां एक क्लिक में खोजें।\n2. **वॉइस सर्च (Voice Search)**: माइक बटन दबाकर बोलकर नौकरी खोजें।\n3. **काम के लिए तुरंत उपलब्ध (Instant Available)**: कामगार अपनी प्रोफाइल में यह ऑन करके आज ही नजदीकी काम पा सकते हैं।\n4. **लाइव GPS दिशा-निर्देश (GPS Map)**: जॉब लोकेशन की अपने घर से दूरी (किमी) और रास्ता देखें।\n5. **100% वेरिफाइड मोबाइल नंबर**: हर नियोक्ता और कामगार का नंबर सत्यापित होता है।`,
      actions: [
        { label: '🔍 नौकरियां देखें', path: '/jobs', actionType: 'navigate' },
        { label: '📢 जॉब पोस्ट करें', path: '/post-job', actionType: 'navigate' },
      ],
      followUps: [
        'बीना (Bina) में कैसे काम देखें?',
        'काम कैसे मिलेगा?',
      ],
      matchedIntent: 'WEBSITE_FEATURES',
    };
  }

  // --------------------------------------------------------------------------
  // CASE 12: GREETINGS (नमस्ते, हैलो)
  // --------------------------------------------------------------------------
  if (hasWord(norm, 'namaste', 'namaskar', 'pranam', 'ram ram', 'hello', 'helo', 'hi', 'hey', 'halo', 'नमस्ते', 'प्रणाम', 'हेलो')) {
    return {
      text: 'नमस्ते! मैं **आवश्यकता (Abasyakta) का आधिकारिक AI सहायक** हूँ। 🙏\n\nमैं इस वेबसाइट से जुड़ी आपकी हर सहायता के लिए तैयार हूँ:\n• क्या आप **काम/नौकरी** ढूंढ रहे हैं?\n• क्या आप अपनी दुकान/कंपनी के लिए **कर्मचारी (स्टाफ)** रखना चाहते हैं?\n• क्या आप किसी खास शहर (जैसे बीना, भोपाल, इंदौर, दिल्ली आदि) में उपलब्धता जानना चाहते हैं?\n\nबताइए, मैं आपकी क्या मदद कर सकता हूँ?',
      actions: [
        { label: '👷 मुझे काम चाहिए', path: '/jobs', actionType: 'navigate' },
        { label: '📢 कर्मचारी रखना है', path: '/post-job', actionType: 'navigate' },
        { label: '📝 नया खाता बनाएं', path: '/signup', actionType: 'navigate' },
      ],
      followUps: [
        'काम कैसे मिलेगा?',
        'क्या बीना (Bina) में सेवा उपलब्ध है?',
        'क्या रजिस्ट्रेशन फ्री है?',
      ],
      matchedIntent: 'GREETING',
    };
  }

  // --------------------------------------------------------------------------
  // CASE 13: BOT IDENTITY / CAPABILITIES (आप कौन हैं? आप क्या कर सकते हैं?)
  // --------------------------------------------------------------------------
  if (hasWord(norm, 'kaun ho', 'who are you', 'kya kar sakte', 'what can you do', 'kya kaam karte', 'kya madad', 'kaun h', 'kya ho', 'कौन हो', 'क्या कर सकते')) {
    return {
      text: '🤖 मैं **आवश्यकता (Abasyakta) पोर्टल का AI सहायक** हूँ। 🙏\n\nमैं आपकी इन सभी चीज़ों में पूरी मदद कर सकता हूँ:\n1. आपके शहर (जैसे बीना, भोपाल, दिल्ली आदि) में तुरंत काम खोजना।\n2. बिना किसी रिज्यूमे के सीधे दुकान/कंपनी मालिक से बात कराना।\n3. नियोक्ताओं के लिए 1 मिनट में फ्री जॉब पोस्ट करना।\n4. रजिस्ट्रेशन, 6-अंकीय OTP और पासवर्ड सहायता देना।\n\n👉 आप मुझसे वेबसाइट से जुड़ा कोई भी सवाल पूछ सकते हैं!',
      actions: [
        { label: '👷 काम ढूंढें', path: '/jobs', actionType: 'navigate' },
        { label: '📢 फ्री जॉब पोस्ट करें', path: '/post-job', actionType: 'navigate' },
      ],
      followUps: [
        'काम कैसे मिलेगा?',
        'क्या बीना (Bina) में सेवा उपलब्ध है?',
      ],
      matchedIntent: 'BOT_IDENTITY',
    };
  }

  // --------------------------------------------------------------------------
  // EXACT ANSWER NOT FOUND: SORRY + ASK FOR NEXT QUESTION
  // (यदि सटीक उत्तर न हो, तो माफ़ी मांगकर अगला सवाल पूछने को कहे)
  // --------------------------------------------------------------------------
  return {
    text: `🙏 **माफ़ कीजिए (Sorry)!** मुझे आपके इस सवाल का सटीक उत्तर नहीं मिल पाया।\n\nकृपया आप अपना **अगला सवाल पूछिए** या अपने प्रश्न को थोड़े अलग / सरल शब्दों में लिखकर पूछें।\n\n💡 **मैं आवश्यकता (Abasyakta) वेबसाइट से जुड़े इन सवालों के सटीक जवाब दे सकता हूँ:**\n• **"काम कैसे मिलेगा?"** — 1-क्लिक अप्लाई व HR डायरेक्ट फोन नंबर\n• **"बीना (Bina) या किसी शहर में उपलब्ध है?"** — शहर अनुसार नौकरियां\n• **"जॉब पोस्ट कैसे करें?"** — फ्री में स्टाफ रखने का तरीका\n• **"क्या कोई फीस या चार्ज है?"** — 100% फ्री सेवा\n• **"OTP नहीं आया या पासवर्ड रीसेट?"** — 6-अंकीय कोड सहायता\n\n👉 कृपया अपना **अगला सवाल टाइप करें** या नीचे दिए गए विकल्पों में से चुनें:`,
    actions: [
      { label: '🎯 काम कैसे मिलेगा?', actionType: 'query', queryText: 'काम कैसे मिलेगा?' },
      { label: '📍 बीना (Bina) में काम', actionType: 'query', queryText: 'bina m available h ya nhi' },
      { label: '📢 जॉब पोस्ट कैसे करें?', actionType: 'query', queryText: 'जॉब पोस्ट कैसे करें?' },
      { label: '🔍 सभी नौकरियां देखें', path: '/jobs', actionType: 'navigate' },
    ],
    followUps: [
      'काम कैसे मिलेगा?',
      'क्या बीना (Bina) में सेवा उपलब्ध है?',
      'क्या यह 100% फ्री है?',
      'मालिक से सीधे फोन पर बात कैसे करें?',
    ],
    matchedIntent: 'SORRY_ASK_NEXT',
  };
}

// ----------------------------------------------------------------------------
// 5. PROACTIVE HELP WHEN USER IS STUCK > 30 SECONDS
// ----------------------------------------------------------------------------

export function getProactiveHelp(context: ActivityContext, _language: 'hi' | 'en' = 'hi'): {
  headline: string;
  message: string;
  quickQuestions: string[];
  suggestedAction?: BotAction;
} {
  const { pathname, focusedField } = context;

  if (pathname.includes('/signup')) {
    const isEmployer = focusedField?.includes('company') || focusedField?.includes('gst') || focusedField?.includes('aadhaar');
    if (isEmployer) {
      return {
        headline: 'नियोक्ता रजिस्ट्रेशन में मदद चाहिए?',
        message: 'नमस्ते! क्या आपको कंपनी/दुकान का नाम या आधार OTP वेरिफिकेशन में कोई परेशानी आ रही है? क्या मैं आपकी मदद कर सकता हूँ?',
        quickQuestions: [
          'आधार वेरिफिकेशन क्यों जरूरी है?',
          'OTP नहीं आया तो क्या करें?',
          'रजिस्ट्रेशन के आसान स्टेप्स बताएं',
        ],
        suggestedAction: { label: 'रजिस्ट्रेशन गाइड', actionType: 'query', queryText: 'employer registration help' },
      };
    }
    return {
      headline: 'कामगार रजिस्ट्रेशन में सहायता?',
      message: 'नमस्ते! क्या मैं आपकी सहायता कर सकता हूँ? बस अपना नाम और मोबाइल नंबर भरें, 6-अंकीय OTP से 10 सेकंड में फ्री खाता बन जाएगा। कोई फीस नहीं है!',
      quickQuestions: [
        'OTP कैसे प्राप्त होगा?',
        'क्या रजिस्ट्रेशन बिल्कुल मुफ्त है?',
        'कौन-कौन से काम उपलब्ध हैं?',
      ],
      suggestedAction: { label: 'रजिस्ट्रेशन के आसान स्टेप्स', actionType: 'query', queryText: 'worker registration help' },
    };
  }

  if (pathname.includes('/signin')) {
    return {
      headline: 'लॉगिन करने में कोई परेशानी?',
      message: 'नमस्ते! क्या मैं आपकी मदद कर सकता हूँ? अगर आप अपना पासवर्ड भूल गए हैं, तो "Forgot Password" पर क्लिक करके 6-अंकीय OTP से 1 मिनट में नया पासवर्ड बना सकते हैं।',
      quickQuestions: [
        'पासवर्ड कैसे रीसेट करें?',
        'नया खाता कैसे बनाएं?',
        'कामगार और नियोक्ता में क्या फर्क है?',
      ],
      suggestedAction: { label: 'पासवर्ड रीसेट करें', actionType: 'query', queryText: 'password reset help' },
    };
  }

  if (pathname.includes('/post-job')) {
    return {
      headline: 'नौकरी पोस्ट करने में मदद चाहिए?',
      message: 'नमस्ते! क्या मैं आपकी मदद कर सकता हूँ? काम का नाम, वेतन (दैनिक या मासिक) और अपना शहर भरें। पोस्ट करते ही नजदीकी कामगार आपको सीधे कॉल करेंगे।',
      quickQuestions: [
        'वेतन (मजदूरी) कैसे तय करें?',
        'क्या जॉब पोस्ट करना मुफ्त है?',
        'कामगारों के फोन कैसे आएंगे?',
      ],
      suggestedAction: { label: 'जॉब पोस्ट गाइड', actionType: 'query', queryText: 'how to post a job' },
    };
  }

  if (pathname.includes('/jobs')) {
    return {
      headline: 'मनपसंद नौकरी नहीं मिल रही?',
      message: 'नमस्ते! क्या मैं आपकी मदद कर सकता हूँ? आप किस शहर (उदा. बीना, भोपाल, इंदौर, दिल्ली) में कौन सा काम ढूंढ रहे हैं? मुझे बताइए, मैं आपको तुरंत रास्ता दिखाता हूँ।',
      quickQuestions: [
        'डायरेक्ट मालिक से कैसे बात करें?',
        'बिना रिज्यूमे के कैसे अप्लाई करें?',
        'अपने शहर में काम कैसे देखें?',
      ],
      suggestedAction: { label: 'काम ढूंढने का तरीका', actionType: 'query', queryText: 'kaam kaise milega' },
    };
  }

  return {
    headline: 'क्या मैं आपकी मदद कर सकता हूँ?',
    message: 'नमस्ते! आवश्यकता (Abasyakta) पर आपका स्वागत है। क्या आपको नया काम चाहिए या अपने काम के लिए कामगार रखने हैं? बताइए, मैं आगे की प्रक्रिया में आपकी पूरी सहायता करता हूँ।',
    quickQuestions: [
      'काम कैसे मिलेगा?',
      'क्या बीना (Bina) में उपलब्ध है?',
      'यह वेबसाइट कैसे काम करती है?',
    ],
    suggestedAction: { label: 'नौकरियां देखें', path: '/jobs', actionType: 'navigate' },
  };
}
