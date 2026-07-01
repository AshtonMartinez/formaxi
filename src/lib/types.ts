// Core domain types for the FormaXI application

export type FormResult = "W" | "D" | "L";

export interface TeamStanding {
  position: number;
  name: string;
  initials: string;
  crestColor: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: FormResult[];
  zone: "promotion" | "relegation" | null;
  /** Division this team belongs to. Defaults to "1" for single-division leagues. */
  divisionId?: string;
}

export interface TopScorer {
  rank: number;
  name: string;
  team: string;
  crestColor: string;
  goals: number;
}

export interface Fixture {
  home: string;
  homeColor: string;
  away: string;
  awayColor: string;
  when: string;
  venue: string;
}

export interface ScheduleMatch {
  month: string;
  /** Calendar year of the fixture; 0 when no kickoff time is set yet. */
  year: number;
  day: string;
  time: string;
  opponent: string;
  opponentShort: string;
  opponentColor: string;
  homeAway: "Home" | "Away";
  venue: string;
  status: string;
  statusVariant: "action" | "neutral";
}

export interface Player {
  number: string;
  name: string;
  position: string;
  appearances: number;
  goalsAssists: string;
  availability: "available" | "doubtful" | "out";
  isCaptain?: boolean;
  avatarColor: string;
}

export interface LeagueCard {
  name: string;
  initials: string;
  crestColor: string;
  format: string;
  location: string;
  day: string;
  fee: string;
  spots: string;
  tagColor: string;
  tagBg: string;
  bannerGradient: string;
  /** Number of divisions in this league. Omit or set to 1 for single-division. */
  divisions?: number;
}

/**
 * A pending request to add a team to a league, in either direction.
 * Mirrors the unified `league_applications` table (see docs/SCHEMA.md):
 * `application` = user applied via Discover; `invitation` = organizer invited a captain.
 */
export type ApplicationKind = "application" | "invitation";

export interface LeagueApplication {
  id: string;
  kind: ApplicationKind;
  teamName: string;
  teamInitials: string;
  teamColor: string;
  /** The prospective captain's display name. */
  personName: string;
  /** Optional note from the initiator. */
  message?: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  section: "compete" | "manage";
  icon: string;
}
