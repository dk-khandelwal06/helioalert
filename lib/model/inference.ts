/**
 * HelioAlert - Server-Side Machine Learning Inference Engine
 * Zero-dependency TypeScript implementation reproducing Scikit-Learn LogisticRegression
 * with StandardScaler and logistic sigmoid transformation.
 */

import model3h from './data/model_3h.json';
import model6h from './data/model_6h.json';
import model12h from './data/model_12h.json';
import model24h from './data/model_24h.json';

export interface ModelArtifact {
  model_name: string;
  version: string;
  horizon_hours: number;
  algorithm: string;
  class_weight: string;
  optimal_threshold: number;
  features: string[];
  coefficients: number[];
  intercept: number;
  scaler: {
    mean: number[];
    scale: number[];
  };
  metrics_summary: {
    precision: number;
    recall: number;
    f1_score: number;
    pr_auc: number;
    roc_auc: number;
    tss: number;
  };
}

const MODELS: Record<string, ModelArtifact> = {
  '3h': model3h as ModelArtifact,
  '6h': model6h as ModelArtifact,
  '12h': model12h as ModelArtifact,
  '24h': model24h as ModelArtifact,
};

export interface TelemetryInput {
  flow_speed: number;
  speed_mean_3h?: number;
  speed_mean_6h?: number;
  speed_std_6h?: number;
  proton_density: number;
  density_mean_3h?: number;
  density_mean_6h?: number;
  bz_gsm: number;
  bz_mean_3h?: number;
  bz_mean_6h?: number;
  bz_mean_12h?: number;
  bz_min_3h?: number;
  bz_min_6h?: number;
  bz_min_12h?: number;
  southward_hours_6h?: number;
  bt: number;
  pressure?: number;
  electric_field?: number;
  kp_recent: number;
}

export interface FeatureContribution {
  name: string;
  label: string;
  rawValue: number;
  scaledValue: number;
  weight: number;
  contribution: number; // weight * scaledValue
  impact: 'storm_driving' | 'quiet_stabilizing' | 'neutral';
}

export interface HorizonPrediction {
  horizonHours: number;
  horizonLabel: string;
  probability: number;
  probabilityPercent: number;
  threshold: number;
  isStormAlert: boolean;
  riskCategory: 'Quiet' | 'Guarded' | 'Elevated' | 'High Risk' | 'Severe Storm';
  riskColor: string;
  confidence: number;
  linearScore: number;
  contributions: FeatureContribution[];
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
    prAuc: number;
    rocAuc: number;
    tss: number;
  };
}

export function sigmoid(z: number): number {
  if (z > 20) return 1.0;
  if (z < -20) return 0.0;
  return 1.0 / (1.0 + Math.exp(-z));
}

export function classifyRisk(prob: number): {
  category: 'Quiet' | 'Guarded' | 'Elevated' | 'High Risk' | 'Severe Storm';
  color: string;
} {
  if (prob < 0.20) return { category: 'Quiet', color: '#38bdf8' };
  if (prob < 0.45) return { category: 'Guarded', color: '#facc15' };
  if (prob < 0.70) return { category: 'Elevated', color: '#fb923c' };
  if (prob < 0.85) return { category: 'High Risk', color: '#f87171' };
  return { category: 'Severe Storm', color: '#ef4444' };
}

