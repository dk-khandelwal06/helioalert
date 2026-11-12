import { NextResponse } from 'next/server';
import evaluationMetrics from '@/lib/model/data/evaluation_metrics.json';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    metrics: evaluationMetrics
  });
}

