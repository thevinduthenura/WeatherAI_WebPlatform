"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";

interface DiurnalHour {
  h: string;
  temp: number;
}

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
  // Simulator State
  const [temp, setTemp] = useState<number>(14.2);
  const [humidity, setHumidity] = useState<number>(73);
  const [pressure, setPressure] = useState<number>(1013);
  const [hour, setHour] = useState<number>(14);

  // Active UI Navigation & Selection State
  const [activeTab, setActiveTab] = useState<string>("map");
  const [selectedModel, setSelectedModel] = useState<string>("rf");
  const [actuatorEngaged, setActuatorEngaged] = useState<boolean>(false);
  const [displayPredictedTemp, setDisplayPredictedTemp] = useState<number>(13.5);

  // GSAP Animation Refs
  const radarSweepBeamRef = useRef<SVGGElement | null>(null);
  const beaconCardRef = useRef<HTMLDivElement | null>(null);
  const mapCardRef = useRef<HTMLDivElement | null>(null);
  const actuateBtnRef = useRef<HTMLButtonElement | null>(null);
  const animatedTempRef = useRef<{ val: number }>({ val: 13.5 });

  // Physics & Forecasting calculation
  const isNight = hour >= 20 || hour <= 6;
  const coolingDelta = isNight
    ? -0.75 * (1 - humidity / 220)
    : 0.95 * (1 - humidity / 320);
  const pressDelta = (pressure - 1013.25) * 0.004;
  const targetNextTemp = temp + coolingDelta + pressDelta;
  const delta = targetNextTemp - temp;

  // Mount GSAP animations safely with gsap.context for React StrictMode
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header slide down
      gsap.fromTo(
        ".cockpit-header",
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
      );

      // Glass cards staggered lift with explicit fromTo and clearProps
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

  // Animate temperature number smoothly with GSAP
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
        borderColor: "#D2F82E",
        boxShadow: "0 0 60px rgba(210, 248, 46, 0.45)",
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
              AERO-AGRI <span>// OS 26</span>
            </div>
            <div className="brand-meta">
              Mission Control // Smart Microclimate System (Next.js TS)
            </div>
          </div>
        </a>

        {/* Central Pill Tabs (Vector Icons only, No Emojis) */}
        <nav className="cockpit-nav-tabs">
          {[
            {
              id: "map",
              label: "Live Map",
              icon: (
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              ),
            },
            {
              id: "fleet",
              label: "Fleet (6 Models)",
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
              id: "routes",
              label: "Thermal Routes",
              icon: (
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              ),
            },
            {
              id: "analytics",
              label: "Analytics",
              icon: (
                <>
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </>
              ),
            },
            {
              id: "pipeline",
              label: "Pipeline",
              icon: (
                <>
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </>
              ),
            },
            {
              id: "incidents",
              label: "Incidents (2)",
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

        {/* Action Controls */}
        <div className="cockpit-actions">
          <div className="search-command-input">
            <svg className="ui-icon sm" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Search Ctrl+K</span>
          </div>
          <div className="system-status-indicator">
            <div className="pulse-beacon"></div>
            <span>Szeged Hub: 46.25°N</span>
          </div>
        </div>
      </header>

      {/* ======================================================================
          Main Cockpit Tri-Column Grid
          ====================================================================== */}
      <main className="mission-cockpit-grid">
        {/* ====================================================================
            Left Column: Fleet Telemetry & Model Cards
            ==================================================================== */}
        <aside className="telemetry-left-panel">
          {/* Fleet Counts Card */}
          <div className="fleet-counts-card liquid-glass">
            <div className="fleet-pills-row">
              <div className="fleet-pill-item">
                <div className="val">6 Models</div>
                <div className="lbl">Supervised Fleet</div>
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
                <span>
                  Online: <strong>6 Paradigms</strong>
                </span>
              </div>
              <div className="status-metric warning">
                <span className="dot"></span>
                <span>
                  Alerts: <strong>1 Frost Zone</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Operational Efficiency (R² Fit Card) */}
          <div className="efficiency-card liquid-glass">
            <div className="card-label-row">
              <span className="card-title-tiny">
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Operational Fit (R²)</span>
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--accent-lime)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                }}
              >
                +1.2% Gain
              </span>
            </div>
            <div className="efficiency-number">
              93.3<span>%</span>
            </div>
            <div className="efficiency-sub">
              Benchmark: Diyes Random Forest (0.9331 R²) | MLP with lags: 0.9876
            </div>

            {/* Animated Area Sparkline */}
            <svg className="sparkline-svg" viewBox="0 0 280 50">
              <defs>
                <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="#D2F82E"
                    stopOpacity="0.35"
                  />
                  <stop
                    offset="100%"
                    stopColor="#D2F82E"
                    stopOpacity="0.0"
                  />
                </linearGradient>
              </defs>
              <path
                id="sparkline-area"
                d="M 0 40 Q 30 20 60 25 T 120 15 T 180 30 T 240 10 L 280 18 L 280 50 L 0 50 Z"
                fill="url(#sparkGradient)"
              />
              <path
                id="sparkline-path"
                d="M 0 40 Q 30 20 60 25 T 120 15 T 180 30 T 240 10 L 280 18"
                fill="none"
                stroke="#D2F82E"
                strokeWidth="2"
              />
              <circle
                cx="280"
                cy="18"
                r="3.5"
                fill="#D2F82E"
                filter="drop-shadow(0 0 6px #D2F82E)"
              />
            </svg>
          </div>

          {/* Model Card 1: Random Forest (Diyes C.L.) */}
          <div
            className={`model-schematic-card liquid-glass ${
              selectedModel === "rf" ? "featured" : ""
            }`}
            onClick={() => setSelectedModel("rf")}
          >
            <div className="schematic-header">
              <div className="schematic-name">Model RF-1 (Default)</div>
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
                <circle cx="25" cy="18" r="4" fill="#D2F82E" />
                <circle cx="65" cy="18" r="4" fill="#D2F82E" />
                <circle cx="105" cy="18" r="4" fill="#D2F82E" />
                <circle cx="145" cy="18" r="4" fill="#D2F82E" />
                <circle cx="185" cy="18" r="4" fill="#D2F82E" />
                <circle cx="215" cy="18" r="4" fill="#D2F82E" />
                <line
                  x1="25"
                  y1="18"
                  x2="215"
                  y2="18"
                  stroke="rgba(210, 248, 46, 0.25)"
                  strokeWidth="1"
                />
              </svg>
            </div>
            <div className="schematic-footer-metrics">
              <span>
                R²: <strong>0.9331</strong>
              </span>
              <span>
                RMSE: <strong>2.48°C</strong>
              </span>
              <span>100 Trees</span>
            </div>
          </div>

          {/* Model Card 2: Deep MLP (Gunathilaka H.D.T.T.) */}
          <div
            className={`model-schematic-card liquid-glass ${
              selectedModel === "mlp" ? "featured" : ""
            }`}
            onClick={() => setSelectedModel("mlp")}
          >
            <div className="schematic-header">
              <div className="schematic-name">Model MLP-2 (Deep Net)</div>
              <div className="schematic-sub">Gunathilaka H.D.T.T. // IT25101540</div>
            </div>
            <div className="schematic-wireframe">
              <svg className="wireframe-svg" viewBox="0 0 240 36">
                <path
                  d="M 10 18 L 60 8 L 120 26 L 180 12 L 230 18"
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.6)"
                  strokeWidth="1.5"
                />
                <circle cx="60" cy="8" r="3" fill="#38BDF8" />
                <circle cx="120" cy="26" r="3" fill="#38BDF8" />
                <circle cx="180" cy="12" r="3" fill="#38BDF8" />
              </svg>
            </div>
            <div className="schematic-footer-metrics">
              <span>
                R²: <strong>0.9151</strong> (0.9876)
              </span>
              <span>
                RMSE: <strong>2.79°C</strong>
              </span>
              <span>[128, 64, 32]</span>
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
              <div className="schematic-name">Model GB-3 (Cyclical)</div>
              <div className="schematic-sub">Zeen A.C. // IT25103342</div>
            </div>
            <div className="schematic-footer-metrics" style={{ marginTop: 6 }}>
              <span>
                R²: <strong>0.8846</strong>
              </span>
              <span>
                RMSE: <strong>3.26°C</strong>
              </span>
              <span>300 Boosters</span>
            </div>
          </div>
        </aside>

        {/* ====================================================================
            Center Column: Satellite Atmosphere Radar & Live Beacon
            ==================================================================== */}
        <section className="center-cockpit-panel">
          <div className="satellite-map-card liquid-glass" ref={mapCardRef}>
            {/* Photorealistic Satellite Terrain Background Image */}
            <img
              src="/satellite_terrain.jpg"
              alt="Szeged Topographic Satellite Terrain"
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
                    stopColor="#D2F82E"
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    stopColor="#D2F82E"
                    stopOpacity="0.0"
                  />
                </radialGradient>
                <linearGradient id="radarSweep" x1="0" y1="0" x2="1" y2="1">
                  <stop
                    offset="0%"
                    stopColor="#D2F82E"
                    stopOpacity="0.4"
                  />
                  <stop
                    offset="100%"
                    stopColor="#D2F82E"
                    stopOpacity="0.0"
                  />
                </linearGradient>
              </defs>

              {/* Active Atmospheric Telemetry Vectors */}
              <path
                d="M 120 400 Q 280 320 410 240 T 680 80"
                fill="none"
                stroke="#D2F82E"
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
                filter="drop-shadow(0 0 6px #38BDF8)"
              />

              {/* Radar Pulse Rings */}
              <circle cx="410" cy="240" r="45" fill="url(#beaconGlow)" />
              <circle
                cx="410"
                cy="240"
                r="95"
                fill="none"
                stroke="rgba(210, 248, 46, 0.28)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <circle
                cx="410"
                cy="240"
                r="150"
                fill="none"
                stroke="rgba(210, 248, 46, 0.15)"
                strokeWidth="0.8"
              />

              {/* Rotating Radar Sweep Beam (GSAP Targeted) */}
              <g id="radar-sweep-beam" ref={radarSweepBeamRef}>
                <path
                  d="M 410 240 L 410 90 A 150 150 0 0 1 540 165 Z"
                  fill="url(#radarSweep)"
                />
              </g>

              {/* Regional Meteorological Station Nodes */}
              <circle
                cx="410"
                cy="240"
                r="6"
                fill="#D2F82E"
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
                <h1>Szeged Microclimate Radar</h1>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  LAT 46.2530°N // LON 20.1414°E // ALT 82M // SENSOR GRID HU-6725
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
                  <span>Live Stream</span>
                </div>
                <div
                  className="glass-pill"
                  style={{ padding: "6px 14px", fontSize: "0.74rem" }}
                >
                  <svg className="ui-icon sm" viewBox="0 0 24 24">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  </svg>
                  <span>Terrain GIS</span>
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
                <span>Next-Hour Target (T_t+1)</span>
              </div>
              <div className="beacon-big-stat" id="center-pred-temp">
                {displayPredictedTemp.toFixed(1)}
                <span>°C</span>
              </div>
              <div className="beacon-delta" id="center-pred-delta">
                Expected Delta: {delta >= 0 ? "+" : ""}
                {delta.toFixed(2)}°C (
                {isNight ? "Radiative Cooling" : "Solar Heating Phase"})
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
                <button className="zoom-btn" title="Recenter target">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="22" y1="12" x2="18" y2="12"></line>
                    <line x1="6" y1="12" x2="2" y2="12"></line>
                    <line x1="12" y1="6" x2="12" y2="2"></line>
                    <line x1="12" y1="22" x2="12" y2="18"></line>
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
                Active State: Temp {temp.toFixed(1)}°C | Hum {humidity}% | Press{" "}
                {pressure} mbar | Wind 12 km/h
              </div>
            </div>
          </div>

          {/* Bottom Dual Mission Bar */}
          <div className="cockpit-bottom-dual-bar">
            {/* Error Variance Card */}
            <div className="offset-schedule-card liquid-glass">
              <div className="card-title-tiny" style={{ marginBottom: 4 }}>
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Ensemble Forecast Offset</span>
              </div>
              <div className="stat-head-flex">
                <div className="stat-huge mono-stat">
                  ± 0.98<span>°C</span>
                </div>
                <div className="stat-desc">
                  Average Generalization Variance Across Top 3 Models
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
                  RF: 2.48°C RMSE
                </span>
                <span className="glass-pill" style={{ padding: "3px 8px" }}>
                  MLP: 2.79°C RMSE
                </span>
                <span className="glass-pill" style={{ padding: "3px 8px" }}>
                  SVR: 3.15°C RMSE
                </span>
              </div>
            </div>

            {/* Live 24-Hour Diurnal Thermal Volume (Histogram) */}
            <div className="volume-sparkline-card liquid-glass">
              <div className="card-title-tiny" style={{ marginBottom: 4 }}>
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <span>24-Hour Diurnal Thermal Volume</span>
              </div>
              <div className="stat-head-flex">
                <div className="stat-huge mono-stat" id="current-hour-stat">
                  {temp.toFixed(1)}
                  <span>°C</span>
                </div>
                <div className="stat-desc">
                  Diurnal cycle tracking (Hour {String(hour).padStart(2, "0")}:00)
                </div>
              </div>

              {/* Volume Histogram Bars */}
              <div className="volume-histogram-row" id="diurnal-histogram">
                {DIURNAL_CYCLE.map((item, idx) => {
                  const maxTemp = 25;
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
            Right Column: Warnings, Hazards & Live Actuation
            ==================================================================== */}
        <aside className="warning-right-panel">
          {/* Warning Panel */}
          <div className="warning-main-card liquid-glass">
            <div className="warning-header-row">
              <div className="warning-title">
                <svg
                  className="ui-icon sm"
                  viewBox="0 0 24 24"
                  style={{ stroke: "var(--accent-rose)" }}
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>System Warnings</span>
              </div>
              <span className="warning-count-pill">2 Active</span>
            </div>

            {/* Incident 1: Nocturnal Frost Alert */}
            <div className="incident-box">
              <div className="incident-head">
                <span
                  className="dot"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--accent-rose)",
                    display: "inline-block",
                  }}
                ></span>
                <span>Frost Hazard Detected (Block A & C)</span>
              </div>
              <div className="incident-body">
                Radiative heat loss model projects minimum temperature descending
                to <strong>1.8°C at 04:15</strong>.
                <br />
                <br />
                <strong>Affected Units:</strong> High-density apple orchards &
                young tomato canopies.
                <br />
                <strong>Safeguard:</strong> +1.5°C Asymmetric Safety Offset
                triggered.
              </div>
              <div className="incident-action-tag">
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span>Action: Thermal Screens Armed</span>
              </div>
            </div>

            {/* Incident 2: Sensor Health Gateway */}
            <div
              className="incident-box"
              style={{ borderColor: "rgba(245, 158, 11, 0.35)" }}
            >
              <div
                className="incident-head"
                style={{ color: "var(--accent-amber)" }}
              >
                <span
                  className="dot"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--accent-amber)",
                    display: "inline-block",
                  }}
                ></span>
                <span>Sensor Health Gateway Active</span>
              </div>
              <div className="incident-body">
                <strong>4,400 sensor freeze rows</strong> (barometric pressure
                0.00 mbar) isolated from streaming inference pipeline.
              </div>
              <div
                className="incident-action-tag"
                style={{
                  color: "var(--accent-amber)",
                  borderColor: "rgba(245, 158, 11, 0.3)",
                }}
              >
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Quarantined: Zero Noise</span>
              </div>
            </div>
          </div>

          {/* Live Simulation & Actuation Drawer */}
          <div className="actuation-controls-card liquid-glass">
            <div
              className="card-title-tiny"
              style={{ marginBottom: 12, color: "var(--accent-lime)" }}
            >
              <svg className="ui-icon sm" viewBox="0 0 24 24">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <span>Real-Time Actuator Simulator</span>
            </div>

            {/* Slider 1: Air Temp */}
            <div className="ctrl-slider-unit">
              <div className="ctrl-label-flex">
                <span className="lbl">
                  <svg className="ui-icon sm" viewBox="0 0 24 24">
                    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
                  </svg>
                  <span>Air Temp (T_t)</span>
                </span>
                <span className="val" id="slide-val-temp">
                  {temp.toFixed(1)}°C
                </span>
              </div>
              <input
                type="range"
                id="ios-slider-temp"
                min="-10"
                max="40"
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
                  <span>Humidity (%)</span>
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
                  <span>Pressure (mbar)</span>
                </span>
                <span className="val" id="slide-val-press">
                  {pressure} mbar
                </span>
              </div>
              <input
                type="range"
                id="ios-slider-press"
                min="970"
                max="1050"
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
                  <span>Hour of Day</span>
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

            {/* Engagement Button */}
            <button
              className="btn-actuate-full"
              id="btn-trigger-actuator"
              ref={actuateBtnRef}
              onClick={handleActuate}
              style={
                actuatorEngaged
                  ? { background: "#10B981", color: "#050807" }
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
                  <span>Thermal Screens Deployed (+1.5°C Offset Active)</span>
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
                  <span>Engage Physical Actuators</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
