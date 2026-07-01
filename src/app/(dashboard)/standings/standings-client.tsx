"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, Badge, Avatar, FormSequence, StatInline, Button, Modal } from "@/components/ui";
import type { TeamStanding, TopScorer, Fixture } from "@/lib/types";
import type { StandingsData, StandingsMeta } from "@/lib/supabase/queries";
import { submitResult } from "@/lib/supabase/mutations";

type FixtureVM = Fixture & { id: string };

const toInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const formatGD = (gd: number) => (gd > 0 ? `+${gd}` : String(gd));
const gdColor = (gd: number) =>
  gd > 0 ? "text-accent" : gd < 0 ? "text-loss" : "text-secondary";

// ── Result modal (organizer view) ───────────────────────────────

function ResultModal({
  fixture,
  onClose,
  onSubmit,
  submitting,
}: {
  fixture: FixtureVM | null;
  onClose: () => void;
  onSubmit: (homeScore: string, awayScore: string) => void;
  submitting: boolean;
}) {
  const [homeScore, setHomeScore] = useState("0");
  const [awayScore, setAwayScore] = useState("0");

  const scoreInputClass =
    "w-14 text-center font-heading font-black text-[28px] bg-input border border-white/[0.09] rounded-[10px] py-2.5 outline-none focus:border-accent transition-colors";

  return (
    <Modal open={!!fixture} onClose={onClose} title="Submit result">
      {fixture && (
        <>
          <div className="flex items-center justify-between my-5">
            <div className="text-center flex-1 min-w-0">
              <Avatar initials={toInitials(fixture.home)} color={fixture.homeColor} size="lg" className="mx-auto" />
              <div className="font-bold text-sm mt-2 px-2 truncate">{fixture.home}</div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <input type="number" min={0} max={99} value={homeScore} onChange={(e) => setHomeScore(e.target.value)} className={scoreInputClass} />
              <span className="text-dim font-heading font-black text-xl">–</span>
              <input type="number" min={0} max={99} value={awayScore} onChange={(e) => setAwayScore(e.target.value)} className={scoreInputClass} />
            </div>
            <div className="text-center flex-1 min-w-0">
              <Avatar initials={toInitials(fixture.away)} color={fixture.awayColor} size="lg" className="mx-auto" />
              <div className="font-bold text-sm mt-2 px-2 truncate">{fixture.away}</div>
            </div>
          </div>

          <div className="text-center text-secondary text-[12.5px] mb-5">
            {fixture.when} · {fixture.venue}
          </div>

          <Button variant="primary" size="lg" disabled={submitting} onClick={() => onSubmit(homeScore, awayScore)}>
            {submitting ? "Saving…" : "Confirm result"}
          </Button>
        </>
      )}
    </Modal>
  );
}

// ── League hero ─────────────────────────────────────────────────

function LeagueHero({ meta }: { meta: StandingsMeta }) {
  return (
    <div className="rounded-[20px] overflow-hidden border border-border bg-gradient-to-r from-[#10301d] to-[#0f1b13] relative">
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 78px, rgba(255,255,255,0.03) 78px 80px)" }} />
      <div className="relative flex flex-wrap items-center gap-5 p-5 sm:gap-6 sm:p-7">
        <div className="w-[74px] h-[74px] rounded-[18px] bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shrink-0 shadow-[0_8px_24px_rgba(52,224,127,0.3)]">
          <div className="w-[34px] h-[34px] border-[3px] border-[#07140c] rounded-full relative flex items-center justify-center">
            <div className="absolute w-[3px] h-[34px] bg-[#07140c]" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl font-black leading-none tracking-[-0.6px] sm:text-[28px]">{meta.leagueName}</h1>
            <Badge variant="green" size="md">{meta.divisionName}</Badge>
          </div>
          <div className="text-secondary text-[13.5px] mt-[7px] flex gap-4 flex-wrap">
            <span>{meta.format} · {meta.location}</span>
            <span className="text-[#3a4640]">|</span>
            <span>{meta.seasonName} Season</span>
          </div>
        </div>
        <div className="flex items-center gap-6 sm:ml-auto sm:gap-[26px]">
          <StatInline value={meta.teamCount} label="Teams" valueColor="#34e07f" />
          <StatInline value={meta.playedCount} label="Played" />
          <StatInline value={meta.goalCount} label="Goals" />
        </div>
      </div>
    </div>
  );
}

// ── Standings table ─────────────────────────────────────────────

