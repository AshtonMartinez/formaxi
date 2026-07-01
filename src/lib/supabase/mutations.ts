"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerClient, getSessionUser } from "./queries";

export type ActionResult = { ok?: boolean; error?: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FORMAT_MAP: Record<string, string> = {
  "5": "5-a-side",
  "7": "7-a-side",
  "11": "11-a-side",
};

const slugify = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function seasonNameFor(startDate: string | null): string {
  const d = startDate ? new Date(startDate) : new Date();
  const y = d.getFullYear();
  const startYear = d.getMonth() >= 6 ? y : y - 1; // seasons roll over mid-year
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return (data?.id as string) ?? null;
}

// ---------------------------------------------------------------------------
// Schedule: RSVP
// ---------------------------------------------------------------------------

export async function rsvp(
  fixtureId: string,
  status: "available" | "doubtful" | "out",
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in to RSVP." };
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("availability")
    .upsert(
      { fixture_id: fixtureId, user_id: user.id, status, updated_at: new Date().toISOString() },
      { onConflict: "fixture_id,user_id" },
    );
  if (error) return { error: error.message };
  revalidatePath("/schedule");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Results + player stats
// ---------------------------------------------------------------------------

export async function submitResult(
  fixtureId: string,
  homeScore: number,
  awayScore: number,
  stats: { userId: string; teamId: string; goals: number; assists: number }[] = [],
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };
  const supabase = await getServerClient();

  const { error: resultError } = await supabase.from("match_results").upsert(
    {
      fixture_id: fixtureId,
      submitted_by: user.id,
      home_score: homeScore,
      away_score: awayScore,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "fixture_id" },
  );
  if (resultError) return { error: resultError.message };

  const meaningful = stats.filter((s) => s.goals > 0 || s.assists > 0);
  if (meaningful.length > 0) {
    const { error: statsError } = await supabase.from("player_stats").upsert(
      meaningful.map((s) => ({
        fixture_id: fixtureId,
        user_id: s.userId,
        team_id: s.teamId,
        goals: s.goals,
        assists: s.assists,
      })),
      { onConflict: "fixture_id,user_id" },
    );
    if (statsError) return { error: statsError.message };
  }

  await supabase.from("fixtures").update({ status: "played" }).eq("id", fixtureId);

  revalidatePath("/standings");
  revalidatePath("/team");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Create: league
// ---------------------------------------------------------------------------

export interface CreateLeagueInput {
  name: string;
  slug: string;
  format: "5" | "7" | "11";
  region: string;
  desc: string;
  divisions: number;
  rounds: "single" | "double";
  days: string[];
  start: string;
  win: number;
  draw: number;
  tiebreak: "gd" | "h2h";
  visibility: "public" | "invite";
  teams: number;
}

export async function createLeague(input: CreateLeagueInput): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in to create a league." };
  if (!input.name.trim()) return { error: "League name is required." };
  if (!input.region.trim()) return { error: "Region / venue is required." };

  const supabase = await getServerClient();
  const slug = (input.slug || slugify(input.name)) + "-" + Math.random().toString(36).slice(2, 6);

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .insert({
      organizer_id: user.id,
      name: input.name.trim(),
      slug,
      description: input.desc.trim() || null,
      format: FORMAT_MAP[input.format],
      location: input.region.trim(),
      day_of_week: input.days.length ? input.days.join(", ") : null,
      visibility: input.visibility === "invite" ? "private" : "public",
      rounds: input.rounds,
      points_win: input.win,
      points_draw: input.draw,
      tiebreak: input.tiebreak,
    })
    .select("id")
    .single();
  if (leagueError || !league) return { error: leagueError?.message ?? "Could not create league." };

  const divisionCount = Math.max(1, input.divisions);
  const divisionRows = Array.from({ length: divisionCount }, (_, i) => ({
    league_id: league.id,
    name: `Division ${i + 1}`,
    sort_order: i + 1,
    max_teams: input.teams,
  }));
  const { error: divError } = await supabase.from("divisions").insert(divisionRows);
  if (divError) return { error: divError.message };

  const { error: seasonError } = await supabase.from("seasons").insert({
    league_id: league.id,
    name: seasonNameFor(input.start || null),
    start_date: input.start || null,
    status: "upcoming",
  });
  if (seasonError) return { error: seasonError.message };

  revalidatePath("/manage");
  redirect("/manage");
}

// ---------------------------------------------------------------------------
// Create: team
// ---------------------------------------------------------------------------

export interface CreateTeamInput {
  name: string;
  short: string;
  color: string;
  venue: string;
  founded: string;
  leagueId: string;
  invites: string[];
}

export async function createTeam(input: CreateTeamInput): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in to create a team." };
  if (!input.name.trim()) return { error: "Team name is required." };
  if (input.short.trim().length < 2) return { error: "Add a 2–3 character abbreviation." };
  if (!input.leagueId || input.leagueId === "none")
    return { error: "Pick a league to register your team in." };

  const supabase = await getServerClient();

  const { data: division } = await supabase
    .from("divisions")
    .select("id")
    .eq("league_id", input.leagueId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!division) return { error: "That league has no division to join yet." };

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      division_id: division.id,
      captain_id: user.id,
      name: input.name.trim(),
      color_hex: input.color,
      initials: input.short.trim().toUpperCase(),
      home_venue: input.venue.trim() || null,
      founded_year: input.founded ? Number(input.founded) : null,
    })
    .select("id")
    .single();
  if (teamError || !team) return { error: teamError?.message ?? "Could not create team." };

  // Captain membership
  await supabase
    .from("team_players")
    .insert({ team_id: team.id, user_id: user.id, status: "active" });

  // Invite registered users by email
  for (const email of input.invites) {
    const inviteeId = await findUserIdByEmail(email);
    if (inviteeId && inviteeId !== user.id) {
      await supabase
        .from("team_players")
        .insert({ team_id: team.id, user_id: inviteeId, status: "invited" });
    }
  }

  revalidatePath("/team");
  redirect("/team");
}

