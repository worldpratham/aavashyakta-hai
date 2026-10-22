import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Phone,
  MessageCircle,
  Briefcase,
  Compass,
  Zap,
  Route,
  Loader2,
  X,
  MapPin,
  Map as MapIcon,
  Globe,
  Layers,
  Lock,
} from 'lucide-react';
import type { Profile, Job } from '@/lib/api';
import { onWorkerMoved, type WorkerLocationPayload } from '@/lib/socket';
import { resolveCoordinates, calculateDistanceKm, formatDistance, getDirectionsUrl } from '@/lib/geo';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/router';

interface LiveGPSMapProps {
  workers?: Profile[];
  jobs?: Job[];
  userLocation?: { latitude: number; longitude: number } | null;
  height?: string;
  radiusKm?: number;
  onWorkerClick?: (worker: Profile) => void;
  onJobClick?: (job: Job) => void;
}

interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
  targetName: string;
}

export function LiveGPSMap({
  workers = [],
  jobs = [],
  userLocation,
  height = '480px',
  radiusKm = 0,
  onWorkerClick,
  onJobClick,
}: LiveGPSMapProps) {
  const { language } = useLanguage();
  const { profile, session } = useAuth();
  const { navigate } = useRouter();
  const isLoggedIn = Boolean(session && profile);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Map Tile Layers (Street, Satellite, Hybrid)
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'hybrid'>('street');
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const hybridLabelsLayerRef = useRef<L.TileLayer | null>(null);

  // Live worker positions map (keyed by workerId)
  const [liveWorkerPositions, setLiveWorkerPositions] = useState<
    Record<string, { latitude: number; longitude: number; heading?: number; speed?: number }>
  >({});

  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // 1. Listen for real-time socket worker movements
  useEffect(() => {
    if (!isLoggedIn) return;
    const unsubscribe = onWorkerMoved((data: WorkerLocationPayload) => {
      setLiveWorkerPositions((prev) => ({
        ...prev,
        [data.workerId]: {
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading,
          speed: data.speed,
        },
      }));
    });
    return () => unsubscribe();
  }, [isLoggedIn]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: User location or India center
      const initialLat = userLocation?.latitude ?? 23.2599; // Bhopal
      const initialLng = userLocation?.longitude ?? 77.4126;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: userLocation ? 13 : 6,
        zoomControl: true,
      });

      // Layer A: Official OpenStreetMap tiles (100% Free, No API key, No watermark)
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
      });

      // Layer B: Real High-Resolution Satellite View (Esri World Imagery, 100% Free)
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Earthstar Geographics, Maxar',
          maxZoom: 19,
        }
      );

      // Layer C: Road & Place Names Reference Overlay for Hybrid Mode
      const hybridLabelsLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri',
          maxZoom: 19,
        }
      );

      streetLayerRef.current = streetLayer;
      satelliteLayerRef.current = satelliteLayer;
      hybridLabelsLayerRef.current = hybridLabelsLayer;

      // Mount initial layer
      streetLayer.addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoggedIn]);

  // Sync Map Type Changes (Street / Satellite / Hybrid)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const street = streetLayerRef.current;
    const satellite = satelliteLayerRef.current;
    const labels = hybridLabelsLayerRef.current;

    // Remove old layers
    if (street && map.hasLayer(street)) map.removeLayer(street);
    if (satellite && map.hasLayer(satellite)) map.removeLayer(satellite);
    if (labels && map.hasLayer(labels)) map.removeLayer(labels);

    // Apply chosen layer
    if (mapType === 'street' && street) {
      street.addTo(map);
    } else if (mapType === 'satellite' && satellite) {
      satellite.addTo(map);
    } else if (mapType === 'hybrid') {
      if (satellite) satellite.addTo(map);
      if (labels) labels.addTo(map);
    }
  }, [mapType]);

  // 3. Render Markers & Radius Circle
  useEffect(() => {
    if (!isLoggedIn) return;
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }

    const bounds: L.LatLngExpression[] = [];

    // A. Render User Location (Pulse Radar Pin)
    if (userLocation) {
      const userLatLng: [number, number] = [userLocation.latitude, userLocation.longitude];
      bounds.push(userLatLng);

      const userIcon = L.divIcon({
        className: 'user-radar-marker',
        html: `
          <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; width:100%; height:100%; border-radius:50%; background:#0284c7; opacity:0.3; animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></span>
            <div style="width:18px; height:18px; border-radius:50%; background:#0284c7; border:3px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.3); z-index:2;"></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const userMarker = L.marker(userLatLng, { icon: userIcon }).addTo(layer);
      userMarker.bindPopup(`
        <div style="font-family:inherit; padding:4px;">
          <div style="font-weight:bold; color:#0369a1; font-size:13px; display:flex; align-items:center; gap:4px;">
            <span>📍 ${language === 'hi' ? 'आपका स्थान (You)' : 'Your Location'}</span>
          </div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">
            ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}
          </div>
        </div>
      `);

      // Radius Circle overlay if selected
      if (radiusKm > 0) {
        radiusCircleRef.current = L.circle(userLatLng, {
          radius: radiusKm * 1000,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '6, 6',
        }).addTo(map);
      }
    }

    // B. Render Available Workers (Glowing Emerald Pins)
    workers.forEach((worker) => {
      // Use live socket coordinates if moved, else profile coords
      const liveCoords = liveWorkerPositions[worker.id];
      const coords = liveCoords || resolveCoordinates(worker);
      if (!coords) return;

      const workerLatLng: [number, number] = [coords.latitude, coords.longitude];
      bounds.push(workerLatLng);

      const firstChar = (worker.full_name || 'W').charAt(0).toUpperCase();
      const isOnline = worker.is_available_now ?? true;

      const workerIcon = L.divIcon({
        className: 'worker-live-marker',
        html: `
          <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            ${
              isOnline
                ? `<span style="position:absolute; width:100%; height:100%; border-radius:50%; background:#10b981; opacity:0.35; animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>`
                : ''
            }
            <div style="width:34px; height:34px; border-radius:12px; background:linear-gradient(135deg, #059669, #0d9488); border:2.5px solid white; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:14px; box-shadow:0 4px 12px rgba(5,150,105,0.4); z-index:2;">
              ${firstChar}
            </div>
            <span style="position:absolute; bottom:2px; right:2px; width:10px; height:10px; border-radius:50%; background:#22c55e; border:1.5px solid white; z-index:3;"></span>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const dist = userLocation
        ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, coords.latitude, coords.longitude)
        : Infinity;

      const marker = L.marker(workerLatLng, { icon: workerIcon }).addTo(layer);

      const cleanPhone = (worker.phone || '').replace(/\D/g, '');
      const popupHtml = `
        <div style="min-width:210px; font-family:inherit; padding:4px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:32px; height:32px; border-radius:8px; background:#059669; color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px;">
              ${firstChar}
            </div>
            <div>
              <div style="font-weight:bold; font-size:13px; color:#0f172a;">${worker.full_name}</div>
              <div style="font-size:11px; font-weight:600; color:#059669;">${worker.primary_skill || 'Worker'}</div>
            </div>
          </div>

          ${
            worker.available_status_text
              ? `<div style="margin-top:6px; font-size:11px; font-style:italic; background:#f0fdf4; color:#166534; padding:4px 6px; border-radius:6px; border:1px solid #bbf7d0;">"${worker.available_status_text}"</div>`
              : ''
          }

          <div style="margin-top:6px; display:flex; align-items:center; justify-content:space-between; font-size:11px; color:#64748b;">
            <span>📍 ${isLoggedIn ? (worker.location || 'Nearby') : `${(worker.location || 'Nearby').split(',')[0]} ••••••`}</span>
            ${dist !== Infinity ? `<span style="font-weight:bold; color:#059669;">${formatDistance(dist, language)}</span>` : ''}
          </div>

          ${
            isLoggedIn
              ? `
            <div style="margin-top:10px; display:flex; gap:6px; border-top:1px solid #e2e8f0; padding-top:8px;">
              ${
                cleanPhone
                  ? `
                <a href="tel:${cleanPhone}" style="flex:1; text-align:center; background:#0f172a; color:white; padding:6px; border-radius:8px; font-size:11px; font-weight:bold; text-decoration:none; display:inline-block;">
                  📞 ${language === 'hi' ? 'कॉल' : 'Call'}
                </a>
                <a href="https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                      language === 'hi'
                        ? `नमस्ते ${worker.full_name}, मैंने आवश्यकता है के लाइव मैप पर आपकी लोकेशन देखी। क्या आप काम के लिए उपलब्ध हैं?`
                        : `Hello ${worker.full_name}, I saw your location on the Avashyakta Hai live map. Are you available for work?`
                    )}" target="_blank" rel="noopener noreferrer" style="flex:1; text-align:center; background:#10b981; color:white; padding:6px; border-radius:8px; font-size:11px; font-weight:bold; text-decoration:none; display:inline-block;">
                  💬 WhatsApp
                </a>
              `
                  : ''
              }
            </div>

            ${
              userLocation
                ? `
              <button id="route-btn-${worker.id}" style="width:100%; margin-top:6px; background:#ecfdf5; border:1px solid #6ee7b7; color:#047857; padding:4px; border-radius:6px; font-size:10px; font-weight:bold; cursor:pointer;">
                🚗 ${language === 'hi' ? 'सड़क मार्ग व ETA देखें' : 'Get Road Route & ETA'}
              </button>
            `
                : ''
            }
          `
              : `
            <div style="margin-top:10px; border-top:1px solid #e2e8f0; padding-top:8px;">
              <button id="auth-btn-${worker.id}" style="width:100%; background:#047857; color:white; padding:7px; border:none; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer;">
                🔒 ${language === 'hi' ? 'रास्ता व संपर्क देखने हेतु लॉगिन करें' : 'Sign in to Contact & Navigate'}
              </button>
            </div>
          `
          }
        </div>
      `;

      marker.bindPopup(popupHtml);

      // Bind Route & Auth Button clicks inside popup
      marker.on('popupopen', () => {
        if (!isLoggedIn) {
          const authBtn = document.getElementById(`auth-btn-${worker.id}`);
          if (authBtn) {
            authBtn.onclick = () => navigate('/signin');
          }
          return;
        }

        const btn = document.getElementById(`route-btn-${worker.id}`);
        if (btn && userLocation) {
          btn.onclick = () => {
            fetchRoadRoute(
              userLocation.latitude,
              userLocation.longitude,
              coords.latitude,
              coords.longitude,
              worker.full_name
            );
          };
        }
      });

      marker.on('click', () => {
        if (onWorkerClick) onWorkerClick(worker);
      });
    });

    // C. Render Jobs (Briefcase Pins)
    jobs.forEach((job) => {
      const coords = resolveCoordinates(job);
      if (!coords) return;

      const jobLatLng: [number, number] = [coords.latitude, coords.longitude];
      bounds.push(jobLatLng);

      const jobIcon = L.divIcon({
        className: 'job-pin-marker',
        html: `
          <div style="width:32px; height:32px; border-radius:10px; background:#047857; border:2px solid white; display:flex; align-items:center; justify-content:center; color:white; box-shadow:0 3px 8px rgba(0,0,0,0.25); cursor:pointer;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const dist = userLocation
        ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, coords.latitude, coords.longitude)
        : Infinity;

      const marker = L.marker(jobLatLng, { icon: jobIcon }).addTo(layer);
      marker.bindPopup(`
        <div style="min-width:210px; font-family:inherit; padding:4px;">
          <div style="font-weight:bold; font-size:13px; color:#0f172a;">${job.title}</div>
          <div style="font-size:11px; font-weight:600; color:#059669; margin-top:2px;">${job.category} • ₹${job.wage}/${job.wage_type || 'day'}</div>
          <div style="font-size:11px; color:#64748b; margin-top:4px;">📍 ${
            isLoggedIn
              ? job.location || 'Location'
              : `${(job.location || 'कार्यस्थल').split(',')[0]} ••••••`
          } ${dist !== Infinity ? `(${formatDistance(dist, language)})` : ''}</div>
          
          ${
            isLoggedIn
              ? `
            <div style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
              <a href="${getDirectionsUrl(job)}" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; justify-content:center; gap:4px; background:#059669; color:white; padding:6px 8px; border-radius:6px; font-size:11px; font-weight:bold; text-decoration:none;">
                🗺️ ${language === 'hi' ? 'रास्ता देखें (Google Maps)' : 'Directions'}
              </a>
              <a href="/jobs/${job.id}" style="display:block; text-align:center; background:#0f172a; color:white; padding:5px 8px; border-radius:6px; font-size:11px; font-weight:bold; text-decoration:none;">
                ${language === 'hi' ? 'नौकरी विवरण देखें' : 'View Job Details'}
              </a>
            </div>
          `
              : `
            <div style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
              <button id="job-auth-btn-${job.id}" style="width:100%; background:#059669; color:white; padding:6px; border:none; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
                🔒 ${language === 'hi' ? 'रास्ता देखने हेतु लॉगिन करें' : 'Sign in for Directions'}
              </button>
              <a href="/jobs/${job.id}" style="display:block; text-align:center; background:#0f172a; color:white; padding:5px 8px; border-radius:6px; font-size:11px; font-weight:bold; text-decoration:none;">
                ${language === 'hi' ? 'नौकरी विवरण देखें' : 'View Job Details'}
              </a>
            </div>
          `
          }
        </div>
      `);

      marker.on('popupopen', () => {
        if (!isLoggedIn) {
          const authBtn = document.getElementById(`job-auth-btn-${job.id}`);
          if (authBtn) {
            authBtn.onclick = () => navigate('/signin');
          }
        }
      });

      marker.on('click', () => {
        if (onJobClick) onJobClick(job);
      });
    });

    // Fit map bounds to encompass pins
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      } else {
        map.fitBounds(bounds as any, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [workers, jobs, userLocation, radiusKm, liveWorkerPositions, language, isLoggedIn]);

  // 4. Fetch Real Road Route & Polyline via OSRM (100% Free Open Source Routing)
  const fetchRoadRoute = async (
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    targetName: string
  ) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setLoadingRoute(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        // Remove old route polyline
        if (routeLayerRef.current) {
          routeLayerRef.current.remove();
        }

        // Draw fresh animated route line
        routeLayerRef.current = L.polyline(coordinates, {
          color: '#059669',
          weight: 5,
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(map);

        map.fitBounds(routeLayerRef.current.getBounds(), { padding: [60, 60] });

        const distKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMins = Math.round(route.duration / 60);

        setActiveRoute({
          distanceKm: distKm,
          durationMinutes: durationMins,
          targetName,
        });
      }
    } catch (err) {
      console.warn('Failed to calculate road route:', err);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleClearRoute = () => {
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    setActiveRoute(null);
  };

  // IF NOT LOGGED IN: Render Locked Auth-Gated Screen (Do not show live map to unauthenticated users)
  if (!isLoggedIn) {
    return (
      <div
        style={{ minHeight: height }}
        className="relative overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-800 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white flex flex-col items-center justify-center p-6 sm:p-10 text-center shadow-xl animate-fade-in"
      >
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Glowing Lock Icon */}
        <div className="relative mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-2xl shadow-emerald-500/40">
          <Lock size={32} className="sm:size-9" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        </div>

        <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
          {language === 'hi'
            ? '🔒 लाइव GPS मैप देखने के लिए लॉगिन करें'
            : '🔒 Sign In to Access Live GPS Map'}
        </h3>

        <p className="mt-2 text-xs sm:text-sm text-stone-300 max-w-md leading-relaxed">
          {language === 'hi'
            ? 'सुरक्षा व प्राइवेसी कारणों से लाइव मैप, उपलब्ध कारीगरों और कार्यस्थलों की सटीक रियल-टाइम लोकेशन केवल पंजीकृत यूज़र्स के लिए उपलब्ध है।'
            : 'For safety & privacy, real-time live map tracking of available workers and job locations is only available to registered users.'}
        </p>

        {/* Feature Badges */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs font-semibold text-emerald-300">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 px-3 py-1">
            📍 {language === 'hi' ? 'लाइव GPS ट्रैकिंग' : 'Real-time GPS'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 px-3 py-1">
            🚗 {language === 'hi' ? 'टर्न-बाय-टर्न सड़क मार्ग' : 'Turn-by-turn Navigation'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 px-3 py-1">
            💬 {language === 'hi' ? 'सीधा संपर्क व कॉल' : 'Direct Call & WhatsApp'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-xs">
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white py-3 px-5 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/40 transition cursor-pointer"
          >
            <Lock size={15} />
            <span>{language === 'hi' ? 'लॉगिन / साइन इन' : 'Sign In'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 hover:text-white py-3 px-5 text-xs sm:text-sm font-bold border border-stone-700 transition cursor-pointer"
          >
            <span>{language === 'hi' ? 'नया खाता बनाएं' : 'Sign Up Free'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-800 shadow-md">
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height, width: '100%', zIndex: 1 }} />

      {/* Floating Map Type Switcher Control (Street / Satellite / Hybrid) */}
      <div className="absolute top-3 right-3 z-10 flex items-center rounded-2xl border border-stone-200 dark:border-stone-700 bg-white/95 dark:bg-stone-900/95 p-1 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMapType('street')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
            mapType === 'street'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
          }`}
          title={language === 'hi' ? 'साधारण सड़क नक्शा (Street Map)' : 'Street Map'}
        >
          <MapIcon size={13} />
          <span>{language === 'hi' ? 'सड़क' : 'Street'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMapType('satellite')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
            mapType === 'satellite'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
          }`}
          title={language === 'hi' ? 'असली सैटेलाइट फोटो (Satellite View)' : 'Satellite Imagery'}
        >
          <Globe size={13} />
          <span>{language === 'hi' ? '🛰️ सैटेलाइट' : '🛰️ Satellite'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMapType('hybrid')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
            mapType === 'hybrid'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
          }`}
          title={language === 'hi' ? 'सैटेलाइट फोटो + सड़क व कॉलोनियों के नाम' : 'Satellite + Roads & Labels'}
        >
          <Layers size={13} />
          <span>{language === 'hi' ? 'हाइब्रिड' : 'Hybrid'}</span>
        </button>
      </div>

      {/* Floating Driving Route & ETA Card */}
      {activeRoute && (
        <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-xs z-10 rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-white/95 dark:bg-stone-900/95 p-3.5 shadow-xl backdrop-blur-md animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Route size={16} className="text-emerald-600" />
              <span>{language === 'hi' ? 'सड़क मार्ग (Driving Route)' : 'Driving Route'}</span>
            </div>
            <button
              onClick={handleClearRoute}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X size={15} />
            </button>
          </div>

          <div className="mt-2 text-xs text-stone-700 dark:text-stone-300">
            <span className="font-bold">{activeRoute.targetName}</span>
          </div>

          <div className="mt-2 flex items-center gap-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
            <div>
              <span className="text-[10px] text-stone-400 block uppercase">
                {language === 'hi' ? 'सड़क दूरी' : 'Distance'}
              </span>
              <span className="font-extrabold text-stone-900 dark:text-stone-100">
                {activeRoute.distanceKm} km
              </span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block uppercase">
                {language === 'hi' ? 'अनुमानित समय' : 'Estimated Time'}
              </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                ~{activeRoute.durationMinutes} mins
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2 rounded-xl bg-white/90 dark:bg-stone-900/90 px-3 py-1.5 text-[11px] font-bold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 shadow-sm backdrop-blur-xs">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          <span>{language === 'hi' ? 'लाइव कारीगर' : 'Live Worker'}</span>
        </span>
        <span className="text-stone-300">•</span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-500"></span>
          <span>{language === 'hi' ? 'आपकी लोकेशन' : 'You'}</span>
        </span>
        {jobs.length > 0 && (
          <>
            <span className="text-stone-300">•</span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-700"></span>
              <span>{language === 'hi' ? 'नौकरी' : 'Job'}</span>
            </span>
          </>
        )}
      </div>

      {loadingRoute && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-xs">
          <div className="flex items-center gap-2 rounded-2xl bg-white dark:bg-stone-900 px-4 py-2 text-xs font-bold text-stone-900 dark:text-stone-100 shadow-xl border border-stone-200 dark:border-stone-800">
            <Loader2 size={16} className="animate-spin text-emerald-600" />
            <span>{language === 'hi' ? 'रास्ता खोज रहे हैं...' : 'Calculating driving route...'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
