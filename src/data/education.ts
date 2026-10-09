export type StageStatus = "cleared" | "current" | "locked";
export type QuestStatus = "cleared" | "in-progress" | "submitted";

export interface Quest {
  name: string;
  summary: string;
  stack: string[];
  status: QuestStatus;
  link?: { label: string; url: string };
}

export interface QuestTrack {
  id: string;
  label: string;
  quests: Quest[];
}

/** Year 2 coursework, kept for later. Add `tracks: COLLEGE_YEAR_2` to the Year 2 stage to show it. */
export const COLLEGE_YEAR_2: QuestTrack[] = [
  {
    id: "mobile",
    label: "Mobile development",
    quests: [
      {
        name: "Lost & Found app",
        summary: "Flutter lab: create, edit and claim lost-item listings, with categories and Material 3 styling.",
        stack: ["Flutter", "Dart"],
        status: "cleared",
      },
      {
        name: "Mini Playlist",
        summary: "Flutter lab on multi-screen navigation and passing data between routes.",
        stack: ["Flutter", "Dart"],
        status: "in-progress",
      },
    ],
  },
  {
    id: "web",
    label: "Web & backend",
    quests: [
      {
        name: "GearHub",
        summary: "Pair-built mini store with product search and a persistent cart, using React context and a reducer.",
        stack: ["React", "TypeScript"],
        status: "cleared",
        link: { label: "GitHub", url: "https://github.com/Not-PvP/lab_gearhubecommerce" },
      },
      {
        name: "REST API lab",
        summary: "Backend assignment: a typed REST API built with Express.",
        stack: ["Express", "TypeScript"],
        status: "cleared",
      },
    ],
  },
  {
    id: "se",
    label: "Software engineering",
    quests: [
      {
        name: "CATTS",
        summary: "Campus lost-and-found system, built by a student team running Scrum.",
        stack: ["Scrum", "Team project"],
        status: "in-progress",
      },
      {
        name: "Team site",
        summary: "Intro website for our project team, written in plain HTML, CSS and JavaScript.",
        stack: ["HTML", "CSS", "JavaScript"],
        status: "cleared",
      },
    ],
  },
  {
    id: "beyond",
    label: "Outside class",
    quests: [
      {
        name: "SUGA",
        summary: "Brownout-alert web app for Iloilo that turns power advisories into per-barangay schedules. Entered in the Philippine Startup Challenge XI.",
        stack: ["PWA", "Startup challenge"],
        status: "submitted",
      },
    ],
  },
];

export type HighlightKind = "academic" | "competition" | "leadership";

export interface Highlight {
  title: string;
  detail?: string;
  /** Optional; guessed from the title when left out. */
  kind?: HighlightKind;
}

export interface Stage {
  id: string;
  /** Short label on the map, e.g. "Year 2" or "Grade 10". */
  label: string;
  status: StageStatus;
  /** Short honor shown under the node instead of "Cleared", e.g. "High Honors". */
  honor?: string;
  /** Grouped work for this stage (shown as a quest log). */
  tracks?: QuestTrack[];
  /** Honors, awards and roles: a short title, plus optional context. */
  highlights?: Highlight[];
}

export interface Arc {
  id: string;
  label: string;
  school: string;
  place: string;
  years: string;
  /** Degree, strand or track. */
  detail?: string;
  stages: Stage[];
}

export const ORIGIN =
  "I always knew I wanted to be an engineer, just not which kind. Then my dad introduced me to software engineering, and as someone who grew up loving games, it clicked.";

export const ARCS: Arc[] = [
  {
    id: "riyadh",
    label: "Grades 7–9",
    school: "Future Generation Philippines International School",
    place: "Riyadh, Saudi Arabia",
    years: "2019 – 2022",
    stages: [
      {
        id: "g7",
        label: "Grade 7",
        status: "cleared",
        highlights: [
          { title: "Participant, Spelling Quiz Bee" },
          { title: "Qualified for With Honors", detail: "Before the school introduced its formal honors system" },
        ],
      },
      {
        id: "g8",
        label: "Grade 8",
        status: "cleared",
        honor: "High Honors",
        highlights: [
          { title: "With High Honors", detail: "Year-end academic award" },
          { title: "Top 4, Mathematics Speed Test", detail: "3rd and 4th quarters" },
          { title: "Top 5, Mathematics Speed Test", detail: "2nd quarter" },
          { title: "Most Participative Student Award", detail: "3rd and 4th quarters" },
          { title: "Class Auditor" },
        ],
      },
      {
        id: "g9",
        label: "Grade 9",
        status: "cleared",
        honor: "High Honors",
        highlights: [
          { title: "With High Honors", detail: "Year-end academic award" },
          { title: "Top 7, Mathematics Speed Test", detail: "3rd quarter" },
          { title: "Most Participative Student Award", detail: "1st, 3rd, and 4th quarters" },
          { title: "Participant, Spelling Quiz Bee" },
        ],
      },
    ],
  },
  {
    id: "roxas",
    label: "Grades 10–12",
    school: "College of St. John Roxas",
    place: "Roxas City, Capiz",
    years: "2022 – 2025",
    detail: "STEM strand",
    stages: [
      {
        id: "g10",
        label: "Grade 10",
        status: "cleared",
        honor: "High Honors",
        highlights: [
          { title: "With High Honors", detail: "Year-end academic award" },
          { title: "3rd Place, Mathematics Quiz Bee", detail: "Secondary level, Grades 7 to 12" },
          { title: "Best in Mathematics Award" },
        ],
      },
      {
        id: "g11",
        label: "Grade 11",
        status: "cleared",
        honor: "High Honors",
        highlights: [
          { title: "With High Honors", detail: "Year-end academic award" },
          { title: "1st Place, Mathematics Quiz Bee", detail: "Science and Mathematics Month 2023" },
          { title: "3rd Place, Poster-Making Contest", detail: "Day of Rising celebration" },
          { title: "Class Vice President" },
          { title: "Vice President, Journalism Club" },
          { title: "Delegate, LASSO Youth Leaders Camp", detail: "Lasallian Schools Supervision Office" },
        ],
      },
      {
        id: "g12",
        label: "Grade 12",
        status: "cleared",
        honor: "High Honors",
        highlights: [
          { title: "With High Honors", detail: "Year-end academic award" },
          { title: "With Highest Honors", detail: "2nd quarter" },
          { title: "1st Place, Best in Research", detail: "Special Science Project Fair 2025, final defense" },
          { title: "Br. Francis Cody Award" },
          { title: "2nd Place, Filipino Sports Writing", detail: "Buwan ng Wika" },
          { title: "Contestant, Division Schools Press Conference", detail: "Filipino Sports Writing and English Collaborative Writing" },
          { title: "Class Vice President" },
        ],
      },
    ],
  },
  {
    id: "college",
    label: "College",
    school: "Central Philippine University",
    place: "Iloilo City",
    years: "2025 – present",
    detail: "BS Software Engineering",
    stages: [
      {
        id: "y1",
        label: "Year 1",
        status: "cleared",
        honor: "Dean's Lister",
        highlights: [
          { title: "Top 2, Dean's List", detail: "1st and 2nd semesters" },
          { title: "2nd Place, IED Competition", detail: "CoSign, a sign language recognition app" },
          { title: "University Scholar", detail: "Half-tuition academic scholarship" },
        ],
      },
      { id: "y2", label: "Year 2", status: "current" },
      { id: "y3", label: "Year 3", status: "locked" },
      { id: "y4", label: "Year 4", status: "locked" },
    ],
  },
];
