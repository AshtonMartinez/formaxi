# Formaxi — Project Guide

## Overview

**Rondo** is a soccer league management web app for organizing Sunday city leagues. The main application lives in `rondo/`. The `soccer-league-management-app/` folder contains the original design specification (Claude Design export) — use it as a visual reference but don't modify it.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TypeScript 5
- **Styling:** Tailwind CSS 4 (utility classes only, no CSS modules)
- **Backend:** Supabase (database, auth, real-time)
- **Package Manager:** pnpm (always use pnpm, never npm or yarn)
- **Fonts:** Archivo (headings), Hanken Grotesk (body)

## Commands

```bash
cd rondo
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm start      # Run production build
pnpm lint       # ESLint
```

## Project Structure

```
rondo/src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (fonts, metadata)
│   ├── globals.css         # Tailwind @theme tokens (colors, etc.)
│   └── (dashboard)/        # Layout group for main app routes
│       ├── standings/      # League table, top scorers, fixtures
│       ├── discover/       # Browse leagues to join
│       ├── schedule/       # Match schedule
│       ├── team/           # Roster management
│       ├── profile/        # User profile
│       └── create/         # Create new league
├── components/
│   ├── layout/             # Sidebar, header, nav items
│   ├── ui/                 # Reusable primitives (Card, Badge, Button, Avatar, etc.)
│   └── icons/              # SVG icon components
└── lib/
    ├── types.ts            # Domain type definitions
    ├── theme.ts            # Color/style constants
    └── utils.ts            # cn() helper (clsx + tailwind-merge)
```

## Code Conventions

- **Server Components by default.** Only add `"use client"` when the component needs interactivity (hooks, event handlers, browser APIs).
- **Tailwind only.** All styling via utility classes. Use `cn()` from `lib/utils.ts` for conditional classes.
- **Clean code.** Small, focused components. Descriptive names. No dead code or commented-out blocks.
- **TypeScript strictly.** No `any` types. Define interfaces in `lib/types.ts` for domain models.
- **Imports.** Use `@/` path alias for all imports from `src/`.
- **Exports.** Use named exports for components. Barrel files (`index.ts`) for UI component directories.

## Design Reference

The design spec lives at `soccer-league-management-app/project/Rondo.dc.html`. Key design tokens:

- **Theme:** Dark with green accent (#34e07f)
- **Surfaces:** Base #0b110d, Surface #111a13, Sidebar #0e150f
- **Border radii:** 20px (large), 18px (cards), 11px (buttons), 10px (inputs)
- **Sidebar:** 248px wide, **Header:** 68px tall
