"use client";

import { useState } from "react";
import { Card, Avatar, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ScheduleMatch } from "@/lib/types";

const schedule: ScheduleMatch[] = [
  { month: "JUN", day: "22", time: "10:00", opponent: "Marsh United", opponentShort: "MU", opponentColor: "#8b5cf6", homeAway: "Home", venue: "Hackney Marshes P3", status: "RSVP", statusVariant: "action" },
  { month: "JUN", day: "29", time: "12:00", opponent: "Olympic Athletic", opponentShort: "OA", opponentColor: "#eab308", homeAway: "Away", venue: "Mabley Green", status: "RSVP", statusVariant: "action" },
  { month: "JUL", day: "07", time: "11:00", opponent: "Clapton CFC", opponentShort: "CC", opponentColor: "#ec4899", homeAway: "Home", venue: "Spring Hill", status: "Scheduled", statusVariant: "neutral" },
  { month: "JUL", day: "13", time: "10:00", opponent: "Bow Rangers", opponentShort: "BR", opponentColor: "#06b6d4", homeAway: "Away", venue: "Wennington", status: "Scheduled", statusVariant: "neutral" },
  { month: "JUL", day: "20", time: "12:00", opponent: "Leyton Orient", opponentShort: "LO", opponentColor: "#ef4444", homeAway: "Home", venue: "Hackney Marshes P3", status: "Scheduled", statusVariant: "neutral" },
];

type ViewMode = "list" | "calendar";

