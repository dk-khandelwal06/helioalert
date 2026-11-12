'use client';

import React from 'react';
import { Wind, Compass, Zap, Gauge, Radio, Shield } from 'lucide-react';

interface TelemetryCardsProps {
  speed: number;
  density: number;
  bzGsm: number;
  bt: number;
  currentKp: number;
  pressure: number;
  geomagneticStatus: string;
  noaaScale: string;
  statusColor: string;
}

export function TelemetryCards({
  speed,
  density,
  bzGsm,
  bt,
  currentKp,
  pressure,
  geomagneticStatus,
  noaaScale,
  statusColor,
}: TelemetryCardsProps) {
  // Scientific evaluations
  const isSouthward = bzGsm < 0;
  const isHighSpeed = speed > 500;
  const isHighDensity = density > 10;
  const isStormKp = currentKp >= 5.0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Solar Wind Speed */}
      <div className="scientific-card p-3.5 flex flex-col justify-between transition-all hover:border-solar-500/40">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="font-medium">Wind Speed</span>
          <Wind className={`w-4 h-4 ${isHighSpeed ? 'text-solar-400 animate-pulse' : 'text-sky-400'}`} />
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold telemetry-num text-foreground">
              {Math.round(speed)}
            </span>
            <span className="text-xs text-muted-foreground">km/s</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>Flow Velocity</span>
          <span className={isHighSpeed ? 'text-solar-400 font-semibold' : 'text-sky-400'}>
            {isHighSpeed ? 'Elevated' : 'Nominal'}
          </span>
        </div>
      </div>

      {/* 2. IMF Bz (GSM) - The primary storm trigger! */}
      <div className={`scientific-card p-3.5 flex flex-col justify-between transition-all ${
        bzGsm < -5 ? 'border-red-500/50 bg-red-500/5' : 'hover:border-solar-500/40'
      }`}>
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="font-medium">IMF Bz (GSM)</span>
          <Compass className={`w-4 h-4 ${isSouthward ? 'text-red-400 animate-bounce' : 'text-emerald-400'}`} />
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold telemetry-num ${isSouthward ? 'text-red-400' : 'text-emerald-400'}`}>
              {bzGsm > 0 ? `+${bzGsm.toFixed(1)}` : bzGsm.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">nT</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>Orientation</span>
          <span className={isSouthward ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
            {isSouthward ? 'Southward (Hazard)' : 'Northward (Shield)'}
          </span>
        </div>
      </div>

      {/* 3. Proton Density */}
      <div className="scientific-card p-3.5 flex flex-col justify-between transition-all hover:border-solar-500/40">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="font-medium">Proton Density</span>
          <Radio className="w-4 h-4 text-sky-400" />
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold telemetry-num text-foreground">
              {density.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">p/cm³</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>Plasma Density</span>
          <span className={isHighDensity ? 'text-amber-400 font-semibold' : 'text-sky-400'}>
            {isHighDensity ? 'Dense CME' : 'Nominal'}
          </span>
        </div>
      </div>

      {/* 4. Total Magnetic Field Magnitude |B| */}
      <div className="scientific-card p-3.5 flex flex-col justify-between transition-all hover:border-solar-500/40">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="font-medium">Total Field |B|</span>
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold telemetry-num text-foreground">
              {bt.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">nT</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>Interplanetary B</span>
          <span className={bt > 15 ? 'text-red-400 font-semibold' : 'text-sky-400'}>
            {bt > 15 ? 'Intense' : 'Nominal'}
          </span>
        </div>
      </div>

      {/* 5. Dynamic Flow Pressure */}
      <div className="scientific-card p-3.5 flex flex-col justify-between transition-all hover:border-solar-500/40">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="font-medium">Flow Pressure</span>
          <Gauge className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold telemetry-num text-foreground">
              {pressure.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">nPa</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>Magnetopause</span>
          <span>{pressure > 3.0 ? 'Compressed' : 'Equilibrium'}</span>
        </div>
      </div>

      {/* 6. Current Planetary Kp Index */}
      <div className="scientific-card p-3.5 flex flex-col justify-between transition-all hover:border-solar-500/40">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="font-medium">Current Kp Index</span>
          <Shield className="w-4 h-4" style={{ color: statusColor }} />
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold telemetry-num" style={{ color: statusColor }}>
              {currentKp.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">/ 9</span>
          </div>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border"
            style={{
              borderColor: `${statusColor}60`,
              backgroundColor: `${statusColor}15`,
              color: statusColor
            }}
          >
            {noaaScale}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>NOAA Status</span>
          <span className="font-semibold" style={{ color: statusColor }}>
            {geomagneticStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

