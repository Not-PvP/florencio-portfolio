export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  links: ProjectLink[];
  cartColor: string;
  /** Optional screenshot or GIF path (e.g. "/projects/kramkard.png" in public/). */
  image?: string;
}

export const PROJECTS: Project[] = [
  {
    id: "cosign",
    name: "CoSign",
    tagline: "ML sign language app",
    description:
      "A machine learning app that reads sign language in real time — gamified like MonkeyType, but you're signing instead of typing. Includes a practice mode to drill individual hand signs. Full-stack build with separate frontend and backend.",
    stack: ["Python", "TensorFlow", "TypeScript", "Next.js", "Tailwind CSS", "Vercel"],
    links: [],
    cartColor: "#8a0303",
  },
  {
    id: "kramkard",
    name: "Kram Kard",
    tagline: "Multiplayer card game",
    description:
      "A real-time multiplayer card game — turn-based battles, a competitive leaderboard, and randomly generated cards with their own rarity and tier. Equal parts strategy and luck.",
    stack: ["TypeScript", "React", "Vite", "Socket.io", "Turso", "Railway"],
    links: [{ label: "GitHub", url: "https://github.com/Not-PvP/KramKard" }],
    cartColor: "#d95d00",
  },
  {
    id: "parcomm",
    name: "ParComm",
    tagline: "Parking management system",
    description:
      "A real-time parking management system using QR-code ticketing and live occupancy dashboards. Guards scan tickets to track vehicle entry/exit, while students and admins get live visibility into available parking — built to cut down search time and campus traffic congestion.",
    stack: ["TypeScript", "Next.js", "React", "Tailwind CSS", "Firebase", "Vercel"],
    links: [
      { label: "GitHub", url: "https://github.com/Not-PvP/ParComm" },
      { label: "Live demo", url: "https://par-comm.vercel.app/" },
    ],
    cartColor: "#4a4e57",
  },
];

/** Stack used to build this portfolio site itself (package.json, deployed on Vercel). */
export const PORTFOLIO_STACK = ["React", "TypeScript", "Vite", "Tailwind CSS", "Vercel"];
