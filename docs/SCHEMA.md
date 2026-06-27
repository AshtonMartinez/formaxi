# Supabase Data Schema — FormaXI

This document describes the complete Supabase (PostgreSQL) data model for the FormaXI MVP. It includes table DDL in dependency order, views, functions, sample queries, recommended indexes, RLS policy intentions, and notes on TypeScript type gaps.

---

## Tables

### `users`

Extends Supabase Auth's `auth.users`. Stores public profile data.

```sql
create table public.users (
  id                      uuid        primary key references auth.users(id) on delete cascade,
  email                   text        not null,
  display_name            text        not null,
  avatar_url              text,
  preferred_position      text        check (preferred_position in ('GK', 'DF', 'MF', 'FW')),
  match_reminder_enabled  boolean     not null default true,
  created_at              timestamptz not null default now()
);
```

**`preferred_position`** — shown in AccountDetails on `/profile`. Nullable; not all users play a specific position.

**`match_reminder_enabled`** — the "Match reminders" toggle in AccountDetails. Default on.

---

### `leagues`

A competition owned by an organizer. Stores both the structural configuration set during the Create wizard and the display metadata shown on `/discover`. League-level rules (points, tiebreaker, format) apply to all divisions within the league.

```sql
create table public.leagues (
  id            uuid        primary key default gen_random_uuid(),
  organizer_id  uuid        not null references public.users(id) on delete restrict,
  name          text        not null,
  slug          text        not null unique,
  description   text,
  format        text        not null check (format in ('5-a-side', '7-a-side', '11-a-side')),
  location      text        not null,
  day_of_week   text,                       -- e.g. 'Sundays', 'Sat & Sun'
  fee_cents     integer     not null default 0, -- entry fee in pence; 0 = free
  visibility    text        not null default 'public'
                              check (visibility in ('public', 'private')),
  rounds        text        not null default 'double'
                              check (rounds in ('single', 'double')),
  auto_fixture  boolean     not null default true,
  points_win    smallint    not null default 3  check (points_win  >= 0),
  points_draw   smallint    not null default 1  check (points_draw >= 0),
  tiebreak      text        not null default 'gd'
                              check (tiebreak in ('gd', 'h2h')),
  created_at    timestamptz not null default now()
);
```

**Column notes:**

| Column | Maps to |
|---|---|
| `description` | Create wizard Step 0 "Short description" textarea |
| `rounds` | Create wizard Step 1 "Single/Double round" toggle |
| `auto_fixture` | Create wizard Step 2 "Auto-generate fixtures" toggle |
| `points_win` / `points_draw` | Create wizard Step 2 "Points awarded" steppers |
| `tiebreak` | Create wizard Step 2 tiebreaker toggle |

// NOTE: `promotion_spots` and `relegation_spots` are **not** on `leagues` — they live on `divisions`, since each division in a multi-division league can have different thresholds. See the `divisions` table below.

// NOTE: `max_teams` is **not** on `leagues` — it lives on `divisions`, since each division has its own team cap. The total league capacity shown on `/discover` is derived as the sum of `max_teams` across all divisions in the league.

// NOTE: `LeagueCard` in types.ts includes display-only fields (`tagColor`, `tagBg`, `bannerGradient`) that have no database column. Derive these in the UI from `leagues.format` or `leagues.color_hex` (if added later) rather than storing them.

// NOTE: `LeagueCard.spots` ("2 spots left", "Open", "Waitlist") is derived: `sum(divisions.max_teams) - count(active teams across all divisions)`. Compute in the query layer.

---

### `divisions`

A division belongs to a league and contains its own set of teams, fixtures, and standings. Every league has at least one division, created automatically when the league is launched. Single-division leagues never need to interact with this concept directly.

```sql
create table public.divisions (
  id               uuid        primary key default gen_random_uuid(),
  league_id        uuid        not null references public.leagues(id) on delete cascade,
  name             text        not null default 'Division 1',
  sort_order       smallint    not null default 1, -- 1 = top division; higher = lower tier
  max_teams        smallint    not null default 12,
  promotion_spots  smallint    not null default 2  check (promotion_spots  >= 0),
  relegation_spots smallint    not null default 2  check (relegation_spots >= 0),
  created_at       timestamptz not null default now()
);
```

