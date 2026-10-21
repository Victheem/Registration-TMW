/**
 * Official Tinubu Movement Worldwide (TMW) Seal & Brand Emblem
 */

import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export const TMWLogo: React.FC<LogoProps> = ({ className = "", size = 64 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm ${className}`}
      aria-label="Tinubu Movement Worldwide Official Seal"
    >
      {/* Outer Golden/Green Ring */}
      <circle cx="60" cy="60" r="58" fill="#FFFFFF" stroke="#0D5C3A" strokeWidth="4" />
      <circle cx="60" cy="60" r="53" fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="2 2" />
      
      {/* Inner Green Field */}
      <circle cx="60" cy="60" r="48" fill="#0D5C3A" />
      <circle cx="60" cy="60" r="46" fill="#09432A" />

      {/* Decorative Stars */}
      <polygon points="60,17 62,22 67,22 63,25 65,30 60,27 55,30 57,25 53,22 58,22" fill="#FBBF24" />
      <circle cx="34" cy="27" r="2" fill="#FBBF24" />
      <circle cx="86" cy="27" r="2" fill="#FBBF24" />

      {/* Center Shield with Nigerian Flag Triad */}
      <g transform="translate(38, 38)">
        <path
          d="M 22 2 C 34 2 40 10 40 22 C 40 34 22 42 22 44 C 22 42 4 34 4 22 C 4 10 10 2 22 2 Z"
          fill="#FFFFFF"
          stroke="#F59E0B"
          strokeWidth="1.5"
        />
        {/* Nigerian Green vertical bands */}
        <clipPath id="shieldClip">
          <path d="M 22 2 C 34 2 40 10 40 22 C 40 34 22 42 22 44 C 22 42 4 34 4 22 C 4 10 10 2 22 2 Z" />
        </clipPath>
        <g clipPath="url(#shieldClip)">
          {/* Left Green band */}
          <rect x="4" y="2" width="12" height="42" fill="#0D5C3A" />
          {/* Right Green band */}
          <rect x="28" y="2" width="12" height="42" fill="#0D5C3A" />
          {/* Center White band */}
          <rect x="16" y="2" width="12" height="42" fill="#FFFFFF" />
          
          {/* Cap / Symbol motif in center */}
          <circle cx="22" cy="22" r="7" fill="#DC2626" />
          <path d="M 18 22 Q 22 17 26 22 Q 22 27 18 22 Z" fill="#FFFFFF" />
        </g>
      </g>

      {/* Ribbon / Scroll at bottom */}
      <path
        d="M 20 86 Q 60 76 100 86 L 96 98 Q 60 88 24 98 Z"
        fill="#DC2626"
        stroke="#B91C1C"
        strokeWidth="1"
      />
      {/* TMW Text on Ribbon */}
      <text
        x="60"
        y="93"
        textAnchor="middle"
        fontSize="8"
        fontWeight="800"
        fill="#FFFFFF"
        fontFamily="sans-serif"
        letterSpacing="1.2"
      >
        TMW · 2027
      </text>

      {/* Top arc text indicator */}
      <path id="textArc" d="M 22,60 A 38,38 0 0,1 98,60" fill="none" />
      <text fill="#FEF3C7" fontSize="6.5" fontWeight="700" letterSpacing="0.8">
        <textPath href="#textArc" startOffset="50%" textAnchor="middle">
          TINUBU MOVEMENT WORLDWIDE
        </textPath>
      </text>
    </svg>
  );
};
