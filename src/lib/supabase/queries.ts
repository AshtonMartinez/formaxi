import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "./server";
import type {
  TeamStanding,
  TopScorer,
  Fixture,
  ScheduleMatch,
  Player,
  LeagueCard,
  FormResult,
  LeagueApplication,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Server Supabase client + current-context resolution
// ---------------------------------------------------------------------------

// One Supabase client per request (memoized with React cache). We call
// getUser() once here to hydrate the auth session — without this, a freshly
// created @supabase/ssr client sends PostgREST requests WITHOUT the user's
// access token, so every query/mutation runs as `anon` and authenticated
// writes fail RLS. Reusing a single hydrated client keeps the user's JWT
// attached to all reads and writes for the rest of the request.
export const getServerClient = cache(async () => {
  const supabase = createClient(await cookies());
  await supabase.auth.getUser();
  return supabase;
});

export interface SessionUser {
  id: string;
  email: string | null;
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
});

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  preferred_position: string | null;
  match_reminder_enabled: boolean;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("id, email, display_name, avatar_url, preferred_position, match_reminder_enabled")
    .eq("id", user.id)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export interface SidebarContext {
  displayName: string;
  initials: string;
  roleLine: string;
  leagueName: string;
}

/** Lightweight identity for the sidebar/header. Null when signed out. */
export async function getSidebarContext(): Promise<SidebarContext | null> {
  const profile = await getProfile();
  if (!profile) return null;
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("team_players")
    .select("teams(name, captain_id, divisions(leagues(name)))")
    .eq("user_id", profile.id)
    .neq("status", "left")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const team = (data as unknown as {
    teams?: { name: string; captain_id: string; divisions?: { leagues?: { name: string } } };
  } | null)?.teams;
  const isCaptain = team?.captain_id === profile.id;
  return {
    displayName: profile.display_name,
    initials: initialsOf(profile.display_name),
    roleLine: team ? `${isCaptain ? "Captain" : "Player"} · ${team.name}` : "No team yet",
    leagueName: team?.divisions?.leagues?.name ?? "Football League Manager",
  };
}

/**
 * Resolve the league this user is most associated with: one they organize,
 * else one they play in, else the first public league. Returns null only when
 * no league exists at all.
 */
async function resolvePrimaryLeagueId(userId: string | null): Promise<string | null> {
  const supabase = await getServerClient();

  if (userId) {
    const { data: organized } = await supabase
      .from("leagues")
      .select("id")
      .eq("organizer_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (organized?.id) return organized.id as string;

    const { data: membership } = await supabase
      .from("team_players")
      .select("teams(divisions(league_id))")
      .eq("user_id", userId)
      .neq("status", "left")
      .limit(1)
      .maybeSingle();
    const leagueId = (membership as unknown as { teams?: { divisions?: { league_id?: string } } } | null)
      ?.teams?.divisions?.league_id;
    if (leagueId) return leagueId;
  }

  const { data: pub } = await supabase
    .from("leagues")
    .select("id")
    .eq("visibility", "public")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (pub?.id as string) ?? null;
}

interface LeagueRow {
  id: string;
  name: string;
  slug: string;
  format: string;
  location: string;
  day_of_week: string | null;
  fee_cents: number;
  visibility: string;
  rounds: string;
  organizer_id: string;
  points_win: number;
  points_draw: number;
}

interface SeasonRow {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
}

interface DivisionRow {
  id: string;
  name: string;
  sort_order: number;
  max_teams: number;
  promotion_spots: number;
  relegation_spots: number;
}

async function getLeague(leagueId: string): Promise<LeagueRow | null> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("leagues")
    .select(
      "id, name, slug, format, location, day_of_week, fee_cents, visibility, rounds, organizer_id, points_win, points_draw",
    )
    .eq("id", leagueId)
    .maybeSingle();
  return (data as LeagueRow) ?? null;
}

/** Latest season for a league — an active one if present, else the newest. */
async function getCurrentSeason(leagueId: string): Promise<SeasonRow | null> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("seasons")
    .select("id, name, status, start_date")
    .eq("league_id", leagueId)
    .order("status", { ascending: true }) // 'active' sorts before 'upcoming'/'completed'
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as SeasonRow) ?? null;
}

