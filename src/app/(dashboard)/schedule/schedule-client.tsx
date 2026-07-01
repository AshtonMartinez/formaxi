"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Avatar, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ScheduleMatch } from "@/lib/types";
import type { ScheduleData, NextMatchInfo } from "@/lib/supabase/queries";
import { rsvp } from "@/lib/supabase/mutations";

type ViewMode = "list" | "calendar";
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="flex gap-1.5 bg-surface-alt border border-border rounded-[9px] p-[3px]">
      {(["list", "calendar"] as const).map((m) => (
        <button key={m} onClick={() => onChange(m)}
          className={cn("px-3.5 py-[7px] rounded-[7px] font-semibold text-[12.5px] cursor-pointer transition-colors capitalize border-0",
            mode === m ? "bg-accent text-accent-darker font-bold" : "text-muted hover:text-secondary")}>
          {m}
        </button>
      ))}
    </div>
  );
}

function MatchRow({ match, team }: { match: ScheduleMatch; team: ScheduleData }) {
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
          <Avatar initials={team.teamInitials} color={team.teamColor} size="xs" />
          {team.teamName}
          <span className="text-dim font-bold">vs</span>
          <Avatar initials={match.opponentShort} color={match.opponentColor} size="xs" />
          {match.opponent}
        </div>
        <div className="text-[12.5px] text-muted mt-[5px]">{match.homeAway} · {match.venue}</div>
      </div>
      <span className="font-bold text-xs px-[13px] py-1.5 rounded-lg shrink-0"
        style={{
          backgroundColor: match.statusVariant === "action" ? "rgba(52,224,127,0.14)" : "rgba(255,255,255,0.07)",
          color: match.statusVariant === "action" ? "#34e07f" : "#9aa89e",
        }}>
        {match.status}
      </span>
    </div>
  );
}

function ListView({ data }: { data: ScheduleData }) {
  if (data.matches.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-[14px] px-5 py-12 text-center text-[13px] text-muted">
        No fixtures yet. They appear once the organizer generates the schedule.
      </div>
    );
  }
  return <>{data.matches.map((m, i) => <MatchRow key={i} match={m} team={data} />)}</>;
}

