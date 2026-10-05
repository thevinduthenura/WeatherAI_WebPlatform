"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { AgroPlot } from "../app/page";

interface RealAgroMapProps {
  plots: AgroPlot[];
  selectedPlot: AgroPlot;
  selectedModel: string;
  displayPredictedTemp: number;
  temp: number;
  humidity: number;
  pressure: number;
  vpd: number;
  delta: number;
  isNight: boolean;
  isFrostImminent: boolean;
  onSelectPlot: (plot: AgroPlot) => void;
  onCustomLocationSelect: (loc: {
    name: string;
    lat: number;
    lng: number;
    elevation: number;
    temp: number;
    humidity: number;
    soil: number;
  }) => void;
}

type MapLayerType = "satellite" | "dark" | "osm";

export default function RealAgroMap({
  plots,
  selectedPlot,
  selectedModel,
  displayPredictedTemp,
  temp,
  humidity,
  pressure,
  vpd,
  delta,
  isNight,
  isFrostImminent,
  onSelectPlot,
  onCustomLocationSelect,
}: RealAgroMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const customMarkerRef = useRef<L.Marker | null>(null);
  const plotMarkersRef = useRef<Map<string, L.Marker>>(new Map());

  const [activeLayer, setActiveLayer] = useState<MapLayerType>("satellite");
  const [activeInspectPoint, setActiveInspectPoint] = useState<{
    name: string;
    lat: number;
    lng: number;
    elevation: number;
    isCustom: boolean;
  }>({
    name: selectedPlot.name,
    lat: selectedPlot.lat,
    lng: selectedPlot.lng,
    elevation: selectedPlot.elevation,
    isCustom: false,
  });

  const [popupOpen, setPopupOpen] = useState<boolean>(true);

  // Tile Layer Providers
  const tileProviders: Record<MapLayerType, { url: string; options: L.TileLayerOptions }> = {
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      options: {
        maxZoom: 19,
        attribution: "Esri World Imagery | High-Resolution Earth Observation",
      },
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      options: {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: "CartoDB Dark Matter | Tactical Geospatial Vector",
      },
    },
    osm: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: {
        maxZoom: 19,
        attribution: "OpenStreetMap contributors | Topographic GIS",
      },
    },
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center on Sri Lanka Central Agricultural Highlands
    const initialMap = L.map(mapContainerRef.current, {
      center: [selectedPlot.lat, selectedPlot.lng],
      zoom: 12,
      zoomControl: false, // We render custom polished glass zoom controls
      attributionControl: false,
    });

    const defaultLayer = L.tileLayer(
      tileProviders.satellite.url,
      tileProviders.satellite.options
    ).addTo(initialMap);

    activeTileLayerRef.current = defaultLayer;
    mapInstanceRef.current = initialMap;

    // Fix icons if default Leaflet icon paths break
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    // Add Markers for preset agricultural plots
    plots.forEach((plot) => {
      const isTea = plot.id === "plot-a";
      const isFlower = plot.id === "plot-b";
      const iconClass = isTea ? "tea-color" : isFlower ? "greenhouse-color" : "paddy-color";
      const iconEmoji = isTea ? "🍃" : isFlower ? "🌸" : "🌾";

      const htmlContent = `
        <div class="hud-pin-marker ${iconClass}">
          <div class="pin-pulse-ring"></div>
          <div class="pin-core-circle">
            <span style="font-size: 15px;">${iconEmoji}</span>
          </div>
          <div class="pin-badge">
            <span class="pin-title">${plot.name.split(" ")[0]}</span>
            <span class="pin-metric">${plot.elevation}m</span>
          </div>
        </div>
      `;

      const customDivIcon = L.divIcon({
        html: htmlContent,
        className: "custom-leaflet-agro-pin",
        iconSize: [120, 42],
        iconAnchor: [20, 21],
      });

      const marker = L.marker([plot.lat, plot.lng], { icon: customDivIcon })
        .addTo(initialMap)
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectPlot(plot);
          setActiveInspectPoint({
            name: plot.name,
            lat: plot.lat,
            lng: plot.lng,
            elevation: plot.elevation,
            isCustom: false,
          });
          setPopupOpen(true);
          initialMap.flyTo([plot.lat, plot.lng], 13, { duration: 1.2 });
        });

      plotMarkersRef.current.set(plot.id, marker);
    });

    // CLICK ANYWHERE ON REAL MAP TO INSPECT LIVE MICROCLIMATE
    initialMap.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Realistic environmental lapse rate elevation estimation based on Sri Lanka mountain massif
      // Mount Pidurutalagala highest point in Sri Lanka: Lat 6.9872, Lng 80.7725, Elevation 2,524m
      const distToPeakDeg = Math.hypot(lat - 6.9872, lng - 80.7725);
      const distToPeakKm = distToPeakDeg * 111; // approx 111 km per degree

      // Elevation drops from ~2500m at Pidurutalagala to ~30m on coastal plains
      let computedElevation = Math.max(35, Math.round(2520 - distToPeakKm * 32));
      if (lat > 7.6) computedElevation = Math.max(40, Math.min(220, computedElevation)); // Dry Zone plains (Polonnaruwa/Anuradhapura)

      const diurnalEffect = isNight ? -3.5 : 2.5;
      const computedTemp = +(31.2 - (computedElevation / 1000) * 6.5 + diurnalEffect).toFixed(1);
      const computedHum = Math.min(96, Math.max(42, Math.round(55 + (computedElevation > 1200 ? 28 : -8))));
      const computedSoil = Math.min(88, Math.max(25, Math.round(35 + (computedElevation > 1000 ? 28 : 10))));

      const locName = `GIS Geo-Node [${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E]`;

      setActiveInspectPoint({
        name: locName,
        lat,
        lng,
        elevation: computedElevation,
        isCustom: true,
      });

      setPopupOpen(true);

      // Place or move custom glowing beacon marker
      if (customMarkerRef.current) {
        customMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const beaconIcon = L.divIcon({
          html: `
            <div class="custom-map-beacon">
              <div class="beacon-ripple"></div>
              <div class="beacon-dot"></div>
            </div>
          `,
          className: "custom-leaflet-beacon-wrapper",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        customMarkerRef.current = L.marker([lat, lng], { icon: beaconIcon }).addTo(initialMap);
      }

      onCustomLocationSelect({
        name: locName,
        lat,
        lng,
        elevation: computedElevation,
        temp: computedTemp,
        humidity: computedHum,
        soil: computedSoil,
      });
    });

    return () => {
      initialMap.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when layer switch button is clicked
  const switchLayer = (type: MapLayerType) => {
    if (!mapInstanceRef.current) return;
    setActiveLayer(type);

    if (activeTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(activeTileLayerRef.current);
    }

    const newLayer = L.tileLayer(
      tileProviders[type].url,
      tileProviders[type].options
    ).addTo(mapInstanceRef.current);

    activeTileLayerRef.current = newLayer;
  };

  // Fly to selected plot when changed from parent
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([selectedPlot.lat, selectedPlot.lng], 13, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    setActiveInspectPoint({
      name: selectedPlot.name,
      lat: selectedPlot.lat,
      lng: selectedPlot.lng,
      elevation: selectedPlot.elevation,
      isCustom: false,
    });
    setPopupOpen(true);
  }, [selectedPlot.id]);

  // Zoom controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    mapInstanceRef.current?.flyTo([selectedPlot.lat, selectedPlot.lng], 12, { duration: 1 });
  };

  return (
    <div className="real-map-wrapper liquid-glass" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: "var(--radius-md)" }}>
      {/* Real Interactive Leaflet Map Container */}
      <div
        ref={mapContainerRef}
        className="real-leaflet-map-host"
        style={{
          width: "100%",
          height: "480px",
          minHeight: "420px",
          background: "#050807",
          cursor: "crosshair",
        }}
      />

      {/* Map Header Overlay */}
      <div className="map-header-bar" style={{ position: "absolute", top: 14, left: 16, zIndex: 500, pointerEvents: "none" }}>
        <div className="map-title-block" style={{ pointerEvents: "auto", background: "rgba(10, 16, 13, 0.88)", backdropFilter: "blur(20px)", padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.14)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.64rem", color: "var(--accent-lime)", fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>
            <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-lime)", display: "inline-block", boxShadow: "0 0 8px var(--accent-lime)" }}></span>
            <span>LIVE ESRI GIS SATELLITE ENGINE // CLICK ANYWHERE TO INSPECT</span>
          </div>
          <h1 style={{ fontSize: "1.1rem", margin: 0, color: "#FFFFFF", fontWeight: 700 }}>{activeInspectPoint.name}</h1>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
            COORDINATES: {activeInspectPoint.lat.toFixed(4)}°N, {activeInspectPoint.lng.toFixed(4)}°E // ELEVATION: {activeInspectPoint.elevation}M
          </div>
        </div>
      </div>

      {/* Real Tile Layer Selector Switch (Satellite / Dark Matter / Topo) */}
      <div className="map-layer-selector-bar" style={{ position: "absolute", top: 14, right: 16, zIndex: 500, display: "flex", gap: 5 }}>
        <button
          onClick={() => switchLayer("satellite")}
          className={`map-layer-tab ${activeLayer === "satellite" ? "active" : ""}`}
          title="High-Resolution Real Earth Observation Satellite Imagery"
        >
          🛰 Real Satellite
        </button>
        <button
          onClick={() => switchLayer("dark")}
          className={`map-layer-tab ${activeLayer === "dark" ? "active" : ""}`}
          title="CartoDB Dark Matter Tactical Night Vector"
        >
          🌑 Dark GIS
        </button>
        <button
          onClick={() => switchLayer("osm")}
          className={`map-layer-tab ${activeLayer === "osm" ? "active" : ""}`}
          title="OpenStreetMap Topographic GIS Map"
        >
          🗺 Topo
        </button>
      </div>

      {/* Floating Dynamic Liquid Glass Info Popup (Opens on any clicked point / plot) */}
      {popupOpen && (
        <div
          className="satellite-map-popup liquid-glass"
          style={{
            position: "absolute",
            bottom: 60,
            left: 18,
            zIndex: 600,
            maxWidth: 320,
          }}
        >
          <div className="popup-header-row">
            <div className="popup-title-group">
              <div className="popup-live-indicator">
                <span className="dot"></span>
                <span>{activeInspectPoint.isCustom ? "GIS GPS TELEMETRY" : "VERIFIED AGRO HOTSPOT"}</span>
              </div>
              <div className="popup-main-title">{activeInspectPoint.name}</div>
              <div className="popup-sub-title">
                {activeInspectPoint.lat.toFixed(4)}°N, {activeInspectPoint.lng.toFixed(4)}°E • {activeInspectPoint.elevation}m
              </div>
            </div>
            <button
              className="popup-close-btn"
              onClick={() => setPopupOpen(false)}
              title="Close Popup"
            >
              ✕
            </button>
          </div>

          <div className="popup-temp-display">
            <div className="popup-temp-number">
              {displayPredictedTemp.toFixed(1)}°C
              <span className="popup-temp-label">Predicted (1h)</span>
            </div>
            <div className="popup-temp-model-tag">
              {selectedModel.toUpperCase()} AI
            </div>
          </div>

          <div className="popup-delta-text">
            Ambient: <strong>{temp.toFixed(1)}°C</strong> | Delta: <strong>{delta >= 0 ? "+" : ""}{delta.toFixed(2)}°C</strong> ({isNight ? "Nocturnal Cooling" : "Solar Warming"})
          </div>

          <div className="popup-metrics-grid">
            <div className="popup-metric-item">
              <span className="lbl">VPD</span>
              <span className="val">{vpd.toFixed(2)} kPa</span>
            </div>
            <div className="popup-metric-item">
              <span className="lbl">RH</span>
              <span className="val">{humidity}%</span>
            </div>
            <div className="popup-metric-item">
              <span className="lbl">Soil</span>
              <span className="val">{selectedPlot.moisture}%</span>
            </div>
            <div className="popup-metric-item">
              <span className="lbl">Pressure</span>
              <span className="val">{pressure} mb</span>
            </div>
          </div>

          <div className={`popup-status-badge ${isFrostImminent ? "danger" : "normal"}`}>
            <span className="status-dot"></span>
            <span>{isFrostImminent ? "CRITICAL GROUND FROST HAZARD" : "OPTIMAL THERMAL BIOSPHERE"}</span>
          </div>
        </div>
      )}

      {/* Unified Bottom Bar (Zoom Controls + Radar Status + Live Telemetry Meta) */}
      <div className="map-bottom-strip" style={{ position: "absolute", bottom: 12, left: 16, right: 16, zIndex: 500, pointerEvents: "auto" }}>
        <div className="map-floating-controls-inline">
          <div className="map-zoom-pill">
            <button className="map-zoom-btn" onClick={handleZoomIn} title="Zoom In">+</button>
            <button className="map-zoom-btn" onClick={handleResetView} title="Re-center on Agricultural Hotspot">⌖</button>
            <button className="map-zoom-btn" onClick={handleZoomOut} title="Zoom Out">-</button>
          </div>
          <div className="radar-status-pill">
            🛰 REAL SATELLITE ENGINE // ACTIVE
          </div>
        </div>

        <div className="map-telemetry-meta-pill">
          GPS: <strong>{activeInspectPoint.lat.toFixed(4)}°N, {activeInspectPoint.lng.toFixed(4)}°E</strong> | Elev: <strong>{activeInspectPoint.elevation}m</strong> | Model: <strong style={{ color: "var(--accent-lime)" }}>{selectedModel.toUpperCase()}</strong>
        </div>
      </div>
    </div>
  );
}
