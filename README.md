# AERO-AGRI // AI — Weather-Based Air Temperature Forecasting Web Platform

An ultra-modern, luxury dark-themed web platform for **Next-Hour Air Temperature Forecasting (t+1)** in **Smart Protected Agriculture**, built for the **SLIIT IT2011 AI/ML Final Evaluation (Group 2026-Y2-S1-MLB-B9G2-01)**.

---

## 🌟 Visual Theme & Design Language
Inspired by modern dark luxury interfaces (GolfX, MOSS, and Nocturnal Telemetry UIs):
- **Deep Nocturnal Organic Palette**: Rich obsidian greens (`#070B09`, `#0D1410`), dense moss surfaces (`#1A3828`), and electric neon citron/lime accents (`#D2F82E`).
- **Atmospheric Glow & Glassmorphism**: Translucent frosted cards (`backdrop-filter: blur(28px)`), subtle glowing borders, and drop shadows.
- **Modern Typography**: Google Fonts (*Plus Jakarta Sans*, *Space Grotesk*, and *JetBrains Mono*).

---

## 🚀 Key Interactive Features

1. **Live Atmospheric Telemetry & Station Feed**:
   - Szeged Meteorological Observatory telemetry (46.25°N, 20.14°E).
   - Real-time current temperature ($T_t$), barometric pressure, relative humidity, and wind speed.
   - **AI Actuation Tip Widget**: Dynamic advisory card monitoring diurnal cooling and triggering automated thermal screens with an asymmetric $+1.5^\circ\text{C}$ frost recall safety offset.

2. **Interactive Real-Time Inference Simulator**:
   - 5 interactive sliders (Temperature, Humidity, Pressure, Wind Speed, Diurnal Hour).
   - 4 pre-configured scenario presets:
     - 🌸 *Spring Blossom Night (Frost Alert)*
     - ☀️ *Midsummer Heatwave Peak*
     - 🌧️ *Autumn Frontal Low Pressure*
     - ❄️ *Sub-Zero Continental Freeze*
   - Real-time multi-model consensus breakdown showing predicted next-hour temperature ($T_{t+1}$) for all 6 group models.
   - Dynamic agricultural hazard advisory (Frost hazard actuation, heat stress ventilation, or nominal monitoring).

3. **24-Hour Diurnal Forecast Interactive Chart**:
   - Native responsive SVG chart tracking actual vs predicted temperatures over a 24-hour cycle.
   - Interactive hover crosshair tooltip showing exact hourly residual.
   - Model switcher buttons to compare the continuous approximation of the **Multi-Layer Perceptron (MLP)** vs **Random Forest** vs **Decision Tree piecewise steps** vs **SVR margin**.

4. **Master Group Benchmark Leaderboard**:
   - Complete performance cards for all 6 members with exact audited metrics:
     - **#1 Random Forest (RF-1: Default)** — Diyes C.L. ($R^2 = 0.9331$, $\text{RMSE} = 2.4836^\circ\text{C}$)
     - **#2 Random Forest (RF-3: Tuned n=150)** — Diyes C.L. ($R^2 = 0.9324$, $\text{RMSE} = 2.4967^\circ\text{C}$)
     - **#3 Deep MLP (MLP-2: [128, 64, 32])** — Gunathilaka H.D.T.T. ($R^2 = 0.9151$, $\text{RMSE} = 2.7970^\circ\text{C}$)
     - **#4 Tuned MLP (MLP-3: [128, 64])** — Gunathilaka H.D.T.T. ($R^2 = 0.9133$, $\text{RMSE} = 2.8266^\circ\text{C}$ / with lags $R^2 = 0.9876$)
     - **#5 Support Vector Regression (SVR-3: RBF)** — Dissanayake S.A.S.D. ($R^2 = 0.8913$, $\text{RMSE} = 3.1500^\circ\text{C}$)
     - **#6 Gradient Boosting (GB-3: Cyclical)** — Zeen A.C. ($R^2 = 0.8846$, $\text{RMSE} = 3.2610^\circ\text{C}$)
     - **#7 Decision Tree (DT-3: Pruned Optimal)** — Gayathmi P.G.R. ($R^2 = 0.8759$, $\text{RMSE} = 3.3731^\circ\text{C}$)
     - **#8 Linear Regression (LR-1: OLS Baseline)** — Anaf M.K.A.S. ($R^2 = 0.8614$, $\text{RMSE} = 3.5750^\circ\text{C}$)

5. **6-Stage Preprocessing Pipeline Interactive Flow**:
   - Stage 01: Data Cleaning - Duplicate Removal & Wind Stall Artifacts (Zeen A.C.)
   - Stage 02: Missing Data Handling - Precip Type Imputation (Dissanayake S.A.S.D.)
   - Stage 03: Outlier Removal - 4,400 Pressure Stalls via IQR (Diyes C.L.)
   - Stage 04: Feature Engineering - Leakage Removal & Time Extraction (Anaf M.K.A.S.)
   - Stage 05: Categorical Encoding - Precip Type & Summary (Gayathmi P.G.R.)
   - Stage 06: Feature Scaling - StandardScaler Normalization (Gunathilaka H.D.T.T.)

6. **Ethical Safeguards & Autonomous Actuation**:
   - Asymmetric Loss Function (+1.5°C margin prioritizing frost recall over precision).
   - Domain shift analysis for tropical agriculture.
   - Sensor fault tolerance gateway.

---

## 🖥️ How to Run Locally

### Option 1: Direct File Open
Simply double-click `index.html` or open it in any modern browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server (Already Running)
Access directly at:
```
http://localhost:8085
```
Or start via terminal:
```bash
python -m http.server 8085
```