**Column notes:**

| Column | Notes |
|---|---|
| `name` | Defaults to "Division 1", "Division 2", etc. Organizers can rename. |
| `sort_order` | Controls display order. Division with `sort_order = 1` is shown first (top division). |
| `max_teams` | Per-division team cap. Used to compute available spots for `/discover`. |
| `promotion_spots` | Top N positions highlighted green in standings. Set to `0` to disable promotion zones — the organizer can still move teams between divisions manually. |
| `relegation_spots` | Bottom N positions highlighted red. Set to `0` to disable. |

Promotion and relegation zones are a display aid, not a mechanism. Setting spots to a non-zero value highlights the relevant positions in the standings table and can trigger an end-of-season prompt for the organizer to confirm movements. But the organizer can always manually reassign any team to a different division at any time, regardless of their position. There is no automatic demotion or promotion without organizer action.

On league creation, the app inserts one row per requested division count (from `LeagueState.divisions`, which defaults to `1`). For a league with `divisions = 1`, exactly one `divisions` row is created with `name = 'Division 1'` and `sort_order = 1`. This is invisible to the organizer — they never need to manage a single division explicitly.

---

### `teams`

A team registered within a division. Teams are division-scoped — a team competes in exactly one division at a time. The league is derived via `divisions.league_id`. A user who captains teams in multiple leagues has a separate `teams` row per league.

```sql
create table public.teams (
  id            uuid        primary key default gen_random_uuid(),
  division_id   uuid        not null references public.divisions(id) on delete cascade,
  captain_id    uuid        not null references public.users(id)     on delete restrict,
  name          text        not null,
  color_hex     text        not null,   -- e.g. '#1f9a52'
  initials      text        not null,   -- 2–3 chars, e.g. 'RF'
  home_venue    text,
  founded_year  smallint,
  created_at    timestamptz not null default now()
);
```

// NOTE: To query all teams in a league, join through `divisions`: `teams JOIN divisions ON divisions.id = teams.division_id WHERE divisions.league_id = $league_id`.

---

### `team_players`

Membership table connecting users to teams. Stores both the membership lifecycle (`status`) and the player's team-specific profile (jersey number, position, general availability).

```sql
create table public.team_players (
  id              uuid        primary key default gen_random_uuid(),
  team_id         uuid        not null references public.teams(id) on delete cascade,
  user_id         uuid        not null references public.users(id) on delete cascade,
  status          text        not null default 'active'
                                check (status in ('active', 'invited', 'left')),
  jersey_number   smallint    check (jersey_number between 1 and 99),
  position        text        check (position in ('GK', 'DF', 'MF', 'FW')),
  availability    text        not null default 'available'
                                check (availability in ('available', 'doubtful', 'out')),
  joined_at       timestamptz not null default now(),
  unique (team_id, user_id)
);
```

**Column notes:**

| Column | Distinct from |
|---|---|
| `jersey_number` | `Player.number` in types.ts — the shirt number shown in the Squad tab |
| `position` | `Player.position` in types.ts — "GK", "DF", "MF", "FW" label in the Squad tab |
| `availability` | **Not the same as the `availability` table.** This is a season-level status (e.g. injured for the season, indefinitely doubtful). Per-fixture RSVP lives in `public.availability`. |

// NOTE: `Player.isCaptain` in types.ts is derived from `teams.captain_id = auth.uid()`. It is not stored on the membership row and does not need to be.

// NOTE: `Player.goalsAssists` is a UI display string (e.g. "14/5"). In the database these are separate integers in `player_stats`, aggregated per season. Compute as `${sum(goals)}/${sum(assists)}` in the UI when querying.

---

### `seasons`

A season ties fixtures to a league and tracks status. A league has one active season at a time for MVP.

```sql
create table public.seasons (
  id          uuid        primary key default gen_random_uuid(),
  league_id   uuid        not null references public.leagues(id) on delete cascade,
  name        text        not null,   -- e.g. '2025/26'
  start_date  date,
  end_date    date,
  status      text        not null default 'upcoming'
                            check (status in ('upcoming', 'active', 'completed')),
  created_at  timestamptz not null default now()
);
```

