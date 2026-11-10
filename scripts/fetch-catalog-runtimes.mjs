import fs from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

const catalogPath = new URL("../data/mcu-release-catalog.json", import.meta.url);
const cachePath = path.join(os.tmpdir(), "mcu-watch-order-runtime-cache.json");
const imdbBasicsPath = path.join(os.tmpdir(), "mcu-title.basics.tsv.gz");
const imdbEpisodesPath = path.join(os.tmpdir(), "mcu-title.episode.tsv.gz");
const write = process.argv.includes("--write");
const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
const cache = await readCache();

const SERIES_ALIASES = {
  "series-agents-of-shield": "Marvel's Agents of S.H.I.E.L.D.",
  "series-peggy-carter": "Marvel's Agent Carter",
  "series-daredevil": "Marvel's Daredevil",
  "series-jessica-jones": "Marvel's Jessica Jones",
  "series-luke-cage": "Marvel's Luke Cage",
  "series-iron-fist": "Marvel's Iron Fist",
  "series-the-defenders": "Marvel's The Defenders",
  "series-the-punisher": "Marvel's The Punisher",
  "series-cloak-and-dagger": "Marvel's Cloak & Dagger",
  "series-inhumans": "Marvel's Inhumans",
  "series-runaways": "Marvel's Runaways",
  "series-modok": "Marvel's M.O.D.O.K.",
  "series-wanda-vision": "WandaVision",
  "series-what-if": "What If...?",
};

const TITLE_ALIASES = {
  "movie-marvel-s-the-avengers": "The Avengers",
  "movie-thunderbolts": "Thunderbolts*",
  "special-a-funny-thing-happened-on-the-way-to-thor-s-hammer": "A Funny Thing Happened on the Way to Thor's Hammer",
};

const LEGENDS_RUNTIMES = {
  1: [10, 10, 9, 11, 8, 7, 9, 9, 12, 9, 6, 10, 6, 11, 10, 7, 9, 12, 7, 7, 10, 9, 6, 7, 6, 6],
  2: [7, 5, 4, 7, 6, 4, 7, 5, 5, 8, 7, 3, 5, 6, 4, 6, 6, 7, 7, 5, 4],
};

const unresolved = [];
const warnings = [];
const episodeCandidates = [];
const imdbSeriesIds = new Map([["series-marvel-studios-legends", "tt13650480"]]);
let resolvedEpisodes = 0;
let resolvedTitles = 0;

for (const series of catalog.series) {
  const firstDate = series.seasons.flatMap((season) => season.episodes).map((episode) => episode.releaseDate).sort()[0];
  const target = SERIES_ALIASES[series.id] ?? series.title;
  const results = await getJson(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(target)}`);
  const match = chooseShow(results, target, Number(firstDate.slice(0, 4)));
  if (!match) {
    for (const season of series.seasons) for (const episode of season.episodes) episodeCandidates.push({ series, season, episode, sourceParts: sourceCoordinates(episode, season) });
    continue;
  }

  const sourceEpisodes = await getJson(`https://api.tvmaze.com/shows/${match.id}/episodes?specials=1`);
  const episodesByKey = new Map(sourceEpisodes.filter((episode) => episode.number !== null).map((episode) => [`${episode.season}:${episode.number}`, episode]));
  if (match.externals?.imdb) imdbSeriesIds.set(series.id, match.externals.imdb);

  for (const season of series.seasons) {
    for (const episode of season.episodes) {
      const sourceParts = resolveSourceEpisodes(episode, season, sourceEpisodes, episodesByKey);
      if (sourceParts[0]?.airdate && sourceParts[0].airdate !== episode.releaseDate) warnings.push(`${episode.id}: catalog ${episode.releaseDate}, TVmaze ${sourceParts[0].airdate}`);
      episodeCandidates.push({
        series,
        season,
        episode,
        sourceParts: sourceParts.length ? sourceParts.map(({ season: sourceSeason, number }) => ({ season: sourceSeason, number })) : sourceCoordinates(episode, season),
        tvmazeRuntime: sourceParts.length && sourceParts.every((source) => positiveInteger(source.runtime)) ? sourceParts.reduce((sum, source) => sum + source.runtime, 0) : null,
      });
    }
  }
}

