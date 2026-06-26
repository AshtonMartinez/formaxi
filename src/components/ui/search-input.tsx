"use client";

import { SearchIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  placeholder = "Search teams, players, leagues",
  className,
}: SearchInputProps) {
  return (
    <label
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[10px] border border-border bg-surface-alt px-3.5 py-2.5 lg:w-[260px]",
        className,
      )}
    >
      <SearchIcon size={15} className="shrink-0 text-dim" />
      <input
        type="text"
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent font-body text-[13px] text-primary outline-none placeholder:text-dim"
      />
    </label>
  );
}
