import React, { useState, useMemo } from 'react';
import {
  Globe,
  MapPin,
  ChevronDown,
  Search,
  RotateCcw,
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import type { Job } from '../hooks/job';

interface LocationHierarchyDropdownProps {
  allJobs: Job[];
  availableCities: { _id: string; count: number }[];
  onSearch: (location: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Major Indian state-city mapping helper to automatically group database cities into states
const CITY_TO_STATE_MAP: Record<string, string> = {
  // Delhi NCR
  delhi: 'Delhi (NCT)',
  'new delhi': 'Delhi (NCT)',
  noida: 'Uttar Pradesh',
  'greater noida': 'Uttar Pradesh',
  ghaziabad: 'Uttar Pradesh',
  gurgaon: 'Haryana',
  gurugram: 'Haryana',
  faridabad: 'Haryana',

  // Uttar Pradesh
  lucknow: 'Uttar Pradesh',
  kanpur: 'Uttar Pradesh',
  varanasi: 'Uttar Pradesh',
  agra: 'Uttar Pradesh',
  prayagraj: 'Uttar Pradesh',
  allahabad: 'Uttar Pradesh',
  meerut: 'Uttar Pradesh',
  bareilly: 'Uttar Pradesh',
  aligarh: 'Uttar Pradesh',
  moradabad: 'Uttar Pradesh',
  gorakhpur: 'Uttar Pradesh',

  // Madhya Pradesh
  bhopal: 'Madhya Pradesh',
  indore: 'Madhya Pradesh',
  gwalior: 'Madhya Pradesh',
  jabalpur: 'Madhya Pradesh',
  ujjain: 'Madhya Pradesh',
  sagar: 'Madhya Pradesh',
  satna: 'Madhya Pradesh',
  rewa: 'Madhya Pradesh',

  // Maharashtra
  mumbai: 'Maharashtra',
  pune: 'Maharashtra',
  nagpur: 'Maharashtra',
  thane: 'Maharashtra',
  nashik: 'Maharashtra',
  aurangabad: 'Maharashtra',
  solapur: 'Maharashtra',
  navi_mumbai: 'Maharashtra',

  // Karnataka
  bangalore: 'Karnataka',
  bengaluru: 'Karnataka',
  mysore: 'Karnataka',
  hubli: 'Karnataka',
  mangalore: 'Karnataka',

  // Rajasthan
  jaipur: 'Rajasthan',
  jodhpur: 'Rajasthan',
  udaipur: 'Rajasthan',
  kota: 'Rajasthan',
  bikaner: 'Rajasthan',
  ajmer: 'Rajasthan',

  // Gujarat
  ahmedabad: 'Gujarat',
  surat: 'Gujarat',
  vadodara: 'Gujarat',
  rajkot: 'Gujarat',
  bhavnagar: 'Gujarat',

  // Bihar
  patna: 'Bihar',
  gaya: 'Bihar',
  bhagalpur: 'Bihar',
  muzaffarpur: 'Bihar',
  darbhanga: 'Bihar',

  // West Bengal
  kolkata: 'West Bengal',
  howrah: 'West Bengal',
  siliguri: 'West Bengal',
  durgapur: 'West Bengal',

  // Telangana & AP
  hyderabad: 'Telangana',
  secunderabad: 'Telangana',
  visakhapatnam: 'Andhra Pradesh',
  vijayawada: 'Andhra Pradesh',

  // Tamil Nadu
  chennai: 'Tamil Nadu',
  coimbatore: 'Tamil Nadu',
  madurai: 'Tamil Nadu',

  // Punjab & Chandigarh
  chandigarh: 'Chandigarh',
  ludhiana: 'Punjab',
  amritsar: 'Punjab',
  jalandhar: 'Punjab',
};

export function LocationHierarchyDropdown({
  allJobs,
  availableCities,
  onSearch,
  isOpen,
  onClose,
}: LocationHierarchyDropdownProps) {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // 1. Extract dynamic cities directly from active database jobs
  const dbCities = useMemo(() => {
    const map = new Map<string, { name: string; count: number; state: string }>();

    // Seed from availableCities aggregated by backend
    availableCities.forEach((c) => {
      if (!c._id) return;
      const cleanName = c._id.trim();
      const lower = cleanName.toLowerCase();
      const detectedState = CITY_TO_STATE_MAP[lower] || 'Other Regions';
      map.set(lower, {
        name: cleanName,
        count: c.count,
        state: detectedState,
      });
    });

    // Also scan allJobs to ensure all posted job locations are included
    allJobs.forEach((job) => {
      const loc = (job.location || '').trim();
      if (!loc) return;
      const lower = loc.toLowerCase();

      // Check if this location includes a known city
      let matchedKey = lower;
      let state = 'Other Regions';

      // Check city mapping
      for (const [cityKey, st] of Object.entries(CITY_TO_STATE_MAP)) {
        if (lower.includes(cityKey) || cityKey.includes(lower)) {
          matchedKey = cityKey;
          state = st;
          break;
        }
      }

      const displayName = loc.charAt(0).toUpperCase() + loc.slice(1);
      if (map.has(matchedKey)) {
        // already counted in availableCities or previous job
      } else {
        const count = allJobs.filter((j) => (j.location || '').toLowerCase().includes(lower)).length;
        map.set(matchedKey, {
          name: displayName,
          count: Math.max(1, count),
          state,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allJobs, availableCities]);

  // 2. Extract states that actually have jobs in the database
  const activeStates = useMemo(() => {
    const stateMap = new Map<string, { name: string; count: number; cities: string[] }>();

    dbCities.forEach((item) => {
      const st = item.state;
      if (!stateMap.has(st)) {
        stateMap.set(st, { name: st, count: 0, cities: [] });
      }
      const record = stateMap.get(st)!;
      record.count += item.count;
      if (!record.cities.includes(item.name)) {
        record.cities.push(item.name);
      }
    });

    return Array.from(stateMap.values()).sort((a, b) => b.count - a.count);
  }, [dbCities]);

  // 3. Filter cities by selected state
  const citiesInSelectedState = useMemo(() => {
    if (!selectedState) return dbCities;
    return dbCities.filter((c) => c.state === selectedState);
  }, [dbCities, selectedState]);

  // 4. Extract distinct sub-areas / localities from jobs in the chosen city
  const localitiesInCity = useMemo(() => {
    if (!selectedCity) return [];
    const target = selectedCity.toLowerCase();
    const areaSet = new Set<string>();

    allJobs.forEach((j) => {
      const jLoc = (j.location || '').toLowerCase();
      if (jLoc.includes(target) || target.includes(jLoc)) {
        if (j.address && j.address.trim()) {
          // Extract prominent address parts
          const parts = j.address.split(',').map((p) => p.trim()).filter((p) => p.length > 2);
          parts.forEach((p) => areaSet.add(p));
        }
      }
    });

    return Array.from(areaSet).slice(0, 10);
  }, [allJobs, selectedCity]);

  // 5. Total jobs matching current selection
  const matchingJobsCount = useMemo(() => {
    if (selectedArea) {
      const area = selectedArea.toLowerCase();
      return allJobs.filter((j) =>
        (j.address || '').toLowerCase().includes(area) || (j.location || '').toLowerCase().includes(area)
      ).length;
    }
    if (selectedCity) {
      const city = selectedCity.toLowerCase();
      return allJobs.filter((j) => (j.location || '').toLowerCase().includes(city)).length;
    }
    if (selectedState) {
      const validCities = citiesInSelectedState.map((c) => c.name.toLowerCase());
      return allJobs.filter((j) => {
        const l = (j.location || '').toLowerCase();
        return validCities.some((vc) => l.includes(vc) || vc.includes(l));
      }).length;
    }
    return allJobs.length;
  }, [allJobs, selectedState, selectedCity, selectedArea, citiesInSelectedState]);

  const handleApply = () => {
    const target = selectedArea || selectedCity || selectedState || '';
    onSearch(target);
    onClose();
  };

  const handleReset = () => {
    setSelectedState('');
    setSelectedCity('');
    setSelectedArea('');
    setSearchFilter('');
  };

  const handleQuickCityClick = (cityName: string) => {
    onSearch(cityName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="relative z-30 mb-8 rounded-3xl border-2 border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-white via-emerald-50/25 to-stone-50 dark:from-stone-900 dark:via-emerald-950/20 dark:to-stone-900 p-6 md:p-8 shadow-2xl shadow-emerald-900/10 dark:shadow-emerald-950/50 animate-fade-in ring-1 ring-black/5 dark:ring-white/5">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-stone-200/80 dark:border-stone-800">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/70 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 mb-2">
            <Globe size={14} className="text-emerald-700 dark:text-emerald-400" />
            <span>100% Real Database Location Filter</span>
          </div>
          <h3 className="text-xl md:text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            सक्रिय नौकरियों के अनुसार शहर व राज्य चुनें
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            डेटाबेस में मौजूद वास्तविक नौकरियों के आधार पर फ़िल्टर करें (0 डमी डेटा)
          </p>
        </div>

        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition active:scale-95 cursor-pointer"
          aria-label="Close Filter"
        >
          <X size={18} />
        </button>
      </div>

      {/* Quick Active City Chips from Database */}
      {dbCities.length > 0 && (
        <div className="mt-5 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-2">
            📍 सक्रिय शहर (सीधे डेटाबेस से):
          </span>
          <div className="flex flex-wrap gap-2">
            {dbCities.slice(0, 8).map((city) => (
              <button
                key={city.name}
                type="button"
                onClick={() => handleQuickCityClick(city.name)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer border ${
                  selectedCity === city.name
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                <MapPin size={12} className={selectedCity === city.name ? 'text-white' : 'text-emerald-600'} />
                <span>{city.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCity === city.name
                    ? 'bg-emerald-700 text-emerald-100'
                    : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                }`}>
                  {city.count} {city.count === 1 ? 'job' : 'jobs'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3 Cascading Dynamic Dropdowns Grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. STATE DROPDOWN */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">1</span>
              State (राज्य)
            </span>
            <span className="text-[11px] font-normal text-stone-400">
              {activeStates.length} active
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedCity('');
                setSelectedArea('');
              }}
              className="w-full appearance-none rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 py-3 pl-3.5 pr-9 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition cursor-pointer"
            >
              <option value="">-- All Active States ({activeStates.length}) --</option>
              {activeStates.map((st) => (
                <option key={st.name} value={st.name}>
                  {st.name} ({st.count} {st.count === 1 ? 'job' : 'jobs'})
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-stone-400" />
          </div>
        </div>

        {/* 2. CITY DROPDOWN */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">2</span>
              City (शहर)
            </span>
            <span className="text-[11px] font-normal text-stone-400">
              {citiesInSelectedState.length} cities
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedArea('');
              }}
              className="w-full appearance-none rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 py-3 pl-3.5 pr-9 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition cursor-pointer"
            >
              <option value="">
                {selectedState ? `-- All Cities in ${selectedState} --` : '-- All Active Cities --'}
              </option>
              {citiesInSelectedState.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count} {c.count === 1 ? 'job' : 'jobs'})
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-stone-400" />
          </div>
        </div>

        {/* 3. LOCALITY / AREA DROPDOWN */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">3</span>
              Area / Locality (इलाका)
            </span>
            <span className="text-[11px] font-normal text-stone-400">
              {localitiesInCity.length > 0 ? `${localitiesInCity.length} areas` : 'Optional'}
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              disabled={!selectedCity || localitiesInCity.length === 0}
              className={`w-full appearance-none rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 py-3 pl-3.5 pr-9 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition cursor-pointer ${
                !selectedCity || localitiesInCity.length === 0 ? 'opacity-50 cursor-not-allowed bg-stone-50 dark:bg-stone-900' : ''
              }`}
            >
              <option value="">
                {!selectedCity
                  ? '-- Select City First --'
                  : localitiesInCity.length === 0
                  ? '-- All Areas in City --'
                  : `-- All Areas in ${selectedCity} --`}
              </option>
              {localitiesInCity.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-stone-400" />
          </div>
        </div>
      </div>

      {/* Bottom Action Footer with Live Matching Count */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-stone-200/80 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="text-xs font-extrabold text-stone-900 dark:text-stone-100">
              {matchingJobsCount} {matchingJobsCount === 1 ? 'Real Job' : 'Real Jobs'}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 ml-1.5">
              {selectedArea || selectedCity || selectedState
                ? `matching "${selectedArea || selectedCity || selectedState}"`
                : 'in database right now'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {(selectedState || selectedCity || selectedArea) && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2.5 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition cursor-pointer active:scale-95"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/30 transition cursor-pointer active:scale-95"
          >
            <span>{selectedCity || selectedState ? `Show Jobs in ${selectedCity || selectedState}` : 'View All Jobs'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
