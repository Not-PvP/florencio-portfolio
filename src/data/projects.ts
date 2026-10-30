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
  /** Optional award or recognition for the project. */
  award?: string;
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
    award: "2nd Place, IED Competition",
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
  {
    id: "hititup",
    name: "HIT IT UP!",
    tagline: "Roblox party game",
    description:
      "A chaotic Roblox party game built around balloons and turns — players take turns hitting the balloon and try not to be the one holding it when things go bang. Built solo in Roblox Studio and playtested with friends.",
    stack: ["Luau", "Roblox Studio"],
    links: [],
    cartColor: "#c9356b",
  },
  {
    id: "suga",
    name: "SUGA",
    tagline: "Brownout alert app",
    description:
      "A brownout notifier for Iloilo that shows scheduled and ongoing power interruptions by area and sends push alerts ahead of time. I built the Express and libSQL backend with its REST API and admin CRUD for advisories, paired with a Flutter app on the front.",
    stack: ["Flutter", "Dart", "Node.js", "Express", "libSQL"],
    links: [
      { label: "GitHub", url: "https://github.com/Not-PvP/FP_SUGA" },
      { label: "Live demo", url: "https://suga-web.vercel.app/" },
    ],
    cartColor: "#e0a100",
  },
  {
    id: "wordlerace",
    name: "Wordle Race",
    tagline: "Multiplayer word race",
    description:
      "A fast, competitive multiplayer word-guessing game — create a room, share the code, and race your friends to solve the word first against the clock.",
    stack: ["TypeScript", "Next.js", "React", "Tailwind CSS", "Vercel"],
    links: [{ label: "Live demo", url: "https://wordlerace-beta.vercel.app/" }],
    cartColor: "#2f7d4f",
  },
];

/** Stack used to build this portfolio site itself (package.json, deployed on Vercel). */
export const PORTFOLIO_STACK = ["React", "TypeScript", "Vite", "Tailwind CSS", "Vercel"];
