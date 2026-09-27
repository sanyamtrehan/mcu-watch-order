"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useGSAP } from "@gsap/react";
import { Check, ChevronRight, Cloud, Film, RotateCcw, Tv, X } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { DashboardUnit, ReleaseOrderCatalog } from "@/lib/catalog/dashboard";
import { LOCAL_PROGRESS_EVENT, LOCAL_PROGRESS_KEY, parseLocalProgress, writeLocalProgress } from "@/lib/progress/local-progress";
import styles from "./page.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Props = { catalog: ReleaseOrderCatalog };
type KindFilter = "all" | "movie" | "episode" | "special";
type WatchStateFilter = "all" | "unwatched" | "watched";

export function LocalDashboard({ catalog }: Props) {
  const { units, relationships } = catalog;
  const shell = useRef<HTMLElement>(null);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [watchStateFilter, setWatchStateFilter] = useState<WatchStateFilter>("unwatched");
  const [seriesFilter, setSeriesFilter] = useState("all");
  const [titleFilter, setTitleFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const validUnitIds = useMemo(() => new Set(units.map((unit) => unit.id)), [units]);
  const serializedProgress = useSyncExternalStore(subscribeToLocalProgress, getLocalProgressSnapshot, getServerProgressSnapshot);
  const watchedUnitIds = useMemo(() => new Set(parseLocalProgress(serializedProgress, validUnitIds).watchedUnitIds), [serializedProgress, validUnitIds]);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.from("[data-entrance]", { y: 20, opacity: 0, duration: 0.65, stagger: 0.08, ease: "power3.out" });
    gsap.fromTo("[data-backdrop]", { scale: 0.92, opacity: 0.46 }, {
      scale: 1,
      opacity: 0.78,
      ease: "none",
      scrollTrigger: { trigger: "[data-story]", start: "top 82%", end: "bottom 30%", scrub: true },
    });

    const media = gsap.matchMedia();
    media.add("(min-width: 900px)", () => {
      ScrollTrigger.create({
        trigger: "[data-story]",
        start: "top top+=88",
        end: "bottom bottom",
        pin: "[data-story-copy]",
        pinSpacing: false,
      });
    });

    return () => media.revert();
  }, { scope: shell });

  const watched = units.filter((unit) => watchedUnitIds.has(unit.id));
  const upcoming = units.filter((unit) => !watchedUnitIds.has(unit.id));
  const movies = units.filter((unit) => unit.unitKind === "movie");
  const episodes = units.filter((unit) => unit.unitKind === "episode");
  const titles = [...new Map(units.map((unit) => [unit.titleId, { id: unit.titleId, title: unit.title, kind: unit.titleKind }])).values()].sort((a, b) => a.title.localeCompare(b.title));
  const series = titles.filter((title) => title.kind === "series");
  const titleScope = titleFilter !== "all" ? titleFilter : seriesFilter;
  const seasons = [...new Map(units.filter((unit) => unit.titleId === titleScope && unit.seasonId).map((unit) => [unit.seasonId!, unit.seasonNumber!])).entries()].sort(([, a], [, b]) => a - b);
  const visibleUnits = units.filter((unit) => {
    const watchedValue = watchedUnitIds.has(unit.id);
    return (kindFilter === "all" || unit.unitKind === kindFilter)
      && (watchStateFilter === "all" || (watchStateFilter === "watched" ? watchedValue : !watchedValue))
      && (seriesFilter === "all" || unit.titleId === seriesFilter)
      && (titleFilter === "all" || unit.titleId === titleFilter)
      && (seasonFilter === "all" || unit.seasonId === seasonFilter);
  });
  const selectedTitle = titles.find((title) => title.id === titleFilter || title.id === seriesFilter);
  const selectedTitleUnits = selectedTitle ? units.filter((unit) => unit.titleId === selectedTitle.id) : [];
  const selectedTitleRelations = selectedTitle ? relationships.filter((relation) => relation.fromTitleId === selectedTitle.id || relation.toTitleId === selectedTitle.id) : [];
  const titleCounts = new Map<string, { watched: number; total: number }>();

  for (const unit of units) {
    const current = titleCounts.get(unit.title) ?? { watched: 0, total: 0 };
    current.total += 1;
    current.watched += Number(watchedUnitIds.has(unit.id));
    titleCounts.set(unit.title, current);
  }

  const totals = {
    watched: watched.length,
    total: units.length,
    moviesWatched: movies.filter((unit) => watchedUnitIds.has(unit.id)).length,
    moviesTotal: movies.length,
    episodesWatched: episodes.filter((unit) => watchedUnitIds.has(unit.id)).length,
    episodesTotal: episodes.length,
    titlesCompleted: [...titleCounts.values()].filter((count) => count.total > 0 && count.watched === count.total).length,
    titlesTotal: titleCounts.size,
  };
  const percentage = totals.total ? Math.round((totals.watched / totals.total) * 100) : 0;

  function setWatched(unitId: string, watchedValue: boolean) {
    const persist = () => {
      const next = new Set(watchedUnitIds);
      if (watchedValue) next.add(unitId);
      else next.delete(unitId);
      writeLocalProgress(next);
    };

    const row = shell.current?.querySelector(`[data-watch-unit="${unitId}"]`);
    if (watchedValue && row && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.to(row, { height: 0, opacity: 0, paddingBlock: 0, duration: 0.22, ease: "power2.in", onComplete: persist });
      return;
    }

    persist();
  }

  function resetFilters() {
    setKindFilter("all");
    setWatchStateFilter("unwatched");
    setSeriesFilter("all");
    setTitleFilter("all");
    setSeasonFilter("all");
  }

  return (
    <main ref={shell} className={styles.appShell}>
      <CommandNav />
      <div className={styles.dashboardRail}>
        <section className={styles.progressHero} data-entrance>
          <div>
            <p className={styles.kicker}>Release order</p>
            <h1>Know exactly what comes next.</h1>
            <p className={styles.heroCopy}>Progress is saved to this device. Create an account later when you are ready to sync it.</p>
          </div>
          <div className={styles.heroProgress} aria-label={`${percentage}% of release order completed`}>
            <span>{percentage}%</span>
            <div className={styles.heroTrack}><i style={{ width: `${percentage}%` }} /></div>
            <p>{totals.watched} of {totals.total} watch units completed</p>
          </div>
        </section>

        <section className={styles.bento} aria-label="Watch dashboard">
          <article className={`${styles.nextTile} ${styles.tile}`} data-entrance>
            <div className={styles.nextBackdrop} aria-hidden="true" />
            <div className={styles.tileContent}>
              <p className={styles.kicker}>Continue watching</p>
              {upcoming[0] ? <><UnitTitle unit={upcoming[0]} heading="h2" /><p className={styles.tileMetadata}>#{upcoming[0].position} in release order · {formatDate(upcoming[0].releaseDate)}</p><WatchButton unit={upcoming[0]} watched={false} onChange={setWatched} /></> : <><h2>Release order complete.</h2><p className={styles.tileMetadata}>Every current watch unit is marked watched on this device.</p></>}
            </div>
          </article>

          <article className={`${styles.progressTile} ${styles.tile}`} data-entrance>
            <p className={styles.kicker}>Your pace</p>
            <strong>{totals.watched}<span> / {totals.total}</span></strong>
            <p>Keep a clear continuation point across films, specials, and episodes.</p>
            <div className={styles.miniTrack} aria-hidden="true"><i style={{ width: `${percentage}%` }} /></div>
          </article>

          <section className={`${styles.filterTile} ${styles.tile}`} data-entrance aria-label="Queue filters">
            <div className={styles.tileHeading}><div><p className={styles.kicker}>Queue filter</p><h2>Find your lane</h2></div><button className={styles.resetButton} type="button" onClick={resetFilters} aria-label="Reset queue filters" title="Reset filters"><X size={17} /></button></div>
            <div className={styles.filterRail}>
              <FilterButton active={kindFilter === "all"} onClick={() => setKindFilter("all")}>All</FilterButton>
              <FilterButton active={kindFilter === "movie"} onClick={() => setKindFilter("movie")}><Film size={15} /> Films</FilterButton>
              <FilterButton active={kindFilter === "episode"} onClick={() => setKindFilter("episode")}><Tv size={15} /> Episodes</FilterButton>
              <FilterButton active={kindFilter === "special"} onClick={() => setKindFilter("special")}>Specials</FilterButton>
            </div>
            <div className={styles.filterRail}>
              <FilterButton active={watchStateFilter === "unwatched"} onClick={() => setWatchStateFilter("unwatched")}>Unwatched</FilterButton>
              <FilterButton active={watchStateFilter === "watched"} onClick={() => setWatchStateFilter("watched")}>Watched</FilterButton>
              <FilterButton active={watchStateFilter === "all"} onClick={() => setWatchStateFilter("all")}>Both</FilterButton>
            </div>
            <div className={styles.selectFilters}>
              <label>Series<select value={seriesFilter} onChange={(event) => { setSeriesFilter(event.target.value); setTitleFilter("all"); setSeasonFilter("all"); }}><option value="all">All series</option>{series.map((title) => <option key={title.id} value={title.id}>{title.title}</option>)}</select></label>
              <label>Title<select value={titleFilter} onChange={(event) => { setTitleFilter(event.target.value); setSeriesFilter("all"); setSeasonFilter("all"); }}><option value="all">All titles</option>{titles.map((title) => <option key={title.id} value={title.id}>{title.title}</option>)}</select></label>
              <label>Season<select disabled={seasons.length === 0} value={seasonFilter} onChange={(event) => setSeasonFilter(event.target.value)}><option value="all">All seasons</option>{seasons.map(([id, number]) => <option key={id} value={id}>Season {number}</option>)}</select></label>
            </div>
            <p className={styles.filterHint}>{visibleUnits.length} items match this view.</p>
          </section>

          <section className={`${styles.queueTile} ${styles.tile}`} data-entrance aria-label="Continuation queue">
            <div className={styles.tileHeading}><div><p className={styles.kicker}>Up next</p><h2>Release queue</h2></div><span>{visibleUnits.length} in view</span></div>
            <ol className={styles.queueList}>{visibleUnits.slice(0, 5).map((unit) => <WatchUnitRow key={unit.id} unit={unit} watched={watchedUnitIds.has(unit.id)} onChange={setWatched} />)}</ol>
          </section>

          <section className={`${styles.metricsTile} ${styles.tile}`} data-entrance aria-label="Progress totals">
            <Metric label="Films" watched={totals.moviesWatched} total={totals.moviesTotal} />
            <Metric label="Episodes" watched={totals.episodesWatched} total={totals.episodesTotal} />
            <Metric label="Titles complete" watched={totals.titlesCompleted} total={totals.titlesTotal} />
          </section>
        </section>

        {selectedTitle && <TitleProgressPanel title={selectedTitle} units={selectedTitleUnits} relationships={selectedTitleRelations} watchedUnitIds={watchedUnitIds} />}

        {watched.length > 0 && <section className={styles.recentlyWatched} data-entrance><div><p className={styles.kicker}>Recently watched</p><h2>Undo a mark without losing your place.</h2></div><div className={styles.recentList}>{watched.slice(-3).reverse().map((unit) => <div className={styles.recentRow} key={unit.id}><span><Check size={16} /> {unit.title}</span><button type="button" onClick={() => setWatched(unit.id, false)} aria-label={`Undo watched status for ${unit.title}`}><RotateCcw size={15} /> Undo</button></div>)}</div></section>}

        <section className={styles.orderStory} data-story>
          <div className={styles.storyCopy} data-story-copy><p className={styles.kicker}>The order is the tool</p><h2>Release order stays factual. Chronology is editorial.</h2><p>Every item has a stable position, so your place survives catalog improvements and an eventual account sync.</p></div>
          <div className={styles.storyMedia} data-backdrop><div><span>489</span><p>curated watch units in the current release sequence</p></div></div>
        </section>

        <footer className={styles.footerAction}><div><p className={styles.kicker}>Keep it yours</p><h2>Start local. Sync when it matters.</h2></div><a href="/login"><Cloud size={17} /> Sync this progress <ChevronRight size={17} /></a></footer>
      </div>
    </main>
  );
}

