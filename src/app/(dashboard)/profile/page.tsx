"use client";

import { useState } from "react";
import { Card, CardTitle, Badge, Avatar, Button, StatCard } from "@/components/ui";

// ── Types & mock data ────────────────────────────────────────────

type MyTeam = {
  initials: string;
  color: string;
  name: string;
  sub: string;
  badge?: "captain";
};

type PendingInvite = {
  initials: string;
  color: string;
  team: string;
  league: string;
};

const initialTeams: MyTeam[] = [
  { initials: "RF", color: "#1f9a52", name: "Riverside FC",  sub: "Captain · 11v11 League", badge: "captain" },
  { initials: "T5", color: "#06b6d4", name: "Tuesday 5s",    sub: "Player · 5v5 Pickup" },
];

const initialInvites: PendingInvite[] = [
  { initials: "E7", color: "#ff6a3d", team: "East London 7s", league: "East London 7s League" },
  { initials: "VX", color: "#8b5cf6", team: "Victoria XI",    league: "Sunday City League"   },
];

// ── Profile hero ────────────────────────────────────────────────

function ProfileHero() {
  return (
    <div className="rounded-[20px] overflow-hidden border border-white/[0.08]">
      <div className="h-[120px] relative" style={{ background: "linear-gradient(110deg, #10301d, #13202e)" }}>
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg,transparent 0 58px,rgba(255,255,255,0.04) 58px 60px)" }} />
      </div>
      <div className="flex flex-wrap items-end gap-5 bg-surface px-5 pb-6 sm:px-7">
        <div
          className="w-24 h-24 rounded-3xl -mt-10 border-4 border-surface flex items-center justify-center font-heading font-black text-[30px] text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
        >
          SR
        </div>
        <div className="pb-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl font-black tracking-[-0.5px] sm:text-[27px]">Sam Rivera</h1>
            <Badge variant="green" size="md">#10 · Midfielder</Badge>
          </div>
          <div className="text-secondary text-[13.5px] mt-1.5">Riverside FC · Tuesday 5s · London</div>
        </div>
        <Button variant="secondary" size="md" className="ml-auto mb-1.5 text-[13px] px-[18px] py-[10px]">
          Edit profile
        </Button>
      </div>
    </div>
  );
}

// ── Account details ──────────────────────────────────────────────

function AccountDetails() {
  const rows = [
    { label: "Full name",           value: "Samuel Rivera"    },
    { label: "Email",               value: "sam.rivera@email.com" },
    { label: "Preferred position",  value: "Central Midfield" },
  ];
  return (
    <Card>
      <CardTitle className="text-base mb-4">Account</CardTitle>
      <div className="flex flex-col gap-0.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-3 border-b border-white/[0.05]">
            <span className="text-muted text-[13px]">{row.label}</span>
            <span className="font-semibold text-[13.5px]">{row.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between py-3">
          <span className="text-muted text-[13px]">Match reminders</span>
          <span className="inline-flex w-[38px] h-[22px] bg-accent rounded-full p-0.5 justify-end">
            <span className="w-[18px] h-[18px] bg-accent-darker rounded-full" />
          </span>
        </div>
      </div>
    </Card>
  );
}

// ── My teams ─────────────────────────────────────────────────────

function MyTeams({ teams, onJoin }: { teams: MyTeam[]; onJoin: () => void }) {
  return (
    <Card>
      <CardTitle className="text-base mb-4">My Teams</CardTitle>
      <div className="flex flex-col gap-3">
        {teams.map((t) => (
          <div key={t.name} className="flex items-center gap-[13px] p-3 bg-elevated rounded-xl">
            <Avatar initials={t.initials} color={t.color} size="md" className="w-[42px] h-[42px] rounded-[11px]" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">{t.name}</div>
              <div className="text-xs text-dim">{t.sub}</div>
            </div>
            {t.badge === "captain" && <Badge variant="orange">Captain</Badge>}
          </div>
        ))}
        <button
          onClick={onJoin}
          className="text-center py-[11px] border-[1.5px] border-dashed border-white/[0.12] rounded-xl text-muted font-semibold text-[13px] cursor-pointer hover:border-white/[0.2] transition-colors"
        >
          + Join or create a team
        </button>
      </div>
    </Card>
  );
}

// ── Pending invites ───────────────────────────────────────────────

function PendingInvites({
  invites,
  onAccept,
  onDecline,
}: {
  invites: PendingInvite[];
  onAccept: (invite: PendingInvite) => void;
  onDecline: (invite: PendingInvite) => void;
}) {
  if (invites.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <CardTitle className="text-base">Pending Invites</CardTitle>
        <span className="font-bold text-[11px] px-2 py-0.5 rounded-[5px] bg-draw/[0.16] text-draw">{invites.length}</span>
      </div>
      <div className="flex flex-col gap-3">
        {invites.map((inv) => (
          <div key={inv.team} className="flex items-center gap-[13px] p-3 bg-elevated rounded-xl">
            <Avatar initials={inv.initials} color={inv.color} size="md" className="w-[42px] h-[42px] rounded-[11px]" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">{inv.team}</div>
              <div className="text-xs text-dim truncate">{inv.league}</div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button variant="accent-soft" size="sm" onClick={() => onAccept(inv)}>Accept</Button>
              <Button variant="ghost" size="sm" onClick={() => onDecline(inv)}>Decline</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Page ────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [myTeams, setMyTeams] = useState<MyTeam[]>(initialTeams);
  const [invites, setInvites] = useState<PendingInvite[]>(initialInvites);

  const handleAccept = (invite: PendingInvite) => {
    setMyTeams((prev) => [
      ...prev,
      { initials: invite.initials, color: invite.color, name: invite.team, sub: `Player · ${invite.league}` },
    ]);
    setInvites((prev) => prev.filter((i) => i.team !== invite.team));
  };

  const handleDecline = (invite: PendingInvite) => {
    setInvites((prev) => prev.filter((i) => i.team !== invite.team));
  };

  return (
    <div className="mx-auto max-w-6xl">
      <ProfileHero />

      <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard value={47} label="Matches" />
        <StatCard value={18} label="Goals" valueColor="#34e07f" />
        <StatCard value={23} label="Assists" valueColor="#34e07f" />
        <StatCard value={6}  label="MOTM" valueColor="#ff8a5f" />
        <StatCard value="64%" label="Win rate" />
      </div>

      <div className="mt-[18px] grid grid-cols-1 items-start gap-[18px] lg:grid-cols-2">
        <AccountDetails />
        <div className="flex flex-col gap-[18px]">
          <MyTeams teams={myTeams} onJoin={() => {}} />
          <PendingInvites invites={invites} onAccept={handleAccept} onDecline={handleDecline} />
        </div>
      </div>
    </div>
  );
}
