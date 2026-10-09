import { Code2, Layers, Database, Wrench, type LucideIcon } from "lucide-react";

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
}

export const CATEGORIES: SkillCategory[] = [
  {
    id: "languages",
    fighterName: "Arsenal",
    label: "Languages",
    icon: Code2,
    accent: "#e8283c",
    skills: [
      { name: "TypeScript", tag: "TS", iconSlug: "typescript" },
      { name: "JavaScript", tag: "JS", iconSlug: "javascript" },
      { name: "Python", tag: "PY", iconSlug: "python" },
      { name: "Dart", tag: "DART", iconSlug: "dart" },
      { name: "HTML", tag: "HTML", iconSlug: "html5" },
      { name: "CSS", tag: "CSS", iconSlug: "css3" },
    ],
  },
  {
    id: "stack",
    fighterName: "Rig",
    label: "Frameworks & libraries",
    icon: Layers,
    accent: "#ff8a3d",
    skills: [
      { name: "React", tag: "RE", iconSlug: "react" },
      { name: "Next.js", tag: "NX", iconSlug: "nextjs" },
      { name: "Node.js", tag: "ND", iconSlug: "nodejs" },
      { name: "Express", tag: "EXP", iconSlug: "express" },
      { name: "Socket.io", tag: "IO", iconSlug: "socketio" },
      { name: "Tailwind CSS", tag: "TW", iconSlug: "tailwindcss" },
      { name: "Vite", tag: "VT", iconSlug: "vite" },
      { name: "Flutter", tag: "FLTR", iconSlug: "flutter" },
      { name: "TensorFlow", tag: "TF", iconSlug: "tensorflow" },
      { name: "Zod", tag: "ZOD", iconSlug: "zod" },
      { name: "Godot", tag: "GD", iconSlug: "godot" },
    ],
  },
  {
    id: "data",
    fighterName: "Home Base",
    label: "Databases & hosting",
    icon: Database,
    accent: "#38bdf8",
    skills: [
      { name: "PostgreSQL", tag: "PG", iconSlug: "postgresql" },
      { name: "Supabase", tag: "SB", iconSlug: "supabase" },
      { name: "Firebase", tag: "FB", iconSlug: "firebase" },
      { name: "Turso", tag: "TUR", iconSlug: "turso" },
      { name: "Railway", tag: "RWY", iconSlug: "railway" },
      { name: "Render", tag: "RND", iconSlug: "render" },
      { name: "Vercel", tag: "VC", iconSlug: "vercel" },
    ],
  },
  {
    id: "tools",
    fighterName: "Utility Belt",
    label: "Tools",
    icon: Wrench,
    accent: "#c9a227",
    skills: [
      { name: "Git", tag: "GIT", iconSlug: "git" },
      { name: "GitHub", tag: "GH", iconSlug: "github" },
      { name: "VS Code", tag: "VSC", iconSlug: "vscode" },
      { name: "Docker", tag: "DKR", iconSlug: "docker" },
      { name: "Claude", tag: "CL", iconSlug: "claude" },
      { name: "Gemini", tag: "GM", iconSlug: "googlegemini" },
      { name: "ChatGPT", tag: "GPT" },
      { name: "AutoCAD", tag: "CAD", iconSlug: "autocad" },
    ],
  },
];
