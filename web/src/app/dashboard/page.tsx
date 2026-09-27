import { LocalDashboard } from "@/app/dashboard/local-dashboard";
import { getReleaseOrderCatalog } from "@/lib/catalog/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const catalog = await getReleaseOrderCatalog();
  return <LocalDashboard catalog={catalog} />;
}
