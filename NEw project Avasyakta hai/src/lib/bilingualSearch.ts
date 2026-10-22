/**
 * Bilingual Search Engine (Hindi <-> English <-> Hinglish)
 * Solves cross-script search matching for blue-collar jobs in India:
 * e.g. Searching "कुक" or "रसोइया" matches jobs titled "Cook", "Chef", etc.
 * Searching "ड्राइवर" matches "Driver", "Plumber" matches "प्लंबर", etc.
 */

export interface CategorySynonymGroup {
  primaryCategory: string; // Stored DB category (e.g. "Cook")
  englishLabel: string;
  hindiLabel: string;
  synonyms: string[]; // Lowercase synonyms in English, Hindi, and colloquial Hinglish
}

export const BILINGUAL_CATEGORY_GROUPS: CategorySynonymGroup[] = [
  {
    primaryCategory: 'Cook',
    englishLabel: 'Cook / Chef',
    hindiLabel: 'रसोइया / कुक',
    synonyms: [
      'cook',
      'chef',
      'cooking',
      'kitchen',
      'khana',
      'bawarchi',
      'bawarchee',
      'halwai',
      'कुक',
      'रसोइया',
      'रसोईया',
      'बावर्ची',
      'शेफ',
      'खाना',
      'हलवाई',
      'कूक',
    ],
  },
  {
    primaryCategory: 'Driver',
    englishLabel: 'Driver',
    hindiLabel: 'ड्राइवर / चालक',
    synonyms: [
      'driver',
      'driving',
      'chauffeur',
      'cab',
      'taxi',
      'car driver',
      'gadi',
      'gaadi',
      'ड्राइवर',
      'चालक',
      'ड्राइविंग',
      'गाड़ी',
      'कार',
      'वाहन चालक',
      'ड्राईवर',
    ],
  },
  {
    primaryCategory: 'Plumber',
    englishLabel: 'Plumber',
    hindiLabel: 'प्लंबर / नल मिस्त्री',
    synonyms: [
      'plumber',
      'plumbing',
      'pipe',
      'fitting',
      'sanitary',
      'प्लंबर',
      'नलसाज',
      'नल मिस्त्री',
      'नल',
      'पाइप',
      'प्लम्बर',
      'सेनेटरी',
    ],
  },
  {
    primaryCategory: 'Electrician',
    englishLabel: 'Electrician',
    hindiLabel: 'इलेक्ट्रीशियन / बिजली मिस्त्री',
    synonyms: [
      'electrician',
      'electric',
      'electrical',
      'wiring',
      'light',
      'bijli',
      'इलेक्ट्रीशियन',
      'बिजली',
      'बिजली मिस्त्री',
      'लाइट',
      'वायरिंग',
      'इलेक्ट्रिक',
    ],
  },
  {
    primaryCategory: 'Carpenter',
    englishLabel: 'Carpenter',
    hindiLabel: 'कारपेंटर / बढ़ई',
    synonyms: [
      'carpenter',
      'carpentry',
      'woodwork',
      'furniture',
      'badhai',
      'lakdi',
      'कारपेंटर',
      'बढ़ई',
      'फर्नीचर',
      'लकड़ी',
      'कारपेन्टर',
    ],
  },
  {
    primaryCategory: 'Delivery',
    englishLabel: 'Delivery',
    hindiLabel: 'डिलीवरी बॉय / राइडर',
    synonyms: [
      'delivery',
      'delivery boy',
      'rider',
      'courier',
      'parcel',
      'biker',
      'डिलीवरी',
      'डिलीवरी बॉय',
      'राइडर',
      'कूरियर',
      'पार्सल',
      'डिलिवरी',
    ],
  },
  {
    primaryCategory: 'Housekeeping',
    englishLabel: 'Housekeeping / Maid',
    hindiLabel: 'सफाई / हाउसकीपिंग / मेड',
    synonyms: [
      'housekeeping',
      'cleaner',
      'cleaning',
      'maid',
      'sweeper',
      'safai',
      'jhadu',
      'pocha',
      'bartan',
      'kamwali',
      'bai',
      'हाउसकीपिंग',
      'सफाई',
      'क्लीनर',
      'सफाईकर्मी',
      'कामवाली',
      'बाई',
      'मेड',
      'झाड़ू',
      'पोछा',
      'बर्तन',
      'सफाईवाला',
    ],
  },
  {
    primaryCategory: 'Domestic Help',
    englishLabel: 'Domestic Help',
    hindiLabel: 'घरेलू काम / नौकर',
    synonyms: [
      'domestic help',
      'servant',
      'maid',
      'helper',
      'caretaker',
      'baby sitter',
      'घरेलू',
      'घरेलू काम',
      'नौकर',
      'केयरटेकर',
      'आया',
      'बाई',
    ],
  },
  {
    primaryCategory: 'Security Guard',
    englishLabel: 'Security Guard',
    hindiLabel: 'सिक्योरिटी गार्ड / चौकीदार',
    synonyms: [
      'security guard',
      'security',
      'guard',
      'watchman',
      'chowkidar',
      'सिक्योरिटी गार्ड',
      'सिक्योरिटी',
      'गार्ड',
      'चौकीदार',
      'पहरेदार',
      'सुरक्षा कर्मी',
      'सिक्यूरिटी',
    ],
  },
  {
    primaryCategory: 'Labour / Helper',
    englishLabel: 'Labour / Helper',
    hindiLabel: 'मजदूर / हेल्पर',
    synonyms: [
      'labour',
      'labor',
      'helper',
      'loader',
      'unloader',
      'worker',
      'hamal',
      'coolie',
      'majdoor',
      'beldar',
      'लेबर',
      'हेल्पर',
      'मजदूर',
      'सहायक',
      'हमाली',
      'पल्लेदार',
      'बेलदार',
      'मजदूरी',
      'कुली',
      'लोडिंग',
    ],
  },
  {
    primaryCategory: 'Painter',
    englishLabel: 'Painter',
    hindiLabel: 'पेंटर / रंगाई पुताई',
    synonyms: [
      'painter',
      'painting',
      'paint',
      'whitewash',
      'putai',
      'rangai',
      'पेंटर',
      'रंगाई',
      'पुताई',
      'पेंट',
      'कलर',
      'वाइटवॉश',
    ],
  },
  {
    primaryCategory: 'Peon',
    englishLabel: 'Peon / Office Boy',
    hindiLabel: 'प्यून / चपरासी',
    synonyms: [
      'peon',
      'office boy',
      'office peon',
      'chaprasi',
      'chapraasi',
      'प्यून',
      'ऑफिस बॉय',
      'चपरासी',
      'सहायक',
    ],
  },
  {
    primaryCategory: 'Technician',
    englishLabel: 'Technician / Mechanic',
    hindiLabel: 'मैकेनिक / तकनीशियन',
    synonyms: [
      'technician',
      'mechanic',
      'repair',
      'servicing',
      'ac mechanic',
      'mistri',
      'तकनीशियन',
      'मैकेनिक',
      'रिपेयर',
      'सर्विसिंग',
      'मिस्त्री',
      'मैकैनिक',
    ],
  },
  {
    primaryCategory: 'Warehouse / Logistics',
    englishLabel: 'Warehouse / Logistics',
    hindiLabel: 'वेयरहाउस / गोदाम',
    synonyms: [
      'warehouse',
      'logistics',
      'godown',
      'packaging',
      'packing',
      'picker',
      'गोदाम',
      'वेयरहाउस',
      'लॉजिस्टिक्स',
      'पैकिंग',
      'पैकर',
    ],
  },
  {
    primaryCategory: 'Retail',
    englishLabel: 'Retail / Sales',
    hindiLabel: 'दुकान / रिटेल / सेल्स',
    synonyms: [
      'retail',
      'sales',
      'shop',
      'store',
      'counter',
      'cashier',
      'dukaan',
      'दुकान',
      'रिटेल',
      'सेल्स',
      'कैशियर',
      'काउंटर',
      'स्टोर',
    ],
  },
  {
    primaryCategory: 'Construction',
    englishLabel: 'Construction',
    hindiLabel: 'निर्माण / राजमिस्त्री',
    synonyms: [
      'construction',
      'mason',
      'builder',
      'civil',
      'thekedaar',
      'rajmistri',
      'कंस्ट्रक्शन',
      'निर्माण',
      'राजमिस्त्री',
      'ठेकेदार',
      'चिनाई',
    ],
  },
  {
    primaryCategory: 'Office Work',
    englishLabel: 'Office Work',
    hindiLabel: 'ऑफिस वर्क / कंप्यूटर',
    synonyms: [
      'office work',
      'computer',
      'data entry',
      'back office',
      'telecaller',
      'calling',
      'bpo',
      'ऑफिस वर्क',
      'कंप्यूटर',
      'डेटा एंट्री',
      'बैक ऑफिस',
      'टेलीकॉलर',
      'कॉलिंग',
    ],
  },
];

