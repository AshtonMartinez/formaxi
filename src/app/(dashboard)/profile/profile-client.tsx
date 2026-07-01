"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle, Badge, Avatar, Button, StatCard, Modal } from "@/components/ui";
import type { LeagueApplication } from "@/lib/types";
import type { ProfileData } from "@/lib/supabase/queries";
import { acceptInvitation, declineInvitation, updateProfile } from "@/lib/supabase/mutations";

const POSITIONS = [
  { value: "GK", label: "Goalkeeper" },
  { value: "DF", label: "Defender" },
  { value: "MF", label: "Midfielder" },
  { value: "FW", label: "Forward" },
];
const positionLabel = (code: string | null) => POSITIONS.find((p) => p.value === code)?.label ?? "Not set";

const initialsOf = (name: string) =>
  name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

function ProfileHero({ data, onEdit }: { data: ProfileData; onEdit: () => void }) {
  const { profile, teams } = data;
  const teamLine = teams.map((t) => t.name).join(" · ") || "No teams yet";
  return (
    <div className="rounded-[20px] overflow-hidden border border-white/[0.08]">
      <div className="h-[120px] relative" style={{ background: "linear-gradient(110deg, #10301d, #13202e)" }}>
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg,transparent 0 58px,rgba(255,255,255,0.04) 58px 60px)" }} />
      </div>
      <div className="flex flex-wrap items-end gap-5 bg-surface px-5 pb-6 sm:px-7">
        <div className="w-24 h-24 rounded-3xl -mt-10 border-4 border-surface flex items-center justify-center font-heading font-black text-[30px] text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #1f9a52, #14b8a6)" }}>
          {initialsOf(profile.display_name)}
        </div>
        <div className="pb-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl font-black tracking-[-0.5px] sm:text-[27px]">{profile.display_name}</h1>
            {profile.preferred_position && <Badge variant="green" size="md">{positionLabel(profile.preferred_position)}</Badge>}
          </div>
          <div className="text-secondary text-[13.5px] mt-1.5">{teamLine}</div>
        </div>
        <Button variant="secondary" size="md" className="ml-auto mb-1.5 text-[13px] px-[18px] py-[10px]" onClick={onEdit}>Edit profile</Button>
      </div>
    </div>
  );
}

function AccountDetails({ data, onToggleReminders, busy }: { data: ProfileData; onToggleReminders: () => void; busy: boolean }) {
  const rows = [
    { label: "Display name", value: data.profile.display_name },
    { label: "Email", value: data.profile.email },
    { label: "Preferred position", value: positionLabel(data.profile.preferred_position) },
  ];
  const on = data.profile.match_reminder_enabled;
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
          <button onClick={onToggleReminders} disabled={busy} aria-label="Toggle match reminders"
            className={`inline-flex w-[38px] h-[22px] rounded-full p-0.5 transition-colors ${on ? "bg-accent justify-end" : "bg-white/[0.12] justify-start"}`}>
            <span className={`w-[18px] h-[18px] rounded-full ${on ? "bg-accent-darker" : "bg-white/70"}`} />
          </button>
        </div>
      </div>
    </Card>
  );
}

function MyTeams({ data }: { data: ProfileData }) {
  return (
    <Card>
      <CardTitle className="text-base mb-4">My Teams</CardTitle>
      <div className="flex flex-col gap-3">
        {data.teams.map((t) => (
          <Link key={t.id} href="/team" className="flex items-center gap-[13px] p-3 bg-elevated rounded-xl hover:bg-white/[0.06] transition-colors">
            <Avatar initials={t.initials} color={t.color} size="md" className="w-[42px] h-[42px] rounded-[11px]" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">{t.name}</div>
              <div className="text-xs text-dim">{t.sub}</div>
            </div>
            {t.isCaptain && <Badge variant="orange">Captain</Badge>}
          </Link>
        ))}
        {data.teams.length === 0 && <p className="text-[13px] text-muted">You haven&apos;t joined a team yet.</p>}
        <Link href="/create" className="text-center py-[11px] border-[1.5px] border-dashed border-white/[0.12] rounded-xl text-muted font-semibold text-[13px] cursor-pointer hover:border-white/[0.2] transition-colors">
          + Join or create a team
        </Link>
      </div>
    </Card>
  );
}

