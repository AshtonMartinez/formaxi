import { EmptyState } from "@/components/ui";
import { getScheduleData, getSessionUser } from "@/lib/supabase/queries";
import { ScheduleClient } from "./schedule-client";

export default async function SchedulePage() {
  const user = await getSessionUser();
  const data = user ? await getScheduleData() : null;

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl pt-10">
        <EmptyState
          icon="📅"
          title={user ? "You're not on a team yet" : "Sign in to see your schedule"}
          message={
            user
              ? "Join a team or create one to see its fixtures and RSVP to matches."
              : "Your match schedule and RSVP live here once you're on a team."
          }
          actionLabel={user ? "Find a league" : "Sign in"}
          actionHref={user ? "/discover" : "/login"}
        />
      </div>
    );
  }

  return <ScheduleClient data={data} />;
}
