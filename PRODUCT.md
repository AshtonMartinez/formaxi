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

FormaXI should feel native at every tier. The same product serves all three without forcing small groups into enterprise-grade setup flows or limiting serious leagues to a stripped-down experience.

**Tier 1 — Casual / micro-format**
3-a-side, 5-a-side, 6 teams or fewer, friends, no fees, no formal structure. The entire setup should fit in one screen. Standings, schedule, done.

**Tier 2 — Organized city league**
7-a-side or 11-a-side, 6–20 teams, season-based, potentially with fees and promotion/relegation. Full feature set: fixture generation, results, stats, squad management, team pages.

**Tier 3 — Cross-league competition**
Multiple Tier 2 leagues whose organizers coordinate. Tournaments, cups, playoff brackets, and inter-league tables. Top teams from separate leagues can be invited into a shared competition. Organizers can communicate with each other through the platform rather than outside it.

---

## Feature Inventory (Current Build)

### Standings (`/standings`)
The league hub for a season in progress. Shows the full league table with position, played, won, drawn, lost, points, and a five-match form sequence. Promotion and relegation zones are visually distinguished. A sidebar shows top scorers and the next round of fixtures.

### Discover (`/discover`)
A browseable directory of open leagues nearby. Cards show format (5v5, 7v7, 11v11), location, day, cost, and available spots. Filterable by format and location. Each card has a Join button. Intended to help players find new leagues and to give organizers a public presence.

### Schedule (`/schedule`)
A player's upcoming match calendar. Two views: chronological list and monthly calendar grid. Each match shows date, time, opponent, venue, and home/away status. A sticky sidebar shows the next match with squad availability (confirmed/out/pending) and an RSVP widget.

### My Team (`/team`)
Team management organized into four tabs: Squad (roster with availability), Fixtures (upcoming and results), Stats (player stats table and season overview), and Settings (team details, league membership, danger zone).

### Profile (`/profile`)
Individual player profile with career stats (matches, goals, assists, MOTM, win rate), account details, match reminder toggle, and a "My Teams" panel showing all leagues and roles.

### Create (`/create`)
A guided multi-step wizard for creating a league or a team.

**New League** (4 steps): name/format/region, competition structure (teams, single/double round-robin, match days, start date), rules (points, tiebreaker, visibility, auto-fixture generation), invite teams and launch.

**New Team** (4 steps): name/abbreviation/colour, home ground and match days, choose a league, invite players.

Both flows show a live preview sidebar.

---

## Current State

The application is a complete, polished front-end with full UI and interactivity, backed entirely by static mock data. No Supabase queries are wired up yet. The tech stack (Next.js 16, Supabase, TypeScript) is in place and ready for the data layer. The design system is consistent and complete.

The current build best represents Tier 2 (organized city league). Tier 1 and Tier 3 are conceptually accounted for in the product vision but not yet in the UI.

---

## Roadmap

Priorities are ordered by what unlocks the next tier of the platform.

### Phase 1 — Make the current build real
Connect every page to live Supabase data. Leagues, teams, players, fixtures, and results as database tables. Auth so users have persistent identities. Standings calculated live from submitted results. This is the prerequisite for everything else.

### Phase 2 — RSVP and result submission
The Schedule RSVP widget and the Fixtures tab need to write back to the database. Captains submit scores; standings update automatically. Match reminders via email or push notification. This completes the core loop for Tier 2 users.

### Phase 3 — Tier 1: frictionless small-format creation
A simplified creation flow specifically for micro-leagues: pick a name, invite 5–11 people by phone or email, choose a day, start. No multi-step wizard, no rules configuration. The league self-organizes around the players who show up. The goal is to make starting a 3-a-side league feel as low-effort as creating a WhatsApp group.

### Phase 4 — Organizer network
A layer that connects league organizers to each other on the platform. Organizers can see other leagues in their area, send collaboration requests, and coordinate events. This is the foundation for Tier 3. Crucially, organizers should be able to invite the top N teams from their league into a shared tournament without those teams needing to leave their existing league.

### Phase 5 — Tournaments and cross-league cups
A tournament bracket system that sits above the regular season. An organizer creates a cup competition, selects participating teams (from one or multiple leagues), and the platform handles draws, fixtures, and results separately from the regular league table. Teams can be competing in their Sunday league and a cup simultaneously.

### Phase 6 — Promotion, relegation, and tiered structures
Multiple leagues in the same region can link themselves into a pyramid: top two teams from Division 2 go up to Division 1, bottom two come down. The platform tracks this across seasons. Over time this creates a living, self-organizing hierarchy of amateur football in a city.

### Phase 7 — Mobile-first experience
The current UI is desktop-first. The most common use case — checking the schedule before Sunday, RSVPing, seeing the table — is mobile. A mobile-optimized or native-app experience is essential for the platform to reach casual Tier 1 users at scale.

### Phase 8 — League analytics and organizer tools
Attendance tracking, fee collection, no-show management, season reports. Tools that give serious Tier 2 organizers what they currently manage in spreadsheets.

---

## Design Principles

**Start simple, grow deep.** A six-person group should be able to use FormaXI without ever discovering that tournament brackets exist. A serious league organizer should be able to reach every tool they need without feeling like the app was built for casual users.

**Organizers are users too.** Most tools treat the person running the league as an admin, not a participant. FormaXI should make being an organizer feel good — they should have their own dashboard, their own community, and a sense of the ecosystem they're building.

**Leagues should want to connect.** The inter-league features only work if organizers are incentivized to reach out. The Discover page, organizer profiles, and tournament invitations are the social layer that makes this happen organically rather than by top-down mandate.
