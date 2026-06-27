# FormaXI

A platform for organizing football at every level — from a six-person kickabout in a park to a full 11-a-side city league with promotion and relegation. The app makes it frictionless to start a league and gives those leagues a path to grow into something bigger.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (CSS variable–based, no config file) |
| UI Fonts | Archivo (headings), Hanken Grotesk (body) via `next/font/google` |
| Utilities | `clsx` + `tailwind-merge` (via `src/lib/utils.ts` `cn()`) |
| Package manager | pnpm |
| Backend (planned) | Supabase — not yet wired up |

The backend layer (Supabase auth, database, and RLS) is architecturally planned but **zero queries exist in the codebase today**. All page data is static mock data defined inline in each page file.

---

## Running Locally

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

The app runs at `http://localhost:3000`. The root redirects immediately to `/standings`.

---

## Route Structure

All main pages live under `src/app/(dashboard)/` and share the `DashboardShell` layout (sidebar + header).

| Route | File | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Redirects to `/standings` |
| `/standings` | `src/app/(dashboard)/standings/page.tsx` | League table, top scorers, next fixtures |
| `/discover` | `src/app/(dashboard)/discover/page.tsx` | Browseable public league directory with format filters |
| `/schedule` | `src/app/(dashboard)/schedule/page.tsx` | Player's match calendar (list + grid views) with RSVP sidebar |
| `/team` | `src/app/(dashboard)/team/page.tsx` | Team management (Squad / Fixtures / Stats / Settings tabs) |
| `/profile` | `src/app/(dashboard)/profile/page.tsx` | Player profile with career stats and team memberships |
| `/create` | `src/app/(dashboard)/create/page.tsx` | Guided wizard for creating a league or a team |

The sidebar groups routes into two sections: **Compete** (Standings, Discover, Schedule) and **Manage** (My Team, Profile). The **Create** button is pinned at the bottom of the sidebar.

---

## Project Layout

```
src/
  app/
    (dashboard)/       # App Router route group — all main pages
    globals.css        # Tailwind v4 @theme tokens + base styles
    layout.tsx         # Root layout (fonts, metadata)
    page.tsx           # Root redirect → /standings
  components/
    ui/                # Primitive UI components (Card, Badge, Button, …)
    layout/            # Shell components (Sidebar, Header, DashboardShell)
    icons/             # Inline SVG icon components
  lib/
    types.ts           # All shared TypeScript domain types
    utils.ts           # cn() helper (clsx + tailwind-merge)
```

---

## Design System

The design system is entirely CSS variable–based and lives in `src/app/globals.css`. Tailwind v4 reads those variables via `@theme inline {}` — there is no `tailwind.config.ts`.

Key characteristics:

- **Dark-green aesthetic** — all surfaces use deep dark-green tones; there are no light backgrounds anywhere in the app.
- **Accent color** — `#34e07f` (mapped to `--color-accent` / `bg-accent` / `text-accent`).
- **Two fonts** — Archivo for all headings (`font-heading` utility class), Hanken Grotesk for all body text (default).
- **Status colors** — win (`#34e07f`), draw (`#d9a925`), loss (`#e0463d`), orange (`#ff8a5f`).

See `docs/DESIGN_SYSTEM.md` for the full token reference and component catalogue.

---

## Further Reading

- `PRODUCT.md` — full product vision, user types, scale tiers, and roadmap
- `AGENTS.md` — guidelines for AI coding agents working on this codebase
- `docs/MVP.md` — agreed MVP feature scope
- `docs/SCHEMA.md` — intended Supabase data schema (SQL DDL + RLS intentions)
- `docs/DATA_FLOW.md` — how data should flow once Supabase is wired up
- `docs/DESIGN_SYSTEM.md` — design tokens, typography, and component API reference
