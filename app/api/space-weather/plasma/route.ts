import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveSpaceWeather } from '@/lib/api/noaaService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '24h'; // 6h, 12h, 24h, 3d, 7d
    
    const liveData = await fetchLiveSpaceWeather();
    const wind = liveData.recentHistory.wind;
    
    // Filter by time window
    const now = Date.now();
    let hours = 24;
    if (range === '6h') hours = 6;
    else if (range === '12h') hours = 12;
    else if (range === '24h') hours = 24;
    else if (range === '3d') hours = 72;
    else if (range === '7d') hours = 168;

    const cutoff = now - (hours * 3600 * 1000);
    const filtered = wind.filter(w => new Date(w.timeTag).getTime() >= cutoff);

    return NextResponse.json({
      status: 'success',
      range,
      count: filtered.length,
      current: {
        speed: liveData.current.speed,
        density: liveData.current.density,
        temperature: liveData.current.temperature,
      },
      data: filtered
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error?.message }, { status: 500 });
  }
}

