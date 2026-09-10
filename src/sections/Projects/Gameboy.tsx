import { useEffect } from "react";

export interface ProjectLink {
  label: string;
  url: string;
}

export interface ConsoleShellSVGProps {
  leftLink?: ProjectLink;
  rightLink?: ProjectLink;
  onPrev?: () => void;
  onNext?: () => void;
  onActionA?: () => void;
  onActionB?: () => void;
}

export function ConsoleShellSVG({
  leftLink,
  rightLink,
  onPrev,
  onNext,
  onActionA,
  onActionB,
}: ConsoleShellSVGProps) {
  // Keyboard Navigation Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowDown" || e.key === "ArrowRight") onNext?.();
      if (e.key === "Enter") onActionA?.();
      if (e.key === "Escape" || e.key === "Backspace") onActionB?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPrev, onNext, onActionA, onActionB]);

  return (
    <svg
      viewBox="0 0 420 680"
      width="100%"
      height="auto"
      style={{
        display: "block",
        filter: "drop-shadow(0 25px 35px rgba(0,0,0,0.85))",
      }}
    >
      <defs>
        <linearGradient id="shellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a2b30" />
          <stop offset="50%" stopColor="#1a1b1f" />
          <stop offset="100%" stopColor="#111215" />
        </linearGradient>

        <linearGradient id="shellHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
        </linearGradient>

        <linearGradient id="screenFrameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1b1e" />
          <stop offset="100%" stopColor="#0d0e10" />
        </linearGradient>

        <linearGradient id="screenGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f1012" />
          <stop offset="100%" stopColor="#050506" />
        </linearGradient>

        <radialGradient id="btnAGrad" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#ff3b50" />
          <stop offset="50%" stopColor="#e8283c" />
          <stop offset="100%" stopColor="#7a0818" />
        </radialGradient>

        <radialGradient id="btnBGrad" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#e8283c" />
          <stop offset="50%" stopColor="#c41e30" />
          <stop offset="100%" stopColor="#5c0714" />
        </radialGradient>

        <linearGradient id="dpadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3d3e42" />
          <stop offset="100%" stopColor="#1e1f22" />
        </linearGradient>

        <linearGradient id="screenGlare" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="30%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>

        <style>{`
          .interactive-btn { cursor: pointer; transition: opacity 0.15s ease, filter 0.15s ease; }
          .interactive-btn:hover { filter: brightness(1.3) drop-shadow(0 0 6px rgba(255,255,255,0.4)); }
          .interactive-btn:active { opacity: 0.7; }
          .dpad-btn { cursor: pointer; }
          .dpad-btn:hover { fill: #2a2b30; }
          .dpad-btn:active { fill: #e8283c; }
        `}</style>
      </defs>

      {/* Cartridge Slot Recess */}
      <rect x="140" y="2" width="140" height="16" rx="4" fill="#08080a" />
      <rect x="146" y="6" width="128" height="12" rx="2" fill="#000000" />

      {/* Main Body Shell */}
      <path
        d="M 28 14 L 392 14 Q 416 14 416 38 L 416 600 Q 416 676 336 676 L 84 676 Q 4 676 4 600 L 4 38 Q 4 14 28 14 Z"
        fill="url(#shellGrad)"
        stroke="#4a4c52"
        strokeWidth="1.5"
      />
      <path
        d="M 28 15 L 392 15 Q 415 15 415 38 L 415 598 Q 415 674 336 674 L 84 674 Q 5 674 5 598 L 5 38 Q 5 15 28 15 Z"
        fill="none"
        stroke="url(#shellHighlight)"
        strokeWidth="1"
      />

      {/* Screen Frame Bezel */}
      <rect x="24" y="44" width="372" height="308" rx="16" fill="url(#screenFrameGrad)" stroke="#0a0a0c" strokeWidth="2" />
      <rect x="25" y="45" width="370" height="306" rx="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

      {/* Display Glass Recess */}
      <rect x="42" y="60" width="336" height="272" rx="6" fill="url(#screenGlassGrad)" stroke="#000000" strokeWidth="2" />
      <path d="M 42 60 L 220 60 L 42 238 Z" fill="url(#screenGlare)" pointerEvents="none" />

      {/* Interactive D-Pad */}
      <g transform="translate(105, 450)" filter="drop-shadow(0 6px 10px rgba(0,0,0,0.65))">
        <circle cx="0" cy="0" r="46" fill="#121315" />
        <path
          d="M -15 -44 L 15 -44 Q 17 -44 17 -42 L 17 -15 L 42 -15 Q 44 -15 44 -13 L 44 13 Q 44 16 42 16 L 17 16 L 17 42 Q 17 44 15 44 L -15 44 Q -17 44 -17 42 L -17 16 L -42 16 Q -44 16 -44 13 L -44 -13 Q -44 -15 -42 -15 L -17 -15 L -17 -42 Q -17 -44 -15 -44 Z"
          fill="url(#dpadGrad)"
          stroke="#2d2e32"
          strokeWidth="1.5"
        />
        <circle cx="0" cy="0" r="13" fill="#1c1d20" stroke="#121315" strokeWidth="1" />

        {/* Clickable D-Pad Direction Zones */}
        <path d="M -15 -42 L 15 -42 L 15 -15 L -15 -15 Z" className="dpad-btn" fill="transparent" onClick={onPrev} />
        <path d="M -15 15 L 15 15 L 15 42 L -15 42 Z" className="dpad-btn" fill="transparent" onClick={onNext} />
        <path d="M -42 -15 L -15 -15 L -15 15 L -42 15 Z" className="dpad-btn" fill="transparent" onClick={onPrev} />
        <path d="M 15 -15 L 42 -15 L 42 15 L 15 15 Z" className="dpad-btn" fill="transparent" onClick={onNext} />

        {/* Directional Arrows */}
        <path d="M 0 -34 L -5 -26 L 5 -26 Z" fill="#151618" pointerEvents="none" />
        <path d="M 0 34 L -5 26 L 5 26 Z" fill="#151618" pointerEvents="none" />
        <path d="M -34 0 L -26 -5 L -26 5 Z" fill="#151618" pointerEvents="none" />
        <path d="M 34 0 L 26 -5 L 26 5 Z" fill="#151618" pointerEvents="none" />
      </g>

      {/* Action Buttons */}
      <g transform="translate(305, 450)" filter="drop-shadow(0 8px 12px rgba(0,0,0,0.7))">
        <rect x="-62" y="-32" width="124" height="64" rx="32" fill="#121315" stroke="#2a2b2f" strokeWidth="1.5" transform="rotate(-25)" />

        {/* B Button */}
        <g transform="translate(-24, 12)" className="interactive-btn" onClick={onActionB}>
          <circle cx="0" cy="0" r="21" fill="url(#btnBGrad)" stroke="#40040b" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="19" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fontSize="12" fill="#ffffff" fontFamily="monospace" fontWeight="900">
            B
          </text>
        </g>

        {/* A Button */}
        <g transform="translate(24, -12)" className="interactive-btn" onClick={onActionA}>
          <circle cx="0" cy="0" r="21" fill="url(#btnAGrad)" stroke="#520510" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="19" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fontSize="12" fill="#ffffff" fontFamily="monospace" fontWeight="900">
            A
          </text>
        </g>
      </g>

      {/* Select / Left Link (GITHUB) */}
      {leftLink ? (
        <a href={leftLink.url} target="_blank" rel="noopener noreferrer">
          <g transform="translate(144, 555) rotate(-20)" className="interactive-btn">
            <rect x="0" y="0" width="46" height="11" rx="5.5" fill="#2a2b2e" stroke="#17181a" />
            <text x="23" y="24" textAnchor="middle" fontSize="7" fill="#a9abaf" fontFamily="monospace" letterSpacing="0.05em" fontWeight="bold">
              {leftLink.label.toUpperCase()}
            </text>
          </g>
        </a>
      ) : (
        <g transform="translate(144, 555) rotate(-20)">
          <rect x="0" y="0" width="46" height="11" rx="5.5" fill="#2a2b2e" stroke="#17181a" />
          <text x="23" y="24" textAnchor="middle" fontSize="7" fill="#585a60" fontFamily="monospace" letterSpacing="0.05em" fontWeight="bold">
            SELECT
          </text>
        </g>
      )}

      {/* Start / Right Link (LIVE DEMO) */}
      {rightLink ? (
        <a href={rightLink.url} target="_blank" rel="noopener noreferrer">
          <g transform="translate(206, 555) rotate(-20)" className="interactive-btn">
            <rect x="0" y="0" width="46" height="11" rx="5.5" fill="#2a2b2e" stroke="#17181a" />
            <text x="23" y="24" textAnchor="middle" fontSize="7" fill="#a9abaf" fontFamily="monospace" letterSpacing="0.05em" fontWeight="bold">
              {rightLink.label.toUpperCase()}
            </text>
          </g>
        </a>
      ) : (
        <g transform="translate(206, 555) rotate(-20)">
          <rect x="0" y="0" width="46" height="11" rx="5.5" fill="#2a2b2e" stroke="#17181a" />
          <text x="23" y="24" textAnchor="middle" fontSize="7" fill="#585a60" fontFamily="monospace" letterSpacing="0.05em" fontWeight="bold">
            START
          </text>
        </g>
      )}

      {/* Speaker Vents */}
      <g transform="translate(320, 560) rotate(-28)" opacity="0.6">
        <rect x="0" y="0" width="50" height="4" rx="2" fill="#0d0e10" />
        <rect x="0" y="9" width="50" height="4" rx="2" fill="#0d0e10" />
        <rect x="0" y="18" width="50" height="4" rx="2" fill="#0d0e10" />
        <rect x="0" y="27" width="50" height="4" rx="2" fill="#0d0e10" />
        <rect x="0" y="36" width="50" height="4" rx="2" fill="#0d0e10" />
      </g>
    </svg>
  );
}