import { DashboardShell } from "@/components/layout";
import { getSidebarContext } from "@/lib/supabase/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSidebarContext();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
