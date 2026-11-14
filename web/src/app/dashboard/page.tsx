import { LocalDashboard } from "@/app/dashboard/local-dashboard";
import { getReleaseOrderCatalog } from "@/lib/catalog/dashboard";
import type { WatchHistoryEntry } from "@/lib/progress/watch-history";
import { createClient } from "@/lib/supabase/server";
import { collectPages } from "@/lib/supabase/pagination";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: authData }, catalog] = await Promise.all([supabase.auth.getUser(), getReleaseOrderCatalog()]);
  const user = authData.user;

  if (!user) return <LocalDashboard catalog={catalog} account={null} initialRemoteWatchedUnitIds={[]} initialRemoteHistory={[]} />;

  const [progress, history] = await Promise.all([
    collectPages<{ watch_unit_id: string }>((from, to) => supabase.from("watch_progress").select("watch_unit_id").eq("user_id", user.id).eq("status", "watched").order("watch_unit_id").range(from, to)),
    supabase.from("watch_history").select("id, watch_unit_id, action, occurred_at").eq("user_id", user.id).order("occurred_at", { ascending: false }).limit(5),
  ]);

  return <LocalDashboard
    catalog={catalog}
    account={{ id: user.id, email: user.email ?? "Signed-in account" }}
    initialRemoteWatchedUnitIds={progress.map((row) => row.watch_unit_id)}
    initialRemoteHistory={(history.data ?? []).map((entry) => ({ id: entry.id, watchUnitId: entry.watch_unit_id, action: entry.action, occurredAt: entry.occurred_at } as WatchHistoryEntry))}
  />;
}
