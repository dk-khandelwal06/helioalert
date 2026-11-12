import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldAlert, ExternalLink, Database, Activity } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-surface/95 backdrop-blur-md mt-16 text-xs text-muted-foreground transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Identity & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 rounded border border-solar-500/40 bg-black/40 flex items-center justify-center p-0.5">
                <Image
                  src="/images/logo.png"
                  alt="HelioAlert Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-sm tracking-wider text-foreground font-mono uppercase">
                HELIOALERT
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              Explainable space-weather intelligence platform estimating whether the planetary Kp index will reach 5 or higher (NOAA G1 minor geomagnetic storm threshold) in the next 3 hours using real-time solar-wind telemetry and genuinely trained ML models.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-solar-400 font-mono">
              <Activity className="w-3.5 h-3.5" />
              <span>Target: Kp ≥ 5.0 (NOAA G1 Minor Storm Warning)</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/" className="hover:text-solar-400 transition-colors">Mission Control</Link></li>
              <li><Link href="/live" className="hover:text-solar-400 transition-colors">Live Telemetry Observatory</Link></li>
              <li><Link href="/risk" className="hover:text-solar-400 transition-colors">Geomagnetic Risk Centre</Link></li>
              <li><Link href="/magnetosphere" className="hover:text-solar-400 transition-colors">Interactive 3D Magnetosphere</Link></li>
              <li><Link href="/replay" className="hover:text-solar-400 transition-colors">May 2024 Storm Replay</Link></li>
              <li><Link href="/performance" className="hover:text-solar-400 transition-colors">ML Performance Observatory</Link></li>
              <li><Link href="/methodology" className="hover:text-solar-400 transition-colors">Scientific Methodology</Link></li>
            </ul>
          </div>

          {/* Scientific Attribution */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              Data Sources
            </h4>
            <p className="text-[11px] leading-relaxed">
              Historical baseline trained on <strong>NASA SPDF OMNI2</strong> hourly data. Real-time telemetry provided by <strong>NOAA Space Weather Prediction Center (SWPC)</strong> RTSW feeds.
            </p>
            <div className="pt-2 flex flex-col gap-1 text-[11px]">
              <a
                href="https://www.swpc.noaa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-sky-400 transition-colors"
              >
                <span>NOAA SWPC Official Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://spdf.gsfc.nasa.gov/omniweb/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-sky-400 transition-colors"
              >
                <span>NASA SPDF OMNIWeb Data</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Mandatory Scientific Disclaimer Notice */}
        <div className="mt-8 pt-6 border-t border-border/60">
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-muted-foreground text-[11px] leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Official Space-Weather Notice: </strong>
              HelioAlert is an independent, educational, and experimental scientific machine-learning research system. It is <strong>NOT</strong> an official forecast, warning, or watch issued by NOAA, NASA, the US Government, or any space-weather agency. Never use HelioAlert for critical life-safety, aviation routing, electric-grid switching, or satellite reorientation without operational NOAA SWPC validation.
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground">
            <div>© {new Date().getFullYear()} HelioAlert • Open-Science Space-Weather Analytics</div>
            <div className="mt-1 sm:mt-0 font-mono text-[10px]">Model: LR-v1.0.0 • Calibrated on NASA OMNI2 (2018–2024)</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

