"use client";

import Link from "next/link";
import { NavItem } from "./nav-item";
import { Avatar } from "@/components/ui";
import { PlusIcon, StandingsIcon, DiscoverIcon, ScheduleIcon, TeamIcon, ProfileIcon } from "@/components/icons";

function RondoLogo() {
  return (
    <div className="w-[38px] h-[38px] rounded-[11px] bg-gradient-to-br from-accent to-accent-dark relative flex items-center justify-center shadow-[0_4px_16px_rgba(52,224,127,0.3)]">
      <div className="w-[18px] h-[18px] border-[2.4px] border-[#07140c] rounded-full" />
      <div className="absolute w-[2.4px] h-[18px] bg-[#07140c]" />
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-[248px] shrink-0 bg-sidebar border-r border-border flex flex-col sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-[22px] pt-6 pb-[18px] flex items-center gap-[11px]">
        <RondoLogo />
        <div>
          <div className="font-heading font-black text-[19px] tracking-[-0.5px] leading-none">
            RONDO
          </div>
          <div className="text-[10px] tracking-[1.5px] text-dim font-semibold uppercase mt-0.5">
            Sunday City League
          </div>
        </div>
      </div>

      {/* Compete section */}
      <div className="px-3.5 pt-2 pb-2 text-[11px] tracking-[1.2px] text-dark font-bold uppercase mt-1.5">
        Compete
      </div>
      <nav className="flex flex-col gap-0.5 px-3">
        <NavItem href="/standings" label="Standings" icon={<StandingsIcon />} />
        <NavItem href="/discover" label="Discover" icon={<DiscoverIcon />} />
        <NavItem href="/schedule" label="Schedule" icon={<ScheduleIcon />} />
      </nav>

      {/* Manage section */}
      <div className="px-3.5 pt-4 pb-2 text-[11px] tracking-[1.2px] text-dark font-bold uppercase">
        Manage
      </div>
      <nav className="flex flex-col gap-0.5 px-3">
        <NavItem href="/team" label="My Team" icon={<TeamIcon />} />
        <NavItem href="/profile" label="Profile" icon={<ProfileIcon />} />
      </nav>

      {/* Bottom section */}
      <div className="mt-auto p-4">
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-[11px] bg-accent text-accent-darker font-extrabold text-sm shadow-[0_6px_18px_rgba(52,224,127,0.28)] hover:bg-[#46ec8d] hover:shadow-[0_6px_22px_rgba(52,224,127,0.45)] transition-all"
        >
          <PlusIcon size={16} />
          Create
        </Link>

        <Link
          href="/profile"
          className="mt-3 flex items-center gap-2.5 p-2 rounded-[11px] hover:bg-white/[0.04] transition-colors"
        >
          <Avatar
            initials="SR"
            color="linear-gradient(135deg, #3b82f6, #8b5cf6)"
            size="sm"
            shape="circle"
            className="w-[34px] h-[34px]"
            style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
          />
          <div className="text-left leading-tight overflow-hidden">
            <div className="font-bold text-[13px] whitespace-nowrap">Sam Rivera</div>
            <div className="text-[11px] text-dim whitespace-nowrap">
              Captain · Riverside FC
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
