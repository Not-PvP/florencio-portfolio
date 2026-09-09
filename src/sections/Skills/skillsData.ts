import { Code2, Layers, Cpu, Wrench, Database, type LucideIcon } from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────
// Swap these arrays out with your real stack whenever you're ready.
// `iconSlug` keys into BRAND_SVGS below (official devicon/simple-icons/
// bootstrap-icons artwork, inlined at build time so colors are always
// correct and there's no CDN round-trip). No iconSlug, or a slug not
// present in the map, falls back to the plain 2-4 letter tag badge
// automatically. Claude's mark below is the real starburst icon (from
// Bootstrap Icons, MIT-licensed) on its actual brand terracotta, #D97757.
// ChatGPT/OpenAI has no plain-mark SVG in any of these sets, so it's left
// without a logo rather than guessing at one.
export interface Skill {
  name: string;
  tag: string;
  iconSlug?: string;
}

export interface SkillCategory {
  id: string;
  fighterName: string;
  label: string;
  icon: LucideIcon;
  accent: string;
  skills: Skill[];
  portraitUrl?: string;
}

export const CATEGORIES: SkillCategory[] = [
  // Each category can optionally take a portraitUrl (e.g. "/images/arsenal.png").
  // Until real art is ready, leave it unset — the column falls back to a
  // silhouette placeholder so the agent-select layout is fully visible now.
  {
    id: "languages",
    fighterName: "Arsenal",
    label: "Languages",
    icon: Code2,
    accent: "#e8283c",
    skills: [
      { name: "JavaScript", tag: "JS", iconSlug: "javascript" },
      { name: "TypeScript", tag: "TS", iconSlug: "typescript" },
      { name: "Python", tag: "PY", iconSlug: "python" },
      { name: "Dart", tag: "DART", iconSlug: "dart" },
      { name: "HTML", tag: "HTML", iconSlug: "html5" },
      { name: "CSS", tag: "CSS", iconSlug: "css3" },
    ],
  },
  {
    id: "stack",
    fighterName: "Rig",
    label: "Frameworks & Libraries",
    icon: Layers,
    accent: "#ff8a3d",
    skills: [
      { name: "React", tag: "RE", iconSlug: "react" },
      { name: "Next.js", tag: "NX", iconSlug: "nextjs" },
      { name: "Node.js", tag: "ND", iconSlug: "nodejs" },
      { name: "Express", tag: "EXP", iconSlug: "express" },
      { name: "Flutter", tag: "FLTR", iconSlug: "flutter" },
      { name: "Tailwind CSS", tag: "TW", iconSlug: "tailwindcss" },
      { name: "Vite", tag: "VT", iconSlug: "vite" },
      { name: "Socket.io", tag: "IO", iconSlug: "socketio" },
      { name: "Zod", tag: "ZOD", iconSlug: "zod" },
      { name: "Godot", tag: "GD", iconSlug: "godot" },
    ],
  },
  {
    id: "data",
    fighterName: "Home Base",
    label: "Databases & Hosting",
    icon: Database,
    accent: "#38bdf8",
    skills: [
      { name: "PostgreSQL", tag: "PG", iconSlug: "postgresql" },
      { name: "Firebase", tag: "FB", iconSlug: "firebase" },
      { name: "Turso", tag: "TUR", iconSlug: "turso" },
      { name: "Railway", tag: "RWY", iconSlug: "railway" },
      { name: "Render", tag: "RND", iconSlug: "render" },
      { name: "Vercel", tag: "VC", iconSlug: "vercel" },
    ],
  },
  {
    id: "ai-ml",
    fighterName: "Special Moves",
    label: "AI Tools",
    icon: Cpu,
    accent: "#c9a227",
    skills: [
      { name: "Claude", tag: "CL", iconSlug: "claude" },
      { name: "ChatGPT", tag: "GPT" },
      { name: "Gemini", tag: "GM", iconSlug: "googlegemini" },
      { name: "TensorFlow", tag: "TF", iconSlug: "tensorflow" },
    ],
  },
  {
    id: "tools",
    fighterName: "Utility Belt",
    label: "Dev Tools",
    icon: Wrench,
    accent: "#9aa0ab",
    skills: [
      { name: "Git", tag: "GIT", iconSlug: "git" },
      { name: "GitHub", tag: "GH", iconSlug: "github" },
      { name: "VS Code", tag: "VSC", iconSlug: "vscode" },
      { name: "Docker", tag: "DKR", iconSlug: "docker" },
      { name: "AutoCAD", tag: "CAD", iconSlug: "autocad" },
    ],
  },
];