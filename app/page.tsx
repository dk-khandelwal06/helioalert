'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RiskGauge } from '@/components/dashboard/RiskGauge';
import { TelemetryCards } from '@/components/dashboard/TelemetryCards';
import { InteractiveMagnetosphere } from '@/components/space/InteractiveMagnetosphere';
import {
  Activity,
  Radio,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  Compass
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/space-weather/live');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      setData(json.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load live telemetry:', err);
      setError(err?.message || 'Failed to connect to NOAA SWPC feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-solar-500/20 border-t-solar-500 animate-spin" />
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-foreground font-mono">CONNECTING TO NOAA RTSW SATELLITES</div>
          <div className="text-xs text-muted-foreground mt-1">Acquiring DSCOVR, ACE and Planetary K-Index Telemetry...</div>
        </div>
      </div>
    );
  }

  const current = data?.current || {};
  const pred3h = data?.predictions?.['3h'];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Situational Awareness */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-wide bg-solar-500/15 text-solar-400 border border-solar-500/30">
              MISSION CONTROL
            </span>
            <span className="text-xs text-muted-foreground">
              Source: <strong className="text-foreground">{data?.source || 'NOAA SWPC RTSW'}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Real-Time Space-Weather Early Warning
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
            Continuous probabilistic forecast for geomagnetic storm onset (Kp ≥ 5.0 / NOAA G1) over the next 3 to 24 hours.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${data?.isLive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <span className="text-muted-foreground">Feed:</span>
            <strong className={data?.isLive ? 'text-emerald-400' : 'text-amber-400'}>
              {data?.isLive ? 'LIVE' : 'CACHED'}
            </strong>
          </div>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-xs font-medium text-foreground transition-colors disabled:opacity-50"
            title="Reload live NOAA telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-solar-400' : ''}`} />
            <span>{refreshing ? 'Updating...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Error alert if feed failed */}
      {error && (
        <div className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Live NOAA feed temporarily degraded: {error}. Displaying calibrated fallback baseline.</span>
          </div>
          <button onClick={fetchData} className="underline text-red-400 hover:text-red-200">Retry</button>
        </div>
      )}

      {/* 2. Primary Telemetry Metric Grid */}
      <TelemetryCards
        speed={current.speed || 400}
        density={current.density || 4.5}
        bzGsm={current.bzGsm || 0.0}
        bt={current.bt || 5.0}
        currentKp={current.currentKp || 1.67}
        pressure={current.pressure || 1.35}
        geomagneticStatus={current.geomagneticStatus || 'Quiet'}
        noaaScale={current.noaaScale || 'G0'}
        statusColor={current.statusColor || '#38bdf8'}
      />

      {/* 3. Central Analysis Grid: 3h Risk Gauge vs Multi-Horizon Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Semicircular Probability Gauge */}
        <div className="lg:col-span-5 scientific-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-solar-400" />
                <h3 className="font-bold text-sm text-foreground">3-Hour Storm Probability</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-muted-foreground">
                Model: LR-v1.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated likelihood of planetary Kp reaching 5 or higher in the next 3 hours.
            </p>
          </div>

          <div className="my-2">
            {pred3h ? (
              <RiskGauge
                probability={pred3h.probability}
                threshold={pred3h.threshold}
                horizonLabel="Next 3 Hours"
                category={pred3h.riskCategory}
                color={pred3h.riskColor}
              />
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground font-mono">
                Model prediction currently unavailable
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Model Confidence:</span>
              <span className="font-mono font-bold text-foreground">{pred3h?.confidence || 85}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Validation TSS (Skill):</span>
              <span className="font-mono font-bold text-emerald-400">+{pred3h?.metrics?.tss || '0.83'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">PR-AUC (Test 2024):</span>
              <span className="font-mono font-bold text-sky-400">{pred3h?.metrics?.prAuc || '0.77'}</span>
            </div>
            <div className="pt-2">
              <Link
                href="/risk"
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold bg-surface-elevated hover:bg-solar-500/20 text-foreground hover:text-solar-300 border border-border transition-colors"
              >
                <span>Deep Risk Analysis & Threshold Tuning</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Horizon Progression Cards */}
        <div className="lg:col-span-7 scientific-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm text-foreground">Multi-Horizon Forecast Overview</h3>
              </div>
              <Link href="/forecasts" className="text-xs text-solar-400 hover:underline flex items-center gap-1">
                <span>View Curves</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Comparison across 3, 6, 12, and 24-hour lead times with trained model degradation skill curves.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            {['3h', '6h', '12h', '24h'].map((h) => {
              const p = data?.predictions?.[h];
              if (!p) return null;
              return (
                <div
                  key={h}
                  className="p-3 rounded-lg border border-border bg-surface flex flex-col justify-between space-y-2 hover:border-solar-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span>+{h.toUpperCase()}</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: p.riskColor }}
                    />
                  </div>
                  <div>
                    <div className="text-2xl font-bold telemetry-num text-foreground">
                      {p.probabilityPercent}%
                    </div>
                    <div className="text-[10px] font-semibold truncate" style={{ color: p.riskColor }}>
                      {p.riskCategory}
                    </div>
                  </div>
                  <div className="text-[9px] text-muted-foreground font-mono pt-1 border-t border-border/40">
                    ROC-AUC: {p.metrics.rocAuc.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Contributing Physical Measurements */}
          <div className="pt-3 border-t border-border/60">
            <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-solar-400" />
              Top Physical Factors Driving Current Estimate
            </div>
            <div className="space-y-1.5">
              {pred3h?.contributions?.slice(0, 3).map((c: any) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between text-xs p-2 rounded bg-surface/60 border border-border/40"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      c.impact === 'storm_driving' ? 'bg-red-400' : c.impact === 'quiet_stabilizing' ? 'bg-sky-400' : 'bg-slate-400'
                    }`} />
                    <span className="text-foreground">{c.label}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-muted-foreground">Value: {c.rawValue}</span>
                    <span className={c.contribution > 0 ? 'text-red-400 font-semibold' : 'text-sky-400 font-semibold'}>
                      {c.contribution > 0 ? `+${c.contribution}` : c.contribution}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Real-Time 3D Earth Magnetosphere Interaction */}
      <div className="scientific-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-base text-foreground">Interactive Earth Magnetosphere Observation</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visualizing how current solar-wind speed ({Math.round(current.speed || 400)} km/s) and IMF Bz ({current.bzGsm || 0} nT) interact with Earth&apos;s magnetic shield.
            </p>
          </div>
          <Link
            href="/magnetosphere"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-solar-500/15 hover:bg-solar-500/25 text-solar-400 border border-solar-500/30 transition-colors shrink-0"
          >
            <span>Full-Screen Lab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <InteractiveMagnetosphere
          speed={current.speed}
          bzGsm={current.bzGsm}
          density={current.density}
          height="420px"
        />
      </div>

      {/* 5. Quick Links & Educational Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/live"
          className="scientific-card p-4 hover:border-solar-500/40 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-sky-400 font-semibold">TELEMETRY LAB</span>
              <Radio className="w-4 h-4 text-sky-400" />
            </div>
            <h4 className="font-bold text-sm text-foreground mt-2 group-hover:text-solar-400 transition-colors">
              Live Solar-Wind Charts
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Synchronized 6h to 7d time-series for Speed, IMF Bz, Density, Bt, and NOAA Planetary Kp history.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-solar-400 font-medium mt-4">
            <span>Open Observatory</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/replay"
          className="scientific-card p-4 hover:border-solar-500/40 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-red-400 font-semibold">HISTORICAL EVENT</span>
              <Activity className="w-4 h-4 text-red-400" />
            </div>
            <h4 className="font-bold text-sm text-foreground mt-2 group-hover:text-solar-400 transition-colors">
              May 2024 Storm Replay (G5)
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Step through the historic Mother&apos;s Day storm hour by hour with synchronized charts and model predictions.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-solar-400 font-medium mt-4">
            <span>Start Replay</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/performance"
          className="scientific-card p-4 hover:border-solar-500/40 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 font-semibold">TRANSPARENT AI</span>
              <Sliders className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="font-bold text-sm text-foreground mt-2 group-hover:text-solar-400 transition-colors">
              Model Performance Observatory
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Inspect test-set confusion matrices, PR curves, ROC curves, and baselines proving predictive skill.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-solar-400 font-medium mt-4">
            <span>Explore Metrics</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}

