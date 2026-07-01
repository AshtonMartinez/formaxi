"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, Avatar, Badge, Button, FormSequence, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Player, FormResult } from "@/lib/types";
import type { TeamPageData, TeamFixtureVM } from "@/lib/supabase/queries";
import { submitResult, invitePlayer, saveTeamSettings } from "@/lib/supabase/mutations";

const availabilityConfig = {
  available: { label: "Available", bg: "rgba(52,224,127,0.14)", color: "#34e07f" },
  doubtful: { label: "Doubtful", bg: "rgba(217,169,37,0.16)", color: "#d9a925" },
  out: { label: "Out", bg: "rgba(224,70,61,0.16)", color: "#e0463d" },
};
const resultStyles: Record<FormResult, { bg: string; color: string }> = {
  W: { bg: "rgba(52,224,127,0.14)", color: "#34e07f" },
  D: { bg: "rgba(217,169,37,0.16)", color: "#d9a925" },
  L: { bg: "rgba(224,70,61,0.16)", color: "#e0463d" },
};
const CREST_COLORS = ["#1f9a52", "#3b82f6", "#ff6a3d", "#8b5cf6", "#eab308", "#ec4899", "#06b6d4", "#ef4444"];

type TabId = "squad" | "fixtures" | "stats" | "settings";
const tabs: { id: TabId; label: string }[] = [
  { id: "squad", label: "Squad" },
  { id: "fixtures", label: "Fixtures" },
  { id: "stats", label: "Stats" },
  { id: "settings", label: "Settings" },
];

type PlayerStatMap = Record<string, { goals: number; assists: number }>;

// ── Result modal (captain's 2-step flow) ────────────────────────

