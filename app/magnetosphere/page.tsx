'use client';

import React, { useEffect, useState } from 'react';
import { InteractiveMagnetosphere } from '@/components/space/InteractiveMagnetosphere';
import { Globe2, Compass, Wind, Radio, Sliders, Sparkles, RefreshCw, Info, AlertTriangle } from 'lucide-react';

export default function MagnetospherePage() {
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Manual simulation sliders
  const [simSpeed, setSimSpeed] = useState(420);
  const [simBz, setSimBz] = useState(-1.5);
  const [simDensity, setSimDensity] = useState(5.0);

  const fetchLive = async () => {
    try {
      const res = await fetch('/api/space-weather/live');
      if (res.ok) {
        const json = await res.json();
        setLiveData(json.data);
        if (!isManualOverride) {
          setSimSpeed(json.data.current.speed);
          setSimBz(json.data.current.bzGsm);
          setSimDensity(json.data.current.density);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
  }, []);

  const speed = isManualOverride ? simSpeed : (liveData?.current?.speed || 420);
  const bzGsm = isManualOverride ? simBz : (liveData?.current?.bzGsm || -1.2);
  const density = isManualOverride ? simDensity : (liveData?.current?.density || 5.0);
  const isSouthward = bzGsm < 0;

  // Preset scenarios
  const applyPreset = (name: string) => {
    setIsManualOverride(true);
    if (name === 'quiet') {
      setSimSpeed(340);
      setSimBz(2.5);
      setSimDensity(3.5);
    } else if (name === 'cme_shock') {
      setSimSpeed(680);
      setSimBz(-14.0);
      setSimDensity(18.0);
    } else if (name === 'may2024') {
      setSimSpeed(950);
      setSimBz(-32.0);
      setSimDensity(28.0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-solar-400">
              3D MAGNETOSPHERIC OBSERVATORY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Interactive Earth Magnetosphere
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time visual representation of solar wind particle compression and magnetic reconnection geometry.
          </p>
        </div>

        {/* Live vs Manual Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsManualOverride(false);
              fetchLive();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
              !isManualOverride
                ? 'bg-solar-500/20 text-solar-400 border-solar-500/40'
                : 'bg-surface text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            Live NOAA Stream
          </button>
          <button
            onClick={() => setIsManualOverride(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
              isManualOverride
                ? 'bg-solar-500/20 text-solar-400 border-solar-500/40'
                : 'bg-surface text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            Manual Simulation Lab
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Box */}
      <div className="scientific-card p-3 space-y-4">
        <InteractiveMagnetosphere
          speed={speed}
          bzGsm={bzGsm}
          density={density}
          interactive={true}
          height="540px"
        />

        {/* Real-Time Parameter Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg border border-border bg-surface flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] text-muted-foreground font-mono">FLOW VELOCITY</div>
              <div className="text-lg font-bold telemetry-num text-foreground">{Math.round(speed)} km/s</div>
            </div>
            <Wind className="w-5 h-5 text-sky-400" />
          </div>

          <div className={`p-3 rounded-lg border flex items-center justify-between ${
            isSouthward ? 'border-red-500/40 bg-red-500/10' : 'border-border bg-surface'
          }`}>
            <div className="space-y-0.5">
              <div className="text-[10px] text-muted-foreground font-mono">IMF Bz (GSM)</div>
              <div className={`text-lg font-bold telemetry-num ${isSouthward ? 'text-red-400' : 'text-emerald-400'}`}>
                {bzGsm > 0 ? `+${bzGsm.toFixed(1)}` : bzGsm.toFixed(1)} nT
              </div>
            </div>
            <Compass className={`w-5 h-5 ${isSouthward ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] text-muted-foreground font-mono">PROTON DENSITY</div>
              <div className="text-lg font-bold telemetry-num text-foreground">{density.toFixed(1)} p/cm³</div>
            </div>
            <Radio className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] text-muted-foreground font-mono">SHIELD STATUS</div>
              <div className={`text-xs font-bold font-mono ${isSouthward ? 'text-red-400' : 'text-sky-400'}`}>
                {isSouthward ? 'RECONNECTION (OPEN)' : 'SHIELDED (CLOSED)'}
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-solar-400" />
          </div>
        </div>
      </div>

      {/* Manual Simulation Controls (if active) or Scenario Presets */}
      <div className="scientific-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-solar-400" />
            <h3 className="font-bold text-sm text-foreground">Interactive Space Weather Scenarios</h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Quick Presets:</span>
            <button
              onClick={() => applyPreset('quiet')}
              className="px-2.5 py-1 rounded border border-border bg-surface hover:bg-surface-elevated text-sky-400 transition-colors"
            >
              Quiet Sun
            </button>
            <button
              onClick={() => applyPreset('cme_shock')}
              className="px-2.5 py-1 rounded border border-border bg-surface hover:bg-surface-elevated text-amber-400 transition-colors"
            >
              CME Impact (G3)
            </button>
            <button
              onClick={() => applyPreset('may2024')}
              className="px-2.5 py-1 rounded border border-border bg-surface hover:bg-surface-elevated text-red-400 transition-colors font-bold"
            >
              May 2024 Superstorm (G5)
            </button>
          </div>
        </div>

        {isManualOverride && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Solar Wind Speed (Flow)</span>
                <span className="font-mono font-bold text-foreground">{simSpeed} km/s</span>
              </div>
              <input
                type="range"
                min="250"
                max="1100"
                step="10"
                value={simSpeed}
                onChange={(e) => setSimSpeed(parseInt(e.target.value))}
                className="w-full accent-solar-500 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">IMF Bz GSM (Orientation)</span>
                <span className={`font-mono font-bold ${simBz < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {simBz > 0 ? `+${simBz}` : simBz} nT
                </span>
              </div>
              <input
                type="range"
                min="-40"
                max="25"
                step="0.5"
                value={simBz}
                onChange={(e) => setSimBz(parseFloat(e.target.value))}
                className="w-full accent-solar-500 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Proton Density (Np)</span>
                <span className="font-mono font-bold text-foreground">{simDensity.toFixed(1)} p/cm³</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="0.5"
                value={simDensity}
                onChange={(e) => setSimDensity(parseFloat(e.target.value))}
                className="w-full accent-solar-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Physics Explanation Card */}
      <div className="p-4 rounded-lg border border-border bg-surface-elevated/80 text-xs text-muted-foreground leading-relaxed space-y-2">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <span>The Physics of Dayside Magnetic Reconnection</span>
        </div>
        <p>
          Earth&apos;s intrinsic magnetic dipole points northward at the equatorial magnetopause. When the Interplanetary Magnetic Field (IMF) carried by the solar wind has a southward component ($B_z &lt; 0$), the oppositely directed magnetic vectors break and reconnect on the dayside. This strips magnetic flux from the dayside to the nightside magnetotail, accelerating electrons and protons down auroral field lines and driving massive ring currents ($Dst \ll 0$).
        </p>
      </div>
    </div>
  );
}