function CalendarMonth({ month, year, matches }: { month: number; year: number; matches: ScheduleMatch[] }) {
  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const matchByDay = new Map<number, ScheduleMatch>();
  for (const m of matches) matchByDay.set(parseInt(m.day), m);

  const cells: (number | null)[] = [];
  const startPad = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
      <h3 className="font-heading font-extrabold text-[15px] mb-3">{monthNames[month]} {year}</h3>
      <div className="grid grid-cols-7 gap-px mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-[11px] text-dim font-bold text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          const match = day ? matchByDay.get(day) : undefined;
          const today = new Date();
          const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
          return (
            <div key={i} className={cn("h-[72px] rounded-lg p-1.5 text-xs", day ? "bg-base" : "bg-transparent",
              match && "bg-accent/[0.06] border border-accent/20", isToday && !match && "ring-1 ring-accent/40")}>
              {day && (
                <>
                  <div className={cn("font-heading font-bold text-[13px]", match ? "text-accent" : isToday ? "text-accent" : "text-heading")}>{day}</div>
                  {match && (
                    <div className="mt-0.5">
                      <div className="text-[10px] font-bold text-accent truncate">vs {match.opponentShort}</div>
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

function CalendarView({ data }: { data: ScheduleData }) {
  // Distinct (year, monthIndex) pairs present in scheduled fixtures.
  const keys = new Map<string, { month: number; year: number }>();
  for (const m of data.matches) {
    if (m.year === 0) continue;
    const monthIdx = MONTHS.indexOf(m.month) + 1;
    keys.set(`${m.year}-${monthIdx}`, { month: monthIdx, year: m.year });
  }
  const months = [...keys.values()].sort((a, b) => a.year - b.year || a.month - b.month);

  if (months.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-12 text-center text-[13px] text-muted">
        No scheduled match dates to show on the calendar yet.
      </div>
    );
  }

  return (
    <>
      {months.map(({ month, year }) => (
        <CalendarMonth
          key={`${year}-${month}`}
          month={month}
          year={year}
          matches={data.matches.filter((m) => m.year === year && MONTHS.indexOf(m.month) + 1 === month)}
        />
      ))}
    </>
  );
}

function NextMatchDetail({ next }: { next: NextMatchInfo | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!next) {
    return (
      <Card variant="accent" className="sticky top-[88px]">
        <div className="text-[11px] tracking-[1px] text-accent font-bold uppercase">Next Match</div>
        <p className="text-[13px] text-secondary mt-4 leading-[1.5]">
          No upcoming match with a kickoff time yet. Once a fixture is scheduled you can RSVP here.
        </p>
      </Card>
    );
  }

  const setRsvp = (status: "available" | "out") => {
    setError(null);
    startTransition(async () => {
      const res = await rsvp(next.fixtureId, next.myRsvp === status ? "doubtful" : status);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  };

  const isIn = next.myRsvp === "available";
  const isOut = next.myRsvp === "out";

  return (
    <Card variant="accent" className="sticky top-[88px]">
      <div className="text-[11px] tracking-[1px] text-accent font-bold uppercase">Next Match</div>

      <div className="flex items-center justify-between my-[18px] mb-1.5">
        <div className="text-center flex-1">
          <Avatar initials={next.homeInitials} color={next.homeColor} size="lg" className="mx-auto" />
          <div className="font-bold text-[13px] mt-2">{next.homeName}</div>
        </div>
        <div className="font-heading font-black text-lg text-dim">VS</div>
        <div className="text-center flex-1">
          <Avatar initials={next.awayInitials} color={next.awayColor} size="lg" className="mx-auto" />
          <div className="font-bold text-[13px] mt-2">{next.awayName}</div>
        </div>
      </div>

      <div className="text-center text-secondary text-[13px] my-3.5 mb-[18px] p-2.5 bg-black/20 rounded-[10px]">
        {next.when}<br />
        <span className="text-dim text-xs">{next.venue}</span>
      </div>

      <div className="text-xs text-muted font-bold mb-[9px] flex justify-between">
        Squad availability
        <span className="text-accent">{next.confirmed} confirmed</span>
      </div>
      <div className="flex h-2 rounded-[5px] overflow-hidden mb-2">
        <div className="bg-accent" style={{ flex: Math.max(next.confirmed, 0.001) }} />
        <div className="bg-loss" style={{ flex: Math.max(next.out, 0.001) }} />
        <div className="bg-[#33433a]" style={{ flex: Math.max(next.pending, 0.001) }} />
      </div>
      <div className="flex gap-3.5 text-[11.5px] text-muted">
        <span>● {next.confirmed} In</span>
        <span className="text-loss">● {next.out} Out</span>
        <span>● {next.pending} Pending</span>
      </div>

      {error && <p className="text-[12px] text-loss font-semibold mt-3">{error}</p>}

      <div className="flex gap-2 mt-[18px]">
        <Button variant={isIn ? "primary" : "secondary"} size="md" className="flex-1" disabled={pending} onClick={() => setRsvp("available")}>
          {isIn ? "You're in ✓" : "I'm in"}
        </Button>
        <Button variant={isOut ? "secondary" : "ghost"} size="md" disabled={pending} onClick={() => setRsvp("out")} className={isOut ? "bg-loss/[0.16] text-loss" : ""}>
          {isOut ? "Marked out" : "Can't play"}
        </Button>
      </div>
    </Card>
  );
}

export function ScheduleClient({ data }: { data: ScheduleData }) {
  const [view, setView] = useState<ViewMode>("list");

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="font-heading font-black text-2xl tracking-[-0.5px]">Match Schedule</h1>
            <ViewToggle mode={view} onChange={setView} />
          </div>
          {view === "list" ? <ListView data={data} /> : <CalendarView data={data} />}
        </div>
        <NextMatchDetail next={data.nextMatch} />
      </div>
    </div>
  );
}
