import { NextResponse } from 'next/server';
import mayStorm from '@/lib/model/data/may2024_storm.json';
import { predictHorizon } from '@/lib/model/inference';

export async function GET() {
  try {
    // Augment historical replay data with retrospective model predictions
    const augmentedSteps = (mayStorm as any[]).map((step, idx) => {
      let retroProb = 0.05;
      try {
        if (step.speed && step.bz !== null) {
          const pred = predictHorizon({
            flow_speed: step.speed,
            proton_density: step.density || 8.0,
            bz_gsm: step.bz,
            bt: step.bt || Math.abs(step.bz) + 2,
            pressure: step.pressure,
            kp_recent: step.kp || 2.0
          }, '3h');
          retroProb = pred.probability;
        }
      } catch (e) {
        retroProb = 0.05;
      }

      return {
        ...step,
        retro_prob_3h: retroProb,
        retro_storm_alert: retroProb >= 0.70
      };
    });

    return NextResponse.json({
      status: 'success',
      event: {
        id: 'may_2024_storm',
        name: 'Historic May 10–12, 2024 G5 Geomagnetic Storm',
        noaa_scale: 'G5 - Extreme',
        peak_kp: 9.0,
        min_dst: -406,
        description: 'Multiple halo CMEs originating from giant solar active region AR3664 produced the most intense geomagnetic storm since October 2003, with solar wind speeds exceeding 1,000 km/s and southward IMF Bz dropping below -35 nT.'
      },
      count: augmentedSteps.length,
      data: augmentedSteps
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error?.message }, { status: 500 });
  }
}

