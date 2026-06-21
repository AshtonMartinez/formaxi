"use client";

import { usePathname } from "next/navigation";
import { SearchInput } from "@/components/ui";
import { BellIcon } from "@/components/icons";

const pageTitles: Record<string, string> = {
  "/standings": "Standings",
  "/discover": "Discover",
  "/schedule": "Schedule",
  "/team": "My Team",
  "/profile": "Profile",
  "/create": "Create",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Rondo";

  return (
    <header className="h-[68px] shrink-0 border-b border-border flex items-center gap-[18px] px-[30px] bg-base/85 backdrop-blur-[8px] sticky top-0 z-10">
      <h1 className="font-heading font-extrabold text-xl tracking-[-0.4px]">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-3.5">
        <SearchInput />
        <button className="w-10 h-10 rounded-[10px] bg-surface-alt border border-border flex items-center justify-center relative cursor-pointer hover:bg-white/[0.06] transition-colors">
          <BellIcon size={17} className="text-secondary" />
          <span className="absolute top-[9px] right-[10px] w-[7px] h-[7px] rounded-full bg-[#ff6a3d] border-[1.5px] border-surface-alt" />
        </button>
      </div>
    </header>
  );
}
