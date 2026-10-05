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

interface MapCorridorNode {
  id: string;
  name: string;
  category: "cold" | "hydro" | "bio" | "agro";
  categoryLabel: string;
  color: string;
  icon: string;
  lat: number;
  lng: number;
  elevation: number;
  crop: string;
  baseTemp: number;
  rh: number;
  vpd: number;
  image: string;
  desc: string;
}

// SVG string generator for Leaflet map markers
function getNodeIconSvg(iconKey: string, size = 12, strokeColor = "currentColor"): string {
  switch (iconKey) {
    case "leaf":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;
    case "frost":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/><circle cx="12" cy="12" r="2.5"/></svg>`;
    case "flower":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"/></svg>`;
    case "water":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    case "power":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
    case "wave":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c.6 0 1.2-.2 1.7-.6 1.1-.8 2.6-.8 3.7 0 1.1.8 2.6.8 3.7 0 1.1-.8 2.6-.8 3.7 0 .5.4 1.1.6 1.7.6"/><path d="M2 17c.6 0 1.2-.2 1.7-.6 1.1-.8 2.6-.8 3.7 0 1.1.8 2.6.8 3.7 0 1.1-.8 2.6-.8 3.7 0 .5.4 1.1.6 1.7.6"/></svg>`;
    case "tree":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 19 12 15 12 20 18 4 18 9 12 5 12 12 2"/><rect x="11" y="18" width="2" height="4"/></svg>`;
    case "sprout":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4-.1 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4.3.7-4.9 2z"/></svg>`;
    case "carrot":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7z"/><path d="M22 2l-2.5 2.5M16 2.5L18.5 5M21.5 8L19 5.5"/></svg>`;
    case "grain":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22l10-10"/><path d="M16 8l-2 2"/><path d="M18 6a3 3 0 0 0-4.24 0l-1.42 1.42a3 3 0 0 0 0 4.24l.71.71a3 3 0 0 0 4.24 0L18.7 11a3 3 0 0 0 0-4.24z"/></svg>`;
    case "target":
    default:
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>`;
  }
}

// React SVG UI icon renderer for UI panels and cards
function RenderNodeIcon({ name, size = 13, className = "" }: { name: string; size?: number; className?: string }) {
  switch (name) {
    case "leaf":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
        </svg>
      );
    case "frost":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/><circle cx="12" cy="12" r="2.5"/>
        </svg>
      );
    case "flower":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="3"/><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"/>
        </svg>
      );
    case "water":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
      );
    case "power":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      );
    case "wave":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2 12c.6 0 1.2-.2 1.7-.6 1.1-.8 2.6-.8 3.7 0 1.1.8 2.6.8 3.7 0 1.1-.8 2.6-.8 3.7 0 .5.4 1.1.6 1.7.6"/><path d="M2 17c.6 0 1.2-.2 1.7-.6 1.1-.8 2.6-.8 3.7 0 1.1.8 2.6.8 3.7 0 1.1-.8 2.6-.8 3.7 0 .5.4 1.1.6 1.7.6"/>
        </svg>
      );
    case "tree":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <polygon points="12 2 19 12 15 12 20 18 4 18 9 12 5 12 12 2"/><rect x="11" y="18" width="2" height="4"/>
        </svg>
      );
    case "sprout":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4-.1 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4.3.7-4.9 2z"/>
        </svg>
      );
    case "carrot":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7z"/><path d="M22 2l-2.5 2.5M16 2.5L18.5 5M21.5 8L19 5.5"/>
        </svg>
      );
    case "grain":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2 22l10-10"/><path d="M16 8l-2 2"/><path d="M18 6a3 3 0 0 0-4.24 0l-1.42 1.42a3 3 0 0 0 0 4.24l.71.71a3 3 0 0 0 4.24 0L18.7 11a3 3 0 0 0 0-4.24z"/>
        </svg>
      );
    case "target":
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>
        </svg>
      );
  }
}

// Comprehensive GIS corridors inspired by Image 1 (Opportunities / Agro Metabolism)
const GIS_CORRIDOR_NODES: MapCorridorNode[] = [
  // Category 1: Cold Sinks (Highland Tea & Frost Zones - Purple/Magenta)
  {
    id: "node-pedro",
    name: "Pedro Valley Tea Estate",
    category: "cold",
    categoryLabel: "Highland Cold Sinks",
    color: "#d946ef",
    icon: "leaf",
    lat: 6.9780,
    lng: 80.7850,
    elevation: 1940,
    crop: "High-Grown Broken Orange Pekoe",
    baseTemp: 11.8,
    rh: 88,
    vpd: 0.38,
    image: "/hero_highland_dawn.jpg",
    desc: "Primary nocturnal frost pocket in Nuwara Eliya valley basin.",
  },
  {
    id: "node-horton",
    name: "Horton Plains Frost Sink",
    category: "cold",
    categoryLabel: "Highland Cold Sinks",
    color: "#c084fc",
    icon: "frost",
    lat: 6.8028,
    lng: 80.8065,
    elevation: 2134,
    crop: "Montane Grassland & Cloud Forest",
    baseTemp: 7.4,
    rh: 94,
    vpd: 0.22,
    image: "/misty_mountain_hero.jpg",
    desc: "Sub-zero radiative cold air drainage basin; highest frost vulnerability.",
  },
  {
    id: "node-hakgala",
    name: "Hakgala Alpine Greenhouses",
    category: "cold",
    categoryLabel: "Highland Cold Sinks",
    color: "#f472b6",
    icon: "flower",
    lat: 6.9280,
    lng: 80.8200,
    elevation: 1745,
    crop: "Temperate Orchids & Cut Flowers",
    baseTemp: 14.5,
    rh: 82,
    vpd: 0.52,
    image: "/smart_farm_aerial.jpg",
    desc: "Precision climate-controlled alpine glasshouses under diurnal fog cycles.",
  },

  // Category 2: Hydrological Basins & Reservoirs (Electric Glowing Water - Cyan/Blue)
  {
    id: "node-gregory",
    name: "Lake Gregory Hydro-Basin",
    category: "hydro",
    categoryLabel: "Hydrological Basins",
    color: "#38bdf8",
    icon: "water",
    lat: 6.9530,
    lng: 80.7820,
    elevation: 1875,
    crop: "Montane Riparian Wetland Catchment",
    baseTemp: 13.8,
    rh: 90,
    vpd: 0.32,
    image: "/hero_highland_dawn.jpg",
    desc: "Thermal thermal-buffer lake buffering nocturnal frost dissipation.",
  },
  {
    id: "node-kotmale",
    name: "Kotmale Mahaweli Waters",
    category: "hydro",
    categoryLabel: "Hydrological Basins",
    color: "#06b6d4",
    icon: "power",
    lat: 7.0350,
    lng: 80.6400,
    elevation: 700,
    crop: "Hydro-Reservoir Watershed & Forest",
    baseTemp: 22.4,
    rh: 78,
    vpd: 0.85,
    image: "/satellite_terrain.jpg",
    desc: "Major hydroelectric runoff channel feeding central agricultural cascade.",
  },
  {
    id: "node-castlereagh",
    name: "Castlereagh Catchment",
    category: "hydro",
    categoryLabel: "Hydrological Basins",
    color: "#0284c7",
    icon: "wave",
    lat: 6.8650,
    lng: 80.6300,
    elevation: 1080,
    crop: "Valley Reservoir & Tea Terraces",
    baseTemp: 19.6,
    rh: 84,
    vpd: 0.65,
    image: "/hero_highland_dawn.jpg",
    desc: "Kehelgamu Oya feeder basin regulating tea soil humidity levels.",
  },

  // Category 3: Protected Biospheres (Emerald Green)
  {
    id: "node-piduru",
    name: "Mount Pidurutalagala Summit",
    category: "bio",
    categoryLabel: "Protected Biosphere",
    color: "#10b981",
    icon: "tree",
    lat: 7.0006,
    lng: 80.7725,
    elevation: 2524,
    crop: "Pygmy Cloud Forest Reserve",
    baseTemp: 8.2,
    rh: 96,
    vpd: 0.18,
    image: "/misty_mountain_hero.jpg",
    desc: "Apex atmospheric apex weather radar station; 2,524m ceiling.",
  },
  {
    id: "node-knuckles",
    name: "Knuckles Cloud Corridor",
    category: "bio",
    categoryLabel: "Protected Biosphere",
    color: "#34d399",
    icon: "sprout",
    lat: 7.4400,
    lng: 80.7800,
    elevation: 1860,
    crop: "Montane Biodiversity Biosphere",
    baseTemp: 16.2,
    rh: 86,
    vpd: 0.48,
    image: "/smart_farm_aerial.jpg",
    desc: "UNESCO wilderness buffer maintaining highland rainfall distribution.",
  },

  // Category 4: Agro Plains & Food Corridors (Gold / Amber)
  {
    id: "node-welimada",
    name: "Welimada Vegetable Terraces",
    category: "agro",
    categoryLabel: "Agro Food Corridors",
    color: "#fbbf24",
    icon: "carrot",
    lat: 6.9030,
    lng: 80.9000,
    elevation: 1060,
    crop: "Exotic Highland Vegetables (Carrot/Leek)",
    baseTemp: 21.5,
    rh: 72,
    vpd: 0.95,
    image: "/smart_farm_aerial.jpg",
    desc: "High-yield vegetable agro-belt requiring ET0 precision water balancing.",
  },
  {
    id: "node-anu",
    name: "Anuradhapura Maha Paddy Plains",
    category: "agro",
    categoryLabel: "Agro Food Corridors",
    color: "#f59e0b",
    icon: "grain",
    lat: 8.3114,
    lng: 80.4037,
    elevation: 115,
    crop: "Maha Season Irrigated Rice (Bg 352)",
    baseTemp: 32.8,
    rh: 58,
    vpd: 1.45,
    image: "/satellite_terrain.jpg",
    desc: "Cascade reservoir (tank) network supporting national staple grain security.",
  },
];

// Glowing Electric Blue Hydrological Channels (Inspired by Ahramat Nile in Image 2)
const HYDRO_CHANNELS: [number, number][][] = [
  // Upper Mahaweli / Kotmale Oya Channel
  [
    [6.980, 80.775],
    [6.972, 80.750],
    [6.960, 80.730],
    [6.975, 80.700],
    [7.010, 80.670],
    [7.035, 80.640],
    [7.080, 80.610],
    [7.140, 80.590],
  ],
  // Gregory Lake feeder cascades
  [
    [7.000, 80.785],
    [6.978, 80.785],
    [6.965, 80.783],
    [6.953, 80.782],
    [6.938, 80.765],
  ],
  // Horton Plains Headwaters to Castlereagh
  [
    [6.802, 80.806],
    [6.820, 80.760],
    [6.845, 80.690],
    [6.865, 80.630],
  ],
];

// Agro Moisture & Trade Flow Arcs (Curved pathways like Image 1)
const AGRO_TRADE_ARCS: [number, number][][] = [
  // Pedro Valley -> Welimada
  [
    [6.978, 80.785],
    [6.950, 80.840],
    [6.920, 80.875],
    [6.903, 80.900],
  ],
  // Nuwara Eliya -> Kandy -> Dry Zone Corridors
  [
    [6.978, 80.785],
    [7.150, 80.720],
    [7.440, 80.650],
    [7.850, 80.550],
    [8.311, 80.403],
  ],
];

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
  const nodeMarkersRef = useRef<Map<string, L.Marker>>(new Map());

  const [activeLayer, setActiveLayer] = useState<MapLayerType>("satellite");
  const [activeNode, setActiveNode] = useState<MapCorridorNode>(GIS_CORRIDOR_NODES[0]);
  const [popupOpen, setPopupOpen] = useState<boolean>(true);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");
  const [showHydrology, setShowHydrology] = useState<boolean>(true);
  const [showThermalZones, setShowThermalZones] = useState<boolean>(true);

  // Tile Providers (High contrast Esri Satellite, Carto Dark Matter, OSM Topo)
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

  const convertTemp = (celsius: number) => {
    return tempUnit === "C" ? celsius.toFixed(1) : ((celsius * 9) / 5 + 32).toFixed(1);
  };

  // Fly to node and activate popup
  const focusOnNode = (node: MapCorridorNode) => {
    setActiveNode(node);
    setPopupOpen(true);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([node.lat, node.lng], 13.5, {
        duration: 1.4,
        easeLinearity: 0.25,
      });
    }

    // Match with closest plot in parent if applicable
    const matchingPlot = plots.find((p) => Math.hypot(p.lat - node.lat, p.lng - node.lng) < 0.1);
    if (matchingPlot) {
      onSelectPlot(matchingPlot);
    } else {
      onCustomLocationSelect({
        name: node.name,
        lat: node.lat,
        lng: node.lng,
        elevation: node.elevation,
        temp: node.baseTemp,
        humidity: node.rh,
        soil: 70,
      });
    }
  };

  // Initialize Leaflet Map with glowing vector layers
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center over Nuwara Eliya / Central Highlands
    const initialMap = L.map(mapContainerRef.current, {
      center: [6.9780, 80.7850],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    const defaultLayer = L.tileLayer(
      tileProviders.satellite.url,
      tileProviders.satellite.options
    ).addTo(initialMap);

    activeTileLayerRef.current = defaultLayer;
    mapInstanceRef.current = initialMap;

    // 1. Draw Glowing Electric Blue River Channels (Image 2: Ahramat Lost Channel replica)
    const hydrologyGroup = L.layerGroup();
    HYDRO_CHANNELS.forEach((channel) => {
      // Glow underlay (wide cyan blur)
      L.polyline(channel, {
        color: "#06b6d4",
        weight: 8,
        opacity: 0.35,
        className: "hydro-glow-underlay",
      }).addTo(hydrologyGroup);

      // Core electric pulsing line (Image 2 vibrant blue)
      L.polyline(channel, {
        color: "#38bdf8",
        weight: 3.5,
        opacity: 0.95,
        dashArray: "8 12",
        className: "hydro-electric-pulse-line",
      }).addTo(hydrologyGroup);
    });
    hydrologyGroup.addTo(initialMap);

    // 2. Draw Agro Trade & Moisture Arcs (Image 1: Navigable flow arcs replica)
    const arcsGroup = L.layerGroup();
    AGRO_TRADE_ARCS.forEach((arc) => {
      L.polyline(arc, {
        color: "rgba(210, 248, 46, 0.6)",
        weight: 2,
        opacity: 0.75,
        dashArray: "4 8",
        className: "agro-flow-arc",
      }).addTo(arcsGroup);
    });
    arcsGroup.addTo(initialMap);

    // 3. Draw Microclimatic Thermal Zones (Image 3: Isoline heat contours replica)
    const zonesGroup = L.layerGroup();
    // Nuwara Eliya Cold Sink Basin (Cyan/Indigo)
    L.polygon(
      [
        [6.995, 80.760],
        [6.998, 80.810],
        [6.960, 80.825],
        [6.940, 80.790],
        [6.955, 80.755],
      ],
      {
        color: "#38bdf8",
        weight: 1.5,
        fillColor: "#0284c7",
        fillOpacity: 0.22,
        dashArray: "4 4",
        className: "thermal-zone-cold",
      }
    ).addTo(zonesGroup);

    // Welimada Temperate Valley (Emerald)
    L.polygon(
      [
        [6.930, 80.860],
        [6.935, 80.930],
        [6.880, 80.925],
        [6.875, 80.870],
      ],
      {
        color: "#10b981",
        weight: 1.5,
        fillColor: "#059669",
        fillOpacity: 0.2,
        dashArray: "4 4",
        className: "thermal-zone-valley",
      }
    ).addTo(zonesGroup);

    zonesGroup.addTo(initialMap);

    // 4. Place High-Design Hotspot Markers (Image 1 & Image 3 replica)
    GIS_CORRIDOR_NODES.forEach((node) => {
      const isSelected = node.id === activeNode.id;
      const htmlContent = `
        <div class="tactical-hotspot-pin ${node.category} ${isSelected ? "selected" : ""}">
          <div class="pin-beacon-pulse" style="border-color: ${node.color}; box-shadow: 0 0 14px ${node.color};"></div>
          <div class="pin-core-badge" style="border-color: ${node.color}; background: rgba(10, 16, 13, 0.92);">
            <span class="pin-icon">${getNodeIconSvg(node.icon, 12, node.color)}</span>
            <span class="pin-temp" style="color: ${node.color};">${node.baseTemp.toFixed(1)}°</span>
          </div>
          <div class="pin-label-tag">
            <span>${node.name.split(" ")[0]}</span>
          </div>
        </div>
      `;

      const divIcon = L.divIcon({
        html: htmlContent,
        className: "tactical-leaflet-marker",
        iconSize: [80, 36],
        iconAnchor: [40, 18],
      });

      const marker = L.marker([node.lat, node.lng], { icon: divIcon })
        .addTo(initialMap)
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          focusOnNode(node);
        });

      nodeMarkersRef.current.set(node.id, marker);
    });

    // 5. Click Anywhere to Inspect GPS Coordinates (Real Time Inversion)
    initialMap.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const distToPeakDeg = Math.hypot(lat - 7.0006, lng - 80.7725);
      const distToPeakKm = distToPeakDeg * 111;

      let computedElevation = Math.max(35, Math.round(2524 - distToPeakKm * 32));
      if (lat > 7.6) computedElevation = Math.max(40, Math.min(220, computedElevation));

      const diurnalEffect = isNight ? -3.5 : 2.5;
      const computedTemp = +(31.2 - (computedElevation / 1000) * 6.5 + diurnalEffect).toFixed(1);
      const computedHum = Math.min(96, Math.max(42, Math.round(55 + (computedElevation > 1200 ? 28 : -8))));

      const customNode: MapCorridorNode = {
        id: `custom-${Date.now()}`,
        name: `GIS Node [${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E]`,
        category: computedElevation > 1500 ? "cold" : computedElevation > 800 ? "bio" : "agro",
        categoryLabel: "Custom Geolocation Telemetry",
        color: "var(--accent-lime)",
        icon: "target",
        lat,
        lng,
        elevation: computedElevation,
        crop: computedElevation > 1500 ? "Highland Microclimate Zone" : "Lowland Agro Basin",
        baseTemp: computedTemp,
        rh: computedHum,
        vpd: 0.65,
        image: "/hero_highland_dawn.jpg",
        desc: "Interactive satellite coordinate query via environmental lapse rate calculation.",
      };

      setActiveNode(customNode);
      setPopupOpen(true);

      // Custom marker update
      if (customMarkerRef.current) {
        customMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const beaconIcon = L.divIcon({
          html: `
            <div class="tactical-custom-beacon">
              <div class="beacon-crosshair"></div>
              <div class="beacon-pulse-ring"></div>
              <div class="beacon-center-dot"></div>
            </div>
          `,
          className: "tactical-beacon-icon-wrap",
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
        customMarkerRef.current = L.marker([lat, lng], { icon: beaconIcon }).addTo(initialMap);
      }

      onCustomLocationSelect({
        name: customNode.name,
        lat,
        lng,
        elevation: computedElevation,
        temp: computedTemp,
        humidity: computedHum,
        soil: 65,
      });
    });

    return () => {
      initialMap.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Layer
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

  // Sync selectedPlot when changed from external parent dropdown
  useEffect(() => {
    const matchingNode = GIS_CORRIDOR_NODES.find(
      (n) => Math.hypot(n.lat - selectedPlot.lat, n.lng - selectedPlot.lng) < 0.1
    );
    if (matchingNode) {
      setActiveNode(matchingNode);
    }
  }, [selectedPlot.id]);

  // Zoom controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    mapInstanceRef.current?.flyTo([6.9780, 80.7850], 12, { duration: 1.2 });
  };

  return (
    <div className="tactical-gis-viewport liquid-glass">
      {/* HUD Corner Tech Brackets (Image 2 replica) */}
      <div className="hud-corner-bracket top-left"></div>
      <div className="hud-corner-bracket top-right"></div>
      <div className="hud-corner-bracket bottom-left"></div>
      <div className="hud-corner-bracket bottom-right"></div>

      {/* Main Leaflet Map Host */}
      <div
        ref={mapContainerRef}
        className="tactical-leaflet-map-canvas"
        style={{
          width: "100%",
          height: "640px",
          minHeight: "560px",
          background: "#060908",
          cursor: "crosshair",
        }}
      />

      {/* Dark GIS Vignette Overlay */}
      <div className="tactical-map-vignette"></div>

      {/* Top Header Bar & Layer Selector Switch */}
      <div className="tactical-top-controls-bar">
        <div className="tactical-brand-chip">
          <span className="live-dot-pulse"></span>
          <span className="brand-txt">RADAR GIS // AGRO METABOLISM ENGINE</span>
        </div>

        {/* Tactical Coordinates Reticle (Image 2 replica) */}
        <div className="tactical-coords-reticle">
          <span>LAT: {activeNode.lat.toFixed(4)}°N</span>
          <span className="sep">•</span>
          <span>LNG: {activeNode.lng.toFixed(4)}°E</span>
          <span className="sep">•</span>
          <span>ELEV: {activeNode.elevation}M</span>
        </div>

        {/* Tile Layer Selector */}
        <div className="tactical-layer-switcher">
          <button
            onClick={() => switchLayer("satellite")}
            className={`layer-switch-btn ${activeLayer === "satellite" ? "active" : ""}`}
            title="High-Resolution Real Earth Observation Satellite Imagery"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/>
            </svg>
            <span>Satellite</span>
          </button>
          <button
            onClick={() => switchLayer("dark")}
            className={`layer-switch-btn ${activeLayer === "dark" ? "active" : ""}`}
            title="CartoDB Dark Matter Tactical GIS Vector"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
            <span>Dark GIS</span>
          </button>
          <button
            onClick={() => switchLayer("osm")}
            className={`layer-switch-btn ${activeLayer === "osm" ? "active" : ""}`}
            title="OpenStreetMap Topographic Contour Map"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
            </svg>
            <span>Topo</span>
          </button>
        </div>
      </div>

      {/* ======================================================================
          LEFT LEGEND PANEL: OPPORTUNITIES / AGRO METABOLISM (Image 1 replica)
          ====================================================================== */}
      <aside className={`tactical-opportunities-legend ${isLegendOpen ? "open" : "collapsed"}`}>
        <div className="legend-header-row">
          <div className="legend-title-block">
            <h2 className="legend-main-title">Opportunities</h2>
            <div className="legend-sub-title">AGRO METABOLISM SRI LANKA</div>
          </div>
          <button
            className="legend-toggle-btn"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            title={isLegendOpen ? "Collapse Legend" : "Expand Legend"}
          >
            {isLegendOpen ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            )}
          </button>
        </div>

        {isLegendOpen && (
          <div className="legend-content-scroller">
            {/* Category 1: Cold Sinks (Highland Tea & Frost) */}
            <div className="legend-category-group">
              <div className="legend-category-heading">
                <span className="cat-dot" style={{ background: "#d946ef" }}></span>
                <span>Cold Sinks &amp; Tea</span>
                <span className="cat-sub">Highland frost valleys</span>
              </div>
              <div className="legend-items-list">
                {GIS_CORRIDOR_NODES.filter((n) => n.category === "cold").map((node) => (
                  <button
                    key={node.id}
                    className={`legend-item-btn ${activeNode.id === node.id ? "active" : ""}`}
                    onClick={() => focusOnNode(node)}
                  >
                    <span className="node-icon-bubble" style={{ background: "rgba(217, 70, 239, 0.15)", color: "#d946ef" }}>
                      <RenderNodeIcon name={node.icon} size={13} />
                    </span>
                    <div className="node-info-text">
                      <div className="node-name">{node.name}</div>
                      <div className="node-elev">{node.elevation}m • {node.baseTemp.toFixed(1)}°C</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category 2: Hydrological Basins & Reservoirs (Image 2 style) */}
            <div className="legend-category-group">
              <div className="legend-category-heading">
                <span className="cat-dot" style={{ background: "#38bdf8" }}></span>
                <span>Hydrological Basins</span>
                <span className="cat-sub">Electric runoff channels</span>
              </div>
              <div className="legend-items-list">
                {GIS_CORRIDOR_NODES.filter((n) => n.category === "hydro").map((node) => (
                  <button
                    key={node.id}
                    className={`legend-item-btn ${activeNode.id === node.id ? "active" : ""}`}
                    onClick={() => focusOnNode(node)}
                  >
                    <span className="node-icon-bubble" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
                      <RenderNodeIcon name={node.icon} size={13} />
                    </span>
                    <div className="node-info-text">
                      <div className="node-name">{node.name}</div>
                      <div className="node-elev">{node.elevation}m • Feeder basin</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category 3: Protected Biospheres */}
            <div className="legend-category-group">
              <div className="legend-category-heading">
                <span className="cat-dot" style={{ background: "#10b981" }}></span>
                <span>Biospheres &amp; Forests</span>
                <span className="cat-sub">Cloud forest buffers</span>
              </div>
              <div className="legend-items-list">
                {GIS_CORRIDOR_NODES.filter((n) => n.category === "bio").map((node) => (
                  <button
                    key={node.id}
                    className={`legend-item-btn ${activeNode.id === node.id ? "active" : ""}`}
                    onClick={() => focusOnNode(node)}
                  >
                    <span className="node-icon-bubble" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                      <RenderNodeIcon name={node.icon} size={13} />
                    </span>
                    <div className="node-info-text">
                      <div className="node-name">{node.name}</div>
                      <div className="node-elev">{node.elevation}m • Cloud sanctuary</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category 4: Agro Food Corridors */}
            <div className="legend-category-group">
              <div className="legend-category-heading">
                <span className="cat-dot" style={{ background: "#f59e0b" }}></span>
                <span>Agro Food Corridors</span>
                <span className="cat-sub">Paddy &amp; vegetable terraces</span>
              </div>
              <div className="legend-items-list">
                {GIS_CORRIDOR_NODES.filter((n) => n.category === "agro").map((node) => (
                  <button
                    key={node.id}
                    className={`legend-item-btn ${activeNode.id === node.id ? "active" : ""}`}
                    onClick={() => focusOnNode(node)}
                  >
                    <span className="node-icon-bubble" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                      <RenderNodeIcon name={node.icon} size={13} />
                    </span>
                    <div className="node-info-text">
                      <div className="node-name">{node.name}</div>
                      <div className="node-elev">{node.elevation}m • {node.crop.split(" ")[0]}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ======================================================================
          FLOATING LOCATION CARD: SANTORINI-STYLE POPUP (Image 3 replica)
          ====================================================================== */}
      {popupOpen && (
        <div className="tactical-santorini-card liquid-glass">
          {/* Header Image Banner with Close button */}
          <div
            className="santorini-card-banner"
            style={{ backgroundImage: `url('${activeNode.image}')` }}
          >
            <div className="banner-overlay-gradient"></div>
            <div className="banner-top-row">
              <span className="banner-corridor-tag">
                {activeNode.categoryLabel.toUpperCase()}
              </span>
              <button
                className="banner-close-btn"
                onClick={() => setPopupOpen(false)}
                title="Close"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="banner-title-text">{activeNode.name}</div>
            <div className="banner-coords-sub">
              {activeNode.lat.toFixed(4)}°N, {activeNode.lng.toFixed(4)}°E • ELEV {activeNode.elevation}M
            </div>
          </div>

          {/* Card Body Metrics */}
          <div className="santorini-card-body">
            {/* Big Temperature Display */}
            <div className="santorini-temp-row">
              <div className="santorini-temp-main">
                <span className="temp-num">{convertTemp(activeNode.baseTemp)}</span>
                <span className="temp-deg">°{tempUnit}</span>
                <span className="temp-lbl">Ambient</span>
              </div>

              <div className="santorini-temp-pred">
                <div className="pred-val" style={{ color: "var(--accent-lime)" }}>
                  {convertTemp(displayPredictedTemp)}°{tempUnit}
                </div>
                <div className="pred-lbl">AI Next-Hour</div>
              </div>
            </div>

            {/* Quick Status Chips */}
            <div className="santorini-chips-row">
              <div className="santorini-chip primary">
                <RenderNodeIcon name={activeNode.icon} size={13} />
                <span>{activeNode.crop.split(" ")[0]} {activeNode.crop.split(" ")[1] || "Plot"}</span>
              </div>
              <div className={`santorini-chip ${isFrostImminent ? "danger" : "safe"}`}>
                {isFrostImminent ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/><circle cx="12" cy="12" r="2.5"/>
                    </svg>
                    <span>FROST RISK</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>OPTIMAL BIOSPHERE</span>
                  </>
                )}
              </div>
            </div>

            {/* Key Sensor Telemetry Grid */}
            <div className="santorini-metrics-quad">
              <div className="quad-item">
                <span className="quad-lbl">RH</span>
                <span className="quad-val">{activeNode.rh}%</span>
              </div>
              <div className="quad-item">
                <span className="quad-lbl">VPD</span>
                <span className="quad-val">{activeNode.vpd} kPa</span>
              </div>
              <div className="quad-item">
                <span className="quad-lbl">AI Model</span>
                <span className="quad-val" style={{ color: "var(--accent-lime)" }}>{selectedModel.toUpperCase()}</span>
              </div>
              <div className="quad-item">
                <span className="quad-lbl">Delta</span>
                <span className="quad-val">{delta >= 0 ? "+" : ""}{delta.toFixed(1)}°C</span>
              </div>
            </div>

            <p className="santorini-desc-narrative">
              {activeNode.desc}
            </p>

            <button
              className="santorini-action-btn"
              onClick={() => {
                const element = document.getElementById("fleet-section");
                if (element) element.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span>View Full Crop Forecast</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================
          BOTTOM BAR: COMPASS ROSE, SCALE BAR & THERMAL SPECTRUM (Image 1 & 3)
          ====================================================================== */}
      <div className="tactical-bottom-strip">
        {/* Bottom Left: Geometric Compass Rose & Scale Bar (Image 1 replica) */}
        <div className="tactical-compass-scale-box">
          <div className="geometric-compass-rose">
            <svg viewBox="0 0 40 40" className="compass-svg">
              {/* Outer Wireframe Ring */}
              <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="2 3" />
              {/* 4 Cardinal Axis Lines */}
              <line x1="20" y1="2" x2="20" y2="38" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <line x1="2" y1="20" x2="38" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              {/* North Arrow Pointer */}
              <polygon points="20,4 23,17 20,14 17,17" fill="var(--accent-lime)" />
              <polygon points="20,36 23,23 20,26 17,23" fill="rgba(255,255,255,0.4)" />
              <text x="20" y="2" textAnchor="middle" fill="var(--accent-lime)" fontSize="6" fontWeight="bold">N</text>
            </svg>
          </div>

          <div className="tactical-scale-bar-unit">
            <div className="scale-ticks-row">
              <span>0</span>
              <span>5</span>
              <span>25</span>
              <span>50 km</span>
            </div>
            <div className="scale-bar-line">
              <span className="scale-segment active"></span>
              <span className="scale-segment"></span>
              <span className="scale-segment"></span>
            </div>
          </div>
        </div>

        {/* Center / Right: Thermal Heatmap Spectrum Scale (Image 3 replica) */}
        <div className="tactical-thermal-scale-card">
          <div className="thermal-scale-header">
            <span className="thermal-scale-title">MICROCLIMATE THERMAL SPECTRUM</span>
            <div className="unit-toggle-pills">
              <button
                className={`unit-pill ${tempUnit === "C" ? "active" : ""}`}
                onClick={() => setTempUnit("C")}
              >
                °C
              </button>
              <button
                className={`unit-pill ${tempUnit === "F" ? "active" : ""}`}
                onClick={() => setTempUnit("F")}
              >
                °F
              </button>
            </div>
          </div>

          {/* Color Gradient Ribbon */}
          <div className="thermal-gradient-ribbon"></div>

          {/* Degree Ticks */}
          <div className="thermal-ticks-row">
            <span>{tempUnit === "C" ? "0°" : "32°"}</span>
            <span>{tempUnit === "C" ? "5°" : "41°"}</span>
            <span>{tempUnit === "C" ? "10°" : "50°"}</span>
            <span>{tempUnit === "C" ? "15°" : "59°"}</span>
            <span>{tempUnit === "C" ? "20°" : "68°"}</span>
            <span>{tempUnit === "C" ? "25°" : "77°"}</span>
            <span>{tempUnit === "C" ? "30°+" : "86°+"}</span>
          </div>
        </div>

        {/* Zoom & Centering Quick Actions */}
        <div className="tactical-zoom-dock">
          <button className="tactical-zoom-btn" onClick={handleZoomIn} title="Zoom In">+</button>
          <button className="tactical-zoom-btn" onClick={handleResetView} title="Re-center on Agricultural Hotspot">⌖</button>
          <button className="tactical-zoom-btn" onClick={handleZoomOut} title="Zoom Out">-</button>
        </div>
      </div>
    </div>
  );
}
