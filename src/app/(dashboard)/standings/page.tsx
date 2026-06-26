import { Card, CardHeader, CardTitle, Badge, Avatar, FormSequence, StatInline } from "@/components/ui";
import type { TeamStanding, TopScorer, Fixture, FormResult } from "@/lib/types";

const standings: TeamStanding[] = [
  { position: 1, name: "Riverside FC", initials: "RF", crestColor: "#1f9a52", played: 13, won: 10, drawn: 2, lost: 1, points: 32, form: ["W","W","D","W","W"], zone: "promotion" },
  { position: 2, name: "Hackney Hotspurs", initials: "HH", crestColor: "#ff6a3d", played: 13, won: 9, drawn: 3, lost: 1, points: 30, form: ["W","D","W","W","W"], zone: "promotion" },
  { position: 3, name: "Marsh United", initials: "MU", crestColor: "#8b5cf6", played: 13, won: 9, drawn: 1, lost: 3, points: 28, form: ["L","W","W","D","W"], zone: null },
  { position: 4, name: "Victoria Park", initials: "VP", crestColor: "#14b8a6", played: 13, won: 7, drawn: 4, lost: 2, points: 25, form: ["W","D","D","W","L"], zone: null },
  { position: 5, name: "Olympic Athletic", initials: "OA", crestColor: "#eab308", played: 13, won: 7, drawn: 2, lost: 4, points: 23, form: ["W","L","W","D","W"], zone: null },
  { position: 6, name: "Clapton CFC", initials: "CC", crestColor: "#ec4899", played: 13, won: 6, drawn: 3, lost: 4, points: 21, form: ["D","W","L","W","D"], zone: null },
  { position: 7, name: "Leyton Orient", initials: "LO", crestColor: "#ef4444", played: 13, won: 5, drawn: 3, lost: 5, points: 18, form: ["L","L","W","D","W"], zone: null },
  { position: 8, name: "Bow Rangers", initials: "BR", crestColor: "#06b6d4", played: 13, won: 4, drawn: 3, lost: 6, points: 15, form: ["W","L","L","D","L"], zone: null },
  { position: 9, name: "Mile End", initials: "ME", crestColor: "#84cc16", played: 13, won: 2, drawn: 4, lost: 7, points: 10, form: ["L","D","L","L","W"], zone: "relegation" },
  { position: 10, name: "Shadwell Town", initials: "ST", crestColor: "#64748b", played: 13, won: 1, drawn: 2, lost: 10, points: 5, form: ["L","L","L","D","L"], zone: "relegation" },
];

const scorers: TopScorer[] = [
  { rank: 1, name: "M. Okafor", team: "Riverside FC", crestColor: "#1f9a52", goals: 14 },
  { rank: 2, name: "J. Bennett", team: "Hackney Hotspurs", crestColor: "#ff6a3d", goals: 12 },
  { rank: 3, name: "L. Silva", team: "Marsh United", crestColor: "#8b5cf6", goals: 11 },
  { rank: 4, name: "T. Adeyemi", team: "Olympic Athletic", crestColor: "#eab308", goals: 9 },
  { rank: 5, name: "R. Kowalski", team: "Victoria Park", crestColor: "#14b8a6", goals: 8 },
];

const fixtures: Fixture[] = [
  { home: "Riverside FC", homeColor: "#1f9a52", away: "Marsh United", awayColor: "#8b5cf6", when: "Sat 22 Jun 10:00", venue: "Hackney Marshes" },
  { home: "Victoria Park", homeColor: "#14b8a6", away: "Olympic Ath.", awayColor: "#eab308", when: "Sat 22 Jun 12:00", venue: "Mabley Green" },
  { home: "Clapton CFC", homeColor: "#ec4899", away: "Leyton Orient", awayColor: "#ef4444", when: "Sun 23 Jun 11:00", venue: "Spring Hill" },
];

function LeagueHero() {
  return (
    <div className="rounded-[20px] overflow-hidden border border-border bg-gradient-to-r from-[#10301d] to-[#0f1b13] relative">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 78px, rgba(255,255,255,0.03) 78px 80px)" }} />

      <div className="relative flex flex-wrap items-center gap-5 p-5 sm:gap-6 sm:p-7">
        {/* League crest */}
        <div className="w-[74px] h-[74px] rounded-[18px] bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shrink-0 shadow-[0_8px_24px_rgba(52,224,127,0.3)]">
          <div className="w-[34px] h-[34px] border-[3px] border-[#07140c] rounded-full relative flex items-center justify-center">
            <div className="absolute w-[3px] h-[34px] bg-[#07140c]" />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl font-black leading-none tracking-[-0.6px] sm:text-[28px]">
              Sunday City League
            </h1>
            <Badge variant="green" size="md">Division 1</Badge>
          </div>
          <div className="text-secondary text-[13.5px] mt-[7px] flex gap-4 flex-wrap">
            <span>11v11 · Hackney Marshes</span>
            <span className="text-[#3a4640]">|</span>
            <span>2025/26 Season</span>
            <span className="text-[#3a4640]">|</span>
            <span>Matchday 13 of 18</span>
          </div>
        </div>

        <div className="flex items-center gap-6 sm:ml-auto sm:gap-[26px]">
          <StatInline value={10} label="Teams" valueColor="#34e07f" />
          <StatInline value={87} label="Played" />
          <StatInline value={241} label="Goals" />
        </div>
      </div>
    </div>
  );
}