export function predictHorizon(
  input: TelemetryInput,
  horizon: '3h' | '6h' | '12h' | '24h' = '3h',
  customThreshold?: number
): HorizonPrediction {
  const model = MODELS[horizon];
  if (!model) {
    throw new Error(`Unsupported model horizon: ${horizon}`);
  }

  // Complete missing rolling features with realistic defaults derived from current values
  const speed = input.flow_speed ?? 400.0;
  const density = input.proton_density ?? 5.0;
  const bz = input.bz_gsm ?? 0.0;
  const bt = input.bt ?? Math.max(5.0, Math.abs(bz));
  const kp = input.kp_recent ?? 2.0;

  // Physical calculations
  // Pressure P (nPa) = 1.67e-6 * Np * V^2
  const computedPressure = input.pressure ?? (1.67e-6 * density * speed * speed);
  // Electric field Ey (mV/m) = -V * Bz * 1e-3
  const computedEy = input.electric_field ?? (-speed * bz * 1e-3);

  const featureMap: Record<string, number> = {
    flow_speed: speed,
    speed_mean_3h: input.speed_mean_3h ?? speed,
    speed_mean_6h: input.speed_mean_6h ?? speed,
    speed_std_6h: input.speed_std_6h ?? 8.0,
    proton_density: density,
    density_mean_3h: input.density_mean_3h ?? density,
    density_mean_6h: input.density_mean_6h ?? density,
    bz_gsm: bz,
    bz_mean_3h: input.bz_mean_3h ?? bz,
    bz_mean_6h: input.bz_mean_6h ?? bz,
    bz_mean_12h: input.bz_mean_12h ?? bz,
    bz_min_3h: input.bz_min_3h ?? Math.min(bz, -1.0),
    bz_min_6h: input.bz_min_6h ?? Math.min(bz, -2.0),
    bz_min_12h: input.bz_min_12h ?? Math.min(bz, -3.0),
    southward_hours_6h: input.southward_hours_6h ?? (bz < 0 ? 4 : 1),
    bt: bt,
    pressure: computedPressure,
    electric_field: computedEy,
    kp_recent: kp,
  };

  const featureLabels: Record<string, string> = {
    flow_speed: 'Solar Wind Speed',
    speed_mean_3h: 'Speed (3h Mean)',
    speed_mean_6h: 'Speed (6h Mean)',
    speed_std_6h: 'Speed Variance (6h)',
    proton_density: 'Proton Density',
    density_mean_3h: 'Density (3h Mean)',
    density_mean_6h: 'Density (6h Mean)',
    bz_gsm: 'IMF Bz (Current)',
    bz_mean_3h: 'IMF Bz (3h Mean)',
    bz_mean_6h: 'IMF Bz (6h Mean)',
    bz_mean_12h: 'IMF Bz (12h Mean)',
    bz_min_3h: 'Deepest Southward Bz (3h)',
    bz_min_6h: 'Deepest Southward Bz (6h)',
    bz_min_12h: 'Deepest Southward Bz (12h)',
    southward_hours_6h: 'Southward Bz Duration (6h)',
    bt: 'Total Field Magnitude |B|',
    pressure: 'Dynamic Solar Wind Pressure',
    electric_field: 'Interplanetary Electric Field Ey',
    kp_recent: 'Recent Planetary Kp Index',
  };

  let z = model.intercept;
  const contributions: FeatureContribution[] = [];

  for (let i = 0; i < model.features.length; i++) {
    const featName = model.features[i];
    const rawVal = featureMap[featName] ?? 0.0;
    const mean = model.scaler.mean[i];
    const scale = model.scaler.scale[i];
    const weight = model.coefficients[i];

    const scaledVal = (rawVal - mean) / (scale === 0 ? 1 : scale);
    const contribution = weight * scaledVal;
    z += contribution;

    contributions.push({
      name: featName,
      label: featureLabels[featName] || featName,
      rawValue: Math.round(rawVal * 100) / 100,
      scaledValue: Math.round(scaledVal * 100) / 100,
      weight: Math.round(weight * 1000) / 1000,
      contribution: Math.round(contribution * 1000) / 1000,
      impact: contribution > 0.1 ? 'storm_driving' : contribution < -0.1 ? 'quiet_stabilizing' : 'neutral'
    });
  }

  // Sort contributions by absolute impact
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const probability = sigmoid(z);
  const threshold = customThreshold !== undefined ? customThreshold : model.optimal_threshold;
  const isStormAlert = probability >= threshold;
  const { category, color } = classifyRisk(probability);

  // Confidence based on distance from decision boundary
  const confidence = Math.min(1.0, Math.abs(probability - 0.5) * 2);

  return {
    horizonHours: model.horizon_hours,
    horizonLabel: `${model.horizon_hours} Hours`,
    probability: Math.round(probability * 10000) / 10000,
    probabilityPercent: Math.round(probability * 1000) / 10,
    threshold,
    isStormAlert,
    riskCategory: category,
    riskColor: color,
    confidence: Math.round(confidence * 100),
    linearScore: Math.round(z * 100) / 100,
    contributions,
    metrics: {
      precision: model.metrics_summary.precision,
      recall: model.metrics_summary.recall,
      f1Score: model.metrics_summary.f1_score,
      prAuc: model.metrics_summary.pr_auc,
      rocAuc: model.metrics_summary.roc_auc,
      tss: model.metrics_summary.tss
    }
  };
}

export function predictAllHorizons(
  input: TelemetryInput,
  customThreshold?: number
): Record<string, HorizonPrediction> {
  return {
    '3h': predictHorizon(input, '3h', customThreshold),
    '6h': predictHorizon(input, '6h', customThreshold),
    '12h': predictHorizon(input, '12h', customThreshold),
    '24h': predictHorizon(input, '24h', customThreshold),
  };
}

