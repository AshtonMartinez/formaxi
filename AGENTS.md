<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Agent Guidelines — FormaXI

## Tech Stack

| Technology | Version / Notes |
|---|---|
| Next.js | 16 — App Router only. Do not touch the Pages Router. |
| React | 19 |
| TypeScript | 5 — strict mode, no `any` |
| Tailwind CSS | v4 — CSS variable–based (see below). No `tailwind.config.ts` exists or should be created. |
| Package manager | pnpm — always use `pnpm add`, never `npm install` |
| Backend | Supabase — **not yet wired up**. No Supabase client exists in the codebase. |

---

## Tailwind v4 — CSS Variable Architecture

Tailwind v4 is configured **entirely through CSS variables** in `src/app/globals.css`. There is no `tailwind.config.ts`.

```css
/* globals.css */
@import "tailwindcss";

@theme inline {
  --color-accent: #34e07f;
  --color-surface: #111a13;
  /* … */
}
```

Tailwind reads `@theme inline {}` and generates utility classes directly from these variables (`bg-accent`, `text-surface`, `border-accent`, etc.).

**Rules for agents:**
- **Never hardcode hex colors** in className strings. Use the token utilities (`text-accent`, `bg-surface`, `border-border`, etc.).
- **Never add new color values** outside `@theme inline {}` in `globals.css`. If a new color is needed, add it as a named token there first.
- The PostCSS plugin is `@tailwindcss/postcss` (not `tailwindcss`). This is configured in `postcss.config.mjs`.
- Tailwind v4 `@layer base` rules run *inside* the cascade — do not write unlayered reset styles.

---

## Design System

The app uses a **dark-green aesthetic**. Every surface token is a deep dark green. There are no light backgrounds anywhere in the app. This is intentional and must not be changed.

### Color Tokens (from `src/app/globals.css`)

**Backgrounds (darkest to lightest):**
- `bg-base` (`#0b110d`) — page background
- `bg-sidebar` (`#0e150f`) — sidebar background
- `bg-input` (`#0d140f`) — form input background
- `bg-surface` (`#111a13`) — default card background
- `bg-surface-alt` (`#131c15`) — secondary card, filter chip background
- `bg-elevated` (`#161f18`) — hover and elevated state

**Borders (all translucent white):**
- `border-border` (`rgba(255,255,255,0.07)`) — default
- `border-border-subtle` (`rgba(255,255,255,0.06)`)
- `border-border-muted` (`rgba(255,255,255,0.045)`) — table row dividers
- `border-border-strong` (`rgba(255,255,255,0.12)`) — emphasis

**Text hierarchy (brightest to dimmest):**
- `text-primary` (`#eef2ee`) — main body text
- `text-heading` (`#cfd8d1`) — slightly dimmer heading text
- `text-secondary` (`#9aa89e`) — secondary labels
- `text-muted` (`#8c9a90`) — muted text, placeholders
- `text-dim` (`#5f6d63`) — very dim labels, column headers
- `text-dark` (`#4f5b52`) — darkest visible text, section separators

**Accent:**
- `text-accent` / `bg-accent` / `border-accent` → `#34e07f` (bright green)
- `text-accent-dark` / `bg-accent-dark` → `#1f9a52` (darker green)
- `text-accent-darker` / `bg-accent-darker` → `#06160c` (text color on accent backgrounds)

**Status:**
- `text-win` / `bg-win` → `#34e07f` (same as accent)
- `text-draw` / `bg-draw` → `#d9a925` (gold)
- `text-loss` / `bg-loss` → `#e0463d` (red)
- `text-orange` → `#ff8a5f`

### Typography

- **Headings:** Archivo — always add the `font-heading` Tailwind utility class. Pair with `font-black` or `font-extrabold`. Often use negative tracking (`tracking-[-0.5px]`).
- **Body:** Hanken Grotesk — applied globally in `body {}`. Do not add `font-body` explicitly unless you need to override a heading inside a body context.
- **Font sizes:** The codebase uses fractional sizes (`text-[13.5px]`, `text-[11px]`, etc.). Match the existing visual density rather than rounding to standard Tailwind sizes.

---

## Component Conventions

### UI Primitives — `src/components/ui/`

All primitive components are exported via `src/components/ui/index.ts`. Always import from the barrel:

```ts
import { Card, Badge, Button, Avatar } from "@/components/ui";
```

Never import from the individual files directly.

**`Card`** — `variant?: "default" | "gradient" | "accent"`, `padding?: "default" | "compact" | "none"` + all `<div>` props.
- `default`: `bg-surface border border-border rounded-2xl`
- `gradient`: `bg-gradient-to-r from-surface-alt to-surface`
- `accent`: dark green gradient with accent border — used for highlighted sidebars (e.g. Next Match card)

**`CardTitle`** — `<h2>` with `font-heading font-extrabold text-[15px]`. Accepts all heading props + `className`.

**`CardHeader`** — flex row `justify-between mb-3.5`. Wrap `CardTitle` + action inside this.

**`Badge`** — `variant?: "green" | "red" | "yellow" | "orange" | "neutral"`, `size?: "sm" | "md"`.

**`Avatar`** — `initials: string`, `color: string` (hex for background), `size?: "xs" | "sm" | "md" | "lg" | "xl"`, `shape?: "circle" | "rounded"` (default `"rounded"`). Text is always white.

**`Button`** — `variant?: "primary" | "secondary" | "ghost" | "accent-soft"`, `size?: "sm" | "md" | "lg"`.
- `primary`: solid `bg-accent text-accent-darker` with glow shadow
- `secondary`: translucent white background
- `ghost`: transparent, muted text
- `accent-soft`: translucent accent bg, becomes solid on hover