const standalone = [...catalog.movies, ...catalog.specials];
for (const group of chunks(standalone, 30)) {
  const labels = [...new Set(group.map((item) => (TITLE_ALIASES[item.id] ?? item.title).replace(/\s*\(\d{4}\)$/, "")))];
  const values = labels.map((label) => `${JSON.stringify(label)}@en`).join(" ");
  const query = `SELECT ?item ?label ?duration ?date ?description WHERE { VALUES ?label { ${values} } ?item rdfs:label ?label; wdt:P2047 ?duration. OPTIONAL { ?item wdt:P577 ?date. } OPTIONAL { ?item schema:description ?description. FILTER(LANG(?description) = "en") } }`;
  const response = await getJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, { "User-Agent": "MCUWatchOrder/1.0 (catalog runtime enrichment)" });
  const candidates = new Map();
  for (const binding of response.results.bindings) {
    const id = binding.item.value.split("/").at(-1);
    const key = `${binding.label.value}:${id}`;
    const existing = candidates.get(key) ?? { id, label: binding.label.value, description: binding.description?.value ?? "", years: [], durations: [] };
    const year = binding.date?.value ? Number(binding.date.value.slice(0, 4)) : null;
    const duration = Number(binding.duration.value);
    if (year) existing.years.push(year);
    if (positiveInteger(duration)) existing.durations.push(duration);
    candidates.set(key, existing);
  }
  for (const item of group) {
    const title = (TITLE_ALIASES[item.id] ?? item.title).replace(/\s*\(\d{4}\)$/, "");
    const year = Number(item.releaseDate.slice(0, 4));
    const matches = [...candidates.values()].filter((candidate) => normalize(candidate.label) === normalize(title)).map((candidate) => ({ candidate, score: (candidate.years.includes(year) ? 100 : candidate.years.length ? -Math.min(...candidate.years.map((value) => Math.abs(value - year))) * 5 : 0) + (/film|special|short|documentary/.test(candidate.description.toLowerCase()) ? 30 : 0) })).sort((left, right) => right.score - left.score);
    const match = matches[0]?.candidate;
    const runtimes = [...new Set(match?.durations ?? [])];
    if (!match || runtimes.length === 0 || matches[0].score < 30) {
      continue;
    }
    item.runtimeMinutes = Math.min(...runtimes);
    resolvedTitles += 1;
  }
}

if (episodeCandidates.length || standalone.length) {
  await Promise.all([
    ensureFile(imdbBasicsPath, "https://datasets.imdbws.com/title.basics.tsv.gz"),
    ensureFile(imdbEpisodesPath, "https://datasets.imdbws.com/title.episode.tsv.gz"),
  ]);
  const imdbEpisodeIds = await readImdbEpisodeIds(episodeCandidates, imdbSeriesIds);
  const imdbValues = await readImdbRuntimes(new Set(imdbEpisodeIds.values()), standalone);
  for (const candidate of episodeCandidates) {
    const parentId = imdbSeriesIds.get(candidate.series.id);
    const runtimes = candidate.sourceParts.map(({ season, number }) => imdbValues.byId.get(imdbEpisodeIds.get(`${parentId}:${season}:${number}`)));
    const sourcedRuntime = fallbackRuntime(candidate) ?? (runtimes.length && runtimes.every(positiveInteger) ? runtimes.reduce((sum, runtime) => sum + runtime, 0) : null) ?? candidate.tvmazeRuntime;
    if (positiveInteger(sourcedRuntime)) {
      candidate.episode.runtimeMinutes = sourcedRuntime;
      resolvedEpisodes += 1;
    } else {
      unresolved.push(`${candidate.series.id}:S${candidate.season.number}E${candidate.episode.number}`);
    }
  }
  resolvedTitles = 0;
  for (const item of standalone) {
    const runtime = imdbValues.byCatalogId.get(item.id);
    if (positiveInteger(runtime)) item.runtimeMinutes = runtime;
    if (positiveInteger(item.runtimeMinutes)) resolvedTitles += 1;
    else unresolved.push(item.id);
  }
}

catalog.source.runtime = {
  lastReviewed: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()),
  providers: [
    { name: "TVmaze", url: "https://www.tvmaze.com/api", usage: "individual television episode runtimes" },
    { name: "Wikidata", url: "https://www.wikidata.org/wiki/Property:P2047", usage: "film and special runtimes" },
    { name: "IMDb Non-Commercial Datasets", url: "https://www.imdb.com/interfaces/", usage: "missing film, special, and individual episode runtimes" },
    { name: "TheTVDB", url: "https://thetvdb.com/", usage: "Marvel Studios: Legends and The Daily Bugle episode runtimes missing from IMDb" },
  ],
};

await fs.writeFile(cachePath, `${JSON.stringify(cache)}\n`);
console.log(`Resolved ${resolvedTitles}/${standalone.length} movies and specials; ${resolvedEpisodes}/${catalog.series.reduce((count, series) => count + series.seasons.reduce((sum, season) => sum + season.episodes.length, 0), 0)} episodes.`);
if (warnings.length) console.log(`Warnings (${warnings.length}):\n${warnings.slice(0, 40).join("\n")}${warnings.length > 40 ? `\n... ${warnings.length - 40} more` : ""}`);
if (unresolved.length) console.log(`Unresolved (${unresolved.length}):\n${unresolved.join("\n")}`);
if (write) {
  if (unresolved.length) throw new Error("Catalog was not written because some runtimes remain unresolved.");
  await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log("Catalog runtimes written.");
}

async function readCache() {
  try { return JSON.parse(await fs.readFile(cachePath, "utf8")); }
  catch { return {}; }
}

async function ensureFile(file, url) {
  try {
    if ((await fs.stat(file)).size > 0) return;
  } catch {}
  const temporary = `${file}.tmp`;
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
  await fs.rename(temporary, file);
}