function CommandNav() {
  return <header className={styles.commandNav}><a className={styles.wordmark} href="/dashboard">MCU <span>Watch Order</span></a><div className={styles.orderSwitcher} aria-label="Watch order"><button type="button" aria-pressed="true">Release</button><button type="button" disabled title="Needs curated positions">Chronological</button></div><a className={styles.syncLink} href="/login"><Cloud size={16} /> <span>Sync</span></a></header>;
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button className={active ? styles.filterActive : styles.filterButton} type="button" aria-pressed={active} onClick={onClick}>{children}</button>;
}

function Metric({ label, watched, total }: { label: string; watched: number; total: number }) {
  return <div><p>{label}</p><strong>{watched}<span> / {total}</span></strong></div>;
}

function WatchUnitRow({ unit, watched, onChange }: { unit: DashboardUnit; watched: boolean; onChange: (unitId: string, watchedValue: boolean) => void }) {
  return <li data-watch-unit={unit.id}><span className={styles.position}>{String(unit.position).padStart(2, "0")}</span><div><UnitTitle unit={unit} heading="h3" /><p>{formatDate(unit.releaseDate)}</p></div><WatchButton unit={unit} watched={watched} onChange={onChange} compact /></li>;
}

function UnitTitle({ unit, heading }: { unit: DashboardUnit; heading: "h2" | "h3" }) {
  const Tag = heading;
  return <Tag>{unit.title}{unit.unitKind === "episode" && <span> S{unit.seasonNumber} E{unit.episodeNumber}</span>}</Tag>;
}