/**
 * Given a raw search query (e.g. "कुक" or "cook" or "driver"), returns all matching synonyms
 */
export function getExpandedSearchTokens(query: string): string[] {
  if (!query || !query.trim()) return [];
  const normalized = query.trim().toLowerCase();
  const tokens = new Set<string>();

  // Add the query itself
  tokens.add(normalized);

  // Split multi-word query into single tokens
  const words = normalized.split(/\s+/).filter(Boolean);
  words.forEach((w) => tokens.add(w));

  // Find all matched categories in synonym groups
  for (const group of BILINGUAL_CATEGORY_GROUPS) {
    let matched = false;

    // Check if query exactly equals or contains any synonym
    for (const syn of group.synonyms) {
      if (normalized === syn || normalized.includes(syn) || syn.includes(normalized)) {
        matched = true;
        break;
      }
      for (const w of words) {
        if (w === syn || syn.includes(w)) {
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    if (matched) {
      // Add primary category and all synonyms to search token pool
      tokens.add(group.primaryCategory.toLowerCase());
      group.synonyms.forEach((s) => tokens.add(s.toLowerCase()));
    }
  }

  return Array.from(tokens);
}

/**
 * Resolves a spoken or typed term to its primary standard Category (e.g. "कुक" -> "Cook")
 */
export function resolveToPrimaryCategory(term: string): string | null {
  if (!term || !term.trim()) return null;
  const normalized = term.trim().toLowerCase();

  for (const group of BILINGUAL_CATEGORY_GROUPS) {
    if (group.primaryCategory.toLowerCase() === normalized) {
      return group.primaryCategory;
    }
    for (const syn of group.synonyms) {
      if (normalized === syn || normalized.includes(syn)) {
        return group.primaryCategory;
      }
    }
  }

  return null;
}

/**
 * Checks if a target job matches a bilingual search query
 */
export function matchesBilingualJob(
  job: {
    title?: string;
    category?: string;
    description?: string;
    location?: string;
    address?: string;
    skills?: string[] | string;
  },
  query: string
): boolean {
  if (!query || !query.trim()) return true;

  const rawQuery = query.trim().toLowerCase();
  const jobTitle = (job.title || '').toLowerCase();
  const jobCat = (job.category || '').toLowerCase();
  const jobDesc = (job.description || '').toLowerCase();
  const jobLoc = (job.location || '').toLowerCase();
  const jobAddr = (job.address || '').toLowerCase();
  const jobSkills = Array.isArray(job.skills)
    ? job.skills.join(' ').toLowerCase()
    : typeof job.skills === 'string'
    ? job.skills.toLowerCase()
    : '';

  const jobHaystack = `${jobTitle} ${jobCat} ${jobDesc} ${jobLoc} ${jobAddr} ${jobSkills}`;

  // 1. Direct match (Fast Path)
  if (jobHaystack.includes(rawQuery)) {
    return true;
  }

  // 2. Bilingual expansion match
  const expandedTokens = getExpandedSearchTokens(query);
  for (const token of expandedTokens) {
    if (token.length < 2) continue;
    if (jobHaystack.includes(token)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if two category values are equivalent across Hindi/English
 */
export function isSameCategoryBilingual(catA?: string, catB?: string): boolean {
  if (!catA || !catB) return false;
  const a = catA.trim().toLowerCase();
  const b = catB.trim().toLowerCase();

  if (a === b || a.includes(b) || b.includes(a)) return true;

  const resolvedA = resolveToPrimaryCategory(a) || a;
  const resolvedB = resolveToPrimaryCategory(b) || b;

  return resolvedA.toLowerCase() === resolvedB.toLowerCase();
}