async function getJson(url, headers = {}) {
  if (cache[url]) return cache[url];
  const requestHeaders = url.includes("wikidata.org") ? { "User-Agent": "MCUWatchOrder/1.0 (catalog runtime enrichment)", ...headers } : headers;
  for (let attempt = 0; attempt < 7; attempt += 1) {
    try {
      const response = await fetch(url, { headers: requestHeaders });
      if (response.ok) {
        const value = await response.json();
        cache[url] = value;
        await fs.writeFile(cachePath, `${JSON.stringify(cache)}\n`);
        await pause(url.includes("wikidata.org") ? 500 : 120);
        return value;
      }
      if (response.status !== 429 && response.status < 500) throw new Error(`${response.status} ${response.statusText}: ${url}`);
    } catch (error) {
      if (attempt === 6) throw error;
    }
    await pause(1_000 * (attempt + 1));
  }
  throw new Error(`Unable to fetch ${url}`);
}

function chooseShow(results, title, year) {
  const ranked = results.map(({ score, show }) => ({ show, score: score * 10 + similarity(show.name, title) * 100 + (strictNormalize(show.name) === strictNormalize(title) ? 80 : 0) - yearDistance(show.premiered, year) * 3 })).sort((left, right) => right.score - left.score);
  return ranked[0]?.score >= 55 ? ranked[0].show : null;
}

function resolveSourceEpisodes(episode, season, sourceEpisodes, episodesByKey) {
  const combinedNumbers = episode.number.split(/\s*[-–]\s*/).map(Number).filter(Number.isInteger);
  if (combinedNumbers.length > 1) return combinedNumbers.map((number) => episodesByKey.get(`${season.number}:${number}`)).filter(Boolean);
  const sourceSeason = sourceEpisodes.filter((source) => source.season === season.number && source.number !== null);
  const sameDate = sourceEpisodes.filter((source) => source.airdate === episode.releaseDate && source.number !== null);
  if (sourceSeason.length > season.episodes.length && sameDate.length) return sameDate;
  const exact = episodesByKey.get(`${season.number}:${Number(episode.number)}`);
  if (exact) return [exact];
  return sameDate;
}

function sourceCoordinates(episode, season) {
  return episode.number.split(/\s*[-–]\s*/).map(Number).filter(Number.isInteger).map((number) => ({ season: season.number, number }));
}

function fallbackRuntime({ series, season, episode }) {
  if (series.id === "series-the-daily-bugle") return 1;
  if (series.id === "series-marvel-studios-legends") return LEGENDS_RUNTIMES[season.number]?.[Number(episode.number) - 1] ?? null;
  return null;
}

async function readImdbEpisodeIds(pending, seriesIds) {
  const wanted = new Set(pending.map(({ series }) => seriesIds.get(series.id)).filter(Boolean));
  const ids = new Map();
  if (!wanted.size) return ids;
  const lines = readline.createInterface({ input: createReadStream(imdbEpisodesPath).pipe(createGunzip()), crlfDelay: Infinity });
  for await (const line of lines) {
    const [id, parentId, season, episode] = line.split("\t");
    if (wanted.has(parentId)) ids.set(`${parentId}:${season}:${episode}`, id);
  }
  return ids;
}

async function readImdbRuntimes(wantedIds, pendingStandalone) {
  const byId = new Map();
  const byCatalogId = new Map();
  const wantedTitles = new Map();
  for (const item of pendingStandalone) {
    const title = normalize((TITLE_ALIASES[item.id] ?? item.title).replace(/\s*\(\d{4}\)$/, ""));
    const items = wantedTitles.get(title) ?? [];
    items.push(item);
    wantedTitles.set(title, items);
  }

  const lines = readline.createInterface({ input: createReadStream(imdbBasicsPath).pipe(createGunzip()), crlfDelay: Infinity });
  for await (const line of lines) {
    const [id, titleType, primaryTitle, originalTitle, , startYear, , runtime] = line.split("\t");
    if (wantedIds.has(id) && positiveInteger(Number(runtime))) byId.set(id, Number(runtime));
    if (!/^(movie|short|tvMovie|tvShort|tvSpecial|video)$/.test(titleType) || runtime === "\\N") continue;
    const candidates = new Set([...(wantedTitles.get(normalize(primaryTitle)) ?? []), ...(wantedTitles.get(normalize(originalTitle)) ?? [])]);
    const closestYear = Math.min(...[...candidates].map((item) => Math.abs(Number(item.releaseDate.slice(0, 4)) - Number(startYear))));
    if (closestYear <= 1) for (const item of candidates) if (Math.abs(Number(item.releaseDate.slice(0, 4)) - Number(startYear)) === closestYear) byCatalogId.set(item.id, Number(runtime));
  }
  return { byId, byCatalogId };
}

function similarity(left, right) {
  const a = normalize(left); const b = normalize(right);
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return .72;
  return 0;
}

function normalize(value) { return value.toLowerCase().replace(/^marvels?\s+/, "").replace(/[^a-z0-9]+/g, ""); }
function strictNormalize(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, ""); }
function yearDistance(date, year) { return date ? Math.abs(Number(date.slice(0, 4)) - year) : 20; }
function positiveInteger(value) { return Number.isInteger(value) && value > 0; }
function chunks(values, size) { return Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, (index + 1) * size)); }
function pause(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }
