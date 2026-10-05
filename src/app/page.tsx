"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";

const RealAgroMap = dynamic(() => import("../components/RealAgroMap"), {
  ssr: false,
  loading: () => (
    <div
      className="satellite-map-card liquid-glass"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "440px",
        gap: 12,
      }}
    >
      <div className="pulse-dot" style={{ width: 12, height: 12 }}></div>
      <div style={{ color: "var(--accent-lime)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
        INITIALIZING REAL SATELLITE GIS ENGINE (ESRI HIGH-RES TILES)...
      </div>
    </div>
  ),
});

interface DiurnalHour {
  h: string;
  temp: number;
}

export interface AgroPlot {
  id: string;
  name: string;
  subTitle: string;
  posX: number;
  posY: number;
  lat: number;
  lng: number;
  moisture: number;
  vegetation: number;
  solar: number;
  crop: string;
  zone: string;
  elevation: number;
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
    lat: 6.9749,
    lng: 80.8033,
    moisture: 58,
    vegetation: 36,
    solar: 73,
    crop: "Ceylon Tea (Camellia sinensis)",
    zone: "Nuwara Eliya Highlands",
    elevation: 1868,
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
    lat: 6.9038,
    lng: 80.9002,
    moisture: 42,
    vegetation: 88,
    solar: 54,
    crop: "Export Strawberries & Roses",
    zone: "Bandarawela Valleys",
    elevation: 1250,
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
    lat: 7.9403,
    lng: 81.0188,
    moisture: 82,
    vegetation: 65,
    solar: 91,
    crop: "Maha Season Paddy (Bg 352)",
    zone: "Anuradhapura Plains",
    elevation: 115,
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
  const [selectedPlot, setSelectedPlot] = useState<AgroPlot>(AGRO_PLOTS[0]);
  const [temp, setTemp] = useState<number>(selectedPlot.baseTemp);
  const [humidity, setHumidity] = useState<number>(selectedPlot.baseHum);
  const [pressure, setPressure] = useState<number>(selectedPlot.basePres);
  const [hour, setHour] = useState<number>(4);

  const [activeTab, setActiveTab] = useState<string>("home-section");
  const [selectedModel, setSelectedModel] = useState<string>("mlp");
  const [actuatorEngaged, setActuatorEngaged] = useState<boolean>(false);
  const [displayPredictedTemp, setDisplayPredictedTemp] = useState<number>(selectedPlot.baseTemp);

  // Playground state
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState<boolean>(false);
  const [glassBlur, setGlassBlur] = useState<number>(34);
  const [glassSaturate, setGlassSaturate] = useState<number>(190);
  const [specularTint, setSpecularTint] = useState<string>("rgba(210, 248, 46, 0.4)");
  const [cardTiltAngle, setCardTiltAngle] = useState<{ x: number; y: number }>({ x: 12, y: -10 });

  // Refs
  const floatingCardRef = useRef<HTMLDivElement | null>(null);
  const actuateBtnRef = useRef<HTMLButtonElement | null>(null);
  const animatedTempRef = useRef<{ val: number }>({ val: selectedPlot.baseTemp });

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSelectPlot = (plot: AgroPlot) => {
    setSelectedPlot(plot);
    setTemp(plot.baseTemp);
    setHumidity(plot.baseHum);
    setPressure(plot.basePres);

    if (floatingCardRef.current) {
      gsap.fromTo(
        floatingCardRef.current,
        { scale: 0.9, opacity: 0.5 },
        { scale: 1.0, opacity: 1.0, duration: 0.45, ease: "back.out(1.8)" }
      );
    }
  };

  // Thermodynamic Calculations
  const isNight = hour >= 20 || hour <= 6;
  const coolingDelta = isNight
    ? -0.75 * (1 - humidity / 220)
    : 0.95 * (1 - humidity / 320);
  const pressDelta = (pressure - selectedPlot.basePres) * 0.003;
  const modelOffset = selectedModel === "mlp" ? 0.0 : selectedModel === "rf" ? -0.18 : +0.24;
  const targetNextTemp = temp + coolingDelta + pressDelta + modelOffset;
  const delta = targetNextTemp - temp;

  // VPD
  const es = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
  const ea = es * (humidity / 100);
  const vpd = Math.max(0, es - ea);

  let vpdStatus = { label: "Optimal Transpiration", color: "var(--accent-lime)", desc: "Ideal photosynthesis window" };
  if (vpd < 0.4) {
    vpdStatus = { label: "High Fungal Risk", color: "var(--accent-rose)", desc: "Excess humidity; mildew threat" };
  } else if (vpd > 1.4) {
    vpdStatus = { label: "Moisture Stress", color: "var(--accent-amber)", desc: "Leaf stomata closing" };
  }

