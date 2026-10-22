/**
 * Geo Location & Distance Utilities for Avashyakta Hai
 * Provides GPS coordinates, Haversine distance calculation, 
 * Indian city coordinates resolution, and reverse geocoding.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
  cityName?: string;
  formattedAddress?: string;
}

// Comprehensive dictionary of major Indian cities with their coordinates (Lat, Lng)
export const CITY_COORDINATES: Record<string, Coordinates> = {
  // Metro & Major Cities
  delhi: { latitude: 28.6139, longitude: 77.209 },
  'new delhi': { latitude: 28.6139, longitude: 77.209 },
  noida: { latitude: 28.5355, longitude: 77.391 },
  'greater noida': { latitude: 28.4744, longitude: 77.504 },
  gurgaon: { latitude: 28.4595, longitude: 77.0266 },
  gurugram: { latitude: 28.4595, longitude: 77.0266 },
  faridabad: { latitude: 28.4089, longitude: 77.3178 },
  ghaziabad: { latitude: 28.6692, longitude: 77.4538 },
  mumbai: { latitude: 19.076, longitude: 72.8777 },
  navi_mumbai: { latitude: 19.033, longitude: 73.0297 },
  thane: { latitude: 19.2183, longitude: 72.9781 },
  pune: { latitude: 18.5204, longitude: 73.8567 },
  bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
  hyderabad: { latitude: 17.385, longitude: 78.4867 },
  secunderabad: { latitude: 17.4399, longitude: 78.4983 },
  chennai: { latitude: 13.0827, longitude: 80.2707 },
  kolkata: { latitude: 22.5726, longitude: 88.3639 },
  ahmedabad: { latitude: 23.0225, longitude: 72.5714 },
  surat: { latitude: 21.1702, longitude: 72.8311 },
  vadodara: { latitude: 22.3072, longitude: 73.1812 },
  rajkot: { latitude: 22.3039, longitude: 70.8022 },
  jaipur: { latitude: 26.9124, longitude: 75.7873 },
  jodhpur: { latitude: 26.2389, longitude: 73.0243 },
  udaipur: { latitude: 24.5854, longitude: 73.7125 },
  kota: { latitude: 25.2138, longitude: 75.8648 },
  bhopal: { latitude: 23.2599, longitude: 77.4126 },
  indore: { latitude: 22.7196, longitude: 75.8577 },
  gwalior: { latitude: 26.2183, longitude: 78.1828 },
  jabalpur: { latitude: 23.1815, longitude: 79.9864 },
  ujjain: { latitude: 23.1765, longitude: 75.7885 },
  lucknow: { latitude: 26.8467, longitude: 80.9462 },
  kanpur: { latitude: 26.4499, longitude: 80.3319 },
  varanasi: { latitude: 25.3176, longitude: 82.9739 },
  agra: { latitude: 27.1767, longitude: 78.0081 },
  prayagraj: { latitude: 25.4358, longitude: 81.8463 },
  allahabad: { latitude: 25.4358, longitude: 81.8463 },
  patna: { latitude: 25.5941, longitude: 85.1376 },
  ranchi: { latitude: 23.3441, longitude: 85.3096 },
  jamshedpur: { latitude: 22.8046, longitude: 86.2029 },
  raipur: { latitude: 21.2514, longitude: 81.6296 },
  bilaspur: { latitude: 22.0797, longitude: 82.1409 },
  chandigarh: { latitude: 30.7333, longitude: 76.7794 },
  mohali: { latitude: 30.7046, longitude: 76.7179 },
  panchkula: { latitude: 30.6942, longitude: 76.8606 },
  ludhiana: { latitude: 30.901, longitude: 75.8573 },
  amritsar: { latitude: 31.634, longitude: 74.8723 },
  jalandhar: { latitude: 31.326, longitude: 75.5762 },
  dehradun: { latitude: 30.3165, longitude: 78.0322 },
  haridwar: { latitude: 29.9457, longitude: 78.1642 },
  shimla: { latitude: 31.1048, longitude: 77.1734 },
  bhubaneswar: { latitude: 20.2961, longitude: 85.8245 },
  cuttack: { latitude: 20.4625, longitude: 85.883 },
  guwahati: { latitude: 26.1445, longitude: 91.7362 },
  nagpur: { latitude: 21.1458, longitude: 79.0882 },
  nashik: { latitude: 19.9975, longitude: 73.7898 },
  aurangabad: { latitude: 19.8762, longitude: 75.3433 },
  coimbatore: { latitude: 11.0168, longitude: 76.9558 },
  madurai: { latitude: 9.9252, longitude: 78.1198 },
  kochi: { latitude: 9.9312, longitude: 76.2673 },
  thiruvananthapuram: { latitude: 8.5241, longitude: 76.9366 },
};

/**
 * Calculates straight-line distance in kilometers between two geo coordinates
 * using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Infinity;
  }

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10; // Round to 1 decimal place (e.g. 2.4 km)
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Formats distance with appropriate units and language suffix.
 */
