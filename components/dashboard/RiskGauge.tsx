'use client';

import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RiskGaugeProps {
  probability: number; // 0.0 to 1.0
  threshold: number;   // e.g. 0.90 or 0.35
  horizonLabel?: string;
  category: 'Quiet' | 'Guarded' | 'Elevated' | 'High Risk' | 'Severe Storm';
  color: string;
}

export function RiskGauge({
  probability,
  threshold,
  horizonLabel = 'Next 3 Hours',
  category,
  color
}: RiskGaugeProps) {
  const percent = Math.min(100, Math.max(0, Math.round(probability * 100)));
  const thresholdPercent = Math.min(100, Math.max(0, Math.round(threshold * 100)));

  // SVG Semicircular Arc Math
  // Radius: 90, Center: (120, 110)
  // Angle: from -180 deg (left) to 0 deg (right)
  const radius = 80;
  const cx = 110;
  const cy = 100;
  const strokeWidth = 14;

  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // Threshold marker angle in radians
  const threshAngle = Math.PI - (thresholdPercent / 100) * Math.PI;
  const threshX1 = cx + (radius - strokeWidth / 2 - 2) * Math.cos(threshAngle);
  const threshY1 = cy - (radius - strokeWidth / 2 - 2) * Math.sin(threshAngle);
  const threshX2 = cx + (radius + strokeWidth / 2 + 2) * Math.cos(threshAngle);
  const threshY2 = cy - (radius + strokeWidth / 2 + 2) * Math.sin(threshAngle);

  const getIcon = () => {
    switch (category) {
      case 'Quiet':
        return <CheckCircle2 className="w-5 h-5 text-sky-400" />;
      case 'Guarded':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'Elevated':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'High Risk':
      case 'Severe Storm':
        return <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Semicircular Gauge SVG */}
      <div className="relative w-56 h-32 flex items-center justify-center">
        <svg className="w-56 h-32 overflow-visible" viewBox="0 0 220 125">
          <defs>
            {/* Multi-stage scientific gradient for space weather risk */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />   {/* Quiet Cyan */}
              <stop offset="35%" stopColor="#facc15" />  {/* Guarded Yellow */}
              <stop offset="65%" stopColor="#fb923c" />  {/* Elevated Orange */}
              <stop offset="100%" stopColor="#ef4444" /> {/* Storm Red */}
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter={percent > 50 ? 'url(#glow)' : undefined}
            className="transition-all duration-700 ease-out"
          />

          {/* Decision Threshold Marker Line */}
          <line
            x1={threshX1}
            y1={threshY1}
            x2={threshX2}
            y2={threshY2}
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <title>{`Operational Threshold: ${thresholdPercent}%`}</title>
          </line>
        </svg>

        {/* Central Numeric Value Overlay */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-extrabold telemetry-num text-foreground tracking-tight">
              {percent}
            </span>
            <span className="text-base font-semibold text-muted-foreground">%</span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {horizonLabel}
          </span>
        </div>
      </div>

      {/* Risk Category Badge & Details */}
      <div className="mt-3 flex flex-col items-center gap-1.5 w-full">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm"
          style={{
            borderColor: `${color}60`,
            backgroundColor: `${color}15`,
            color: color
          }}
        >
          {getIcon()}
          <span>{category.toUpperCase()}</span>
          <span className="text-[10px] opacity-80">
            ({probability >= threshold ? 'STORM ALERT ACTIVE' : 'BELOW THRESHOLD'})
          </span>
        </div>

        <div className="flex items-center justify-between w-full px-4 text-[10px] text-muted-foreground mt-2 border-t border-border/50 pt-2 font-mono">
          <span>Target: Kp ≥ 5.0</span>
          <span>Alert Thresh: {thresholdPercent}%</span>
        </div>
      </div>
    </div>
  );
}
