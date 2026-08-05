import React from "react";

interface SigaLaPelotaLogoProps {
  className?: string;
  showFrame?: boolean;
}

export default function SigaLaPelotaLogo({ className = "w-32 h-32", showFrame = true }: SigaLaPelotaLogoProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} id="siga-la-pelota-logo">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Definition for Gradients, Shadows and Filters */}
        <defs>
          {/* Subtle drop shadow for the ball */}
          <filter id="ball-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="6" stdDeviation="5" floodOpacity="0.25" />
          </filter>
          
          {/* Radial gradient to give the soccer ball 3D spherical volume */}
          <radialGradient id="sphere-gradient" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#e5e5e7" />
            <stop offset="100%" stopColor="#b5b5ba" />
          </radialGradient>

          {/* Linear gradient for the wooden/grey frame */}
          <linearGradient id="frame-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7a7a7a" />
            <stop offset="50%" stopColor="#4f4f4f" />
            <stop offset="100%" stopColor="#2b2b2b" />
          </linearGradient>

          {/* Red brush stroke gradient for paint feel */}
          <linearGradient id="paint-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D92B34" />
            <stop offset="100%" stopColor="#be1e2d" />
          </linearGradient>
        </defs>

        {/* 1. Diagonal Soccer Net Background (Diagonal grid lines) */}
        {showFrame && (
          <g stroke="#d1d1d6" strokeWidth="1.5" strokeDasharray="1 1" opacity="0.6">
            {/* Draw diagonal lines from top-left to bottom-right */}
            <line x1="50" y1="50" x2="350" y2="350" />
            <line x1="50" y1="110" x2="290" y2="350" />
            <line x1="50" y1="170" x2="230" y2="350" />
            <line x1="50" y1="230" x2="170" y2="350" />
            <line x1="50" y1="290" x2="110" y2="350" />
            <line x1="110" y1="50" x2="350" y2="290" />
            <line x1="170" y1="50" x2="350" y2="230" />
            <line x1="230" y1="50" x2="350" y2="170" />
            <line x1="290" y1="50" x2="350" y2="110" />

            {/* Draw diagonal lines from top-right to bottom-left */}
            <line x1="350" y1="50" x2="50" y2="350" />
            <line x1="290" y1="50" x2="50" y2="290" />
            <line x1="230" y1="50" x2="50" y2="230" />
            <line x1="170" y1="50" x2="50" y2="170" />
            <line x1="110" y1="50" x2="50" y2="110" />
            <line x1="350" y1="110" x2="110" y2="350" />
            <line x1="350" y1="170" x2="170" y2="350" />
            <line x1="350" y1="230" x2="230" y2="350" />
            <line x1="350" y1="290" x2="290" y2="350" />
          </g>
        )}

        {/* 2. Outer Bamboo/Wooden Rustic Frame */}
        {showFrame && (
          <g>
            {/* Horizontal wood bar top */}
            <rect x="25" y="40" width="350" height="12" rx="4" fill="url(#frame-grad)" stroke="#1a1a1a" strokeWidth="1.5" />
            {/* Horizontal wood bar bottom */}
            <rect x="25" y="348" width="350" height="12" rx="4" fill="url(#frame-grad)" stroke="#1a1a1a" strokeWidth="1.5" />
            {/* Vertical wood bar left */}
            <rect x="40" y="25" width="12" height="350" rx="4" fill="url(#frame-grad)" stroke="#1a1a1a" strokeWidth="1.5" />
            {/* Vertical wood bar right */}
            <rect x="348" y="25" width="12" height="350" rx="4" fill="url(#frame-grad)" stroke="#1a1a1a" strokeWidth="1.5" />

            {/* Intersecting Corner Tied Ropes */}
            {/* Top-Left intersection rope */}
            <path d="M 36 36 L 56 56 M 56 36 L 36 56" stroke="#9a8a78" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="46" cy="46" r="5" fill="#7d6d5a" stroke="#4a3e31" strokeWidth="1" />
            
            {/* Top-Right intersection rope */}
            <path d="M 344 36 L 364 56 M 364 36 L 344 56" stroke="#9a8a78" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="354" cy="46" r="5" fill="#7d6d5a" stroke="#4a3e31" strokeWidth="1" />

            {/* Bottom-Left intersection rope */}
            <path d="M 36 344 L 56 364 M 56 344 L 36 364" stroke="#9a8a78" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="46" cy="354" r="5" fill="#7d6d5a" stroke="#4a3e31" strokeWidth="1" />

            {/* Bottom-Right intersection rope */}
            <path d="M 344 344 L 364 364 M 364 344 L 344 364" stroke="#9a8a78" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="354" cy="354" r="5" fill="#7d6d5a" stroke="#4a3e31" strokeWidth="1" />
          </g>
        )}

        {/* 3. Red Circular Paint Brush Stroke */}
        <g>
          {/* Hand-painted circular stroke using a customized path (red spiral) */}
          <path
            d="M 200,65 
               C 275,65 335,125 335,200 
               C 335,275 275,335 200,335 
               C 125,335 65,275 65,200 
               C 65,135 115,85 175,70 
               C 230,55 305,95 320,150 
               C 335,205 305,270 255,295"
            fill="none"
            stroke="url(#paint-grad)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray="400 20"
            opacity="0.9"
            transform="rotate(-5, 200, 200)"
          />
          {/* Inner brush accents for textured feel */}
          <path
            d="M 210,80 
               C 265,85 315,135 315,195 
               C 315,255 265,310 205,315 
               C 145,320 95,275 90,215"
            fill="none"
            stroke="#9b111e"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.6"
            transform="rotate(15, 200, 200)"
          />
        </g>

        {/* 4. Classic Black & White Soccer Ball */}
        <g filter="url(#ball-shadow)" transform="translate(200, 195)">
          {/* Spherical Base */}
          <circle cx="0" cy="0" r="75" fill="url(#sphere-gradient)" stroke="#1a1a1a" strokeWidth="2.5" />

          {/* pentagons (Black leather patches) with custom paths mapped onto the sphere */}
          {/* Center Pentagon */}
          <polygon
            points="0,-18 -17,-5 -11,16 11,16 17,-5"
            fill="#18181b"
            stroke="#111111"
            strokeWidth="1.5"
            transform="scale(1.1) rotate(15)"
          />

          {/* Surrounding Seam Lines & Edge Pentagons */}
          {/* Connecting seams to outer edges */}
          <g stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" fill="#18181b">
            {/* Top Pentagon fragment */}
            <path d="M 0,-20 L -8,-45 L 8,-45 Z" />
            <line x1="0" y1="-20" x2="0" y2="-18" strokeWidth="3" />
            
            {/* Top-Right Pentagon fragment */}
            <path d="M 19,-5 L 42,-18 L 49,0 Z" />

            {/* Bottom-Right Pentagon fragment */}
            <path d="M 12,18 L 35,35 L 20,50 Z" />

            {/* Bottom-Left Pentagon fragment */}
            <path d="M -12,18 L -35,35 L -20,50 Z" />

            {/* Top-Left Pentagon fragment */}
            <path d="M -19,-5 L -42,-18 L -49,0 Z" />

            {/* Outer ring seams to give roundness */}
            <circle cx="0" cy="0" r="75" fill="none" stroke="#1a1a1a" strokeWidth="3" />
          </g>

          {/* Highlight/shine overlay on ball for extra 3D finish */}
          <ellipse cx="-20" cy="-25" rx="30" ry="15" fill="#ffffff" opacity="0.15" transform="rotate(-30, -20, -25)" />
        </g>

        {/* 5. Cursive "Siga La Pelota" Red Handwriting Text */}
        <g>
          {/* "Siga La" script */}
          <text
            x="200"
            y="170"
            fill="#D92B34"
            fontFamily="'Caveat', cursive"
            fontSize="74"
            textAnchor="middle"
            fontWeight="bold"
            letterSpacing="1"
            stroke="#faf6f0"
            strokeWidth="8"
            paintOrder="stroke fill"
            transform="rotate(-12, 200, 170)"
            className="drop-shadow-md select-none font-bold"
          >
            Siga La
          </text>
          <text
            x="200"
            y="170"
            fill="#D92B34"
            fontFamily="'Caveat', cursive"
            fontSize="74"
            textAnchor="middle"
            fontWeight="bold"
            letterSpacing="1"
            transform="rotate(-12, 200, 170)"
            className="select-none font-bold"
          >
            Siga La
          </text>

          {/* "Pelota" script */}
          <text
            x="202"
            y="245"
            fill="#D92B34"
            fontFamily="'Caveat', cursive"
            fontSize="92"
            textAnchor="middle"
            fontWeight="bold"
            letterSpacing="1.5"
            stroke="#faf6f0"
            strokeWidth="10"
            paintOrder="stroke fill"
            transform="rotate(-8, 202, 245)"
            className="drop-shadow-lg select-none font-bold"
          >
            Pelota
          </text>
          <text
            x="202"
            y="245"
            fill="#D92B34"
            fontFamily="'Caveat', cursive"
            fontSize="92"
            textAnchor="middle"
            fontWeight="bold"
            letterSpacing="1.5"
            transform="rotate(-8, 202, 245)"
            className="select-none font-bold"
          >
            Pelota
          </text>
        </g>
      </svg>
    </div>
  );
}
