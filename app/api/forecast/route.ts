import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveSpaceWeather } from '@/lib/api/noaaService';
import { predictHorizon, predictAllHorizons, TelemetryInput } from '@/lib/model/inference';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const horizon = searchParams.get('horizon') as '3h' | '6h' | '12h' | '24h' | null;
    const thresholdParam = searchParams.get('threshold');
    const customThreshold = thresholdParam ? parseFloat(thresholdParam) : undefined;

    // Check if custom telemetry was provided in query params
    const customSpeed = searchParams.get('speed');
    const customBz = searchParams.get('bz');
    const customDensity = searchParams.get('density');
    const customBt = searchParams.get('bt');
    const customKp = searchParams.get('kp');

    let input: TelemetryInput;

    if (customSpeed || customBz) {
      input = {
        flow_speed: customSpeed ? parseFloat(customSpeed) : 420.0,
        bz_gsm: customBz ? parseFloat(customBz) : -1.0,
        proton_density: customDensity ? parseFloat(customDensity) : 5.0,
        bt: customBt ? parseFloat(customBt) : 6.0,
        kp_recent: customKp ? parseFloat(customKp) : 2.0,
      };
    } else {
      const live = await fetchLiveSpaceWeather();
      input = {
        flow_speed: live.current.speed,
        proton_density: live.current.density,
        bz_gsm: live.current.bzGsm,
        bt: live.current.bt,
        pressure: live.current.pressure,
        electric_field: live.current.electricField,
        kp_recent: live.current.currentKp,
      };
    }

    if (horizon && ['3h', '6h', '12h', '24h'].includes(horizon)) {
      const prediction = predictHorizon(input, horizon, customThreshold);
      return NextResponse.json({
        status: 'success',
        telemetry: input,
        prediction
      });
    }

    const predictions = predictAllHorizons(input, customThreshold);
    return NextResponse.json({
      status: 'success',
      telemetry: input,
      predictions
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error?.message }, { status: 500 });
  }
}

