import { useState } from "react";
import { BRAND_SVGS, MONO_BRAND_ICONS } from "./brandSvgs";
import type { Skill } from "./skillsData";

// A single skill tile. Renders the real inlined brand SVG when one exists
// in BRAND_SVGS; otherwise falls back to the plain letter tag, so the
// layout never shows a broken image or a wrong-looking recolor.
export function SkillTile({
  skill,
  accent,
  delay,
  reducedMotion,
}: {
  skill: Skill;
  accent: string;
  delay: number;
  reducedMotion: boolean;
}) {
  const svg = skill.iconSlug ? BRAND_SVGS[skill.iconSlug] : undefined;
  const isMono = !!skill.iconSlug && MONO_BRAND_ICONS.has(skill.iconSlug);
  // Cursor-driven 3D tilt, like the tile is a little card angling toward
  // your hand. {rx, ry} in degrees; {0,0} is flat/at-rest.
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [isHovering, setIsHovering] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    const maxTilt = 12;
    setTilt({ rx: -py * maxTilt, ry: px * maxTilt });
  }
  function handleEnter() {
    if (!reducedMotion) setIsHovering(true);
  }
  function handleLeave() {
    setTilt({ rx: 0, ry: 0 });
    setIsHovering(false);
  }

  const tiltTransform = reducedMotion
    ? undefined
    : `perspective(560px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(${isHovering ? -3 : 0}px) scale(${isHovering ? 1.03 : 1})`;

  return (
    <div className="mk-tile" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="mk-tile-card"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          width: "116px",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "10px",
          padding: "16px 10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          transform: tiltTransform,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: accent,
            background: "rgba(255,255,255,0.02)",
            overflow: "hidden",
          }}
        >
          {svg ? (
            <div
              aria-label={skill.name}
              role="img"
              className={`mk-brand-svg${isMono ? " mk-brand-mono" : ""}`}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            skill.tag
          )}
        </div>
        <span
          style={{
            fontSize: "9.5px",
            color: "rgba(255,255,255,0.75)",
            textAlign: "center",
            letterSpacing: "0.02em",
            lineHeight: 1.3,
          }}
        >
          {skill.name}
        </span>
      </div>
    </div>
  );
}