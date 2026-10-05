# AERO-AGRI // MISSION CONTROL OS 26 🌦️🛰️
### Weather-Based Air Temperature Forecasting Web Platform for Smart Agriculture

> **SLIIT — Faculty of Computing | Department of Computer Science & Software Engineering**  
> **Module:** IT2011 — Artificial Intelligence & Machine Learning (2026 / Y2S1)  
> **Group:** `2026-Y2-S1-MLB-B9G2-01`  
> **Dataset:** Szeged Meteorological Weather Archive (96,429 observations over 11 years, 2006–2016)

---

## 🚀 Overview

**AERO-AGRI OS 26** is a mission-control command center web platform built with **Next.js (App Router)** and **TypeScript**, powered by **GSAP** physics and animations, and styled in an ultra-sleek **iOS 26 / visionOS Liquid Glass** aesthetic with **Helvetica Neue** typography.

The platform provides real-time thermodynamic simulation, 24-hour diurnal thermal volume tracking, sensor anomaly isolation telemetry, and comparative model schematics benchmarking six core algorithmic paradigms evaluated in our academic research:

1. **Random Forest Regression (RF-1)** — *Diyes C.L. (`IT25100263`)*: $R^2 = 0.9331$, $\text{RMSE} = 2.48^\circ\text{C}$ (100 Decision Trees).
2. **Deep Multilayer Perceptron (MLP-2)** — *Gunathilaka H.D.T.T. (`IT25101540`)*: $R^2 = 0.9151$ (Baseline) / $0.9876$ (Autoregressive Lag Features), $\text{RMSE} = 2.79^\circ\text{C}$ ($[128, 64, 32]$ architecture with Adam optimizer).
3. **Gradient Boosting Machine (GB-3)** — *Zeen A.C. (`IT25103342`)*: $R^2 = 0.8846$, $\text{RMSE} = 3.26^\circ\text{C}$ (Cyclical trigonometric temporal transforms).
4. **Support Vector Regression (SVR-4)**: $R^2 = 0.8912$, $\text{RMSE} = 3.15^\circ\text{C}$ (Radial Basis Function Kernel).
5. **Decision Tree Regressor (DT-5)**: $R^2 = 0.8350$, $\text{RMSE} = 3.89^\circ\text{C}$.
6. **Multiple Linear Regression (LR-6)**: $R^2 = 0.7410$, $\text{RMSE} = 4.88^\circ\text{C}$ (Standard benchmark).

---

## 🎨 Visual Design & UI System

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Client Components, Server-Side Rendering support).
- **Language**: TypeScript (`.tsx`, `.ts`) with strict type safety.
- **Aesthetic**: **iOS 26 / visionOS Liquid Glass** (`backdrop-filter: blur(34px) saturate(190%)`, multi-layer specular highlights, squircle cards).
- **Typography**: `Helvetica Neue` (`font-family: "Helvetica Neue", -apple-system, BlinkMacSystemFont, sans-serif`).
- **Animations**: [GSAP 3](https://gsap.com/) for:
  - 360° continuous radar sweep beam with origin transforms.
  - Floating levitation physics on the central target beacon.
  - Smooth numerical tweening on slider changes.
  - Physical actuator shockwave pulse and cockpit aura flashes.
- **Icons**: Clean, minimalist **SVG Vector Icons** (strictly zero emojis in controls).
- **Satellite Map**: Photorealistic high-resolution topographic satellite imagery background overlaid with vector radar pulse rings and meteorological station beacons.

---

## 🛠️ Local Development & Quick Start

### 1. Prerequisites
- **Node.js** >= 18.17 (Verified on Node `v24.21.0`)
- **npm** (Run commands using `npm.cmd` on Windows)

### 2. Installation
```bash
npm install
# Note: On Windows PowerShell if script execution is restricted, run:
npm.cmd install
```

### 3. Start Development Server
```bash
npm run dev
# Or on Windows:
npm.cmd run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Build for Production
```bash
npm run build
# Or on Windows:
npm.cmd run build
```

---

## 📂 Project Structure

```
WeatherAI_WebPlatform/
├── public/
│   ├── assets/
│   │   └── satellite_terrain.jpg    # High-resolution satellite terrain texture
│   └── satellite_terrain.jpg
├── src/
│   └── app/
│       ├── globals.css              # iOS 26 Liquid Glass & Helvetica Neue styling
│       ├── layout.tsx               # Root layout & page metadata
│       └── page.tsx                 # Interactive Next.js TypeScript Command Center
├── next.config.ts                   # Next.js configuration
├── tsconfig.json                    # TypeScript compiler configuration
├── package.json                     # Dependencies (Next.js, React, GSAP, TypeScript)
└── README.md
```

---

## 👥 Research Group Members
- **Gunathilaka H.D.T.T.** — `IT25101540` (Neural Network / MLP Modeling)
- **Diyes C.L.** — `IT25100263` (Random Forest Ensemble)
- **Zeen A.C.** — `IT25103342` (Gradient Boosting & Cyclical Features)

---
*Built with ❤️ for smart agriculture microclimate intelligence.*
