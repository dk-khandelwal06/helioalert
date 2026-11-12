import { NextResponse } from 'next/server';
import { fetchLiveSpaceWeather } from '@/lib/api/noaaService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const liveData = await fetchLiveSpaceWeather();
    
    return NextResponse.json({
      status: 'success',
      currentKp: liveData.current.currentKp,
      geomagneticStatus: liveData.current.geomagneticStatus,
      noaaScale: liveData.current.noaaScale,
      statusColor: liveData.current.statusColor,
      observed: liveData.recentHistory.kp,
      forecast: liveData.recentHistory.kpForecast
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error?.message }, { status: 500 });
  }
}

