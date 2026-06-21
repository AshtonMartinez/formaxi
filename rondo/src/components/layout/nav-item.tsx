"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function NavItem({ href, label, icon }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 px-3 py-[11px] rounded-[10px] font-semibold text-sm transition-colors",
        isActive
          ? "bg-accent/[0.10] text-accent"
          : "text-secondary hover:bg-white/[0.04] hover:text-primary",
      )}
    >
      <span
        className={cn(
          "absolute -left-3 top-[9px] bottom-[9px] w-[3px] rounded-[3px] transition-colors",
          isActive ? "bg-accent" : "bg-transparent",
        )}
      />
      {icon}
      {label}
    </Link>
  );
}
