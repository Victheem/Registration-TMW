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
    <img
      src="/assets/aistudio/WhatsApp%20Image%202026-10-27%20at%209.13.45%20AM.jpeg"
      width={size}
      height={size}
      alt="Tinubu Movement Worldwide seal"
      className={`shrink-0 rounded-full object-cover ring-1 ring-emerald-900/10 ${className}`}
    />
  );
};
