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
  "Agatha All Along": "wanda-vision",
  "Agent Carter": "agent-carter",
  "Agents Of Shield": "agents-shield",
  "All Hail the King": "iron-man",
  "Black Widow": "black-widow",
  "Captain Marvel": "captain-marvel",
  "Cloak& Dagger": "cloak-dagger",
  Daredevil: "daredevil",
  "Daredevil (2003)": "daredevil",
  "Daredevil: Born Again": "daredevil",
  "Deadpool & Wolverine": "avengers",
  Echo: "hawkeye",
  Elektra: "daredevil",
  Eternals: "eternals",
  Hawkeye: "hawkeye",
  Helstorm: "helstrom",
  Inhumans: "inhumans",
  "Iron Fist": "iron-fist",
  Ironheart: "iron-man",
  "I Am Groot": "guardians",
  "Item 47": "agents-shield",
  "Jessica Jones": "jessica-jones",
  "Kraven the Hunter": "spider-man",
  Loki: "loki",
  "Luke Cage": "luke-cage",
  "Marvel Studios Assembled": "assembled",
  "Marvel Studios Legends": "legends",
  "Madame Web": "spider-man",
  Morbius: "spider-man",
  "Moon Knight": "moon-knight",
  "Ms. Marvel": "captain-marvel",
  "Peggy Carter": "agent-carter",
  Runaways: "runaways",
  "Secret Invasion": "captain-marvel",
  "She-Hulk: Attorney at Law": "hulk",
  "Spider-Noir": "spider-man",
  "Spider-Ham: Caught in a Ham": "spider-man",
  "Shang-Chi and the Legend of the Ten Rings": "shang-chi",
  "Team Darryl": "thor",
  "Team Thor": "thor",
  "Team Thor: Part 2": "thor",
  "The Consultant": "agents-shield",
  "The Defenders": "defenders",
  "The Falcon And The Winter Soldier": "falcon-winter-soldier",
  "The Incredible Hulk": "hulk",
  "The Guardians of the Galaxy Holiday Special": "guardians",
  "The Marvels": "captain-marvel",
  "The Punisher": "punisher",
  "The Spider Within: A Spider-Verse Story": "spider-man",
  "Thunderbolts*": "avengers",
  "Wanda Vision": "wanda-vision",
  "What If...?": "what-if",
  "Werewolf by Night": "moon-knight",
  "Your Friendly Neighborhood Spider-Man": "spider-man",
};

export function catalogArtworkForTitle(title: string): CatalogArtwork | null {
  if (title.startsWith("Blade")) return "punisher";
  if (title.startsWith("Fantastic Four") || title.startsWith("The Fantastic Four")) return "avengers";
  if (title.startsWith("Iron Man")) return "iron-man";
  if (title.startsWith("Captain America")) return "captain-america";
  if (title.includes("Avengers")) return "avengers";
  if (title.startsWith("Ant-Man")) return "ant-man";
  if (title.startsWith("Black Panther")) return "black-panther";
  if (title.startsWith("Doctor Strange")) return "doctor-strange";
  if (title.startsWith("Guardians of the Galaxy")) return "guardians";
  if (title.startsWith("Spider-Man")) return "spider-man";
  if (title.startsWith("The Amazing Spider-Man")) return "spider-man";
  if (title.startsWith("Venom")) return "spider-man";
  if (title.startsWith("Deadpool")) return "avengers";
  if (title.startsWith("X-Men") || ["X2", "The Wolverine", "Logan", "Dark Phoenix", "The New Mutants"].includes(title)) return "avengers";
  if (title.startsWith("Thor")) return "thor";
  return EXACT_ARTWORK[title] ?? null;
}
