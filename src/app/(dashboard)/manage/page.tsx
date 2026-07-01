import { EmptyState } from "@/components/ui";
import { getManageData, getSessionUser } from "@/lib/supabase/queries";
import { ManageClient } from "./manage-client";

export default async function ManagePage() {
  const user = await getSessionUser();
  const data = user ? await getManageData() : null;

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl pt-10">
        <EmptyState
          icon="🗂️"
          title={user ? "You don't organize a league yet" : "Sign in to organize"}
          message={
            user
              ? "Create a league to open the organizer console — approve teams, generate fixtures and start the season."
              : "The organizer console lets you run a league once you've created one."
          }
          actionLabel={user ? "Create a league" : "Sign in"}
          actionHref={user ? "/create" : "/login"}
        />
      </div>
    );
  }

  return <ManageClient data={data} />;
}
