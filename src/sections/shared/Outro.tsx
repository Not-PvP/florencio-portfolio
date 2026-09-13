import { Mail } from "lucide-react";

const GITHUB_PATH =
  "M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.016-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.303-5.467-1.334-5.467-5.93 0-1.31.468-2.38 1.235-3.22-.123-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.241 2.874.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.624-5.48 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.373-12-12-12z";

const LINKEDIN_PATH =
  "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zM8 19h-3v-9h3v9zM6.5 8.25c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM20 19h-3v-4.744c0-1.132-.023-2.588-1.578-2.588-1.581 0-1.822 1.235-1.822 2.51v4.822h-3v-9h2.879v1.233h.041c.401-.761 1.379-1.563 2.841-1.563 3.037 0 3.6 2 3.6 4.59v4.74z";

const ICON_LINKS = [
  { label: "Email", href: "mailto:contactmarkflorencio@gmail.com", external: false },
  { label: "GitHub", href: "https://github.com/Not-PvP", external: true },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/mark-angelo-florencio-597765423/",
    external: true,
  },
] as const;

export default function Outro() {
  return (
    <footer
      style={{
        width: "100%",
        padding: "56px 24px 40px",
        textAlign: "center",
        background: "#08080a",
        borderTop: "1px solid rgba(232,40,60,0.25)",
        fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .mk-outro-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.5);
          transition: border-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
        }
        .mk-outro-link:hover {
          border-color: #ff8a5b;
          color: #ff8a5b;
          transform: translateY(-2px);
        }
        .mk-outro-link:focus-visible {
          outline: 2px solid #ff8a5b;
          outline-offset: 2px;
        }
      `}</style>

      <p
        style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: "clamp(28px, 4vw, 40px)",
          color: "#f2f2f2",
          margin: "0 0 10px",
          letterSpacing: "0.03em",
        }}
      >
        GG
      </p>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: "12px",
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.05em",
        }}
      >
        Thanks for playing through. See you in the next round.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "14px",
          marginBottom: "28px",
        }}
      >
        {ICON_LINKS.map(({ label, href, external }) => (
          <a
            key={label}
            href={href}
            className="mk-outro-link"
            aria-label={label}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {label === "Email" && <Mail size={16} strokeWidth={1.75} />}
            {label === "GitHub" && (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d={GITHUB_PATH} />
              </svg>
            )}
            {label === "LinkedIn" && (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d={LINKEDIN_PATH} />
              </svg>
            )}
          </a>
        ))}
      </div>

      <p
        style={{
          margin: 0,
          fontSize: "10px",
          color: "rgba(255,255,255,0.25)",
          letterSpacing: "0.08em",
        }}
      >
        © {new Date().getFullYear()} Mark Angelo Florencio
      </p>
    </footer>
  );
}