---

### `fixtures`

A single scheduled match within a season. Fixtures are always intra-division — both teams must belong to the same division.

```sql
create table public.fixtures (
  id            uuid        primary key default gen_random_uuid(),
  season_id     uuid        not null references public.seasons(id)    on delete cascade,
  division_id   uuid        not null references public.divisions(id)  on delete cascade,
  home_team_id  uuid        not null references public.teams(id)      on delete restrict,
  away_team_id  uuid        not null references public.teams(id)      on delete restrict,
  matchday      smallint    not null,   -- round number within the division's schedule
  scheduled_at  timestamptz,
  venue         text,
  status        text        not null default 'scheduled'
                              check (status in ('scheduled', 'played', 'postponed')),
  created_at    timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);
```

// NOTE: The application layer must enforce that `home_team_id` and `away_team_id` both belong to `division_id`. This cannot be expressed as a simple SQL constraint given the team→division FK, so enforce it in the fixture generation logic and in the RLS/trigger layer if needed.

// NOTE: `Fixture` in types.ts has `home`, `homeColor`, `away`, `awayColor` as flat display strings. In queries these come from JOINing `teams.name` and `teams.color_hex` on `home_team_id` / `away_team_id`. Add a `FixtureRow` type to types.ts that mirrors the JOIN result when wiring real data.

// NOTE: `Fixture.when` in types.ts is a pre-formatted string (e.g. "Sun 5 Jul 10:00"). Derive from `fixtures.scheduled_at` in the UI using `toLocaleDateString` / `toLocaleTimeString`.

---

### `match_results`

The submitted score for a completed fixture. At most one row per fixture (enforced by `unique` on `fixture_id`).

```sql
create table public.match_results (
  id            uuid        primary key default gen_random_uuid(),
  fixture_id    uuid        not null unique references public.fixtures(id) on delete cascade,
  submitted_by  uuid        not null references public.users(id) on delete restrict,
  home_score    smallint    not null check (home_score >= 0),
  away_score    smallint    not null check (away_score >= 0),
  submitted_at  timestamptz not null default now()
);
```

---

### `player_stats`

Goals and assists per player per fixture. Submitted by the organizer or captain after a match, using the step-2 modal in `/team` → Fixtures → Submit result.

```sql
create table public.player_stats (
  id          uuid      primary key default gen_random_uuid(),
  fixture_id  uuid      not null references public.fixtures(id)  on delete cascade,
  user_id     uuid      not null references public.users(id)     on delete cascade,
  team_id     uuid      not null references public.teams(id)     on delete restrict,
  goals       smallint  not null default 0 check (goals   >= 0),
  assists     smallint  not null default 0 check (assists >= 0),
  unique (fixture_id, user_id)
);
```

// NOTE: The profile page shows a MOTM stat card (`StatCard value=6 label="MOTM"`). There is no `motm` column in the MVP schema — this is explicitly post-MVP. When implemented, add `motm boolean not null default false` here or `motm_user_id uuid` on `match_results`.

---

### `availability`

Per-player RSVP status for a specific fixture. This is distinct from `team_players.availability`, which is a season-level status. A player can be "available" for the season but RSVP "out" for a particular match.

```sql
create table public.availability (
  id          uuid        primary key default gen_random_uuid(),
  fixture_id  uuid        not null references public.fixtures(id) on delete cascade,
  user_id     uuid        not null references public.users(id)    on delete cascade,
  status      text        not null check (status in ('available', 'doubtful', 'out')),
  updated_at  timestamptz not null default now(),
  unique (fixture_id, user_id)
);
```

The absence of a row is treated as "pending" / unknown by the UI (neither confirmed nor declined). The RSVP widget on `/schedule` upserts into this table.

When a fixture is scheduled, the app checks each player's blockers against `fixtures.scheduled_at` and pre-populates an `availability` row with `status = 'out'` for any player whose blocker covers that time. Players can override this manually — blockers are hints, not locks.

---

### `recurring_blockers`