async function getDefaultDivision(leagueId: string): Promise<DivisionRow | null> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("divisions")
    .select("id, name, sort_order, max_teams, promotion_spots, relegation_spots")
    .eq("league_id", leagueId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as DivisionRow) ?? null;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function whenString(iso: string | null): string {
  if (!iso) return "Time TBC";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ---------------------------------------------------------------------------
// Standings page
// ---------------------------------------------------------------------------

interface StandingsViewRow {
  team_id: string;
  name: string;
  initials: string;
  crest_color: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface StandingsMeta {
  leagueName: string;
  format: string;
  location: string;
  seasonName: string;
  divisionName: string;
  teamCount: number;
  playedCount: number;
  goalCount: number;
  nextMatchday: number | null;
  isOrganizer: boolean;
}

export interface StandingsData {
  meta: StandingsMeta;
  standings: TeamStanding[];
  scorers: TopScorer[];
  fixtures: (Fixture & { id: string })[];
}

export async function getStandingsData(): Promise<StandingsData | null> {
  const supabase = await getServerClient();
  const user = await getSessionUser();
  const leagueId = await resolvePrimaryLeagueId(user?.id ?? null);
  if (!leagueId) return null;

  const [league, season, division] = await Promise.all([
    getLeague(leagueId),
    getCurrentSeason(leagueId),
    getDefaultDivision(leagueId),
  ]);
  if (!league || !season || !division) return null;

  // Standings rows (live view)
  const { data: rawRows } = await supabase
    .from("standings")
    .select(
      "team_id, name, initials, crest_color, played, won, drawn, lost, goals_for, goals_against, goal_difference, points",
    )
    .eq("season_id", season.id)
    .eq("division_id", division.id)
    .order("points", { ascending: false })
    .order("goal_difference", { ascending: false })
    .order("goals_for", { ascending: false })
    .order("name", { ascending: true });

  const rows = (rawRows ?? []) as StandingsViewRow[];

  // Form guides (last 5) per team
  const forms = await Promise.all(
    rows.map((r) =>
      supabase
        .rpc("team_form", { p_team_id: r.team_id, p_season_id: season.id, p_limit: 5 })
        .then(({ data }) => (data ?? []) as FormResult[]),
    ),
  );

  const total = rows.length;
  const standings: TeamStanding[] = rows.map((r, i) => {
    const position = i + 1;
    const zone: TeamStanding["zone"] =
      division.promotion_spots > 0 && position <= division.promotion_spots
        ? "promotion"
        : division.relegation_spots > 0 && position > total - division.relegation_spots
          ? "relegation"
          : null;
    return {
      position,
      name: r.name,
      initials: r.initials,
      crestColor: r.crest_color,
      played: r.played,
      won: r.won,
      drawn: r.drawn,
      lost: r.lost,
      goalsFor: r.goals_for,
      goalsAgainst: r.goals_against,
      goalDiff: r.goal_difference,
      points: r.points,
      form: forms[i],
      zone,
    };
  });

  // Top scorers for the season
  const { data: statRows } = await supabase
    .from("player_stats")
    .select("goals, users(display_name), teams(name, color_hex), fixtures!inner(season_id)")
    .eq("fixtures.season_id", season.id)
    .gt("goals", 0);

  const scorerMap = new Map<string, TopScorer>();
  for (const row of (statRows ?? []) as unknown as Array<{
    goals: number;
    users: { display_name: string } | null;
    teams: { name: string; color_hex: string } | null;
  }>) {
    const name = row.users?.display_name ?? "Unknown";
    const team = row.teams?.name ?? "";
    const key = `${name}|${team}`;
    const existing = scorerMap.get(key);
    if (existing) existing.goals += row.goals;
    else
      scorerMap.set(key, {
        rank: 0,
        name,
        team,
        crestColor: row.teams?.color_hex ?? "#33433a",
        goals: row.goals,
      });
  }
  const scorers = [...scorerMap.values()]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  // Next scheduled fixtures
  const { data: fixtureRows } = await supabase
    .from("fixtures")
    .select(
      "id, scheduled_at, venue, matchday, home:teams!fixtures_home_team_id_fkey(name, color_hex), away:teams!fixtures_away_team_id_fkey(name, color_hex)",
    )
    .eq("season_id", season.id)
    .eq("division_id", division.id)
    .eq("status", "scheduled")
    .order("matchday", { ascending: true })
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .limit(8);

  const fxRows = (fixtureRows ?? []) as unknown as Array<{
    id: string;
    scheduled_at: string | null;
    venue: string | null;
    matchday: number;
    home: { name: string; color_hex: string } | null;
    away: { name: string; color_hex: string } | null;
  }>;
  const nextMatchday = fxRows[0]?.matchday ?? null;
  const fixtures = fxRows
    .filter((f) => nextMatchday === null || f.matchday === nextMatchday)
    .map((f) => ({
      id: f.id,
      home: f.home?.name ?? "TBC",
      homeColor: f.home?.color_hex ?? "#33433a",
      away: f.away?.name ?? "TBC",
      awayColor: f.away?.color_hex ?? "#33433a",
      when: whenString(f.scheduled_at),
      venue: f.venue ?? "Venue TBC",
    }));

  // Season totals
  const teamCount = rows.length;
  const playedCount = Math.round(rows.reduce((sum, r) => sum + r.played, 0) / 2);
  const goalCount = rows.reduce((sum, r) => sum + r.goals_for, 0);

  return {
    meta: {
      leagueName: league.name,
      format: league.format,
      location: league.location,
      seasonName: season.name,
      divisionName: division.name,
      teamCount,
      playedCount,
      goalCount,
      nextMatchday,
      isOrganizer: !!user && user.id === league.organizer_id,
    },
    standings,
    scorers,
    fixtures,
  };
}

// ---------------------------------------------------------------------------
// Shared: resolve the signed-in user's primary team
// ---------------------------------------------------------------------------

interface TeamRow {
  id: string;
  name: string;
  color_hex: string;
  initials: string;
  home_venue: string | null;
  founded_year: number | null;
  captain_id: string;
  division_id: string;
}

async function resolvePrimaryTeam(userId: string): Promise<TeamRow | null> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("team_players")
    .select(
      "teams(id, name, color_hex, initials, home_venue, founded_year, captain_id, division_id)",
    )
    .eq("user_id", userId)
    .neq("status", "left")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return ((data as unknown as { teams?: TeamRow } | null)?.teams as TeamRow) ?? null;
}

// ---------------------------------------------------------------------------
// Schedule page
// ---------------------------------------------------------------------------

export interface NextMatchInfo {
  fixtureId: string;
  homeName: string;
  homeInitials: string;
  homeColor: string;
  awayName: string;
  awayInitials: string;
  awayColor: string;
  when: string;
  venue: string;
  myRsvp: "available" | "doubtful" | "out" | null;
  confirmed: number;
  out: number;
  pending: number;
}

export interface ScheduleData {
  teamName: string;
  teamInitials: string;
  teamColor: string;
  matches: ScheduleMatch[];
  nextMatch: NextMatchInfo | null;
}

export async function getScheduleData(): Promise<ScheduleData | null> {
  const supabase = await getServerClient();
  const user = await getSessionUser();
  if (!user) return null;
  const team = await resolvePrimaryTeam(user.id);
  if (!team) return null;

  const { data: fxRows } = await supabase
    .from("fixtures")
    .select(
      "id, scheduled_at, venue, status, home_team_id, away_team_id, home:teams!fixtures_home_team_id_fkey(name, initials, color_hex), away:teams!fixtures_away_team_id_fkey(name, initials, color_hex)",
    )
    .eq("division_id", team.division_id)
    .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  type FxRow = {
    id: string;
    scheduled_at: string | null;
    venue: string | null;
    status: string;
    home_team_id: string;
    away_team_id: string;
    home: { name: string; initials: string; color_hex: string } | null;
    away: { name: string; initials: string; color_hex: string } | null;
  };
  const fixtures = (fxRows ?? []) as unknown as FxRow[];

  const matches: ScheduleMatch[] = fixtures.map((f) => {
    const isHome = f.home_team_id === team.id;
    const opp = isHome ? f.away : f.home;
    const d = f.scheduled_at ? new Date(f.scheduled_at) : null;
    const needsRsvp = f.status === "scheduled" && !!f.scheduled_at;
    return {
      month: d ? MONTHS[d.getMonth()] : "TBC",
      year: d ? d.getFullYear() : 0,
      day: d ? String(d.getDate()).padStart(2, "0") : "--",
      time: d
        ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
        : "--:--",
      opponent: opp?.name ?? "TBC",
      opponentShort: opp?.initials ?? "?",
      opponentColor: opp?.color_hex ?? "#33433a",
      homeAway: isHome ? "Home" : "Away",
      venue: f.venue ?? "Venue TBC",
      status: needsRsvp ? "RSVP" : f.status === "played" ? "Played" : "Scheduled",
      statusVariant: needsRsvp ? "action" : "neutral",
    };
  });

  // Next upcoming fixture with a kickoff time
  const now = Date.now();
  const upcoming = fixtures.find(
    (f) => f.status === "scheduled" && f.scheduled_at && new Date(f.scheduled_at).getTime() >= now,
  );

  let nextMatch: NextMatchInfo | null = null;
  if (upcoming) {
    const [{ data: availRows }, { data: myAvail }, { count: squadCount }] = await Promise.all([
      supabase.from("availability").select("status").eq("fixture_id", upcoming.id),
      supabase
        .from("availability")
        .select("status")
        .eq("fixture_id", upcoming.id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("team_players")
        .select("id", { count: "exact", head: true })
        .eq("team_id", team.id)
        .eq("status", "active"),
    ]);

    const statuses = (availRows ?? []) as { status: string }[];
    const confirmed = statuses.filter((s) => s.status === "available").length;
    const out = statuses.filter((s) => s.status === "out").length;
    const squad = squadCount ?? statuses.length;
    const responded = statuses.length;
    const pending = Math.max(0, squad - responded);

    nextMatch = {
      fixtureId: upcoming.id,
      homeName: upcoming.home?.name ?? "TBC",
      homeInitials: upcoming.home?.initials ?? "?",
      homeColor: upcoming.home?.color_hex ?? "#33433a",
      awayName: upcoming.away?.name ?? "TBC",
      awayInitials: upcoming.away?.initials ?? "?",
      awayColor: upcoming.away?.color_hex ?? "#33433a",
      when: whenString(upcoming.scheduled_at),
      venue: upcoming.venue ?? "Venue TBC",
      myRsvp: (myAvail as unknown as { status: NextMatchInfo["myRsvp"] } | null)?.status ?? null,
      confirmed,
      out,
      pending,
    };
  }

  return {
    teamName: team.name,
    teamInitials: team.initials,
    teamColor: team.color_hex,
    matches,
    nextMatch,
  };
}

// ---------------------------------------------------------------------------
// Team page
// ---------------------------------------------------------------------------

export interface TeamFixtureVM {
  id: string;
  date: string;
  opponent: string;
  opponentShort: string;
  opponentColor: string;
  homeAway: "Home" | "Away";
  score: string | null;
  result: FormResult | null;
  pendingScore: boolean;
}

export interface TeamPageData {
  team: {
    id: string;
    name: string;
    initials: string;
    color: string;
    venue: string | null;
    founded: number | null;
    isCaptain: boolean;
    leagueName: string;
    divisionName: string;
    seasonName: string;
  };
  hero: { position: number | null; record: string; squadCount: number };
  squad: Player[];
  rosterForStats: { userId: string; name: string; color: string; isCaptain: boolean }[];
  fixtures: TeamFixtureVM[];
  playerStats: { name: string; pos: string; goals: number; assists: number; apps: number }[];
  seasonForm: { goalsFor: number; goalsAgainst: number; goalDiff: number; winRatePct: number };
}

export async function getTeamPageData(): Promise<TeamPageData | null> {
  const supabase = await getServerClient();
  const user = await getSessionUser();
  if (!user) return null;
  const team = await resolvePrimaryTeam(user.id);
  if (!team) return null;

  const { data: division } = await supabase
    .from("divisions")
    .select("name, league_id, promotion_spots, relegation_spots")
    .eq("id", team.division_id)
    .maybeSingle();
  const leagueId = (division as { league_id?: string } | null)?.league_id ?? null;
  const [league, season] = await Promise.all([
    leagueId ? getLeague(leagueId) : Promise.resolve(null),
    leagueId ? getCurrentSeason(leagueId) : Promise.resolve(null),
  ]);

  // Roster
  const { data: rosterRows } = await supabase
    .from("team_players")
    .select("user_id, jersey_number, position, availability, status, users(display_name)")
    .eq("team_id", team.id)
    .neq("status", "left")
    .order("jersey_number", { ascending: true, nullsFirst: false });

  type Roster = {
    user_id: string;
    jersey_number: number | null;
    position: string | null;
    availability: Player["availability"];
    users: { display_name: string } | null;
  };
  const roster = (rosterRows ?? []) as unknown as Roster[];

  // Per-player season stats (goals/assists/apps) for this team
  const statsByUser = new Map<string, { goals: number; assists: number; apps: number }>();
  if (season) {
    const { data: psRows } = await supabase
      .from("player_stats")
      .select("user_id, goals, assists, fixtures!inner(season_id)")
      .eq("team_id", team.id)
      .eq("fixtures.season_id", season.id);
    for (const ps of (psRows ?? []) as unknown as Array<{
      user_id: string;
      goals: number;
      assists: number;
    }>) {
      const cur = statsByUser.get(ps.user_id) ?? { goals: 0, assists: 0, apps: 0 };
      cur.goals += ps.goals;
      cur.assists += ps.assists;
      cur.apps += 1;
      statsByUser.set(ps.user_id, cur);
    }
  }

  const CREST = ["#1f9a52", "#3b82f6", "#ff6a3d", "#8b5cf6", "#eab308", "#ec4899", "#06b6d4", "#ef4444"];
  const squad: Player[] = roster.map((r, i) => {
    const st = statsByUser.get(r.user_id) ?? { goals: 0, assists: 0, apps: 0 };
    return {
      number: r.jersey_number != null ? String(r.jersey_number) : "—",
      name: r.users?.display_name ?? "Unknown",
      position: r.position ?? "—",
      appearances: st.apps,
      goalsAssists: `${st.goals}/${st.assists}`,
      availability: r.availability,
      isCaptain: r.user_id === team.captain_id,
      avatarColor: CREST[i % CREST.length],
    };
  });

  const rosterForStats = roster.map((r, i) => ({
    userId: r.user_id,
    name: r.users?.display_name ?? "Unknown",
    color: CREST[i % CREST.length],
    isCaptain: r.user_id === team.captain_id,
  }));

  const playerStats = roster
    .map((r) => {
      const st = statsByUser.get(r.user_id) ?? { goals: 0, assists: 0, apps: 0 };
      return {
        name: r.users?.display_name ?? "Unknown",
        pos: r.position ?? "—",
        goals: st.goals,
        assists: st.assists,
        apps: st.apps,
      };
    })
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists));

  // Team fixtures with results
  const { data: tfRows } = season
    ? await supabase
        .from("fixtures")
        .select(
          "id, scheduled_at, status, home_team_id, away_team_id, home:teams!fixtures_home_team_id_fkey(initials, color_hex, name), away:teams!fixtures_away_team_id_fkey(initials, color_hex, name), match_results(home_score, away_score)",
        )
        .eq("season_id", season.id)
        .eq("division_id", team.division_id)
        .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
        .order("scheduled_at", { ascending: true, nullsFirst: false })
    : { data: [] };

  type TFRow = {
    id: string;
    scheduled_at: string | null;
    status: string;
    home_team_id: string;
    away_team_id: string;
    home: { initials: string; color_hex: string; name: string } | null;
    away: { initials: string; color_hex: string; name: string } | null;
    match_results: { home_score: number; away_score: number }[] | null;
  };

  const fixtures: TeamFixtureVM[] = ((tfRows ?? []) as unknown as TFRow[]).map((f) => {
    const isHome = f.home_team_id === team.id;
    const opp = isHome ? f.away : f.home;
    const mr = f.match_results?.[0] ?? null;
    const d = f.scheduled_at ? new Date(f.scheduled_at) : null;
    const dateStr = d
      ? d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
      : "TBC";
    let score: string | null = null;
    let result: FormResult | null = null;
    if (mr) {
      const us = isHome ? mr.home_score : mr.away_score;
      const them = isHome ? mr.away_score : mr.home_score;
      score = `${us}-${them}`;
      result = us > them ? "W" : us < them ? "L" : "D";
    }
    const inPast = d ? d.getTime() < Date.now() : false;
    return {
      id: f.id,
      date: dateStr,
      opponent: opp?.name ?? "TBC",
      opponentShort: opp?.initials ?? "?",
      opponentColor: opp?.color_hex ?? "#33433a",
      homeAway: isHome ? "Home" : "Away",
      score,
      result,
      pendingScore: !mr && inPast,
    };
  });

  // Hero numbers from the standings view
  let position: number | null = null;
  let record = "0-0-0";
  if (season) {
    const { data: sv } = await supabase
      .from("standings")
      .select("team_id, won, drawn, lost, points, goal_difference, goals_for")
      .eq("season_id", season.id)
      .eq("division_id", team.division_id)
      .order("points", { ascending: false })
      .order("goal_difference", { ascending: false })
      .order("goals_for", { ascending: false });
    const ordered = (sv ?? []) as Array<{
      team_id: string;
      won: number;
      drawn: number;
      lost: number;
    }>;
    const idx = ordered.findIndex((r) => r.team_id === team.id);
    if (idx >= 0) {
      position = idx + 1;
      const r = ordered[idx];
      record = `${r.won}-${r.drawn}-${r.lost}`;
    }
  }

  const gf = playerStats.reduce((s, p) => s + p.goals, 0);
  const seasonForm = (() => {
    const won = Number(record.split("-")[0]) || 0;
    const drawn = Number(record.split("-")[1]) || 0;
    const lost = Number(record.split("-")[2]) || 0;
    const games = won + drawn + lost;
    return {
      goalsFor: gf,
      goalsAgainst: 0,
      goalDiff: 0,
      winRatePct: games ? Math.round((won / games) * 100) : 0,
    };
  })();

  return {
    team: {
      id: team.id,
      name: team.name,
      initials: team.initials,
      color: team.color_hex,
      venue: team.home_venue,
      founded: team.founded_year,
      isCaptain: team.captain_id === user.id,
      leagueName: league?.name ?? "—",
      divisionName: (division as { name?: string } | null)?.name ?? "Division 1",
      seasonName: season?.name ?? "—",
    },
    hero: { position, record, squadCount: roster.length },
    squad,
    rosterForStats,
    fixtures,
    playerStats,
    seasonForm,
  };
}