function StandingsTable({ data }: { data: TeamStanding[] }) {
  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 pt-[18px] pb-3.5">
        <CardTitle className="text-base">League Table</CardTitle>
        <div className="flex gap-1.5">
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="w-[9px] h-[9px] rounded-[2px] bg-accent" />
            Promotion
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted ml-2.5">
            <span className="w-[9px] h-[9px] rounded-[2px] bg-loss" />
            Relegation
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
      <div className="min-w-[600px]">
      {/* Column headers */}
      <div className="grid grid-cols-[38px_1fr_34px_34px_34px_34px_46px_110px] gap-0 px-5 pb-2 text-[11px] tracking-[0.5px] text-dim font-bold uppercase">
        <div>#</div>
        <div>Club</div>
        <div className="text-center">P</div>
        <div className="text-center">W</div>
        <div className="text-center">D</div>
        <div className="text-center">L</div>
        <div className="text-center">Pts</div>
        <div className="text-right">Form</div>
      </div>

      {/* Rows */}
      {data.map((t) => (
        <div
          key={t.position}
          className="grid grid-cols-[38px_1fr_34px_34px_34px_34px_46px_110px] items-center px-5 py-[11px] border-t border-border-muted relative"
          style={{
            backgroundColor:
              t.zone === "promotion"
                ? "rgba(52,224,127,0.04)"
                : t.zone === "relegation"
                  ? "rgba(224,70,61,0.04)"
                  : undefined,
          }}
        >
          {/* Zone accent bar */}
          <span
            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-[3px]"
            style={{
              backgroundColor:
                t.zone === "promotion"
                  ? "#34e07f"
                  : t.zone === "relegation"
                    ? "#e0463d"
                    : "transparent",
            }}
          />

          <div className="flex items-center gap-[9px]">
            <span className="font-heading font-bold text-sm text-heading w-4 text-center">
              {t.position}
            </span>
          </div>

          <div className="flex items-center gap-[11px] min-w-0">
            <Avatar initials={t.initials} color={t.crestColor} size="sm" />
            <span className="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">
              {t.name}
            </span>
          </div>

          <div className="text-center text-[13.5px] text-secondary">{t.played}</div>
          <div className="text-center text-[13.5px] text-secondary">{t.won}</div>
          <div className="text-center text-[13.5px] text-secondary">{t.drawn}</div>
          <div className="text-center text-[13.5px] text-secondary">{t.lost}</div>
          <div className="text-center font-heading font-extrabold text-[15px]">{t.points}</div>

          <div className="flex gap-1 justify-end">
            <FormSequence results={t.form} />
          </div>
        </div>
      ))}
      </div>
      </div>
    </Card>
  );
}

function TopScorers({ data }: { data: TopScorer[] }) {
  return (
    <Card>
      <CardTitle className="mb-3.5">Top Scorers</CardTitle>
      {data.map((s) => (
        <div
          key={s.rank}
          className="flex items-center gap-3 py-[9px] border-t border-white/[0.05]"
        >
          <span
            className="font-heading font-extrabold text-sm w-[18px]"
            style={{ color: s.rank === 1 ? "#34e07f" : "#5f6d63" }}
          >
            {s.rank}
          </span>
          <span
            className="w-[30px] h-[30px] rounded-full shrink-0"
            style={{ backgroundColor: s.crestColor }}
          />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis">
              {s.name}
            </div>
            <div className="text-[11.5px] text-dim whitespace-nowrap overflow-hidden text-ellipsis">
              {s.team}
            </div>
          </div>
          <span className="font-heading font-extrabold text-lg text-accent">
            {s.goals}
          </span>
        </div>
      ))}
    </Card>
  );
}

function NextFixtures({ data }: { data: Fixture[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardTitle>Next Fixtures</CardTitle>
        <span className="text-[11px] text-dim font-semibold">MD 14</span>
      </div>
      {data.map((fx, i) => (
        <div key={i} className="py-2.5 border-t border-white/[0.05]">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <span
              className="w-[18px] h-[18px] rounded-[5px] shrink-0"
              style={{ backgroundColor: fx.homeColor }}
            />
            {fx.home}
            <span className="text-dim font-bold mx-0.5">v</span>
            <span
              className="w-[18px] h-[18px] rounded-[5px] shrink-0"
              style={{ backgroundColor: fx.awayColor }}
            />
            {fx.away}
          </div>
          <div className="text-[11.5px] text-dim mt-1">
            {fx.when} · {fx.venue}
          </div>
        </div>
      ))}
    </Card>
  );
}

export default function StandingsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <LeagueHero />

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
        <StandingsTable data={standings} />

        <div className="flex flex-col gap-5">
          <TopScorers data={scorers} />
          <NextFixtures data={fixtures} />
        </div>
      </div>
    </div>
  );
}