A repeating weekly window when a player is regularly unavailable. Used by the smart scheduling engine to score candidate match times and to pre-populate per-fixture RSVP.

```sql
create table public.recurring_blockers (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.users(id) on delete cascade,
  days        smallint[]  not null, -- ISO day-of-week: 1=Mon … 7=Sun
  time_start  time        not null, -- e.g. 09:00
  time_end    time        not null, -- e.g. 17:30
  label       text,                 -- optional human label, e.g. "Work hours"
  created_at  timestamptz not null default now(),
  check (time_end > time_start)
);
```

**Column notes:**

| Column | Notes |
|---|---|
| `days` | Array of ISO weekday integers. `{1,2,3,4,5}` = Mon–Fri. Allows non-contiguous patterns like `{2,4}` (Tue & Thu). |
| `time_start` / `time_end` | Wall-clock time in the user's local time zone (stored as `time without time zone`; the UI handles zone conversion). |
| `label` | Optional display label shown in the player's profile availability settings. |

// NOTE: A player can have multiple recurring blockers (e.g. separate work hours and a weekly training session with another team). There is no unique constraint beyond `user_id` + the time/day combination; application logic should warn on overlapping entries.

---

### `oneoff_blockers`

A specific date range when a player is unavailable. Overrides or supplements recurring blockers for that period.

```sql
create table public.oneoff_blockers (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.users(id) on delete cascade,
  date_start  date        not null,
  date_end    date        not null, -- inclusive
  label       text,                 -- e.g. "Holiday", "Away for work"
  created_at  timestamptz not null default now(),
  check (date_end >= date_start)
);
```

A single-day absence is represented as `date_start = date_end`. The scheduling engine treats any fixture whose `scheduled_at` falls within `[date_start, date_end]` as blocked for this player, regardless of time of day.

---

### Scheduling engine (application layer)

The smart scheduling suggestion logic runs in the application layer via a dedicated API route (`POST /api/schedule/suggest`). There is no stored procedure for it — the scoring logic is too dynamic to express cleanly in SQL — but **the data fetch must be a single query, not a sequence of per-player lookups.**

On Vercel, each API route invocation is a stateless serverless function. Fetching rosters and then looping over each player to fetch their blockers is an N+1 pattern: for two 11-a-side squads that's 22+ sequential round-trips to Supabase, each adding ~10–50ms of network latency. At scale this will breach the 10s Hobby timeout and produce a poor experience even on Pro.

**The correct approach: one query that returns all relevant blockers for both squads at once.**

```sql
-- Fetch all players on both teams and their blockers in a single round-trip.
-- Run via supabase.rpc('get_squad_availability', { home_team_id, away_team_id })

select
  tp.user_id,
  tp.team_id,
  rb.days          as recurring_days,
  rb.time_start    as recurring_start,
  rb.time_end      as recurring_end,
  ob.date_start    as oneoff_start,
  ob.date_end      as oneoff_end
from public.team_players tp
left join public.recurring_blockers rb on rb.user_id = tp.user_id
left join public.oneoff_blockers    ob on ob.user_id = tp.user_id
where tp.team_id in ($home_team_id, $away_team_id)
  and tp.status = 'active';
```

This returns one row per player-blocker combination (a player with two recurring blockers appears twice). The application layer then:

