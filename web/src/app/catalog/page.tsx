import { CatalogClient } from "@/app/catalog/catalog-client";
import { getReleaseOrderCatalog } from "@/lib/catalog/dashboard";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const catalog = await getReleaseOrderCatalog();
  return <CatalogClient units={catalog.units} />;
}
