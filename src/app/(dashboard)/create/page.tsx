import { getJoinableLeagues } from "@/lib/supabase/queries";
import { CreateClient } from "./create-client";

export default async function CreatePage() {
  const joinableLeagues = await getJoinableLeagues();
  return <CreateClient joinableLeagues={joinableLeagues} />;
}
