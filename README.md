# KRAM.DEV — Mark Angelo Florencio

**Live:** https://florencio-portfolio.vercel.app

A fighter-game-themed personal portfolio. Built with React, TypeScript, and Vite.

- **Title card** — a character-select screen (portrait, stat bars, Press Start) that also unlocks audio
- **About Me** — intro, with an interactive globe pinned to Philippines
- **School** — a "stage select" of schools, newest first, each expanding into a year-by-year log of coursework, honors and awards
- **Projects** — a cartridge-select screen; pick a project to "insert" it into a console shell, complete with live GitHub stats
- **Skills** — a VS-style character-select grid grouped by category
- **Contact** — a hidden fighting-game combo (arrow keys + a letter, or swipe on touch) triggers email/GitHub/LinkedIn
- **Footer** — a "Continue?" credits screen with a visible email, copy button, links and back-to-top, plus the **Challenger Roster**: visitors pick a pixel fighter, add a 3-character tag and a 140-character remark, and get pinned to a shared wall (stored in Supabase; see below)

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · lucide-react

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check and build for production
npm run lint      # run ESLint
```

## Project structure

```
src/
  sections/
    AboutMe/       hero section + the Earth globe
    Education/     stage-select school log
    Projects/      cartridge/console UI, GitHub stats fetching
    Skills/        character-select skill grid
    Contact/       combo-input contact section
    shared/        title card (BootGate), background, easter egg, sound, footer (Outro)
```

## Design tokens

Colors, text opacities and font stacks live as CSS variables in `src/index.css` (`--mk-*`). New components should use them instead of hard-coded hex values. Project screenshots go in `public/projects/` and are set through the optional `image` field in `src/data/projects.ts`.

## Challenger Roster (Supabase)

1. Create a free project at supabase.com, open **SQL Editor**, paste `supabase/setup.sql` and run it.
2. Copy `.env.example` to `.env.local` and fill in the project URL and anon key (Project Settings -> API). Add the same two variables in Vercel (Project Settings -> Environment Variables) and redeploy.
3. Without those variables, `npm run dev` runs a browser-only test mode and a production build hides the roster.

Rules (length, no links, word filter, cooldown, flood limit, auto-hide after 3 reports) are enforced in the database, so they hold even if someone calls the API directly. To remove a remark, delete the row in Supabase (Table Editor), or run `update public.challengers set hidden = true where id = '...'`. The word list lives in `src/data/blocklist.ts` and is mirrored in `supabase/setup.sql`; change both together.
