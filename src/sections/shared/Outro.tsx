import { useState } from "react";
import { ArrowUp, Check, Copy, Mail } from "lucide-react";
import { PORTFOLIO_STACK } from "../../data/projects";
import { playChime } from "./audio";
import Challengers from "./Challengers";

const GITHUB_PATH =
  "M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.016-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.303-5.467-1.334-5.467-5.93 0-1.31.468-2.38 1.235-3.22-.123-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.241 2.874.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.624-5.48 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.373-12-12-12z";

const LINKEDIN_PATH =
  "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zM8 19h-3v-9h3v9zM6.5 8.25c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM20 19h-3v-4.744c0-1.132-.023-2.588-1.578-2.588-1.581 0-1.822 1.235-1.822 2.51v4.822h-3v-9h2.879v1.233h.041c.401-.761 1.379-1.563 2.841-1.563 3.037 0 3.6 2 3.6 4.59v4.74z";

const EMAIL = "contactmarkflorencio@gmail.com";

const LINKS = [
  { label: "Email", detail: "Send me a message", href: `mailto:${EMAIL}`, external: false },
  { label: "GitHub", detail: "github.com/Not-PvP", href: "https://github.com/Not-PvP", external: true },
  {
    label: "LinkedIn",
    detail: "Mark Angelo Florencio",
    href: "https://www.linkedin.com/in/mark-angelo-florencio-597765423/",
    external: true,
  },
] as const;

interface OutroProps {
  sections: readonly { id: string; label: string }[];
}

function goTo(id: string) {
  document.querySelector(`[data-section-id="${id}"]`)?.scrollIntoView({ behavior: "smooth" });
}

export default function Outro({ sections }: OutroProps) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      playChime();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  }

  return (
    <footer className="mk-credits">
      <style>{`
        .mk-credits {
          width: 100%;
          padding: 96px 24px 32px;
          background: var(--mk-bg-deep);
          border-top: 6px solid var(--mk-red);
          font-family: var(--mk-font-body);
          box-sizing: border-box;
        }
        .mk-credits-inner { width: 100%; max-width: 1100px; margin: 0 auto; }
        .mk-credits-title {
          margin: 0 0 12px;
          font-family: var(--mk-font-display);
          font-weight: 400;
          font-size: clamp(72px, 14vw, 168px);
          line-height: 0.85;
          color: var(--mk-orange);
        }
        .mk-credits-lede { margin: 0 0 28px; max-width: 44ch; font-size: 19px; line-height: 1.55; color: var(--mk-text); }
        .mk-credits-cta { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; }
        .mk-credits-email { margin: 18px 0 0; font-size: 16px; color: var(--mk-text-2); word-break: break-all; }
        .mk-credits-grid {
          display: grid;
          grid-template-columns: 1fr 1.4fr;
          gap: 40px 64px;
          margin-top: 80px;
          padding-top: 36px;
          border-top: 3px solid #2e2724;
        }
        .mk-credits-head {
          margin: 0 0 12px;
          font-family: var(--mk-font-display);
          font-weight: 400;
          font-size: 30px;
          line-height: 1;
          color: var(--mk-cream);
        }
        .mk-credits-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 2px; }
        .mk-credits-nav { display: flex; flex-wrap: wrap; gap: 2px 22px; }
        .mk-credits-item {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 40px;
          padding: 0;
          font: inherit;
          font-size: 17px;
          color: var(--mk-text);
          background: none;
          border: none;
          text-decoration: none;
          cursor: pointer;
        }
        .mk-credits-item:hover { color: var(--mk-orange); text-decoration: underline; text-underline-offset: 4px; }
        .mk-credits-item small { display: block; font-size: 14px; color: var(--mk-text-3); }
        .mk-credits-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 16px 24px;
          margin-top: 64px;
          font-size: 14px;
          color: var(--mk-text-3);
        }
        .mk-credits-bar p { margin: 0; max-width: 60ch; line-height: 1.6; }
        @media (max-width: 760px) {
          .mk-credits { padding-top: 64px; }
          .mk-credits-grid { grid-template-columns: 1fr; margin-top: 56px; }
          .mk-credits-cta .mk-btn { flex: 1 1 100%; }
        }
      `}</style>

      <div className="mk-credits-inner">
        <h2 className="mk-credits-title">Continue?</h2>
        <p className="mk-credits-lede">
          Got a project, an internship or a game idea? Send me a message and I will reply.
        </p>
        <div className="mk-credits-cta">
          <a className="mk-btn" href={`mailto:${EMAIL}`}>
            <Mail size={18} strokeWidth={2.5} aria-hidden="true" />
            Email me
          </a>
          <button type="button" className="mk-btn mk-btn-ghost" onClick={copyEmail} aria-live="polite">
            {copied ? <Check size={18} strokeWidth={2.5} aria-hidden="true" /> : <Copy size={18} strokeWidth={2.5} aria-hidden="true" />}
            {copied ? "Copied" : "Copy address"}
          </button>
        </div>

        <Challengers />

        <div className="mk-credits-grid">
          <div>
            <h3 className="mk-credits-head">Elsewhere</h3>
            <ul className="mk-credits-list">
              {LINKS.map(({ label, detail, href, external }) => (
                <li key={label}>
                  <a
                    className="mk-credits-item"
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {label === "Email" && <Mail size={18} strokeWidth={2} aria-hidden="true" />}
                    {label === "GitHub" && (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                        <path d={GITHUB_PATH} />
                      </svg>
                    )}
                    {label === "LinkedIn" && (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                        <path d={LINKEDIN_PATH} />
                      </svg>
                    )}
                    <span>
                      {label}
                      <small>{detail}</small>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer">
            <h3 className="mk-credits-head">Jump to</h3>
            <div className="mk-credits-nav">
              {sections.map(({ id, label }) => (
                <button key={id} type="button" className="mk-credits-item" onClick={() => goTo(id)}>
                  {label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        <div className="mk-credits-bar">
          <p>
            © {new Date().getFullYear()} Mark Angelo Florencio. Built with {PORTFOLIO_STACK.join(", ")}.
          </p>
          <button
            type="button"
            className="mk-btn mk-btn-ghost"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}
