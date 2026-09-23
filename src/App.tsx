import { useEffect, useRef, useState } from "react";
import AboutMe from "./sections/AboutMe/AboutMe";
import Education from "./sections/Education/Education";
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
  { id: "about", label: "About", Component: AboutMe },
  { id: "school", label: "School", Component: Education },
  { id: "projects", label: "Projects", Component: Projects },
  { id: "skills", label: "Skills", Component: Skills },
  { id: "contact", label: "Contact", Component: Contact },
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

        .mk-section-anchor {
          scroll-margin-top: 64px;
        }

        .mk-navbar-link {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Space Mono', 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          padding: 6px 2px;
          transition: color 0.2s ease;
        }
        .mk-navbar-link:hover {
          color: #ff8a5b;
        }
        .mk-navbar-link:focus-visible {
          outline: 2px solid #ff8a5b;
          outline-offset: 2px;
        }
        .mk-navbar-link[aria-current="true"] {
          color: #e8283c;
        }
        .mk-navbar-link[aria-current="true"]::after {
          content: "";
          position: absolute;
          left: 2px;
          right: 2px;
          bottom: -2px;
          height: 2px;
          background: #e8283c;
          box-shadow: 0 0 6px rgba(232,40,60,0.7);
        }

        .mk-navbar-name {
          font-family: 'Anton', sans-serif;
          font-size: 14px;
          letter-spacing: 0.04em;
          color: #f2f2f2;
          white-space: nowrap;
        }

        @media (max-width: 720px) {
          .mk-navbar-name { display: none; }
          .mk-navbar-links { gap: 12px !important; }
          .mk-navbar-link { font-size: 9.5px !important; letter-spacing: 0.06em !important; }
        }
      `}</style>

      {!booted && <BootGate onDismiss={() => setBooted(true)} />}

      <EasterEgg />

      <EmberBackground />

      <nav
        aria-label="Section navigation"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 30,
          background: "rgba(8,8,10,0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(232,40,60,0.25)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            padding: "12px 20px",
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/favicon.svg" alt="" width={35} height={35} style={{ display: "block", borderRadius: "6px" }} />
            <span className="mk-navbar-name">MARK ANGELO FLORENCIO</span>
          </div>

          <div
            className="mk-navbar-links"
            style={{ display: "flex", alignItems: "center", gap: "22px" }}
          >
            {SECTIONS.map(({ id, label }) => {
              const isActive = activeId === id;
              return (
                <button
                  key={id}
                  type="button"
                  className="mk-navbar-link"
                  onClick={() => scrollToSection(id)}
                  aria-label={`Go to ${label}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  {label}
                </button>
              );
            })}
            <SoundToggle active={booted} variant="inline" />
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            width: "100%",
            height: "2px",
            background: "rgba(255,255,255,0.06)",
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
      </nav>
      {SECTIONS.map(({ id, Component }, i) => (
        <div key={id}>
          <div
            className="mk-section-anchor"
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