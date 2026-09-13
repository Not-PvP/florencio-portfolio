import { useEffect, useRef, useState } from "react";
import AboutMe from "./sections/AboutMe/AboutMe";
import Projects from "./sections/Projects/Projects";
import Skills from './sections/Skills/Skills';
import Contact from "./sections/Contact/Contact";
import EmberBackground from "./sections/shared/Background";
import BootGate from "./sections/shared/BootGate";
import EasterEgg from "./sections/shared/EasterEgg";
import SoundToggle from "./sections/shared/SoundToggle";
import Separator from "./sections/shared/Separator";
import Outro from "./sections/shared/Outro";

const SECTIONS = [
  { id: "about", label: "About", round: "Round 1", Component: AboutMe },
  { id: "projects", label: "Projects", round: "Round 2", Component: Projects },
  { id: "skills", label: "Skills", round: "Round 3", Component: Skills },
  { id: "contact", label: "Contact", round: "Round 4", Component: Contact },
] as const;

export default function App() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [booted, setBooted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)) : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target) {
          const id = (visible.target as HTMLElement).dataset.sectionId;
          if (id) setActiveId(id);
        }
      },
      { threshold: [0.4, 0.6] },
    );

    Object.values(sectionRefs.current).forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  function scrollToSection(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div style={{ width: "100%", background: "#0a0a0a", overflowX: "hidden" }}>
      <style>{`
        html {
          scroll-behavior: smooth;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        html::-webkit-scrollbar {
          display: none;
        }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
        }
        .mk-nav-dot {
          transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }
        .mk-nav-dot:hover {
          transform: scale(1.25);
          border-color: rgba(255,138,91,0.8);
        }
        .mk-nav-dot:focus-visible {
          outline: 2px solid #ff8a5b;
          outline-offset: 3px;
        }

        .mk-nav-item {
          position: relative;
        }
        .mk-nav-label {
          position: absolute;
          top: 50%;
          right: calc(100% + 14px);
          transform: translate(8px, -50%);
          white-space: nowrap;
          background: rgba(20,10,10,0.9);
          border: 1px solid rgba(196,30,30,0.55);
          border-radius: 6px 0 6px 6px;
          padding: 5px 10px;
          font-family: 'Space Mono', 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #ff8a5b;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .mk-side-nav:hover .mk-nav-label,
        .mk-side-nav:focus-within .mk-nav-label {
          opacity: 1;
          transform: translate(0, -50%);
        }
        .mk-nav-item:nth-child(1) .mk-nav-label { transition-delay: 0s; }
        .mk-nav-item:nth-child(2) .mk-nav-label { transition-delay: 0.04s; }
        .mk-nav-item:nth-child(3) .mk-nav-label { transition-delay: 0.08s; }
        .mk-nav-item:nth-child(4) .mk-nav-label { transition-delay: 0.12s; }
        @media (hover: none) {

          .mk-nav-label { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-nav-label { transition: opacity 0.15s ease; transition-delay: 0s !important; }
        }

        @media (max-width: 640px) {
          .mk-side-nav {
            right: 10px !important;
            gap: 10px !important;
          }
        }
      `}</style>

      {!booted && <BootGate onDismiss={() => setBooted(true)} />}

      <EasterEgg />

      <EmberBackground />

      <SoundToggle active={booted} />

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "3px",
          background: "rgba(255,255,255,0.06)",
          zIndex: 30,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${scrollProgress}%`,
            background: "linear-gradient(90deg, #e8283c, #ff8a5b)",
            boxShadow: "0 0 8px rgba(232,40,60,0.6)",
          }}
        />
      </div>

      <nav
        aria-label="Section navigation"
        className="mk-side-nav"
        style={{
          position: "fixed",
          right: "22px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {SECTIONS.map(({ id, label, round }) => {
          const isActive = activeId === id;
          return (
            <div key={id} className="mk-nav-item">
              <span className="mk-nav-label" aria-hidden="true">
                {round} — {label}
              </span>
              <button
                type="button"
                className="mk-nav-dot"
                onClick={() => scrollToSection(id)}
                aria-label={`Go to ${label} (${round})`}
                aria-current={isActive ? "true" : undefined}
                style={{
                  width: isActive ? "10px" : "8px",
                  height: isActive ? "10px" : "8px",
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: isActive ? "#e8283c" : "rgba(255,255,255,0.15)",
                  boxShadow: isActive ? "0 0 10px rgba(232,40,60,0.7)" : "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            </div>
          );
        })}
      </nav>
      {SECTIONS.map(({ id, Component }, i) => (
        <div key={id}>
          <div
            data-section-id={id}
            ref={(node) => {
              sectionRefs.current[id] = node;
            }}
          >
            <Component />
          </div>
          {i < SECTIONS.length - 1 && (
            <Separator next={SECTIONS[i + 1].label} />
          )}
        </div>
      ))}
      <Separator next="GG" />
      <Outro />
    </div>
  );
}