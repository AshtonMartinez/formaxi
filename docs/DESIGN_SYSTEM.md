# Design System — FormaXI

FormaXI uses a **dark-green aesthetic** with a consistent set of CSS variable tokens, two typefaces, and a small library of primitive UI components. This document is the authoritative reference for producing consistent UI.

---

## Aesthetic Principles

- **Always dark.** Every surface is a dark green-black tone. There are no light-mode styles, no white backgrounds, and no light surfaces anywhere in the app.
- **Accent green is the only bright color.** `#34e07f` is used for active states, CTAs, win indicators, and highlights. Everything else is desaturated.
- **Tight, dense UI.** Font sizes skew small (`13–14px` body, `11px` labels). Cards have modest padding. The visual language is data-dense, not airy.
- **Headings feel punchy.** Archivo Black/ExtraBold with negative letter-spacing for all headings and numeric values.

---

## Color Tokens

All tokens are defined in `src/app/globals.css` inside `@theme inline {}`. Tailwind v4 generates utility classes directly from these variables.

### Background Tokens

| CSS variable | Tailwind utility | Hex value | Intended use |
|---|---|---|---|
| `--color-base` | `bg-base` | `#0b110d` | Page background — the darkest surface |
| `--color-sidebar` | `bg-sidebar` | `#0e150f` | Sidebar background |
| `--color-input` | `bg-input` | `#0d140f` | Form input background |
| `--color-surface` | `bg-surface` | `#111a13` | Default card background |
| `--color-surface-alt` | `bg-surface-alt` | `#131c15` | Secondary cards, filter chips, dropdown menus |
| `--color-elevated` | `bg-elevated` | `#161f18` | Hover and elevated states |

The progression from base → elevated moves from darkest to lightest. Never use a lighter background than `bg-elevated` for any surface.

### Border Tokens

All borders use translucent white. This gives a soft edge on the dark backgrounds without using a hardcoded dark color.

| CSS variable | Tailwind utility | Value | Intended use |
|---|---|---|---|
| `--color-border-muted` | `border-border-muted` | `rgba(255,255,255,0.045)` | Table row dividers, subtle separators |
| `--color-border-subtle` | `border-border-subtle` | `rgba(255,255,255,0.06)` | Very light separators |
| `--color-border` | `border-border` | `rgba(255,255,255,0.07)` | Default card borders |
| `--color-border-strong` | `border-border-strong` | `rgba(255,255,255,0.12)` | Emphasized borders, hover states |

### Text Tokens

| CSS variable | Tailwind utility | Hex value | Intended use |
|---|---|---|---|
| `--color-primary` | `text-primary` | `#eef2ee` | Default body text |
| `--color-heading` | `text-heading` | `#cfd8d1` | Slightly softer heading text, position numbers |
| `--color-secondary` | `text-secondary` | `#9aa89e` | Secondary labels, stat values in tables |
| `--color-muted` | `text-muted` | `#8c9a90` | Muted labels, placeholders, help text |
| `--color-dim` | `text-dim` | `#5f6d63` | Column headers, very dim metadata |
| `--color-dark` | `text-dark` | `#4f5b52` | Section separator labels in sidebar |

### Accent Tokens

| CSS variable | Tailwind utility | Hex value | Intended use |
|---|---|---|---|
| `--color-accent` | `text-accent` / `bg-accent` / `border-accent` | `#34e07f` | CTAs, active nav, win indicator, RSVP highlight |
| `--color-accent-dark` | `text-accent-dark` / `bg-accent-dark` | `#1f9a52` | Gradient endpoint, crest color for Riverside FC mock data |
| `--color-accent-darker` | `text-accent-darker` / `bg-accent-darker` | `#06160c` | Text color on top of `bg-accent` backgrounds |

### Status Tokens

| CSS variable | Tailwind utility | Hex value | Intended use |
|---|---|---|---|
| `--color-win` | `text-win` / `bg-win` | `#34e07f` | Match win result — same value as accent |
| `--color-draw` | `text-draw` / `bg-draw` | `#d9a925` | Match draw result — gold |
| `--color-loss` | `text-loss` / `bg-loss` | `#e0463d` | Match loss result, danger zone, out status |
| `--color-orange` | `text-orange` | `#ff8a5f` | Captain badge, orange highlight |

---

## Typography

### Fonts

Both fonts are loaded via `next/font/google` in `src/app/layout.tsx` and injected as CSS variables:

```
Archivo     → --font-heading  (weights: 400, 500, 600, 700, 800, 900)
Hanken Grotesk → --font-body  (weights: 400, 500, 600, 700)
```

