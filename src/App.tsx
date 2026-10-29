import { useEffect, useRef, useState } from "react";
import AboutMe from "./sections/AboutMe/AboutMe";
import Education from "./sections/Education/Education";
import Projects from "./sections/Projects/Projects";
import Skills from './sections/Skills/Skills';
import Contact from "./sections/Contact/Contact";
import BootGate from "./sections/shared/BootGate";
import EasterEgg from "./sections/shared/EasterEgg";
import SoundToggle from "./sections/shared/SoundToggle";
import Separator from "./sections/shared/Separator";
import Outro from "./sections/shared/Outro";
import { playClick } from "./sections/shared/audio";

const SECTIONS = [
  { id: "about", label: "About", Component: AboutMe },
  { id: "projects", label: "Projects", Component: Projects },
  { id: "skills", label: "Skills", Component: Skills },
  { id: "school", label: "School", Component: Education },
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

  useEffect(() => {
    // One quiet tick for every button and link. Elements can opt out with data-silent.
    function onClick(e: MouseEvent) {
      const el = (e.target as Element | null)?.closest("button, a[href], [role='button']");
      if (!el || el.closest("[data-silent], .mk-sound-btn")) return;
      playClick();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  function scrollToSection(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div style={{ width: "100%", background: "#0a0a0a", overflowX: "clip" }}>
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
          font-family: var(--mk-font-body);
          font-size: 16px;
          font-weight: 700;
          color: var(--mk-text-2);
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
          bottom: -3px;
          height: 3px;
          background: #e8283c;
          
        }

        .mk-navbar-brand {
          display: flex;
          flex-direction: column;
          line-height: 1;
          white-space: nowrap;
        }
        .mk-navbar-name {
          font-family: var(--mk-font-display);
          font-size: 26px;
          color: var(--mk-orange);
        }
        .mk-navbar-sub {
          margin-top: 2px;
          font-family: var(--mk-font-mono);
          font-size: 13px;
          color: var(--mk-text-3);
        }

        @media (max-width: 720px) {
          .mk-navbar-sub { display: none; }
          .mk-navbar-links { gap: 14px !important; }
          .mk-navbar-link { font-size: 15px !important; padding: 12px 2px !important; }
        }
        @media (max-width: 480px) {
          .mk-navbar-name { display: none; }
          .mk-navbar-links { gap: 10px !important; }
          .mk-navbar-link { font-size: 14px !important; }
        }
      `}</style>

      {!booted && <BootGate onDismiss={() => setBooted(true)} />}

      <EasterEgg />

      <nav
        aria-label="Section navigation"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 30,
          background: "#08080a",
          
          borderBottom: "none",
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
            <img src="/favicon.svg" alt="" width={35} height={35} style={{ display: "block", borderRadius: 0 }} />
            <span className="mk-navbar-brand">
              <span className="mk-navbar-name">KRAM.DEV</span>
              <span className="mk-navbar-sub">MARK ANGELO FLORENCIO</span>
            </span>
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
            height: "3px",
            background: "#2a2220",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${scrollProgress}%`,
              background: "var(--mk-red)",
              
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
      <Separator next="CONTINUE" />
      <Outro sections={SECTIONS} />
    </div>
  );
}