# Smart Match Scheduling — Implementation Plan

This document plans the implementation of FormaXI's smart scheduling feature (MVP §6) on the project's stack (Next.js 16 App Router, React 19, Supabase, Vercel). It builds on the data layer already specified in `docs/SCHEMA.md` (the `get_squad_availability` fetch, the `recurring_blockers` / `oneoff_blockers` / `availability` tables) and turns the prose "scheduling engine" section into a concrete, buildable design.

## Goal

When an organizer (or a team captain) needs to set a kickoff time for a fixture, the app proposes **ranked time slots scored by how many players from both squads are free**, based on each player's availability blockers. The organizer picks a slot or overrides with a custom time. This is a **scheduling aid, not an automated scheduler** — the organizer always makes the final call.

A fixture starts life with `scheduled_at = NULL` (created by `generate_fixtures`). Smart scheduling is how that null becomes a real time.

---

## Where it fits

**Current state (from `docs/SCHEMA.md`):**
- ✅ Blocker tables, indexes, RLS — fully specified.
- ✅ Per-fixture `availability` (RSVP) + the "pre-populate `out` from blockers" behavior — specified.
- ✅ `get_squad_availability(home_team_id, away_team_id)` single-query fetch — specified (avoids the serverless N+1).
- ⚠️ The scoring/suggestion logic — prose only. **This plan covers that gap.**

**Dependencies (must exist first):**
1. **Blocker data** — a blockers editor on `/profile` so players actually have `recurring_blockers` / `oneoff_blockers` rows. Without data, every slot scores 100% and the feature is pointless. *(Prerequisite; see "Prerequisite: blockers editor" below.)*
2. **Generated fixtures** with assigned teams (`home_team_id` / `away_team_id`) and `scheduled_at = NULL` — already produced by `generate_fixtures`.
3. **Structured league match days** — see the schema change below.

**Roadmap placement:** Phase 2 territory (`PRODUCT.md`), immediately after RSVP write-back. Sequencing: blockers editor → `get_squad_availability` RPC → suggest route → suggestion UI → on-select write path.

---

## Schema change: structured match days

**Problem.** `leagues.day_of_week` is free text (`'Sundays'`, `'Sat & Sun'`) and the Create wizard collects an array of abbreviations (`days: ["Sun"]`). Neither is usable for slot generation, which needs structured weekdays plus a time window and a timezone.

**Fix (consistent with `recurring_blockers.days`).** Add structured columns to `leagues`:

```sql
alter table public.leagues
  add column match_days        smallint[]  not null default '{7}',   -- ISO weekdays, 1=Mon … 7=Sun (matches recurring_blockers.days)
  add column slot_start        time        not null default '10:00', -- earliest kickoff
  add column slot_end          time        not null default '14:00', -- latest kickoff
  add column slot_step_minutes smallint    not null default 60,      -- kickoff granularity
  add column timezone          text        not null default 'Europe/London';
```

- `match_days` mirrors the blockers' `smallint[]` ISO-weekday representation — one consistent encoding across the schema.
- Keep `day_of_week text` as the human-readable display string for `/discover` cards (derive it from `match_days`, or keep both — `day_of_week` is presentation, `match_days` is logic).
- The Create wizard's Structure step already collects match days as chips; map those chips to `match_days` on launch (and to a `day_of_week` display string).
- **Timezone.** Blockers store `time without time zone` in the player's local wall clock; for an amateur local league we assume one league timezone. All candidate slots are generated and compared in `leagues.timezone`. Per-player timezones are out of scope for MVP (note it as a known limitation).

---

## Algorithm

Pure function, runs server-side after the single fetch. No per-player DB calls.

**1. Build candidate slots.** From `leagues.match_days` × kickoff times stepped from `slot_start` to `slot_end` by `slot_step_minutes`, across the next **N weeks** (default 6) starting tomorrow, in `leagues.timezone`. Skip any slot in the past.

