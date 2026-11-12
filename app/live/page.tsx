'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { Radio, RefreshCw, AlertCircle, Wind, Compass, Zap, Activity, Clock } from 'lucide-react';
import { mapKpToNoaaScale } from '@/lib/api/noaaService';

type TimeRange = '6h' | '12h' | '24h' | '3d' | '7d';

export default function LiveTelemetryPage() {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState<TimeRange>('24h');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/space-weather/live');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      setData(json.data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch live telemetry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 font-mono text-xs text-muted-foreground">
        <RefreshCw className="w-8 h-8 animate-spin text-solar-400" />
        <div>STREAMING HIGH-RESOLUTION NOAA RTSW FEEDS...</div>
      </div>
    );
  }

  // Filter series based on selected time range
  const now = Date.now();
  let hoursCutoff = 24;
  if (range === '6h') hoursCutoff = 6;
  else if (range === '12h') hoursCutoff = 12;
  else if (range === '24h') hoursCutoff = 24;
  else if (range === '3d') hoursCutoff = 72;
  else if (range === '7d') hoursCutoff = 168;

  const minTime = now - (hoursCutoff * 3600 * 1000);

  const windData = (data?.recentHistory?.wind || [])
    .filter((d: any) => new Date(d.timeTag).getTime() >= minTime)
    .map((d: any) => ({
      time: new Date(d.timeTag).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(d.timeTag).toLocaleDateString([], { month: 'numeric', day: 'numeric' }),
      speed: d.speed,
      density: d.density
    }));

  const magData = (data?.recentHistory?.mag || [])
    .filter((d: any) => new Date(d.timeTag).getTime() >= minTime)
    .map((d: any) => ({
      time: new Date(d.timeTag).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(d.timeTag).toLocaleDateString([], { month: 'numeric', day: 'numeric' }),
      bt: d.bt,
      bzGsm: d.bzGsm
    }));

  const kpData = (data?.recentHistory?.kp || []).map((d: any) => ({
    time: new Date(d.timeTag).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit' }),
    kp: d.kp,
    scale: d.noaaScale
  }));

  const kpForecast = (data?.recentHistory?.kpForecast || []).map((d: any) => ({
    time: new Date(d.timeTag).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit' }),
    kp: d.kp,
    status: d.observedStatus,
    scale: d.noaaScale
  }));

  const ranges: TimeRange[] = ['6h', '12h', '24h', '3d', '7d'];

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-solar-400">
              TELEMETRY OBSERVATORY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Live Space-Weather Instrumentation
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Calibrated measurements from NOAA DSCOVR and ACE spacecraft stationed at Sun-Earth Lagrange Point 1 (L1).
          </p>
        </div>

        {/* Time-Range Selector and Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-1 rounded-lg border border-border bg-surface text-xs">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-md font-mono font-medium transition-colors ${
                  range === r
                    ? 'bg-solar-500/20 text-solar-400 border border-solar-500/40 font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={fetchTelemetry}
            disabled={refreshing}
            className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-solar-400' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of 4 Synchronized Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Solar Wind Speed */}
        <div className="scientific-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-sm text-foreground">Solar-Wind Speed (Flow Velocity)</h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              Current: <strong className="text-sky-400">{data?.current?.speed} km/s</strong>
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Nominal speeds range from 300–450 km/s. Fast Coronal Mass Ejections (CMEs) exceed 600–1000 km/s.
          </p>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={windData}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={10} unit=" km/s" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: '0.375rem',
                    fontSize: '11px'
                  }}
                />
                <ReferenceLine y={500} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Elevated (500 km/s)', fill: '#f59e0b', fontSize: 9 }} />
                <Line type="monotone" dataKey="speed" name="Speed (km/s)" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Interplanetary Magnetic Field Bz GSM */}
        <div className="scientific-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-foreground">IMF Bz (GSM Coordinates)</h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              Current: <strong className={data?.current?.bzGsm < 0 ? 'text-red-400' : 'text-emerald-400'}>
                {data?.current?.bzGsm} nT
              </strong>
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Negative Bz (southward) drives geomagnetic storm reconnection. Positive Bz (northward) maintains Earth&apos;s magnetic shield.
          </p>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={magData}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={10} unit=" nT" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: '0.375rem',
                    fontSize: '11px'
                  }}
                />
                <ReferenceLine y={0} stroke="#ffffff" strokeWidth={1} label={{ value: '0 nT (Neutral)', fill: '#ffffff', fontSize: 9 }} />
                <ReferenceLine y={-5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Storm Hazard Threshold (-5 nT)', fill: '#ef4444', fontSize: 9 }} />
                <Line type="monotone" dataKey="bzGsm" name="Bz GSM (nT)" stroke="#fb7185" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Proton Density */}
        <div className="scientific-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-foreground">Proton Density (Np)</h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              Current: <strong className="text-cyan-400">{data?.current?.density} p/cm³</strong>
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Plasma density of the incoming solar wind. Elevated density sharply compresses the dayside magnetopause.
          </p>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={windData}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={10} unit=" p/cm³" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: '0.375rem',
                    fontSize: '11px'
                  }}
                />
                <Line type="monotone" dataKey="density" name="Density (p/cm³)" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Total Magnetic Field Magnitude |B| */}
        <div className="scientific-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-foreground">Total Magnetic Field Magnitude |B| (Bt)</h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              Current: <strong className="text-amber-400">{data?.current?.bt} nT</strong>
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Total interplanetary magnetic field vector magnitude |B|. High values indicate interplanetary shock fronts or CME passage.
          </p>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={magData}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={10} unit=" nT" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: '0.375rem',
                    fontSize: '11px'
                  }}
                />
                <Line type="monotone" dataKey="bt" name="Total |B| (nT)" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Planetary Kp Index History & NOAA 3-Day Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Kp Observed History */}
        <div className="scientific-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-foreground">Observed Planetary Kp Index (Last 7 Days)</h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              Latest: <strong className="text-foreground">{data?.current?.currentKp} ({data?.current?.noaaScale})</strong>
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Official 3-hour planetary K-index derived from ground-based magnetometer stations worldwide.
          </p>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpData}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 9]} ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} stroke="var(--text-muted)" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: '0.375rem',
                    fontSize: '11px'
                  }}
                />
                <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'G1 Storm (Kp=5)', fill: '#ef4444', fontSize: 9 }} />
                <Bar dataKey="kp" name="Kp Index" radius={[2, 2, 0, 0]}>
                  {kpData.map((entry: any, index: number) => {
                    const { color } = mapKpToNoaaScale(entry.kp);
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NOAA SWPC 3-Day Forecast */}
        <div className="scientific-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-solar-400" />
              <h3 className="font-bold text-sm text-foreground">NOAA SWPC Planetary Kp Forecast</h3>
            </div>
            <span className="text-xs font-mono text-solar-400">Official NOAA SWPC Product</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Official NOAA SWPC 3-hour forecast bins showing expected geomagnetic conditions.
          </p>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpForecast.slice(0, 24)}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 9]} ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} stroke="var(--text-muted)" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: '0.375rem',
                    fontSize: '11px'
                  }}
                />
                <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'G1 Storm (Kp=5)', fill: '#ef4444', fontSize: 9 }} />
                <Bar dataKey="kp" name="Forecast Kp" radius={[2, 2, 0, 0]}>
                  {kpForecast.slice(0, 24).map((entry: any, index: number) => {
                    const { color } = mapKpToNoaaScale(entry.kp);
                    return <Cell key={`cell-f-${index}`} fill={color} opacity={0.8} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

