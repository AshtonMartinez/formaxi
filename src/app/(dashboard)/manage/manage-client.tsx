"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, CardHeader, Badge, Avatar, Button, StatInline } from "@/components/ui";
import type { LeagueApplication } from "@/lib/types";
import type { ManageData } from "@/lib/supabase/queries";
import {
  approveApplication, rejectApplication, cancelInvitation, inviteCaptain,
  generateFixtures, startSeason,
} from "@/lib/supabase/mutations";

const INVITE_COLORS = ["#1f9a52", "#3b82f6", "#ff6a3d", "#8b5cf6", "#eab308", "#ec4899", "#06b6d4", "#ef4444"];

function scheduleSize(teamCount: number, double: boolean) {
  const mult = double ? 2 : 1;
  const matches = ((teamCount * (teamCount - 1)) / 2) * mult;
  const matchdays = (teamCount % 2 === 0 ? teamCount - 1 : teamCount) * mult;
  return { matches, matchdays };
}

function ManageHero({ data }: { data: ManageData }) {
  const pending = data.applications.length;
  return (
    <div className="rounded-[20px] overflow-hidden border border-border bg-gradient-to-r from-[#10301d] to-[#0f1b13] relative">
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 78px, rgba(255,255,255,0.03) 78px 80px)" }} />
      <div className="relative flex flex-wrap items-center gap-5 p-5 sm:gap-6 sm:p-7">
        <div className="w-[74px] h-[74px] rounded-[18px] bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shrink-0 shadow-[0_8px_24px_rgba(52,224,127,0.3)]">
          <div className="w-[34px] h-[34px] border-[3px] border-[#07140c] rounded-full relative flex items-center justify-center"><div className="absolute w-[3px] h-[34px] bg-[#07140c]" /></div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl font-black leading-none tracking-[-0.6px] sm:text-[28px]">{data.leagueName}</h1>
            <Badge variant="orange" size="md">Organizer</Badge>
          </div>
          <div className="text-secondary text-[13.5px] mt-[7px] flex gap-4 flex-wrap">
            <span>{data.format} · {data.location}</span>
            <span className="text-[#3a4640]">|</span>
            <span>{data.seasonName} Season</span>
            <span className="text-[#3a4640]">|</span>
            <span className={data.seasonStatus === "active" ? "text-accent" : "text-draw"}>{data.seasonStatus === "active" ? "Active" : "Upcoming"}</span>
          </div>
        </div>
        <div className="flex items-center gap-6 sm:ml-auto sm:gap-[26px]">
          <StatInline value={1} label="Divisions" />
          <StatInline value={data.teams.length} label="Teams" valueColor="#34e07f" />
          <StatInline value={pending} label="Pending" valueColor={pending > 0 ? "#d9a925" : undefined} />
        </div>
      </div>
    </div>
  );
}