### Usage Rules

**Headings — Archivo**

- Always add `font-heading` to activate Archivo.
- Always pair with `font-black` (weight 900) or `font-extrabold` (weight 800). Never use Archivo at regular weight.
- Use negative tracking on larger headings: `tracking-[-0.5px]` at 24px, `tracking-[-0.6px]` at 28px+.
- Use for: page titles, card titles (`CardTitle`), position numbers in tables, large stat values (`StatCard`, `StatInline`), point values in standings.

```tsx
<h1 className="font-heading font-black text-[26px] tracking-[-0.5px]">
  Sunday City League
</h1>
```

**Body — Hanken Grotesk**

- The default global font. You do not need to add `font-body` unless you are overriding a heading context.
- Use `font-semibold` (600) for labels and table cell values.
- Use `font-bold` (700) for important values that are not heading-sized.

### Type Scale Reference (as used in the codebase)

| Context | Size | Weight | Class pattern |
|---|---|---|---|
| Page title | 24–28px | Black | `font-heading font-black text-2xl tracking-[-0.5px]` |
| Card title (`CardTitle`) | 15px | ExtraBold | `font-heading font-extrabold text-[15px]` |
| Large stat value | 26–28px | Black / ExtraBold | `font-heading font-black text-[28px]` |
| Table position number | 14px | Bold | `font-heading font-bold text-sm` |
| Table points value | 15px | ExtraBold | `font-heading font-extrabold text-[15px]` |
| Body label | 13–14px | SemiBold | `font-semibold text-[13px]` |
| Secondary label | 11–12px | SemiBold/Bold | `text-[11px] font-bold text-dim` |
| Column headers | 11px | Bold + tracked | `text-[11px] tracking-[0.5px] font-bold uppercase text-dim` |

---

## Component Library

### `Card`

The primary container for all content sections.

```tsx
import { Card } from "@/components/ui";

// default: bg-surface, default padding
<Card>…</Card>

// gradient: from surface-alt to surface
<Card variant="gradient">…</Card>

// accent: dark green gradient with accent border — Next Match sidebar
<Card variant="accent">…</Card>

// no padding — for tables that need edge-to-edge rows
<Card padding="none">…</Card>

// compact padding (p-4 instead of p-5)
<Card padding="compact">…</Card>
```

**Border radius:** `rounded-2xl` (16px)

### `CardTitle`

```tsx
import { CardTitle } from "@/components/ui";

<CardTitle>League Table</CardTitle>
<CardTitle className="text-base mb-4">Team Details</CardTitle>
```

Renders an `<h2>` with `font-heading font-extrabold text-[15px]`. Pass `className` to override size or add margin.

### `CardHeader`

```tsx
import { CardHeader, CardTitle } from "@/components/ui";

<CardHeader>
  <CardTitle>Top Scorers</CardTitle>
  <Button variant="accent-soft" size="sm">View all</Button>
</CardHeader>
```

Flex row, `justify-between`, `mb-3.5`. Use when the card header needs a title + action.

### `Badge`

```tsx
import { Badge } from "@/components/ui";

<Badge variant="green">Division 1</Badge>   // accent green — default
<Badge variant="red">Suspended</Badge>       // loss red
<Badge variant="yellow">Draw</Badge>         // draw gold
<Badge variant="orange">Captain</Badge>      // orange
<Badge variant="neutral">Invited</Badge>     // neutral white

<Badge size="md">…</Badge>                  // px-3 py-1 text-xs (slightly larger)
```

### `Avatar`

Displays team crests and player initials. Background color is set via the `color` prop (hex string).

```tsx
import { Avatar } from "@/components/ui";

<Avatar initials="RF" color="#1f9a52" size="sm" />
<Avatar initials="SR" color="#3b82f6" size="md" shape="circle" />
```

| Size | Dimensions | Border radius | Text size |
|---|---|---|---|
| `xs` | 18×18px | 5px | 9px |
| `sm` | 28×28px | 8px (rounded-lg) | 11px |
| `md` | 40×40px | 12px (rounded-xl) | 14px |
| `lg` | 52×52px | 14px | 16px |
| `xl` | 68×68px | 16px (rounded-2xl) | 22px |

`shape="circle"` overrides the border radius to `rounded-full` regardless of size.

Text is always white (`text-white`) regardless of background color.

### `Button`

