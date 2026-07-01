"use client";

import { usePathname } from "next/navigation";
import { SearchInput } from "@/components/ui";
import { BellIcon, MenuIcon } from "@/components/icons";

const pageTitles: Record<string, string> = {
  "/standings": "Standings",
  "/discover": "Discover",
  "/schedule": "Schedule",
  "/team": "My Team",
  "/manage": "Organize",
  "/profile": "Profile",
  "/create": "Create",
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "FormaXI";

  return (
    <header className="sticky top-0 z-10 flex h-[68px] shrink-0 items-center gap-3 border-b border-border bg-base/85 px-4 backdrop-blur-md sm:gap-4 sm:px-6 lg:px-[30px]">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="-ml-1 flex h-10 w-10 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-white/[0.06] lg:hidden"
      >
        <MenuIcon size={20} />
      </button>

      <h1 className="font-heading text-xl font-extrabold tracking-[-0.4px]">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-3 sm:gap-3.5">
        <SearchInput className="hidden md:flex" />
        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-surface-alt transition-colors hover:bg-white/[0.06]"
        >
          <BellIcon size={17} className="text-secondary" />
          <span className="absolute right-[10px] top-[9px] h-[7px] w-[7px] rounded-full border-[1.5px] border-surface-alt bg-[#ff6a3d]" />
        </button>
      </div>
    </header>
  );
}
