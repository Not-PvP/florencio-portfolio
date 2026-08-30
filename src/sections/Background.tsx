import { useEffect, useRef } from "react";

// ── Single global background layer ──────────────────────────────────
// Mount this ONCE, at the top of App.tsx — not per-section. It's
// position: fixed to the viewport, so it persists continuously as the
// page scrolls instead of restarting per section, and there's exactly
// one instance of the cursor-reactive effect instead of four separate
// ones drifting out of sync with each other.
//
// For this to actually show through, each section's own root div needs
// a transparent (or removed) background — the shared dark color now
// lives once on <body> in index.css.
const RED = "232,40,60";
const ORANGE = "255,154,92";
const YELLOW = "255,207,61";

interface EmberParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  colorRoll: number; // 0..1 — picks which of the three ember colors this particle uses
}

export default function EmberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<EmberParticle[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Size the canvas to the viewport, and re-size on resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      // Capped at 2 — phones commonly report a DPR of 3, which would
      // otherwise make the backing canvas 9x the pixel count for no
      // visible sharpness gain, and burns battery on every ember frame.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = `${window.innerWidth}px`;
      canvas!.style.height = `${window.innerHeight}px`;
      const ctx = canvas!.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Ambient embers: spawn from the bottom of the viewport on their own,
  // always running regardless of mouse activity. Since the canvas is
  // fixed, this reads as one continuous field the whole time you scroll.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    function spawnAmbient() {
      particlesRef.current.push({
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 10,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.45 + 0.18),
        size: Math.random() * 1.8 + 0.7,
        life: 0,
        maxLife: 260 + Math.random() * 180,
        colorRoll: Math.random(),
      });
    }

    function tick() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx!.clearRect(0, 0, canvas!.width / dpr, canvas!.height / dpr);

      // Slightly denser than the old per-section version, since one
      // instance now has to carry the whole page's atmosphere.
      if (particlesRef.current.length < 110 && Math.random() > 0.42) {
        spawnAmbient();
      }

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx + Math.sin(p.y * 0.01) * 0.2;
        p.y += p.vy;
        p.vy -= 0.0015;

        const t = p.life / p.maxLife;
        const alpha = Math.max(1 - t, 0);
        // Three-way split instead of a binary warm/cool choice, so the
        // field reads as red/orange/yellow embers rather than just two.
        const color = p.colorRoll < 0.4 ? RED : p.colorRoll < 0.75 ? ORANGE : YELLOW;
        ctx!.fillStyle = `rgba(${color},${alpha * 0.85})`;
        ctx!.shadowColor = `rgba(${color},${alpha})`;
        ctx!.shadowBlur = 7;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * (1 - t * 0.3), 0, Math.PI * 2);
        ctx!.fill();
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Cursor-reactive layer: one glow + spark trail for the whole page.
  // Coordinates map 1:1 to the viewport since this is position: fixed,
  // so no per-section bounding-box math is needed anymore.
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (glowRef.current) {
        glowRef.current.style.opacity = "1";
        glowRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => {
        if (glowRef.current) glowRef.current.style.opacity = "0";
      }, 900);

      const now = performance.now();
      if (now - lastSpawnRef.current < 14) return;
      lastSpawnRef.current = now;

      for (let i = 0; i < 2; i++) {
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 6,
          y: e.clientY + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 0.9,
          vy: -(0.3 + Math.random() * 0.9),
          size: 1.4 + Math.random() * 2.2,
          life: 0,
          maxLife: 35 + Math.random() * 30,
          colorRoll: Math.random(),
        });
      }
      if (particlesRef.current.length > 260) {
        particlesRef.current.splice(0, particlesRef.current.length - 260);
      }
    }

    function onLeaveWindow() {
      if (glowRef.current) glowRef.current.style.opacity = "0";
    }

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeaveWindow);
    window.addEventListener("blur", onLeaveWindow);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeaveWindow);
      window.removeEventListener("blur", onLeaveWindow);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  return (
    <>
      <style>{`
        .mk-ember-canvas {
          position: fixed;
          inset: 0;
          pointer-events: none;
        }
        .mk-ember-glow {
          position: fixed;
          top: 0;
          left: 0;
          width: 460px;
          height: 460px;
          margin-left: -230px;
          margin-top: -230px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232,40,60,0.28) 0%, rgba(150,26,30,0.14) 42%, transparent 70%);
          filter: blur(18px);
          mix-blend-mode: screen;
          opacity: 0;
          transition: opacity 0.4s ease;
          will-change: transform;
          pointer-events: none;
          animation: mk-glow-heat 6s ease-in-out infinite;
        }
        /* Cycles the glow's hue red -> orange -> yellow -> back, so the
           cursor trail breathes through the same heat palette as the
           ambient embers instead of staying a flat red. hue-rotate keeps
           this to one gradient layer instead of crossfading several. */
        @keyframes mk-glow-heat {
          0%, 100% { filter: blur(18px) hue-rotate(0deg); }
          50% { filter: blur(18px) hue-rotate(28deg); }
        }
        /* Slow ambient heat pulse rising from the bottom of the viewport —
           a second, independent breathing layer behind the embers so the
           whole page feels like it's radiating warmth, not just the spot
           under the cursor. */
        .mk-heat-field {
          position: fixed;
          inset: 0;
          background: radial-gradient(
            ellipse 70% 55% at 50% 100%,
            rgba(232,40,60,0.16) 0%,
            rgba(255,138,61,0.09) 35%,
            rgba(255,207,61,0.035) 55%,
            transparent 75%
          );
          animation: mk-heat-pulse 6s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes mk-heat-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-ember-glow { transition: none; animation: none; }
          .mk-heat-field { animation: none; opacity: 0.85; }
        }
        @media (hover: none) {
          /* No cursor on touch devices — ambient embers still run via canvas,
             this just hides the glow that would otherwise never fade in. */
          .mk-ember-glow { display: none; }
        }
      `}</style>
      <div className="mk-heat-field" />
      <canvas ref={canvasRef} className="mk-ember-canvas" />
      <div ref={glowRef} className="mk-ember-glow" />
    </>
  );
}