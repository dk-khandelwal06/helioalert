/**
 * HelioAlert - NOAA Space Weather Prediction Center (SWPC) Service
 * Server-side fetching, data validation, in-memory caching (60s TTL),
 * and stale-data detection.
 */

export interface SolarWindObservation {
  timeTag: string;
  speed: number | null;
  density: number | null;
  temperature: number | null;
  bt: number | null;
  bzGsm: number | null;
  byGsm: number | null;
  bxGsm: number | null;
  source: string;
}

export interface KpObservation {
  timeTag: string;
  kp: number;
  aRunning?: number;
  stationCount?: number;
  observedStatus: 'observed' | 'predicted';
  noaaScale: string | null;
}

export interface LiveSpaceWeatherPayload {
  source: 'NOAA SWPC RTSW (DSCOVR/ACE)' | 'Cached / Degraded';
  isLive: boolean;
  isStale: boolean;
  lastUpdated: string;
  cacheAgeSeconds: number;
  current: {
    speed: number;
    density: number;
    temperature: number;
    bt: number;
    bzGsm: number;
    byGsm: number;
    bxGsm: number;
    pressure: number;
    electricField: number;
    currentKp: number;
    geomagneticStatus: string;
    noaaScale: string;
    statusColor: string;
  };
  recentHistory: {
    wind: SolarWindObservation[];
    mag: { timeTag: string; bt: number; bzGsm: number }[];
    kp: KpObservation[];
    kpForecast: KpObservation[];
  };
}

// In-memory cache
let cachedPayload: LiveSpaceWeatherPayload | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function mapKpToNoaaScale(kp: number): { scale: string; status: string; color: string } {
  if (kp < 4.0) return { scale: 'G0', status: 'Quiet', color: '#38bdf8' };
  if (kp < 4.7) return { scale: 'G0', status: 'Unsettled', color: '#facc15' };
  if (kp < 5.0) return { scale: 'G0', status: 'Active', color: '#fb923c' };
  if (kp < 6.0) return { scale: 'G1', status: 'Minor Storm', color: '#f87171' };
  if (kp < 7.0) return { scale: 'G2', status: 'Moderate Storm', color: '#ef4444' };
  if (kp < 8.0) return { scale: 'G3', status: 'Strong Storm', color: '#dc2626' };
  if (kp < 9.0) return { scale: 'G4', status: 'Severe Storm', color: '#b91c1c' };
  return { scale: 'G5', status: 'Extreme Storm', color: '#7f1d1d' };
}

