# FormaXI MVP Feature Set

This document defines the agreed scope for the first production-ready version of FormaXI. The MVP covers the Tier 2 experience: an organized city league with real teams, a real season, and a real data backend. Everything here should be achievable with the current UI (already built) connected to Supabase.

---

## 1. Auth & Profiles

Users sign up and log in via Supabase Auth (email/password or OAuth). Every user gets a profile with:

- Display name and optional avatar
- Preferred position
- Match reminder notification toggle

**Roles** are contextual, not global — a user can hold multiple roles across different leagues:

| Role | Scope | Capabilities |
|---|---|---|
| Organizer | Per league | Full control over league settings, fixture generation, result approval |
| Captain | Per team | Manage roster, submit match results, view squad availability |
| Player | Per team | RSVP to fixtures, view personal stats |

A user can be organizer of one league, captain of a team in that league, and a player in a second league simultaneously. Roles are stored per-team-membership and per-league, not as a single global enum.

**Out of scope for MVP:** admin/super-admin roles, OAuth providers beyond basic email, identity verification.

---

## 2. League Creation & Configuration

An authenticated user can create a league as organizer. League configuration includes:

| Field | Description |
|---|---|
| Name | Full display name of the league |
| Slug | URL-safe unique identifier (auto-generated from name, editable) |
| Format | `5-a-side`, `7-a-side`, or `11-a-side` |
| Location | Region / venue description |
| Day(s) of week | When matches are played |
| Entry fee | Optional fee in pence (displayed as £ to users) |
| Visibility | `public` (discoverable on /discover) or `private` (invite-only) |
| Points system | Configurable win/draw points (default 3/1/0) |
| Tiebreaker | Goal difference or head-to-head |
| Auto-fixture generation | Toggle — generate full schedule on season start |

The 4-step Create wizard in `src/app/(dashboard)/create/page.tsx` already collects all of these fields. The MVP task is to connect the final step ("Launch league") to a Supabase insert.

### Divisions

Every league has at least one division. When a league is created, a single default division ("Division 1") is created automatically. Simple leagues — a group of friends, a small local competition — never need to think about divisions at all; they just use the one that's there.

An organizer can add further divisions to the same league (e.g. "Division 2", "Division 3"). Each division:

- Has its own team list, fixture schedule, and standings table
- Shares the parent league's rules (points system, tiebreaker, format, etc.)
- Optionally configures promotion and relegation spots — how many teams automatically move up or down at season end. Organizers can also leave promotion/relegation at zero and manage team placement across divisions manually at any time.

Teams are assigned to a single division within the league. Fixtures are generated and played within a division — teams only play other teams in the same division in the regular season.

The `divisions` field on `LeagueState` (already added to the Create wizard state) holds the number of divisions the organizer wants. During the Structure step this defaults to 1. When the Create wizard is wired to Supabase, launching the league inserts one `divisions` row per requested division and assigns the invited teams across them. For a single-division league this is invisible — it's just an automatic step.

**The Create wizard UI does not yet expose division count or team-to-division assignment. That is in scope for MVP but not yet built.**

---

## 3. Teams & Rosters

Teams belong to a league and are managed by a captain.

- A team has: name, 2–3 character abbreviation (initials), color (hex), home venue
- The captain is a user with the captain role for that team
- A player can be a member of multiple teams (across different leagues)
- Team membership has a status: `active`, `invited`, `left`

**Roster management:**
- Captains can invite players by email
- Players accept invites to join a team
- Captains can remove players from the roster
- The Squad tab in `/team` shows the current roster with availability for the next fixture

---

## 4. Season & Fixture Generation

A season belongs to a league. One league can have multiple seasons (sequentially, not simultaneously for MVP).

**Season fields:** name (e.g. "2025/26"), start date, end date, status (`upcoming`, `active`, `completed`)

**Fixture generation:** When an organizer launches a season with auto-fixture enabled, the app generates a round-robin schedule per division:
- Single round-robin: each team plays every other team in its division once
- Double round-robin: home and away legs within the division

Teams in different divisions do not play each other in the regular season. Fixture generation runs independently for each division using only the teams assigned to that division.

Each fixture has: home team, away team, division, matchday number, scheduled date/time, venue, status (`scheduled`, `played`, `postponed`).

Fixture generation is deterministic from the team list — the same teams always produce the same schedule for a given round-robin type. No randomness beyond the initial draw order.

---

## 5. Result Entry & Standings

**Result submission:**
- Organizers or captains can submit the final score for a fixture
- Score is stored as home_score + away_score integers
- Submission records who submitted and when

**Standings calculation:**
- Standings are computed live from submitted results — there is no stored standings table
- Standings are scoped to a division. Each division has its own independent table.
- Calculated fields per team: P (played), W (won), D (drawn), L (lost), GF (goals for), GA (goals against), GD (goal difference), Pts (points)
- Teams are sorted by: Pts desc → GD desc → GF desc → name asc (or head-to-head per league config)
- Form guide shows the last 5 results in order (W/D/L)
- Promotion/relegation zones are optionally shown based on per-division thresholds (top N = promotion, bottom M = relegation). If both are set to 0, no zones are displayed. Organizers can also move teams between divisions manually regardless of zone configuration.

