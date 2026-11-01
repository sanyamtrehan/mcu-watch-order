export type CatalogArtwork =
  | "agent-carter"
  | "agents-shield"
  | "ant-man"
  | "assembled"
  | "avengers"
  | "black-panther"
  | "black-widow"
  | "captain-america"
  | "captain-marvel"
  | "cloak-dagger"
  | "daredevil"
  | "defenders"
  | "doctor-strange"
  | "eternals"
  | "falcon-winter-soldier"
  | "guardians"
  | "hawkeye"
  | "helstrom"
  | "hulk"
  | "inhumans"
  | "iron-fist"
  | "iron-man"
  | "jessica-jones"
  | "legends"
  | "loki"
  | "luke-cage"
  | "moon-knight"
  | "punisher"
  | "runaways"
  | "shang-chi"
  | "spider-man"
  | "thor"
  | "wanda-vision"
  | "what-if";

const EXACT_ARTWORK: Record<string, CatalogArtwork> = {
  "A Funny Thing Happened on the Way to Thor's Hammer": "thor",
  "Agent Carter": "agent-carter",
  "Agents Of Shield": "agents-shield",
  "All Hail the King": "iron-man",
  "Black Widow": "black-widow",
  "Captain Marvel": "captain-marvel",
  "Cloak& Dagger": "cloak-dagger",
  Daredevil: "daredevil",
  Eternals: "eternals",
  Hawkeye: "hawkeye",
  Helstorm: "helstrom",
  Inhumans: "inhumans",
  "Iron Fist": "iron-fist",
  "Item 47": "agents-shield",
  "Jessica Jones": "jessica-jones",
  Loki: "loki",
  "Luke Cage": "luke-cage",
  "Marvel Studios Assembled": "assembled",
  "Marvel Studios Legends": "legends",
  "Moon Knight": "moon-knight",
  "Peggy Carter": "agent-carter",
  Runaways: "runaways",
  "Shang-Chi and the Legend of the Ten Rings": "shang-chi",
  "Team Darryl": "thor",
  "Team Thor": "thor",
  "Team Thor: Part 2": "thor",
  "The Consultant": "agents-shield",
  "The Defenders": "defenders",
  "The Falcon And The Winter Soldier": "falcon-winter-soldier",
  "The Incredible Hulk": "hulk",
  "The Marvels": "captain-marvel",
  "The Punisher": "punisher",
  "Wanda Vision": "wanda-vision",
  "What If...?": "what-if",
};

export function catalogArtworkForTitle(title: string): CatalogArtwork | null {
  if (title.startsWith("Iron Man")) return "iron-man";
  if (title.startsWith("Captain America")) return "captain-america";
  if (title.includes("Avengers")) return "avengers";
  if (title.startsWith("Ant-Man")) return "ant-man";
  if (title.startsWith("Black Panther")) return "black-panther";
  if (title.startsWith("Doctor Strange")) return "doctor-strange";
  if (title.startsWith("Guardians of the Galaxy")) return "guardians";
  if (title.startsWith("Spider-Man")) return "spider-man";
  if (title.startsWith("Thor")) return "thor";
  return EXACT_ARTWORK[title] ?? null;
}