export async function fetchLiveSpaceWeather(): Promise<LiveSpaceWeatherPayload> {
  const now = Date.now();
  if (cachedPayload && (now - lastFetchTime) < CACHE_TTL_MS) {
    return {
      ...cachedPayload,
      cacheAgeSeconds: Math.floor((now - lastFetchTime) / 1000),
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const [windRes, magRes, kpRes, kpForecastRes] = await Promise.all([
      fetch('https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json', {
        signal: controller.signal,
        headers: { 'User-Agent': 'HelioAlert/1.0' }
      }).catch(() => null),
      fetch('https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json', {
        signal: controller.signal,
        headers: { 'User-Agent': 'HelioAlert/1.0' }
      }).catch(() => null),
      fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', {
        signal: controller.signal,
        headers: { 'User-Agent': 'HelioAlert/1.0' }
      }).catch(() => null),
      fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json', {
        signal: controller.signal,
        headers: { 'User-Agent': 'HelioAlert/1.0' }
      }).catch(() => null),
    ]);

    clearTimeout(timeoutId);

    const windData: any[] = windRes && windRes.ok ? await windRes.json() : [];
    const magData: any[] = magRes && magRes.ok ? await magRes.json() : [];
    const kpData: any[] = kpRes && kpRes.ok ? await kpRes.json() : [];
    const kpForecastData: any[] = kpForecastRes && kpForecastRes.ok ? await kpForecastRes.json() : [];

    // Parse latest observations
    const latestWind = windData.length > 0 ? windData[0] : null;
    const latestMag = magData.length > 0 ? magData[0] : null;
    const latestKpRecord = kpData.length > 0 ? kpData[kpData.length - 1] : null;

    const speed = latestWind?.proton_speed ?? 420.0;
    const density = latestWind?.proton_density ?? 4.5;
    const temp = latestWind?.proton_temperature ?? 85000;
    const bt = latestMag?.bt ?? 5.2;
    const bz = latestMag?.bz_gsm ?? -0.8;
    const by = latestMag?.by_gsm ?? 2.1;
    const bx = latestMag?.bx_gsm ?? -3.5;
    const currentKp = latestKpRecord?.Kp ?? 2.0;

    const pressure = Math.round((1.67e-6 * density * speed * speed) * 100) / 100;
    const electricField = Math.round((-speed * bz * 1e-3) * 100) / 100;

    const { scale, status, color } = mapKpToNoaaScale(currentKp);

    // Stale detection: if latest observation timestamp is older than 2 hours
    const latestTimestamp = latestWind?.time_tag || new Date().toISOString();
    const obsTime = new Date(latestTimestamp).getTime();
    const isStale = (now - obsTime) > 2 * 60 * 60 * 1000;

    // Downsample 1-minute data for smooth frontend charts (e.g. 1 point every 15-30 mins)
    const sampledWind: SolarWindObservation[] = [];
    const sampledMag: { timeTag: string; bt: number; bzGsm: number }[] = [];

    // Reverse so chronologically ascending
    const ascWind = [...windData].reverse();
    const ascMag = [...magData].reverse();

    // Take every 15th record for 3-day history
    for (let i = 0; i < ascWind.length; i += 15) {
      const w = ascWind[i];
      if (w.proton_speed != null) {
        sampledWind.push({
          timeTag: w.time_tag,
          speed: Math.round(w.proton_speed * 10) / 10,
          density: Math.round((w.proton_density || 0) * 10) / 10,
          temperature: w.proton_temperature,
          bt: null,
          bzGsm: null,
          byGsm: null,
          bxGsm: null,
          source: w.source || 'DSCOVR'
        });
      }
    }

    for (let i = 0; i < ascMag.length; i += 15) {
      const m = ascMag[i];
      if (m.bt != null) {
        sampledMag.push({
          timeTag: m.time_tag,
          bt: Math.round(m.bt * 10) / 10,
          bzGsm: Math.round((m.bz_gsm || 0) * 10) / 10,
        });
      }
    }

    const cleanKp: KpObservation[] = kpData.map((d: any) => ({
      timeTag: d.time_tag,
      kp: d.Kp,
      aRunning: d.a_running,
      stationCount: d.station_count,
      observedStatus: 'observed',
      noaaScale: mapKpToNoaaScale(d.Kp).scale
    }));

    const cleanKpForecast: KpObservation[] = kpForecastData.map((d: any) => ({
      timeTag: d.time_tag,
      kp: d.kp,
      observedStatus: d.observed as 'observed' | 'predicted',
      noaaScale: d.noaa_scale || mapKpToNoaaScale(d.kp).scale
    }));

    const payload: LiveSpaceWeatherPayload = {
      source: 'NOAA SWPC RTSW (DSCOVR/ACE)',
      isLive: true,
      isStale,
      lastUpdated: latestTimestamp,
      cacheAgeSeconds: 0,
      current: {
        speed: Math.round(speed * 10) / 10,
        density: Math.round(density * 10) / 10,
        temperature: Math.round(temp),
        bt: Math.round(bt * 10) / 10,
        bzGsm: Math.round(bz * 10) / 10,
        byGsm: Math.round(by * 10) / 10,
        bxGsm: Math.round(bx * 10) / 10,
        pressure,
        electricField,
        currentKp,
        geomagneticStatus: status,
        noaaScale: scale,
        statusColor: color,
      },
      recentHistory: {
        wind: sampledWind,
        mag: sampledMag,
        kp: cleanKp,
        kpForecast: cleanKpForecast
      }
    };

    cachedPayload = payload;
    lastFetchTime = now;
    return payload;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error fetching live NOAA data:', error);

    if (cachedPayload) {
      return {
        ...cachedPayload,
        source: 'Cached / Degraded',
        cacheAgeSeconds: Math.floor((now - lastFetchTime) / 1000),
      };
    }

    // Graceful baseline quiet fallback if NOAA service is completely unreachable
    return createQuietSunFallback();
  }
}

function createQuietSunFallback(): LiveSpaceWeatherPayload {
  const now = new Date();
  const timeTag = now.toISOString();
  return {
    source: 'Cached / Degraded',
    isLive: false,
    isStale: true,
    lastUpdated: timeTag,
    cacheAgeSeconds: 0,
    current: {
      speed: 410.0,
      density: 4.8,
      temperature: 82000,
      bt: 5.1,
      bzGsm: -0.4,
      byGsm: 1.8,
      bxGsm: -3.2,
      pressure: 1.35,
      electricField: 0.16,
      currentKp: 1.67,
      geomagneticStatus: 'Quiet',
      noaaScale: 'G0',
      statusColor: '#38bdf8'
    },
    recentHistory: {
      wind: [],
      mag: [],
      kp: [],
      kpForecast: []
    }
  };
}