// ---------------------------------------------------------------------------
// Discover page
// ---------------------------------------------------------------------------

const TAG_THEME: Record<string, { tagBg: string; tagColor: string; banner: string }> = {
  "11-a-side": { tagBg: "rgba(52,224,127,0.18)", tagColor: "#34e07f", banner: "linear-gradient(120deg,#10301d,#0f1b13)" },
  "7-a-side": { tagBg: "rgba(255,106,61,0.2)", tagColor: "#ff9a72", banner: "linear-gradient(120deg,#2e1a12,#0f1b13)" },
  "5-a-side": { tagBg: "rgba(59,130,246,0.2)", tagColor: "#7fb0ff", banner: "linear-gradient(120deg,#13202e,#0f1b13)" },
};

const feeLabel = (cents: number) => (cents > 0 ? `£${(cents / 100).toFixed(0)}` : "Free");

export interface DiscoverLeague extends LeagueCard {
  id: string;
  alreadyApplied: boolean;
}

export async function getDiscoverLeagues(): Promise<DiscoverLeague[]> {
  const supabase = await getServerClient();
  const user = await getSessionUser();

  const { data: leagueRows } = await supabase
    .from("leagues")
    .select(
      "id, name, slug, format, location, day_of_week, fee_cents, divisions(max_teams, teams(id))",
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  type LR = {
    id: string;
    name: string;
    format: string;
    location: string;
    day_of_week: string | null;
    fee_cents: number;
    divisions: { max_teams: number; teams: { id: string }[] | null }[] | null;
  };

  let appliedIds = new Set<string>();
  if (user) {
    const { data: apps } = await supabase
      .from("league_applications")
      .select("league_id")
      .eq("user_id", user.id);
    appliedIds = new Set(((apps ?? []) as { league_id: string }[]).map((a) => a.league_id));
  }

  return ((leagueRows ?? []) as LR[]).map((l) => {
    const capacity = (l.divisions ?? []).reduce((s, d) => s + (d.max_teams ?? 0), 0);
    const teamCount = (l.divisions ?? []).reduce((s, d) => s + (d.teams?.length ?? 0), 0);
    const remaining = capacity - teamCount;
    const spots = remaining <= 0 ? "Waitlist" : remaining >= capacity ? "Open" : `${remaining} spots left`;
    const theme = TAG_THEME[l.format] ?? TAG_THEME["11-a-side"];
    return {
      id: l.id,
      name: l.name,
      initials: initialsOf(l.name),
      crestColor: theme.tagColor,
      format: l.format,
      location: l.location,
      day: l.day_of_week ?? "TBC",
      fee: feeLabel(l.fee_cents),
      spots,
      tagColor: theme.tagColor,
      tagBg: theme.tagBg,
      bannerGradient: theme.banner,
      alreadyApplied: appliedIds.has(l.id),
    };
  });
}

/** Public leagues the create-team wizard can register into. */
export async function getJoinableLeagues(): Promise<
  { id: string; name: string; meta: string; initials: string; bg: string }[]
> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("leagues")
    .select("id, name, format, location, divisions(max_teams, teams(id))")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  type LR = {
    id: string;
    name: string;
    format: string;
    location: string;
    divisions: { max_teams: number; teams: { id: string }[] | null }[] | null;
  };
  const theme = ["#1f9a52", "#3b82f6", "#ff6a3d", "#8b5cf6", "#eab308", "#ec4899"];
  return ((data ?? []) as LR[]).map((l, i) => {
    const capacity = (l.divisions ?? []).reduce((s, d) => s + (d.max_teams ?? 0), 0);
    const teamCount = (l.divisions ?? []).reduce((s, d) => s + (d.teams?.length ?? 0), 0);
    const remaining = capacity - teamCount;
    return {
      id: l.id,
      name: l.name,
      meta: `${l.format} · ${l.location} · ${remaining > 0 ? `${remaining} spots` : "Waitlist"}`,
      initials: initialsOf(l.name),
      bg: theme[i % theme.length],
    };
  });
}

