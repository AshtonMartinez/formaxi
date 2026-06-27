"use client";

import { useState } from "react";
import { Card, CardTitle, Avatar, Badge, Button, FormSequence, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Player } from "@/lib/types";

// ── Data ────────────────────────────────────────────────────────

const squad: Player[] = [
  { number: "1",  name: "D. Hughes",  position: "GK", appearances: 13, goalsAssists: "0/0",  availability: "available", avatarColor: "#3b82f6" },
  { number: "4",  name: "S. Mbeki",   position: "DF", appearances: 13, goalsAssists: "1/2",  availability: "available", avatarColor: "#14b8a6" },
  { number: "5",  name: "C. Romano",  position: "DF", appearances: 12, goalsAssists: "2/1",  availability: "available", avatarColor: "#ef4444" },
  { number: "6",  name: "A. Khan",    position: "DF", appearances: 11, goalsAssists: "0/3",  availability: "out",       avatarColor: "#64748b" },
  { number: "8",  name: "P. Larsson", position: "MF", appearances: 13, goalsAssists: "4/6",  availability: "available", avatarColor: "#eab308" },
  { number: "10", name: "M. Okafor",  position: "MF", appearances: 13, goalsAssists: "14/5", availability: "available", isCaptain: true, avatarColor: "#1f9a52" },
  { number: "7",  name: "F. Diallo",  position: "MF", appearances: 10, goalsAssists: "3/5",  availability: "doubtful",  avatarColor: "#8b5cf6" },
  { number: "11", name: "J. Cole",    position: "FW", appearances: 12, goalsAssists: "7/4",  availability: "available", avatarColor: "#ff6a3d" },
  { number: "9",  name: "E. Santos",  position: "FW", appearances: 9,  goalsAssists: "5/2",  availability: "available", avatarColor: "#06b6d4" },
];

type TeamFixture = {
  date: string;
  opponent: string;
  opponentShort: string;
  opponentColor: string;
  homeAway: "Home" | "Away";
  score: string | null;
  result: "W" | "D" | "L" | null;
  pendingScore?: boolean;
};

const teamFixtures: TeamFixture[] = [
  { date: "Sun 1 Sep",   opponent: "Bow Rangers",     opponentShort: "BR", opponentColor: "#06b6d4", homeAway: "Home", score: "3-1", result: "W" },
  { date: "Sun 8 Sep",   opponent: "Shadwell Town",   opponentShort: "ST", opponentColor: "#64748b", homeAway: "Away", score: "4-0", result: "W" },
  { date: "Sun 15 Sep",  opponent: "Mile End",        opponentShort: "ME", opponentColor: "#84cc16", homeAway: "Home", score: "2-0", result: "W" },
  { date: "Sun 22 Sep",  opponent: "Leyton Orient",   opponentShort: "LO", opponentColor: "#ef4444", homeAway: "Away", score: "1-2", result: "L" },
  { date: "Sun 29 Sep",  opponent: "Clapton CFC",     opponentShort: "CC", opponentColor: "#ec4899", homeAway: "Home", score: "2-0", result: "W" },
  { date: "Sun 6 Oct",   opponent: "Olympic Athletic",opponentShort: "OA", opponentColor: "#eab308", homeAway: "Away", score: "3-1", result: "W" },
  { date: "Sun 13 Oct",  opponent: "Victoria Park",   opponentShort: "VP", opponentColor: "#14b8a6", homeAway: "Home", score: "1-1", result: "D" },
  { date: "Sun 20 Oct",  opponent: "Hackney Hotspurs",opponentShort: "HH", opponentColor: "#ff6a3d", homeAway: "Away", score: "2-1", result: "W" },
  { date: "Sun 27 Oct",  opponent: "Marsh United",    opponentShort: "MU", opponentColor: "#8b5cf6", homeAway: "Home", score: "3-2", result: "W" },
  { date: "Sun 3 Nov",   opponent: "Bow Rangers",     opponentShort: "BR", opponentColor: "#06b6d4", homeAway: "Away", score: "1-1", result: "D" },
  { date: "Sun 10 Nov",  opponent: "Shadwell Town",   opponentShort: "ST", opponentColor: "#64748b", homeAway: "Home", score: "5-0", result: "W" },
  { date: "Sun 17 Nov",  opponent: "Clapton CFC",     opponentShort: "CC", opponentColor: "#ec4899", homeAway: "Away", score: "2-0", result: "W" },
  { date: "Sun 24 Nov",  opponent: "Victoria Park",   opponentShort: "VP", opponentColor: "#14b8a6", homeAway: "Away", score: "1-1", result: "D" },
  // Past matches awaiting result entry
  { date: "Sun 15 Jun",  opponent: "Mile End",        opponentShort: "ME", opponentColor: "#84cc16", homeAway: "Home", score: null, result: null, pendingScore: true },
  { date: "Sat 22 Jun",  opponent: "Marsh United",    opponentShort: "MU", opponentColor: "#8b5cf6", homeAway: "Home", score: null, result: null, pendingScore: true },
  // Upcoming
  { date: "Sun 5 Jul",   opponent: "Olympic Athletic",opponentShort: "OA", opponentColor: "#eab308", homeAway: "Away", score: null, result: null },
];

