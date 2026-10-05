"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";

interface DiurnalHour {
  h: string;
  temp: number;
}

interface AgroPlot {
  id: string;
  name: string;
  subTitle: string;
  posX: number; // percentage on map
  posY: number; // percentage on map
  moisture: number; // e.g. 58%
  vegetation: number; // e.g. 36%
  solar: number; // e.g. 73%
  crop: string;
  zone: string;
  soilStatus: string;
  baseTemp: number;
  baseHum: number;
  basePres: number;
}

const AGRO_PLOTS: AgroPlot[] = [
  {
    id: "plot-a",
    name: "Pedro Valley Tea Estate",
    subTitle: "High-Grown Elevation (1,868 m) // Field Sector 4",
    posX: 32,
    posY: 38,
    moisture: 58,
    vegetation: 36,
    solar: 73,
    crop: "Ceylon Tea (Camellia sinensis)",
    zone: "Nuwara Eliya Highlands",
    soilStatus: "Optimal Moisture | Acidic Loam",
    baseTemp: 6.8,
    baseHum: 84,
    basePres: 818,
  },
  {
    id: "plot-b",
    name: "Polyhouse Floriculture Tunnel",
    subTitle: "Protected Controlled Climate // Unit Green-02",
    posX: 66,
    posY: 32,
    moisture: 42,
    vegetation: 88,
    solar: 54,
    crop: "Export Strawberries & Roses",
    zone: "Bandarawela Valleys",
    soilStatus: "Substrate Coir | Drip Monitored",
    baseTemp: 21.4,
    baseHum: 76,
    basePres: 886,
  },
  {
    id: "plot-c",
    name: "Mahaweli Lowland Paddy Block",
    subTitle: "System B Dry Zone Cultivation // Block 12",
    posX: 44,
    posY: 68,
    moisture: 82,
    vegetation: 65,
    solar: 91,
    crop: "Maha Season Paddy (Bg 352)",
    zone: "Anuradhapura Plains",
    soilStatus: "Inundated Clay | High Thermal Cap",
    baseTemp: 32.8,
    baseHum: 58,
    basePres: 1009,
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
  // Selected Interactive Farm Plot (Defaults to Pedro Tea Estate)
  const [selectedPlot, setSelectedPlot] = useState<AgroPlot>(AGRO_PLOTS[0]);

  // Telemetry Sliders
  const [temp, setTemp] = useState<number>(selectedPlot.baseTemp);
  const [humidity, setHumidity] = useState<number>(selectedPlot.baseHum);
  const [pressure, setPressure] = useState<number>(selectedPlot.basePres);
  const [hour, setHour] = useState<number>(4);

  // Active UI Tabs & State
  const [activeTab, setActiveTab] = useState<string>("map");
  const [selectedModel, setSelectedModel] = useState<string>("mlp"); // Default to Thevindu's Deep MLP
  const [actuatorEngaged, setActuatorEngaged] = useState<boolean>(false);
  const [displayPredictedTemp, setDisplayPredictedTemp] = useState<number>(selectedPlot.baseTemp);

  // Liquid Glass Playground State (Tweakable styling parameters)
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState<boolean>(false);
  const [glassBlur, setGlassBlur] = useState<number>(34);
  const [glassSaturate, setGlassSaturate] = useState<number>(190);
  const [specularTint, setSpecularTint] = useState<string>("rgba(210, 248, 46, 0.4)");
  const [cardTiltAngle, setCardTiltAngle] = useState<{ x: number; y: number }>({ x: 12, y: -10 });

  // GSAP Animation Refs
  const radarSweepBeamRef = useRef<SVGGElement | null>(null);
  const floatingCardRef = useRef<HTMLDivElement | null>(null);
  const mapCardRef = useRef<HTMLDivElement | null>(null);
  const actuateBtnRef = useRef<HTMLButtonElement | null>(null);
  const animatedTempRef = useRef<{ val: number }>({ val: selectedPlot.baseTemp });

  // Handle Plot Selection with smooth camera fly-in
  const handleSelectPlot = (plot: AgroPlot) => {
    setSelectedPlot(plot);
    setTemp(plot.baseTemp);
    setHumidity(plot.baseHum);
    setPressure(plot.basePres);

    if (floatingCardRef.current) {
      gsap.fromTo(
        floatingCardRef.current,
        { scale: 0.9, y: "+=20", opacity: 0.5 },
        { scale: 1.0, y: 0, opacity: 1.0, duration: 0.45, ease: "back.out(1.8)" }
      );
    }
  };

  // ==========================================================================
  // REAL-WORLD SCIENTIFIC COMPUTATIONS (FAO & Agrometeorology Standards)
  // ==========================================================================

  const isNight = hour >= 20 || hour <= 6;
  const coolingDelta = isNight
    ? -0.75 * (1 - humidity / 220)
    : 0.95 * (1 - humidity / 320);
  const pressDelta = (pressure - selectedPlot.basePres) * 0.003;

  // Model-specific offsets from SLIIT evaluation benchmarks
  const modelOffset = selectedModel === "mlp" ? 0.0 : selectedModel === "rf" ? -0.18 : +0.24;
  const targetNextTemp = temp + coolingDelta + pressDelta + modelOffset;
  const delta = targetNextTemp - temp;

  // Vapor Pressure Deficit (VPD in kPa)
  const es = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
  const ea = es * (humidity / 100);
  const vpd = Math.max(0, es - ea);

  let vpdStatus = { label: "Optimal Transpiration", color: "var(--accent-lime)", desc: "Ideal photosynthesis window" };
  if (vpd < 0.4) {
    vpdStatus = { label: "High Fungal Risk", color: "var(--accent-rose)", desc: "Excess humidity; mildew threat" };
  } else if (vpd > 1.4) {
    vpdStatus = { label: "Moisture Stress", color: "var(--accent-amber)", desc: "Leaf stomata closing" };
  }

  // Hazards
  const isFrostImminent = targetNextTemp <= 3.8 && isNight;
  const isHeatStressImminent = targetNextTemp >= 33.0 && !isNight;

  // Water conservation estimation
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

      // Glass cards staggered lift with clearProps
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

      // Radar Sweep continuous 360 rotation
      if (radarSweepBeamRef.current) {
        gsap.to(radarSweepBeamRef.current, {
          rotation: 360,
          transformOrigin: "410px 240px",
          repeat: -1,
          duration: 7,
          ease: "none",
        });
      }

      // 3D Floating levitation physics on tilted glass card
      if (floatingCardRef.current) {
        gsap.to(floatingCardRef.current, {
          y: "-=12",
          duration: 3.4,
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

  // Mouse move 3D card tilt handler
  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width - 0.5;
    const yRatio = (e.clientY - rect.top) / rect.height - 0.5;
    setCardTiltAngle({
      x: 12 - yRatio * 15,
      y: -10 + xRatio * 15,
    });
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
              AERO-AGRI <span>// LIQUID GLASS OS 26</span>
            </div>
            <div className="brand-meta">
              Precision Microclimate & Telemetry Command Center (Group 2026-Y2-S1-MLB-B9G2-01)
            </div>
          </div>
        </a>

        {/* Central Pill Tabs */}
        <nav className="cockpit-nav-tabs">
          {[
            {
              id: "map",
              label: "Live Agro Radar",
              icon: <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>,
            },
            {
              id: "fleet",
              label: "Model Fleet (6)",
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
              label: "Water Savings",
              icon: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>,
              color: "var(--accent-lime)",
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

        {/* Top Actions: Animation Playground Toggle */}
        <div className="cockpit-actions">
          <button
            onClick={() => setIsPlaygroundOpen(!isPlaygroundOpen)}
            className="glass-pill active"
            style={{
              cursor: "pointer",
              padding: "6px 14px",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "1px solid var(--accent-lime)",
            }}
          >
            <svg className="ui-icon sm" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Liquid Glass Playground</span>
          </button>

          <div className="system-status-indicator">
            <div className="pulse-beacon"></div>
            <span>Plot: {selectedPlot.name.split(" ")[0]}</span>
          </div>
        </div>
      </header>

      {/* ======================================================================
          Interactive Field Plot Selector Bar (Map Location Selectors)
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
            <polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 8 12 2"></polygon>
          </svg>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Select Active Farmland Plot on Map:
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {AGRO_PLOTS.map((plot) => (
            <button
              key={plot.id}
              onClick={() => handleSelectPlot(plot)}
              className={`glass-pill ${selectedPlot.id === plot.id ? "active" : ""}`}
              style={{
                cursor: "pointer",
                padding: "6px 14px",
                fontSize: "0.75rem",
                fontFamily: "var(--font-main)",
                fontWeight: selectedPlot.id === plot.id ? 700 : 500,
                border: selectedPlot.id === plot.id ? "1px solid var(--accent-lime)" : "1px solid var(--glass-border)",
              }}
            >
              <span>{plot.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================================
          Main Cockpit Tri-Column Grid
          ====================================================================== */}
      <main className="mission-cockpit-grid">
        {/* ====================================================================
            Left Column: Trained Fleet & Scientific Metrics
            ==================================================================== */}
        <aside className="telemetry-left-panel">
          {/* SLIIT Research Group Card */}
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
                <span>Active Target: <strong>{selectedPlot.crop.split(" ")[0]}</strong></span>
              </div>
              <div className="status-metric warning">
                <span className="dot"></span>
                <span>Sensor Noise: <strong>0.00% (Clean)</strong></span>
              </div>
            </div>
          </div>

          {/* Model 1: Deep MLP (Gunathilaka H.D.T.T. - Thevindu) */}
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

          {/* Model 2: Random Forest (Diyes C.L.) */}
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

          {/* Model 3: Gradient Boosting (Zeen A.C.) */}
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
          </div>
        </aside>

        {/* ====================================================================
            Center Column: Topographic Radar & Holographic Farmland HUD
            ==================================================================== */}
        <section className="center-cockpit-panel">
          <div
            className="satellite-map-card liquid-glass"
            ref={mapCardRef}
            onMouseMove={handleMapMouseMove}
            style={{
              backdropFilter: `blur(${glassBlur}px) saturate(${glassSaturate}%)`,
              WebkitBackdropFilter: `blur(${glassBlur}px) saturate(${glassSaturate}%)`,
            }}
          >
            {/* Topographic Satellite Terrain Texture */}
            <img
              src="/satellite_terrain.jpg"
              alt="Sri Lanka Agricultural Satellite Terrain"
              className="satellite-bg-image"
            />
            <div className="satellite-vignette"></div>
            <div className="satellite-grid-overlay"></div>

            {/* Radar Animation Canvas */}
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

              {/* Waypoint Corridors (Image 2 & 3 style) */}
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

              {/* Pulse Rings */}
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

              {/* Rotating Sweep Beam */}
              <g id="radar-sweep-beam" ref={radarSweepBeamRef}>
                <path
                  d="M 410 240 L 410 90 A 150 150 0 0 1 540 165 Z"
                  fill="url(#radarSweep)"
                />
              </g>

              {/* Plot interconnecting dashed telemetry lines (Matching Concept Image 1) */}
              <line x1="256" y1="182" x2="528" y2="153" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeDasharray="3 3" />
              <line x1="256" y1="182" x2="352" y2="326" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeDasharray="3 3" />
              <line x1="528" y1="153" x2="352" y2="326" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeDasharray="3 3" />
            </svg>

            {/* Map Header Overlay */}
            <div className="map-header-bar">
              <div className="map-title-block">
                <h1>{selectedPlot.name}</h1>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ZONE: {selectedPlot.zone.toUpperCase()} // SOIL: {selectedPlot.soilStatus}
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
                  <span>Holographic Field Telemetry</span>
                </div>
              </div>
            </div>

            {/* ================================================================
                HOLOGRAPHIC FARMLAND HUD OVERLAYS (Directly matching Image 1)
                ================================================================ */}
            <div className="hologram-hud-container">
              {/* Plot A HUD: Moisture 58% */}
              <div
                className="hud-field-plot"
                style={{ top: "38%", left: "32%" }}
                onClick={() => handleSelectPlot(AGRO_PLOTS[0])}
              >
                <div
                  className="hud-circle-node"
                  style={{
                    background: selectedPlot.id === "plot-a" ? "rgba(56, 189, 248, 0.25)" : "rgba(14, 23, 19, 0.65)",
                    border: "1.5px solid #38BDF8",
                  }}
                >
                  <div className="hud-ring-outer" style={{ borderColor: "#38BDF8" }}></div>
                  <div className="hud-ring-inner"></div>
                  <div className="hud-stat-val" style={{ color: "#38BDF8" }}>
                    58%
                  </div>
                  <div className="hud-stat-icon">
                    <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: "#38BDF8", width: 15, height: 15 }}>
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                    </svg>
                  </div>
                </div>
                <div className="hud-data-tag">Pedro Tea // 58% Soil Moisture</div>
              </div>

              {/* Plot B HUD: Vegetative Canopy 36% / 88% */}
              <div
                className="hud-field-plot"
                style={{ top: "32%", left: "66%" }}
                onClick={() => handleSelectPlot(AGRO_PLOTS[1])}
              >
                <div
                  className="hud-circle-node"
                  style={{
                    background: selectedPlot.id === "plot-b" ? "rgba(210, 248, 46, 0.25)" : "rgba(14, 23, 19, 0.65)",
                    border: "1.5px solid #D2F82E",
                  }}
                >
                  <div className="hud-ring-outer" style={{ borderColor: "#D2F82E" }}></div>
                  <div className="hud-ring-inner"></div>
                  <div className="hud-stat-val" style={{ color: "#D2F82E" }}>
                    36%
                  </div>
                  <div className="hud-stat-icon">
                    <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: "#D2F82E", width: 15, height: 15 }}>
                      <path d="M12 22v-8m0 0a5 5 0 0 1 5-5h2a5 5 0 0 1-5 5h-2zm0 0a5 5 0 0 0-5-5H5a5 5 0 0 0 5 5h2z"></path>
                    </svg>
                  </div>
                </div>
                <div className="hud-data-tag">Greenhouse // 36% Canopy Sprout</div>
              </div>

              {/* Plot C HUD: Solar PAR 73% */}
              <div
                className="hud-field-plot"
                style={{ top: "68%", left: "44%" }}
                onClick={() => handleSelectPlot(AGRO_PLOTS[2])}
              >
                <div
                  className="hud-circle-node"
                  style={{
                    background: selectedPlot.id === "plot-c" ? "rgba(245, 158, 11, 0.25)" : "rgba(14, 23, 19, 0.65)",
                    border: "1.5px solid #F59E0B",
                  }}
                >
                  <div className="hud-ring-outer" style={{ borderColor: "#F59E0B" }}></div>
                  <div className="hud-ring-inner"></div>
                  <div className="hud-stat-val" style={{ color: "#F59E0B" }}>
                    73%
                  </div>
                  <div className="hud-stat-icon">
                    <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: "#F59E0B", width: 15, height: 15 }}>
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                    </svg>
                  </div>
                </div>
                <div className="hud-data-tag">Paddy Field // 73% Solar Irradiance</div>
              </div>
            </div>

            {/* ================================================================
                3D FLOATING LEVITATING LIQUID GLASS CARD (Matching Images 3 & 5)
                ================================================================ */}
            <div className="card-3d-perspective-stage">
              <div
                className="floating-3d-glass-card"
                ref={floatingCardRef}
                style={{
                  transform: `translate(-50%, -50%) rotateX(${cardTiltAngle.x}deg) rotateY(${cardTiltAngle.y}deg) translateZ(30px)`,
                  backdropFilter: `blur(${glassBlur}px) saturate(${glassSaturate}%)`,
                  WebkitBackdropFilter: `blur(${glassBlur}px) saturate(${glassSaturate}%)`,
                  borderColor: specularTint,
                }}
              >
                {/* Top Corner Pin Bubble (Matching Image 5) */}
                <div className="waypoint-pin-bubble">
                  <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: "#050807", width: 18, height: 18 }}>
                    <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
                  </svg>
                </div>

                <div className="beacon-tag">
                  <svg className="ui-icon sm" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{selectedPlot.name} Forecast</span>
                </div>

                <div className="beacon-big-stat" id="center-pred-temp">
                  {displayPredictedTemp.toFixed(1)}
                  <span>°C</span>
                </div>

                <div className="beacon-delta" id="center-pred-delta">
                  Expected Delta: {delta >= 0 ? "+" : ""}
                  {delta.toFixed(2)}°C | {isNight ? "Nocturnal Cooling" : "Solar Warming"}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 14,
                    paddingTop: 10,
                    borderTop: "1px solid rgba(255,255,255,0.12)",
                    fontSize: "0.72rem",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <span>VPD: <strong>{vpd.toFixed(2)} kPa</strong></span>
                  <span>Model: <strong>{selectedModel.toUpperCase()}</strong></span>
                </div>
              </div>
            </div>

            {/* Map Bottom Strip */}
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

          {/* Bottom Dual Mission Bar */}
          <div className="cockpit-bottom-dual-bar">
            {/* Irrigation Water Savings */}
            <div className="offset-schedule-card liquid-glass">
              <div className="card-title-tiny" style={{ marginBottom: 4, color: "var(--accent-lime)" }}>
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                </svg>
                <span>Sri Lanka Irrigation Water Conserved</span>
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

            {/* 24-Hour Diurnal Curve */}
            <div className="volume-sparkline-card liquid-glass">
              <div className="card-title-tiny" style={{ marginBottom: 4 }}>
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <span>24-Hour Diurnal Cycle (Current: {String(hour).padStart(2, "0")}:00)</span>
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
            Right Column: Advisory Alerts & Actuator Controls
            ==================================================================== */}
        <aside className="warning-right-panel">
          {/* Advisory & Warnings */}
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

            {/* Advisory 1: Ground Frost */}
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
                    <strong>{targetNextTemp.toFixed(1)}°C at 04:00</strong> in {selectedPlot.zone}. High risk of leaf necrosis in <strong>{selectedPlot.crop}</strong>.
                  </>
                ) : (
                  <>
                    Ambient night temperature ({targetNextTemp.toFixed(1)}°C) remains above ground frost threshold (&gt;3.5°C). Crop canopies safe.
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

            {/* Advisory 2: Paddy Heat Stress */}
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
                    Extreme midday heat ({targetNextTemp.toFixed(1)}°C) in dry-zone paddy fields during flowering causes spikelet sterility and yield loss.
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

          {/* Real-Time Parameter Sliders */}
          <div className="actuation-controls-card liquid-glass">
            <div
              className="card-title-tiny"
              style={{ marginBottom: 12, color: "var(--accent-lime)" }}
            >
              <svg className="ui-icon sm" viewBox="0 0 24 24">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <span>Microclimate Telemetry Simulator</span>
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

            {/* Physical Actuator Button */}
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

      {/* ======================================================================
          LIQUID GLASS ANIMATION PLAYGROUND MODAL (Interactive Sandbox)
          ====================================================================== */}
      {isPlaygroundOpen && (
        <div className="playground-modal-backdrop" onClick={() => setIsPlaygroundOpen(false)}>
          <div className="playground-window" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg className="ui-icon" viewBox="0 0 24 24" style={{ stroke: "var(--accent-lime)" }}>
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#FFFFFF" }}>
                  Liquid Glass Animation Playground
                </h2>
              </div>
              <button
                onClick={() => setIsPlaygroundOpen(false)}
                className="zoom-btn"
                style={{ width: 32, height: 32 }}
              >
                <svg viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Customize and test real-time visionOS / iOS 26 frosted glass refraction, multi-layer depth, and 3D specular bevel highlights live on the platform.
            </p>

            <div className="playground-grid">
              {/* Left Column Controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="ctrl-slider-unit">
                  <div className="ctrl-label-flex">
                    <span className="lbl">Frosted Glass Blur:</span>
                    <span className="val">{glassBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="60"
                    step="1"
                    value={glassBlur}
                    onChange={(e) => setGlassBlur(parseInt(e.target.value))}
                  />
                </div>

                <div className="ctrl-slider-unit">
                  <div className="ctrl-label-flex">
                    <span className="lbl">Color Saturation:</span>
                    <span className="val">{glassSaturate}%</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="260"
                    step="5"
                    value={glassSaturate}
                    onChange={(e) => setGlassSaturate(parseInt(e.target.value))}
                  />
                </div>

                {/* Preset Themes */}
                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 8 }}>
                    Liquid Refraction Palette:
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { name: "Bio-Lime Neon", color: "rgba(210, 248, 46, 0.45)" },
                      { name: "Pastel Frost Cyan", color: "rgba(56, 189, 248, 0.45)" },
                      { name: "Sunset Gold", color: "rgba(245, 158, 11, 0.45)" },
                      { name: "Rose Radiant", color: "rgba(239, 68, 68, 0.45)" },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setSpecularTint(preset.color)}
                        className="glass-pill"
                        style={{
                          cursor: "pointer",
                          padding: "6px 12px",
                          fontSize: "0.74rem",
                          border: specularTint === preset.color ? "1px solid #FFFFFF" : "1px solid var(--glass-border)",
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: preset.color, display: "inline-block" }}></span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Live 3D Glass Swatch Preview */}
              <div
                style={{
                  background: "rgba(0,0,0,0.4)",
                  borderRadius: 20,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "20px 24px",
                    borderRadius: 20,
                    background: "rgba(255, 255, 255, 0.08)",
                    backdropFilter: `blur(${glassBlur}px) saturate(${glassSaturate}%)`,
                    WebkitBackdropFilter: `blur(${glassBlur}px) saturate(${glassSaturate}%)`,
                    border: `1px solid ${specularTint}`,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.6), inset 0 1.5px 2px rgba(255,255,255,0.4)",
                    textAlign: "center",
                    maxWidth: 240,
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "var(--accent-lime)", fontWeight: 700, textTransform: "uppercase" }}>
                    visionOS Refraction Live
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#FFFFFF", marginTop: 4 }}>
                    Liquid Glass
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: 6 }}>
                    Specular bevel highlights active.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button
                onClick={() => setIsPlaygroundOpen(false)}
                className="btn-actuate-full"
                style={{ width: "auto", padding: "10px 24px" }}
              >
                <span>Apply to Cockpit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
