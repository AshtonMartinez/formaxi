"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <main className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setNavOpen(true)} />
        <div className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8 lg:pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