1. Groups rows by `user_id` to build a blocker map in memory.
2. Iterates over candidate slots (derived from the league's `day_of_week` config and a configurable time window — typically the next 4–6 weeks of valid match days).
3. For each slot, checks each player's in-memory blockers: does the slot's weekday + time overlap a recurring blocker? Does the slot's date fall within a one-off blocker?
4. Scores the slot: `(free_home + free_away) / (total_home + total_away)`.
5. Returns the top N slots with per-team conflict breakdowns.

This is one database round-trip regardless of squad size. Results are not cached — blocker data is always read fresh when the organizer opens the scheduling flow.


---

### `league_applications`

A pending request from a user to join a public league with a new team. Covers the "Join" button flow on `/discover`.

Teams are league-scoped in this schema — a team is created when the application is approved, not before. The application captures the proposed team identity so the organizer can review it before creating the team row.

```sql
create table public.league_applications (
  id              uuid        primary key default gen_random_uuid(),
  league_id       uuid        not null references public.leagues(id) on delete cascade,
  applicant_id    uuid        not null references public.users(id)   on delete restrict,
  team_name       text        not null,
  team_initials   text        not null check (length(team_initials) between 2 and 3),
  team_color      text        not null default '#1f9a52',
  message         text,                 -- optional note from the applicant
  status          text        not null default 'pending'
                                check (status in ('pending', 'approved', 'rejected')),
  resolved_by     uuid        references public.users(id) on delete set null,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  unique (league_id, applicant_id)      -- one active application per user per league
);
```

**On approval (application layer):**
1. `INSERT INTO public.teams (league_id, captain_id, name, initials, color_hex)` using the application's fields.
2. `INSERT INTO public.team_players (team_id, user_id, status = 'active')` for the applicant.
3. `UPDATE public.league_applications SET status = 'approved', resolved_by = organizer_id, resolved_at = now()`.

**On rejection:**
1. `UPDATE public.league_applications SET status = 'rejected', resolved_by, resolved_at`.

The `unique (league_id, applicant_id)` constraint prevents duplicate applications. A rejected applicant would need their row deleted (by the organizer) before re-applying.

---

## Recommended Indexes

```sql
-- leagues
create index on public.leagues (organizer_id);
create index on public.leagues (visibility);         -- Discover page filter

-- divisions
create index on public.divisions (league_id);        -- "all divisions in a league" queries
create index on public.divisions (sort_order);       -- ordered division list

-- teams
create index on public.teams (division_id);          -- replaces the old league_id index
create index on public.teams (captain_id);           -- RLS captain checks

-- team_players
create index on public.team_players (user_id);       -- "my teams" profile query
create index on public.team_players (team_id);       -- roster queries

-- fixtures
create index on public.fixtures (season_id);
create index on public.fixtures (division_id);       -- division standings / schedule queries
create index on public.fixtures (home_team_id);
create index on public.fixtures (away_team_id);
create index on public.fixtures (scheduled_at);      -- upcoming-match queries

-- player_stats
create index on public.player_stats (user_id);       -- profile career totals
create index on public.player_stats (fixture_id);    -- per-match breakdown
create index on public.player_stats (team_id);       -- team stats tab

-- league_applications
create index on public.league_applications (league_id);    -- organizer review list
create index on public.league_applications (applicant_id); -- user's pending applications
create index on public.league_applications (status);       -- filter pending/approved

-- blockers
create index on public.recurring_blockers (user_id);       -- player's own blocker list
create index on public.oneoff_blockers (user_id);          -- player's own blocker list
create index on public.oneoff_blockers (date_start, date_end); -- range overlap queries
```

---

## Views

### `public.standings`

Standings are **computed from results, never stored as a table.** Points use the league's configurable `points_win` and `points_draw` values rather than hardcoded 3/1. Standings are scoped to a division — each division has its own independent table.

```sql
create or replace view public.standings as
select
  t.id                                                              as team_id,
  t.name,
  t.initials,
  t.color_hex                                                       as crest_color,
  t.division_id,
  d.league_id,
  s.id                                                              as season_id,

  count(mr.id)                                                      as played,

  count(mr.id) filter (
    where (f.home_team_id = t.id and mr.home_score > mr.away_score)
       or (f.away_team_id = t.id and mr.away_score > mr.home_score)
  )                                                                 as won,

  count(mr.id) filter (
    where mr.home_score = mr.away_score
  )                                                                 as drawn,

  count(mr.id) filter (
    where (f.home_team_id = t.id and mr.home_score < mr.away_score)
       or (f.away_team_id = t.id and mr.away_score < mr.home_score)
  )                                                                 as lost,

  coalesce(sum(
    case when f.home_team_id = t.id then mr.home_score
         else mr.away_score end
  ), 0)                                                             as goals_for,

  coalesce(sum(
    case when f.home_team_id = t.id then mr.away_score
         else mr.home_score end
  ), 0)                                                             as goals_against,

  coalesce(sum(
    case when f.home_team_id = t.id
         then mr.home_score - mr.away_score
         else mr.away_score - mr.home_score end
  ), 0)                                                             as goal_difference,

  -- Points use the league's configured values, not hardcoded 3/1
  (
    count(mr.id) filter (
      where (f.home_team_id = t.id and mr.home_score > mr.away_score)
         or (f.away_team_id = t.id and mr.away_score > mr.home_score)
    ) * l.points_win
    +
    count(mr.id) filter (
      where mr.home_score = mr.away_score
    ) * l.points_draw
  )                                                                 as points

from
  public.teams          t
  join public.divisions d  on d.id          = t.division_id
  join public.leagues   l  on l.id          = d.league_id
  join public.seasons   s  on s.league_id   = d.league_id
  left join public.fixtures f
    on  f.season_id    = s.id
    and f.division_id  = t.division_id
    and (f.home_team_id = t.id or f.away_team_id = t.id)
  left join public.match_results mr on mr.fixture_id = f.id

group by
  t.id, t.name, t.initials, t.color_hex, t.division_id,
  d.league_id,
  s.id,
  l.points_win, l.points_draw;
```

**Fetch standings for a specific division in a season:**

```sql
select *
from   public.standings
where  season_id   = $1
  and  division_id = $2
order  by points desc, goal_difference desc, goals_for desc, name asc;
```

**Zone highlighting (promotion / relegation)** is a UI-layer concern, using the division's own thresholds. It is purely visual — zones indicate where teams stand relative to the organizer's configured thresholds, but do not trigger any automatic action. If both `promotion_spots` and `relegation_spots` are `0`, no zones are shown.

```ts
// After fetching sorted standings for a division, add zone to each row:
const total = rows.length;
const { promotion_spots, relegation_spots } = division; // from divisions table

rows.forEach((row, idx) => {
  const position = idx + 1; // 1-based
  row.zone =
    promotion_spots > 0 && position <= promotion_spots         ? "promotion" :
    relegation_spots > 0 && position > total - relegation_spots ? "relegation" :
    null;
});
```

---

## Functions

### `public.team_form(p_team_id, p_season_id, p_limit)`

Returns the last `p_limit` match results for a team in a season as a `text[]` array of `'W'`, `'D'`, or `'L'`, ordered most-recent first. Used to populate `TeamStanding.form` on the standings page.

```sql
create or replace function public.team_form(
  p_team_id   uuid,
  p_season_id uuid,
  p_limit     int default 5
)
returns text[]
language sql
stable
as $$
  select array_agg(result order by matchday desc)
  from (
    select
      f.matchday,
      case
        when (f.home_team_id = p_team_id and mr.home_score > mr.away_score)
          or (f.away_team_id = p_team_id and mr.away_score > mr.home_score) then 'W'
        when mr.home_score = mr.away_score                                   then 'D'
        else                                                                      'L'
      end as result
    from   public.fixtures       f
    join   public.match_results  mr on mr.fixture_id = f.id
    where  f.season_id    = p_season_id
      and  (f.home_team_id = p_team_id or f.away_team_id = p_team_id)
    order  by f.matchday desc
    limit  p_limit
  ) sub;
$$;
```

**Usage when fetching standings:**

```ts
// After fetching a standings row, call the function for each team:
const { data: form } = await supabase.rpc("team_form", {
  p_team_id:   row.team_id,
  p_season_id: row.season_id,
  p_limit:     5,
});
row.form = form ?? []; // FormResult[]
```

---

## Sample Queries

### Top scorers for a season

```sql
select
  u.display_name,
  t.name        as team_name,
  t.color_hex,
  sum(ps.goals) as goals
from   public.player_stats ps
join   public.users    u  on u.id  = ps.user_id
join   public.teams    t  on t.id  = ps.team_id
join   public.fixtures f  on f.id  = ps.fixture_id
where  f.season_id = $1
  and  ps.goals > 0
group  by u.id, u.display_name, t.id, t.name, t.color_hex
order  by goals desc
limit  10;
```

### Career stats for a player profile

```sql
select
  count(distinct ps.fixture_id)  as matches,
  sum(ps.goals)                  as goals,
  sum(ps.assists)                as assists,
  round(
    count(distinct ps.fixture_id) filter (
      where (f.home_team_id = ps.team_id and mr.home_score > mr.away_score)
         or (f.away_team_id = ps.team_id and mr.away_score > mr.home_score)
    )::numeric
    / nullif(count(distinct ps.fixture_id), 0) * 100
  , 0)                           as win_rate_pct
from   public.player_stats  ps
join   public.fixtures       f  on f.id  = ps.fixture_id
join   public.match_results  mr on mr.fixture_id = f.id
where  ps.user_id = $1;
```

### Squad availability summary for next fixture

```sql
select
  count(*) filter (where a.status = 'available' or a.id is null)  as total_squad,
  count(*) filter (where a.status = 'available')                   as confirmed,
  count(*) filter (where a.status = 'out')                         as out,
  count(*) filter (where a.id is null)                             as pending
from   public.team_players  tp
left   join public.availability a
         on a.fixture_id = $fixture_id
        and a.user_id    = tp.user_id
where  tp.team_id = $team_id
  and  tp.status  = 'active';
```

### Pending league applications for an organizer

```sql
select
  la.id,
  la.team_name,
  la.team_initials,
  la.team_color,
  la.message,
  la.created_at,
  u.display_name  as applicant_name,
  u.email         as applicant_email
from   public.league_applications la
join   public.users u on u.id = la.applicant_id
where  la.league_id = $1
  and  la.status    = 'pending'
order  by la.created_at asc;
```

---

## RLS Policy Intentions

Enable row-level security on all tables. The patterns below define intent — actual policy SQL should be written when Supabase is wired up.

### `users`
- Any authenticated user can read all public profiles.
- A user can only update their own row (`id = auth.uid()`).

### `leagues`
- Any user (including anonymous) can read leagues where `visibility = 'public'`.
- Authenticated users can read private leagues they organize or belong to (via `team_players`).
- Only the organizer (`organizer_id = auth.uid()`) can insert, update, or delete their league.

### `divisions`
- Any user can read divisions belonging to a public league.
- Authenticated users can read divisions of private leagues they organize or belong to.
- Only the league organizer can insert, update, or delete divisions within their league.

### `teams`
- Any user can read teams that belong to a public league (via `teams → divisions → leagues`).
- Only the team captain (`captain_id = auth.uid()`) can update team details.
- Only the league organizer can delete a team from their league.

### `team_players`
- Any user can read active roster rows for public league teams.
- Only the team captain can insert rows (send invites) or update `position`, `jersey_number`, `availability`, `status` for other players.
- A player can update their own `status` row (e.g. accept an invite by setting `status = 'active'`) and their own `availability`.

### `seasons`
- Any user can read seasons.
- Only the league organizer can insert, update, or delete seasons.

### `fixtures`
- Any user can read fixtures.
- Only the league organizer can insert, update, or delete fixtures.

### `match_results`
- Any user can read match results.
- Only the league organizer **or** the captain of the home or away team may insert a result.
- Results cannot be deleted. The organizer may issue a correcting update.

### `player_stats`
- Any user can read player stats.
- Only the league organizer or the captain of the relevant team can insert or update stat rows for a fixture.

### `availability`
- Any authenticated user can read availability for fixtures involving their team.
- A user can only insert or update their own row (`user_id = auth.uid()`).

### `recurring_blockers`
- A user can only read, insert, update, or delete their own rows (`user_id = auth.uid()`).
- Captains and organizers can read the blocker data for players on their teams in aggregate (via the scheduling engine) but not at the individual row level. The scheduling engine runs server-side with elevated privileges and returns only conflict counts, not the underlying blocker records.

### `oneoff_blockers`
- Same policy as `recurring_blockers`.

### `league_applications`
- An authenticated user can insert a row for themselves (`applicant_id = auth.uid()`), subject to the unique constraint preventing duplicate applications.
- A user can read their own applications.
- The league organizer (`leagues.organizer_id = auth.uid()`) can read all applications for their league and update `status`, `resolved_by`, `resolved_at`.
- Applications cannot be deleted by applicants — only by the organizer (to allow a re-application after rejection).
