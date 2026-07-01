import { EmptyState } from "@/components/ui";
import { getTeamPageData, getSessionUser } from "@/lib/supabase/queries";
import { TeamClient } from "./team-client";

export default async function TeamPage() {
  const user = await getSessionUser();
  const data = user ? await getTeamPageData() : null;

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl pt-10">
        <EmptyState
          icon="🛡️"
          title={user ? "You're not on a team yet" : "Sign in to manage a team"}
          message={
            user
              ? "Create a team or accept an invitation, then manage your squad, fixtures and stats here."
              : "Your squad, fixtures and stats live here once you're on a team."
          }
          actionLabel={user ? "Create a team" : "Sign in"}
          actionHref={user ? "/create" : "/login"}
        />
      </div>
    );
  }

  return <TeamClient data={data} />;
}
