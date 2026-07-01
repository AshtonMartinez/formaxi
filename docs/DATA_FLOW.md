# Data Flow — Connecting Supabase

This document describes how data should flow through the FormaXI app once Supabase is wired up. It covers the server vs client component split, the Supabase client setup, the pattern for replacing mock data, and the priority order for migration.

---

## Server vs Client Components

Next.js App Router distinguishes between React Server Components (RSC), which fetch on the server and render to HTML, and Client Components (`"use client"`), which run in the browser and can use hooks like `useState` and `useEffect`.

### Default: Prefer Server Components

A component is a Server Component by default unless it has `"use client"` at the top. Server Components can `await` Supabase queries directly — no `useEffect`, no loading state management, no client-side fetch. This is the preferred pattern for all read-heavy pages.

### When to use Client Components

Use `"use client"` only when a component needs:
- `useState` or `useReducer` (interactive UI state)
- `useEffect` (browser-only side effects)
- Browser APIs (`window`, `localStorage`, etc.)
- Event listeners beyond standard DOM handlers on server-rendered HTML

In FormaXI, the `DashboardShell`, `Sidebar`, `Header`, and `NavItem` are already client components because they use `usePathname` and `useState`. This is correct and should not change.

### Page-by-Page Breakdown

| Page | Recommended pattern |
|---|---|
| `/standings` | Full RSC — fetch standings, scorers, fixtures on server, render statically |
| `/discover` | RSC for initial data fetch, `"use client"` for format filter (or filter server-side with query params) |
| `/schedule` | RSC shell → pass fixture list as props; `NextMatchDetail` sidebar stays client (RSVP state) |
| `/team` | Client component (tab state via `useState`) — but each tab's content can be RSC sub-components receiving data as props |
| `/profile` | RSC for stats and account details; toggle component stays client |
| `/create` | Full client component (complex multi-step form state) — no server fetch needed until submission |

---

## Supabase Client Setup

Create two client modules. Never use the server client in browser code or vice versa.

### `src/lib/supabase/server.ts`

For Server Components and Server Actions. Uses `@supabase/ssr`'s cookie-based client.

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### `src/lib/supabase/client.ts`

For Client Components. A singleton browser client.

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.

---

## Pattern for Replacing Mock Data

The migration pattern is the same for every page:

**Before (mock data):**
```ts
// standings/page.tsx
const standings: TeamStanding[] = [
  { position: 1, name: "Riverside FC", initials: "RF", … },
  // …
];

export default function StandingsPage() {
  return <StandingsTable data={standings} />;
}
```

**After (Supabase fetch):**
```ts
// standings/page.tsx
import { createClient } from "@/lib/supabase/server";

export default async function StandingsPage() {
  const supabase = createClient();

  const { data: standings } = await supabase
    .from("standings")          // the computed view
    .select("*")
    .eq("season_id", CURRENT_SEASON_ID)
    .order("points", { ascending: false })
    .order("goal_difference", { ascending: false });

  return <StandingsTable data={standings ?? []} />;
}
```

The `StandingsTable` component does not change — it still receives `data: TeamStanding[]` and renders it the same way. Only the page component changes.

**Key rules:**
- Make the page component `async` and `await` the Supabase call directly in the function body.
- Pass fetched data as props to the existing presentational sub-components.
- Do not add `"use client"` to a page just to fetch data — use the server client.
- Keep the same TypeScript types from `src/lib/types.ts` unless the database shape requires additions.

---

## Priority Order

Wire pages up in this order. Each step unblocks the next and builds on the Supabase infrastructure established before it.

### 1. Standings — Read-only, simplest

**Why first:** Pure read, no auth required for public leagues, simplest data shape. Establishes the Supabase client setup and server component fetch pattern.

**What to replace:** The `standings`, `scorers`, and `fixtures` arrays in `src/app/(dashboard)/standings/page.tsx`.

**Data sources:**
- `standings` → query the `standings` view filtered to the current season and division
- `scorers` → query `player_stats` grouped by `user_id` summing goals, JOINed with `users` and `teams`
- `fixtures` → query `fixtures` WHERE `status = 'scheduled'` for the next matchday