type SubmittedScore = { score: string; result: "W" | "D" | "L" };
type PlayerStats = Record<string, { goals: number; assists: number }>;

const playerStats = [
  { name: "M. Okafor", pos: "MF", goals: 14, assists: 5, apps: 13, rating: 8.2 },
  { name: "J. Cole",   pos: "FW", goals: 7,  assists: 4, apps: 12, rating: 7.6 },
  { name: "E. Santos", pos: "FW", goals: 5,  assists: 2, apps: 9,  rating: 7.3 },
  { name: "P. Larsson",pos: "MF", goals: 4,  assists: 6, apps: 13, rating: 7.8 },
  { name: "F. Diallo", pos: "MF", goals: 3,  assists: 5, apps: 10, rating: 7.1 },
  { name: "C. Romano", pos: "DF", goals: 2,  assists: 1, apps: 12, rating: 7.4 },
  { name: "S. Mbeki",  pos: "DF", goals: 1,  assists: 2, apps: 13, rating: 7.5 },
];

const availabilityConfig = {
  available: { label: "Available", bg: "rgba(52,224,127,0.14)",  color: "#34e07f" },
  doubtful:  { label: "Doubtful",  bg: "rgba(217,169,37,0.16)", color: "#d9a925" },
  out:       { label: "Out",       bg: "rgba(224,70,61,0.16)",  color: "#e0463d" },
};

const resultStyles = {
  W: { bg: "rgba(52,224,127,0.14)",  color: "#34e07f" },
  D: { bg: "rgba(217,169,37,0.16)", color: "#d9a925" },
  L: { bg: "rgba(224,70,61,0.16)",  color: "#e0463d" },
};

type TabId = "squad" | "fixtures" | "stats" | "settings";
const tabs: { id: TabId; label: string }[] = [
  { id: "squad",    label: "Squad"    },
  { id: "fixtures", label: "Fixtures" },
  { id: "stats",    label: "Stats"    },
  { id: "settings", label: "Settings" },
];

// ── Result modal (captain's 2-step flow) ────────────────────────

