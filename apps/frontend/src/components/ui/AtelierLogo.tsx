import React from "react";

interface AtelierLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  showBackground?: boolean;
}

export default function AtelierLogo({
  size = 32,
  showBackground = true,
  className = "",
  ...props
}: AtelierLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      {showBackground && (
        <rect
          width="64"
          height="64"
          rx="14"
          fill="#13131A"
          stroke="#FFFFFF"
          strokeOpacity="0.1"
          strokeWidth="1.2"
        />
      )}
      <defs>
        <linearGradient id="brandGrad" x1="16" y1="14" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF4B72" />
          <stop offset="50%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#9E1B32" />
        </linearGradient>
      </defs>
      {/* Architectural atelier 'A' intersected with crisp code chevron bracket */}
      <path
        d="M32 14 L46 48 L39.5 48 L35.5 38 L28.5 38 L24.5 48 L18 48 Z"
        fill="url(#brandGrad)"
      />
      {/* Sleek negative space apex cutout */}
      <path d="M32 23.5 L36 33 L28 33 Z" fill={showBackground ? "#13131A" : "#0B0B0F"} />
      {/* Precision code delimiter / accent diamond notch */}
      <rect x="29" y="39" width="6" height="2" rx="1" fill="#FFFFFF" fillOpacity="0.9" />
      {/* Compiler node dot */}
      <circle cx="48" cy="18" r="2.5" fill="#E11D48" />
      <circle cx="48" cy="18" r="1" fill="#FFFFFF" />
    </svg>
  );
}
