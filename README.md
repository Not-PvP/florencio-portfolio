# KRAM.DEV — Mark Angelo Florencio

**Live:** https://florencio-portfolio.vercel.app

A fighter-game-themed personal portfolio. Built with React, TypeScript, and Vite.

- **Title card** — a character-select screen (portrait, stat bars, Press Start) that also unlocks audio
- **About Me** — intro, with an interactive globe pinned to Philippines
- **School** — a "stage select" of schools, newest first, each expanding into a year-by-year log of coursework, honors and awards
- **Projects** — a cartridge-select screen; pick a project to "insert" it into a console shell, complete with live GitHub stats
- **Skills** — a VS-style character-select grid grouped by category
- **Contact** — a hidden fighting-game combo (arrow keys + a letter, or swipe on touch) triggers email/GitHub/LinkedIn
- **Footer** — a "Continue?" credits screen with a visible email, copy button, links and back-to-top

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
