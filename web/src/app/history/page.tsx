import { HistoryClient } from "@/app/history/history-client";
import { getReleaseOrderCatalog } from "@/lib/catalog/dashboard";
import type { WatchHistoryEntry } from "@/lib/progress/watch-history";
import { collectPages } from "@/lib/supabase/pagination";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type HistoryRow = { id: string; watch_unit_id: string; action: WatchHistoryEntry["action"]; occurred_at: string };

export default async function HistoryPage() {
  const supabase = await createClient();
  const [{ data: authData }, catalog] = await Promise.all([supabase.auth.getUser(), getReleaseOrderCatalog()]);
  const user = authData.user;
  const history = user ? await collectPages<HistoryRow>((from, to) => supabase.from("watch_history").select("id, watch_unit_id, action, occurred_at").eq("user_id", user.id).order("occurred_at", { ascending: false }).order("id", { ascending: false }).range(from, to)) : [];

  return <HistoryClient
    units={catalog.units}
    account={user ? { email: user.email ?? "Signed-in account" } : null}
    initialRemoteHistory={history.map((entry) => ({ id: entry.id, watchUnitId: entry.watch_unit_id, action: entry.action, occurredAt: entry.occurred_at }))}
  />;
}
