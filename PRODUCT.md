# FormaXI — Product Definition

## What Is FormaXI?

FormaXI is a platform for organizing football at every level of informality — from a six-person 3-a-side group of friends playing in a park, to a full 11-a-side city league, to a multi-league structure with inter-league cups and tournaments. Its central purpose is to make it frictionless to start a league and to give those leagues a path to grow into something bigger.

The application currently reflects one slice of this vision — a mid-tier Sunday city league — but the product is designed to scale both down (casual, small-format play) and up (cross-league competition, tournaments, organizer networks).

---

## The Core Bet

Most recreational football never gets organized because the cost of doing so is too high. WhatsApp groups, Google Sheets, verbal scheduling — it works until it doesn't, and it never scales. FormaXI's thesis is: **if you remove the friction of starting a league, more leagues will start.** And once leagues exist in one place, they can interact — run tournaments, share a standings ecosystem, promote their best teams upward.

The ambition is a platform that looks like a grassroots football pyramid: anyone can start at the bottom, and the best rise naturally.

---

## Who It's For

FormaXI is designed to serve three distinct user types, which often overlap in smaller organizations.

**The casual organizer**
A person who wants to get a group of friends playing regularly. They need something dead simple: create a league in under two minutes, invite five other people, and let the app handle the table and schedule. They are not thinking about tiebreakers or double round-robins — they want to know who's playing this Sunday and what the standings look like.

**The league organizer**
Someone running a real competition: 8–16 teams, a full season, weekly match days, fees, maybe promotion and relegation. They need more control — fixture generation, rules configuration, visibility settings, result management. They are also the person most likely to want to connect with other organizers to run inter-league events.

**The team captain / player**
A player who belongs to one or more teams across different leagues or formats. They want squad management, RSVP, the schedule, and their personal stats in one place. They are the end beneficiary of every feature the organizers build.

---

## Scale Tiers

FormaXI should feel native at every tier. The same product serves all four without forcing small groups into enterprise-grade setup flows or limiting serious leagues to a stripped-down experience.

**Tier 0 — Pickup / one-off**
Informal pickup soccer with no teams, no rosters, no standings, and no stats. It solves only discovery, scheduling, and RSVP/interest — the bare mechanics of getting a game going. This is the layer below Tier 1's micro-league, which still assumes a named recurring group; Tier 0 assumes nothing beyond "some people want to play." It is the widest, lowest-friction entry point on the platform. See "Tier 0 — Pickup / One-Off in Depth" below for the full model.

**Tier 1 — Casual / micro-format**
3-a-side, 5-a-side, 6 teams or fewer, friends, no fees, no formal structure. The entire setup should fit in one screen. Standings, schedule, done.

**Tier 2 — Organized city league**
7-a-side or 11-a-side, 6–20 teams, season-based, potentially with fees and promotion/relegation. Full feature set: fixture generation, results, stats, squad management, team pages.

**Tier 3 — Cross-league competition**
Multiple Tier 2 leagues whose organizers coordinate. Tournaments, cups, playoff brackets, and inter-league tables. Top teams from separate leagues can be invited into a shared competition. Organizers can communicate with each other through the platform rather than outside it.

---

## Tier 0 — Pickup / One-Off in Depth

