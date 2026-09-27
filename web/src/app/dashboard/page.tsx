import { LocalDashboard } from "@/app/dashboard/local-dashboard";
import { getReleaseOrderUnits } from "@/lib/catalog/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const units = await getReleaseOrderUnits();
  return <LocalDashboard units={units} />;
}
