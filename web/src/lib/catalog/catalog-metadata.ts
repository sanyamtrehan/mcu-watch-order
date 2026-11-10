export const CATALOG_COLLECTIONS = [
  { id: "mcu", label: "MCU / Marvel Studios" },
  { id: "marvel-tv", label: "Marvel Television" },
  { id: "defenders", label: "Defenders Saga" },
  { id: "spider", label: "Spider-Man Multiverse" },
  { id: "x-men", label: "X-Men Universe" },
  { id: "legacy", label: "Legacy Marvel" },
  { id: "animation", label: "Marvel Animation" },
  { id: "web", label: "Web / promotional" },
] as const;

export type CatalogCollectionId = typeof CATALOG_COLLECTIONS[number]["id"];

const SOURCES: Record<CatalogCollectionId, { label: string; url: string }> = {
  mcu: { label: "Wikipedia · MCU productions", url: "https://en.wikipedia.org/wiki/List_of_Marvel_Cinematic_Universe_films" },
  "marvel-tv": { label: "Wikipedia · Marvel Television", url: "https://en.wikipedia.org/wiki/Marvel_Television" },
  defenders: { label: "Wikipedia · Marvel Netflix series", url: "https://en.wikipedia.org/wiki/Marvel%27s_Netflix_television_series" },
  spider: { label: "Wikipedia · Spider-Man in film", url: "https://en.wikipedia.org/wiki/Spider-Man_in_film" },
  "x-men": { label: "Wikipedia · X-Men film series", url: "https://en.wikipedia.org/wiki/X-Men_(film_series)" },
  legacy: { label: "Wikipedia · Marvel Comics films", url: "https://en.wikipedia.org/wiki/List_of_films_based_on_Marvel_Comics_publications" },
  animation: { label: "Wikipedia · Marvel animated media", url: "https://en.wikipedia.org/wiki/List_of_television_series_based_on_Marvel_Comics_publications" },
  web: { label: "Wikipedia · MCU digital series", url: "https://en.wikipedia.org/wiki/List_of_Marvel_Cinematic_Universe_television_series" },
};

const ANIMATION = ["spider-verse", "spider-ham", "spider-within", "series-modok", "series-hit-monkey", "series-what-if", "series-i-am-groot", "friendly-neighborhood"];
const WEB = ["double-agent", "whih-newsfront", "slingshot", "daily-bugle"];
const DEFENDERS = ["series-daredevil", "series-jessica-jones", "series-luke-cage", "series-iron-fist", "series-the-defenders", "series-the-punisher", "series-echo", "daredevil-born-again", "movie-daredevil", "movie-elektra", "punisher-one-last-kill"];
const SPIDER = ["spider-man", "spider-noir", "movie-venom", "movie-morbius", "movie-madame-web", "movie-kraven"];
const X_MEN = ["x-men", "movie-x2", "wolverine", "movie-logan", "movie-deadpool", "dark-phoenix", "new-mutants", "series-mutant-x", "series-legion", "series-the-gifted"];
const LEGACY = ["movie-blade", "series-blade", "fantastic-four-2005", "fantastic-four-rise", "fantastic-four-2015", "series-powers"];
const MARVEL_TV = ["agents-of-shield", "series-peggy-carter", "series-cloak-and-dagger", "series-helstorm", "series-inhumans", "series-runaways"];

export function catalogMetadata(titleId: string) {
  const collectionId: CatalogCollectionId = ANIMATION.some((part) => titleId.includes(part)) ? "animation"
    : WEB.some((part) => titleId.includes(part)) ? "web"
      : DEFENDERS.some((part) => titleId.includes(part)) ? "defenders"
        : SPIDER.some((part) => titleId.includes(part)) ? "spider"
          : X_MEN.some((part) => titleId.includes(part)) ? "x-men"
            : LEGACY.some((part) => titleId.includes(part)) ? "legacy"
              : MARVEL_TV.some((part) => titleId.includes(part)) ? "marvel-tv"
                : "mcu";
  const collection = CATALOG_COLLECTIONS.find((item) => item.id === collectionId)!;

  return { collectionId, collectionLabel: collection.label, source: SOURCES[collectionId], reviewedAt: "2026-11-02" };
}