function StandingsTable({ data }: { data: TeamStanding[] }) {
  const COLS = "grid-cols-[38px_1fr_34px_34px_34px_34px_40px_40px_46px_52px_110px]";

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 pt-[18px] pb-3.5">
        <CardTitle className="text-base">League Table</CardTitle>
        <div className="flex gap-1.5">
          <span className="flex items-center gap-1.5 text-[11px] text-muted"><span className="w-[9px] h-[9px] rounded-[2px] bg-accent" />Promotion</span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted ml-2.5"><span className="w-[9px] h-[9px] rounded-[2px] bg-loss" />Relegation</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className={`grid ${COLS} gap-0 px-5 pb-2 text-[11px] tracking-[0.5px] text-dim font-bold uppercase`}>
            <div>#</div><div>Club</div><div className="text-center">P</div><div className="text-center">W</div><div className="text-center">D</div><div className="text-center">L</div><div className="text-center">GF</div><div className="text-center">GA</div><div className="text-center">GD</div><div className="text-center">Pts</div><div className="text-right">Form</div>
          </div>

          {data.length === 0 && (
            <div className="px-5 py-10 text-center text-[13px] text-muted border-t border-border-muted">
              No results yet — the table fills in as matches are played.
            </div>
          )}

          {data.map((t) => (
            <div key={t.position} className={`grid ${COLS} items-center px-5 py-[11px] border-t border-border-muted relative`}
              style={{ backgroundColor: t.zone === "promotion" ? "rgba(52,224,127,0.04)" : t.zone === "relegation" ? "rgba(224,70,61,0.04)" : undefined }}>
              <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-[3px]"
                style={{ backgroundColor: t.zone === "promotion" ? "#34e07f" : t.zone === "relegation" ? "#e0463d" : "transparent" }} />
              <div className="flex items-center"><span className="font-heading font-bold text-sm text-heading w-4 text-center">{t.position}</span></div>
              <div className="flex items-center gap-[11px] min-w-0">
                <Avatar initials={t.initials} color={t.crestColor} size="sm" />
                <span className="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">{t.name}</span>
              </div>
              <div className="text-center text-[13.5px] text-secondary">{t.played}</div>
              <div className="text-center text-[13.5px] text-secondary">{t.won}</div>
              <div className="text-center text-[13.5px] text-secondary">{t.drawn}</div>
              <div className="text-center text-[13.5px] text-secondary">{t.lost}</div>
              <div className="text-center text-[13.5px] text-secondary">{t.goalsFor}</div>
              <div className="text-center text-[13.5px] text-secondary">{t.goalsAgainst}</div>
              <div className={`text-center text-[13px] font-semibold ${gdColor(t.goalDiff)}`}>{formatGD(t.goalDiff)}</div>
              <div className="text-center font-heading font-extrabold text-[15px]">{t.points}</div>
              <div className="flex gap-1 justify-end"><FormSequence results={t.form} /></div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── Top scorers ─────────────────────────────────────────────────

function TopScorers({ data }: { data: TopScorer[] }) {
  return (
    <Card>
      <CardTitle className="mb-3.5">Top Scorers</CardTitle>
      {data.length === 0 && <p className="text-[13px] text-muted py-2">No goals recorded yet.</p>}
      {data.map((s) => (
        <div key={s.rank} className="flex items-center gap-3 py-[9px] border-t border-white/[0.05]">
          <span className="font-heading font-extrabold text-sm w-[18px]" style={{ color: s.rank === 1 ? "#34e07f" : "#5f6d63" }}>{s.rank}</span>
          <span className="w-[30px] h-[30px] rounded-full shrink-0" style={{ backgroundColor: s.crestColor }} />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis">{s.name}</div>
            <div className="text-[11.5px] text-dim whitespace-nowrap overflow-hidden text-ellipsis">{s.team}</div>
          </div>
          <span className="font-heading font-extrabold text-lg text-accent">{s.goals}</span>
        </div>
      ))}
    </Card>
  );
}

// ── Next fixtures ────────────────────────────────────────────────

function NextFixtures({
  data,
  nextMatchday,
  canSubmit,
  submittedResults,
  onOpenFixture,
}: {
  data: FixtureVM[];
  nextMatchday: number | null;
  canSubmit: boolean;
  submittedResults: Record<string, string>;
  onOpenFixture: (f: FixtureVM) => void;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardTitle>Next Fixtures</CardTitle>
        {nextMatchday !== null && <span className="text-[11px] text-dim font-semibold">MD {nextMatchday}</span>}
      </div>
      {data.length === 0 && <p className="text-[13px] text-muted py-2">No upcoming fixtures scheduled.</p>}
      {data.map((fx) => {
        const result = submittedResults[fx.id];
        return (
          <div key={fx.id} className="py-2.5 border-t border-white/[0.05]">
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <span className="w-[18px] h-[18px] rounded-[5px] shrink-0" style={{ backgroundColor: fx.homeColor }} />
              {fx.home}
              <span className="text-dim font-bold mx-0.5">v</span>
              <span className="w-[18px] h-[18px] rounded-[5px] shrink-0" style={{ backgroundColor: fx.awayColor }} />
              {fx.away}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <div className="text-[11.5px] text-dim">{fx.when} · {fx.venue}</div>
              {result ? (
                <span className="font-heading font-extrabold text-xs px-2.5 py-1 rounded-[6px] bg-accent/[0.14] text-accent">{result}</span>
              ) : canSubmit ? (
                <Button variant="accent-soft" size="sm" onClick={() => onOpenFixture(fx)}>Submit result</Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

// ── Client root ─────────────────────────────────────────────────

export function StandingsClient({ data }: { data: StandingsData }) {
  const router = useRouter();
  const [openFixture, setOpenFixture] = useState<FixtureVM | null>(null);
  const [submittedResults, setSubmittedResults] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmitResult = (homeScore: string, awayScore: string) => {
    if (!openFixture) return;
    const fixture = openFixture;
    setError(null);
    startTransition(async () => {
      const res = await submitResult(fixture.id, Number(homeScore) || 0, Number(awayScore) || 0);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSubmittedResults((prev) => ({ ...prev, [fixture.id]: `${homeScore}–${awayScore}` }));
      setOpenFixture(null);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <LeagueHero meta={data.meta} />

      {error && (
        <p className="mt-3 text-[12.5px] text-loss font-semibold">{error}</p>
      )}

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
        <StandingsTable data={data.standings} />
        <div className="flex flex-col gap-5">
          <TopScorers data={data.scorers} />
          <NextFixtures
            data={data.fixtures}
            nextMatchday={data.meta.nextMatchday}
            canSubmit={data.meta.isOrganizer}
            submittedResults={submittedResults}
            onOpenFixture={setOpenFixture}
          />
        </div>
      </div>

      <ResultModal fixture={openFixture} onClose={() => setOpenFixture(null)} onSubmit={handleSubmitResult} submitting={pending} />
    </div>
  );
}