**`FormPill`** — `result: "W" | "D" | "L"`. 18×18 px colored square showing match outcome.

**`FormSequence`** — `results: FormResult[]`. Renders a row of `FormPill` components.

**`StatCard`** — `value: string | number`, `label: string`, `valueColor?: string`. Bordered card with a large number. Used on the profile page for career stats.

**`StatInline`** — `value: string | number`, `label: string`, `valueColor?: string`. No border — used inside hero sections for inline statistics.

**`SearchInput`** — `placeholder?: string`. Includes a `SearchIcon` prefix. Collapses on mobile (`hidden md:flex`).

### Layout Components — `src/components/layout/`

Exported via `src/components/layout/index.ts`.

**`DashboardShell`** — Client component. Manages the mobile sidebar open/close state. Renders `Sidebar` + `Header` + `<main>` with `{children}`. Every page inside `(dashboard)/` is wrapped by this via the layout file.

**`Sidebar`** — `open?: boolean`, `onClose?: () => void`. 248px wide. Fixed + backdrop overlay on mobile; sticky + always visible on desktop (`lg:`). Contains the FormaXI logo, grouped nav sections (Compete / Manage), a Create CTA button, and a user profile link at the bottom.

**`Header`** — `onMenuClick?: () => void`. Sticky 68px top bar. Shows the current page title (resolved from pathname), a search input (hidden on mobile), and a notifications bell.

**`NavItem`** — `href: string`, `label: string`, `icon: React.ReactNode`. Active state uses `usePathname()`. Active item gets `bg-accent/[0.10] text-accent` background and a 3px left accent bar.

### Icons — `src/components/icons/index.tsx`

All icons are inline SVGs built with a `makeIcon()` factory. Exported: `StandingsIcon`, `DiscoverIcon`, `ScheduleIcon`, `TeamIcon`, `ProfileIcon`, `SearchIcon`, `BellIcon`, `PlusIcon`, `MenuIcon`, `CloseIcon`.

All accept `size?: number` (default 18) and all standard SVG props.

---

## Routing

All main pages live under `src/app/(dashboard)/`. The `(dashboard)` segment is an App Router **route group** — it does not appear in the URL.

Both `src/app/page.tsx` and `src/app/(dashboard)/page.tsx` redirect to `/standings` via `redirect()`.

| URL | Page file |
|---|---|
| `/standings` | `src/app/(dashboard)/standings/page.tsx` |
| `/discover` | `src/app/(dashboard)/discover/page.tsx` |
| `/schedule` | `src/app/(dashboard)/schedule/page.tsx` |
| `/team` | `src/app/(dashboard)/team/page.tsx` |
| `/profile` | `src/app/(dashboard)/profile/page.tsx` |
| `/create` | `src/app/(dashboard)/create/page.tsx` |

**Do not use the Pages Router.** Do not create files in `src/pages/`.

---

## Current Data State — All Mock, No Supabase

Every page file contains static mock data as inline TypeScript arrays at the top of the file. There are **zero Supabase client calls** anywhere in the codebase. `@supabase/supabase-js` is not installed.

**Pattern to follow when connecting real data:**
1. Install `@supabase/supabase-js` and `@supabase/ssr` via pnpm.
2. Create `src/lib/supabase/server.ts` (server client) and `src/lib/supabase/client.ts` (browser client).
3. In each page file, locate the inline mock array (always near the top of the file).
4. Convert the page component to `async` and replace the mock array with a Supabase fetch.
5. Pass the data down as props to the existing presentational sub-components (which do not need to change).
6. Use the same TypeScript types from `src/lib/types.ts`.

See `docs/DATA_FLOW.md` for per-page migration details and priority order.

---

## TypeScript Types

All shared domain types live in `src/lib/types.ts`. **Do not create new type files.** Extend `src/lib/types.ts` if you need new types.

Current types: `FormResult`, `TeamStanding`, `TopScorer`, `Fixture`, `ScheduleMatch`, `Player`, `LeagueCard`, `NavItem`.

Note: some types (e.g. `LeagueCard.tagColor`, `ScheduleMatch.statusVariant`) are UI display concerns that will not map 1:1 to database columns. See `docs/SCHEMA.md` for the gap analysis.

---

## What NOT To Do

- **Don't hardcode hex colors** in classNames. Use design system token utilities.
- **Don't add new color values** outside `@theme inline {}` in `globals.css`.
- **Don't install new UI libraries** (shadcn, Radix, Mantine, etc.) without explicit instruction.
- **Don't use the Pages Router.** All routing is App Router.
- **Don't create new type files.** Extend `src/lib/types.ts`.
- **Don't import from component sub-files directly.** Use barrel `index.ts` exports.
- **Don't build new features** before the existing UI is wired to real data.
- **Don't write light-mode styles or light backgrounds.** The app is dark-only.
- **Don't use `npm` or `yarn`.** Always use `pnpm`.

---

## MVP Priority

The current priority is **wiring the existing UI to live Supabase data** — not adding features. In order:

1. **Standings** — read-only, simplest data shape. Wire up first.
2. **Schedule + RSVP** — first write operation (availability table).
3. **Team management** — roster, fixtures, stats.
4. **Create flows** — league and team creation mutations.
5. **Discover** — public league listing with filters.

See `docs/MVP.md` for the full feature scope and `docs/SCHEMA.md` for the database schema.
