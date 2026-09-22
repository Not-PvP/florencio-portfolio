export default function Education() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "transparent",
        fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @keyframes mk-edu-grid-pulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        .mk-edu-grid {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          animation: mk-edu-grid-pulse 4s ease-in-out infinite;
        }
        @keyframes mk-edu-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .mk-edu-dot {
          animation: mk-edu-blink 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-edu-grid { animation: none !important; }
          .mk-edu-dot { animation: none !important; opacity: 1 !important; }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="mk-edu-grid"
        style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}
      />

      {[
        { top: 22, left: 22, borderWidth: "3px 0 0 3px" },
        { top: 22, right: 22, borderWidth: "3px 3px 0 0" },
        { bottom: 22, left: 22, borderWidth: "0 0 3px 3px" },
        { bottom: 22, right: 22, borderWidth: "0 3px 3px 0" },
      ].map((pos, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "26px",
            height: "26px",
            borderColor: "rgba(232,40,60,0.6)",
            borderStyle: "solid",
            pointerEvents: "none",
            zIndex: 1,
            ...pos,
          }}
        />
      ))}

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: "600px" }}>
        <p
          style={{
            margin: "0 0 10px",
            fontSize: "12px",
            letterSpacing: "0.35em",
            color: "#e8283c",
            fontWeight: 700,
          }}
        >
          BACKSTORY
        </p>
        <h1
          style={{
            margin: "0 0 32px",
            fontFamily: "'Anton', sans-serif",
            fontSize: "clamp(36px, 6vw, 64px)",
            color: "#f2f2f2",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            lineHeight: 1,
            textShadow: "0 0 30px rgba(232,40,60,0.3)",
          }}
        >
          Training Grounds
        </h1>

        <div
          style={{
            border: "1px dashed rgba(232,40,60,0.4)",
            borderRadius: "14px",
            padding: "44px 32px",
            background: "rgba(232,40,60,0.04)",
          }}
        >
          <span
            aria-hidden="true"
            className="mk-edu-dot"
            style={{
              display: "block",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#e8283c",
              boxShadow: "0 0 10px rgba(232,40,60,0.7)",
              margin: "0 auto 18px",
            }}
          />
          <p
            style={{
              margin: "0 0 10px",
              fontFamily: "'Anton', sans-serif",
              fontSize: "24px",
              color: "#f2f2f2",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Coming Soon...
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.05em",
              lineHeight: 1.7,
            }}
          >
            School, coursework, and the road that led here — this file is
            still being assembled.
          </p>
        </div>
      </div>
    </div>
  );
}
