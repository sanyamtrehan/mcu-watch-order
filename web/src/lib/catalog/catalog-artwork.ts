export type CatalogArtwork = "iron-man" | "captain-america" | "avengers";

export function catalogArtworkForTitle(title: string): CatalogArtwork | null {
  if (title.startsWith("Iron Man")) return "iron-man";
  if (title.startsWith("Captain America")) return "captain-america";
  if (title.includes("Avengers")) return "avengers";
  return null;
}
