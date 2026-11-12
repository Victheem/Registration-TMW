/**
 * Official All Progressives Congress (APC) Insignia & Brand Emblem
 * Uses the authentic official APC high-resolution emblem asset
 */

import React from "react";

interface APCLogoProps {
  size?: number;
  className?: string;
  variant?: "shield" | "badge" | "horizontal";
}

export const APCLogo: React.FC<APCLogoProps> = ({
  size = 40,
  className = "",
}) => {
  return (
    <img
      src="/assets/aistudio/apc_6f5b68a5.webp"
      alt="All Progressives Congress (APC) Emblem"
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`shrink-0 object-contain select-none ${className}`}
      loading="eager"
    />
  );
};