function FixtureGenerationCard({ data, onAction }: { data: ManageData; onAction: (fn: () => Promise<{ error?: string }>) => void }) {
  const teamCount = data.teams.length;
  const isDouble = data.rounds === "double";
  const generated = data.fixtureCount > 0;
  const live = scheduleSize(teamCount, isDouble);
  const enoughTeams = teamCount >= 2;

  const matchday1 = data.teams.reduce<[typeof data.teams[0], typeof data.teams[0]][]>((pairs, _t, i, arr) => {
    if (i % 2 === 0 && arr[i + 1]) pairs.push([arr[i], arr[i + 1]]);
    return pairs;
  }, []);

  return (
    <Card padding="none">
      <CardHeader className="px-5 pt-[18px] pb-3.5 mb-0">
        <CardTitle className="text-base">Fixture schedule</CardTitle>
        {generated ? <Badge variant="green">Generated</Badge> : <Badge variant="neutral">Not generated</Badge>}
      </CardHeader>

      <div className="px-5 pb-5">
        {!generated ? (
          <>
            <p className="text-secondary text-[13px] leading-[1.55]">
              Teams play a <span className="text-heading font-semibold">{isDouble ? "double" : "single"} round-robin</span> within their division. Generating builds the full schedule from the {teamCount} team{teamCount !== 1 ? "s" : ""} currently in {data.divisionName}.
            </p>
            <div className="mt-4 flex items-center gap-6 rounded-xl bg-input border border-border p-4">
              <div><div className="font-heading font-black text-[26px] leading-none">{live.matches}</div><div className="text-[11px] text-dim font-semibold mt-1">Fixtures</div></div>
              <div className="w-px self-stretch bg-white/[0.07]" />
              <div><div className="font-heading font-black text-[26px] leading-none">{live.matchdays}</div><div className="text-[11px] text-dim font-semibold mt-1">Matchdays</div></div>
            </div>
            <Button variant="primary" size="lg" className="mt-4" disabled={!enoughTeams} onClick={() => onAction(() => generateFixtures(data.seasonId))}>Generate fixtures</Button>
            {!enoughTeams && <p className="text-[12px] text-muted mt-2.5 text-center">{data.divisionName} needs at least 2 teams before a schedule can be built.</p>}
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 rounded-xl bg-accent/[0.07] border border-accent/[0.2] p-4">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-darker">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.8L5 9.2 10.5 3.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <div className="text-[13px] leading-[1.5]"><span className="font-semibold text-heading">{data.fixtureCount} fixtures</span><span className="text-secondary"> generated for {data.seasonName}.</span></div>
            </div>

            <div className="mt-4">
              <div className="text-[11px] tracking-[0.5px] text-dim font-bold uppercase mb-2">Matchday 1 (preview)</div>
              <div className="flex flex-col">
                {matchday1.slice(0, 5).map(([home, away]) => (
                  <div key={home.name} className="flex items-center gap-2 py-[7px] border-t border-border-muted text-[13px] font-semibold">
                    <span className="w-[18px] h-[18px] rounded-[5px] shrink-0" style={{ backgroundColor: home.color }} />
                    <span className="truncate">{home.name}</span>
                    <span className="text-dim font-bold mx-0.5">v</span>
                    <span className="w-[18px] h-[18px] rounded-[5px] shrink-0" style={{ backgroundColor: away.color }} />
                    <span className="truncate">{away.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {!data.hasResults ? (
              <>
                <Button variant="secondary" size="md" className="mt-4" onClick={() => onAction(() => generateFixtures(data.seasonId))}>Regenerate schedule</Button>
                <p className="text-[12px] text-muted mt-2.5 leading-[1.5]">Regenerating wipes and rebuilds the whole schedule. This locks once the first result is entered.</p>
              </>
            ) : (
              <p className="text-[12px] text-muted mt-4 leading-[1.5]">The schedule is locked — results have been submitted for this season.</p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function ApplicationsCard({ applications, onAction }: { applications: LeagueApplication[]; onAction: (fn: () => Promise<{ error?: string }>) => void }) {
  return (
    <Card padding="none">
      <CardHeader className="px-5 pt-[18px] pb-3 mb-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Team applications</CardTitle>
          {applications.length > 0 && <span className="font-bold text-[11px] px-2 py-0.5 rounded-[5px] bg-draw/[0.16] text-draw">{applications.length}</span>}
        </div>
      </CardHeader>
      {applications.length === 0 ? (
        <p className="px-5 pb-5 text-[13px] text-muted">No pending applications. Teams that apply via Discover show up here.</p>
      ) : applications.map((app) => (
        <div key={app.id} className="px-5 py-3.5 border-t border-border-muted">
          <div className="flex items-center gap-3">
            <Avatar initials={app.teamInitials} color={app.teamColor} size="md" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{app.teamName}</div>
              <div className="text-[12px] text-dim truncate">Captain · {app.personName}</div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button variant="accent-soft" size="sm" onClick={() => onAction(() => approveApplication(app.id))}>Approve</Button>
              <Button variant="ghost" size="sm" onClick={() => onAction(() => rejectApplication(app.id))}>Reject</Button>
            </div>
          </div>
          {app.message && <p className="text-[12.5px] text-secondary mt-2 pl-[52px] leading-[1.5]">“{app.message}”</p>}
        </div>
      ))}
    </Card>
  );
}

function SentInvitesCard({ invites, onAction }: { invites: LeagueApplication[]; onAction: (fn: () => Promise<{ error?: string }>) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sent invitations</CardTitle>
        {invites.length > 0 && <Badge variant="neutral">{invites.length} pending</Badge>}
      </CardHeader>
      {invites.length === 0 ? (
        <p className="text-[13px] text-muted">No invitations awaiting a response.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 p-3 bg-elevated rounded-xl">
              <Avatar initials={inv.teamInitials} color={inv.teamColor} size="sm" className="h-[38px] w-[38px]" />
              <div className="flex-1 min-w-0"><div className="font-bold text-[13.5px] truncate">{inv.teamName}</div><div className="text-[11.5px] text-dim truncate">{inv.personName}</div></div>
              <Button variant="ghost" size="sm" className="shrink-0" onClick={() => onAction(() => cancelInvitation(inv.id))}>Cancel</Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function InviteCaptainCard({ leagueId, onAction }: { leagueId: string; onAction: (fn: () => Promise<{ error?: string }>) => Promise<boolean> }) {
  const [person, setPerson] = useState("");
  const [teamName, setTeamName] = useState("");
  const [initials, setInitials] = useState("");
  const [color, setColor] = useState(INVITE_COLORS[1]);
  const [pending, setPending] = useState(false);

  const canSend = person.trim() && teamName.trim() && initials.trim().length >= 2;

  const send = async () => {
    if (!canSend) return;
    setPending(true);
    const ok = await onAction(() => inviteCaptain(leagueId, { person: person.trim(), teamName: teamName.trim(), initials: initials.trim(), color }));
    setPending(false);
    if (ok) { setPerson(""); setTeamName(""); setInitials(""); setColor(INVITE_COLORS[1]); }
  };

  const inputClass = "w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-2.5 text-primary text-sm font-body outline-none focus:border-accent transition-colors placeholder:text-dim";

  return (
    <Card>
      <CardTitle className="text-base mb-1">Invite a captain</CardTitle>
      <p className="text-[12.5px] text-muted mb-4 leading-[1.5]">Invite a registered user by email to bring a team in. They confirm the details when they accept.</p>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-[12.5px] font-semibold text-heading mb-1.5">Captain email</label>
          <input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="captain@email.com" className={inputClass} />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[12.5px] font-semibold text-heading mb-1.5">Team name</label>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Wapping Wanderers" className={inputClass} />
          </div>
          <div className="w-[92px]">
            <label className="block text-[12.5px] font-semibold text-heading mb-1.5">Abbrev.</label>
            <input value={initials} onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 3))} onKeyDown={(e: KeyboardEvent) => { if (e.key === "Enter") send(); }} maxLength={3} placeholder="WW"
              className="w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-2.5 text-primary text-sm font-heading font-bold text-center tracking-[1px] outline-none focus:border-accent transition-colors placeholder:text-dim" />
          </div>
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-heading mb-2">Club colour</label>
          <div className="flex gap-2 flex-wrap">
            {INVITE_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} aria-label={`Select colour ${c}`} className="w-8 h-8 rounded-[9px] cursor-pointer outline-offset-2" style={{ backgroundColor: c, outline: color === c ? "2px solid #34e07f" : "2px solid transparent" }} />
            ))}
          </div>
        </div>
        <Button variant="primary" size="md" className="self-start mt-1" disabled={!canSend || pending} onClick={send}>{pending ? "Sending…" : "Send invite"}</Button>
      </div>
    </Card>
  );
}

function DivisionOverview({ data }: { data: ManageData }) {
  return (
    <Card padding="none">
      <CardHeader className="px-5 pt-[18px] pb-3 mb-0">
        <CardTitle className="text-base">{data.divisionName}</CardTitle>
        <Badge variant="green">{data.teams.length} teams</Badge>
      </CardHeader>
      <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-x-5">
        {data.teams.length === 0 && <p className="py-2 text-[13px] text-muted">No teams yet — approve applications or invite captains.</p>}
        {data.teams.map((t) => (
          <div key={t.name} className="flex items-center gap-2.5 py-2 border-t border-border-muted">
            <Avatar initials={t.initials} color={t.color} size="xs" />
            <span className="font-semibold text-[13px] truncate">{t.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SeasonCard({ data, onAction }: { data: ManageData; onAction: (fn: () => Promise<{ error?: string }>) => void }) {
  const started = data.seasonStatus === "active";
  const canStart = data.fixtureCount > 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Season</CardTitle>
        <Badge variant={started ? "green" : "yellow"}>{started ? "Active" : "Upcoming"}</Badge>
      </CardHeader>
      <div className="flex flex-col gap-2">
        {([["Season", data.seasonName], ["Structure", data.rounds === "double" ? "Double round-robin" : "Single round-robin"], ["Fixtures", String(data.fixtureCount)]] as const).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/[0.05] last:border-0">
            <span className="text-muted text-[13px]">{label}</span><span className="font-semibold text-[13px]">{value}</span>
          </div>
        ))}
      </div>
      <Button variant="secondary" size="md" className="w-full mt-4" disabled={!canStart || started} onClick={() => onAction(() => startSeason(data.seasonId))}>
        {started ? "Season started" : "Start season"}
      </Button>
      {!canStart && !started && <p className="text-[12px] text-muted mt-2.5 text-center leading-[1.5]">Generate the fixture schedule before starting the season.</p>}
    </Card>
  );
}

export function ManageClient({ data }: { data: ManageData }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const run = (fn: () => Promise<{ error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else router.refresh();
    });
  };

  // Variant that reports success synchronously for the invite form's local reset.
  const runAsync = async (fn: () => Promise<{ error?: string }>) => {
    setError(null);
    const res = await fn();
    if (res.error) { setError(res.error); return false; }
    router.refresh();
    return true;
  };

  return (
    <div className="mx-auto max-w-7xl">
      <ManageHero data={data} />

      {error && <p className="mt-3 text-[12.5px] text-loss font-semibold">{error}</p>}

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <FixtureGenerationCard data={data} onAction={run} />
          <ApplicationsCard applications={data.applications} onAction={run} />
          <DivisionOverview data={data} />
        </div>
        <div className="flex flex-col gap-5">
          <SeasonCard data={data} onAction={run} />
          <InviteCaptainCard leagueId={data.leagueId} onAction={runAsync} />
          <SentInvitesCard invites={data.invitations} onAction={run} />
        </div>
      </div>
    </div>
  );
}
