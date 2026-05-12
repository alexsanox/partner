"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, useMapContext } from "react-simple-maps";
import { Zap, Shield, Globe } from "lucide-react";

export interface MapLocation {
  city: string;
  country: string;
  flag: string;
  region: string;
  ping: string;
  status: string;
  // longitude, latitude
  lng: number;
  lat: number;
  // kept for backwards-compat but unused here
  x?: number;
  y?: number;
}

interface WorldMapProps {
  locations: MapLocation[];
}

const REGIONS = ["All", "Europe", "North America", "Asia Pacific"];

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/* Renders curved SVG arcs between node pairs using the live projection */
function Beams({ visible }: { visible: MapLocation[] }) {
  const { projection } = useMapContext();
  if (!projection) return null;

  const paths: string[] = [];
  for (let i = 0; i < visible.length; i++) {
    for (let j = i + 1; j < visible.length; j++) {
      const a = visible[i];
      const b = visible[j];
      const pa = projection([a.lng, a.lat]);
      const pb = projection([b.lng, b.lat]);
      if (!pa || !pb) continue;
      const [x1, y1] = pa;
      const [x2, y2] = pb;
      /* control point: midpoint lifted toward top of map */
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.22;
      paths.push(`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`);
    }
  }

  return (
    <>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="url(#beamGrad)"
          strokeWidth="0.8"
          strokeOpacity="0.35"
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

export function WorldMap({ locations }: WorldMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState("All");

  const visible = activeRegion === "All"
    ? locations
    : locations.filter((l) => l.region === activeRegion);

  const hoveredLoc = hovered ? locations.find((l) => l.city === hovered) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080c14]">
      {/* Region filter tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="flex gap-1">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRegion(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeRegion === r
                  ? "bg-[#00c98d]/15 text-[#00c98d]"
                  : "text-[#8b92a8] hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#00c98d] animate-pulse" />
          <span className="text-[11px] font-medium text-[#8b92a8]">
            {visible.length} node{visible.length !== 1 ? "s" : ""} online
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 160, center: [15, 18] }}
          style={{ width: "100%", height: "auto", background: "transparent" }}
        >
          <defs>
            <radialGradient id="mapbg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0f1828" />
              <stop offset="100%" stopColor="#060a12" />
            </radialGradient>
            <filter id="pinglow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00c98d" stopOpacity="0.05" />
              <stop offset="50%" stopColor="#00c98d" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#00c98d" stopOpacity="0.05" />
            </linearGradient>
            <clipPath id="mapClip">
              <rect x="0" y="0" width="800" height="455" />
            </clipPath>
          </defs>
          <rect width="800" height="492" fill="url(#mapbg)" />

          {/* Countries — clipped to hide south-pole distortion */}
          <g clipPath="url(#mapClip)">
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: "#1a2640",
                      stroke: "#00c98d",
                      strokeWidth: 0.3,
                      strokeOpacity: 0.25,
                      outline: "none",
                    },
                    hover: {
                      fill: "#1f2e4a",
                      stroke: "#00c98d",
                      strokeWidth: 0.4,
                      strokeOpacity: 0.4,
                      outline: "none",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
          </g>

          {/* Curved connection arcs */}
          <Beams visible={visible} />

          {/* Markers */}
          {visible.map((loc) => {
            const isHov = hovered === loc.city;
            return (
              <Marker
                key={loc.city}
                coordinates={[loc.lng, loc.lat]}
                onMouseEnter={() => setHovered(loc.city)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Halo glow */}
                <circle
                  r={isHov ? 14 : 10}
                  fill="rgba(0,201,141,0.07)"
                  style={{ transition: "r 0.2s ease" }}
                />
                {/* Outer ring */}
                <circle
                  r={isHov ? 9 : 7}
                  fill="none"
                  stroke="#00c98d"
                  strokeWidth={isHov ? 1.5 : 1}
                  strokeOpacity={isHov ? 0.7 : 0.3}
                  style={{ transition: "all 0.2s ease" }}
                />
                {/* Pulse animation */}
                <circle r="5" fill="none" stroke="#00c98d" strokeWidth="1" strokeOpacity="0.5">
                  <animate attributeName="r" values="4;16;4" dur="3s" repeatCount="indefinite"
                    begin={`${(Math.abs(loc.lng) % 7) * 0.4}s`} />
                  <animate attributeName="stroke-opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite"
                    begin={`${(Math.abs(loc.lng) % 7) * 0.4}s`} />
                </circle>
                {/* Core */}
                <circle
                  r={isHov ? 5 : 3.5}
                  fill={isHov ? "#00ffb3" : "#00c98d"}
                  filter="url(#pinglow)"
                  style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                />
                {/* White center */}
                <circle
                  r={isHov ? 2.2 : 1.5}
                  fill="white"
                  fillOpacity={isHov ? 1 : 0.7}
                  style={{ transition: "all 0.2s ease" }}
                />
                {/* Label */}
                <text
                  textAnchor="start"
                  x={isHov ? 10 : 8}
                  y={-6}
                  style={{
                    fontFamily: "system-ui,sans-serif",
                    fontSize: isHov ? 7 : 6,
                    fontWeight: isHov ? 700 : 500,
                    fill: isHov ? "#ffffff" : "rgba(168,176,196,0.9)",
                    pointerEvents: "none",
                    userSelect: "none",
                    transition: "all 0.2s",
                  }}
                >
                  {loc.city}
                </text>
              </Marker>
            );
          })}
        </ComposableMap>

        {/* Tooltip */}
        {hoveredLoc && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-3 rounded-2xl border border-[#00c98d]/25 bg-[#0d1117]/95 px-5 py-3.5 shadow-2xl shadow-black/60 backdrop-blur-md whitespace-nowrap">
              <span className="text-3xl">{hoveredLoc.flag}</span>
              <div>
                <p className="text-sm font-bold text-white">{hoveredLoc.city}</p>
                <p className="text-xs text-[#8b92a8]">{hoveredLoc.country} · {hoveredLoc.region}</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#00c98d]">
                    <Zap className="h-3 w-3" />{hoveredLoc.ping}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    {hoveredLoc.status}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#8b92a8]">
                    <Shield className="h-3 w-3 text-[#00c98d]" />DDoS Protected
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06]">
        {[
          { icon: Globe,  label: "Locations",  value: `${locations.length} nodes` },
          { icon: Zap,    label: "Avg Latency", value: "< 20ms" },
          { icon: Shield, label: "Protection",  value: "Enterprise DDoS" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 px-5 py-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00c98d]/10">
              <s.icon className="h-4 w-4 text-[#00c98d]" />
            </div>
            <div>
              <p className="text-xs text-[#8b92a8]">{s.label}</p>
              <p className="text-sm font-bold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