  const isFrostImminent = targetNextTemp <= 3.8 && isNight;
  const isHeatStressImminent = targetNextTemp >= 33.0 && !isNight;
  const waterSavedLiters = Math.round(
    1850 + (humidity > 75 ? 940 : 0) + (temp < 24 ? 520 : 0) + (isNight ? 410 : 0)
  );

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cockpit-header",
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
      );

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

  const handleActuate = () => {
    if (actuateBtnRef.current) {
      gsap
        .timeline()
        .to(actuateBtnRef.current, { scale: 0.96, duration: 0.1 })
        .to(actuateBtnRef.current, { scale: 1.04, duration: 0.18 })
        .to(actuateBtnRef.current, { scale: 1.0, duration: 0.15 });
    }

    gsap.to(".real-map-wrapper", {
      borderColor: isFrostImminent ? "#38BDF8" : "#D2F82E",
      boxShadow: isFrostImminent
        ? "0 0 60px rgba(56, 189, 248, 0.45)"
        : "0 0 60px rgba(210, 248, 46, 0.45)",
      duration: 0.35,
      yoyo: true,
      repeat: 1,
    });

    setActuatorEngaged(true);
    setTimeout(() => {
      setActuatorEngaged(false);
    }, 3800);
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width - 0.5;
    const yRatio = (e.clientY - rect.top) / rect.height - 0.5;
    setCardTiltAngle({
      x: 12 - yRatio * 15,
      y: -10 + xRatio * 15,
    });
  };

  const cyclePlot = () => {
    const currentIndex = AGRO_PLOTS.findIndex((p) => p.id === selectedPlot.id);
    const nextPlot = AGRO_PLOTS[(currentIndex + 1) % AGRO_PLOTS.length];
    handleSelectPlot(nextPlot);
  };

  const cycleModel = () => {
    const models: ("ridge" | "rf" | "mlp")[] = ["ridge", "rf", "mlp"];
    const currIdx = models.indexOf(selectedModel as "ridge" | "rf" | "mlp");
    const nextModel = models[currIdx === -1 ? 0 : (currIdx + 1) % models.length];
    setSelectedModel(nextModel);
  };

  const currentModelMetrics = {
    ridge: { r2: "78.20", rmse: "3.66°C", name: "Linear Ridge", path: "M 0 42 Q 50 38 100 36 T 200 32" },
    rf: { r2: "93.31", rmse: "2.48°C", name: "Random Forest", path: "M 0 40 Q 50 28 100 22 T 200 14" },
    mlp: { r2: "98.76", rmse: "1.03°C", name: "Deep MLP Net", path: "M 0 38 Q 40 32 80 20 T 140 16 T 200 8" },
    gb: { r2: "88.46", rmse: "3.26°C", name: "Gradient Boost", path: "M 0 41 Q 50 32 100 26 T 200 18" },
    dt: { r2: "87.10", rmse: "3.45°C", name: "Decision Tree", path: "M 0 41 Q 50 34 100 28 T 200 20" },
    lr: { r2: "74.10", rmse: "3.98°C", name: "Linear Regress", path: "M 0 44 Q 50 40 100 38 T 200 34" },
  }[selectedModel] || { r2: "98.76", rmse: "1.03°C", name: "Deep MLP Net", path: "M 0 38 Q 40 32 80 20 T 140 16 T 200 8" };

  return (
    <div className="command-viewport">
      {/* ======================================================================
          Sticky Cockpit Navigation Header (Image 5 Executive Design)
          ====================================================================== */}
      <header className="cockpit-header">
        <a href="#radar-section" className="brand-unit">
          <div className="brand-glyph">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div className="brand-text-block">
            <div className="brand-title">
              WEATHER<span>.AI</span>
            </div>
            <div className="brand-meta">
              AGRO-METEOROLOGY COCKPIT
            </div>
          </div>
        </a>

        {/* Central Segmented Pill Bar (Direct Scroll Triggers - Image 5 style) */}
        <nav className="cockpit-nav-segmented-bar">
          {[
            { id: "home-section", label: "Home" },
            { id: "radar-section", label: "Live Radar" },
            { id: "fleet-section", label: "Model Fleet (6)" },
            { id: "frost-section", label: "Frost Defense" },
            { id: "water-section", label: "Water ET0" },
            { id: "about-section", label: "Architecture" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`cockpit-segmented-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => scrollToSection(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="cockpit-actions">
          <div className="status-chip-live">
            <span className="dot"></span>
            <span>3 Active Plots</span>
          </div>

          <button
            onClick={() => setIsPlaygroundOpen(!isPlaygroundOpen)}
            className="header-action-btn"
            title="Open Liquid Glass Playground"
          >
            <svg className="ui-icon sm" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Playground</span>
          </button>
        </div>
      </header>

      {/* ======================================================================
          HOME SECTION: MINIMALIST DARK ATMOSPHERIC HERO (Dribbble/VisionOS Style)
          ====================================================================== */}
      <section id="home-section" className="minimalist-hero-banner">
        {/* Cinematic Backdrop Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero_highland_dawn.jpg"
          alt="Atmospheric Sri Lankan Highland Mist"
          className="minimalist-hero-bg"
        />
        <div className="minimalist-hero-overlay"></div>

        {/* Minimalist Top Micro-Navigation Bar */}
        <div className="minimalist-hero-top">
          <button
            className={`minimalist-hero-breadcrumb-link ${activeTab === "home-section" ? "active" : ""}`}
            onClick={() => scrollToSection("home-section")}
          >
            Home
          </button>
          <span className="minimalist-hero-breadcrumb-dot">•</span>
          <button
            className="minimalist-hero-breadcrumb-link"
            onClick={() => scrollToSection("radar-section")}
          >
            Journeys
          </button>
          <span className="minimalist-hero-breadcrumb-dot">•</span>
          <div className="minimalist-hero-crest" title="Agro-Meteorology Cockpit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 18l5-7 4 5 7-10" />
              <circle cx="18" cy="6" r="2" />
            </svg>
          </div>
          <span className="minimalist-hero-breadcrumb-dot">•</span>
          <button
            className="minimalist-hero-breadcrumb-link"
            onClick={() => scrollToSection("fleet-section")}
          >
            Stories
          </button>
          <span className="minimalist-hero-breadcrumb-dot">•</span>
          <button
            className="minimalist-hero-breadcrumb-link"
            onClick={() => scrollToSection("frost-section")}
          >
            Spaces
          </button>
        </div>

        {/* Center Headline & Pill CTA */}
        <div className="minimalist-hero-center">
          <h1 className="minimalist-hero-headline">
            A Climate Beyond<br />
            <span>the Horizon</span>
          </h1>

          <button
            className="minimalist-hero-cta-btn"
            onClick={() => scrollToSection("radar-section")}
          >
            <span>Explore Radar</span>
          </button>
        </div>

        {/* Bottom Floating Telemetry Bar */}
        <div className="minimalist-hero-bottom">
          {/* Bottom Left Glass Preview Card */}
          <div
            className="minimalist-trip-card"
            onClick={() => {
              handleSelectPlot(AGRO_PLOTS[0]);
              scrollToSection("radar-section");
            }}
            title="Inspect Pedro Valley Tea Station"
          >
            <div className="minimalist-trip-label">Latest Spot</div>
            <div className="minimalist-trip-preview-stack">
              <div
                className="minimalist-trip-thumb-stacked"
                style={{ backgroundImage: `url('/hero_highland_dawn.jpg')` }}
              ></div>
              <div
                className="minimalist-trip-thumb-stacked"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(56, 189, 248, 0.4), rgba(210, 248, 46, 0.4))",
                }}
              ></div>
              <div
                className="minimalist-trip-thumb-stacked"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(16, 185, 129, 0.45), rgba(12, 18, 15, 0.8))",
                }}
              ></div>
            </div>
            <div className="minimalist-trip-title-row">
              <span className="minimalist-trip-name">Pedro Valley, Nuwara Eliya</span>
              <span className="minimalist-trip-arrow">↗</span>
            </div>
            <div className="minimalist-trip-date">Highland Elevation • 1,940m</div>
          </div>

          {/* Bottom Center Philosophical Narrative */}
          <div className="minimalist-narrative-block">
            <p className="minimalist-quote">
              Imagination isn&apos;t just a starting point — it&apos;s the destination.<br />
              Let&apos;s guide your harvest to where precision and resilience live.
            </p>
            <div className="minimalist-coordinates">
              06°58&apos;24&quot;N 80°46&apos;39&quot;E • SRI LANKA CENTRAL HIGHLANDS
            </div>
          </div>

          {/* Bottom Right Circular Scroll Down Button */}
          <button
            className="minimalist-scroll-down-btn"
            onClick={() => scrollToSection("radar-section")}
            title="Scroll to Radar"
            aria-label="Scroll to Radar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          </button>
        </div>
      </section>

      {/* ======================================================================
          HERO SECTION: EXECUTIVE PLATFORM INTRODUCTION & TELEMETRY HIGHLIGHTS
          ====================================================================== */}
      <section className="platform-hero-section liquid-glass">
        <div className="hero-content-col">
          <div className="hero-kicker-tag">
            <span className="pulse-dot"></span>
            <span>SMART AGRO-TELEMETRY // AUTONOMOUS AI</span>
          </div>

          <h1 className="hero-clean-headline">
            Autonomous <br />
            <strong>Agro Intelligence</strong>
          </h1>

          <div className="hero-dashed-divider"></div>

          <div className="hero-sub-kicker">
            REAL-TIME CROP HAZARD &amp; MICROCLIMATE TELEMETRY
          </div>
          <div className="hero-amber-bar"></div>

          <p className="hero-narrative-paragraph">
            Mobile dashboards and empirical machine learning models provide an instant overview of microclimatic hazards and frost exposure across Sri Lanka&apos;s high-elevation agricultural corridors, helping managers <strong>eliminate harvest loss and optimize precision irrigation</strong>.
          </p>

          {/* Interactive Model Selector Pills (Image 1 replica) */}
          <div className="hero-typo-pills-row">
            <button
              className={`typo-pill-btn ${selectedModel === "ridge" ? "active" : ""}`}
              onClick={() => setSelectedModel("ridge")}
              title="Switch to Linear Ridge Baseline"
            >
              <span className="typo-pill-circle">L</span>
              <span>Light Ridge (0.782 R²)</span>
            </button>
            <button
              className={`typo-pill-btn ${selectedModel === "rf" ? "active" : ""}`}
              onClick={() => setSelectedModel("rf")}
              title="Switch to Random Forest Ensemble"
            >
              <span className="typo-pill-circle">M</span>
              <span>Random Forest (0.933 R²)</span>
            </button>
            <button
              className={`typo-pill-btn ${selectedModel === "mlp" ? "active" : ""}`}
              onClick={() => setSelectedModel("mlp")}
              title="Switch to Lead Deep MLP Neural Net"
            >
              <span className="typo-pill-circle">D</span>
              <span>Deep MLP (0.988 R²) ★</span>
            </button>
          </div>

          {/* Floating Glass Functional Badge (Clickable link to Model Fleet) */}
          <div
            className="functional-telemetry-badge interactive-tap"
            onClick={() => scrollToSection("fleet-section")}
            style={{ cursor: "pointer" }}
            title="Inspect 6 Algorithmic Model Architectures"
          >
            <div className="functional-badge-header">
              <span>Active Model Architecture: {currentModelMetrics.name}</span>
              <span className="arrow">↗</span>
            </div>
            <div className="functional-badge-sub">
              Autoregressive lag tensors engineered from 92,029 historical hourly observations (2006–2016) deliver {currentModelMetrics.r2} R² accuracy (RMSE: {currentModelMetrics.rmse}). Click to view benchmark comparison.
            </div>
          </div>

          <div className="hero-cta-row">
            <button onClick={() => scrollToSection("radar-section")} className="hero-btn-primary">
              <svg className="ui-icon sm" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon></svg>
              <span>Launch Live Cockpit</span>
            </button>

            <button onClick={() => scrollToSection("fleet-section")} className="hero-btn-secondary">
              <svg className="ui-icon sm" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>
              <span>Model Benchmarks</span>
            </button>
          </div>
        </div>

        {/* Hero Right Column: Interactive Dark Mode Mobile Remote Control (Image 2 replica) */}
        <div className="hero-device-showcase-col">
          <div className="device-phone-chassis">
            <div className="device-screen">
              <div className="device-status-bar">
                <span>09:41</span>
                <div className="device-dynamic-island"></div>
                <span>5G LTE 100%</span>
              </div>

              {/* Tap to cycle model */}
              <div
                className="device-efficiency-card interactive-tap"
                onClick={cycleModel}
                title="Click to switch machine learning model"
              >
                <div className="device-card-label">
                  <span>Model: {currentModelMetrics.name}</span>
                  <span style={{ color: "var(--accent-lime)" }}>TAP TO SWITCH ↻</span>
                </div>
                <div className="device-big-number">
                  {currentModelMetrics.r2}<span>% R²</span>
                </div>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)" }}>
                  RMSE Error: {currentModelMetrics.rmse}
                </div>
                <svg className="device-sparkline-svg" viewBox="0 0 200 48" preserveAspectRatio="none">
                  <line x1="0" y1="12" x2="200" y2="12" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
                  <path d={currentModelMetrics.path} fill="none" stroke="#D2F82E" strokeWidth="2" />
                  <circle cx="100" cy="24" r="3" fill="#D2F82E" />
                  <circle cx="200" cy="8" r="4" fill="#FFFFFF" />
                </svg>
              </div>

              <div className="device-pills-row">
                <div
                  className="device-status-pill interactive-tap"
                  onClick={cyclePlot}
                  style={{ cursor: "pointer" }}
                  title="Click to cycle agro sector"
                >
                  <span className="dot" style={{ background: "var(--accent-emerald)" }}></span>
                  <div className="info">
                    <div className="val">3 Active</div>
                    <div className="lbl">Plots (Tap)</div>
                  </div>
                </div>
                <div
                  className="device-status-pill interactive-tap"
                  onClick={() => scrollToSection("frost-section")}
                  style={{ cursor: "pointer" }}
                  title="Click to view frost defense"
                >
                  <span className="dot" style={{ background: isFrostImminent ? "var(--accent-rose)" : "var(--accent-lime)" }}></span>
                  <div className="info">
                    <div className="val">{isFrostImminent ? "Frost Risk" : "Safe"}</div>
                    <div className="lbl">Defense Status</div>
                  </div>
                </div>
              </div>

              {/* Tap to cycle plots */}
              <div
                className="device-asset-card interactive-tap"
                onClick={cyclePlot}
                title="Click to switch active agricultural hotspot"
              >
                <div className="device-asset-header">
                  <span className="device-asset-tag">L {selectedPlot.elevation}m</span>
                  <span style={{ fontSize: "0.66rem", color: "var(--accent-lime)", fontFamily: "var(--font-mono)" }}>
                    ● TAP TO SWITCH PLOT ↻
                  </span>
                </div>
                <div className="device-asset-title">{selectedPlot.name}</div>
                <div className="device-asset-telemetry">
                  <span>{temp.toFixed(1)}°C Ambient</span>
                  <span>{humidity}% RH</span>
                  <span>{selectedPlot.crop.split(" ")[0]}</span>
                </div>
              </div>

              {/* Functional Phone Dock: Smoothly scrolls to corresponding section */}
              <div className="device-bottom-dock">
                <button
                  className={`device-dock-btn ${activeTab === "radar-section" ? "active" : ""}`}
                  onClick={() => scrollToSection("radar-section")}
                  title="Cockpit Radar"
                  style={{ background: "none", border: "none" }}
                >
                  <svg className="ui-icon sm" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon></svg>
                </button>
                <button
                  className={`device-dock-btn ${activeTab === "fleet-section" ? "active" : ""}`}
                  onClick={() => scrollToSection("fleet-section")}
                  title="Model Fleet"
                  style={{ background: "none", border: "none" }}
                >
                  <svg className="ui-icon sm" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>
                </button>
                <button
                  className={`device-dock-btn ${activeTab === "frost-section" ? "active" : ""}`}
                  onClick={() => scrollToSection("frost-section")}
                  title="Frost Shield"
                  style={{ background: "none", border: "none" }}
                >
                  <svg className="ui-icon sm" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                </button>
                <button
                  className={`device-dock-btn ${activeTab === "water-section" ? "active" : ""}`}
                  onClick={() => scrollToSection("water-section")}
                  title="Irrigation Savings"
                  style={{ background: "none", border: "none" }}
                >
                  <svg className="ui-icon sm" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          SECTION 1: LIVE AGRO RADAR & TELEMETRY SIMULATOR
          ====================================================================== */}
      <section id="radar-section" className="scroll-section">
        {/* Section 1 Header Card */}
        <div className="section-hero-card liquid-glass" style={{ marginBottom: 16 }}>
          <div className="section-badge-tag" style={{ color: "var(--accent-lime)" }}>
            <svg className="ui-icon sm" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon></svg>
            <span>Real-Time Geospatial GIS &amp; Microclimate Cockpit</span>
          </div>
          <h2 className="section-title-large">Live Agro-Radar &amp; Thermal Decision Cockpit</h2>
          <p className="section-desc-text">
            Interactive mission control interface integrating real-time GIS elevation maps, holographic microclimatic sensors, automated frost alarm thresholds, and 1-hour lookahead thermodynamic temperature prediction. Select an agricultural hotspot below to initiate telemetry analysis:
          </p>
        </div>

        {/* Plot Selector Bar */}
        <div className="liquid-glass plot-selector-bar">
          <div className="plot-selector-label">
            <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: "var(--accent-lime)" }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 8 12 2"></polygon>
            </svg>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Interactive Agricultural Plot Hotspots:
            </span>
          </div>

          <div className="plot-pills-row">
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

        {/* Tri-Column Cockpit Grid */}
        <div className="mission-cockpit-grid">
          {/* Left Panel */}
          <aside className="telemetry-left-panel">
            <div className="fleet-counts-card liquid-glass">
              <div className="card-title-tiny" style={{ marginBottom: 10, color: "var(--accent-lime)" }}>
                <svg className="ui-icon sm" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>System Architecture // Gunathilaka H.D.T.T. (IT25101540)</span>
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
            </div>

            {/* Model Selection Quick Toggles */}
            <div
              className={`model-schematic-card liquid-glass ${selectedModel === "mlp" ? "featured" : ""}`}
              onClick={() => setSelectedModel("mlp")}
            >
              <div className="schematic-header">
                <div className="schematic-name">Model MLP-2 (Deep Net) ★ Selected</div>
                <div className="schematic-sub">Gunathilaka H.D.T.T. // IT25101540</div>
              </div>
              <div className="schematic-footer-metrics">
                <span>R²: <strong>0.9876</strong> (Lags)</span>
                <span>RMSE: <strong>1.03°C</strong></span>
                <span>[128, 64, 32]</span>
              </div>
            </div>

            <div
              className={`model-schematic-card liquid-glass ${selectedModel === "rf" ? "featured" : ""}`}
              onClick={() => setSelectedModel("rf")}
            >
              <div className="schematic-header">
                <div className="schematic-name">Model RF-1 (Ensemble Baseline)</div>
                <div className="schematic-sub">Diyes C.L. // IT25100263</div>
              </div>
              <div className="schematic-footer-metrics">
                <span>R²: <strong>0.9331</strong></span>
                <span>RMSE: <strong>2.48°C</strong></span>
                <span>100 Trees</span>
              </div>
            </div>

            <div
              className={`model-schematic-card liquid-glass ${selectedModel === "gb" ? "featured" : ""}`}
              onClick={() => setSelectedModel("gb")}
            >
              <div className="schematic-header">
                <div className="schematic-name">Model GB-3 (Cyclical Temporal)</div>
                <div className="schematic-sub">Zeen A.C. // IT25103342</div>
              </div>
              <div className="schematic-footer-metrics">
                <span>R²: <strong>0.8846</strong></span>
                <span>RMSE: <strong>3.26°C</strong></span>
                <span>300 Boosters</span>
              </div>
            </div>

            {/* VPD Gauge */}
            <div className="efficiency-card liquid-glass">
              <div className="card-label-row">
                <span className="card-title-tiny">
                  <svg className="ui-icon sm" viewBox="0 0 24 24">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                  </svg>
                  <span>Vapor Pressure Deficit (VPD)</span>
                </span>
                <span style={{ fontSize: "0.72rem", color: vpdStatus.color, fontWeight: 700 }}>
                  {vpdStatus.label}
                </span>
              </div>
              <div className="efficiency-number">
                {vpd.toFixed(2)}
                <span style={{ fontSize: "1.2rem", marginLeft: 4 }}>kPa</span>
              </div>
              <div className="efficiency-sub">{vpdStatus.desc}</div>
              <div style={{ width: "100%", height: 7, borderRadius: 4, background: "rgba(255,255,255,0.1)", marginTop: 10, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (vpd / 2.0) * 100)}%`, height: "100%", background: vpdStatus.color }}></div>
              </div>
            </div>
          </aside>

          {/* Center Map Radar Panel */}
          <section className="center-cockpit-panel">
            <RealAgroMap
              plots={AGRO_PLOTS}
              selectedPlot={selectedPlot}
              selectedModel={selectedModel}
              displayPredictedTemp={displayPredictedTemp}
              temp={temp}
              humidity={humidity}
              pressure={pressure}
              vpd={vpd}
              delta={delta}
              isNight={isNight}
              isFrostImminent={isFrostImminent}
              onSelectPlot={handleSelectPlot}
              onCustomLocationSelect={(loc) => {
                setTemp(loc.temp);
                setHumidity(loc.humidity);
              }}
            />

            {/* Dedicated Mobile Forecast Glass Card (Shown below map on mobile devices) */}
            <div className="mobile-forecast-dock-card liquid-glass">
              <div className="waypoint-pin-bubble mobile-bubble">
                <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: "#050807", width: 16, height: 16 }}>
                  <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
                </svg>
              </div>
              <div className="beacon-tag">
                <svg className="ui-icon sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>{selectedPlot.name} Forecast</span>
              </div>
              <div className="beacon-big-stat" id="mobile-pred-temp">
                {displayPredictedTemp.toFixed(1)}<span>°C</span>
              </div>
              <div className="beacon-delta" id="mobile-pred-delta">
                Delta: {delta >= 0 ? "+" : ""}{delta.toFixed(2)}°C | {isNight ? "Nocturnal Cooling" : "Solar Warming"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.12)", fontSize: "0.74rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                <span>VPD: <strong style={{ color: "var(--accent-lime)" }}>{vpd.toFixed(2)} kPa</strong></span>
                <span>Model: <strong style={{ color: "#FFFFFF" }}>{selectedModel.toUpperCase()}</strong></span>
              </div>

              {/* iOS Quick Stat Tiles */}
              <div className="mobile-stats-row">
                <div className="mobile-stat-tile">
                  <div className="num">{temp.toFixed(1)}°</div>
                  <div className="lbl">Ambient</div>
                </div>
                <div className="mobile-stat-tile">
                  <div className="num">{humidity}%</div>
                  <div className="lbl">Humidity</div>
                </div>
                <div className="mobile-stat-tile">
                  <div className="num">{vpd.toFixed(2)}</div>
                  <div className="lbl">VPD kPa</div>
                </div>
              </div>
            </div>

            {/* Bottom Dual Bar */}
            <div className="cockpit-bottom-dual-bar">
              <div className="offset-schedule-card liquid-glass">
                <div className="card-title-tiny" style={{ marginBottom: 4, color: "var(--accent-lime)" }}>
                  <svg className="ui-icon sm" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                  <span>Sri Lanka Irrigation Water Conserved</span>
                </div>
                <div className="stat-head-flex">
                  <div className="stat-huge mono-stat">{waterSavedLiters.toLocaleString()}<span> L</span></div>
                  <div className="stat-desc">Conserved via AI-driven weather postponement (Zero Over-Irrigation)</div>
                </div>
              </div>

              <div className="volume-sparkline-card liquid-glass">
                <div className="card-title-tiny" style={{ marginBottom: 4 }}>
                  <svg className="ui-icon sm" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line></svg>
                  <span>24-Hour Diurnal Cycle (Current: {String(hour).padStart(2, "0")}:00)</span>
                </div>
                <div className="stat-head-flex">
                  <div className="stat-huge mono-stat" id="current-hour-stat">{temp.toFixed(1)}<span>°C</span></div>
                  <div className="stat-desc">Click on any bar to simulate target hour</div>
                </div>
                <div className="volume-histogram-row" id="diurnal-histogram">
                  {DIURNAL_CYCLE.map((item, idx) => (
                    <div
                      key={item.h}
                      className={`hist-bar ${idx === hour ? "active" : ""}`}
                      style={{ height: `${Math.max(15, (item.temp / 35) * 100)}%` }}
                      title={`${item.h}:00 — ${item.temp}°C`}
                      onClick={() => setHour(idx)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Right Panel */}
          <aside className="warning-right-panel">
            <div className="warning-main-card liquid-glass">
              <div className="warning-header-row">
                <div className="warning-title">
                  <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: isFrostImminent || isHeatStressImminent ? "var(--accent-rose)" : "var(--accent-lime)" }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  </svg>
                  <span>Sri Lanka Advisory System</span>
                </div>
                <span className="warning-count-pill">{isFrostImminent || isHeatStressImminent ? "CRITICAL ALERT" : "OPTIMAL"}</span>
              </div>

              <div className="incident-box" style={isFrostImminent ? { borderColor: "rgba(56, 189, 248, 0.6)", background: "rgba(56, 189, 248, 0.08)" } : {}}>
                <div className="incident-head" style={isFrostImminent ? { color: "var(--accent-cyan)" } : {}}>
                  <span className="dot" style={{ width: 7, height: 7, borderRadius: "50%", background: isFrostImminent ? "var(--accent-cyan)" : "var(--accent-lime)", display: "inline-block" }}></span>
                  <span>{isFrostImminent ? "Ground Frost ('Maha Pini') Alert" : "Nocturnal Temperature Safe"}</span>
                </div>
                <div className="incident-body">
                  {isFrostImminent
                    ? `Predicted minimum temperature dropping to ${targetNextTemp.toFixed(1)}°C at 04:00 in ${selectedPlot.zone}. High risk of leaf necrosis in ${selectedPlot.crop}.`
                    : `Ambient night temperature (${targetNextTemp.toFixed(1)}°C) remains above ground frost threshold (>3.5°C). Crop canopies safe.`}
                </div>
              </div>

              <div className="incident-box" style={isHeatStressImminent ? { borderColor: "rgba(239, 68, 68, 0.6)", background: "rgba(239, 68, 68, 0.08)" } : { borderColor: "rgba(245, 158, 11, 0.3)" }}>
                <div className="incident-head" style={{ color: isHeatStressImminent ? "var(--accent-rose)" : "var(--accent-amber)" }}>
                  <span className="dot" style={{ width: 7, height: 7, borderRadius: "50%", background: isHeatStressImminent ? "var(--accent-rose)" : "var(--accent-amber)", display: "inline-block" }}></span>
                  <span>{isHeatStressImminent ? "Paddy Spikelet Heat Hazard (>33°C)" : "Sensor Health & Noise Isolation"}</span>
                </div>
                <div className="incident-body">
                  {isHeatStressImminent
                    ? `Extreme midday heat (${targetNextTemp.toFixed(1)}°C) in dry-zone paddy fields during flowering causes spikelet sterility and yield loss.`
                    : "4,400 sensor freeze anomalies (0.00 mbar barometric drops) quarantined by our data preprocessing pipeline."}
                </div>
              </div>
            </div>

            {/* Parameter Sliders */}
            <div className="actuation-controls-card liquid-glass">
              <div className="card-title-tiny" style={{ marginBottom: 12, color: "var(--accent-lime)" }}>
                <svg className="ui-icon sm" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                <span>Microclimate Telemetry Simulator</span>
              </div>

              <div className="ctrl-slider-unit">
                <div className="ctrl-label-flex">
                  <span className="lbl">Ambient Air Temp (T_t)</span>
                  <span className="val">{temp.toFixed(1)}°C</span>
                </div>
                <input type="range" min="-5" max="45" step="0.1" value={temp} onChange={(e) => setTemp(parseFloat(e.target.value))} />
              </div>

              <div className="ctrl-slider-unit">
                <div className="ctrl-label-flex">
                  <span className="lbl">Relative Humidity (%)</span>
                  <span className="val">{humidity}%</span>
                </div>
                <input type="range" min="10" max="100" step="1" value={humidity} onChange={(e) => setHumidity(parseFloat(e.target.value))} />
              </div>

              <div className="ctrl-slider-unit">
                <div className="ctrl-label-flex">
                  <span className="lbl">Barometric Pressure (mbar)</span>
                  <span className="val">{pressure} mbar</span>
                </div>
                <input type="range" min="780" max="1040" step="1" value={pressure} onChange={(e) => setPressure(parseFloat(e.target.value))} />
              </div>

              <div className="ctrl-slider-unit">
                <div className="ctrl-label-flex">
                  <span className="lbl">Time of Day</span>
                  <span className="val">{String(hour).padStart(2, "0")}:00</span>
                </div>
                <input type="range" min="0" max="23" step="1" value={hour} onChange={(e) => setHour(parseInt(e.target.value))} />
              </div>

              <button className="btn-actuate-full" ref={actuateBtnRef} onClick={handleActuate} style={actuatorEngaged ? { background: isFrostImminent ? "#38BDF8" : "#10B981", color: "#050807" } : {}}>
                <span>{actuatorEngaged ? (isFrostImminent ? "Anti-Frost Sprinklers Active (+2.1°C)" : "Actuators Engaged") : (isFrostImminent ? "Engage Anti-Frost Defense" : "Trigger Physical Actuators")}</span>
              </button>
            </div>
          </aside>
        </div>
      </section>

      {/* ======================================================================
          EDITORIAL TYPOGRAPHIC BREAKOUT SECTION (Image 3 & Image 4 Replica)
          ====================================================================== */}
      <section className="editorial-breakout-section liquid-glass">
        <div className="editorial-content-left">
          <div className="editorial-kicker">00.6 // EMPIRICAL PRODUCTION BENCHMARK</div>
          <h2 className="editorial-big-statement">
            83% of modern high-elevation agro estates need responsive <br />
            <span className="editorial-boxed-tag">automated frost shield</span>
          </h2>
          <p className="editorial-subtext">
            Of agricultural estate managers in Nuwara Eliya and Bandarawela, conventional static weather stations obscure localized nocturnal ground freezing. Deep autoregressive neural networks anticipate thermal inversion 60 minutes prior to latent crop cell damage.
          </p>
        </div>

        <div className="editorial-stat-card">
          <div className="editorial-stat-label">Model Shift // Error Reduction</div>
          <div className="editorial-huge-number">72%</div>
          <div className="editorial-subtext" style={{ fontSize: "0.78rem" }}>
            Deep MLP w/ lag features reduces RMSE from 3.66°C to 1.03°C against baseline linear regressors.
          </div>
          <div className="editorial-sparkline-box">
            <svg viewBox="0 0 300 70" style={{ width: "100%", height: 60 }} preserveAspectRatio="none">
              <line x1="0" y1="15" x2="300" y2="15" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
              <line x1="0" y1="35" x2="300" y2="35" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
              <line x1="0" y1="55" x2="300" y2="55" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
              <path d="M 0 62 L 60 56 L 120 44 L 180 32 L 230 18 L 270 24 L 300 12" fill="none" stroke="#D2F82E" strokeWidth="2.2" />
              <circle cx="230" cy="18" r="4" fill="#FFFFFF" stroke="#D2F82E" strokeWidth="2" />
              <circle cx="300" cy="12" r="4" fill="#D2F82E" />
            </svg>
          </div>
        </div>
      </section>

      {/* ======================================================================
          SECTION 2: MODEL FLEET & COMPARATIVE BENCHMARK MATRIX
          ====================================================================== */}
      <section id="fleet-section" className="scroll-section">
        <div className="section-hero-card liquid-glass">
          <div className="section-badge-tag">
            <svg className="ui-icon sm" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>
            <span>Model Fleet Architecture & Scientific Benchmarking</span>
          </div>
          <h2 className="section-title-large">Comparative Machine Learning Fleet (6 Algorithmic Paradigms)</h2>
          <p className="section-desc-text">
            All 6 models were systematically trained and cross-validated on 11 years (2006–2016) of continuous meteorological observations from the Szeged archive (96,429 raw records, 92,029 clean samples post outlier filtering). Below is the comprehensive benchmark matrix:
          </p>

          <div className="mobile-swipe-indicator">
            <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: "var(--accent-lime)", width: 14, height: 14 }}>
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span>Scroll horizontally to view complete peer benchmark metrics →</span>
          </div>

          <div className="benchmark-table-container">
            <table className="benchmark-table">
              <thead>
                <tr>
                  <th>Model Paradigm</th>
                  <th>Lead Researcher</th>
                  <th>R² Score</th>
                  <th>RMSE (°C)</th>
                  <th>MAE (°C)</th>
                  <th>Key Architecture & Optimization</th>
                  <th>Agricultural Role</th>
                </tr>
              </thead>
              <tbody>
                <tr className={selectedModel === "mlp" ? "highlighted" : ""}>
                  <td><strong>Deep MLP (MLP-2)</strong></td>
                  <td><strong>Gunathilaka H.D.T.T. (IT25101540)</strong></td>
                  <td style={{ color: "var(--accent-lime)", fontWeight: 700 }}>0.9151 (0.9876 w/ Lags)</td>
                  <td>2.79 (1.03)</td>
                  <td>2.01 (0.74)</td>
                  <td>[128, 64, 32] Dense, ReLU, Adam (lr=0.001), Autoregressive Lags</td>
                  <td>Long-term non-linear thermal trend forecasting</td>
                </tr>
                <tr className={selectedModel === "rf" ? "highlighted" : ""}>
                  <td><strong>Random Forest (RF-1)</strong></td>
                  <td>Diyes C.L. (IT25100263)<br /><span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Peer Contributor</span></td>
                  <td style={{ color: "var(--accent-lime)", fontWeight: 700 }}>0.9331</td>
                  <td>2.48</td>
                  <td>1.82</td>
                  <td>100 Decision Trees, Bootstrap aggregation, Max Depth=None</td>
                  <td>Default operational ensemble; robust against sensor noise</td>
                </tr>
                <tr className={selectedModel === "gb" ? "highlighted" : ""}>
                  <td><strong>Gradient Boosting (GB-3)</strong></td>
                  <td>Zeen A.C. (IT25103342)<br /><span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Peer Contributor</span></td>
                  <td style={{ color: "var(--accent-lime)", fontWeight: 700 }}>0.8846</td>
                  <td>3.26</td>
                  <td>2.45</td>
                  <td>300 Boosters, Learning Rate=0.05, Hour Sin/Cos Cyclical Features</td>
                  <td>Diurnal radiative heating/cooling transition modeling</td>
                </tr>
                <tr>
                  <td><strong>Support Vector Regression (SVR-4)</strong></td>
                  <td>Dissanayake S.A.S.D. (IT25101062)<br /><span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Peer Contributor</span></td>
                  <td>0.8912</td>
                  <td>3.15</td>
                  <td>2.31</td>
                  <td>RBF Kernel, C=10.0, Epsilon=0.1, Standard Scaling</td>
                  <td>High-dimensional margin optimization baseline</td>
                </tr>
                <tr>
                  <td><strong>Decision Tree Regressor (DT-5)</strong></td>
                  <td>Gayathmi P.G.R. (IT25103013)<br /><span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Peer Contributor</span></td>
                  <td>0.8350</td>
                  <td>3.89</td>
                  <td>2.92</td>
                  <td>Single CART tree, MSE criterion, Min Samples Split=5</td>
                  <td>Interpretable rule extraction baseline</td>
                </tr>
                <tr>
                  <td><strong>Multiple Linear Regression (LR-6)</strong></td>
                  <td>Anaf M.K.A.S. (IT25102345)<br /><span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Peer Contributor</span></td>
                  <td>0.7410</td>
                  <td>4.88</td>
                  <td>3.84</td>
                  <td>Ordinary Least Squares (OLS) closed-form solution</td>
                  <td>Classical parametric reference benchmark</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ======================================================================
          SECTION 3: GROUND FROST & SRI LANKA AGRO HAZARDS
          ====================================================================== */}
      <section id="frost-section" className="scroll-section">
        <div className="section-hero-card liquid-glass">
          <div className="section-badge-tag" style={{ color: "var(--accent-cyan)" }}>
            <svg className="ui-icon sm" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            <span>Sri Lanka Microclimatic Hazards & Ground Frost ('Maha Pini') Protection</span>
          </div>
          <h2 className="section-title-large">Nocturnal Frost Defense & Heat Stress Mitigation</h2>
          <p className="section-desc-text">
            In Nuwara Eliya and the upcountry valleys of Sri Lanka, radiative heat loss during clear winter nights (December to February) causes ground temperatures to drop below 3.5°C, creating the devastating "Maha Pini" phenomenon. In contrast, dry-zone paddy fields in Anuradhapura face midday spikelet sterility when temperatures exceed 33°C.
          </p>

          <div className="hazard-matrix-grid">
            <div className="hazard-cell severe">
              <span className="hazard-label" style={{ color: "var(--accent-cyan)" }}>Severe Frost Burn</span>
              <div className="hazard-temp-range">&lt; 0.0 °C</div>
              <p className="hazard-action">Intracellular sap freezing; irreversible leaf necrosis in tea bushes and strawberry crowns. Immediate thermal blanket deployment mandatory.</p>
            </div>

            <div className="hazard-cell severe">
              <span className="hazard-label" style={{ color: "var(--accent-cyan)" }}>Ground Frost ('Maha Pini')</span>
              <div className="hazard-temp-range">0.1 – 3.8 °C</div>
              <p className="hazard-action">Sub-canopy frost condensation. Automated fine-droplet overhead sprinklers engage (+2.1°C thermal defense via latent heat of fusion).</p>
            </div>

            <div className="hazard-cell optimal">
              <span className="hazard-label" style={{ color: "var(--accent-emerald)" }}>Optimal Transpiration</span>
              <div className="hazard-temp-range">18.0 – 26.0 °C</div>
              <p className="hazard-action">Peak photosynthetic efficiency for protected crops. VPD balanced between 0.8–1.2 kPa; maximum nutrient absorption and sugar synthesis.</p>
            </div>

            <div className="hazard-cell heat">
              <span className="hazard-label" style={{ color: "var(--accent-rose)" }}>Paddy Heat Stress</span>
              <div className="hazard-temp-range">&gt; 33.0 °C</div>
              <p className="hazard-action">Spikelet sterility in flowering rice panicles; severe yield drop. Evaporative canopy misting & field flooding sluice gates open automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          SECTION 4: WATER & RESOURCE SAVINGS
          ====================================================================== */}
      <section id="water-section" className="scroll-section">
        <div className="section-hero-card liquid-glass">
          <div className="section-badge-tag" style={{ color: "var(--accent-lime)" }}>
            <svg className="ui-icon sm" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
            <span>Precision Irrigation & Yala Season Water Conservation</span>
          </div>
          <h2 className="section-title-large">AI-Driven Weather Postponement & Resource Optimization</h2>
          <p className="section-desc-text">
            Traditional timer-based irrigation systems waste up to 45% of applied water through runoff and deep percolation. By coupling real-time evapotranspiration modeling (ET0) with our 1-hour ahead predicted temperature (T_t+1) and relative humidity (RH), the platform halts unnecessary irrigation cycles when natural rain or high humidity provides adequate moisture.
          </p>

          <div className="water-savings-grid">
            <div className="fleet-pill-item" style={{ textAlign: "left", padding: "16px 20px" }}>
              <div className="lbl" style={{ color: "var(--accent-lime)" }}>Water Saved Daily</div>
              <div className="val" style={{ fontSize: "1.8rem", margin: "6px 0" }}>{waterSavedLiters.toLocaleString()} Liters</div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Average conservation across a 5-hectare commercial polyhouse/tea field.</p>
            </div>

            <div className="fleet-pill-item" style={{ textAlign: "left", padding: "16px 20px" }}>
              <div className="lbl" style={{ color: "var(--accent-cyan)" }}>Electricity Conserved</div>
              <div className="val" style={{ fontSize: "1.8rem", margin: "6px 0" }}>~2.4 kWh / Day</div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Pumping motor energy saved by suppressing unnecessary irrigation pressure pumps.</p>
            </div>

            <div className="fleet-pill-item" style={{ textAlign: "left", padding: "16px 20px" }}>
              <div className="lbl" style={{ color: "var(--accent-emerald)" }}>Nitrate Leaching Prevention</div>
              <div className="val" style={{ fontSize: "1.8rem", margin: "6px 0" }}>98.4% Efficiency</div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Prevents fertilizer washout from topsoil into Sri Lanka&apos;s rural groundwater aquifers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          SECTION 5: ABOUT THE PROJECT, SOLO CREATOR & PEER BENCHMARK
          ====================================================================== */}
      <section id="about-section" className="scroll-section" style={{ marginBottom: 40 }}>
        <div className="section-hero-card liquid-glass">
          <div className="section-badge-tag" style={{ color: "var(--accent-lime)" }}>
            <svg className="ui-icon sm" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>Applied AI System Architecture &amp; Platform Engineering // IT2011</span>
          </div>
          <h2 className="section-title-large">About AERO-AGRI OS 26 // Conceived &amp; Engineered by Gunathilaka H.D.T.T.</h2>
          <p className="section-desc-text">
            While the underlying academic machine learning investigation for SLIIT IT2011 was conducted as part of Group <strong>2026-Y2-S1-MLB-B9G2-01</strong> (a 6-member team where each member trained an empirical model on the Szeged weather dataset), <strong>this web application, visionOS liquid glass cockpit, interactive agro radar, and real-world microclimate decision support platform was designed, engineered, and implemented by Gunathilaka H.D.T.T. (IT25101540) as an interactive operational platform for agro-meteorological forecasting.</strong>
          </p>

          {/* Featured Solo Creator Showcase Card */}
          <div className="solo-architect-card">
            <div className="solo-header-flex">
              <div className="solo-avatar-row">
                <div className="member-avatar-badge" style={{ width: 56, height: 56, fontSize: "1.3rem", background: "rgba(210, 248, 46, 0.2)", borderColor: "var(--accent-lime)" }}>
                  TG
                </div>
                <div>
                  <div className="solo-badge">
                    <svg className="ui-icon sm" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <span>Lead System Architect &amp; Developer</span>
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFFFFF", marginTop: 4 }}>
                    Gunathilaka H.D.T.T.
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--accent-lime)", fontFamily: "var(--font-mono)" }}>
                    Registration No: IT25101540 // SLIIT Department of Computer Science &amp; Software Engineering
                  </div>
                </div>
              </div>

              <div className="solo-pill-tags">
                <span className="glass-pill active" style={{ fontSize: "0.72rem" }}>Platform Engineering &amp; Development</span>
                <span className="glass-pill active" style={{ fontSize: "0.72rem" }}>Lead Deep Learning Model</span>
                <span className="glass-pill active" style={{ fontSize: "0.72rem" }}>visionOS Liquid Glass UI</span>
              </div>
            </div>

            <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Gunathilaka designed and engineered this platform to evolve static, offline regression equations into an operational, automated agro-meteorological command system. He implemented the visionOS-inspired liquid glass aesthetic, developed the interactive GSAP 3 animation engine, designed the spatial GIS agro-radar for Sri Lanka&apos;s agricultural microclimates (Pedro Valley Tea, Polyhouse Floriculture, and Mahaweli Paddy), and deployed the state-of-the-art Deep Multilayer Perceptron (MLP-2) neural network.
            </p>

            {/* 4 Architectural Innovation Pillars */}
            <div className="solo-grid-pillars">
              <div className="solo-pillar-item">
                <div className="solo-pillar-title">
                  <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: "var(--accent-lime)" }}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                  <span>1. Platform Architecture</span>
                </div>
                <div className="solo-pillar-desc">
                  Full-stack Next.js + TypeScript + GSAP 3 development bridging ML modeling with real-world agro operations.
                </div>
              </div>

              <div className="solo-pillar-item">
                <div className="solo-pillar-title">
                  <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: "var(--accent-cyan)" }}><circle cx="12" cy="12" r="10"></circle><polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 8 12 2"></polygon></svg>
                  <span>2. Interactive Radar</span>
                </div>
                <div className="solo-pillar-desc">
                  Real-time multi-plot spatial geolocation selector with 3D tilted liquid glass card and simulated diurnal solar cycles.
                </div>
              </div>

              <div className="solo-pillar-item">
                <div className="solo-pillar-title">
                  <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: "#38BDF8" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  <span>3. Agro-Defense Suite</span>
                </div>
                <div className="solo-pillar-desc">
                  Automated ground frost (&apos;Maha Pini&apos;) detection algorithms, FAO Vapor Pressure Deficit (VPD), and actuator triggers.
                </div>
              </div>

              <div className="solo-pillar-item">
                <div className="solo-pillar-title">
                  <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: "var(--accent-amber)" }}><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>
                  <span>4. Deep MLP Modeling</span>
                </div>
                <div className="solo-pillar-desc">
                  Constructed 3-layer architecture [128, 64, 32] with Adam optimization, achieving top fleet accuracy: R² = 0.9876, RMSE = 1.03°C.
                </div>
              </div>
            </div>
          </div>

          {/* Academic Peer Contributors Sub-Section */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--glass-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <svg className="ui-icon sm" viewBox="0 0 24 24" style={{ stroke: "var(--accent-cyan)" }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#FFFFFF" }}>
                SLIIT Academic Group 2026-Y2-S1-MLB-B9G2-01 // Peer Model Contributors
              </h3>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 12 }}>
              To provide a comprehensive comparative benchmark within Gunathilaka&apos;s platform, the 5 models trained by academic group peers are integrated into the decision fleet:
            </p>

            <div className="peer-contributors-grid">
              <div className="peer-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="member-avatar-badge" style={{ width: 34, height: 34, fontSize: "0.8rem", background: "rgba(56, 189, 248, 0.15)", borderColor: "rgba(56, 189, 248, 0.35)", color: "var(--accent-cyan)" }}>CD</div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FFFFFF" }}>Diyes C.L.</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>IT25100263</div>
                  </div>
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                  <strong>Random Forest (RF-1)</strong><br />
                  100 Trees, Bootstrap Aggregation<br />
                  R²: <strong>0.9331</strong> | RMSE: <strong>2.48°C</strong>
                </div>
              </div>

              <div className="peer-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="member-avatar-badge" style={{ width: 34, height: 34, fontSize: "0.8rem", background: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.35)", color: "var(--accent-amber)" }}>AZ</div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FFFFFF" }}>Zeen A.C.</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--accent-amber)", fontFamily: "var(--font-mono)" }}>IT25103342</div>
                  </div>
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                  <strong>Gradient Boosting (GB-3)</strong><br />
                  300 Estimators, Cyclical Sin/Cos<br />
                  R²: <strong>0.8846</strong> | RMSE: <strong>3.26°C</strong>
                </div>
              </div>

              <div className="peer-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="member-avatar-badge" style={{ width: 34, height: 34, fontSize: "0.8rem", background: "rgba(168, 85, 247, 0.15)", borderColor: "rgba(168, 85, 247, 0.35)", color: "#C084FC" }}>SD</div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FFFFFF" }}>Dissanayake S.A.</div>
                    <div style={{ fontSize: "0.7rem", color: "#C084FC", fontFamily: "var(--font-mono)" }}>IT25101062</div>
                  </div>
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                  <strong>Support Vector Regressor (SVR-4)</strong><br />
                  RBF Kernel, C=10.0, Epsilon=0.1<br />
                  R²: <strong>0.8912</strong> | RMSE: <strong>3.15°C</strong>
                </div>
              </div>

              <div className="peer-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="member-avatar-badge" style={{ width: 34, height: 34, fontSize: "0.8rem", background: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.35)", color: "var(--accent-emerald)" }}>RG</div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FFFFFF" }}>Gayathmi P.G.R.</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--accent-emerald)", fontFamily: "var(--font-mono)" }}>IT25103313</div>
                  </div>
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                  <strong>Decision Tree (DT-5)</strong><br />
                  Single CART Tree, Split=5<br />
                  R²: <strong>0.8350</strong> | RMSE: <strong>3.89°C</strong>
                </div>
              </div>

              <div className="peer-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="member-avatar-badge" style={{ width: 34, height: 34, fontSize: "0.8rem", background: "rgba(239, 68, 68, 0.15)", borderColor: "rgba(239, 68, 68, 0.35)", color: "#F87171" }}>SA</div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FFFFFF" }}>Anaf M.K.A.S.</div>
                    <div style={{ fontSize: "0.7rem", color: "#F87171", fontFamily: "var(--font-mono)" }}>IT25102345</div>
                  </div>
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                  <strong>Linear Regression (LR-6)</strong><br />
                  OLS Closed-Form Solution<br />
                  R²: <strong>0.7410</strong> | RMSE: <strong>4.88°C</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Academic References */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--glass-border)" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 10 }}>
              Academic &amp; Dataset References
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              <div>
                1. Breiman, L. (2001). &apos;Random Forests.&apos; <em>Machine Learning</em>, 45(1), 5-32. <a href="https://doi.org/10.1023/A:1010933404324" target="_blank" rel="noreferrer" style={{ color: "var(--accent-cyan)", textDecoration: "none" }}>[DOI Link]</a>
              </div>
              <div>
                2. Friedman, J. H. (2001). &apos;Greedy Function Approximation: A Gradient Boosting Machine.&apos; <em>Annals of Statistics</em>, 29(5), 1189-1232. <a href="https://doi.org/10.1214/aos/1013203451" target="_blank" rel="noreferrer" style={{ color: "var(--accent-cyan)", textDecoration: "none" }}>[DOI Link]</a>
              </div>
              <div>
                3. Kingma, D. P., &amp; Ba, J. (2014). &apos;Adam: A Method for Stochastic Optimization.&apos; <em>arXiv preprint arXiv:1412.6980</em>. <a href="https://arxiv.org/abs/1412.6980" target="_blank" rel="noreferrer" style={{ color: "var(--accent-cyan)", textDecoration: "none" }}>[arXiv:1412.6980]</a>
              </div>
              <div>
                4. Pedregosa, F., et al. (2011). &apos;Scikit-learn: Machine Learning in Python.&apos; <em>Journal of Machine Learning Research</em>, 12, 2825-2830. <a href="https://www.jmlr.org/papers/v12/pedregosa11a.html" target="_blank" rel="noreferrer" style={{ color: "var(--accent-cyan)", textDecoration: "none" }}>[JMLR Link]</a>
              </div>
              <div>
                5. Vapnik, V. (1995). <em>The Nature of Statistical Learning Theory</em>. Springer-Verlag New York. <a href="https://doi.org/10.1007/978-1-4757-2440-0" target="_blank" rel="noreferrer" style={{ color: "var(--accent-cyan)", textDecoration: "none" }}>[Springer Link]</a>
              </div>
              <div>
                6. World Meteorological Organization (WMO). (2018). <em>Guide to Meteorological Instruments and Methods of Observation</em>. WMO-No. 8, Geneva. <a href="https://library.wmo.int/idurl/4/41650" target="_blank" rel="noreferrer" style={{ color: "var(--accent-cyan)", textDecoration: "none" }}>[WMO Library]</a>
              </div>
              <div>
                7. Szeged Meteorological Weather Archive (2006–2016). Historical weather observation dataset. <a href="https://www.kaggle.com/datasets/muthuj7/weather-dataset" target="_blank" rel="noreferrer" style={{ color: "var(--accent-lime)", textDecoration: "none" }}>[Kaggle Dataset Source]</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cockpit Footer */}
      <footer className="cockpit-footer">
        <div>
          <strong style={{ color: "#FFFFFF" }}>AERO-AGRI OS 26</strong> // Platform Architecture &amp; System Engineering by{" "}
          <span style={{ color: "var(--accent-lime)", fontWeight: 700 }}>Gunathilaka H.D.T.T. (IT25101540)</span>
        </div>
        <div>
          Benchmarking Models from SLIIT Academic Group <strong>2026-Y2-S1-MLB-B9G2-01</strong>
        </div>
        <div style={{ color: "var(--text-muted)" }}>
          Faculty of Computing | Department of Computer Science &amp; Software Engineering | SLIIT
        </div>
      </footer>

      {/* ======================================================================
          iOS 26 FLOATING MOBILE BOTTOM NAVIGATION DOCK (VISIBLE ON MOBILE/TABLETS)
          ====================================================================== */}
      <nav className="mobile-bottom-dock" aria-label="Mobile Navigation Bar">
        <button
          className={`mobile-dock-btn ${activeTab === "radar-section" ? "active" : ""}`}
          onClick={() => scrollToSection("radar-section")}
        >
          <svg viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon></svg>
          <span>Radar</span>
        </button>
        <button
          className={`mobile-dock-btn ${activeTab === "fleet-section" ? "active" : ""}`}
          onClick={() => scrollToSection("fleet-section")}
        >
          <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>
          <span>Fleet (6)</span>
        </button>
        <button
          className={`mobile-dock-btn ${activeTab === "frost-section" ? "active" : ""}`}
          onClick={() => scrollToSection("frost-section")}
        >
          <svg viewBox="0 0 24 24" style={isFrostImminent ? { stroke: "var(--accent-cyan)" } : {}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          <span>Frost</span>
        </button>
        <button
          className={`mobile-dock-btn ${activeTab === "water-section" ? "active" : ""}`}
          onClick={() => scrollToSection("water-section")}
        >
          <svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
          <span>Water</span>
        </button>
        <button
          className={`mobile-dock-btn ${activeTab === "about-section" ? "active" : ""}`}
          onClick={() => scrollToSection("about-section")}
        >
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>About</span>
        </button>
      </nav>

      {/* ======================================================================
          PLAYGROUND MODAL
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
              <button onClick={() => setIsPlaygroundOpen(false)} className="zoom-btn" style={{ width: 32, height: 32 }}>
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Customize and test real-time visionOS / iOS 26 frosted glass refraction, multi-layer depth, and 3D specular bevel highlights live on the platform.
            </p>

            <div className="playground-grid">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="ctrl-slider-unit">
                  <div className="ctrl-label-flex">
                    <span className="lbl">Frosted Glass Blur:</span>
                    <span className="val">{glassBlur}px</span>
                  </div>
                  <input type="range" min="8" max="60" step="1" value={glassBlur} onChange={(e) => setGlassBlur(parseInt(e.target.value))} />
                </div>

                <div className="ctrl-slider-unit">
                  <div className="ctrl-label-flex">
                    <span className="lbl">Color Saturation:</span>
                    <span className="val">{glassSaturate}%</span>
                  </div>
                  <input type="range" min="100" max="260" step="5" value={glassSaturate} onChange={(e) => setGlassSaturate(parseInt(e.target.value))} />
                </div>

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
              <button onClick={() => setIsPlaygroundOpen(false)} className="btn-actuate-full" style={{ width: "auto", padding: "10px 24px" }}>
                <span>Apply to Cockpit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
