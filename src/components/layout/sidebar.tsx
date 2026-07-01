"use client";

import Link from "next/link";
import { NavItem } from "./nav-item";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { logout } from "@/app/(auth)/actions";
import type { SidebarContext } from "@/lib/supabase/queries";
import { PlusIcon, StandingsIcon, DiscoverIcon, ScheduleIcon, TeamIcon, ProfileIcon, ManageIcon, CloseIcon } from "@/components/icons";

function FormaxiLogo() {
  return (
    <div className="relative flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dark shadow-[0_4px_16px_rgba(52,224,127,0.3)]">
      <div className="h-[18px] w-[18px] rounded-full border-[2.4px] border-[#07140c]" />
      <div className="absolute h-[18px] w-[2.4px] bg-[#07140c]" />
    </div>
  );
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  user?: SidebarContext | null;
}

export function Sidebar({ open = false, onClose, user = null }: SidebarProps) {
  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[248px] shrink-0 flex-col border-r border-border bg-sidebar",
          "transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 pb-4 pt-6">
          <FormaxiLogo />
          <div className="min-w-0">
            <div className="font-heading text-[19px] font-black leading-none tracking-[-0.5px]">
              FormaXI
            </div>
            <div className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[1.5px] text-dim">
              {user?.leagueName ?? "Football League Manager"}
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-white/[0.06] lg:hidden"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Compete section */}
        <div className="mt-1.5 px-3.5 pb-2 pt-2 text-[11px] font-bold uppercase tracking-[1.2px] text-dark">
          Compete
        </div>
        <nav className="flex flex-col gap-0.5 px-3" onClick={onClose}>
          <NavItem href="/standings" label="Standings" icon={<StandingsIcon />} />
          <NavItem href="/discover" label="Discover" icon={<DiscoverIcon />} />
          <NavItem href="/schedule" label="Schedule" icon={<ScheduleIcon />} />
        </nav>

        {/* Manage section */}
        <div className="px-3.5 pb-2 pt-4 text-[11px] font-bold uppercase tracking-[1.2px] text-dark">
          Manage
        </div>
        <nav className="flex flex-col gap-0.5 px-3" onClick={onClose}>
          <NavItem href="/team" label="My Team" icon={<TeamIcon />} />
          <NavItem href="/manage" label="Organize" icon={<ManageIcon />} />
          <NavItem href="/profile" label="Profile" icon={<ProfileIcon />} />
        </nav>

        {/* Bottom section */}
        <div className="mt-auto p-4" onClick={onClose}>
          <Link
            href="/create"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-extrabold text-accent-darker shadow-[0_6px_18px_rgba(52,224,127,0.28)] transition-all hover:bg-[#46ec8d] hover:shadow-[0_6px_22px_rgba(52,224,127,0.45)]"
          >
            <PlusIcon size={16} />
            Create
          </Link>

          {user ? (
            <div className="mt-3 flex items-center gap-1">
              <Link
                href="/profile"
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-white/[0.04]"
              >
                <Avatar
                  initials={user.initials}
                  color="#1f9a52"
                  size="sm"
                  shape="circle"
                  className="h-[34px] w-[34px]"
                  style={{ background: "linear-gradient(135deg, #1f9a52, #14b8a6)" }}
                />
                <div className="overflow-hidden text-left leading-tight">
                  <div className="truncate text-[13px] font-bold">{user.displayName}</div>
                  <div className="truncate text-[11px] text-dim">{user.roleLine}</div>
                </div>
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  aria-label="Sign out"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-white/[0.06] hover:text-loss"
                >
                  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-alt py-2.5 text-[13px] font-bold text-heading transition-colors hover:bg-white/[0.06]"
            >
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