**2. Build the blocker map.** Group `get_squad_availability` rows by `user_id` into `{ recurring: {days, start, end}[], oneoff: {start, end}[], teamId }`. (A player with two blockers appears in two rows; the season-level `team_players.availability = 'out'` players are excluded up front — they're unavailable regardless of slot.)

**3. Score each slot.** A player is **blocked** for a slot if:
- the slot's ISO weekday ∈ a recurring blocker's `days` **and** the slot's local time falls within `[time_start, time_end)`; or
- the slot's date ∈ any one-off blocker's `[date_start, date_end]` (inclusive, date-only).

Otherwise the player is **free**. Per slot, compute `homeFree/homeTotal` and `awayFree/awayTotal`, then:

```
score = (homeFree + awayFree) / (homeTotal + awayTotal)   // squads weighted equally
```

**4. Rank.** Sort by `score` desc, then `homeFree+awayFree` desc, then earliest datetime (deterministic). Return the top **K** (default 5).

**Edge cases:** no blockers → everyone free (score 1.0); empty squad → exclude from denominator to avoid divide-by-zero; (v2) optionally drop slots where either team already has another fixture scheduled at that time.

---

## Privacy (RLS-consistent)

`docs/SCHEMA.md` RLS states individual blocker rows are **never** exposed to other users — only aggregate impact. Therefore:

- `get_squad_availability` runs as a `SECURITY DEFINER` RPC (or is called by a server-only Supabase client with the service role), so the **raw blocker rows never reach the browser**.
- The route returns **counts only** (`homeFree`, `homeTotal`, …) — never player names or which blocker conflicted.
- The route authorizes the caller: must be the league organizer **or** the captain of the home/away team for the given fixture.

---

## API contract — `POST /api/schedule/suggest`

A Next.js 16 **Route Handler** (`src/app/api/schedule/suggest/route.ts`), consistent with the decision already recorded in `SCHEMA.md`. (A Server Action is a valid alternative, but a route keeps the heavy, server-only logic and the service-role client cleanly isolated.)

**Request:**
```ts
{ fixtureId: string; weeks?: number; limit?: number }
```
The handler loads the fixture to derive `home_team_id`, `away_team_id`, `league_id`, and the league's slot config — the client never passes team ids directly (prevents probing other leagues' availability).

**Response (counts only):**
```ts
// add to src/lib/types.ts (do not create a new types file)
export interface ScheduleSuggestion {
  /** ISO 8601 kickoff in the league timezone, e.g. "2026-07-05T10:00:00+01:00" */
  slot: string;
  homeFree: number;
  homeTotal: number;
  awayFree: number;
  awayTotal: number;
  /** 0–1, squads weighted equally */
  score: number;
}
```

**Handler shape:**
```ts
export async function POST(req: Request) {
  // 1. auth: supabase.auth.getUser(); 401 if anon
  // 2. load fixture + league config; 404 if missing
  // 3. authorize: organizer OR captain of home/away; 403 otherwise
  // 4. const { data } = await admin.rpc("get_squad_availability", { home_team_id, away_team_id })
  // 5. suggestions = scoreSlots(data, leagueConfig, { weeks, limit })  // pure fn, unit-testable
  // 6. return Response.json(suggestions)
}
```

**Serverless budget:** one DB round-trip (the RPC) + in-memory scoring. Comfortably within the 10s Hobby timeout regardless of squad size — the whole point of the single-query design. No caching (blocker data read fresh each open).

---

## On select — write path

Picking a slot must set the time **and** apply the blocker→RSVP pre-population that `SCHEMA.md` describes, atomically. Mirror the `generate_fixtures` pattern with a dedicated RPC:

```sql
create or replace function public.schedule_fixture(
  p_fixture_id  uuid,
  p_scheduled_at timestamptz
) returns void
language plpgsql
as $$
begin
  update public.fixtures set scheduled_at = p_scheduled_at where id = p_fixture_id;

  -- Pre-populate availability = 'out' for players whose blockers cover this time.
  -- (Players may override later via RSVP — blockers are hints, not locks.)
  insert into public.availability (fixture_id, user_id, status)
  select p_fixture_id, tp.user_id, 'out'
  from   public.team_players tp
  join   public.fixtures f on f.id = p_fixture_id
  where  tp.team_id in (f.home_team_id, f.away_team_id)
    and  tp.status = 'active'
    and  player_is_blocked(tp.user_id, p_scheduled_at)   -- helper mirroring the scoring rule
  on conflict (fixture_id, user_id) do nothing;
end;
$$;
```

