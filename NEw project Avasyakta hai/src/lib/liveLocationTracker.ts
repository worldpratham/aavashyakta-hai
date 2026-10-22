import { emitWorkerLocation, emitWorkerStatusToggle } from './socket';
import { calculateDistanceKm } from './geo';
import { api } from './api';

let watchId: number | null = null;
let lastEmittedCoords: { latitude: number; longitude: number } | null = null;
let lastEmittedTime = 0;
let lastRestUpdateTime = 0;

export interface LiveTrackingState {
  isTracking: boolean;
  coords: { latitude: number; longitude: number } | null;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  error: string | null;
}

type TrackingListener = (state: LiveTrackingState) => void;
const listeners = new Set<TrackingListener>();

let currentState: LiveTrackingState = {
  isTracking: false,
  coords: null,
  speed: null,
  heading: null,
  accuracy: null,
  error: null,
};

function notifyListeners() {
  listeners.forEach((listener) => listener({ ...currentState }));
}

/**
 * Starts continuous live GPS tracking for a worker using watchPosition
 */
export function startLiveWorkerTracking(
  workerId: string,
  statusText: string = ''
): () => void {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    currentState = {
      ...currentState,
      error: 'Geolocation is not supported by your browser',
      isTracking: false,
    };
    notifyListeners();
    return () => {};
  }

  // If already tracking, don't spawn duplicate watcher
  if (watchId !== null) {
    return () => stopLiveWorkerTracking();
  }

  currentState = {
    ...currentState,
    isTracking: true,
    error: null,
  };
  notifyListeners();

  try {
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading, accuracy } = position.coords;
        const now = Date.now();

        currentState = {
          isTracking: true,
          coords: { latitude, longitude },
          speed: speed ?? null,
          heading: heading ?? null,
          accuracy: accuracy ?? null,
          error: null,
        };
        notifyListeners();

        // Check if movement is significant (>= 15 meters) or interval >= 15 seconds
        let shouldEmit = false;
        if (!lastEmittedCoords) {
          shouldEmit = true;
        } else {
          const distKm = calculateDistanceKm(
            lastEmittedCoords.latitude,
            lastEmittedCoords.longitude,
            latitude,
            longitude
          );
          const movedMeters = distKm * 1000;
          const timeSinceLastSec = (now - lastEmittedTime) / 1000;

          if (movedMeters >= 15 || timeSinceLastSec >= 15) {
            shouldEmit = true;
          }
        }

        if (shouldEmit) {
          lastEmittedCoords = { latitude, longitude };
          lastEmittedTime = now;

          // 1. Emit live Socket.io packet for immediate UI movement
          emitWorkerLocation({
            workerId,
            latitude,
            longitude,
            heading: heading ?? 0,
            speed: speed ?? 0,
            statusText,
            updatedAt: new Date().toISOString(),
          });

          // 2. Persist to MongoDB REST backend every 45-60 seconds for permanent storage
          if (now - lastRestUpdateTime >= 45000) {
            lastRestUpdateTime = now;
            api.users.update(workerId, {
              latitude,
              longitude,
              is_available_now: true,
            }).catch(() => {});
          }
        }
      },
      (err) => {
        let msg = 'Failed to get live position';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location signal is weak or unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'GPS signal request timed out.';
        }

        currentState = {
          ...currentState,
          error: msg,
        };
        notifyListeners();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  } catch (e: any) {
    currentState = {
      ...currentState,
      error: e?.message || 'Failed to initialize GPS tracking',
      isTracking: false,
    };
    notifyListeners();
  }

  return () => stopLiveWorkerTracking();
}

/**
 * Stops live worker tracking and clears browser watcher
 */
export function stopLiveWorkerTracking(): void {
  if (watchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  lastEmittedCoords = null;
  currentState = {
    ...currentState,
    isTracking: false,
  };
  notifyListeners();
}

/**
 * Subscribe to live tracking state updates
 */
export function subscribeToLiveTracking(listener: TrackingListener): () => void {
  listeners.add(listener);
  listener({ ...currentState });
  return () => {
    listeners.delete(listener);
  };
}
