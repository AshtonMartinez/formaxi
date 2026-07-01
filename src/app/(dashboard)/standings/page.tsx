import { EmptyState } from "@/components/ui";
import { getStandingsData } from "@/lib/supabase/queries";
import { StandingsClient } from "./standings-client";

export default async function StandingsPage() {
  const data = await getStandingsData();

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl pt-10">
        <EmptyState
          icon="🏆"
          title="No league yet"
          message="Standings appear once you organize or join a league. Create one to get started, or browse open leagues to join."
          actionLabel="Create a league"
          actionHref="/create"
        />
      </div>
    );
  }

  return <StandingsClient data={data} />;
}
