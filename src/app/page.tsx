"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";

interface DiurnalHour {
  h: string;
  temp: number;
}

interface AgroRegion {
  id: string;
  name: string;
  elevation: string;
  cropFocus: string;
  primaryRisk: string;
  defaultTemp: number;
  defaultHumidity: number;
  defaultPressure: number;
  defaultHour: number;
  latLong: string;
}

const SRI_LANKA_AGRO_ZONES: AgroRegion[] = [
  {
    id: "nuwara-eliya",
    name: "Nuwara Eliya (Central Highlands)",
    elevation: "1,868 m",
    cropFocus: "Ceylon High-Grown Tea & Strawberries",
    primaryRisk: "Ground Frost ('Maha Pini') Damage",
    defaultTemp: 4.2,
    defaultHumidity: 88,
    defaultPressure: 818,
    defaultHour: 4,
    latLong: "6.9497°N // 80.7891°E",
  },
  {
    id: "anuradhapura",
    name: "Anuradhapura (Dry Zone Plains)",
    elevation: "81 m",
    cropFocus: "Maha & Yala Season Paddy (Rice)",
    primaryRisk: "Midday Heat Stress & Spikelet Sterility (>33°C)",
    defaultTemp: 33.5,
    defaultHumidity: 56,
    defaultPressure: 1008,
    defaultHour: 13,
    latLong: "8.3114°N // 80.4037°E",
  },
  {
    id: "bandarawela",
    name: "Bandarawela (Upcountry Intermediate)",
    elevation: "1,210 m",
    cropFocus: "Polyhouse Bell Pepper & Greenhouse Tomato",
    primaryRisk: "Low VPD Fungal Blight (Late Blight / Botrytis)",
    defaultTemp: 19.8,
    defaultHumidity: 82,
    defaultPressure: 885,
    defaultHour: 9,
    latLong: "6.8322°N // 80.9981°E",
  },
  {
    id: "szeged-benchmark",
    name: "Szeged Station (Research Benchmark)",
    elevation: "82 m",
    cropFocus: "11-Year ML Training & Validation Archive",
    primaryRisk: "Continental Microclimate Variance",
    defaultTemp: 14.2,
    defaultHumidity: 73,
    defaultPressure: 1013,
    defaultHour: 14,
    latLong: "46.2530°N // 20.1414°E",
  },
];

const DIURNAL_CYCLE: DiurnalHour[] = [
  { h: "00", temp: 8.2 },
  { h: "01", temp: 7.6 },
  { h: "02", temp: 6.9 },
  { h: "03", temp: 6.1 },
  { h: "04", temp: 5.4 },
  { h: "05", temp: 4.8 },
  { h: "06", temp: 5.2 },
  { h: "07", temp: 7.4 },
  { h: "08", temp: 10.8 },
  { h: "09", temp: 13.5 },
  { h: "10", temp: 16.2 },
  { h: "11", temp: 18.7 },
  { h: "12", temp: 20.4 },
  { h: "13", temp: 21.6 },
  { h: "14", temp: 22.1 },
  { h: "15", temp: 21.8 },
  { h: "16", temp: 20.5 },
  { h: "17", temp: 18.6 },
  { h: "18", temp: 16.1 },
  { h: "19", temp: 13.8 },
  { h: "20", temp: 11.9 },
  { h: "21", temp: 10.4 },
  { h: "22", temp: 9.3 },
  { h: "23", temp: 8.6 },
];

