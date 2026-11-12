import { NextResponse } from 'next/server';
import model3h from '@/lib/model/data/model_3h.json';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    model: {
      name: model3h.model_name,
      version: model3h.version,
      algorithm: model3h.algorithm,
      class_weight: model3h.class_weight,
      feature_count: model3h.features.length,
      supported_horizons: ['3h', '6h', '12h', '24h'],
      target_threshold: 'Kp >= 5.0 (NOAA G1 Minor Storm)',
      training_period: '2018 - 2021',
      validation_period: '2022 - 2023',
      test_period: '2024 (Held-out benchmark)',
      data_source: 'NASA SPDF OMNI2 Hourly High-Precision Telemetry',
      operational_status: 'ONLINE_CALIBRATED'
    }
  });
}