// ---------------------------------------------------------------------------
// Profile page
// ---------------------------------------------------------------------------

export interface ProfileData {
  profile: Profile;
  teams: { id: string; name: string; initials: string; color: string; sub: string; isCaptain: boolean }[];
  invites: LeagueApplication[];
  career: { matches: number; goals: number; assists: number; winRatePct: number };
}

export async function getProfileData(): Promise<ProfileData | null> {
  const supabase = await getServerClient();
  const profile = await getProfile();
  if (!profile) return null;

  const { data: teamRows } = await supabase
    .from("team_players")
    .select("status, teams(id, name, initials, color_hex, captain_id, divisions(name, leagues(name)))")
    .eq("user_id", profile.id)
    .neq("status", "left");

  type TR = {
    teams: {
      id: string;
      name: string;
      initials: string;
      color_hex: string;
      captain_id: string;
      divisions: { name: string; leagues: { name: string } | null } | null;
    } | null;
  };
  const teams = ((teamRows ?? []) as unknown as TR[])
    .filter((r) => r.teams)
    .map((r) => {
      const t = r.teams!;
      const isCaptain = t.captain_id === profile.id;
      const leagueName = t.divisions?.leagues?.name ?? "";
      return {
        id: t.id,
        name: t.name,
        initials: t.initials,
        color: t.color_hex,
        sub: `${isCaptain ? "Captain" : "Player"}${leagueName ? ` · ${leagueName}` : ""}`,
        isCaptain,
      };
    });

  // Pending invitations directed at this user
  const { data: inviteRows } = await supabase
    .from("league_applications")
    .select("id, kind, team_name, team_initials, team_color, message, leagues(name)")
    .eq("user_id", profile.id)
    .eq("kind", "invitation")
    .eq("status", "pending");

  type IR = {
    id: string;
    kind: "invitation";
    team_name: string | null;
    team_initials: string | null;
    team_color: string;
    message: string | null;
    leagues: { name: string } | null;
  };
  const invites: LeagueApplication[] = ((inviteRows ?? []) as unknown as IR[]).map((r) => ({
    id: r.id,
    kind: r.kind,
    teamName: r.team_name ?? r.leagues?.name ?? "Team",
    teamInitials: r.team_initials ?? "?",
    teamColor: r.team_color,
    personName: r.leagues?.name ?? "",
    message: r.message ?? undefined,
  }));

  // Career stats across all of the user's player_stats
  const { data: careerRows } = await supabase
    .from("player_stats")
    .select("goals, assists, fixture_id")
    .eq("user_id", profile.id);
  const cr = (careerRows ?? []) as { goals: number; assists: number; fixture_id: string }[];
  const career = {
    matches: new Set(cr.map((c) => c.fixture_id)).size,
    goals: cr.reduce((s, c) => s + c.goals, 0),
    assists: cr.reduce((s, c) => s + c.assists, 0),
    winRatePct: 0,
  };

  return { profile, teams, invites, career };
}

