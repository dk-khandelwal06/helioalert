'use client';

import React, { useEffect, useState } from 'react';
import { Lightbulb, Info, Compass, Wind, Radio, Gauge, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export default function ExplainableAIPage() {
  const [modelData, setModelData] = useState<any>(null);

  useEffect(() => {
    async function fetchModel() {
      try {
        const res = await fetch('/api/model/status');
        if (res.ok) {
          const json = await res.json();
          setModelData(json.model);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchModel();
  }, []);

  const featureExplanations = [
    {
      feature: 'bz_gsm',
      name: 'Interplanetary Magnetic Field Bz (GSM)',
      weight: -0.859,
      unit: 'nT',
      physics: 'The single most critical driver of geomagnetic storms. When Bz is negative (southward), the IMF directly connects with Earth\'s northward-pointing dipole field lines on the sunward side. This opens the magnetosphere to solar wind energy injection.',
      interpretation: 'Negative values increase the odds of storm onset exponentially.'
    },
    {
      feature: 'bz_min_12h',
      name: 'Minimum Bz over Past 12 Hours',
      weight: 1.095,
      unit: 'nT (Scaled)',
      physics: 'Measures the deepest southward excursion of the magnetic field over the preceding half-day. Prolonged or intense southward episodes load massive amounts of energy into the magnetotail.',
      interpretation: 'Captures cumulative magnetic flux loading before auroral substorm release.'
    },
    {
      feature: 'southward_hours_6h',
      name: 'Hours of Southward Bz in Last 6 Hours',
      weight: 0.509,
      unit: 'Hours [0–6]',
      physics: 'Duration of uninterrupted magnetic coupling. A brief southward dip creates a localized substorm, whereas 3+ hours of persistent southward orientation triggers a planetary-scale geomagnetic storm.',
      interpretation: 'Positive coefficient: each additional hour of southward orientation increases storm probability.'
    },
    {
      feature: 'flow_speed',
      name: 'Solar-Wind Flow Speed (Velocity)',
      weight: 0.131,
      unit: 'km/s',
      physics: 'Supersonic bulk velocity of solar protons. Higher velocities increase the interplanetary electric field Ey = -V × Bz and accelerate the rate of magnetic flux transfer.',
      interpretation: 'Speeds exceeding 500 km/s elevate risk; speeds >700 km/s represent severe coronal mass ejections.'
    },
    {
      feature: 'pressure',
      name: 'Dynamic Flow Pressure (Pdyn)',
      weight: 0.501,
      unit: 'nPa',
      physics: 'Kinetic dynamic pressure P = 1.67 × 10⁻⁶ · Np · V². Sudden increases compress the dayside magnetopause inward from 10 Earth radii down to 6 Earth radii (geostationary orbit).',
      interpretation: 'High dynamic pressure compresses the magnetosphere, triggering Storm Sudden Commencements (SSC).'
    },
    {
      feature: 'kp_recent',
      name: 'Recent Planetary Kp Observation',
      weight: 2.434,
      unit: 'Kp Units [0–9]',
      physics: 'Baseline geomagnetic state prior to prediction window. Space-weather disturbances exhibit temporal autocorrelation.',
      interpretation: 'If Earth\'s magnetic field is already disturbed (Kp = 4), a smaller solar wind impulse is required to cross the G1 threshold.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border/60 pb-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-solar-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-solar-400">
            TRANSPARENT PHYSICS & STATISTICS
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
          Explainable AI: Physical Drivers of Geomagnetic Activity
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl leading-relaxed">
          HelioAlert does not treat machine learning as a black box. Every prediction is directly rooted in verified magnetohydrodynamic principles and genuine regression coefficients.
        </p>
      </div>

      {/* Physics vs Correlation Callout */}
      <div className="p-4 rounded-lg border border-sky-500/30 bg-sky-500/5 text-xs text-muted-foreground leading-relaxed space-y-2">
        <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
          <Info className="w-4 h-4 shrink-0" />
          <span>Scientific Distinction: Statistical Association vs. Physical Causation</span>
        </div>
        <p>
          While machine learning models quantify <strong>statistical associations</strong> between upstream telemetry and future Kp values, physical space-weather forecasting requires understanding the <strong>governing physical equations</strong>. Solar wind speed and IMF Bz are not merely statistical indicators; they physically govern the rate of magnetic flux transport into Earth&apos;s magnetosphere according to Faraday&apos;s and Maxwell&apos;s equations (E = &minus;v &times; B).
        </p>
      </div>

      {/* Feature Explanations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featureExplanations.map((item) => (
          <div key={item.feature} className="scientific-card p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-solar-400 font-bold">{item.feature}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-border text-foreground">
                  Weight: {item.weight > 0 ? `+${item.weight}` : item.weight}
                </span>
              </div>
              <h3 className="font-bold text-sm text-foreground mt-1.5">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {item.physics}
              </p>
            </div>

            <div className="pt-3 border-t border-border/50 text-[11px] font-mono text-sky-300">
              <strong>Model Action: </strong>
              <span className="text-muted-foreground">{item.interpretation}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Mathematical Formulation Section */}
      <div className="scientific-card p-5 space-y-3">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Layers className="w-4 h-4 text-solar-400" />
          Log-Odds Formulation & Sigmoid Transformation
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The probability of a geomagnetic storm onset (Kp &ge; 5) within the forecast horizon is computed strictly via the standard logistic sigmoid function:
        </p>
        <div className="p-3 rounded-lg bg-surface border border-border font-mono text-center text-xs text-foreground">
          P(Kp &ge; 5.0) = 1 / [1 + exp(-(β₀ + &Sigma; βᵢ &middot; (xᵢ - μᵢ) / σᵢ))]
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Where &mu;ᵢ and &sigma;ᵢ are pre-computed feature means and standard deviations from the NASA OMNI2 training period (2018&ndash;2021). The resulting probability represents an uncalibrated Bayesian posterior that is compared against validation-tuned decision thresholds.
        </p>
      </div>
    </div>
  );
}
