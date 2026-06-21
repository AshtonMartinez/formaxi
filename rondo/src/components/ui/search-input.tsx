"use client";

import { SearchIcon } from "@/components/icons";

interface SearchInputProps {
  placeholder?: string;
}

export function SearchInput({ placeholder = "Search teams, players, leagues" }: SearchInputProps) {
  return (
    <label className="flex items-center gap-2.5 bg-surface-alt border border-border rounded-[10px] px-3.5 py-2.5 w-[260px]">
      <SearchIcon size={15} className="text-dim shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        className="bg-transparent outline-none flex-1 text-[13px] text-primary font-body placeholder:text-dim"
      />
    </label>
  );
}
