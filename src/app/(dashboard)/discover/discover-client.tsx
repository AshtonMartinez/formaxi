"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DiscoverLeague } from "@/lib/supabase/queries";
import { applyToLeague } from "@/lib/supabase/mutations";

type FormatFilter = "All" | "11-a-side" | "7-a-side" | "5-a-side";
const formatTabs: FormatFilter[] = ["All", "11-a-side", "7-a-side", "5-a-side"];
const CREST_COLORS = ["#1f9a52", "#3b82f6", "#ff6a3d", "#8b5cf6", "#eab308", "#ec4899", "#06b6d4", "#ef4444"];

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("px-[15px] py-2 rounded-full text-[13px] cursor-pointer transition-colors border-0",
        active ? "bg-accent text-accent-darker font-bold" : "bg-surface-alt border border-border text-heading font-semibold hover:border-accent/30")}>
      {label}
    </button>
  );
}

function SelectFilter({ placeholder, value, options, onChange }: {
  placeholder: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  const isActive = !!value;
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className={cn("flex items-center gap-[7px] bg-surface-alt border rounded-[9px] px-3.5 py-[9px] text-[13px] font-semibold cursor-pointer transition-colors",
          isActive ? "border-accent text-accent" : "border-border text-heading hover:border-white/[0.12]")}>
        {value || placeholder}
        <span className={cn("text-xs transition-transform", open && "rotate-180", isActive ? "text-accent" : "text-dim")}>▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 min-w-[160px] bg-elevated border border-border rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.4)] z-20 py-1 overflow-hidden">
          {value && (
            <button onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-left px-3.5 py-2.5 text-[13px] text-dim font-semibold hover:bg-white/[0.06] cursor-pointer transition-colors">Clear filter</button>
          )}
          {options.map((opt) => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              className={cn("w-full text-left px-3.5 py-2.5 text-[13px] font-semibold hover:bg-white/[0.06] cursor-pointer transition-colors", value === opt ? "text-accent" : "text-heading")}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LeagueCardItem({ league, applied, onJoin }: { league: DiscoverLeague; applied: boolean; onJoin: () => void }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden hover:bg-elevated hover:border-accent/30 transition-colors group">
      <div className="h-[84px] relative flex items-end px-4 py-3" style={{ background: league.bannerGradient }}>
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg,transparent 0 38px,rgba(255,255,255,0.06) 38px 40px)" }} />
        <span className="relative font-bold text-[11px] px-2.5 py-1 rounded-full" style={{ backgroundColor: league.tagBg, color: league.tagColor }}>{league.spots}</span>
      </div>
      <div className="px-[18px] py-4">
        <Avatar initials={league.initials} color={league.crestColor} size="md" className="-mt-[34px] border-[3px] border-surface" />
        <h3 className="font-heading font-extrabold text-[17px] mt-2">{league.name}</h3>
        <div className="text-muted text-[13px] mt-1">{league.format} · {league.location}</div>
        <div className="flex gap-3.5 mt-3.5 pt-[13px] border-t border-white/[0.06]">
          <div><div className="text-[11px] text-dim font-semibold">When</div><div className="font-bold text-[13px] mt-0.5">{league.day}</div></div>
          <div><div className="text-[11px] text-dim font-semibold">Cost</div><div className="font-bold text-[13px] mt-0.5">{league.fee}</div></div>
          {applied ? (
            <span className="ml-auto self-center text-[12.5px] font-bold text-accent px-2">Applied ✓</span>
          ) : (
            <Button variant="accent-soft" size="sm" className="ml-auto self-center" onClick={onJoin}>Join</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function JoinModal({ league, onClose, onApplied }: {
  league: DiscoverLeague | null; onClose: () => void; onApplied: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [color, setColor] = useState(CREST_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const inputClass = "w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-2.5 text-primary text-sm font-body outline-none focus:border-accent transition-colors placeholder:text-dim";

  const submit = () => {
    if (!league) return;
    if (!name.trim() || initials.trim().length < 2) { setError("Enter a team name and a 2–3 letter abbreviation."); return; }
    setError(null);
    startTransition(async () => {
      const res = await applyToLeague(league.id, { name, initials, color });
      if (res.error) setError(res.error);
      else { onApplied(league.id); onClose(); }
    });
  };

  return (
    <Modal open={!!league} onClose={onClose} title={league ? `Apply to ${league.name}` : "Apply"}>
      {league && (
        <div className="flex flex-col gap-3 mt-1">
          <p className="text-[12.5px] text-muted leading-[1.5]">
            Send a team application. The organizer reviews it and your team is created when they approve.
          </p>
          <div>
            <label className="block text-[12.5px] font-semibold text-heading mb-1.5">Team name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riverside FC" className={inputClass} />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-heading mb-1.5">Abbreviation</label>
            <input value={initials} onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 3))} maxLength={3} placeholder="RF"
              className="w-[110px] bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-2.5 text-primary text-sm font-heading font-bold text-center tracking-[1px] outline-none focus:border-accent transition-colors placeholder:text-dim" />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-heading mb-2">Club colour</label>
            <div className="flex gap-2 flex-wrap">
              {CREST_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} aria-label={`Colour ${c}`}
                  className="w-8 h-8 rounded-[9px] cursor-pointer outline-offset-2"
                  style={{ backgroundColor: c, outline: color === c ? "2px solid #34e07f" : "2px solid transparent" }} />
              ))}
            </div>
          </div>
          {error && <p className="text-[12.5px] text-loss font-semibold">{error}</p>}
          <Button variant="primary" size="lg" className="mt-1" disabled={pending} onClick={submit}>
            {pending ? "Sending…" : "Send application"}
          </Button>
        </div>
      )}
    </Modal>
  );
}

