import { useMemo } from "react";

interface SeparatorProps {
  next: string;
  name?: string;
}

export default function Separator({ next, name = "FLORENCIO" }: SeparatorProps) {
  const token = `${name} // ${next.toUpperCase()} //`;
  // Repeated enough times that even ultra-wide screens never see a gap.
  const half = useMemo(() => Array.from({ length: 8 }, () => token), [token]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        background: "#0a0a0a",
        borderTop: "1px solid rgba(232,40,60,0.4)",
        borderBottom: "1px solid rgba(232,40,60,0.4)",
        boxShadow: "0 0 20px rgba(232,40,60,0.15) inset, 0 0 12px rgba(232,40,60,0.25)",
        padding: "18px 0",
      }}
    >
      <style>{`
        @keyframes mk-separator-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .mk-separator-track {
          display: flex;
          width: max-content;
          animation: mk-separator-scroll 45s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-separator-track { animation: none; }
        }
        .mk-separator-item {
          font-family: 'Anton', sans-serif;
          font-size: clamp(26px, 4.5vw, 44px);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          white-space: nowrap;
          padding: 0 16px;
        }
      `}</style>
      <div className="mk-separator-track">
        {[...half, ...half].map((text, i) => (
          <span
            key={i}
            className="mk-separator-item"
            style={{ color: i % 2 === 0 ? "#ff8a5b" : "rgba(255,138,91,0.3)" }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}