// ---------------------------------------------------------------------------
// Manage page (organizer console)
// ---------------------------------------------------------------------------

export interface ManageData {
  leagueId: string;
  seasonId: string;
  leagueName: string;
  format: string;
  location: string;
  seasonName: string;
  seasonStatus: string;
  rounds: string;
  divisionId: string;
  divisionName: string;
  teams: { name: string; initials: string; color: string }[];
  applications: LeagueApplication[];
  invitations: LeagueApplication[];
  fixtureCount: number;
  hasResults: boolean;
}

export async function getManageData(): Promise<ManageData | null> {
  const supabase = await getServerClient();
  const user = await getSessionUser();
  if (!user) return null;

  const { data: leagueRow } = await supabase
    .from("leagues")
    .select("id, name, format, location, rounds")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!leagueRow) return null;
  const league = leagueRow as { id: string; name: string; format: string; location: string; rounds: string };

  const [season, division] = await Promise.all([
    getCurrentSeason(league.id),
    getDefaultDivision(league.id),
  ]);
  if (!season || !division) return null;

  const { data: teamRows } = await supabase
    .from("teams")
    .select("name, initials, color_hex")
    .eq("division_id", division.id)
    .order("created_at", { ascending: true });
  const teams = ((teamRows ?? []) as { name: string; initials: string; color_hex: string }[]).map(
    (t) => ({ name: t.name, initials: t.initials, color: t.color_hex }),
  );

  const { data: reqRows } = await supabase
    .from("league_applications")
    .select("id, kind, team_name, team_initials, team_color, message, users(display_name)")
    .eq("league_id", league.id)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  type RR = {
    id: string;
    kind: "application" | "invitation";
    team_name: string | null;
    team_initials: string | null;
    team_color: string;
    message: string | null;
    users: { display_name: string } | null;
  };
  const allReq: LeagueApplication[] = ((reqRows ?? []) as unknown as RR[]).map((r) => ({
    id: r.id,
    kind: r.kind,
    teamName: r.team_name ?? "Team",
    teamInitials: r.team_initials ?? "?",
    teamColor: r.team_color,
    personName: r.users?.display_name ?? "",
    message: r.message ?? undefined,
  }));

  const [{ count: fixtureCount }, { count: resultCount }] = await Promise.all([
    supabase.from("fixtures").select("id", { count: "exact", head: true }).eq("season_id", season.id),
    supabase
      .from("match_results")
      .select("id, fixtures!inner(season_id)", { count: "exact", head: true })
      .eq("fixtures.season_id", season.id),
  ]);

  return {
    leagueId: league.id,
    seasonId: season.id,
    leagueName: league.name,
    format: league.format,
    location: league.location,
    seasonName: season.name,
    seasonStatus: season.status,
    rounds: league.rounds,
    divisionId: division.id,
    divisionName: division.name,
    teams,
    applications: allReq.filter((r) => r.kind === "application"),
    invitations: allReq.filter((r) => r.kind === "invitation"),
    fixtureCount: fixtureCount ?? 0,
    hasResults: (resultCount ?? 0) > 0,
  };
}
