"use client";

import { useState, useEffect, type KeyboardEvent } from "react";
import { Card, Button, Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

type CreateTab = "league" | "team";
type LeagueFormat = "5" | "7" | "11";
type RoundsType = "single" | "double";
type TiebreakType = "gd" | "h2h";
type VisibilityType = "public" | "invite";

interface LeagueState {
  name: string;
  slug: string;
  format: LeagueFormat;
  region: string;
  desc: string;
  teams: number;
  /** Number of divisions. Always 1 in MVP; wired up in the Structure step when multi-division ships. */
  divisions: number;
  rounds: RoundsType;
  days: string[];
  start: string;
  win: number;
  draw: number;
  tiebreak: TiebreakType;
  autoFix: boolean;
  visibility: VisibilityType;
  invites: string[];
}

interface TeamState {
  name: string;
  short: string;
  color: string;
  venue: string;
  days: string[];
  founded: string;
  league: string;
  invites: string[];
}

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CREST_COLORS = ["#1f9a52", "#3b82f6", "#ff6a3d", "#8b5cf6", "#eab308", "#ec4899", "#06b6d4", "#ef4444"];
const FORMAT_MAP: Record<LeagueFormat, string> = { "5": "5-a-side", "7": "7-a-side", "11": "11-a-side" };

const leagueSteps = ["Basics", "Structure", "Rules", "Invite"];
const teamSteps   = ["Identity", "Home", "League", "Squad"];

const joinLeagues = [
  { id: "scl",  name: "Sunday City League", meta: "11-a-side · Hackney · 2 spots", initials: "SC", bg: "#1f9a52" },
  { id: "e7",   name: "East London 7s",     meta: "7-a-side · Mile End · 4 spots", initials: "E7", bg: "#ff6a3d" },
  { id: "p5",   name: "Powerleague 5s",     meta: "5-a-side · Shoreditch · Open",  initials: "P5", bg: "#3b82f6" },
  { id: "none", name: "Skip for now",       meta: "Create the team and join a league later", initials: "—", bg: "#33433a" },
];

const toSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ── Shared primitives ──────────────────────────────────────────

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  className,
  prefix,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  prefix?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[13px] font-semibold text-heading mb-2">{label}</label>
      {prefix ? (
        <div className="flex items-center bg-input border border-white/[0.09] rounded-[10px] overflow-hidden focus-within:border-accent transition-colors">
          <span className="px-3 text-[13px] text-dim font-semibold whitespace-nowrap border-r border-white/[0.09]">{prefix}</span>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent px-3 py-3 text-primary text-sm font-body outline-none placeholder:text-dim"
          />
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-body outline-none focus:border-accent transition-colors placeholder:text-dim"
        />
      )}
    </div>
  );
}

function SegmentButton({ label, sub, active, onClick }: { label: string; sub?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 text-center py-[13px] px-2 rounded-[11px] border-[1.5px] cursor-pointer transition-colors",
        active ? "bg-accent/[0.12] border-accent text-accent" : "bg-input border-white/[0.09] text-secondary",
      )}
    >
      <div className="font-bold text-[13.5px]">{label}</div>
      {sub && <div className="text-[11px] text-dim mt-[3px]">{sub}</div>}
    </button>
  );
}

