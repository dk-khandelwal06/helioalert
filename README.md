# HELIOALERT

**"Will the Sun disturb Earth's magnetic field in the next few hours?"**

HelioAlert is a scientific, explainable space-weather intelligence and geomagnetic storm early-warning platform. It estimates whether the planetary Kp index will reach 5 or higher (the NOAA G1 Minor Geomagnetic Storm threshold) over the next 3, 6, 12, or 24 hours using recent solar-wind measurements and genuinely trained machine-learning models.

---

## 1. System Overview

HelioAlert combines historical NASA satellite observations with live NOAA space-weather feeds:

1. **NASA SPDF OMNI2 Historical Dataset**: Multi-year hourly telemetry spanning Solar Cycles 24 and 25 (including the historic May 2024 G5 storm).
2. **NOAA SWPC Real-Time Feeds**: Live 1-minute solar-wind plasma and interplanetary magnetic field (IMF) streams from the DSCOVR and ACE spacecraft at the Sun-Earth L1 Lagrange point.
3. **Genuinely Trained Machine Learning**: Class-weighted Logistic Regression classifier with StandardScaler and threshold tuning, evaluated with zero time-series data leakage.
4. **Interactive 3D Solar System & Magnetosphere**: Real-time Three.js visualization of incoming solar-wind particles, bow shock standoff compression, and dayside magnetic reconnection.
5. **Historical Storm Replay**: Interactive hour-by-hour timeline replay of the May 10–12, 2024 Mother's Day G5 superstorm.
6. **Transparent Model Performance Observatory**: Full display of confusion matrices, PR-AUC, ROC-AUC, True Skill Statistic (TSS), and baseline comparisons.

---

## 2. Appearance Modes

HelioAlert implements three appearance modes:
- **Deep Space (Dark)**: Deep-space navy (`#060B19`) with high-contrast glowing telemetry.
- **Graphite (Medium)**: Balanced slate and graphite (`#182234`) for technical monitoring rooms.
- **Solar Day (Light)**: Crisp ivory and clean slate (`#F4F6FA`) for daylight research.

Theme preference is persisted across browser sessions via `localStorage`.

---

## 3. Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React icons.
- **Visualization**: Recharts for scientific time-series, Three.js for 3D orbital space and magnetosphere graphics.
- **Backend**: Next.js Server-Side Route Handlers, in-memory caching (60s TTL), stale-data detection.
- **Machine Learning**: Python 3.13, Scikit-learn, Pandas, NumPy.
- **Inference**: High-speed, zero-dependency server-side TypeScript reproducing Python Scikit-Learn Logistic Regression with mathematical parity.

---

## 4. Local Development Quickstart

### Prerequisites
- Node.js 18+ (tested on Node v20/v26)
- Python 3.10+ with `numpy`, `pandas`, `scikit-learn`

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/helioalert.git
   cd helioalert
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Install Python dependencies (for ML retraining)**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the ML Training Pipeline (Optional - Pre-trained artifacts are included)**:
   ```bash
   python ml/scripts/train_and_export.py
   ```

5. **Start the Next.js Development Server**:
   ```bash
   npm run dev
   ```

6. **Open in your browser**:
   ```
   http://localhost:3000
   ```

---

## 5. Machine Learning Pipeline & Metrics

### Dataset & Partition
- **Training Period**: 2018–2021 (35,064 hourly records)
- **Validation Period**: 2022–2023 (17,520 hourly records; used for optimal decision threshold tuning)
- **Held-Out Test Period**: 2024 (8,784 hourly records; includes the May 2024 G5 storm)

### Test Evaluation Results (3-Hour Lead Time)
- **Base Rate (Storm Frequency)**: 4.15%
- **PR-AUC (Average Precision)**: 0.767
- **ROC-AUC**: 0.977
- **True Skill Statistic (TSS)**: +0.834
- **Recall (True Positive Rate)**: 87.7%
- **Precision**: 46.5% (outstanding performance under 4.15% extreme class imbalance)
- **False Alarm Rate (FPR)**: 4.38%

---

## 6. Deployment to Vercel

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your `helioalert` repository.
4. **Framework Preset**: Next.js.
5. **Root Directory**: `./` (default).
6. **Build Command**: `npm run build` (default).
7. Deploy! Vercel automatically deploys the server-side API routes and static assets. No external database or paid API keys are required for v1.

---

## 7. Data Attribution & Scientific Disclaimer

- **NASA Goddard Space Flight Center SPDF**: OMNI2 hourly dataset via OMNIWeb.
- **NOAA Space Weather Prediction Center (SWPC)**: Real-time solar-wind plasma and magnetometer feeds.

> **DISCLAIMER**: HelioAlert is an independent, educational, and experimental early-warning system. It is **NOT** an official NOAA SWPC operational forecast or warning service. Never use HelioAlert for critical life-safety, aviation routing, or power-grid switching without operational NOAA verification.