Tier 0 sits below every other tier. It has no teams, no rosters, no standings, and no stats — deliberately so. It solves three problems for informal pickup soccer: **discovery** (finding a game near you), **scheduling** (when and where), and **RSVP / interest** (who's coming). Everything above it — the named recurring group of Tier 1's micro-league, the season structure of Tier 2, the cross-league play of Tier 3 — assumes commitments that pickup players don't want to make. Tier 0 is the on-ramp for people who just want to show up and play, and the foundation of the platform's widest funnel.

### Event types

Set explicitly at creation, never inferred from behavior.

- **Ad-hoc** — a single date, time, and location. No recurrence, and no drift or health tracking of any kind. Once it happens (or doesn't), it's done.
- **Recurring** — a defined cadence (e.g. every Tuesday, every other Tuesday) at the same location. Recurring events are subject to the drift / health state machine below; ad-hoc events are not.

### RSVP modes

Set per event by the organizer. Binary — there is no soft-cap third state.

- **Open** — "All welcome, we'll figure it out." Pure interest-signaling. No capacity math and no waitlist. RSVPs tell the organizer roughly who's interested, and nothing more.
- **Capacity** — "22 needed, first 22 get the spot." A hard cap set by the organizer, so each RSVP is a real reservation. Once the event is full, additional RSVPs join a waitlist with automatic promotion when someone drops.

### Organizer confirmation mechanic

After a scheduled occurrence, the organizer receives a proactive notification and confirms in one or two taps: **"Did this happen?"** (yes / no), plus an optional rough attendance guesstimate — a bucket or stepper, never a precise headcount. This single action drives three things:

1. **Lifetime games-organized count** — increments only on a confirmed "yes." It never regresses and has no upper cap.
2. **Internal "would you play with this group / organizer again?" prompt** — sent to that occurrence's RSVP'd players. Binary yes / no, and fully internal: never displayed publicly, and never shown to organizers as a score. It is collected for future use — a private organizer-facing trend, a Discover ranking input, and a trust-and-safety signal.
3. **Recurring-listing health state** — see the state machine below.

An explicit **"No, didn't happen"** (e.g. rained out) must be equally low-friction, and it does **not** count as a drift miss. Only silence — no response at all — counts against a listing.

### Recurring listing health state machine

Applies only to recurring events, never to ad-hoc ones. States progress **Active → Slowing → Gone Quiet → Archived**, driven purely by confirmation activity measured against the event's *own* stated cadence — not a fixed calendar threshold. A weekly listing and a monthly listing therefore have different tolerances.

- **Active** — healthy; confirmations arriving on cadence.
- **Slowing** — one missed confirmation window. Still visible in Discover, but the trust language quietly softens.
- **Gone Quiet** — consecutive misses. Deprioritized hard in Discover, and the organizer is notified directly.
- **Archived** — extended silence. Hidden from Discover, but revivable by the organizer and never deleted.

Players who have already RSVP'd to or favorited a listing continue to see it even when it is Gone Quiet or Archived. Organizers can also explicitly close a listing ("done with this") or mark a break with an expected return window (for seasonal groups) to avoid sending false-abandoned signals.

**TBD:** the exact confirmation-window length — same-day versus a multi-day grace period — before a miss counts against a listing is still an open decision, not yet settled.

### Organizer trust badges

Public, lifetime, and non-regressing, based on confirmed games only. A tiered ladder runs from new organizer up to veteran status. Two tone requirements are firm: the early tiers must read as welcoming and neutral — never as a red flag that penalizes newcomers — and the top tier must be open-ended rather than capped, so it functions as a lasting status rather than a finish line.

### What is NOT shown to players

Deliberately withheld from the player-facing surface:

- No public star ratings.
- No visible reliability score.
- No visible attendance history or averages.

The only trust signals a player sees are the **organizer badge tier** and the **recurring-listing health language** (e.g. "Weekly Regular"). All quantitative attendance and reliability data is collected but kept internal for now — reserved for future organizer-facing insights and platform-level ranking and moderation, not public display.

---

## Feature Inventory (Current Build)

### Standings (`/standings`)
The league hub for a season in progress. Shows the full league table with position, played, won, drawn, lost, points, and a five-match form sequence. Promotion and relegation zones are visually distinguished. A sidebar shows top scorers and the next round of fixtures.

### Discover (`/discover`)
A browseable directory of open leagues nearby. Cards show format (5v5, 7v7, 11v11), location, day, cost, and available spots. Filterable by format and location. Each card has a Join button. Intended to help players find new leagues and to give organizers a public presence.

### Schedule (`/schedule`)
A player's upcoming match calendar. Two views: chronological list and monthly calendar grid. Each match shows date, time, opponent, venue, and home/away status. A sticky sidebar shows the next match with squad availability (confirmed/out/pending) and an RSVP widget.

Players can set availability blockers on their profile: recurring windows (e.g. Mon–Fri 9–5, or every Sunday before 10am) and one-off date ranges (e.g. away 3rd–5th July). These persist across the season and feed into the smart scheduling system.

When an organizer or captain schedules a fixture, the app scores candidate time slots against both squads' blockers and surfaces ranked suggestions showing how many players from each side are free. The organizer picks from the suggestions or sets a custom time. Once scheduled, players whose blockers conflict with the fixture are automatically pre-filled as unavailable in RSVP, though they can override this.

### My Team (`/team`)
Team management organized into four tabs: Squad (roster with availability), Fixtures (upcoming and results), Stats (player stats table and season overview), and Settings (team details, league membership, danger zone).

### Profile (`/profile`)
Individual player profile with career stats (matches, goals, assists, MOTM, win rate), account details, match reminder toggle, and a "My Teams" panel showing all leagues and roles.

### Create (`/create`)
A guided multi-step wizard for creating a league or a team.

**New League:** name/format/region, competition structure (teams, divisions, single/double round-robin, match days, start date), and rules (points, tiebreaker, visibility), then launch. Launching creates an empty league with its divisions and an upcoming season — no teams and no fixtures yet. Teams join afterward (the organizer approves applications or invites captains directly), and the organizer generates the fixture schedule on demand once teams are in. Every league has at least one division — simple leagues leave it at the default and never think about it again. Organizers who want a tiered structure can add more divisions to their league. Team placement across divisions is always under organizer control — teams can be manually moved between divisions at any time. Optionally, organizers can configure promotion and relegation spot counts per division, which highlights the relevant positions in the standings table and prompts the organizer at season end; but nothing moves automatically. Promotion and relegation always stays within the same league.

**New Team** (4 steps): name/abbreviation/colour, home ground and match days, choose a league, invite players.

Both flows show a live preview sidebar.

---

## Current State

The application is a complete, polished front-end with full UI and interactivity, backed entirely by static mock data. No Supabase queries are wired up yet. The tech stack (Next.js 16, Supabase, TypeScript) is in place and ready for the data layer. The design system is consistent and complete.

The current build best represents Tier 2 (organized city league). Tier 0, Tier 1, and Tier 3 are conceptually accounted for in the product vision but not yet in the UI.

---

## Roadmap

Priorities are ordered by what unlocks the next tier of the platform.

### Phase 1 — Make the current build real
Connect every page to live Supabase data. Leagues, teams, players, fixtures, and results as database tables. Auth so users have persistent identities. Standings calculated live from submitted results. This is the prerequisite for everything else.

### Phase 2 — RSVP and result submission
The Schedule RSVP widget and the Fixtures tab need to write back to the database. Captains submit scores; standings update automatically. Match reminders via email or push notification. This completes the core loop for Tier 2 users.

### Phase 3 — Tier 0: pickup and one-off play
The pickup layer — the lowest-friction entry point on the platform and the widest top of the funnel. Ad-hoc and recurring event creation with Open and Capacity RSVP modes; a Discover surface for finding nearby games; the organizer confirmation mechanic ("Did this happen?"); the recurring-listing health state machine (Active → Slowing → Gone Quiet → Archived); and lifetime games-organized counts with public, non-regressing organizer trust badges. No teams, rosters, standings, or stats. All attendance and reliability data is collected internal-only. Many organizers will meet FormaXI here before ever running a league, making this a natural precursor to the Tier 1 micro-league work below.

### Phase 4 — Tier 1: frictionless small-format creation
A simplified creation flow specifically for micro-leagues: pick a name, invite 5–11 people by phone or email, choose a day, start. No multi-step wizard, no rules configuration. The league self-organizes around the players who show up. The goal is to make starting a 3-a-side league feel as low-effort as creating a WhatsApp group.

### Phase 5 — Organizer network
A layer that connects league organizers to each other on the platform. Organizers can see other leagues in their area, send collaboration requests, and coordinate events. This is the foundation for Tier 3. Crucially, organizers should be able to invite the top N teams from their league into a shared tournament without those teams needing to leave their existing league.

### Phase 6 — Tournaments and cross-league cups
A tournament bracket system that sits above the regular season. An organizer creates a cup competition, selects participating teams (from one or multiple leagues), and the platform handles draws, fixtures, and results separately from the regular league table. Teams can be competing in their Sunday league and a cup simultaneously.

### Phase 7 — Transfers
The ability to move players and teams across leagues on the platform. This covers two cases: a single player transferring from one team to another (in any league), and an entire team transferring from one league to another. Transfers are initiated by the player or captain and require acceptance from the receiving team or league organizer. Promotion and relegation within a league are handled automatically by the divisions system and are not transfers — transfers are voluntary moves between distinct leagues.

### Phase 8 — Mobile-first experience
The current UI is desktop-first. The most common use case — checking the schedule before Sunday, RSVPing, seeing the table — is mobile. A mobile-optimized or native-app experience is essential for the platform to reach casual Tier 1 users at scale.

### Phase 9 — League analytics and organizer tools
Attendance tracking, fee collection, no-show management, season reports. Tools that give serious Tier 2 organizers what they currently manage in spreadsheets.

---

## Design Principles

**Start simple, grow deep.** A six-person group should be able to use FormaXI without ever discovering that tournament brackets exist. A serious league organizer should be able to reach every tool they need without feeling like the app was built for casual users.

**Organizers are users too.** Most tools treat the person running the league as an admin, not a participant. FormaXI should make being an organizer feel good — they should have their own dashboard, their own community, and a sense of the ecosystem they're building.

**Leagues should want to connect.** The inter-league features only work if organizers are incentivized to reach out. The Discover page, organizer profiles, and tournament invitations are the social layer that makes this happen organically rather than by top-down mandate.
