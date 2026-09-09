import React from "react";

export interface CartridgeSVGProps {
  color: string;
  highlighted: boolean;
  id: string;
  name: string;
  tagline: string;
}

export function CartridgeSVG({ color, highlighted, id, name, tagline }: CartridgeSVGProps) {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <svg
      width="200"
      height="130"
      viewBox="0 0 200 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: highlighted
          ? "drop-shadow(0 12px 20px rgba(0,0,0,0.6)) drop-shadow(0 0 12px rgba(232,40,60,0.4))"
          : "drop-shadow(0 6px 10px rgba(0,0,0,0.5))",
        transition: "filter 0.2s ease",
      }}
    >
      <defs>
        <linearGradient id={`cartGrad-${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#101114" />
        </linearGradient>
      </defs>

      <path
        d="M 10 0 L 190 0 C 195 0 200 5 200 10 L 200 115 C 200 122 195 128 188 128 L 12 128 C 5 128 0 122 0 115 L 0 10 C 0 5 5 0 10 0 Z"
        fill={`url(#cartGrad-${safeId})`}
        stroke={highlighted ? "#e8283c" : "#3a3b3f"}
        strokeWidth={highlighted ? "2" : "1"}
      />

      <rect x="20" y="8" width="160" height="3" rx="1.5" fill="rgba(255,255,255,0.15)" />
      <rect x="20" y="15" width="160" height="3" rx="1.5" fill="rgba(0,0,0,0.3)" />

      <rect x="16" y="28" width="168" height="84" rx="4" fill="#0d0e10" stroke="#25262a" strokeWidth="1" />

      <rect x="22" y="34" width="156" height="72" rx="2" fill="#17181c" />
      <rect x="22" y="34" width="156" height="18" fill="#e8283c" />

      <text x="30" y="46" fontSize="8" fill="#ffffff" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">
        {tagline.toUpperCase().slice(0, 22)}
      </text>

      <text x="30" y="72" fontSize="15" fill="#f2f2f2" fontWeight="bold" fontFamily="'Anton', sans-serif" letterSpacing="0.02em">
        {name.toUpperCase()}
      </text>

      <text x="30" y="94" fontSize="7" fill="#8a8c92" fontFamily="monospace">
        GAME CARTRIDGE
      </text>

      <path d="M 160 85 L 168 90 L 160 95 Z" fill="#e8283c" opacity="0.8" />
    </svg>
  );
}