**Complication:** `TeamStanding.form` (last 5 results) and `.zone` (promotion/relegation) are not in the standings view. Fetch the last 5 `match_results` per team separately, or add a window-function subquery to the view. `zone` is a UI computation based on the team's final position rank.

**Caching — required for serverless.** The `standings` view runs a full aggregation across `fixtures` and `match_results` on every query. Without caching, every user loading `/standings` triggers this computation. On Vercel, add a `revalidate` export to the page and use tag-based revalidation so the cache is purged the moment a result is submitted:

```ts
// src/app/(dashboard)/standings/page.tsx
export const revalidate = 0; // disable time-based revalidation; rely on tags only

// Tag the fetch so it can be invalidated on demand:
export default async function StandingsPage() {
  const supabase = createClient();
  const { data: standings } = await supabase
    .from("standings")
    .select("*")
    .eq("season_id", CURRENT_SEASON_ID)
    .eq("division_id", CURRENT_DIVISION_ID)
    .order("points", { ascending: false });
    // Next.js fetch cache tag is set via the `next` option on the underlying fetch,
    // or via unstable_cache wrapping the supabase call with { tags: ["standings"] }

  return <StandingsTable data={standings ?? []} />;
}
```

```ts
// In the result submission Server Action, after upserting match_results:
import { revalidateTag } from "next/cache";
revalidateTag("standings"); // invalidates all cached standings fetches immediately
```

This means the standings page is served from Vercel's cache for all users between result submissions — essentially free — and goes stale only for the moment between a result being submitted and the cache being purged (which is near-instant). Without this, each page load costs a full Postgres aggregation query.

---

### 2. Schedule & RSVP — First write operation

**Why second:** Introduces auth (`useUser()` or server-side session check), the RSVP write path, and real-time optimistic updates.

**What to replace:** The `schedule` array in `src/app/(dashboard)/schedule/page.tsx`. The `NextMatchDetail` sidebar becomes the first component to write back to Supabase.

**Data sources:**
- `schedule` → query `fixtures` WHERE the user's team is home or away, ordered by `scheduled_at`
- `NextMatchDetail` sidebar → query `availability` for the next fixture, grouped by status; upsert on RSVP button click

**Write path (RSVP):**
```ts
// Inside NextMatchDetail (client component)
const supabase = createClient(); // browser client
await supabase.from("availability").upsert({
  fixture_id: nextFixture.id,
  user_id: userId,
  status: "available",  // or "out"
});
```

**Complication:** The current sidebar hardcodes Riverside FC. Auth must be established before this step so the user's team can be derived from `team_players`.

---

### 3. Team Management

**What to replace:** `squad`, `teamFixtures`, and `playerStats` arrays in `src/app/(dashboard)/team/page.tsx`.

**Data sources:**
- Squad tab → query `team_players` JOINed with `users`, `availability` for next fixture
- Fixtures tab → query `fixtures` for the team, LEFT JOIN `match_results`
- Stats tab → query `player_stats` for the season, grouped by `user_id`
- Settings tab → reads from and writes to `teams` row

**Pattern note:** The team page uses tab state (`useState`) so it is already a client component. The tab content components (`SquadContent`, `FixturesContent`, etc.) can remain as plain functions that receive props — fetch all tab data at the page level once and pass it down, rather than lazy-fetching per tab.

---

### 4. Create Flows (Mutations)

**What to wire:** The "Launch league" and "Create team" buttons at the end of each wizard.

**League creation** no longer generates fixtures and no longer sends team invites. Launching a league just establishes the empty competition — teams join afterward (apply/approve or organizer invite), and the organizer generates fixtures on demand once teams are present (see *Generate fixtures* below).

**League creation steps:**
1. Insert into `leagues` (no `auto_fixture` column — it has been removed)
2. Insert one row per division into `divisions` (at least one, defaulting to `Division 1`)
3. Insert one `seasons` row with `status = 'upcoming'`
4. Return the new `league_id` (and `season_id`) to the client

This is a cheap three-table write. The serverless-timeout rationale that previously forced league creation to be a batch stored procedure **no longer applies** — the heavy fixture generation has moved to its own action. Keep it as a small RPC (or a `SECURITY DEFINER` function) so the three inserts share one transaction and roll back cleanly together, but a Server Action with sequential inserts is also acceptable here.