```tsx
import { Button } from "@/components/ui";

// Primary — solid accent green with glow shadow (main CTA)
<Button variant="primary">Launch league</Button>

// Secondary — translucent white (cancel, back, edit)
<Button variant="secondary">← Back</Button>

// Ghost — transparent, muted text (low-priority actions)
<Button variant="ghost">Can't play</Button>

// Accent soft — translucent green, becomes solid on hover
<Button variant="accent-soft" size="sm">+ Invite player</Button>

// Sizes: sm (px-3.5 py-2 text-[13px]), md (px-5 py-3 text-sm), lg (full-width + same padding as md)
<Button size="lg">Continue</Button>
```

**Border radius:** `rounded-[11px]`

### `FormPill` and `FormSequence`

Visual indicators for match results in the form guide.

```tsx
import { FormPill, FormSequence } from "@/components/ui";
import type { FormResult } from "@/lib/types";

<FormPill result="W" />   // green square
<FormPill result="D" />   // gold square
<FormPill result="L" />   // red square

<FormSequence results={["W","W","D","W","W"]} />
```

`FormPill` renders an 18×18px rounded square (`rounded-[5px]`) with a 1-letter label in `text-accent-darker`. Used in the standings table and team stats.

### `StatCard`

A bordered card showing a single large metric. Used on the profile page.

```tsx
import { StatCard } from "@/components/ui";

<StatCard value={47} label="Matches" />
<StatCard value={18} label="Goals" valueColor="#34e07f" />
<StatCard value="64%" label="Win rate" />
```

**Style:** `bg-surface border border-border rounded-[14px] p-[18px]`. Value uses `font-heading font-black text-[28px]`.

### `StatInline`

An unbordered stat for use inside hero sections and banners.

```tsx
import { StatInline } from "@/components/ui";

<StatInline value={10} label="Teams" valueColor="#34e07f" />
<StatInline value={87} label="Played" />
```

**Style:** Centered, no border. Value uses `font-heading font-extrabold text-[26px]`. Label uses `text-[11px] uppercase tracking-[0.6px] font-semibold text-dim`.

### `SearchInput`

```tsx
import { SearchInput } from "@/components/ui";

<SearchInput placeholder="Search teams, players…" />
```

Renders a `<label>` wrapping a `SearchIcon` + `<input>`. Width is `w-full` on mobile, `lg:w-[260px]` on desktop. Background is `bg-surface-alt`.

---

## Spacing and Border Radius Conventions

### Card border radii

| Element | Border radius | Tailwind class |
|---|---|---|
| Page-level hero banners | 20px | `rounded-[20px]` |
| Standard cards | 16px | `rounded-2xl` |
| Preview sidebars | 18px | `rounded-[18px]` |
| Stat cards | 14px | `rounded-[14px]` |
| Match row items | 14px | `rounded-[14px]` |
| Input fields | 10px | `rounded-[10px]` |
| Buttons | 11px | `rounded-[11px]` |
| Badge/pill tags | full | `rounded-full` |
| Form pill (W/D/L) | 5px | `rounded-[5px]` |
| Avatar — default shape | varies by size | (see Avatar table above) |
| Crest color swatches | 10px | `rounded-[10px]` |

### Default card padding

- `padding="default"` → `p-5` (20px)
- `padding="compact"` → `p-4` (16px)

### Table row padding

Rows in standings, squad, and fixture tables use `py-[11px] px-5` with `border-t border-border-muted` dividers.

### Content max-widths

- Most pages: `max-w-7xl` (1280px)
- Profile page: `max-w-6xl` (1152px)
- Create page: `max-w-5xl` (1024px)

### Main content padding

Set in `DashboardShell`: `px-4 py-6 sm:px-6 lg:px-8 lg:pb-12`.

---

## Page Layout Patterns

### Two-column layout (main content + sidebar)

Used on standings, schedule, team squad/stats, and create pages:

```tsx
<div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
  <MainContent />
  <Sidebar />
</div>
```

The sidebar column width varies by page: `340px` (standings), `360px` (schedule), `300px` (team), `318px` (create).

Sidebars use `sticky top-[88px]` to keep them in view while scrolling (88px accounts for the 68px header + 20px gap).

### Hero banners

Full-width banners at the top of standings and team pages use:
- `rounded-[20px]`
- Background: `bg-gradient-to-r from-[#10301d] to-[#0f1b13]` (or similar dark green gradient)
- Optional grid pattern overlay using `repeating-linear-gradient` at very low opacity

---

## Scrollbar Styling

The app defines a custom dark scrollbar globally in `globals.css`:

```css
::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-thumb { background: #26342b; border-radius: 8px; border: 2px solid var(--color-base); }
::-webkit-scrollbar-track { background: transparent; }
```

This matches the dark aesthetic. Do not override it per-component.
