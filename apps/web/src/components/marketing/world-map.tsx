"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

export interface MapLocation {
  city: string;
  country: string;
  flag: string;
  region: string;
  ping: string;
  status: string;
  // Percentage coordinates on the 1000x500 viewBox
  x: number;
  y: number;
}

interface WorldMapProps {
  locations: MapLocation[];
}

export function WorldMap({ locations }: WorldMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1117]">
      <svg
        viewBox="0 0 1000 500"
        className="w-full"
        style={{ display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ocean background */}
        <rect width="1000" height="500" fill="#0d1117" />

        {/* Subtle grid lines */}
        {Array.from({ length: 10 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1="0" y1={i * 50} x2="1000" y2={i * 50}
            stroke="rgba(255,255,255,0.03)" strokeWidth="1"
          />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * 50} y1="0" x2={i * 50} y2="500"
            stroke="rgba(255,255,255,0.03)" strokeWidth="1"
          />
        ))}

        {/* Equator */}
        <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(0,201,141,0.06)" strokeWidth="1" strokeDasharray="4 6" />

        {/* ── Continents ── simplified but recognisable outlines ── */}

        {/* North America */}
        <path
          d="M 138 68 L 155 60 L 175 55 L 200 52 L 215 58 L 225 68 L 228 80 L 220 88
             L 215 100 L 210 115 L 205 130 L 200 148 L 192 165 L 183 180 L 178 195
             L 170 210 L 165 222 L 160 235 L 156 245 L 152 255 L 148 262 L 143 268
             L 137 265 L 132 257 L 128 248 L 124 238 L 122 225 L 118 210 L 116 196
             L 115 183 L 114 170 L 113 155 L 114 140 L 116 125 L 118 110 L 122 96
             L 128 83 L 135 73 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"
        />
        {/* Florida peninsula */}
        <path d="M 163 240 L 158 252 L 155 263 L 160 268 L 166 262 L 168 250 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
        {/* Baja California */}
        <path d="M 118 210 L 112 218 L 108 230 L 112 236 L 118 228 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

        {/* Greenland */}
        <path
          d="M 230 30 L 255 22 L 280 20 L 295 28 L 290 42 L 275 52 L 255 55 L 238 48 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"
        />

        {/* Central America + Caribbean */}
        <path d="M 163 268 L 170 278 L 175 290 L 172 295 L 165 288 L 160 278 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

        {/* South America */}
        <path
          d="M 220 295 L 235 285 L 252 282 L 268 285 L 278 298 L 282 315
             L 280 335 L 275 355 L 268 375 L 258 395 L 245 410 L 235 420
             L 228 415 L 222 400 L 218 382 L 215 362 L 213 342 L 212 320
             L 214 305 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"
        />

        {/* Europe */}
        <path
          d="M 445 58 L 460 52 L 478 50 L 492 55 L 498 66 L 493 77 L 480 85
             L 475 95 L 478 105 L 485 110 L 488 120 L 482 128 L 470 130
             L 458 125 L 450 115 L 445 105 L 440 95 L 438 83 L 440 70 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"
        />
        {/* Iberian Peninsula */}
        <path d="M 442 110 L 437 118 L 434 130 L 438 138 L 446 135 L 450 122 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
        {/* Italy */}
        <path d="M 478 115 L 474 124 L 472 136 L 476 148 L 480 150 L 482 138 L 483 124 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
        {/* Scandinavia */}
        <path d="M 470 50 L 478 35 L 490 25 L 500 30 L 498 45 L 490 55 L 478 58 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

        {/* UK */}
        <path d="M 445 72 L 440 65 L 435 60 L 430 65 L 432 75 L 438 80 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

        {/* Africa */}
        <path
          d="M 455 148 L 472 143 L 490 145 L 505 152 L 515 165 L 518 182
             L 516 200 L 510 220 L 502 240 L 492 260 L 480 278 L 468 292
             L 458 298 L 450 292 L 443 278 L 438 260 L 434 240 L 432 220
             L 432 200 L 433 180 L 437 162 L 444 152 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"
        />
        {/* Madagascar */}
        <path d="M 520 258 L 524 248 L 526 265 L 522 272 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

        {/* Middle East / Arabian Peninsula */}
        <path
          d="M 520 140 L 535 135 L 548 138 L 555 148 L 552 162 L 543 170
             L 530 168 L 520 158 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"
        />

        {/* Russia + Central Asia (simplified) */}
        <path
          d="M 505 35 L 540 28 L 580 24 L 625 22 L 665 25 L 700 32 L 725 42
             L 730 55 L 720 65 L 700 70 L 675 72 L 648 70 L 620 72 L 598 78
             L 575 82 L 552 80 L 530 76 L 512 68 L 505 55 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"
        />

        {/* South Asia (India) */}
        <path
          d="M 590 130 L 608 125 L 622 128 L 630 140 L 628 156 L 620 170
             L 608 182 L 598 185 L 590 178 L 584 162 L 583 148 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"
        />

        {/* Southeast Asia */}
        <path
          d="M 660 148 L 678 142 L 692 145 L 700 155 L 698 168 L 688 175
             L 673 172 L 662 162 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"
        />
        {/* Malay Peninsula */}
        <path d="M 692 168 L 696 180 L 694 192 L 690 188 L 688 175 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

        {/* East Asia (China + Korea) */}
        <path
          d="M 700 60 L 730 55 L 755 58 L 768 68 L 772 82 L 765 96 L 750 105
             L 732 108 L 715 103 L 702 92 L 698 78 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"
        />

        {/* Japan */}
        <path d="M 778 82 L 785 75 L 792 80 L 790 92 L 782 96 L 776 90 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

        {/* Indonesia */}
        <path d="M 695 195 L 710 190 L 724 192 L 730 200 L 720 206 L 705 205 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <path d="M 735 192 L 748 188 L 758 193 L 755 202 L 742 205 L 733 200 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

        {/* Australia */}
        <path
          d="M 740 310 L 760 298 L 785 295 L 808 298 L 825 310 L 832 328
             L 830 348 L 822 365 L 808 375 L 790 378 L 772 372 L 758 358
             L 748 340 L 742 322 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"
        />
        {/* Tasmania */}
        <path d="M 800 382 L 806 376 L 812 382 L 808 390 L 800 388 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        {/* New Zealand */}
        <path d="M 845 368 L 850 358 L 856 363 L 853 375 L 845 372 Z"
          fill="#1a2235" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

        {/* ── Glow rings + pins ── */}
        {locations.map((loc) => {
          const isHovered = hovered === loc.city;
          return (
            <g key={loc.city}>
              {/* Outer pulse ring */}
              <circle
                cx={loc.x} cy={loc.y} r={isHovered ? 22 : 16}
                fill="none"
                stroke="#00c98d"
                strokeWidth="1"
                opacity={isHovered ? 0.35 : 0.15}
                style={{ transition: "all 0.2s ease" }}
              />
              {/* Animated ping ring */}
              <circle
                cx={loc.x} cy={loc.y} r="10"
                fill="none"
                stroke="#00c98d"
                strokeWidth="1.5"
                opacity="0.5"
              >
                <animate attributeName="r" values="8;20;8" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
              </circle>
              {/* Main dot */}
              <circle
                cx={loc.x} cy={loc.y}
                r={isHovered ? 7 : 5}
                fill={isHovered ? "#00e0a0" : "#00c98d"}
                style={{ transition: "all 0.2s ease", cursor: "pointer" }}
                onMouseEnter={() => setHovered(loc.city)}
                onMouseLeave={() => setHovered(null)}
              />
              {/* City label */}
              <text
                x={loc.x + 10} y={loc.y - 8}
                fontSize="8"
                fill={isHovered ? "#ffffff" : "rgba(200,205,216,0.7)"}
                style={{ transition: "fill 0.2s", pointerEvents: "none", userSelect: "none" }}
                fontFamily="system-ui, sans-serif"
                fontWeight={isHovered ? "700" : "500"}
              >
                {loc.city}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered && (() => {
        const loc = locations.find((l) => l.city === hovered)!;
        return (
          <div
            className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 rounded-xl border border-[#00c98d]/20 bg-[#131720]/95 px-4 py-3 backdrop-blur-sm shadow-xl shadow-black/40"
            style={{ minWidth: 200 }}
          >
            <span className="text-2xl">{loc.flag}</span>
            <div>
              <p className="font-bold text-white text-sm">{loc.city}, {loc.country}</p>
              <div className="mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-[#00c98d]">
                  <Zap className="h-3 w-3" /> {loc.ping}
                </span>
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  {loc.status}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="absolute top-3 right-3 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#0d1117]/80 px-3 py-1.5 backdrop-blur-sm">
        <span className="h-2 w-2 rounded-full bg-[#00c98d] animate-pulse" />
        <span className="text-[11px] font-medium text-[#8b92a8]">{locations.length} active nodes</span>
      </div>
    </div>
  );
}