The standings page (`/standings`) already renders a single division table — it needs to receive live data instead of the mock array, and gain a division switcher for leagues with more than one division. For single-division leagues the switcher is hidden.

---

## 6. Player Availability, Blockers & Smart Scheduling

One of the core pain points in amateur football is coordinating a match time that actually works for the people who need to play. FormaXI addresses this in two layers: player-defined availability blockers that persist across the whole season, and per-fixture RSVP once a match is scheduled.

### Availability Blockers

Players can set two types of blockers on their profile:

**Recurring blockers** — a repeating window when a player is regularly unavailable. Examples: "Mon–Fri, 9:00–17:30" or "Every Sunday before 10:00". A player defines one or more recurring blockers by selecting days of the week and a time range. These apply to every week of the season unless overridden by a one-off blocker.

**One-off blockers** — a specific date range when a player is unavailable. Examples: "Away 3rd–5th July" or "Holiday 14th–22nd August". Players can add as many of these as they need during the season.

Blockers are personal and always visible to the player. Captains can see an aggregated view of their squad's blockers when the organizer is trying to schedule a match. Individual player blocker details are not exposed to other players — only the aggregate impact on scheduling is shown.

### Smart Match Scheduling

When an organizer or captain needs to schedule (or propose a time for) a fixture, the app generates ranked time slot suggestions based on the availability of both squads.

The scoring process:

1. Pull the active rosters for both teams involved in the fixture.
2. For each candidate time slot (drawn from the league's configured match days and a reasonable time window), check each player's blockers.
3. Score the slot by the number of players free — both the raw count and as a percentage of the squad. Weight the home squad and away squad equally.
4. Surface the top suggestions to the organizer, showing for each slot: the proposed date/time, how many players from each squad are free, and how many have conflicts.

The organizer picks from the suggestions or overrides with a custom time. The selected time is then saved as the fixture's `scheduled_at` and triggers RSVP notifications to both squads.

This is a scheduling aid, not an automated scheduler — the organizer always makes the final decision.

### Per-Fixture RSVP

Once a fixture has a scheduled time, each player on the home or away roster can declare their availability for that specific match:

| Status | Meaning |
|---|---|
| `available` | Confirmed, ready to play |
| `doubtful` | Uncertain — may or may not make it |
| `out` | Definitely not playing |

The default state (no entry) is treated as pending/unknown by the UI. A player whose blocker covers the fixture time is automatically pre-filled as `out` but can override this manually — blockers are hints, not locks.

**Captain view:** The sidebar on `/schedule` shows the squad availability summary for the next match (confirmed count, out count, pending count) as a progress bar. This data comes from the `availability` table filtered to the next fixture for the user's team.

**Write path:** When a player clicks "I'm in" or "Can't make it" on the RSVP widget, it upserts a row in the `availability` table.

---

## 7. Basic Stats

Stats are recorded per player per fixture:

- Goals scored
- Assists made

From these, the app derives:
- Top scorer leaderboard per season (shown in the standings sidebar)
- Player statistics table per team (shown in the Stats tab of `/team`)
- Career totals on the player profile (`/profile`)

For MVP, stats are entered manually by the organizer or captain after a match. A simple form linked to a fixture (outside current UI scope — a modal or inline form) submits rows to the `player_stats` table.

The profile page shows career aggregates: total matches, goals, assists, MOTM (Man of the Match) count, win rate. MOTM is not tracked as a stat field in the MVP schema — it can be added in Phase 2.

// TODO: MOTM is shown in the profile UI (StatCard with value=6, label="MOTM") but there is no corresponding field in the schema. Add a `motm: boolean` column to `player_stats` in a post-MVP iteration, or derive it from a `match_result.motm_user_id` column.

---

## 8. Discover / Public League Listings

Leagues with `visibility = 'public'` appear on the `/discover` page.

Each listing shows:
- League name, initials, crest color
- Format (5/7/11-a-side)
- Location
- Day(s) of play
- Entry fee
- Available spots (capacity - current team count, or "Open" / "Waitlist")

**Filtering:** Client-side filter by format. Dropdown filters for location and day are shown in the UI but not yet functional (MVP: implement location and day filtering).

**Join:** The Join button on a league card should trigger an authenticated request to join the league. For public leagues, this creates a pending team application. For invite-only leagues (which don't appear on Discover), joining is invite-only.

---

## Out of Scope for MVP

The following features are explicitly deferred to later phases:

| Feature | Phase |
|---|---|
| Tournament / cup brackets | Phase 5 |
| Player and team transfers between leagues | Phase 6 |
| Fee collection / payment processing | Phase 8 |
| Native mobile app | Phase 7 |
| Organizer analytics and attendance tracking | Phase 8 |
| Inter-league structure / organizer network | Phase 4 |
| Man of the Match tracking | Post-MVP |
| Match reports / commentary | Post-MVP |
| Push/email notifications | Phase 2 |
| League-level API or embeds | Post-MVP |