function DayChips({ selected, onToggle }: { selected: string[]; onToggle: (d: string) => void }) {
  return (
    <div className="flex gap-[7px] flex-wrap">
      {ALL_DAYS.map((d) => {
        const sel = selected.includes(d);
        return (
          <button
            key={d}
            onClick={() => onToggle(d)}
            className={cn(
              "w-[46px] text-center py-2.5 rounded-[10px] border-[1.5px] font-bold text-[12.5px] cursor-pointer transition-colors",
              sel ? "bg-accent border-accent text-accent-darker" : "bg-input border-white/[0.09] text-secondary",
            )}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}

function NumberStepper({ value, onChange, min, max, label }: { value: number; onChange: (v: number) => void; min: number; max: number; label?: string }) {
  return (
    <div className="flex-1 bg-input border border-white/[0.08] rounded-xl p-3.5 text-center">
      {label && <div className="text-[11px] text-dim font-bold uppercase tracking-[0.5px]">{label}</div>}
      <div className="flex items-center justify-center gap-3 mt-2">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="w-7 h-7 rounded-lg bg-white/[0.05] text-heading text-[17px] flex items-center justify-center cursor-pointer hover:bg-white/[0.10] transition-colors">−</button>
        <span className="font-heading font-extrabold text-[22px] min-w-[20px]">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="w-7 h-7 rounded-lg bg-white/[0.05] text-heading text-base flex items-center justify-center cursor-pointer hover:bg-white/[0.10] transition-colors">+</button>
      </div>
    </div>
  );
}

function InviteList({ invites, onRemove, statusLabel }: { invites: string[]; onRemove: (i: number) => void; statusLabel: string }) {
  return (
    <div className="flex flex-col gap-2">
      {invites.map((email, i) => (
        <div key={i} className="flex items-center gap-[11px] px-3 py-2.5 bg-input rounded-[10px] border border-white/[0.05]">
          <span className="w-[30px] h-[30px] rounded-lg bg-[#1b2820] flex items-center justify-center font-heading font-extrabold text-[11px] text-accent shrink-0">{email.slice(0, 2).toUpperCase()}</span>
          <span className="flex-1 text-[13.5px] text-heading whitespace-nowrap overflow-hidden text-ellipsis">{email}</span>
          <span className="text-[11px] text-draw font-semibold">{statusLabel}</span>
          <button onClick={() => onRemove(i)} className="w-6 h-6 rounded-[7px] text-dim text-base flex items-center justify-center cursor-pointer hover:text-loss hover:bg-loss/[0.1] transition-colors">×</button>
        </div>
      ))}
    </div>
  );
}

// ── Tab selector & stepper ──────────────────────────────────────

function TabSelector({ activeTab, onTabChange }: { activeTab: CreateTab; onTabChange: (t: CreateTab) => void }) {
  return (
    <div className="mb-[26px] flex flex-col gap-2.5 sm:flex-row">
      {([
        { id: "league" as const, icon: "🏆", label: "New League", sub: "Run a competition", iconBg: "bg-accent/[0.14]" },
        { id: "team"   as const, icon: "🛡️", label: "New Team",   sub: "Register a club",  iconBg: "bg-[rgba(255,106,61,0.14)]" },
      ]).map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={cn(
            "flex-1 flex items-center gap-[13px] p-4 px-[18px] rounded-[14px] border-[1.5px] cursor-pointer transition-colors",
            activeTab === t.id ? "bg-accent/[0.10] border-accent text-accent" : "bg-surface border-border text-secondary",
          )}
        >
          <span className={cn("w-[38px] h-[38px] rounded-[11px] flex items-center justify-center shrink-0 text-lg", t.iconBg)}>{t.icon}</span>
          <span className="text-left">
            <span className="block font-bold text-[15px]">{t.label}</span>
            <span className="block text-xs text-dim mt-0.5">{t.sub}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function Stepper({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="flex items-start mb-[26px] px-1.5">
      {steps.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={label} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              <div className="flex-1 h-0.5" style={{ backgroundColor: i === 0 ? "transparent" : i <= currentStep ? "#34e07f" : "rgba(255,255,255,0.1)" }} />
              <div className={cn(
                "w-[30px] h-[30px] rounded-full shrink-0 flex items-center justify-center font-heading font-extrabold text-[13px] border-2",
                done && "bg-accent border-accent text-accent-darker",
                active && "bg-accent/[0.12] border-accent text-accent",
                !done && !active && "bg-input border-white/[0.12] text-dim",
              )}>
                {done ? (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2.5 6.8L5 9.2 10.5 3.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : i + 1}
              </div>
              <div className="flex-1 h-0.5" style={{ backgroundColor: i === steps.length - 1 ? "transparent" : i < currentStep ? "#34e07f" : "rgba(255,255,255,0.1)" }} />
            </div>
            <div className={cn("text-[11.5px] font-semibold mt-[9px] text-center", active ? "text-primary" : done ? "text-secondary" : "text-dim")}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── League steps ────────────────────────────────────────────────

function LeagueStep0({ state, update }: { state: LeagueState; update: (p: Partial<LeagueState>) => void }) {
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!slugTouched && state.name) {
      update({ slug: toSlug(state.name) });
    }
  }, [state.name, slugTouched]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-5">
      <FormInput label="League name" placeholder="e.g. Sunday City League" value={state.name} onChange={(v) => update({ name: v })} />
      <FormInput
        label="League URL"
        placeholder="sunday-city-league"
        prefix="formaxi.app/"
        value={state.slug}
        onChange={(v) => { setSlugTouched(true); update({ slug: v.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-") }); }}
      />
      <div>
        <label className="block text-[13px] font-semibold text-heading mb-2">Format</label>
        <div className="flex gap-2">
          {([
            { v: "5" as const, label: "5-a-side", sub: "Futsal / small" },
            { v: "7" as const, label: "7-a-side", sub: "Mid-size" },
            { v: "11" as const, label: "11-a-side", sub: "Full pitch" },
          ]).map((o) => (
            <SegmentButton key={o.v} label={o.label} sub={o.sub} active={state.format === o.v} onClick={() => update({ format: o.v })} />
          ))}
        </div>
      </div>
      <FormInput label="Region / venue" placeholder="Where matches are played" value={state.region} onChange={(v) => update({ region: v })} />
      <div>
        <label className="block text-[13px] font-semibold text-heading mb-2">Short description</label>
        <textarea
          rows={3}
          value={state.desc}
          onChange={(e) => update({ desc: e.target.value })}
          placeholder="Tell teams what your league is about"
          className="w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-body outline-none focus:border-accent transition-colors resize-none leading-[1.5] placeholder:text-dim"
        />
      </div>
    </div>
  );
}

function LeagueStep1({ state, update }: { state: LeagueState; update: (p: Partial<LeagueState>) => void }) {
  const teamsN = state.teams;
  const multiplier = state.rounds === "double" ? 2 : 1;
  const totalRounds = multiplier * (teamsN - 1);
  const totalMatches = state.rounds === "double" ? teamsN * (teamsN - 1) : (teamsN * (teamsN - 1)) / 2;

  return (
    <div className="flex flex-col gap-[22px]">
      <div>
        <label className="block text-[13px] font-semibold text-heading mb-2.5">Number of teams</label>
        <div className="flex items-center gap-4">
          <button onClick={() => update({ teams: Math.max(2, teamsN - 1) })} className="w-10 h-10 rounded-[11px] bg-input border border-white/[0.12] text-heading text-[22px] flex items-center justify-center cursor-pointer hover:bg-white/[0.06] transition-colors">−</button>
          <div className="font-heading font-black text-[28px] min-w-[44px] text-center">{teamsN}</div>
          <button onClick={() => update({ teams: Math.min(30, teamsN + 1) })} className="w-10 h-10 rounded-[11px] bg-input border border-white/[0.12] text-heading text-xl flex items-center justify-center cursor-pointer hover:bg-white/[0.06] transition-colors">+</button>
          <div className="text-dim text-[12.5px] leading-[1.4]">{totalMatches} matches across<br />{totalRounds} rounds</div>
        </div>
      </div>
      <div>
        <label className="block text-[13px] font-semibold text-heading mb-2">Season structure</label>
        <div className="flex gap-2">
          <SegmentButton label="Single round" sub="Play each team once" active={state.rounds === "single"} onClick={() => update({ rounds: "single" })} />
          <SegmentButton label="Double round" sub="Home & away legs"    active={state.rounds === "double"} onClick={() => update({ rounds: "double" })} />
        </div>
      </div>
      <div>
        <label className="block text-[13px] font-semibold text-heading mb-2.5">Match days</label>
        <DayChips selected={state.days} onToggle={(d) => update({ days: state.days.includes(d) ? state.days.filter((x) => x !== d) : [...state.days, d] })} />
      </div>
      <FormInput label="Season start date" placeholder="" type="date" value={state.start} onChange={(v) => update({ start: v })} className="max-w-[240px] [&_input]:color-scheme-dark" />
    </div>
  );
}

function LeagueStep2({ state, update }: { state: LeagueState; update: (p: Partial<LeagueState>) => void }) {
  return (
    <div className="flex flex-col gap-[22px]">
      <div>
        <label className="block text-[13px] font-semibold text-heading mb-2.5">Points awarded</label>
        <div className="flex gap-2.5">
          <NumberStepper label="Win"  value={state.win}  onChange={(v) => update({ win: v })}  min={0} max={9} />
          <NumberStepper label="Draw" value={state.draw} onChange={(v) => update({ draw: v })} min={0} max={9} />
          <div className="flex-1 bg-input border border-white/[0.08] rounded-xl p-3.5 text-center opacity-70">
            <div className="text-[11px] text-dim font-bold uppercase tracking-[0.5px]">Loss</div>
            <div className="font-heading font-extrabold text-[22px] mt-3.5">0</div>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-[13px] font-semibold text-heading mb-2">Tiebreaker</label>
        <div className="flex gap-2">
          <SegmentButton label="Goal difference" active={state.tiebreak === "gd"}  onClick={() => update({ tiebreak: "gd" })} />
          <SegmentButton label="Head-to-head"    active={state.tiebreak === "h2h"} onClick={() => update({ tiebreak: "h2h" })} />
        </div>
      </div>
      <div>
        <label className="block text-[13px] font-semibold text-heading mb-2">Visibility</label>
        <div className="flex gap-2">
          <SegmentButton label="Public"       sub="Anyone can find & request to join" active={state.visibility === "public"} onClick={() => update({ visibility: "public" })} />
          <SegmentButton label="Invite-only"  sub="You approve every team"            active={state.visibility === "invite"} onClick={() => update({ visibility: "invite" })} />
        </div>
      </div>
      <button onClick={() => update({ autoFix: !state.autoFix })} className="flex items-center gap-[13px] p-3.5 bg-input rounded-xl border border-white/[0.07] cursor-pointer">
        <span className={cn("inline-flex w-10 h-[23px] rounded-full p-0.5 shrink-0 transition-colors", state.autoFix ? "bg-accent justify-end" : "bg-[#33433a] justify-start")}>
          <span className="w-[19px] h-[19px] bg-accent-darker rounded-full" />
        </span>
        <span className="text-left">
          <span className="block font-semibold text-[13.5px]">Auto-generate fixtures</span>
          <span className="block text-xs text-dim">Build the full schedule automatically once teams join</span>
        </span>
      </button>
    </div>
  );
}

function LeagueStep3({ state, update, inviteDraft, setInviteDraft }: { state: LeagueState; update: (p: Partial<LeagueState>) => void; inviteDraft: string; setInviteDraft: (v: string) => void }) {
  const addInvite = () => {
    const v = inviteDraft.trim();
    if (!v) return;
    update({ invites: [...state.invites, v] });
    setInviteDraft("");
  };
  const totalMatches = state.rounds === "double" ? state.teams * (state.teams - 1) : (state.teams * (state.teams - 1)) / 2;
  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <label className="block text-[13px] font-semibold text-heading mb-2">Invite teams by email</label>
        <div className="flex gap-2">
          <input value={inviteDraft} onChange={(e) => setInviteDraft(e.target.value)} onKeyDown={(e: KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); addInvite(); } }} placeholder="team@email.com" className="flex-1 bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-body outline-none focus:border-accent transition-colors placeholder:text-dim" />
          <button onClick={addInvite} className="bg-accent/[0.12] text-accent font-bold text-[13.5px] px-[18px] rounded-[10px] flex items-center cursor-pointer hover:bg-accent hover:text-accent-darker transition-colors">Add</button>
        </div>
      </div>
      <InviteList invites={state.invites} onRemove={(i) => update({ invites: state.invites.filter((_, idx) => idx !== i) })} statusLabel="Pending" />
      <div className="flex items-center gap-3 p-3.5 bg-accent/[0.06] border border-accent/[0.18] rounded-xl mt-1">
        <span className="text-[22px]">✅</span>
        <div className="text-[13px] text-[#bfe9cf] leading-[1.5]">
          Your league is ready. Launching creates the table and {totalMatches} fixtures, and emails {state.invites.length} team invites.
        </div>
      </div>
    </div>
  );
}

// ── Team steps ──────────────────────────────────────────────────

function TeamStep0({ state, update }: { state: TeamState; update: (p: Partial<TeamState>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-4 items-end">
        <FormInput label="Team name" placeholder="e.g. Riverside FC" value={state.name} onChange={(v) => update({ name: v })} className="flex-1" />
        <div className="w-[110px]">
          <label className="block text-[13px] font-semibold text-heading mb-2">Abbrev.</label>
          <input value={state.short} onChange={(e) => update({ short: e.target.value.toUpperCase().slice(0, 3) })} maxLength={3} placeholder="RF" className="w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-heading font-bold text-center tracking-[1px] outline-none focus:border-accent transition-colors placeholder:text-dim" />
        </div>
      </div>
      <div>
        <label className="block text-[13px] font-semibold text-heading mb-2.5">Club colour</label>
        <div className="flex gap-[11px] flex-wrap">
          {CREST_COLORS.map((c) => (
            <button key={c} onClick={() => update({ color: c })} className="w-9 h-9 rounded-[10px] cursor-pointer outline-offset-2 transition-shadow" style={{ backgroundColor: c, outline: state.color === c ? "2px solid #34e07f" : "2px solid transparent" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamStep1({ state, update }: { state: TeamState; update: (p: Partial<TeamState>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <FormInput label="Home venue" placeholder="Your home pitch" value={state.venue} onChange={(v) => update({ venue: v })} />
      <div>
        <label className="block text-[13px] font-semibold text-heading mb-2.5">Preferred match days</label>
        <DayChips selected={state.days} onToggle={(d) => update({ days: state.days.includes(d) ? state.days.filter((x) => x !== d) : [...state.days, d] })} />
      </div>
      <FormInput label="Founded" placeholder="2021" value={state.founded} onChange={(v) => update({ founded: v })} className="max-w-[200px]" />
    </div>
  );
}

function TeamStep2({ state, update }: { state: TeamState; update: (p: Partial<TeamState>) => void }) {
  return (
    <div className="flex flex-col gap-2.5">
      {joinLeagues.map((l) => {
        const sel = state.league === l.id;
        return (
          <button key={l.id} onClick={() => update({ league: l.id })} className={cn("flex items-center gap-[13px] p-3.5 rounded-[13px] border-[1.5px] cursor-pointer transition-colors", sel ? "bg-accent/[0.06] border-accent" : "bg-input border-white/[0.08]")}>
            <Avatar initials={l.initials} color={l.bg} size="md" />
            <span className="flex-1 text-left">
              <span className="block font-bold text-sm">{l.name}</span>
              <span className="block text-xs text-dim mt-0.5">{l.meta}</span>
            </span>
            <span className={cn("w-5 h-5 rounded-full border-2 shrink-0", sel ? "border-accent bg-accent" : "border-white/[0.25] bg-white/[0.18]")} />
          </button>
        );
      })}
    </div>
  );
}

function TeamStep3({ state, update, inviteDraft, setInviteDraft }: { state: TeamState; update: (p: Partial<TeamState>) => void; inviteDraft: string; setInviteDraft: (v: string) => void }) {
  const addInvite = () => {
    const v = inviteDraft.trim();
    if (!v) return;
    update({ invites: [...state.invites, v] });
    setInviteDraft("");
  };
  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <label className="block text-[13px] font-semibold text-heading mb-2">Invite players by email</label>
        <div className="flex gap-2">
          <input value={inviteDraft} onChange={(e) => setInviteDraft(e.target.value)} onKeyDown={(e: KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); addInvite(); } }} placeholder="player@email.com" className="flex-1 bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-body outline-none focus:border-accent transition-colors placeholder:text-dim" />
          <button onClick={addInvite} className="bg-accent/[0.12] text-accent font-bold text-[13.5px] px-[18px] rounded-[10px] flex items-center cursor-pointer hover:bg-accent hover:text-accent-darker transition-colors">Add</button>
        </div>
      </div>
      <InviteList invites={state.invites} onRemove={(i) => update({ invites: state.invites.filter((_, idx) => idx !== i) })} statusLabel="Invited" />
    </div>
  );
}

// ── Live preview sidebar ────────────────────────────────────────

function LeaguePreview({ state }: { state: LeagueState }) {
  const teamsN = state.teams;
  const totalMatches = state.rounds === "double" ? teamsN * (teamsN - 1) : (teamsN * (teamsN - 1)) / 2;
  const startNice = (() => {
    try { return new Date(state.start + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return state.start || "Not set"; }
  })();

  const rows = [
    ["Format",           FORMAT_MAP[state.format]],
    ["URL slug",         state.slug ? `formaxi.app/${state.slug}` : "Not set"],
    ["Teams",            String(state.teams)],
    ["Structure",        state.rounds === "double" ? "Double round-robin" : "Single round-robin"],
    ["Match days",       state.days.length ? state.days.join(", ") : "Not set"],
    ["Starts",           startNice],
    ["Points (W/D/L)",   `${state.win} / ${state.draw} / 0`],
    ["Visibility",       state.visibility === "public" ? "Public" : "Invite-only"],
    ["Invited",          `${state.invites.length} teams`],
  ];

  return (
    <div className="sticky top-[88px]">
      <div className="bg-gradient-to-br from-[#13261a] to-[#0f1b13] border border-accent/[0.16] rounded-[18px] p-5 overflow-hidden">
        <div className="text-[11px] tracking-[1px] text-accent font-bold uppercase">League preview</div>
        <div className="flex items-center gap-3 my-3.5 mb-4">
          <div className="w-12 h-12 rounded-[13px] bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shrink-0">
            <div className="w-[22px] h-[22px] border-[2.6px] border-[#07140c] rounded-full relative flex items-center justify-center">
              <div className="absolute w-[2.6px] h-[22px] bg-[#07140c]" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-heading font-extrabold text-base whitespace-nowrap overflow-hidden text-ellipsis">{state.name || "Untitled League"}</div>
            <div className="text-xs text-muted whitespace-nowrap overflow-hidden text-ellipsis">{state.region || "No region set"}</div>
          </div>
        </div>
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between py-[9px] border-t border-white/[0.06] gap-3">
            <span className="text-muted text-[12.5px] shrink-0">{label}</span>
            <span className={cn(
              "font-semibold text-[12.5px] text-right break-all",
              (label === "Invited" || label === "URL slug") && "text-accent",
            )}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamPreview({ state }: { state: TeamState }) {
  const selectedLeague = joinLeagues.find((l) => l.id === state.league);
  const rows = [
    ["Abbreviation",    state.short || "—"],
    ["Home",            state.venue || "Not set"],
    ["Match days",      state.days.length ? state.days.join(", ") : "Not set"],
    ["League",          selectedLeague?.name ?? "Not selected"],
    ["Players invited", String(state.invites.length)],
  ];
  return (
    <div className="sticky top-[88px]">
      <div className="bg-gradient-to-br from-[#1a2030] to-[#0f1b13] border border-white/[0.1] rounded-[18px] p-5 overflow-hidden">
        <div className="text-[11px] tracking-[1px] text-orange font-bold uppercase">Team preview</div>
        <div className="flex flex-col items-center my-4 mb-[18px]">
          <div className="w-[66px] h-[66px] rounded-[18px] flex items-center justify-center font-heading font-black text-[22px] text-white shadow-[0_8px_22px_rgba(0,0,0,0.35)]" style={{ backgroundColor: state.color }}>{state.short || "?"}</div>
          <div className="font-heading font-extrabold text-[17px] mt-3 text-center">{state.name || "Untitled Team"}</div>
        </div>
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-[9px] border-t border-white/[0.06]">
            <span className="text-muted text-[12.5px]">{label}</span>
            <span className={cn("font-semibold text-[12.5px] max-w-[150px] text-right whitespace-nowrap overflow-hidden text-ellipsis", label === "Players invited" && "text-accent")}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────

export default function CreatePage() {
  const [tab, setTab] = useState<CreateTab>("league");
  const [step, setStep] = useState(0);
  const [inviteDraft, setInviteDraft] = useState("");

  const [league, setLeague] = useState<LeagueState>({
    name: "Sunday City League", slug: "sunday-city-league", format: "11",
    region: "Hackney Marshes, London",
    desc: "Competitive 11-a-side Sunday football for East London clubs.",
    teams: 10, divisions: 1, rounds: "double", days: ["Sun"], start: "2026-09-06",
    win: 3, draw: 1, tiebreak: "gd", autoFix: true, visibility: "invite",
    invites: ["ravenswood.fc@email.com", "olympic.ath@email.com"],
  });

  const [team, setTeam] = useState<TeamState>({
    name: "Riverside FC", short: "RF", color: "#1f9a52",
    venue: "Hackney Marshes P3", days: ["Sun"], founded: "2021",
    league: "scl", invites: ["m.okafor@email.com", "j.cole@email.com", "p.larsson@email.com"],
  });

  const updateLeague = (p: Partial<LeagueState>) => setLeague((s) => ({ ...s, ...p }));
  const updateTeam   = (p: Partial<TeamState>)   => setTeam((s)   => ({ ...s, ...p }));

  const steps = tab === "league" ? leagueSteps : teamSteps;
  const isLast = step === 3;

  const stepTitles = tab === "league"
    ? ["League basics", "Competition structure", "Rules & scoring", "Invite teams & launch"]
    : ["Team identity", "Home ground", "Choose a league", "Build your squad"];
  const stepSubs = tab === "league"
    ? ["Name your competition and pick a format", "Set the size and shape of the season", "Define how points and ranking work", "Send invites and review before going live"]
    : ["Name, badge and club colours", "Where and when you play", "Register in a league, or skip for now", "Invite players and review your team"];

  const renderStep = () => {
    if (tab === "league") {
      switch (step) {
        case 0: return <LeagueStep0 state={league} update={updateLeague} />;
        case 1: return <LeagueStep1 state={league} update={updateLeague} />;
        case 2: return <LeagueStep2 state={league} update={updateLeague} />;
        case 3: return <LeagueStep3 state={league} update={updateLeague} inviteDraft={inviteDraft} setInviteDraft={setInviteDraft} />;
      }
    } else {
      switch (step) {
        case 0: return <TeamStep0 state={team} update={updateTeam} />;
        case 1: return <TeamStep1 state={team} update={updateTeam} />;
        case 2: return <TeamStep2 state={team} update={updateTeam} />;
        case 3: return <TeamStep3 state={team} update={updateTeam} inviteDraft={inviteDraft} setInviteDraft={setInviteDraft} />;
      }
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-heading text-2xl font-black tracking-[-0.5px] sm:text-[26px]">Create</h1>
      <p className="text-muted text-sm mt-1.5">
        Set up a new competition or register your team — we&apos;ll walk you through it.
      </p>

      <div className="mt-[22px]">
        <TabSelector activeTab={tab} onTabChange={(t) => { setTab(t); setStep(0); setInviteDraft(""); }} />
      </div>

      <Stepper steps={steps} currentStep={step} />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_318px]">
        <Card className="flex flex-col">
          <div className="mb-[22px]">
            <h2 className="font-heading font-extrabold text-[19px] tracking-[-0.3px]">{stepTitles[step]}</h2>
            <p className="text-muted text-[13px] mt-1">{stepSubs[step]}</p>
          </div>
          {renderStep()}
          <div className="flex justify-between items-center mt-7 pt-[22px] border-t border-white/[0.06]">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>← Back</Button>
            ) : <span />}
            <Button variant="primary" onClick={() => step < 3 && setStep(step + 1)}>
              {isLast ? (tab === "league" ? "Launch league" : "Create team") : "Continue"}
            </Button>
          </div>
        </Card>
        {tab === "league" ? <LeaguePreview state={league} /> : <TeamPreview state={team} />}
      </div>
    </div>
  );
}