**Team creation:**
1. Insert into `teams` (with `division_id`)
2. Insert into `team_players` for the creating user as captain
3. Optionally insert `team_players` rows for invited player emails with `status = 'invited'`

Team creation is simple and can be a Server Action with sequential inserts since it's only 2–3 rows and failure at any step leaves no harmful partial state (a `teams` row with no captain is easily cleaned up).

---

### 4b. Generate fixtures (organizer action)

Fixture generation is a **separate, manual organizer action** — never part of league creation. Once enough teams have joined a division, the organizer presses "Generate fixtures", which calls `supabase.rpc('generate_fixtures', { p_season_id })`.

This is now the heaviest write in the app and the one operation that genuinely needs to be a batch stored procedure for the original reasons:

- **Atomicity.** The wipe-and-rebuild runs in one transaction so a failure can't leave a half-written schedule.
- **Serverless timeout risk.** A 30-team double round-robin generates 870 fixture rows. The function builds them with a single in-database `INSERT … SELECT` per division — orders of magnitude faster than an application loop, and safely within the Vercel timeout.

**Contract** (full definition in `SCHEMA.md`):
- **Regenerate until results exist.** Each press wipes the season's fixtures and rebuilds from the current roster, so teams that joined since the last generation are included. The function raises and makes no changes once any `match_results` row exists for the season — so the UI should disable the button at that point.
- Generation runs **per division**, round-robin over each division's active teams, honoring `leagues.rounds` (single vs. home & away). New fixtures are `status = 'scheduled'` with `scheduled_at = NULL`; kickoff times are assigned later by the smart-scheduling flow.

**Invite emails** (organizer inviting a captain, or a team-creation invite) are sent after the relevant RPC returns successfully, via a Supabase Edge Function or external email service. Email failure should not roll back the database write.

---

### 5. Discover

**What to replace:** The `leagues` array in `src/app/(dashboard)/discover/page.tsx`.

**Data sources:** Query `leagues` WHERE `visibility = 'public'`, with a count of registered teams.

**Filter pattern:** The format filter chips use `useState` and client-side filtering. Keep this approach — fetch all public leagues on the server, pass as props, filter client-side. If the dataset grows large, move filtering to query params and re-fetch on the server.

**Complication:** `LeagueCard.spots` ("2 spots left", "Open", "Waitlist") requires counting active teams against the league's total capacity. `max_teams` lives on `divisions` (not `leagues`) — sum it across all divisions for the league's total capacity, then subtract the count of active teams. Compute this in the query or the UI:

```sql
-- Total capacity and current team count per league, for the discover listing:
select
  l.id,
  sum(d.max_teams)                                   as total_capacity,
  count(t.id)                                        as team_count,
  sum(d.max_teams) - count(t.id)                     as spots_remaining
from public.leagues    l
join public.divisions  d on d.league_id = l.id
left join public.teams t on t.division_id = d.id
where l.visibility = 'public'
group by l.id;
```

**Joining a league** goes through the generalized `league_applications` table in either direction: a user applying via the Discover "Join" button (`kind = 'application'`), or an organizer inviting a captain (`kind = 'invitation'`). Both resolve through the same accept→create-team path — a `teams` row is created only on acceptance. See the `league_applications` table in `SCHEMA.md`.

---

## Auth Middleware

Once auth is in place, add a Next.js middleware file (`src/middleware.ts`) to:
- Refresh the Supabase session on every request
- Redirect unauthenticated users to a login page for protected routes

All dashboard routes under `(dashboard)/` should require auth. The `/discover` page can be public (read-only for unauthenticated users) if desired — match whatever the product decision is.

---

## Error and Loading States

Server Components do not have loading states in the traditional sense — use Next.js `loading.tsx` files (placed alongside each `page.tsx`) to show a skeleton while the page streams. For client-side mutations (RSVP, result submission), use local `useState` for optimistic updates and roll back on error.

Do not add complex global loading/error infrastructure until it is needed. A `loading.tsx` with a simple skeleton placeholder per route is sufficient for MVP.
