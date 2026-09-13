import { useEffect, useRef } from "react";

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
  colorRoll: number;
}

export default function EmberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<EmberParticle[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {

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
        const color =
          p.colorRoll < 0.4 ? RED : p.colorRoll < 0.75 ? ORANGE : YELLOW;
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

  return (
    <>
      <style>{`

.mk-grid-bg {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px);
  background-size: 72px 72px;
  -webkit-mask-image: radial-gradient(ellipse 85% 75% at 50% 40%, #000 35%, transparent 92%);
  mask-image: radial-gradient(ellipse 85% 75% at 50% 40%, #000 35%, transparent 92%);
  pointer-events: none;
}
        .mk-ember-canvas {
          position: fixed;
          inset: 0;
          pointer-events: none;
        }

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
          .mk-heat-field { animation: none; opacity: 0.85; }
        }
      `}</style>
      <div className="mk-grid-bg" />
      <div className="mk-heat-field" />
      <canvas ref={canvasRef} className="mk-ember-canvas" />
    </>
  );
}
