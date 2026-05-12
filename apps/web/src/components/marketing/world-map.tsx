"use client";

import { useState } from "react";
import { Zap, Shield, Globe } from "lucide-react";

export interface MapLocation {
  city: string;
  country: string;
  flag: string;
  region: string;
  ping: string;
  status: string;
  x: number;
  y: number;
}

interface WorldMapProps {
  locations: MapLocation[];
}

const LAND = "#182030";
const LAND_STROKE = "rgba(0,201,141,0.12)";

/* curved arc path between two points */
function arc(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.18;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

const REGIONS = ["All", "Europe", "North America", "Asia Pacific"];

export function WorldMap({ locations }: WorldMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState("All");

  const visible = activeRegion === "All"
    ? locations
    : locations.filter((l) => l.region === activeRegion);

  const hoveredLoc = hovered ? locations.find((l) => l.city === hovered) : null;

  /* connection pairs — draw beams between all visible nodes */
  const pairs: [MapLocation, MapLocation][] = [];
  for (let i = 0; i < visible.length; i++) {
    for (let j = i + 1; j < visible.length; j++) {
      pairs.push([visible[i], visible[j]]);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0e18]">
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
        <svg viewBox="0 0 1000 500" className="w-full" style={{ display: "block" }}>
          <defs>
            {/* Ocean gradient */}
            <radialGradient id="ocean" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0f1626" />
              <stop offset="100%" stopColor="#080c14" />
            </radialGradient>
            {/* Pin glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-strong" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Beam gradient */}
            <linearGradient id="beam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00c98d" stopOpacity="0" />
              <stop offset="50%" stopColor="#00c98d" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00c98d" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Ocean */}
          <rect width="1000" height="500" fill="url(#ocean)" />

          {/* Dot grid */}
          {Array.from({ length: 50 }).map((_, row) =>
            Array.from({ length: 100 }).map((_, col) => (
              <circle
                key={`dot-${row}-${col}`}
                cx={col * 10 + 5} cy={row * 10 + 5} r="0.6"
                fill="rgba(255,255,255,0.04)"
              />
            ))
          )}

          {/* Lat/lon lines */}
          {[100, 200, 300, 400].map((y) => (
            <line key={`lat${y}`} x1="0" y1={y} x2="1000" y2={y}
              stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
          ))}
          {[125, 250, 375, 500, 625, 750, 875].map((x) => (
            <line key={`lon${x}`} x1={x} y1="0" x2={x} y2="500"
              stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
          ))}
          {/* Equator */}
          <line x1="0" y1="250" x2="1000" y2="250"
            stroke="rgba(0,201,141,0.08)" strokeWidth="1" strokeDasharray="5 7" />

          {/* ── Continents ── */}
          {/* North America */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.8" d="
            M 100 50 L 120 42 L 145 38 L 170 36 L 195 38 L 215 44 L 230 52
            L 238 63 L 235 75 L 225 85 L 218 98 L 215 112 L 210 128 L 205 143
            L 198 158 L 190 172 L 183 185 L 176 198 L 170 210 L 165 222
            L 160 233 L 156 243 L 152 252 L 148 260 L 143 265 L 138 263
            L 133 256 L 128 246 L 124 235 L 121 222 L 118 208 L 116 194
            L 115 180 L 114 165 L 113 150 L 114 135 L 115 120 L 117 105
            L 120 92 L 126 80 L 134 68 L 100 50 Z
          " />
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.7" d="M 162 240 L 157 252 L 154 264 L 159 270 L 165 262 L 167 250 Z" />
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.7" d="M 117 208 L 111 218 L 107 230 L 111 237 L 117 228 Z" />
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.7" d="M 163 265 L 168 275 L 173 288 L 170 294 L 163 286 L 159 274 Z" />
          {/* Greenland */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.7" d="M 232 22 L 258 14 L 285 12 L 302 20 L 296 35 L 278 46 L 256 50 L 238 44 Z" />
          {/* Iceland */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.7" d="M 380 42 L 392 38 L 400 42 L 397 50 L 385 52 L 378 48 Z" />
          {/* Cuba */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.5" d="M 175 270 L 188 265 L 196 268 L 194 274 L 182 276 L 173 274 Z" />

          {/* South America */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.8" d="
            M 217 292 L 232 282 L 250 278 L 268 280 L 280 292 L 286 308
            L 284 328 L 278 350 L 270 372 L 260 393 L 248 408 L 238 418
            L 230 414 L 223 400 L 218 382 L 215 362 L 213 340 L 212 318
            L 214 305 Z
          " />

          {/* Europe main body */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.8" d="
            M 428 62 L 445 55 L 462 50 L 480 48 L 496 52 L 506 62 L 504 74
            L 496 83 L 486 90 L 480 100 L 482 110 L 488 118 L 490 128
            L 484 135 L 472 138 L 460 132 L 452 122 L 447 112 L 441 102
            L 438 90 L 438 76 L 428 62 Z
          " />
          {/* Iberian */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.7" d="M 440 112 L 435 120 L 432 133 L 436 141 L 445 138 L 449 124 Z" />
          {/* Italy */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.7" d="M 476 118 L 472 128 L 470 140 L 474 152 L 479 154 L 481 140 L 482 126 Z" />
          {/* Scandinavia */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.7" d="M 468 54 L 476 38 L 488 26 L 500 28 L 504 40 L 498 52 L 488 58 Z" />
          {/* UK */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.6" d="M 436 66 L 431 60 L 426 62 L 428 72 L 434 76 Z" />
          {/* Ireland */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.5" d="M 426 68 L 421 65 L 419 72 L 424 76 L 428 73 Z" />
          {/* Greece */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.6" d="M 496 118 L 504 115 L 510 120 L 507 128 L 499 130 Z" />

          {/* Africa */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.8" d="
            M 452 145 L 470 140 L 490 142 L 508 150 L 520 162 L 524 178
            L 522 196 L 517 216 L 510 237 L 500 257 L 488 275 L 474 290
            L 462 296 L 452 290 L 445 275 L 440 257 L 436 236 L 434 215
            L 434 194 L 435 174 L 439 158 L 447 148 Z
          " />
          {/* Madagascar */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.6" d="M 522 255 L 527 244 L 530 258 L 526 268 L 520 264 Z" />

          {/* Middle East */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.7" d="
            M 518 138 L 534 132 L 550 135 L 560 146 L 557 160 L 547 170
            L 532 168 L 520 158 Z
          " />
          {/* Turkey */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.7" d="M 508 108 L 526 104 L 542 106 L 550 113 L 545 120 L 528 122 L 511 118 Z" />

          {/* Russia + Central Asia */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.8" d="
            M 506 32 L 545 24 L 588 20 L 632 18 L 672 21 L 710 28 L 738 38
            L 745 52 L 735 64 L 712 70 L 685 73 L 655 72 L 625 74 L 600 80
            L 576 84 L 552 82 L 528 78 L 510 68 Z
          " />
          {/* Kamchatka */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.6" d="M 800 48 L 812 40 L 820 48 L 816 62 L 806 66 L 798 58 Z" />

          {/* China + East Asia */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.8" d="
            M 622 78 L 650 72 L 678 72 L 706 68 L 730 72 L 752 78 L 768 88
            L 774 102 L 770 116 L 756 126 L 738 130 L 718 128 L 698 122
            L 678 118 L 660 110 L 644 100 L 632 90 Z
          " />
          {/* Korean Peninsula */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.6" d="M 764 102 L 772 98 L 778 104 L 775 116 L 768 118 L 762 110 Z" />
          {/* Japan */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.7" d="M 778 86 L 788 78 L 796 82 L 794 96 L 784 100 L 776 94 Z" />
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.5" d="M 800 74 L 808 70 L 814 74 L 811 82 L 803 84 Z" />

          {/* India */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.8" d="
            M 588 128 L 608 122 L 626 126 L 636 138 L 634 154 L 626 170
            L 614 183 L 602 187 L 591 180 L 584 164 L 583 148 Z
          " />
          {/* Sri Lanka */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.5" d="M 618 190 L 622 186 L 626 190 L 623 197 L 617 196 Z" />

          {/* Southeast Asia */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.7" d="
            M 658 144 L 678 138 L 696 141 L 706 152 L 704 166 L 692 174
            L 676 172 L 662 162 Z
          " />
          {/* Malay Peninsula */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.6" d="M 694 172 L 698 184 L 696 196 L 691 192 L 689 178 Z" />
          {/* Sumatra */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.6" d="M 672 190 L 692 184 L 708 188 L 714 198 L 703 206 L 686 208 L 672 202 Z" />
          {/* Java */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.6" d="M 710 208 L 730 204 L 748 206 L 756 214 L 745 220 L 724 220 L 710 215 Z" />
          {/* Borneo */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.6" d="M 718 178 L 736 174 L 752 176 L 760 186 L 756 198 L 740 202 L 722 198 L 714 188 Z" />
          {/* Philippines */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.5" d="M 764 158 L 772 152 L 778 158 L 774 168 L 765 168 Z" />

          {/* Australia */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.8" d="
            M 738 308 L 758 295 L 784 292 L 810 296 L 828 308 L 836 328
            L 834 350 L 825 367 L 810 378 L 790 382 L 770 376 L 754 360
            L 744 342 L 738 322 Z
          " />
          {/* Tasmania */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.5" d="M 798 386 L 806 380 L 812 386 L 808 395 L 799 393 Z" />
          {/* New Zealand North */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.5" d="M 852 362 L 860 354 L 866 360 L 862 372 L 853 373 Z" />
          {/* New Zealand South */}
          <path fill={LAND} stroke={LAND_STROKE} strokeWidth="0.5" d="M 856 378 L 862 372 L 870 378 L 866 390 L 856 390 Z" />

          {/* Antarctica hint */}
          <rect x="0" y="475" width="1000" height="25" fill={LAND} opacity="0.4" />

          {/* ── Connection beams ── */}
          {pairs.map(([a, b], i) => (
            <path
              key={`beam-${i}`}
              d={arc(a.x, a.y, b.x, b.y)}
              fill="none"
              stroke="#00c98d"
              strokeWidth="0.8"
              opacity="0.12"
              strokeDasharray="4 6"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;-200"
                dur={`${4 + (i % 5)}s`}
                repeatCount="indefinite"
              />
            </path>
          ))}

          {/* ── Pins ── */}
          {visible.map((loc) => {
            const isHov = hovered === loc.city;
            return (
              <g
                key={loc.city}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(loc.city)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Halo */}
                <circle cx={loc.x} cy={loc.y} r={isHov ? 28 : 20}
                  fill="rgba(0,201,141,0.06)"
                  style={{ transition: "r 0.25s ease" }}
                />
                {/* Outer ring */}
                <circle cx={loc.x} cy={loc.y} r={isHov ? 14 : 10}
                  fill="none" stroke="#00c98d" strokeWidth="1"
                  opacity={isHov ? 0.6 : 0.25}
                  style={{ transition: "all 0.25s ease" }}
                />
                {/* Animated pulse */}
                <circle cx={loc.x} cy={loc.y} r="6" fill="none"
                  stroke="#00c98d" strokeWidth="1.2" opacity="0.6">
                  <animate attributeName="r" values="5;18;5" dur="3s" repeatCount="indefinite" begin={`${(loc.x % 7) * 0.3}s`} />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" begin={`${(loc.x % 7) * 0.3}s`} />
                </circle>
                {/* Core dot */}
                <circle cx={loc.x} cy={loc.y} r={isHov ? 6 : 4.5}
                  fill={isHov ? "#00ffb3" : "#00c98d"}
                  filter="url(#glow)"
                  style={{ transition: "all 0.25s ease" }}
                />
                {/* Inner bright center */}
                <circle cx={loc.x} cy={loc.y} r={isHov ? 3 : 2}
                  fill="white" opacity={isHov ? 0.9 : 0.6}
                  style={{ transition: "all 0.25s ease" }}
                />
                {/* Label */}
                <text
                  x={loc.x + 12} y={loc.y + 4}
                  fontSize="8.5"
                  fill={isHov ? "#ffffff" : "rgba(168,176,196,0.85)"}
                  fontFamily="system-ui,sans-serif"
                  fontWeight={isHov ? "700" : "500"}
                  style={{ pointerEvents: "none", userSelect: "none", transition: "fill 0.2s" }}
                >
                  {loc.city}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating tooltip */}
        {hoveredLoc && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-3 rounded-2xl border border-[#00c98d]/25 bg-[#0d1117]/95 px-5 py-3.5 shadow-2xl shadow-black/60 backdrop-blur-md">
              <span className="text-3xl">{hoveredLoc.flag}</span>
              <div className="min-w-0">
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
          { icon: Globe,  label: "Locations",    value: `${locations.length} nodes` },
          { icon: Zap,    label: "Avg Latency",  value: "< 20ms" },
          { icon: Shield, label: "Protection",   value: "Enterprise DDoS" },
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