export function formatDistance(distanceKm: number, language: string = 'en'): string {
  if (distanceKm === Infinity || isNaN(distanceKm)) {
    return '';
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return language === 'hi' ? `${meters} मीटर दूर` : `${meters} m away`;
  }
  return language === 'hi'
    ? `${distanceKm} किमी दूर`
    : `${distanceKm} km away`;
}

/**
 * Resolves coordinates for an entity.
 * If entity has exact latitude/longitude, returns them directly.
 * Otherwise attempts to match against known Indian cities based on location string.
 */
export function resolveCoordinates(
  entity: {
    latitude?: number | null;
    longitude?: number | null;
    location?: string | null;
    address?: string | null;
  }
): Coordinates | null {
  if (
    typeof entity.latitude === 'number' &&
    typeof entity.longitude === 'number' &&
    !isNaN(entity.latitude) &&
    !isNaN(entity.longitude) &&
    entity.latitude !== 0 &&
    entity.longitude !== 0
  ) {
    return {
      latitude: entity.latitude,
      longitude: entity.longitude,
    };
  }

  const locText = `${entity.location || ''} ${entity.address || ''}`.toLowerCase();
  if (!locText.trim()) return null;

  for (const [cityName, coords] of Object.entries(CITY_COORDINATES)) {
    const cleanCity = cityName.replace('_', ' ');
    if (locText.includes(cleanCity)) {
      return coords;
    }
  }

  return null;
}

/**
 * Browser GPS Geolocation Request
 */
export async function getCurrentGPSPosition(): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        // Try reverse geocoding with 2.5s timeout
        let cityName: string | undefined;
        let formattedAddress: string | undefined;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
            {
              headers: { 'Accept-Language': 'hi,en' },
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            cityName =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.suburb ||
              addr.county ||
              addr.state_district ||
              '';
            formattedAddress = data.display_name;
          }
        } catch {
          // Fallback: Find closest known city from CITY_COORDINATES
          let minDistance = Infinity;
          let closestCity = '';
          for (const [name, coords] of Object.entries(CITY_COORDINATES)) {
            const dist = calculateDistanceKm(lat, lon, coords.latitude, coords.longitude);
            if (dist < minDistance && dist < 70) {
              minDistance = dist;
              closestCity = name.charAt(0).toUpperCase() + name.slice(1);
            }
          }
          if (closestCity) {
            cityName = closestCity;
          }
        }

        resolve({
          latitude: lat,
          longitude: lon,
          accuracy,
          cityName,
          formattedAddress,
        });
      },
      (error) => {
        let msg = 'Failed to get your location';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Generates a turn-by-turn navigation URL for Google Maps / Device Maps
 * to help a worker reach the exact workplace.
 */
export function getDirectionsUrl(destination: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  location?: string | null;
  cityName?: string | null;
}): string {
  if (
    typeof destination.latitude === 'number' &&
    typeof destination.longitude === 'number' &&
    !isNaN(destination.latitude) &&
    !isNaN(destination.longitude) &&
    destination.latitude !== 0 &&
    destination.longitude !== 0
  ) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
  }

  const queryParts = [destination.address, destination.location || destination.cityName]
    .filter(Boolean)
    .join(', ');

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(queryParts || 'India')}`;
}