// ---------------------------------------------------------------------------
// Discover: apply to a league
// ---------------------------------------------------------------------------

export async function applyToLeague(
  leagueId: string,
  team: { name: string; initials: string; color: string },
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in to apply to a league." };
  const supabase = await getServerClient();
  const { error } = await supabase.from("league_applications").insert({
    league_id: leagueId,
    kind: "application",
    user_id: user.id,
    created_by: user.id,
    team_name: team.name.trim() || null,
    team_initials: team.initials.trim().toUpperCase() || null,
    team_color: team.color,
  });
  if (error) return { error: error.message };
  revalidatePath("/discover");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Manage: applications & invitations
// ---------------------------------------------------------------------------

async function defaultDivisionId(leagueId: string): Promise<string | null> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("divisions")
    .select("id")
    .eq("league_id", leagueId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

/** Shared accept path: create the team + captain membership, mark resolved. */
async function acceptApplicationRow(applicationId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };
  const supabase = await getServerClient();

  const { data: app } = await supabase
    .from("league_applications")
    .select("id, league_id, user_id, team_name, team_initials, team_color, status")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) return { error: "Request not found." };
  if (app.status !== "pending") return { error: "This request was already resolved." };

  const divisionId = await defaultDivisionId(app.league_id as string);
  if (!divisionId) return { error: "League has no division to place the team in." };

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      division_id: divisionId,
      captain_id: app.user_id,
      name: app.team_name ?? "New Team",
      color_hex: app.team_color,
      initials: app.team_initials ?? "NEW",
    })
    .select("id")
    .single();
  if (teamError || !team) return { error: teamError?.message ?? "Could not create team." };

  await supabase
    .from("team_players")
    .insert({ team_id: team.id, user_id: app.user_id, status: "active" });

  const { error: updError } = await supabase
    .from("league_applications")
    .update({ status: "approved", resolved_by: user.id, resolved_at: new Date().toISOString() })
    .eq("id", applicationId);
  if (updError) return { error: updError.message };

  return { ok: true };
}