Called from the client after the organizer confirms: `await supabase.rpc("schedule_fixture", { p_fixture_id, p_scheduled_at })`. Squad notifications (email/push) are Phase 2 and fire after this returns — out of scope here.

---

## UI integration

Organizer/captain context only — this is not the player-facing `/schedule` page.

- **Entry point:** a "Suggest times" / "Set kickoff" action on each unscheduled fixture, in the **organizer console** (`/manage`, where `generate_fixtures` lives) and/or the **`/team` → Fixtures** tab for captains.
- **Suggestion modal:** reuse the existing `Modal` primitive. List the ranked `ScheduleSuggestion[]`: each row shows the date/time and a per-squad availability bar (reuse the confirmed/out/pending bar style from `schedule/page.tsx`’s `NextMatchDetail`) plus `homeFree/homeTotal` and `awayFree/awayTotal`. **Counts only — no player names** (privacy). Include a "custom time" override input.
- On confirm → call `schedule_fixture` → close → the fixture now shows its kickoff.
- All styling via existing design tokens and `Card`/`Button`/`Badge`/`Avatar` primitives. No new colors, no new libraries.

---

## Prerequisite: blockers editor (brief)

Smart scheduling is inert without blocker data. A small editor on `/profile` (its own follow-up):
- **Recurring:** day-of-week chips (reuse the wizard's `DayChips` pattern) + start/end time → row in `recurring_blockers`.
- **One-off:** date-range picker → row in `oneoff_blockers`.
- A player's own list with delete; warn on overlapping recurring entries (per the schema note).
- Writes are user-scoped (`user_id = auth.uid()`), matching the blockers RLS.

This should land before or alongside the suggest route so the feature has something to score.

---

## Types & doc updates this plan implies

- **`src/lib/types.ts`** — add `ScheduleSuggestion` (above). Optionally an internal `SquadAvailabilityRow` mirroring the RPC result for the scoring function's input type. No new type files.
- **`docs/SCHEMA.md`** — add the `leagues` match-day/timezone columns, the `schedule_fixture` RPC, and the `player_is_blocked` helper; mark `get_squad_availability` as `SECURITY DEFINER`.
- **`docs/DATA_FLOW.md`** — add a "Smart scheduling" subsection (currently the engine lives only in SCHEMA): the suggest-route flow, the `schedule_fixture` write path, and the blockers-editor write path. Fits after the existing RSVP section in the Schedule entry.

---

## Build order

1. Schema migration: `leagues` match-day/timezone columns; wire the Create wizard's day chips → `match_days`.
2. Blockers editor on `/profile` (captures the data the engine needs).
3. `get_squad_availability` as `SECURITY DEFINER` RPC.
4. `scoreSlots` pure function + unit tests (this is where correctness lives).
5. `POST /api/schedule/suggest` route handler (auth + fetch + score).
6. `schedule_fixture` RPC (set time + pre-populate `out`).
7. Suggestion modal in `/manage` (and `/team` Fixtures), wired to both endpoints.

---

## Verification

- **Unit:** `scoreSlots` is a pure function — seed synthetic blocker maps and assert slot ordering, free counts, divide-by-zero handling, recurring weekday+time overlap, and one-off date-range inclusivity. This is the highest-value test surface.
- **Integration:** seed two squads with known blockers; call `/api/schedule/suggest` for a fixture; assert the top slot avoids the most conflicts and the response contains **counts only** (no names).
- **Auth:** assert 401 (anon), 403 (unrelated user), 200 (organizer/captain).
- **End-to-end:** generate fixtures → set blockers → open the suggestion modal → pick a slot → confirm `fixtures.scheduled_at` is set and blocked players have `availability = 'out'` rows.