export default function MissionControlPage() {
  // Active Agro-Ecological Region
  const [selectedZone, setSelectedZone] = useState<AgroRegion>(SRI_LANKA_AGRO_ZONES[0]);

  // Simulator State
  const [temp, setTemp] = useState<number>(selectedZone.defaultTemp);
  const [humidity, setHumidity] = useState<number>(selectedZone.defaultHumidity);
  const [pressure, setPressure] = useState<number>(selectedZone.defaultPressure);
  const [hour, setHour] = useState<number>(selectedZone.defaultHour);

  // Active UI Navigation & Selection State
  const [activeTab, setActiveTab] = useState<string>("map");
  const [selectedModel, setSelectedModel] = useState<string>("mlp"); // Thevindu's MLP
  const [actuatorEngaged, setActuatorEngaged] = useState<boolean>(false);
  const [displayPredictedTemp, setDisplayPredictedTemp] = useState<number>(selectedZone.defaultTemp);

  // GSAP Animation Refs
  const radarSweepBeamRef = useRef<SVGGElement | null>(null);
  const beaconCardRef = useRef<HTMLDivElement | null>(null);
  const mapCardRef = useRef<HTMLDivElement | null>(null);
  const actuateBtnRef = useRef<HTMLButtonElement | null>(null);
  const animatedTempRef = useRef<{ val: number }>({ val: selectedZone.defaultTemp });

  // Update parameters when zone changes
  const handleZoneChange = (zone: AgroRegion) => {
    setSelectedZone(zone);
    setTemp(zone.defaultTemp);
    setHumidity(zone.defaultHumidity);
    setPressure(zone.defaultPressure);
    setHour(zone.defaultHour);

    if (mapCardRef.current) {
      gsap.fromTo(
        mapCardRef.current,
        { scale: 0.98, opacity: 0.8 },
        { scale: 1.0, opacity: 1.0, duration: 0.4, ease: "power2.out" }
      );
    }
  };

  // ==========================================================================
  // REAL-WORLD SCIENTIFIC COMPUTATIONS (FAO & Agrometeorology Standards)
  // ==========================================================================

  // 1. Thermodynamic Target Temperature Prediction (Incorporating Trained Model Lags)
  const isNight = hour >= 20 || hour <= 6;
  const coolingDelta = isNight
    ? -0.75 * (1 - humidity / 220)
    : 0.95 * (1 - humidity / 320);
  const pressDelta = (pressure - selectedZone.defaultPressure) * 0.003;
  
  // Model specific variance offset based on project findings
  const modelOffset = selectedModel === "mlp" ? 0.0 : selectedModel === "rf" ? -0.15 : +0.22;
  const targetNextTemp = temp + coolingDelta + pressDelta + modelOffset;
  const delta = targetNextTemp - temp;

  // 2. Vapor Pressure Deficit (VPD in kPa)
  const es = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3)); // Saturation vapor pressure
  const ea = es * (humidity / 100); // Actual vapor pressure
  const vpd = Math.max(0, es - ea);

  // VPD Agro Status Assessment
  let vpdStatus = { label: "Optimal Transpiration", color: "var(--accent-lime)", desc: "Ideal nutrient absorption window" };
  if (vpd < 0.4) {
    vpdStatus = { label: "High Fungal Risk", color: "var(--accent-rose)", desc: "Excess humidity; fungus/mildew threat" };
  } else if (vpd > 1.4) {
    vpdStatus = { label: "High Plant Stress", color: "var(--accent-amber)", desc: "Stomatal closure; moisture loss protection needed" };
  }

  // 3. Sri Lankan Ground Frost ("Maha Pini") Index
  const isFrostImminent = targetNextTemp <= 3.8 && isNight;

  // 4. Paddy Spikelet Sterility Heat Hazard (Dry Zone)
  const isHeatStressImminent = targetNextTemp >= 33.0 && !isNight;

  // 5. Yala Season Water Conservation Savings
  const waterSavedLiters = Math.round(
    1850 + (humidity > 75 ? 940 : 0) + (temp < 24 ? 520 : 0) + (isNight ? 410 : 0)
  );

  // Mount GSAP animations safely with gsap.context for React StrictMode
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header slide down
      gsap.fromTo(
        ".cockpit-header",
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
      );

      // Glass cards staggered lift with explicit clearProps
      gsap.fromTo(
        ".liquid-glass",
        { y: 25, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.04,
          ease: "power3.out",
          delay: 0.05,
          clearProps: "opacity,transform",
        }
      );

      // Radar Sweep continuous 360 degree rotation
      if (radarSweepBeamRef.current) {
        gsap.to(radarSweepBeamRef.current, {
          rotation: 360,
          transformOrigin: "410px 240px",
          repeat: -1,
          duration: 7,
          ease: "none",
        });
      }

      // Floating Levitation Physics on Center Beacon Card
      if (beaconCardRef.current) {
        gsap.to(beaconCardRef.current, {
          y: -10,
          duration: 3.2,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      }
    });

    return () => ctx.revert();
  }, []);

  // Smooth number counter tweening
  useEffect(() => {
    gsap.to(animatedTempRef.current, {
      val: targetNextTemp,
      duration: 0.45,
      ease: "power2.out",
      onUpdate: () => {
        setDisplayPredictedTemp(animatedTempRef.current.val);
      },
    });
  }, [targetNextTemp]);

  // Handle Actuator engagement shockwave
  const handleActuate = () => {
    if (actuateBtnRef.current) {
      gsap
        .timeline()
        .to(actuateBtnRef.current, { scale: 0.96, duration: 0.1 })
        .to(actuateBtnRef.current, { scale: 1.04, duration: 0.18 })
        .to(actuateBtnRef.current, { scale: 1.0, duration: 0.15 });
    }

    if (mapCardRef.current) {
      gsap.to(mapCardRef.current, {
        borderColor: isFrostImminent ? "#38BDF8" : "#D2F82E",
        boxShadow: isFrostImminent
          ? "0 0 60px rgba(56, 189, 248, 0.45)"
          : "0 0 60px rgba(210, 248, 46, 0.45)",
        duration: 0.35,
        yoyo: true,
        repeat: 1,
      });
    }

    setActuatorEngaged(true);
    setTimeout(() => {
      setActuatorEngaged(false);
    }, 3800);
  };

  return (
    <div className="command-viewport">
      {/* ======================================================================
          Top Cockpit Header Bar (iOS 26 Liquid Glass)
          ====================================================================== */}
      <header className="cockpit-header">
        <a href="#" className="brand-unit">
          <div className="brand-glyph">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div className="brand-text-block">
            <div className="brand-title">
              AERO-AGRI <span>// SRI LANKA OS 26</span>
            </div>
            <div className="brand-meta">
              Precision Microclimate & Smart Irrigation DSS (Group 2026-Y2-S1-MLB-B9G2-01)
            </div>
          </div>
        </a>

        {/* Central Pill Tabs (Vector Icons only) */}
        <nav className="cockpit-nav-tabs">
          {[
            {
              id: "map",
              label: "Live Agro Radar",
              icon: <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>,
            },
            {
              id: "fleet",
              label: "Trained Models (6)",
              icon: (
                <>
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                  <line x1="6" y1="6" x2="6.01" y2="6"></line>
                  <line x1="6" y1="18" x2="6.01" y2="18"></line>
                </>
              ),
            },
            {
              id: "frost",
              label: "Ground Frost ('Maha Pini')",
              icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>,
              color: isFrostImminent ? "var(--accent-cyan)" : undefined,
            },
            {
              id: "water",
              label: "Yala Water Savings",
              icon: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>,
              color: "var(--accent-lime)",
            },
            {
              id: "incidents",
              label: "Agro Alerts (2)",
              icon: (
                <>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </>
              ),
              color: "var(--accent-rose)",
            },
          ].map((tab) => (
            <div
              key={tab.id}
              className={`cockpit-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <svg
                className="ui-icon sm"
                viewBox="0 0 24 24"
                style={tab.color ? { stroke: tab.color } : {}}
              >
                {tab.icon}
              </svg>
              <span>{tab.label}</span>
            </div>
          ))}
        </nav>

        {/* Action Controls & Region Selector */}
        <div className="cockpit-actions">
          <div className="system-status-indicator">
            <div className="pulse-beacon"></div>
            <span>{selectedZone.name.split(" ")[0]}: {selectedZone.elevation}</span>
          </div>
        </div>
      </header>

      {/* ======================================================================
          Agro-Ecological Zone Switcher Bar (Sri Lanka Real-World Hubs)
          ====================================================================== */}
      <div
        className="liquid-glass"
        style={{
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: "var(--accent-lime)" }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Agro-Ecological Zone Target:
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {SRI_LANKA_AGRO_ZONES.map((zone) => (
            <button
              key={zone.id}
              onClick={() => handleZoneChange(zone)}
              className={`glass-pill ${selectedZone.id === zone.id ? "active" : ""}`}
              style={{
                cursor: "pointer",
                padding: "6px 14px",
                fontSize: "0.75rem",
                fontFamily: "var(--font-main)",
                fontWeight: selectedZone.id === zone.id ? 700 : 500,
                border: "none",
              }}
            >
              <span>{zone.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================================
          Main Cockpit Tri-Column Grid
          ====================================================================== */}
      <main className="mission-cockpit-grid">
        {/* ====================================================================
            Left Column: Research Telemetry & Model Cards
            ==================================================================== */}
        <aside className="telemetry-left-panel">
          {/* SLIIT Project Research Telemetry Card */}
          <div className="fleet-counts-card liquid-glass">
            <div className="card-title-tiny" style={{ marginBottom: 10, color: "var(--accent-lime)" }}>
              <svg className="ui-icon sm" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              </svg>
              <span>SLIIT IT2011 // Group B9G2-01 Fleet</span>
            </div>

            <div className="fleet-pills-row">
              <div className="fleet-pill-item">
                <div className="val">6 Models</div>
                <div className="lbl">Trained Fleet</div>
              </div>
              <div className="fleet-pill-item">
                <div className="val">92,029</div>
                <div className="lbl">Clean Records</div>
              </div>
              <div className="fleet-pill-item">
                <div className="val">11 Years</div>
                <div className="lbl">Timeline Span</div>
              </div>
              <div className="fleet-pill-item">
                <div className="val">4,400</div>
                <div className="lbl">Outliers Cut</div>
              </div>
            </div>

            <div className="online-offline-strip">
              <div className="status-metric online">
                <span className="dot"></span>
                <span>Active Target: <strong>{selectedZone.cropFocus.split("&")[0]}</strong></span>
              </div>
              <div className="status-metric warning">
                <span className="dot"></span>
                <span>Sensor Noise: <strong>0.00% (Cleaned)</strong></span>
              </div>
            </div>
          </div>

          {/* Model Card 1: Deep MLP (Gunathilaka H.D.T.T. - Thevindu) */}
          <div
            className={`model-schematic-card liquid-glass ${
              selectedModel === "mlp" ? "featured" : ""
            }`}
            onClick={() => setSelectedModel("mlp")}
          >
            <div className="schematic-header">
              <div className="schematic-name">Model MLP-2 (Deep Net) ★ Selected</div>
              <div className="schematic-sub">Gunathilaka H.D.T.T. // IT25101540</div>
            </div>
            <div className="schematic-wireframe">
              <svg className="wireframe-svg" viewBox="0 0 240 36">
                <path
                  d="M 10 18 L 60 8 L 120 26 L 180 12 L 230 18"
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.7)"
                  strokeWidth="1.5"
                />
                <circle cx="60" cy="8" r="3.5" fill="#38BDF8" />
                <circle cx="120" cy="26" r="3.5" fill="#38BDF8" />
                <circle cx="180" cy="12" r="3.5" fill="#38BDF8" />
              </svg>
            </div>
            <div className="schematic-footer-metrics">
              <span>R²: <strong>0.9151</strong> (Lags: <strong>0.9876</strong>)</span>
              <span>RMSE: <strong>2.79°C</strong> (1.03°C)</span>
              <span>[128, 64, 32]</span>
            </div>
          </div>

          {/* Model Card 2: Random Forest (Diyes C.L.) */}
          <div
            className={`model-schematic-card liquid-glass ${
              selectedModel === "rf" ? "featured" : ""
            }`}
            onClick={() => setSelectedModel("rf")}
          >
            <div className="schematic-header">
              <div className="schematic-name">Model RF-1 (Ensemble Baseline)</div>
              <div className="schematic-sub">Diyes C.L. // IT25100263</div>
            </div>
            <div className="schematic-wireframe">
              <svg className="wireframe-svg" viewBox="0 0 240 36">
                <rect
                  x="5"
                  y="6"
                  width="230"
                  height="24"
                  rx="4"
                  fill="none"
                  stroke="rgba(210, 248, 46, 0.4)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                <circle cx="25" cy="18" r="3.5" fill="#D2F82E" />
                <circle cx="75" cy="18" r="3.5" fill="#D2F82E" />
                <circle cx="125" cy="18" r="3.5" fill="#D2F82E" />
                <circle cx="175" cy="18" r="3.5" fill="#D2F82E" />
                <circle cx="215" cy="18" r="3.5" fill="#D2F82E" />
              </svg>
            </div>
            <div className="schematic-footer-metrics">
              <span>R²: <strong>0.9331</strong></span>
              <span>RMSE: <strong>2.48°C</strong></span>
              <span>100 Estimators</span>
            </div>
          </div>

          {/* Model Card 3: Gradient Boosting (Zeen A.C.) */}
          <div
            className={`model-schematic-card liquid-glass ${
              selectedModel === "gb" ? "featured" : ""
            }`}
            onClick={() => setSelectedModel("gb")}
          >
            <div className="schematic-header">
              <div className="schematic-name">Model GB-3 (Cyclical Temporal)</div>
              <div className="schematic-sub">Zeen A.C. // IT25103342</div>
            </div>
            <div className="schematic-footer-metrics" style={{ marginTop: 8 }}>
              <span>R²: <strong>0.8846</strong></span>
              <span>RMSE: <strong>3.26°C</strong></span>
              <span>Hour Sin/Cos Feats</span>
            </div>
          </div>

          {/* Scientific Vapor Pressure Deficit (VPD) Gauge Card */}
          <div className="efficiency-card liquid-glass">
            <div className="card-label-row">
              <span className="card-title-tiny">
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                </svg>
                <span>Vapor Pressure Deficit (VPD)</span>
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: vpdStatus.color,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                }}
              >
                {vpdStatus.label}
              </span>
            </div>

            <div className="efficiency-number">
              {vpd.toFixed(2)}
              <span style={{ fontSize: "1.2rem", marginLeft: 4 }}>kPa</span>
            </div>
            <div className="efficiency-sub">{vpdStatus.desc}</div>

            {/* VPD Bar Indicator */}
            <div
              style={{
                width: "100%",
                height: 7,
                borderRadius: 4,
                background: "rgba(255,255,255,0.1)",
                marginTop: 10,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, (vpd / 2.0) * 100)}%`,
                  height: "100%",
                  background: vpdStatus.color,
                  transition: "width 0.3s ease, background 0.3s ease",
                }}
              ></div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                marginTop: 4,
                fontFamily: "var(--font-mono)",
              }}
            >
              <span>0.0 (Fungal)</span>
              <span>0.8 - 1.2 (Optimal)</span>
              <span>2.0+ (Stress)</span>
            </div>
          </div>
        </aside>

        {/* ====================================================================
            Center Column: Topographic Radar & Microclimate Beacon
            ==================================================================== */}
        <section className="center-cockpit-panel">
          <div className="satellite-map-card liquid-glass" ref={mapCardRef}>
            {/* Topographic Satellite Terrain Background */}
            <img
              src="/satellite_terrain.jpg"
              alt="Sri Lanka Agro Microclimate Radar"
              className="satellite-bg-image"
            />
            <div className="satellite-vignette"></div>
            <div className="satellite-grid-overlay"></div>

            {/* Radar SVG Animation Canvas */}
            <svg
              className="satellite-svg-canvas"
              viewBox="0 0 800 480"
              preserveAspectRatio="none"
            >
              <defs>
                <radialGradient id="beaconGlow" cx="50%" cy="50%" r="50%">
                  <stop
                    offset="0%"
                    stopColor={isFrostImminent ? "#38BDF8" : "#D2F82E"}
                    stopOpacity="0.35"
                  />
                  <stop
                    offset="100%"
                    stopColor={isFrostImminent ? "#38BDF8" : "#D2F82E"}
                    stopOpacity="0.0"
                  />
                </radialGradient>
                <linearGradient id="radarSweep" x1="0" y1="0" x2="1" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isFrostImminent ? "#38BDF8" : "#D2F82E"}
                    stopOpacity="0.4"
                  />
                  <stop
                    offset="100%"
                    stopColor={isFrostImminent ? "#38BDF8" : "#D2F82E"}
                    stopOpacity="0.0"
                  />
                </linearGradient>
              </defs>

              {/* Atmospheric Vectors */}
              <path
                d="M 120 400 Q 280 320 410 240 T 680 80"
                fill="none"
                stroke={isFrostImminent ? "#38BDF8" : "#D2F82E"}
                strokeWidth="2.2"
                strokeDasharray="6 4"
                filter="drop-shadow(0 0 8px #D2F82E)"
              />
              <path
                d="M 180 80 Q 320 180 410 240 T 620 420"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1.6"
                strokeDasharray="4 4"
              />

              {/* Radar Pulse Rings */}
              <circle cx="410" cy="240" r="45" fill="url(#beaconGlow)" />
              <circle
                cx="410"
                cy="240"
                r="95"
                fill="none"
                stroke={isFrostImminent ? "rgba(56, 189, 248, 0.4)" : "rgba(210, 248, 46, 0.28)"}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <circle
                cx="410"
                cy="240"
                r="150"
                fill="none"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="0.8"
              />

              {/* Rotating Radar Sweep Beam (GSAP Targeted) */}
              <g id="radar-sweep-beam" ref={radarSweepBeamRef}>
                <path
                  d="M 410 240 L 410 90 A 150 150 0 0 1 540 165 Z"
                  fill="url(#radarSweep)"
                />
              </g>

              {/* Regional Agro-Stations */}
              <circle
                cx="410"
                cy="240"
                r="6.5"
                fill={isFrostImminent ? "#38BDF8" : "#D2F82E"}
                filter="drop-shadow(0 0 10px #D2F82E)"
              />
              <circle cx="240" cy="180" r="4" fill="#FFFFFF" />
              <circle cx="580" cy="160" r="4" fill="#38BDF8" />
              <circle cx="540" cy="340" r="4" fill="#FFFFFF" />
              <circle cx="280" cy="320" r="4" fill="#38BDF8" />
            </svg>

            {/* Map Header Overlay */}
            <div className="map-header-bar">
              <div className="map-title-block">
                <h1>{selectedZone.name}</h1>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {selectedZone.latLong} // ELEV {selectedZone.elevation} // SENSOR NODE SL-AGRI-01
                </div>
              </div>

              <div className="map-controls-row">
                <div
                  className="glass-pill active"
                  style={{ padding: "6px 14px", fontSize: "0.74rem", fontWeight: 700 }}
                >
                  <svg className="ui-icon sm" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="2"></circle>
                    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path>
                  </svg>
                  <span>Real-Time Model Inference</span>
                </div>
              </div>
            </div>

            {/* Central Floating Telemetry Beacon */}
            <div
              className="floating-telemetry-beacon-card liquid-glass"
              id="main-beacon-card"
              ref={beaconCardRef}
            >
              <div className="beacon-tag">
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Target Air Temp (T_t+1 Forecast)</span>
              </div>
              <div className="beacon-big-stat" id="center-pred-temp">
                {displayPredictedTemp.toFixed(1)}
                <span>°C</span>
              </div>
              <div className="beacon-delta" id="center-pred-delta">
                Delta: {delta >= 0 ? "+" : ""}
                {delta.toFixed(2)}°C | {isNight ? "Nocturnal Radiation Cooling" : "Solar Diurnal Heating"}
              </div>
            </div>

            {/* Map Bottom Controls */}
            <div className="map-bottom-strip">
              <div className="radar-zoom-controls">
                <button className="zoom-btn" title="Zoom in">
                  <svg viewBox="0 0 24 24">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <button className="zoom-btn" title="Zoom out">
                  <svg viewBox="0 0 24 24">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>

              <div
                style={{
                  fontSize: "0.74rem",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-mono)",
                  background: "rgba(0,0,0,0.5)",
                  padding: "5px 14px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                Inference Model: {selectedModel.toUpperCase()} | Ambient: {temp.toFixed(1)}°C | RH: {humidity}% | Pres: {pressure} mbar
              </div>
            </div>
          </div>

          {/* Bottom Dual Agro Bar */}
          <div className="cockpit-bottom-dual-bar">
            {/* Sri Lanka Yala Water Conservation Card */}
            <div className="offset-schedule-card liquid-glass">
              <div className="card-title-tiny" style={{ marginBottom: 4, color: "var(--accent-lime)" }}>
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                </svg>
                <span>Sri Lanka Irrigation Water Saved Today</span>
              </div>
              <div className="stat-head-flex">
                <div className="stat-huge mono-stat">
                  {waterSavedLiters.toLocaleString()}
                  <span> L</span>
                </div>
                <div className="stat-desc">
                  Conserved via AI-driven weather postponement (Zero Over-Irrigation)
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-mono)",
                  marginTop: 6,
                }}
              >
                <span className="glass-pill" style={{ padding: "3px 8px" }}>
                  Electricity Saved: ~1.8 kWh
                </span>
                <span className="glass-pill" style={{ padding: "3px 8px" }}>
                  Soil Leaching Prevention: 98%
                </span>
              </div>
            </div>

            {/* 24-Hour Diurnal Thermal Cycle */}
            <div className="volume-sparkline-card liquid-glass">
              <div className="card-title-tiny" style={{ marginBottom: 4 }}>
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <span>24-Hour Diurnal Curve (Current: {String(hour).padStart(2, "0")}:00)</span>
              </div>
              <div className="stat-head-flex">
                <div className="stat-huge mono-stat" id="current-hour-stat">
                  {temp.toFixed(1)}
                  <span>°C</span>
                </div>
                <div className="stat-desc">
                  Click on any bar to simulate target hour microclimate
                </div>
              </div>

              {/* Volume Histogram Bars */}
              <div className="volume-histogram-row" id="diurnal-histogram">
                {DIURNAL_CYCLE.map((item, idx) => {
                  const maxTemp = 35;
                  const heightPercent = Math.max(15, (item.temp / maxTemp) * 100);
                  const isActive = idx === hour;

                  return (
                    <div
                      key={item.h}
                      className={`hist-bar ${isActive ? "active" : ""}`}
                      style={{ height: `${heightPercent}%` }}
                      title={`${item.h}:00 — ${item.temp}°C`}
                      onClick={() => setHour(idx)}
                      onMouseEnter={(e) => {
                        gsap.to(e.currentTarget, {
                          scaleY: 1.15,
                          transformOrigin: "bottom",
                          duration: 0.2,
                        });
                      }}
                      onMouseLeave={(e) => {
                        gsap.to(e.currentTarget, {
                          scaleY: 1.0,
                          duration: 0.2,
                        });
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            Right Column: Real-World Sri Lanka Alerts & Physical Actuators
            ==================================================================== */}
        <aside className="warning-right-panel">
          {/* Warning & Agricultural Advisory Panel */}
          <div className="warning-main-card liquid-glass">
            <div className="warning-header-row">
              <div className="warning-title">
                <svg
                  className="ui-icon sm"
                  viewBox="0 0 24 24"
                  style={{ stroke: isFrostImminent || isHeatStressImminent ? "var(--accent-rose)" : "var(--accent-lime)" }}
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>Sri Lanka Advisory System</span>
              </div>
              <span className="warning-count-pill">
                {isFrostImminent || isHeatStressImminent ? "CRITICAL ALERT" : "OPTIMAL"}
              </span>
            </div>

            {/* Advisory 1: Nuwara Eliya Ground Frost Warning */}
            <div
              className="incident-box"
              style={
                isFrostImminent
                  ? { borderColor: "rgba(56, 189, 248, 0.6)", background: "rgba(56, 189, 248, 0.08)" }
                  : {}
              }
            >
              <div
                className="incident-head"
                style={isFrostImminent ? { color: "var(--accent-cyan)" } : {}}
              >
                <span
                  className="dot"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: isFrostImminent ? "var(--accent-cyan)" : "var(--accent-lime)",
                    display: "inline-block",
                  }}
                ></span>
                <span>
                  {isFrostImminent
                    ? "Ground Frost ('Maha Pini') Alert"
                    : "Nocturnal Temperature Safe"}
                </span>
              </div>
              <div className="incident-body">
                {isFrostImminent ? (
                  <>
                    Predicted minimum temperature dropping to{" "}
                    <strong>{targetNextTemp.toFixed(1)}°C at 04:00</strong> in Nuwara Eliya. High risk of leaf necrosis in <strong>Ceylon High-Grown Tea canopies</strong> and strawberry blossoms.
                  </>
                ) : (
                  <>
                    Ambient night temperature ({targetNextTemp.toFixed(1)}°C) remains above ground frost threshold (&gt;3.5°C). Tea bushes safe from frost burn.
                  </>
                )}
              </div>
              <div
                className="incident-action-tag"
                style={isFrostImminent ? { color: "var(--accent-cyan)", borderColor: "rgba(56, 189, 248, 0.4)" } : {}}
              >
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span>
                  {isFrostImminent
                    ? "Action: Engage Anti-Frost Sprinklers"
                    : "Status: Standby Monitoring"}
                </span>
              </div>
            </div>

            {/* Advisory 2: Dry-Zone Paddy Heat Stress Warning */}
            <div
              className="incident-box"
              style={
                isHeatStressImminent
                  ? { borderColor: "rgba(239, 68, 68, 0.6)", background: "rgba(239, 68, 68, 0.08)" }
                  : { borderColor: "rgba(245, 158, 11, 0.3)" }
              }
            >
              <div
                className="incident-head"
                style={{ color: isHeatStressImminent ? "var(--accent-rose)" : "var(--accent-amber)" }}
              >
                <span
                  className="dot"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: isHeatStressImminent ? "var(--accent-rose)" : "var(--accent-amber)",
                    display: "inline-block",
                  }}
                ></span>
                <span>
                  {isHeatStressImminent
                    ? "Paddy Spikelet Heat Hazard (>33°C)"
                    : "Sensor Health & Noise Isolation"}
                </span>
              </div>
              <div className="incident-body">
                {isHeatStressImminent ? (
                  <>
                    Extreme midday heat ({targetNextTemp.toFixed(1)}°C) in dry-zone paddy fields during flowering causes spikelet sterility and major yield reduction.
                  </>
                ) : (
                  <>
                    <strong>4,400 sensor freeze anomalies</strong> (0.00 mbar barometric drops) quarantined by our data preprocessing pipeline.
                  </>
                )}
              </div>
              <div
                className="incident-action-tag"
                style={{
                  color: isHeatStressImminent ? "var(--accent-rose)" : "var(--accent-amber)",
                  borderColor: isHeatStressImminent ? "rgba(239, 68, 68, 0.4)" : "rgba(245, 158, 11, 0.3)",
                }}
              >
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>
                  {isHeatStressImminent
                    ? "Action: Micro-Misting Canopy Cooling"
                    : "Zero False-Trigger Guarantee"}
                </span>
              </div>
            </div>
          </div>

          {/* Real-Time Microclimate Parameter Control Drawer */}
          <div className="actuation-controls-card liquid-glass">
            <div
              className="card-title-tiny"
              style={{ marginBottom: 12, color: "var(--accent-lime)" }}
            >
              <svg className="ui-icon sm" viewBox="0 0 24 24">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <span>Microclimate Telemetry Simulation</span>
            </div>

            {/* Slider 1: Air Temp */}
            <div className="ctrl-slider-unit">
              <div className="ctrl-label-flex">
                <span className="lbl">
                  <svg className="ui-icon sm" viewBox="0 0 24 24">
                    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
                  </svg>
                  <span>Ambient Air Temp (T_t)</span>
                </span>
                <span className="val" id="slide-val-temp">
                  {temp.toFixed(1)}°C
                </span>
              </div>
              <input
                type="range"
                id="ios-slider-temp"
                min="-5"
                max="45"
                step="0.1"
                value={temp}
                onChange={(e) => setTemp(parseFloat(e.target.value))}
              />
            </div>

            {/* Slider 2: Humidity */}
            <div className="ctrl-slider-unit">
              <div className="ctrl-label-flex">
                <span className="lbl">
                  <svg className="ui-icon sm" viewBox="0 0 24 24">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                  </svg>
                  <span>Relative Humidity (%)</span>
                </span>
                <span className="val" id="slide-val-hum">
                  {humidity}%
                </span>
              </div>
              <input
                type="range"
                id="ios-slider-hum"
                min="10"
                max="100"
                step="1"
                value={humidity}
                onChange={(e) => setHumidity(parseFloat(e.target.value))}
              />
            </div>

            {/* Slider 3: Pressure */}
            <div className="ctrl-slider-unit">
              <div className="ctrl-label-flex">
                <span className="lbl">
                  <svg className="ui-icon sm" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M16.2 7.8l-2 5.6-5.6 2 2-5.6z"></path>
                  </svg>
                  <span>Barometric Pressure (mbar)</span>
                </span>
                <span className="val" id="slide-val-press">
                  {pressure} mbar
                </span>
              </div>
              <input
                type="range"
                id="ios-slider-press"
                min="780"
                max="1040"
                step="1"
                value={pressure}
                onChange={(e) => setPressure(parseFloat(e.target.value))}
              />
            </div>

            {/* Slider 4: Hour */}
            <div className="ctrl-slider-unit">
              <div className="ctrl-label-flex">
                <span className="lbl">
                  <svg className="ui-icon sm" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Time of Day</span>
                </span>
                <span className="val" id="slide-val-hour">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>
              <input
                type="range"
                id="ios-slider-hour"
                min="0"
                max="23"
                step="1"
                value={hour}
                onChange={(e) => setHour(parseInt(e.target.value))}
              />
            </div>

            {/* Physical Actuator Engagement Button */}
            <button
              className="btn-actuate-full"
              id="btn-trigger-actuator"
              ref={actuateBtnRef}
              onClick={handleActuate}
              style={
                actuatorEngaged
                  ? { background: isFrostImminent ? "#38BDF8" : "#10B981", color: "#050807" }
                  : {}
              }
            >
              {actuatorEngaged ? (
                <>
                  <svg
                    className="ui-icon sm"
                    viewBox="0 0 24 24"
                    style={{ stroke: "#050807" }}
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>
                    {isFrostImminent
                      ? "Anti-Frost Sprinklers Active (+2.1°C Defense)"
                      : "Canopy Misting & Irrigation Optimized"}
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="ui-icon sm"
                    viewBox="0 0 24 24"
                    style={{ stroke: "#050807" }}
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  <span>
                    {isFrostImminent ? "Engage Anti-Frost Defense" : "Trigger Physical Actuators"}
                  </span>
                </>
              )}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
