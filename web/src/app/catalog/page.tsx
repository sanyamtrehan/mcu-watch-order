import { CatalogClient } from "@/app/catalog/catalog-client";
import { getReleaseOrderCatalog } from "@/lib/catalog/dashboard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const supabase = await createClient();
  const [{ data: authData }, catalog] = await Promise.all([supabase.auth.getUser(), getReleaseOrderCatalog()]);
  const user = authData.user;

  if (!user) return <CatalogClient units={catalog.units} relationships={catalog.relationships} account={null} initialRemoteWatchedUnitIds={[]} />;

  const { data: progress, error } = await supabase.from("watch_progress").select("watch_unit_id").eq("status", "watched");
  if (error) throw new Error(`Unable to load account progress: ${error.message}`);

  return <CatalogClient
    units={catalog.units}
    relationships={catalog.relationships}
    account={{ id: user.id, email: user.email ?? "Signed-in account" }}
    initialRemoteWatchedUnitIds={(progress ?? []).map((row) => row.watch_unit_id)}
  />;
}