function PendingInvites({ invites, onAccept, onDecline, busyId }: {
  invites: LeagueApplication[]; onAccept: (id: string) => void; onDecline: (id: string) => void; busyId: string | null;
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
          <div key={inv.id} className="flex items-center gap-[13px] p-3 bg-elevated rounded-xl">
            <Avatar initials={inv.teamInitials} color={inv.teamColor} size="md" className="w-[42px] h-[42px] rounded-[11px]" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">{inv.teamName}</div>
              <div className="text-xs text-dim truncate">{inv.personName}</div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button variant="accent-soft" size="sm" disabled={busyId === inv.id} onClick={() => onAccept(inv.id)}>Accept</Button>
              <Button variant="ghost" size="sm" disabled={busyId === inv.id} onClick={() => onDecline(inv.id)}>Decline</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function EditModal({ data, open, onClose }: { data: ProfileData; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(data.profile.display_name);
  const [position, setPosition] = useState<string>(data.profile.preferred_position ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateProfile({
        displayName: name,
        preferredPosition: position || null,
        matchReminders: data.profile.match_reminder_enabled,
      });
      if (res.error) setError(res.error);
      else { onClose(); router.refresh(); }
    });
  };

  const inputClass = "w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-2.5 text-primary text-sm font-body outline-none focus:border-accent transition-colors";

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <div className="flex flex-col gap-3 mt-1">
        <div>
          <label className="block text-[12.5px] font-semibold text-heading mb-1.5">Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-heading mb-1.5">Preferred position</label>
          <div className="flex gap-2 flex-wrap">
            {POSITIONS.map((p) => (
              <button key={p.value} onClick={() => setPosition(position === p.value ? "" : p.value)}
                className={`px-3 py-2 rounded-[10px] border-[1.5px] text-[12.5px] font-bold transition-colors ${position === p.value ? "bg-accent/[0.12] border-accent text-accent" : "bg-input border-white/[0.09] text-secondary"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-[12.5px] text-loss font-semibold">{error}</p>}
        <Button variant="primary" size="lg" className="mt-1" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save changes"}</Button>
      </div>
    </Modal>
  );
}

export function ProfileClient({ data }: { data: ProfileData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const respond = (id: string, action: typeof acceptInvitation) => {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const res = await action(id);
      setBusyId(null);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  };

  const toggleReminders = () => {
    setReminderBusy(true);
    startTransition(async () => {
      const res = await updateProfile({
        displayName: data.profile.display_name,
        preferredPosition: data.profile.preferred_position,
        matchReminders: !data.profile.match_reminder_enabled,
      });
      setReminderBusy(false);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <ProfileHero data={data} onEdit={() => setEditing(true)} />

      {error && <p className="mt-3 text-[12.5px] text-loss font-semibold">{error}</p>}

      <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatCard value={data.career.matches} label="Matches" />
        <StatCard value={data.career.goals} label="Goals" valueColor="#34e07f" />
        <StatCard value={data.career.assists} label="Assists" valueColor="#34e07f" />
        <StatCard value={`${data.career.winRatePct}%`} label="Win rate" />
      </div>

      <div className="mt-[18px] grid grid-cols-1 items-start gap-[18px] lg:grid-cols-2">
        <AccountDetails data={data} onToggleReminders={toggleReminders} busy={reminderBusy} />
        <div className="flex flex-col gap-[18px]">
          <MyTeams data={data} />
          <PendingInvites
            invites={data.invites}
            busyId={busyId}
            onAccept={(id) => respond(id, acceptInvitation)}
            onDecline={(id) => respond(id, declineInvitation)}
          />
        </div>
      </div>

      <EditModal data={data} open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}
