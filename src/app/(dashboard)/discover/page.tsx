import { getDiscoverLeagues, getSessionUser } from "@/lib/supabase/queries";
import { DiscoverClient } from "./discover-client";

export default async function DiscoverPage() {
  const [leagues, user] = await Promise.all([getDiscoverLeagues(), getSessionUser()]);
  return <DiscoverClient leagues={leagues} signedIn={!!user} />;
}
