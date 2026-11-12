import { NextResponse } from 'next/server';
import { fetchLiveSpaceWeather } from '@/lib/api/noaaService';
import { predictAllHorizons } from '@/lib/model/inference';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    const liveData = await fetchLiveSpaceWeather();
    
    // Run ML inference on latest telemetry
    const predictions = predictAllHorizons({
      flow_speed: liveData.current.speed,
      proton_density: liveData.current.density,
      bz_gsm: liveData.current.bzGsm,
      bt: liveData.current.bt,
      pressure: liveData.current.pressure,
      electric_field: liveData.current.electricField,
      kp_recent: liveData.current.currentKp,
    });

    return NextResponse.json({
      status: 'success',
      data: {
        ...liveData,
        predictions,
      }
    });
  } catch (error: any) {
    console.error('API /api/space-weather/live failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to retrieve live space weather data', error: error?.message },
      { status: 500 }
    );
  }
}

