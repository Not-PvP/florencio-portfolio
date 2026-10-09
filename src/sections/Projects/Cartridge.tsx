/**
 * A Game Boy–style cartridge, drawn in HTML/CSS so the label text stays crisp
 * at any size. Proportions follow a real cartridge (57 × 65 mm) with the cut
 * top-right corner, grip ridges and the embossed insert arrow.
 */
export interface CartridgeProps {
  name: string;
  tagline: string;
  color: string;
  image?: string;
  /** Rendered width in px; everything else scales from it. */
  width?: number;
}

export function Cartridge({ name, tagline, color, image, width = 150 }: CartridgeProps) {
  return (
    <span
      className="mk-gbc"
      style={{ "--w": `${width}px`, "--cart": color } as React.CSSProperties}
    >
      <span className="mk-gbc-ridges" aria-hidden="true" />
      <span className="mk-gbc-label">
        <span className="mk-gbc-band">{tagline}</span>
        <span className="mk-gbc-art">
          {image && <img src={image} alt="" loading="lazy" />}
          <span className="mk-gbc-name">{name}</span>
        </span>
      </span>
      <span className="mk-gbc-arrow" aria-hidden="true" />
    </span>
  );
}

export const CARTRIDGE_CSS = `
  .mk-gbc {
    --w: 150px;
    position: relative;
    display: block;
    width: var(--w);
    aspect-ratio: 57 / 65;
    font-size: calc(var(--w) / 15);
    border-radius: 0.35em 0 0.9em 0.9em;
    clip-path: polygon(0 0, 86% 0, 100% 10%, 100% 100%, 0 100%);
    background:
      linear-gradient(90deg, rgba(255,255,255,0.08), transparent 18%, transparent 82%, rgba(0,0,0,0.25)),
      linear-gradient(180deg, #45464d 0%, #34353b 55%, #2a2b30 100%);
    box-shadow: inset 0 0.12em 0 rgba(255,255,255,0.18), inset 0 -0.3em 0.6em rgba(0,0,0,0.35);
  }
  .mk-gbc-ridges {
    position: absolute;
    top: 3.5%;
    left: 12%;
    right: 22%;
    height: 9%;
    background: repeating-linear-gradient(180deg, rgba(0,0,0,0.38) 0 0.12em, rgba(255,255,255,0.1) 0.12em 0.22em, transparent 0.22em 0.5em);
  }
  .mk-gbc-label {
    position: absolute;
    top: 17%;
    left: 9%;
    right: 9%;
    bottom: 17%;
    display: flex;
    flex-direction: column;
    border-radius: 0.3em;
    overflow: hidden;
    background: #111216;
    box-shadow: 0 0 0 0.18em #1d1e22, inset 0 0 0 0.06em rgba(255,255,255,0.08);
  }
  .mk-gbc-band {
    flex: none;
    padding: 0.35em 0.5em;
    background: var(--cart);
    color: #fff;
    font-family: 'Space Mono', monospace;
    font-size: 0.72em;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mk-gbc-art {
    position: relative;
    flex: 1;
    display: flex;
    align-items: flex-end;
    padding: 0.5em;
    background:
      repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 3px),
      radial-gradient(circle at 72% 28%, color-mix(in srgb, var(--cart) 75%, transparent), transparent 72%),
      #0c0d10;
    overflow: hidden;
  }
  .mk-gbc-art img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .mk-gbc-name {
    position: relative;
    font-family: 'Anton', sans-serif;
    font-size: 1.55em;
    line-height: 0.95;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #f5f0e6;
    text-shadow: 0 0.1em 0.5em rgba(0,0,0,0.85);
    overflow-wrap: anywhere;
  }
  .mk-gbc-arrow {
    position: absolute;
    left: 50%;
    bottom: 5.5%;
    transform: translateX(-50%);
    border-left: 0.5em solid transparent;
    border-right: 0.5em solid transparent;
    border-top: 0.55em solid rgba(0,0,0,0.42);
    filter: drop-shadow(0 0.06em 0 rgba(255,255,255,0.12));
  }
`;
