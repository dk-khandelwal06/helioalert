'use client';

import React from 'react';
import { BookOpen, Database, ShieldAlert, Cpu, ExternalLink, Activity, Info, CheckCircle2 } from 'lucide-react';

export default function MethodologyPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-border/60 pb-5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-solar-400">
            SCIENTIFIC FOUNDATION
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
          Methodology & Scientific Architecture
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
          Comprehensive documentation of data sources, chronological validation, machine-learning pipeline, and physical space-weather telemetry.
        </p>
      </div>

      {/* 1. How HelioAlert Works */}
      <section className="scientific-card p-6 space-y-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-solar-400" />
          1. System Architecture & Forecasting Objective
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          HelioAlert is an explainable space-weather intelligence platform designed to answer one central question: <strong>&ldquo;Will the Sun disturb Earth&apos;s magnetic field in the next few hours?&rdquo;</strong>
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Specifically, the primary model objective is binary classification: estimating whether the planetary Kp index will reach or exceed <strong>5.0</strong> (representing the NOAA G1 Minor Geomagnetic Storm threshold) over the next <strong>3, 6, 12, or 24 hours</strong> using real-time interplanetary solar-wind observations taken at the Sun-Earth Lagrange Point 1 (L1).
        </p>
      </section>

      {/* 2. Data Sources: NASA OMNI2 & NOAA SWPC */}
      <section className="scientific-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Database className="w-5 h-5 text-sky-400" />
          2. Data Provenance & Cleaning
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-lg border border-border bg-surface/70 space-y-2">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <span>NASA SPDF OMNI2 Historical Dataset</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Historical model training and evaluation utilize the NASA Space Physics Data Facility (SPDF) OMNI2 hourly dataset spanning Solar Cycles 24 and 25 (2018–2024).
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 font-mono text-[11px] list-disc list-inside">
              <li>Solar-wind flow speed (km/s)</li>
              <li>IMF Bz and By in GSM coordinates (nT)</li>
              <li>Proton density (Np, p/cm³)</li>
              <li>Flow pressure Pdyn (nPa)</li>
              <li>Electric field Ey (mV/m)</li>
              <li>Planetary Kp index and Kyoto Dst (nT)</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg border border-border bg-surface/70 space-y-2">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <span>NOAA SWPC Real-Time Solar Wind (RTSW)</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Live operational telemetry is fetched directly from the NOAA Space Weather Prediction Center (SWPC) JSON endpoints, fed by instruments aboard the DSCOVR and ACE spacecraft at L1:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 font-mono text-[11px] list-disc list-inside">
              <li>rtsw_wind_1m.json (1-minute plasma)</li>
              <li>rtsw_mag_1m.json (1-minute magnetometer)</li>
              <li>noaa-planetary-k-index.json (Kp observations)</li>
              <li>noaa-planetary-k-index-forecast.json</li>
            </ul>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-surface text-xs text-muted-foreground leading-relaxed">
          <strong>Data Cleaning Protocol: </strong>
          Standard missing-value fill codes specified in NASA OMNI2 documentation (such as 999.9 for magnetic field, 9999. for velocity, and 99 for Kp) are converted into null representations. Short gaps up to 3 hours are imputed via forward fill; larger telemetry gaps are dropped to prevent synthetic distortion of shock fronts.
        </div>
      </section>

      {/* 3. Machine-Learning Methodology & Leakage Prevention */}
      <section className="scientific-card p-6 space-y-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          3. Machine-Learning Pipeline & Leakage Prevention
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Because solar-wind measurements constitute continuous time-series data, standard random k-fold cross-validation is physically invalid due to autocorrelation and future data leakage. HelioAlert strictly uses <strong>chronological splits</strong>:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 font-mono text-xs">
          <div className="p-3 rounded-lg border border-border bg-surface">
            <div className="text-[10px] text-muted-foreground uppercase">Training Set</div>
            <div className="text-sm font-bold text-foreground mt-0.5">2018 – 2021</div>
            <div className="text-[10px] text-muted-foreground mt-1">35,064 hourly records (Solar Min)</div>
          </div>
          <div className="p-3 rounded-lg border border-border bg-surface">
            <div className="text-[10px] text-muted-foreground uppercase">Validation Set</div>
            <div className="text-sm font-bold text-solar-400 mt-0.5">2022 – 2023</div>
            <div className="text-[10px] text-muted-foreground mt-1">17,520 hours (Threshold tuning)</div>
          </div>
          <div className="p-3 rounded-lg border border-border bg-surface">
            <div className="text-[10px] text-muted-foreground uppercase">Held-Out Test Set</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">2024</div>
            <div className="text-[10px] text-muted-foreground mt-1">8,784 hours (May 2024 G5 event)</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed pt-2">
          <strong>Zero Target Leakage: </strong>
          All rolling features (speed means, Bz minimums, southward duration) use strictly historical observations at or before time <em>t</em>. The future storm target at time <em>t</em> evaluates only maximum Kp during hours [<em>t</em>+1, <em>t</em>+<em>H</em>]. The observation at hour <em>t</em> itself is never included in the target window.
        </p>
      </section>

      {/* 4. Planetary Kp Index and NOAA G-Scale */}
      <section className="scientific-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-solar-400" />
          4. Planetary Kp Index & NOAA Space Weather Scales
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The <strong>Kp index</strong> was introduced by Julius Bartels in 1949 to quantify geomagnetic disturbances on a planetary quasi-logarithmic scale from 0 to 9 in 3-hour increments. NOAA maps Kp values to the 5-level Geomagnetic Storm (G) scale:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-mono text-[10px] uppercase">
                <th className="py-2">NOAA Scale</th>
                <th className="py-2">Kp Threshold</th>
                <th className="py-2">Physical Description</th>
                <th className="py-2">Operational Impacts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-mono text-xs">
              <tr>
                <td className="py-2.5 font-bold text-sky-400">G0 (Quiet/Active)</td>
                <td className="py-2.5">Kp &lt; 5</td>
                <td className="py-2.5 text-muted-foreground">Nominal solar wind conditions</td>
                <td className="py-2.5 text-muted-foreground">Normal grid and spacecraft operations</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-yellow-400">G1 Minor</td>
                <td className="py-2.5">Kp = 5</td>
                <td className="py-2.5 text-muted-foreground">Weak grid fluctuations, auroras at 60°</td>
                <td className="py-2.5 text-muted-foreground">Migratory animals affected, minor power grid impact</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-orange-400">G2 Moderate</td>
                <td className="py-2.5">Kp = 6</td>
                <td className="py-2.5 text-muted-foreground">High-latitude power systems voltage alarms</td>
                <td className="py-2.5 text-muted-foreground">HF radio propagation fades at high latitudes</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-red-400">G3 Strong</td>
                <td className="py-2.5">Kp = 7</td>
                <td className="py-2.5 text-muted-foreground">Voltage corrections required on power grids</td>
                <td className="py-2.5 text-muted-foreground">Satellite surface charging and orientation corrections</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-red-500">G4 Severe</td>
                <td className="py-2.5">Kp = 8</td>
                <td className="py-2.5 text-muted-foreground">Widespread voltage control problems</td>
                <td className="py-2.5 text-muted-foreground">Spacecraft tracking anomalies, pipeline currents</td>
              </tr>
              <tr className="bg-red-500/10">
                <td className="py-2.5 font-bold text-red-300">G5 Extreme</td>
                <td className="py-2.5">Kp = 9</td>
                <td className="py-2.5 text-muted-foreground">Complete collapse or blackouts possible</td>
                <td className="py-2.5 text-muted-foreground">May 2024 Mother&apos;s Day storm; auroras seen in tropics</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Attributions and Legal Disclaimers */}
      <section className="scientific-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          5. Institutional Attributions & Official Disclaimer
        </h2>
        
        <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            We gratefully acknowledge the <strong>NASA Goddard Space Flight Center Space Physics Data Facility (SPDF)</strong> for providing the high-resolution OMNI2 hourly dataset via OMNIWeb (<a href="https://spdf.gsfc.nasa.gov/omniweb/" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">spdf.gsfc.nasa.gov</a>).
          </p>
          <p>
            We also acknowledge the <strong>NOAA Space Weather Prediction Center (SWPC)</strong> in Boulder, Colorado, for real-time solar wind data streams from the DSCOVR, ACE, and GOES missions (<a href="https://www.swpc.noaa.gov/" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">swpc.noaa.gov</a>).
          </p>
          
          <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 text-foreground font-medium text-xs leading-relaxed space-y-1">
            <div className="font-bold text-amber-400 uppercase tracking-wide">Scientific Notice & Independence Statement</div>
            <p className="text-muted-foreground">
              HelioAlert is an independent scientific research and educational web application developed to explore explainable machine-learning early warning systems for space weather. <strong>HelioAlert is NOT an official forecast or operational alert service of NASA, NOAA, the US Government, or any space-weather entity.</strong> Never rely on this service for mission-critical spacecraft navigation, life-critical safety decisions, aviation polar routes, or electrical utility emergency switching. For authoritative operational space-weather warnings, consult the NOAA Space Weather Prediction Center directly at <a href="https://www.swpc.noaa.gov" target="_blank" rel="noopener noreferrer" className="text-solar-400 underline">swpc.noaa.gov</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