function TeamResultModal({
  fixtureIdx,
  onClose,
  onSubmit,
}: {
  fixtureIdx: number | null;
  onClose: () => void;
  onSubmit: (idx: number, ourScore: string, theirScore: string, stats: PlayerStats) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [ourScore, setOurScore] = useState("0");
  const [theirScore, setTheirScore] = useState("0");
  const [pStats, setPStats] = useState<PlayerStats>({});

  const fixture = fixtureIdx !== null ? teamFixtures[fixtureIdx] : null;

  const adjustStat = (name: string, field: "goals" | "assists", delta: number) => {
    setPStats((prev) => {
      const cur = prev[name] ?? { goals: 0, assists: 0 };
      return { ...prev, [name]: { ...cur, [field]: Math.max(0, cur[field] + delta) } };
    });
  };

  const handleScoreNext = () => {
    setPStats({});
    setStep(2);
  };

  const handleFinalSubmit = () => {
    if (fixtureIdx === null) return;
    onSubmit(fixtureIdx, ourScore, theirScore, pStats);
    setStep(1);
    setOurScore("0");
    setTheirScore("0");
    setPStats({});
  };

  const scoreInputClass =
    "w-14 text-center font-heading font-black text-[28px] bg-input border border-white/[0.09] rounded-[10px] py-2.5 outline-none focus:border-accent transition-colors";

  return (
    <Modal
      open={fixtureIdx !== null}
      onClose={() => { onClose(); setStep(1); setOurScore("0"); setTheirScore("0"); setPStats({}); }}
      title={step === 1 ? "Enter score" : "Player contributions"}
      className="max-w-[520px]"
    >
      {fixture && (
        <>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-5">
            {([1, 2] as const).map((n) => (
              <div key={n} className="flex items-center gap-2">
                {n > 1 && <div className={cn("flex-1 h-px w-8", step >= n ? "bg-accent" : "bg-white/[0.1]")} />}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center font-heading font-bold text-[12px] border",
                  step === n ? "bg-accent border-accent text-accent-darker" :
                  step > n  ? "bg-accent/[0.2] border-accent/50 text-accent" :
                  "bg-white/[0.06] border-white/[0.15] text-dim",
                )}>
                  {n}
                </div>
              </div>
            ))}
          </div>

          {step === 1 ? (
            <>
              <div className="flex items-center justify-between my-5">
                <div className="text-center flex-1 min-w-0">
                  <Avatar initials="RF" color="#1f9a52" size="lg" className="mx-auto" />
                  <div className="font-bold text-sm mt-2">Riverside FC</div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={ourScore}
                    onChange={(e) => setOurScore(e.target.value)}
                    className={scoreInputClass}
                  />
                  <span className="text-dim font-heading font-black text-xl">–</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={theirScore}
                    onChange={(e) => setTheirScore(e.target.value)}
                    className={scoreInputClass}
                  />
                </div>
                <div className="text-center flex-1 min-w-0">
                  <Avatar initials={fixture.opponentShort} color={fixture.opponentColor} size="lg" className="mx-auto" />
                  <div className="font-bold text-sm mt-2 truncate px-2">{fixture.opponent}</div>
                </div>
              </div>
              <div className="text-center text-secondary text-[12.5px] mb-5">
                {fixture.date} · {fixture.homeAway}
              </div>
              <Button variant="primary" size="lg" onClick={handleScoreNext}>
                Next: Add player stats →
              </Button>
            </>
          ) : (
            <>
              <div className="text-[12.5px] text-muted mb-3">
                Add goals and assists scored in this match
              </div>
              <div className="max-h-[320px] overflow-y-auto flex flex-col gap-0 pr-1">
                {squad.filter((p) => p.availability !== "out").map((p) => {
                  const stat = pStats[p.name] ?? { goals: 0, assists: 0 };
                  return (
                    <div key={p.name} className="flex items-center gap-3 py-[9px] border-b border-white/[0.05]">
                      <span className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: p.avatarColor }} />
                      <span className="font-semibold text-[13px] flex-1 min-w-0 truncate">
                        {p.name}
                        {p.isCaptain && <span className="text-dim text-[11px]"> (C)</span>}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-dim w-6 text-center">⚽</span>
                        <button onClick={() => adjustStat(p.name, "goals", -1)} className="w-6 h-6 rounded-md bg-white/[0.05] text-dim text-sm flex items-center justify-center cursor-pointer hover:bg-white/[0.10]">−</button>
                        <span className="font-heading font-bold text-sm w-4 text-center">{stat.goals}</span>
                        <button onClick={() => adjustStat(p.name, "goals", 1)}  className="w-6 h-6 rounded-md bg-white/[0.05] text-dim text-sm flex items-center justify-center cursor-pointer hover:bg-white/[0.10]">+</button>
                      </div>
                      <div className="flex items-center gap-1.5 ml-1 shrink-0">
                        <span className="text-[11px] text-dim w-6 text-center">🅰️</span>
                        <button onClick={() => adjustStat(p.name, "assists", -1)} className="w-6 h-6 rounded-md bg-white/[0.05] text-dim text-sm flex items-center justify-center cursor-pointer hover:bg-white/[0.10]">−</button>
                        <span className="font-heading font-bold text-sm w-4 text-center">{stat.assists}</span>
                        <button onClick={() => adjustStat(p.name, "assists", 1)}  className="w-6 h-6 rounded-md bg-white/[0.05] text-dim text-sm flex items-center justify-center cursor-pointer hover:bg-white/[0.10]">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-5">
                <Button variant="secondary" size="md" onClick={() => setStep(1)}>← Back</Button>
                <Button variant="primary" size="lg" className="flex-1" onClick={handleFinalSubmit}>
                  Submit result
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

// ── Hero ────────────────────────────────────────────────────────

function TeamHero() {
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-[20px] border border-white/[0.08] bg-gradient-to-r from-[#161f2e] to-[#0f1b13] p-5 sm:p-6">
      <Avatar initials="RF" color="#1f9a52" size="xl" className="font-black" />
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="font-heading font-black text-[26px] tracking-[-0.5px]">Riverside FC</h1>
          <Badge variant="orange">You captain this team</Badge>
        </div>
        <div className="text-secondary text-[13.5px] mt-1.5">Sunday City League · Div 1 · Founded 2021</div>
      </div>
      <div className="flex gap-6 sm:ml-auto">
        <div className="text-center"><div className="font-heading font-extrabold text-2xl text-accent">1st</div><div className="text-[11px] text-dim font-semibold">Position</div></div>
        <div className="text-center"><div className="font-heading font-extrabold text-2xl">10-2-1</div><div className="text-[11px] text-dim font-semibold">W-D-L</div></div>
        <div className="text-center"><div className="font-heading font-extrabold text-2xl">18</div><div className="text-[11px] text-dim font-semibold">Squad</div></div>
      </div>
    </div>
  );
}

// ── Squad Tab ───────────────────────────────────────────────────

function SquadTable({ players }: { players: Player[] }) {
  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-4">
        <CardTitle className="text-base">Squad Roster</CardTitle>
        <Button variant="accent-soft" size="sm"><span className="text-[15px] leading-none">+</span> Invite player</Button>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <div className="grid grid-cols-[46px_1fr_70px_50px_50px_90px] gap-0 px-5 pb-2 text-[11px] tracking-[0.5px] text-dim font-bold uppercase">
            <div>#</div><div>Player</div><div>Pos</div><div className="text-center">App</div><div className="text-center">G/A</div><div className="text-right">Status</div>
          </div>
          {players.map((p) => {
            const avail = availabilityConfig[p.availability];
            return (
              <div key={p.number + p.name} className="grid grid-cols-[46px_1fr_70px_50px_50px_90px] items-center px-5 py-[11px] border-t border-border-muted">
                <div className="font-heading font-extrabold text-base text-heading">{p.number}</div>
                <div className="flex items-center gap-[11px] min-w-0">
                  <span className="w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: p.avatarColor }} />
                  <div className="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">{p.name}{p.isCaptain && " (C)"}</div>
                </div>
                <div className="text-[12.5px] text-muted font-semibold">{p.position}</div>
                <div className="text-center text-[13.5px] text-secondary">{p.appearances}</div>
                <div className="text-center text-[13.5px] text-secondary">{p.goalsAssists}</div>
                <div className="text-right">
                  <span className="font-bold text-[11px] px-[9px] py-1 rounded-[7px]" style={{ backgroundColor: avail.bg, color: avail.color }}>{avail.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function SeasonForm() {
  return (
    <Card>
      <CardTitle className="mb-3.5">Season Form</CardTitle>
      <div className="grid grid-cols-2 gap-3.5">
        <div><div className="font-heading font-extrabold text-[22px]">34</div><div className="text-[11.5px] text-dim">Goals for</div></div>
        <div><div className="font-heading font-extrabold text-[22px]">11</div><div className="text-[11.5px] text-dim">Goals against</div></div>
        <div><div className="font-heading font-extrabold text-[22px] text-accent">+23</div><div className="text-[11.5px] text-dim">Goal diff</div></div>
        <div><div className="font-heading font-extrabold text-[22px]">77%</div><div className="text-[11.5px] text-dim">Win rate</div></div>
      </div>
    </Card>
  );
}

function RecentResults() {
  const results = [
    { opponent: "Bow Rangers", score: "3-1 W", variant: "W" as const },
    { opponent: "Clapton CFC", score: "2-0 W", variant: "W" as const },
    { opponent: "Victoria Park", score: "1-1 D", variant: "D" as const },
  ];
  return (
    <Card>
      <CardTitle className="mb-3">Recent results</CardTitle>
      <div className="flex flex-col gap-2.5">
        {results.map((r) => (
          <div key={r.opponent} className="flex items-center justify-between text-[13px]">
            <span>vs {r.opponent}</span>
            <span className="font-heading font-extrabold px-2 py-[3px] rounded-[6px]" style={resultStyles[r.variant]}>{r.score}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SquadContent() {
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_300px]">
      <SquadTable players={squad} />
      <div className="flex flex-col gap-[18px]">
        <SeasonForm />
        <RecentResults />
      </div>
    </div>
  );
}

// ── Fixtures Tab ────────────────────────────────────────────────

function FixturesContent({
  submittedScores,
  onOpenModal,
}: {
  submittedScores: Record<number, SubmittedScore>;
  onOpenModal: (idx: number) => void;
}) {
  const indexed = teamFixtures.map((f, i) => ({ ...f, idx: i }));

  const pending  = indexed.filter((f) => f.pendingScore && !submittedScores[f.idx]);
  const upcoming = indexed.filter((f) => !f.pendingScore && f.result === null);
  const played   = indexed.filter((f) => f.result !== null || submittedScores[f.idx]);

  const getResult = (f: typeof indexed[0]) => submittedScores[f.idx]?.result ?? f.result;
  const getScore  = (f: typeof indexed[0]) => submittedScores[f.idx]?.score  ?? f.score;

  const FixtureRow = ({ f, badge }: { f: typeof indexed[0]; badge: React.ReactNode }) => (
    <div className="flex items-center gap-4 px-5 py-3 border-t border-border-muted">
      <div className="w-[80px] text-[12.5px] text-muted font-semibold shrink-0">{f.date}</div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Avatar initials="RF" color="#1f9a52" size="xs" />
        <span className="font-semibold text-[13px]">Riverside FC</span>
        <span className="text-dim font-bold text-xs">vs</span>
        <Avatar initials={f.opponentShort} color={f.opponentColor} size="xs" />
        <span className="font-semibold text-[13px] truncate">{f.opponent}</span>
      </div>
      <span className="text-[11px] text-muted font-semibold shrink-0">{f.homeAway}</span>
      {badge}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Awaiting result */}
      {pending.length > 0 && (
        <Card padding="none">
          <div className="px-5 pt-[18px] pb-3 flex items-center gap-2">
            <CardTitle className="text-base">Awaiting result</CardTitle>
            <span className="font-bold text-[11px] px-2 py-0.5 rounded-[5px] bg-draw/[0.16] text-draw">{pending.length}</span>
          </div>
          {pending.map((f) => (
            <FixtureRow
              key={f.idx}
              f={f}
              badge={
                <Button variant="accent-soft" size="sm" className="shrink-0" onClick={() => onOpenModal(f.idx)}>
                  Submit result
                </Button>
              }
            />
          ))}
        </Card>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Card padding="none">
          <div className="px-5 pt-[18px] pb-3">
            <CardTitle className="text-base">Upcoming</CardTitle>
          </div>
          {upcoming.map((f) => (
            <FixtureRow
              key={f.idx}
              f={f}
              badge={<span className="font-bold text-xs px-3 py-1 rounded-lg bg-accent/[0.14] text-accent shrink-0">RSVP</span>}
            />
          ))}
        </Card>
      )}

      {/* Results */}
      <Card padding="none">
        <div className="px-5 pt-[18px] pb-3">
          <CardTitle className="text-base">Results</CardTitle>
        </div>
        {played.map((f) => {
          const res  = getResult(f);
          const score = getScore(f);
          return (
            <FixtureRow
              key={f.idx}
              f={f}
              badge={
                res ? (
                  <span
                    className="font-heading font-extrabold text-xs px-2.5 py-1 rounded-[6px] shrink-0 whitespace-nowrap"
                    style={resultStyles[res]}
                  >
                    {score} {res}
                  </span>
                ) : null
              }
            />
          );
        })}
      </Card>
    </div>
  );
}

// ── Stats Tab ───────────────────────────────────────────────────

function StatsContent() {
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_300px]">
      <Card padding="none">
        <div className="px-5 pt-[18px] pb-3">
          <CardTitle className="text-base">Player Statistics</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[460px]">
            <div className="grid grid-cols-[1fr_50px_50px_50px_50px_60px] gap-0 px-5 pb-2 text-[11px] tracking-[0.5px] text-dim font-bold uppercase">
              <div>Player</div><div className="text-center">App</div><div className="text-center">G</div><div className="text-center">A</div><div className="text-center">G+A</div><div className="text-center">Rating</div>
            </div>
            {playerStats.map((p) => (
              <div key={p.name} className="grid grid-cols-[1fr_50px_50px_50px_50px_60px] items-center px-5 py-[11px] border-t border-border-muted">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-sm">{p.name}</span>
                  <span className="text-[11px] text-dim font-semibold">{p.pos}</span>
                </div>
                <div className="text-center text-[13.5px] text-secondary">{p.apps}</div>
                <div className="text-center text-[13.5px] text-accent font-bold">{p.goals}</div>
                <div className="text-center text-[13.5px] text-secondary">{p.assists}</div>
                <div className="text-center text-[13.5px] font-heading font-bold">{p.goals + p.assists}</div>
                <div className="text-center">
                  <span className={cn(
                    "font-heading font-extrabold text-[13px] px-2 py-0.5 rounded-md",
                    p.rating >= 7.5 ? "bg-accent/[0.14] text-accent" : "bg-white/[0.06] text-secondary",
                  )}>
                    {p.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-[18px]">
        <Card>
          <CardTitle className="mb-3.5">Season Overview</CardTitle>
          <div className="flex flex-col gap-3">
            {([
              ["Matches played", "13"],
              ["Wins", "10"],
              ["Draws", "2"],
              ["Losses", "1"],
              ["Goals scored", "34"],
              ["Goals conceded", "11"],
              ["Clean sheets", "5"],
              ["Avg goals/match", "2.6"],
            ] as const).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/[0.05] last:border-0">
                <span className="text-muted text-[13px]">{label}</span>
                <span className="font-heading font-bold text-[13.5px]">{value}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle className="mb-3">Form (last 5)</CardTitle>
          <div className="flex justify-center">
            <FormSequence results={["W", "W", "D", "W", "W"]} />
          </div>
          <div className="text-center text-[12px] text-muted mt-2.5">13 pts from last 5 matches</div>
        </Card>
      </div>
    </div>
  );
}

// ── Settings Tab ────────────────────────────────────────────────

function SettingsContent() {
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <Card>
        <CardTitle className="text-base mb-4">Team Details</CardTitle>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-heading mb-2">Team name</label>
            <input defaultValue="Riverside FC" className="w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-body outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-heading mb-2">Abbreviation</label>
            <input defaultValue="RF" maxLength={3} className="w-[110px] bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-heading font-bold text-center tracking-[1px] outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-heading mb-2">Home venue</label>
            <input defaultValue="Hackney Marshes P3" className="w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-body outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-heading mb-2.5">Club colour</label>
            <div className="flex gap-[11px] flex-wrap">
              {["#1f9a52","#3b82f6","#ff6a3d","#8b5cf6","#eab308","#ec4899","#06b6d4","#ef4444"].map((c, i) => (
                <button key={c} className="w-9 h-9 rounded-[10px] cursor-pointer outline-offset-2" style={{ backgroundColor: c, outline: i === 0 ? "2px solid #34e07f" : "2px solid transparent" }} />
              ))}
            </div>
          </div>
          <Button variant="primary" size="md" className="self-start mt-2">Save changes</Button>
        </div>
      </Card>

      <div className="flex flex-col gap-[18px]">
        <Card>
          <CardTitle className="text-base mb-4">League</CardTitle>
          <div className="flex items-center gap-3 p-3 bg-elevated rounded-xl">
            <Avatar initials="SC" color="#1f9a52" size="md" />
            <div className="flex-1">
              <div className="font-bold text-sm">Sunday City League</div>
              <div className="text-xs text-dim">Division 1 · 2025/26 Season</div>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            {([
              ["Position", "1st"],
              ["Joined", "Sep 2024"],
              ["Seasons played", "2"],
            ] as const).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1.5">
                <span className="text-muted text-[13px]">{label}</span>
                <span className="font-semibold text-[13px]">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-loss/20">
          <CardTitle className="text-base mb-3 text-loss">Danger Zone</CardTitle>
          <div className="flex flex-col gap-3">
            <button className="text-left px-4 py-3 rounded-xl border border-white/[0.08] hover:border-loss/30 transition-colors cursor-pointer">
              <div className="font-semibold text-sm">Leave league</div>
              <div className="text-xs text-dim mt-0.5">Remove your team from Sunday City League</div>
            </button>
            <button className="text-left px-4 py-3 rounded-xl border border-loss/20 hover:border-loss/40 transition-colors cursor-pointer">
              <div className="font-semibold text-sm text-loss">Delete team</div>
              <div className="text-xs text-dim mt-0.5">Permanently delete Riverside FC and all data</div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<TabId>("squad");
  const [modalFixtureIdx, setModalFixtureIdx] = useState<number | null>(null);
  const [submittedScores, setSubmittedScores] = useState<Record<number, SubmittedScore>>({});

  const handleSubmit = (idx: number, ourScore: string, theirScore: string, _stats: PlayerStats) => {
    const us   = parseInt(ourScore)   || 0;
    const them = parseInt(theirScore) || 0;
    const result: "W" | "D" | "L" = us > them ? "W" : us < them ? "L" : "D";
    const fx    = teamFixtures[idx];
    const score = fx.homeAway === "Home" ? `${us}-${them}` : `${them}-${us}`;
    setSubmittedScores((prev) => ({ ...prev, [idx]: { score, result } }));
    setModalFixtureIdx(null);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <TeamHero />

      <div className="mb-5 mt-5 flex gap-1.5 overflow-x-auto border-b border-white/[0.07]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "mr-[18px] shrink-0 whitespace-nowrap border-0 bg-transparent px-1 py-[11px] text-sm cursor-pointer transition-colors",
              activeTab === tab.id
                ? "font-bold text-accent border-b-2 border-accent"
                : "font-semibold text-muted hover:text-secondary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "squad"    && <SquadContent />}
      {activeTab === "fixtures" && (
        <FixturesContent submittedScores={submittedScores} onOpenModal={setModalFixtureIdx} />
      )}
      {activeTab === "stats"    && <StatsContent />}
      {activeTab === "settings" && <SettingsContent />}

      <TeamResultModal
        fixtureIdx={modalFixtureIdx}
        onClose={() => setModalFixtureIdx(null)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
