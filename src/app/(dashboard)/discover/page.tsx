"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { LeagueCard } from "@/lib/types";

const leagues: LeagueCard[] = [
  { name: "Sunday City League",   initials: "SC",  crestColor: "#1f9a52", format: "11-a-side", location: "Hackney",      day: "Sundays",    fee: "£45/season", spots: "2 spots left", tagBg: "rgba(52,224,127,0.18)",  tagColor: "#34e07f", bannerGradient: "linear-gradient(120deg,#10301d,#0f1b13)" },
  { name: "Powerleague 5s",       initials: "P5",  crestColor: "#3b82f6", format: "5-a-side",  location: "Shoreditch",   day: "Tuesdays",   fee: "£6/match",   spots: "Open",         tagBg: "rgba(59,130,246,0.2)",   tagColor: "#7fb0ff", bannerGradient: "linear-gradient(120deg,#13202e,#0f1b13)" },
  { name: "East London 7s",       initials: "E7",  crestColor: "#ff6a3d", format: "7-a-side",  location: "Mile End",     day: "Thursdays",  fee: "£8/match",   spots: "4 spots left", tagBg: "rgba(255,106,61,0.2)",   tagColor: "#ff9a72", bannerGradient: "linear-gradient(120deg,#2e1a12,#0f1b13)" },
  { name: "Veterans Over-35",     initials: "V35", crestColor: "#64748b", format: "11-a-side", location: "Wanstead",     day: "Sundays",    fee: "£40/season", spots: "Waitlist",     tagBg: "rgba(255,255,255,0.12)", tagColor: "#aeb9b1", bannerGradient: "linear-gradient(120deg,#1b2228,#0f1b13)" },
  { name: "Women's Premier",      initials: "WP",  crestColor: "#ec4899", format: "11-a-side", location: "Stratford",    day: "Saturdays",  fee: "£42/season", spots: "6 spots left", tagBg: "rgba(236,72,153,0.2)",   tagColor: "#ff86c2", bannerGradient: "linear-gradient(120deg,#2a1320,#0f1b13)" },
  { name: "Corporate Kickabout",  initials: "CK",  crestColor: "#8b5cf6", format: "5-a-side",  location: "Canary Wharf", day: "Wednesdays", fee: "£7/match",   spots: "Open",         tagBg: "rgba(139,92,246,0.2)",   tagColor: "#b69bff", bannerGradient: "linear-gradient(120deg,#1c1630,#0f1b13)" },
  { name: "Hackney 7s",           initials: "H7",  crestColor: "#14b8a6", format: "7-a-side",  location: "Hackney",      day: "Saturdays",  fee: "£9/match",   spots: "3 spots left", tagBg: "rgba(20,184,166,0.18)",  tagColor: "#5eead4", bannerGradient: "linear-gradient(120deg,#0d2623,#0f1b13)" },
  { name: "Stratford 5s",         initials: "S5",  crestColor: "#eab308", format: "5-a-side",  location: "Stratford",    day: "Thursdays",  fee: "£6/match",   spots: "Open",         tagBg: "rgba(234,179,8,0.18)",   tagColor: "#facc15", bannerGradient: "linear-gradient(120deg,#221c00,#0f1b13)" },
  { name: "Leyton Sunday League", initials: "LS",  crestColor: "#ef4444", format: "11-a-side", location: "Leyton",       day: "Sundays",    fee: "£38/season", spots: "5 spots left", tagBg: "rgba(239,68,68,0.18)",   tagColor: "#fca5a5", bannerGradient: "linear-gradient(120deg,#2e0f0f,#0f1b13)" },
];

type FormatFilter = "All" | "11-a-side" | "7-a-side" | "5-a-side" | "Pickup";
const formatTabs: FormatFilter[] = ["All", "11-a-side", "7-a-side", "5-a-side", "Pickup"];

// ── Filter chip ─────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-[15px] py-2 rounded-full text-[13px] cursor-pointer transition-colors border-0",
        active
          ? "bg-accent text-accent-darker font-bold"
          : "bg-surface-alt border border-border text-heading font-semibold hover:border-accent/30",
      )}
    >
      {label}
    </button>
  );
}

// ── Select dropdown filter ───────────────────────────────────────

function SelectFilter({
  placeholder,
  value,
  options,
  onChange,
}: {
  placeholder: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isActive = !!value;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-[7px] bg-surface-alt border rounded-[9px] px-3.5 py-[9px] text-[13px] font-semibold cursor-pointer transition-colors",
          isActive ? "border-accent text-accent" : "border-border text-heading hover:border-white/[0.12]",
        )}
      >
        {value || placeholder}
        <span className={cn("text-xs transition-transform", open && "rotate-180", isActive ? "text-accent" : "text-dim")}>▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 min-w-[160px] bg-elevated border border-border rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.4)] z-20 py-1 overflow-hidden">
          {value && (
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-left px-3.5 py-2.5 text-[13px] text-dim font-semibold hover:bg-white/[0.06] cursor-pointer transition-colors"
            >
              Clear filter
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "w-full text-left px-3.5 py-2.5 text-[13px] font-semibold hover:bg-white/[0.06] cursor-pointer transition-colors",
                value === opt ? "text-accent" : "text-heading",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── League card ─────────────────────────────────────────────────

function LeagueCardItem({ league }: { league: LeagueCard }) {
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
          <Button variant="accent-soft" size="sm" className="ml-auto self-center">Join</Button>
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [activeFormat, setActiveFormat] = useState<FormatFilter>("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");

  const uniqueLocations = [...new Set(leagues.map((l) => l.location))].sort();
  const uniqueDays      = [...new Set(leagues.map((l) => l.day))].sort();

  const filtered = leagues.filter((lg) => {
    const matchesFormat   = activeFormat === "All" || lg.format === activeFormat;
    const matchesLocation = !locationFilter || lg.location === locationFilter;
    const matchesDay      = !dayFilter || lg.day === dayFilter;
    return matchesFormat && matchesLocation && matchesDay;
  });

  const hasFilter = activeFormat !== "All" || !!locationFilter || !!dayFilter;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-black tracking-[-0.5px] sm:text-[26px]">Find your next league</h1>
          <p className="text-muted text-sm mt-1.5">
            {filtered.length} league{filtered.length !== 1 ? "s" : ""}
            {hasFilter ? " matching your filters" : " and pickup groups"} near East London
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <SelectFilter
            placeholder="📍 Any location"
            value={locationFilter}
            options={uniqueLocations}
            onChange={setLocationFilter}
          />
          <SelectFilter
            placeholder="📅 Any day"
            value={dayFilter}
            options={uniqueDays}
            onChange={setDayFilter}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-[22px] flex-wrap">
        {formatTabs.map((tab) => (
          <FilterChip key={tab} label={tab} active={activeFormat === tab} onClick={() => setActiveFormat(tab)} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((lg) => (
          <LeagueCardItem key={lg.name} league={lg} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted">
            No leagues match these filters.{" "}
            <button
              onClick={() => { setActiveFormat("All"); setLocationFilter(""); setDayFilter(""); }}
              className="text-accent underline cursor-pointer bg-transparent border-0"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
