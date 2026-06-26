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
  points: number;
  form: FormResult[];
  zone: "promotion" | "relegation" | null;
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
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  section: "compete" | "manage";
  icon: string;
}