// ── Shared ──────────────────────────────────────────────────────

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="flex gap-1.5 bg-surface-alt border border-border rounded-[9px] p-[3px]">
      {(["list", "calendar"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "px-3.5 py-[7px] rounded-[7px] font-semibold text-[12.5px] cursor-pointer transition-colors capitalize border-0",
            mode === m ? "bg-accent text-accent-darker font-bold" : "text-muted hover:text-secondary",
          )}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

// ── List view ───────────────────────────────────────────────────

function MatchRow({ match }: { match: ScheduleMatch }) {
  return (
    <div className="bg-surface border border-border rounded-[14px] px-[18px] py-3.5 mb-3 flex items-center gap-[18px] hover:bg-elevated hover:border-white/[0.12] transition-colors">
      <div className="text-center w-[50px] shrink-0">
        <div className="text-[11px] text-accent font-bold uppercase">{match.month}</div>
        <div className="font-heading font-black text-2xl leading-none">{match.day}</div>
        <div className="text-[11px] text-dim">{match.time}</div>
      </div>
      <div className="w-px self-stretch bg-white/[0.07]" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[9px] font-bold text-[15px]">
          <Avatar initials="RF" color="#1f9a52" size="xs" />
          Riverside FC
          <span className="text-dim font-bold">vs</span>
          <Avatar initials={match.opponentShort} color={match.opponentColor} size="xs" />
          {match.opponent}
        </div>
        <div className="text-[12.5px] text-muted mt-[5px]">{match.homeAway} · {match.venue}</div>
      </div>
      <span
        className="font-bold text-xs px-[13px] py-1.5 rounded-lg shrink-0"
        style={{
          backgroundColor: match.statusVariant === "action" ? "rgba(52,224,127,0.14)" : "rgba(255,255,255,0.07)",
          color: match.statusVariant === "action" ? "#34e07f" : "#9aa89e",
        }}
      >
        {match.status}
      </span>
    </div>
  );
}

function ListView() {
  return (
    <>
      {schedule.map((m, i) => (
        <MatchRow key={i} match={m} />
      ))}
    </>
  );
}

// ── Calendar view ───────────────────────────────────────────────

// Build a simple month grid showing June and July 2025
function CalendarMonth({ month, year, matches }: { month: number; year: number; matches: ScheduleMatch[] }) {
  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  // Map day number -> match
  const matchByDay = new Map<number, ScheduleMatch>();
  for (const m of matches) {
    matchByDay.set(parseInt(m.day), m);
  }

  const cells: (number | null)[] = [];
  // Pad start (Mon=0 in our grid)
  const startPad = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad end to fill row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
      <h3 className="font-heading font-extrabold text-[15px] mb-3">
        {monthNames[month]} {year}
      </h3>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-[11px] text-dim font-bold text-center py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          const match = day ? matchByDay.get(day) : undefined;
          const today = new Date();
          const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

          return (
            <div
              key={i}
              className={cn(
                "h-[72px] rounded-lg p-1.5 text-xs",
                day ? "bg-base" : "bg-transparent",
                match && "bg-accent/[0.06] border border-accent/20",
                isToday && !match && "ring-1 ring-accent/40",
              )}
            >
              {day && (
                <>
                  <div className={cn(
                    "font-heading font-bold text-[13px]",
                    match ? "text-accent" : isToday ? "text-accent" : "text-heading",
                  )}>
                    {day}
                  </div>
                  {match && (
                    <div className="mt-0.5">
                      <div className="text-[10px] font-bold text-accent truncate">
                        vs {match.opponentShort}
                      </div>
                      <div className="text-[9px] text-dim">{match.time}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarView() {
  const junMatches = schedule.filter((m) => m.month === "JUN");
  const julMatches = schedule.filter((m) => m.month === "JUL");

  return (
    <>
      <CalendarMonth month={6} year={2025} matches={junMatches} />
      <CalendarMonth month={7} year={2025} matches={julMatches} />
    </>
  );
}

// ── Next match sidebar ──────────────────────────────────────────

function NextMatchDetail() {
  const [rsvp, setRsvp] = useState<"in" | "out" | null>(null);

  return (
    <Card variant="accent" className="sticky top-[88px]">
      <div className="text-[11px] tracking-[1px] text-accent font-bold uppercase">Next Match</div>

      <div className="flex items-center justify-between my-[18px] mb-1.5">
        <div className="text-center flex-1">
          <Avatar initials="RF" color="#1f9a52" size="lg" className="mx-auto" />
          <div className="font-bold text-[13px] mt-2">Riverside</div>
        </div>
        <div className="font-heading font-black text-lg text-dim">VS</div>
        <div className="text-center flex-1">
          <Avatar initials="MU" color="#8b5cf6" size="lg" className="mx-auto" />
          <div className="font-bold text-[13px] mt-2">Marsh Utd</div>
        </div>
      </div>

      <div className="text-center text-secondary text-[13px] my-3.5 mb-[18px] p-2.5 bg-black/20 rounded-[10px]">
        Sat 22 Jun · 10:00<br />
        <span className="text-dim text-xs">Hackney Marshes · Pitch 3</span>
      </div>

      <div className="text-xs text-muted font-bold mb-[9px] flex justify-between">
        Squad availability
        <span className="text-accent">{rsvp === "in" ? "12" : rsvp === "out" ? "11" : "11"} confirmed</span>
      </div>
      <div className="flex h-2 rounded-[5px] overflow-hidden mb-2">
        <div className="bg-accent" style={{ flex: rsvp === "in" ? 12 : 11 }} />
        <div className="bg-loss" style={{ flex: rsvp === "out" ? 3 : 2 }} />
        <div className="bg-[#33433a]" style={{ flex: rsvp ? (rsvp === "in" ? 2 : 2) : 3 }} />
      </div>
      <div className="flex gap-3.5 text-[11.5px] text-muted">
        <span>● {rsvp === "in" ? 12 : 11} In</span>
        <span className="text-loss">● {rsvp === "out" ? 3 : 2} Out</span>
        <span>● {rsvp ? (rsvp === "in" ? 2 : 2) : 3} Pending</span>
      </div>

      <div className="flex gap-2 mt-[18px]">
        <Button
          variant={rsvp === "in" ? "primary" : "secondary"}
          size="md"
          className="flex-1"
          onClick={() => setRsvp(rsvp === "in" ? null : "in")}
        >
          {rsvp === "in" ? "You're in ✓" : "I'm in"}
        </Button>
        <Button
          variant={rsvp === "out" ? "secondary" : "ghost"}
          size="md"
          onClick={() => setRsvp(rsvp === "out" ? null : "out")}
          className={rsvp === "out" ? "bg-loss/[0.16] text-loss" : ""}
        >
          {rsvp === "out" ? "Marked out" : "Can't play"}
        </Button>
      </div>
    </Card>
  );
}

// ── Main page ───────────────────────────────────────────────────

export default function SchedulePage() {
  const [view, setView] = useState<ViewMode>("list");

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="font-heading font-black text-2xl tracking-[-0.5px]">Match Schedule</h1>
            <ViewToggle mode={view} onChange={setView} />
          </div>
          {view === "list" ? <ListView /> : <CalendarView />}
        </div>
        <NextMatchDetail />
      </div>
    </div>
  );
}