export function DiscoverClient({ leagues, signedIn }: { leagues: DiscoverLeague[]; signedIn: boolean }) {
  const router = useRouter();
  const [activeFormat, setActiveFormat] = useState<FormatFilter>("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [joinTarget, setJoinTarget] = useState<DiscoverLeague | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(
    () => new Set(leagues.filter((l) => l.alreadyApplied).map((l) => l.id)),
  );

  const uniqueLocations = [...new Set(leagues.map((l) => l.location))].sort();
  const uniqueDays = [...new Set(leagues.map((l) => l.day))].sort();

  const filtered = leagues.filter((lg) => {
    const matchesFormat = activeFormat === "All" || lg.format === activeFormat;
    const matchesLocation = !locationFilter || lg.location === locationFilter;
    const matchesDay = !dayFilter || lg.day === dayFilter;
    return matchesFormat && matchesLocation && matchesDay;
  });

  const hasFilter = activeFormat !== "All" || !!locationFilter || !!dayFilter;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-black tracking-[-0.5px] sm:text-[26px]">Find your next league</h1>
          <p className="text-muted text-sm mt-1.5">
            {filtered.length} league{filtered.length !== 1 ? "s" : ""}{hasFilter ? " matching your filters" : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <SelectFilter placeholder="📍 Any location" value={locationFilter} options={uniqueLocations} onChange={setLocationFilter} />
          <SelectFilter placeholder="📅 Any day" value={dayFilter} options={uniqueDays} onChange={setDayFilter} />
        </div>
      </div>

      <div className="flex gap-2 mb-[22px] flex-wrap">
        {formatTabs.map((tab) => (
          <FilterChip key={tab} label={tab} active={activeFormat === tab} onClick={() => setActiveFormat(tab)} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((lg) => (
          <LeagueCardItem
            key={lg.id}
            league={lg}
            applied={appliedIds.has(lg.id)}
            onJoin={() => (signedIn ? setJoinTarget(lg) : router.push("/login"))}
          />
        ))}
        {leagues.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted">
            No public leagues yet. <a href="/create" className="text-accent underline">Create the first one →</a>
          </div>
        )}
        {leagues.length > 0 && filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted">
            No leagues match these filters.{" "}
            <button onClick={() => { setActiveFormat("All"); setLocationFilter(""); setDayFilter(""); }}
              className="text-accent underline cursor-pointer bg-transparent border-0">Clear all</button>
          </div>
        )}
      </div>

      <JoinModal
        league={joinTarget}
        onClose={() => setJoinTarget(null)}
        onApplied={(id) => { setAppliedIds((prev) => new Set(prev).add(id)); router.refresh(); }}
      />
    </div>
  );
}
