import { EmptyState } from "@/components/ui";
import { getProfileData } from "@/lib/supabase/queries";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const data = await getProfileData();

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl pt-10">
        <EmptyState
          icon="👤"
          title="Sign in to view your profile"
          message="Your teams, invitations, and career stats live here once you have an account."
          actionLabel="Sign in"
          actionHref="/login"
        />
      </div>
    );
  }

  return <ProfileClient data={data} />;
}
