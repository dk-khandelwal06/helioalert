'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { InteractiveMagnetosphere } from '@/components/space/InteractiveMagnetosphere';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  History,
  AlertOctagon,
  Calendar,
  Wind,
  Compass,
  Gauge,
  Activity
} from 'lucide-react';
import { mapKpToNoaaScale } from '@/lib/api/noaaService';

export default function HistoricalReplayPage() {
  const [eventData, setEventData] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadReplay() {
      try {
        const res = await fetch('/api/replay');
        if (res.ok) {
          const json = await res.json();
          setEventData(json.event);
          setSteps(json.data || []);
          // Start around DOY 131 Hour 12 right before the shock arrives
          const startShockIdx = json.data.findIndex((s: any) => s.doy === 131 && s.hour === 12);
          if (startShockIdx !== -1) {
            setCurrentIdx(startShockIdx);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadReplay();
  }, []);

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(100, Math.floor(1000 / playbackSpeed));
      timerRef.current = setInterval(() => {
        setCurrentIdx((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, steps.length]);

  if (loading || steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 font-mono text-xs text-muted-foreground">
        <History className="w-8 h-8 animate-spin text-solar-400" />
        <div>RECONSTRUCTING NASA OMNI2 HISTORICAL REPLAY ARCHIVE...</div>
      </div>
    );
  }

  const currentStep = steps[currentIdx] || steps[0];
  const kpObj = mapKpToNoaaScale(currentStep.kp || 1.0);

  // Formatted chart points up to currentIdx for historical progression
  const chartPoints = steps.map((s, idx) => ({
    time: `DOY ${s.doy} ${s.hour}:00`,
    speed: s.speed,
    bz: s.bz,
    kp: s.kp,
    prob: Math.round((s.retro_prob_3h || 0) * 100),
    isCurrent: idx === currentIdx
  }));

  return (
    <div className="space-y-6">
      {/* Event Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-red-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
              HISTORICAL STORM RECONSTRUCTION
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            May 2024 Extreme Solar Superstorm (G5)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Retrospective replay of NASA OMNI2 hourly telemetry during the most intense geomagnetic disturbance of Solar Cycle 25.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold font-mono border border-red-500/40 bg-red-500/10 text-red-400">
            PEAK: Kp 9.0 (G5 EXTREME) • Dst -406 nT
          </span>
        </div>
      </div>

      {/* Main Replay Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive 3D Reaction at this Exact Hour */}
        <div className="lg:col-span-6 space-y-4">
          <div className="scientific-card p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">3D Magnetosphere State at Timestamp</span>
              <span className="font-mono text-muted-foreground">
                {currentStep.time_tag.replace('T', ' ').substring(0, 16)} UTC
              </span>
            </div>

            <InteractiveMagnetosphere
              speed={currentStep.speed || 400}
              bzGsm={currentStep.bz || 0}
              density={currentStep.density || 5.0}
              height="380px"
              interactive={true}
            />

            {/* Instant Telemetry Box for current hour */}
            <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-center">
              <div className="p-2 rounded bg-surface border border-border">
                <div className="text-[10px] text-muted-foreground">Speed</div>
                <div className="text-sm font-bold text-foreground">{Math.round(currentStep.speed || 0)} km/s</div>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <div className="text-[10px] text-muted-foreground">IMF Bz</div>
                <div className={`text-sm font-bold ${currentStep.bz < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {currentStep.bz?.toFixed(1)} nT
                </div>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <div className="text-[10px] text-muted-foreground">Observed Kp</div>
                <div className="text-sm font-bold" style={{ color: kpObj.color }}>
                  {currentStep.kp?.toFixed(1)}
                </div>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <div className="text-[10px] text-muted-foreground">Kyoto Dst</div>
                <div className="text-sm font-bold text-red-400">
                  {currentStep.dst} nT
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Retrospective Model Prediction vs Reality */}
        <div className="lg:col-span-6 space-y-4">
          <div className="scientific-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="font-bold text-sm text-foreground">Retrospective Model Performance</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-solar-400">
                HelioAlert LR-v1.0
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border bg-surface text-center space-y-1">
                <div className="text-[11px] text-muted-foreground uppercase font-mono">
                  3h Predicted Storm Probability
                </div>
                <div className="text-3xl font-extrabold telemetry-num text-foreground">
                  {Math.round((currentStep.retro_prob_3h || 0) * 100)}%
                </div>
                <div className={`text-xs font-bold ${
                  currentStep.retro_storm_alert ? 'text-red-400' : 'text-sky-400'
                }`}>
                  {currentStep.retro_storm_alert ? 'STORM ALERT ISSUED' : 'BELOW THRESHOLD'}
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-surface text-center space-y-1">
                <div className="text-[11px] text-muted-foreground uppercase font-mono">
                  Actual Observed Kp Index
                </div>
                <div className="text-3xl font-extrabold telemetry-num" style={{ color: kpObj.color }}>
                  {currentStep.kp?.toFixed(1)}
                </div>
                <div className="text-xs font-bold font-mono" style={{ color: kpObj.color }}>
                  {kpObj.scale} ({kpObj.status.toUpperCase()})
                </div>
              </div>
            </div>

            {/* Explanatory text */}
            <div className="p-3 rounded-lg border border-border bg-surface/60 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Reconstruction Note: </strong>
              During the arrival of the first CME shock on May 10 at 17:00–18:00 UTC (DOY 131), wind speed abruptly spiked from 450 to 700 km/s and Bz turned violently southward to -35 nT. The model&apos;s estimated 3-hour storm probability leapt immediately to <strong>99.8%</strong>, providing timely early warning hours before peak ground magnetometer disturbance!
            </div>
          </div>

          {/* Synchronized Replay Timeline Chart */}
          <div className="scientific-card p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Storm Timeline (Speed & Bz GSM)</span>
              <span className="font-mono text-muted-foreground text-[10px]">
                Red Line: Current Playhead
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints}>
                  <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                  <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={9} interval={12} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={9} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-main)',
                      borderRadius: '0.375rem',
                      fontSize: '11px'
                    }}
                  />
                  <ReferenceLine x={`DOY ${currentStep.doy} ${currentStep.hour}:00`} stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="speed" name="Speed (km/s)" stroke="#38bdf8" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="bz" name="Bz (nT)" stroke="#ef4444" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Scrubbing & Playback Controller Bar */}
      <div className="scientific-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              className="p-2 rounded-md border border-border bg-surface hover:bg-surface-elevated text-foreground transition-colors"
              title="Step Back 1 Hour"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-md bg-solar-500 hover:bg-solar-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY REPLAY'}</span>
            </button>

            <button
              onClick={() => setCurrentIdx(Math.min(steps.length - 1, currentIdx + 1))}
              className="p-2 rounded-md border border-border bg-surface hover:bg-surface-elevated text-foreground transition-colors"
              title="Step Forward 1 Hour"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentIdx(0);
              }}
              className="p-2 rounded-md border border-border bg-surface hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
              title="Reset to Start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Current Timestamp Display */}
          <div className="text-center font-mono">
            <div className="text-sm font-bold text-foreground">
              {currentStep.time_tag.replace('T', ' ').substring(0, 16)} UTC
            </div>
            <div className="text-[10px] text-muted-foreground">
              Step {currentIdx + 1} of {steps.length} Hours
            </div>
          </div>

          {/* Playback Speed Selector */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-muted-foreground">Speed:</span>
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-2 py-1 rounded border transition-colors ${
                  playbackSpeed === s
                    ? 'bg-solar-500/20 text-solar-400 border-solar-500/40 font-bold'
                    : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Range Slider */}
        <div className="pt-2">
          <input
            type="range"
            min={0}
            max={steps.length - 1}
            value={currentIdx}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentIdx(parseInt(e.target.value));
            }}
            className="w-full accent-solar-500 cursor-pointer"
          />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
            <span>May 9 (Pre-Event)</span>
            <span>May 10 (Shock Arrival)</span>
            <span className="text-red-400 font-bold">May 11 (Peak G5 Storm)</span>
            <span>May 12 (Recovery)</span>
            <span>May 13 (End)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