export async function approveApplication(applicationId: string): Promise<ActionResult> {
  const result = await acceptApplicationRow(applicationId);
  if (result.ok) revalidatePath("/manage");
  return result;
}

export async function rejectApplication(applicationId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("league_applications")
    .update({ status: "rejected", resolved_by: user.id, resolved_at: new Date().toISOString() })
    .eq("id", applicationId);
  if (error) return { error: error.message };
  revalidatePath("/manage");
  return { ok: true };
}

export async function cancelInvitation(applicationId: string): Promise<ActionResult> {
  const supabase = await getServerClient();
  const { error } = await supabase.from("league_applications").delete().eq("id", applicationId);
  if (error) return { error: error.message };
  revalidatePath("/manage");
  return { ok: true };
}

export async function inviteCaptain(
  leagueId: string,
  invitee: { person: string; teamName: string; initials: string; color: string },
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const inviteeId = await findUserIdByEmail(invitee.person);
  if (!inviteeId)
    return { error: "No FormaXI user with that email. They need an account before you can invite them." };

  const supabase = await getServerClient();
  const { error } = await supabase.from("league_applications").insert({
    league_id: leagueId,
    kind: "invitation",
    user_id: inviteeId,
    created_by: user.id,
    team_name: invitee.teamName.trim() || null,
    team_initials: invitee.initials.trim().toUpperCase() || null,
    team_color: invitee.color,
  });
  if (error) return { error: error.message };
  revalidatePath("/manage");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Profile: respond to an invitation
// ---------------------------------------------------------------------------

export async function acceptInvitation(applicationId: string): Promise<ActionResult> {
  const result = await acceptApplicationRow(applicationId);
  if (result.ok) {
    revalidatePath("/profile");
    revalidatePath("/team");
  }
  return result;
}

export async function declineInvitation(applicationId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("league_applications")
    .update({ status: "rejected", resolved_by: user.id, resolved_at: new Date().toISOString() })
    .eq("id", applicationId);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Manage: fixtures & season
// ---------------------------------------------------------------------------

export async function generateFixtures(seasonId: string): Promise<ActionResult> {
  const supabase = await getServerClient();
  const { error } = await supabase.rpc("generate_fixtures", { p_season_id: seasonId });
  if (error) return { error: error.message };
  revalidatePath("/manage");
  revalidatePath("/schedule");
  return { ok: true };
}

export async function startSeason(seasonId: string): Promise<ActionResult> {
  const supabase = await getServerClient();
  const { error } = await supabase.from("seasons").update({ status: "active" }).eq("id", seasonId);
  if (error) return { error: error.message };
  revalidatePath("/manage");
  revalidatePath("/standings");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Team settings
// ---------------------------------------------------------------------------

export async function saveTeamSettings(
  teamId: string,
  values: { name: string; initials: string; venue: string; color: string },
): Promise<ActionResult> {
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("teams")
    .update({
      name: values.name.trim(),
      initials: values.initials.trim().toUpperCase(),
      home_venue: values.venue.trim() || null,
      color_hex: values.color,
    })
    .eq("id", teamId);
  if (error) return { error: error.message };
  revalidatePath("/team");
  return { ok: true };
}

export async function invitePlayer(teamId: string, email: string): Promise<ActionResult> {
  const inviteeId = await findUserIdByEmail(email);
  if (!inviteeId) return { error: "No FormaXI user with that email." };
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("team_players")
    .insert({ team_id: teamId, user_id: inviteeId, status: "invited" });
  if (error) return { error: error.message };
  revalidatePath("/team");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Profile edit
// ---------------------------------------------------------------------------

export async function updateProfile(values: {
  displayName: string;
  preferredPosition: string | null;
  matchReminders: boolean;
}): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("users")
    .update({
      display_name: values.displayName.trim(),
      preferred_position: values.preferredPosition,
      match_reminder_enabled: values.matchReminders,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { ok: true };
}
