'use client';

import React, { useEffect, useState } from 'react';
import { RiskGauge } from '@/components/dashboard/RiskGauge';
import {
  ShieldAlert,
  Sliders,
  Clock,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Info,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function RiskCentrePage() {
  const [data, setData] = useState<any>(null);
  const [horizon, setHorizon] = useState<'3h' | '6h' | '12h' | '24h'>('3h');
  const [threshold, setThreshold] = useState<number>(0.90);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRisk = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/forecast?horizon=${horizon}&threshold=${threshold}`);
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRisk();
  }, [horizon, threshold]);

  const prediction = data?.prediction;
  const current = data?.telemetry || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-solar-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-solar-400">
              OPERATIONAL RISK ENGINE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Geomagnetic Storm Risk Centre
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Calibrated probabilistic estimation for Kp ≥ 5.0 (NOAA G1 Minor Storm) with interactive decision threshold tuning.
          </p>
        </div>

        {/* Horizon Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-1 rounded-lg border border-border bg-surface text-xs font-mono">
            {(['3h', '6h', '12h', '24h'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  horizon === h
                    ? 'bg-solar-500/20 text-solar-400 border border-solar-500/40 font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                +{h.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={fetchRisk}
            disabled={refreshing}
            className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Refresh Analysis"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-solar-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Analysis Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Semicircular Gauge & Alert Status */}
        <div className="lg:col-span-5 space-y-5">
          <div className="scientific-card p-5">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-mono font-semibold text-muted-foreground">
                HORIZON: {horizon.toUpperCase()} LEAD-TIME
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-foreground">
                Model: LR-v1.0
              </span>
            </div>

            {prediction ? (
              <RiskGauge
                probability={prediction.probability}
                threshold={threshold}
                horizonLabel={`Next ${horizon.replace('h', '')} Hours`}
                category={prediction.riskCategory}
                color={prediction.riskColor}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
                Loading model output...
              </div>
            )}

            <div className="mt-4 p-3 rounded-lg border border-border bg-surface/50 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Target Storm Threshold:</span>
                <span className="font-mono font-bold text-foreground">Planetary Kp ≥ 5.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Decision Threshold:</span>
                <span className="font-mono font-bold text-solar-400">{Math.round(threshold * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Calculated Linear Log-Odds (z):</span>
                <span className="font-mono text-foreground">{prediction?.linearScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Model Output Classification:</span>
                <strong style={{ color: prediction?.riskColor }}>{prediction?.riskCategory}</strong>
              </div>
            </div>
          </div>

          {/* Interactive Threshold Tuning Slider */}
          <div className="scientific-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Sliders className="w-4 h-4 text-solar-400" />
                <span>Adjust Alert Interpretation Threshold</span>
              </div>
              <span className="text-xs font-mono font-bold text-solar-400">
                {Math.round(threshold * 100)}%
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Tuning this threshold changes the trade-off between early detection (Recall) and false alarm mitigation (Precision).
            </p>

            <input
              type="range"
              min="0.10"
              max="0.95"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-solar-500 cursor-pointer"
            />

            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <span>0.10 (Aggressive Warning)</span>
              <span>0.50 (Default)</span>
              <span>0.90 (High Specificity)</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-center font-mono">
              <div className="p-2 rounded bg-surface border border-border">
                <div className="text-[10px] text-muted-foreground">Test Precision</div>
                <div className="text-sm font-bold text-foreground">
                  {(prediction?.metrics?.precision * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <div className="text-[10px] text-muted-foreground">Test Recall</div>
                <div className="text-sm font-bold text-emerald-400">
                  {(prediction?.metrics?.recall * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <div className="text-[10px] text-muted-foreground">Skill (TSS)</div>
                <div className="text-sm font-bold text-sky-400">
                  +{prediction?.metrics?.tss.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Physical Feature Contributions */}
        <div className="lg:col-span-7 space-y-5">
          <div className="scientific-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-solar-400" />
                <h3 className="font-bold text-base text-foreground">Physical Feature Contribution Breakdown</h3>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Ordered by Absolute Impact
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Mathematical decomposition of the model linear predictor <em>z</em> = <strong>w</strong> &middot; <strong>x</strong> + <em>b</em>. Red bars drive the score toward storm threshold; blue bars stabilize the score toward quiet conditions.
            </p>

            <div className="space-y-2.5 pt-2">
              {prediction?.contributions?.map((c: any) => {
                const absVal = Math.min(100, Math.abs(c.contribution) * 25);
                const isPositive = c.contribution > 0;
                return (
                  <div key={c.name} className="p-2.5 rounded-lg border border-border bg-surface/70 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isPositive ? 'bg-red-400' : 'bg-sky-400'}`} />
                        <span className="font-medium text-foreground">{c.label}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-muted-foreground">Raw: <strong>{c.rawValue}</strong></span>
                        <span className={isPositive ? 'text-red-400 font-bold' : 'text-sky-400 font-bold'}>
                          {isPositive ? `+${c.contribution}` : c.contribution}
                        </span>
                      </div>
                    </div>

                    {/* Impact Bar */}
                    <div className="w-full h-1.5 rounded-full bg-border/40 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPositive ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-sky-500 to-blue-500'
                        }`}
                        style={{ width: `${Math.max(5, absVal)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Guidance Notice */}
          <div className="p-4 rounded-lg border border-sky-500/30 bg-sky-500/5 text-xs text-muted-foreground leading-relaxed space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-semibold">
              <Info className="w-4 h-4 shrink-0" />
              <span>Operational Interpretation Protocol</span>
            </div>
            <p>
              HelioAlert separates pure statistical likelihood from binary alert triggers. A 35% probability during an interplanetary magnetic cloud passage represents elevated risk (~9x the baseline 4.15% storm frequency). Satellite operators and power dispatchers should review the duration of southward Bz before initiating operational safeguards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