function TeamResultModal({ fixture, data, onClose, onDone }: {
  fixture: TeamFixtureVM | null; data: TeamPageData; onClose: () => void; onDone: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [ourScore, setOurScore] = useState("0");
  const [theirScore, setTheirScore] = useState("0");
  const [pStats, setPStats] = useState<PlayerStatMap>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => { setStep(1); setOurScore("0"); setTheirScore("0"); setPStats({}); setError(null); };
  const close = () => { reset(); onClose(); };

  const adjustStat = (userId: string, field: "goals" | "assists", delta: number) => {
    setPStats((prev) => {
      const cur = prev[userId] ?? { goals: 0, assists: 0 };
      return { ...prev, [userId]: { ...cur, [field]: Math.max(0, cur[field] + delta) } };
    });
  };

  const finalSubmit = () => {
    if (!fixture) return;
    const us = Number(ourScore) || 0;
    const them = Number(theirScore) || 0;
    const isHome = fixture.homeAway === "Home";
    const homeScore = isHome ? us : them;
    const awayScore = isHome ? them : us;
    const stats = data.rosterForStats.map((r) => ({
      userId: r.userId,
      teamId: data.team.id,
      goals: pStats[r.userId]?.goals ?? 0,
      assists: pStats[r.userId]?.assists ?? 0,
    }));
    setError(null);
    startTransition(async () => {
      const res = await submitResult(fixture.id, homeScore, awayScore, stats);
      if (res.error) setError(res.error);
      else { reset(); onDone(); }
    });
  };

  const scoreInputClass = "w-14 text-center font-heading font-black text-[28px] bg-input border border-white/[0.09] rounded-[10px] py-2.5 outline-none focus:border-accent transition-colors";

  return (
    <Modal open={!!fixture} onClose={close} title={step === 1 ? "Enter score" : "Player contributions"} className="max-w-[520px]">
      {fixture && (
        <>
          <div className="flex items-center gap-2 mb-5">
            {([1, 2] as const).map((n) => (
              <div key={n} className="flex items-center gap-2">
                {n > 1 && <div className={cn("flex-1 h-px w-8", step >= n ? "bg-accent" : "bg-white/[0.1]")} />}
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center font-heading font-bold text-[12px] border",
                  step === n ? "bg-accent border-accent text-accent-darker" : step > n ? "bg-accent/[0.2] border-accent/50 text-accent" : "bg-white/[0.06] border-white/[0.15] text-dim")}>
                  {n}
                </div>
              </div>
            ))}
          </div>

          {step === 1 ? (
            <>
              <div className="flex items-center justify-between my-5">
                <div className="text-center flex-1 min-w-0">
                  <Avatar initials={data.team.initials} color={data.team.color} size="lg" className="mx-auto" />
                  <div className="font-bold text-sm mt-2">{data.team.name}</div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <input type="number" min={0} max={99} value={ourScore} onChange={(e) => setOurScore(e.target.value)} className={scoreInputClass} />
                  <span className="text-dim font-heading font-black text-xl">–</span>
                  <input type="number" min={0} max={99} value={theirScore} onChange={(e) => setTheirScore(e.target.value)} className={scoreInputClass} />
                </div>
                <div className="text-center flex-1 min-w-0">
                  <Avatar initials={fixture.opponentShort} color={fixture.opponentColor} size="lg" className="mx-auto" />
                  <div className="font-bold text-sm mt-2 truncate px-2">{fixture.opponent}</div>
                </div>
              </div>
              <div className="text-center text-secondary text-[12.5px] mb-5">{fixture.date} · {fixture.homeAway}</div>
              <Button variant="primary" size="lg" onClick={() => setStep(2)}>Next: Add player stats →</Button>
            </>
          ) : (
            <>
              <div className="text-[12.5px] text-muted mb-3">Add goals and assists scored in this match</div>
              <div className="max-h-[320px] overflow-y-auto flex flex-col gap-0 pr-1">
                {data.rosterForStats.map((p) => {
                  const stat = pStats[p.userId] ?? { goals: 0, assists: 0 };
                  return (
                    <div key={p.userId} className="flex items-center gap-3 py-[9px] border-b border-white/[0.05]">
                      <span className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="font-semibold text-[13px] flex-1 min-w-0 truncate">
                        {p.name}{p.isCaptain && <span className="text-dim text-[11px]"> (C)</span>}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-dim w-6 text-center">⚽</span>
                        <button onClick={() => adjustStat(p.userId, "goals", -1)} className="w-6 h-6 rounded-md bg-white/[0.05] text-dim text-sm flex items-center justify-center cursor-pointer hover:bg-white/[0.10]">−</button>
                        <span className="font-heading font-bold text-sm w-4 text-center">{stat.goals}</span>
                        <button onClick={() => adjustStat(p.userId, "goals", 1)} className="w-6 h-6 rounded-md bg-white/[0.05] text-dim text-sm flex items-center justify-center cursor-pointer hover:bg-white/[0.10]">+</button>
                      </div>
                      <div className="flex items-center gap-1.5 ml-1 shrink-0">
                        <span className="text-[11px] text-dim w-6 text-center">🅰️</span>
                        <button onClick={() => adjustStat(p.userId, "assists", -1)} className="w-6 h-6 rounded-md bg-white/[0.05] text-dim text-sm flex items-center justify-center cursor-pointer hover:bg-white/[0.10]">−</button>
                        <span className="font-heading font-bold text-sm w-4 text-center">{stat.assists}</span>
                        <button onClick={() => adjustStat(p.userId, "assists", 1)} className="w-6 h-6 rounded-md bg-white/[0.05] text-dim text-sm flex items-center justify-center cursor-pointer hover:bg-white/[0.10]">+</button>
                      </div>
                    </div>
                  );
                })}
                {data.rosterForStats.length === 0 && <p className="text-[13px] text-muted py-3">No squad members to record stats for.</p>}
              </div>
              {error && <p className="text-[12.5px] text-loss font-semibold mt-3">{error}</p>}
              <div className="flex gap-2 mt-5">
                <Button variant="secondary" size="md" onClick={() => setStep(1)}>← Back</Button>
                <Button variant="primary" size="lg" className="flex-1" disabled={pending} onClick={finalSubmit}>{pending ? "Saving…" : "Submit result"}</Button>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

// ── Hero ────────────────────────────────────────────────────────

function TeamHero({ data }: { data: TeamPageData }) {
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-[20px] border border-white/[0.08] bg-gradient-to-r from-[#161f2e] to-[#0f1b13] p-5 sm:p-6">
      <Avatar initials={data.team.initials} color={data.team.color} size="xl" className="font-black" />
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="font-heading font-black text-[26px] tracking-[-0.5px]">{data.team.name}</h1>
          {data.team.isCaptain && <Badge variant="orange">You captain this team</Badge>}
        </div>
        <div className="text-secondary text-[13.5px] mt-1.5">
          {data.team.leagueName} · {data.team.divisionName}{data.team.founded ? ` · Founded ${data.team.founded}` : ""}
        </div>
      </div>
      <div className="flex gap-6 sm:ml-auto">
        <div className="text-center"><div className="font-heading font-extrabold text-2xl text-accent">{data.hero.position ? `${data.hero.position}${ordinal(data.hero.position)}` : "—"}</div><div className="text-[11px] text-dim font-semibold">Position</div></div>
        <div className="text-center"><div className="font-heading font-extrabold text-2xl">{data.hero.record}</div><div className="text-[11px] text-dim font-semibold">W-D-L</div></div>
        <div className="text-center"><div className="font-heading font-extrabold text-2xl">{data.hero.squadCount}</div><div className="text-[11px] text-dim font-semibold">Squad</div></div>
      </div>
    </div>
  );
}

const ordinal = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th");

// ── Squad tab ───────────────────────────────────────────────────

function SquadTable({ players, onInvite }: { players: Player[]; onInvite: () => void }) {
  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-4">
        <CardTitle className="text-base">Squad Roster</CardTitle>
        <Button variant="accent-soft" size="sm" onClick={onInvite}><span className="text-[15px] leading-none">+</span> Invite player</Button>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <div className="grid grid-cols-[46px_1fr_70px_50px_50px_90px] gap-0 px-5 pb-2 text-[11px] tracking-[0.5px] text-dim font-bold uppercase">
            <div>#</div><div>Player</div><div>Pos</div><div className="text-center">App</div><div className="text-center">G/A</div><div className="text-right">Status</div>
          </div>
          {players.length === 0 && <div className="px-5 py-8 text-center text-[13px] text-muted border-t border-border-muted">No players yet. Invite some to build your squad.</div>}
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
                <div className="text-right"><span className="font-bold text-[11px] px-[9px] py-1 rounded-[7px]" style={{ backgroundColor: avail.bg, color: avail.color }}>{avail.label}</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function SeasonForm({ data }: { data: TeamPageData }) {
  return (
    <Card>
      <CardTitle className="mb-3.5">Season Form</CardTitle>
      <div className="grid grid-cols-2 gap-3.5">
        <div><div className="font-heading font-extrabold text-[22px]">{data.seasonForm.goalsFor}</div><div className="text-[11.5px] text-dim">Goals for</div></div>
        <div><div className="font-heading font-extrabold text-[22px]">{data.hero.record}</div><div className="text-[11.5px] text-dim">W-D-L</div></div>
        <div><div className="font-heading font-extrabold text-[22px]">{data.hero.squadCount}</div><div className="text-[11.5px] text-dim">Squad</div></div>
        <div><div className="font-heading font-extrabold text-[22px]">{data.seasonForm.winRatePct}%</div><div className="text-[11.5px] text-dim">Win rate</div></div>
      </div>
    </Card>
  );
}

function RecentResults({ data }: { data: TeamPageData }) {
  const results = data.fixtures.filter((f) => f.result).slice(-3).reverse();
  return (
    <Card>
      <CardTitle className="mb-3">Recent results</CardTitle>
      {results.length === 0 && <p className="text-[13px] text-muted">No results yet.</p>}
      <div className="flex flex-col gap-2.5">
        {results.map((r) => (
          <div key={r.id} className="flex items-center justify-between text-[13px]">
            <span>vs {r.opponent}</span>
            <span className="font-heading font-extrabold px-2 py-[3px] rounded-[6px]" style={resultStyles[r.result!]}>{r.score} {r.result}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SquadContent({ data, onInvite }: { data: TeamPageData; onInvite: () => void }) {
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_300px]">
      <SquadTable players={data.squad} onInvite={onInvite} />
      <div className="flex flex-col gap-[18px]">
        <SeasonForm data={data} />
        <RecentResults data={data} />
      </div>
    </div>
  );
}

// ── Fixtures tab ────────────────────────────────────────────────

function FixturesContent({ data, canSubmit, onOpenModal }: { data: TeamPageData; canSubmit: boolean; onOpenModal: (f: TeamFixtureVM) => void }) {
  const pending = data.fixtures.filter((f) => f.pendingScore);
  const upcoming = data.fixtures.filter((f) => !f.pendingScore && f.result === null);
  const played = data.fixtures.filter((f) => f.result !== null);

  const FixtureRow = ({ f, badge }: { f: TeamFixtureVM; badge: React.ReactNode }) => (
    <div className="flex items-center gap-4 px-5 py-3 border-t border-border-muted">
      <div className="w-[90px] text-[12.5px] text-muted font-semibold shrink-0">{f.date}</div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Avatar initials={data.team.initials} color={data.team.color} size="xs" />
        <span className="font-semibold text-[13px]">{data.team.name}</span>
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
      {pending.length > 0 && (
        <Card padding="none">
          <div className="px-5 pt-[18px] pb-3 flex items-center gap-2">
            <CardTitle className="text-base">Awaiting result</CardTitle>
            <span className="font-bold text-[11px] px-2 py-0.5 rounded-[5px] bg-draw/[0.16] text-draw">{pending.length}</span>
          </div>
          {pending.map((f) => (
            <FixtureRow key={f.id} f={f}
              badge={canSubmit ? <Button variant="accent-soft" size="sm" className="shrink-0" onClick={() => onOpenModal(f)}>Submit result</Button> : <span className="text-[11px] text-dim shrink-0">Pending</span>} />
          ))}
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card padding="none">
          <div className="px-5 pt-[18px] pb-3"><CardTitle className="text-base">Upcoming</CardTitle></div>
          {upcoming.map((f) => (
            <FixtureRow key={f.id} f={f} badge={<span className="font-bold text-xs px-3 py-1 rounded-lg bg-accent/[0.14] text-accent shrink-0">RSVP</span>} />
          ))}
        </Card>
      )}

      <Card padding="none">
        <div className="px-5 pt-[18px] pb-3"><CardTitle className="text-base">Results</CardTitle></div>
        {played.length === 0 && <p className="px-5 pb-5 text-[13px] text-muted">No results recorded yet.</p>}
        {played.slice().reverse().map((f) => (
          <FixtureRow key={f.id} f={f}
            badge={f.result ? <span className="font-heading font-extrabold text-xs px-2.5 py-1 rounded-[6px] shrink-0 whitespace-nowrap" style={resultStyles[f.result]}>{f.score} {f.result}</span> : null} />
        ))}
      </Card>
    </div>
  );
}

// ── Stats tab ───────────────────────────────────────────────────

function StatsContent({ data }: { data: TeamPageData }) {
  const totalGoals = data.playerStats.reduce((s, p) => s + p.goals, 0);
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_300px]">
      <Card padding="none">
        <div className="px-5 pt-[18px] pb-3"><CardTitle className="text-base">Player Statistics</CardTitle></div>
        <div className="overflow-x-auto">
          <div className="min-w-[420px]">
            <div className="grid grid-cols-[1fr_50px_50px_50px_60px] gap-0 px-5 pb-2 text-[11px] tracking-[0.5px] text-dim font-bold uppercase">
              <div>Player</div><div className="text-center">App</div><div className="text-center">G</div><div className="text-center">A</div><div className="text-center">G+A</div>
            </div>
            {data.playerStats.length === 0 && <div className="px-5 py-8 text-center text-[13px] text-muted border-t border-border-muted">No stats recorded yet.</div>}
            {data.playerStats.map((p) => (
              <div key={p.name} className="grid grid-cols-[1fr_50px_50px_50px_60px] items-center px-5 py-[11px] border-t border-border-muted">
                <div className="flex items-center gap-2 min-w-0"><span className="font-semibold text-sm">{p.name}</span><span className="text-[11px] text-dim font-semibold">{p.pos}</span></div>
                <div className="text-center text-[13.5px] text-secondary">{p.apps}</div>
                <div className="text-center text-[13.5px] text-accent font-bold">{p.goals}</div>
                <div className="text-center text-[13.5px] text-secondary">{p.assists}</div>
                <div className="text-center text-[13.5px] font-heading font-bold">{p.goals + p.assists}</div>
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
              ["Record (W-D-L)", data.hero.record],
              ["Goals scored", String(totalGoals)],
              ["Squad size", String(data.hero.squadCount)],
              ["Win rate", `${data.seasonForm.winRatePct}%`],
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
            <FormSequence results={data.fixtures.filter((f) => f.result).slice(-5).map((f) => f.result!) as FormResult[]} />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Settings tab ────────────────────────────────────────────────

function SettingsContent({ data }: { data: TeamPageData }) {
  const router = useRouter();
  const [name, setName] = useState(data.team.name);
  const [initials, setInitials] = useState(data.team.initials);
  const [venue, setVenue] = useState(data.team.venue ?? "");
  const [color, setColor] = useState(data.team.color);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canEdit = data.team.isCaptain;

  const save = () => {
    setMsg(null);
    startTransition(async () => {
      const res = await saveTeamSettings(data.team.id, { name, initials, venue, color });
      if (res.error) setMsg(res.error);
      else { setMsg("Saved ✓"); router.refresh(); }
    });
  };

  const inputClass = "w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-body outline-none focus:border-accent transition-colors";

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <Card>
        <CardTitle className="text-base mb-4">Team Details</CardTitle>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-heading mb-2">Team name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-heading mb-2">Abbreviation</label>
            <input value={initials} onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 3))} maxLength={3} disabled={!canEdit}
              className="w-[110px] bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-heading font-bold text-center tracking-[1px] outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-heading mb-2">Home venue</label>
            <input value={venue} onChange={(e) => setVenue(e.target.value)} disabled={!canEdit} className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-heading mb-2.5">Club colour</label>
            <div className="flex gap-[11px] flex-wrap">
              {CREST_COLORS.map((c) => (
                <button key={c} onClick={() => canEdit && setColor(c)} className="w-9 h-9 rounded-[10px] cursor-pointer outline-offset-2" style={{ backgroundColor: c, outline: color === c ? "2px solid #34e07f" : "2px solid transparent" }} />
              ))}
            </div>
          </div>
          {msg && <p className={cn("text-[12.5px] font-semibold", msg.includes("✓") ? "text-accent" : "text-loss")}>{msg}</p>}
          {canEdit && <Button variant="primary" size="md" className="self-start mt-2" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save changes"}</Button>}
          {!canEdit && <p className="text-[12px] text-muted">Only the captain can edit team details.</p>}
        </div>
      </Card>

      <Card>
        <CardTitle className="text-base mb-4">League</CardTitle>
        <div className="flex items-center gap-3 p-3 bg-elevated rounded-xl">
          <Avatar initials={data.team.initials} color={data.team.color} size="md" />
          <div className="flex-1">
            <div className="font-bold text-sm">{data.team.leagueName}</div>
            <div className="text-xs text-dim">{data.team.divisionName} · {data.team.seasonName} Season</div>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center justify-between py-1.5"><span className="text-muted text-[13px]">Position</span><span className="font-semibold text-[13px]">{data.hero.position ? `${data.hero.position}${ordinal(data.hero.position)}` : "—"}</span></div>
        </div>
      </Card>
    </div>
  );
}

// ── Root ────────────────────────────────────────────────────────

export function TeamClient({ data }: { data: TeamPageData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("squad");
  const [modalFixture, setModalFixture] = useState<TeamFixtureVM | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl">
      <TeamHero data={data} />

      <div className="mb-5 mt-5 flex gap-1.5 overflow-x-auto border-b border-white/[0.07]">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("mr-[18px] shrink-0 whitespace-nowrap border-0 bg-transparent px-1 py-[11px] text-sm cursor-pointer transition-colors",
              activeTab === tab.id ? "font-bold text-accent border-b-2 border-accent" : "font-semibold text-muted hover:text-secondary")}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "squad" && <SquadContent data={data} onInvite={() => setInviteOpen(true)} />}
      {activeTab === "fixtures" && <FixturesContent data={data} canSubmit={data.team.isCaptain} onOpenModal={setModalFixture} />}
      {activeTab === "stats" && <StatsContent data={data} />}
      {activeTab === "settings" && <SettingsContent data={data} />}

      <TeamResultModal fixture={modalFixture} data={data} onClose={() => setModalFixture(null)} onDone={() => { setModalFixture(null); router.refresh(); }} />
      <InvitePlayerModal teamId={data.team.id} open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}

function InvitePlayerModal({ teamId, open, onClose }: { teamId: string; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const send = () => {
    if (!email.trim()) return;
    setMsg(null);
    startTransition(async () => {
      const res = await invitePlayer(teamId, email.trim());
      if (res.error) setMsg(res.error);
      else { setEmail(""); onClose(); router.refresh(); }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite a player">
      <div className="flex flex-col gap-3 mt-1">
        <p className="text-[12.5px] text-muted leading-[1.5]">Invite a registered FormaXI user by email. They&apos;ll appear on the roster as invited.</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="player@email.com"
          className="w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-2.5 text-primary text-sm font-body outline-none focus:border-accent transition-colors placeholder:text-dim" />
        {msg && <p className="text-[12.5px] text-loss font-semibold">{msg}</p>}
        <Button variant="primary" size="lg" disabled={pending} onClick={send}>{pending ? "Sending…" : "Send invite"}</Button>
      </div>
    </Modal>
  );
}
