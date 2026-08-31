import { useEffect, useRef, useState } from "react";
import AboutMe from "./sections/AboutMe/AboutMe";
import Projects from "./sections/Projects/Projects";
import Skills from "./sections/Skills/Skills";
import Contact from "./sections/Contact/Contact";
import EmberBackground from "./sections/shared/Background";
import BootGate from "./sections/shared/BootGate";
import EasterEgg from "./sections/shared/EasterEgg";
import SoundToggle from "./sections/shared/SoundToggle";
import Separator from "./sections/shared/Separator";

// ── Section registry ─────────────────────────────────────────────────
// Order here controls both the scroll order and the nav dots below.
const SECTIONS = [
  { id: "about", label: "About", Component: AboutMe },
  { id: "projects", label: "Projects", Component: Projects },
  { id: "skills", label: "Skills", Component: Skills },
  { id: "contact", label: "Contact", Component: Contact },
] as const;

export default function App() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [booted, setBooted] = useState(false);

  // Load the two site-wide fonts exactly once, here, instead of every
  // section importing the same Google Fonts URL in its own <style>
  // block. Each of those was a separate render-blocking request for
  // content the browser already had.
  useEffect(() => {
    const id = "mk-fonts-link";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Anton&family=Space+Mono:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);

  // Track which section is most in-view so the nav dots stay in sync
  // with scroll position without forcing scroll-snap on the page.
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
        /* Label flyout — reuses the same dark-plate/orange-accent language
           as the About Me drawer tab, so it reads as one HUD system
           rather than a new UI pattern. Positioned absolutely so it never
           shifts the dot's own position when it appears. */
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
        /* Scoped to the whole nav rather than each item — hovering or
           focusing anywhere in the dot column reveals every label at
           once, so it reads as "here's the menu" instead of labels
           trickling in one at a time as you happen to cross each dot. */
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
          /* No hover on touch devices, so a hover-only label never has a
             way to appear — drop it rather than leave dead CSS. */
          .mk-nav-label { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-nav-label { transition: opacity 0.15s ease; transition-delay: 0s !important; }
        }
        /* Nav dots sit far enough off the edge on desktop; pull them in
           on narrow viewports so they don't hang half off-screen and so
           they're easier to hit with a thumb. */
        @media (max-width: 640px) {
          .mk-side-nav {
            right: 10px !important;
            gap: 10px !important;
          }
        }
      `}</style>
      {/* Boot gate — held until the visitor's first tap/click/keypress,
          which also unlocks the Web Audio context for everything below. */}
      {!booted && <BootGate onDismiss={() => setBooted(true)} />}
      {/* Global hidden combo — listens everywhere, not just in Contact. */}
      <EasterEgg />
      {/* Single global ember/cursor background layer — fixed, mounted once
          here so it persists continuously under every section instead of
          restarting or duplicating per-section. */}
      <EmberBackground />
      {/* Sound toggle — sits opposite the side nav dots. Starts muted; the
          boot gate's tap already satisfied the browser's audio-gesture
          requirement, so unmuting here plays sound immediately. */}
      <SoundToggle />
      {/* Side nav dots — jump between rounds without hunting for a scrollbar */}
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
        {SECTIONS.map(({ id, label }) => {
          const isActive = activeId === id;
          return (
            <div key={id} className="mk-nav-item">
              <span className="mk-nav-label" aria-hidden="true">
                {label}
              </span>
              <button
                type="button"
                className="mk-nav-dot"
                onClick={() => scrollToSection(id)}
                aria-label={`Go to ${label}`}
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
    </div>
  );
}