function WatchButton({ unit, watched, onChange, compact = false }: { unit: DashboardUnit; watched: boolean; onChange: (unitId: string, watchedValue: boolean) => void; compact?: boolean }) {
  return <button className={compact ? styles.compactWatch : styles.watchButton} type="button" onClick={() => onChange(unit.id, !watched)}>{watched ? <><RotateCcw size={16} /> Undo</> : <><Check size={16} /> Mark watched</>}</button>;
}

function TitleProgressPanel({ title, units, relationships, watchedUnitIds }: { title: { id: string; title: string; kind: DashboardUnit["titleKind"] }; units: DashboardUnit[]; relationships: ReleaseOrderCatalog["relationships"]; watchedUnitIds: Set<string> }) {
  const watched = units.filter((unit) => watchedUnitIds.has(unit.id)).length;
  const seasons = [...new Map(units.filter((unit) => unit.seasonId).map((unit) => [unit.seasonId!, { number: unit.seasonNumber!, total: 0, watched: 0 }])).entries()];
  for (const unit of units) {
    if (!unit.seasonId) continue;
    const season = seasons.find(([id]) => id === unit.seasonId)?.[1];
    if (!season) continue;
    season.total += 1;
    season.watched += Number(watchedUnitIds.has(unit.id));
  }

  return <section className={styles.titlePanel} data-entrance><div><p className={styles.kicker}>{title.kind}</p><h2>{title.title}</h2><p>{watched} of {units.length} watch units completed.</p></div><div className={styles.titlePanelDetails}>{seasons.length > 0 && <div><h3>Seasons</h3><ul>{seasons.sort(([, a], [, b]) => a.number - b.number).map(([id, season]) => <li key={id}>Season {season.number}<span>{season.watched} / {season.total}</span></li>)}</ul></div>}{relationships.length > 0 && <div><h3>Connected titles</h3><ul>{relationships.map((relationship) => <li key={`${relationship.fromTitleId}-${relationship.toTitleId}`}>{relationship.fromTitleId === title.id ? relationship.toTitle : relationship.fromTitle}<span>{relationship.type}</span></li>)}</ul></div>}</div></section>;
}

function subscribeToLocalProgress(onStoreChange: () => void) { window.addEventListener("storage", onStoreChange); window.addEventListener(LOCAL_PROGRESS_EVENT, onStoreChange); return () => { window.removeEventListener("storage", onStoreChange); window.removeEventListener(LOCAL_PROGRESS_EVENT, onStoreChange); }; }
function getLocalProgressSnapshot() { return window.localStorage.getItem(LOCAL_PROGRESS_KEY) ?? ""; }
function getServerProgressSnapshot() { return ""; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
