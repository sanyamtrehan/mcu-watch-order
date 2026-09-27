"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useGSAP } from "@gsap/react";
import { Check, ChevronRight, Cloud, Filter, Film, RotateCcw, Tv } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { DashboardUnit } from "@/lib/catalog/dashboard";
import { LOCAL_PROGRESS_EVENT, LOCAL_PROGRESS_KEY, parseLocalProgress, writeLocalProgress } from "@/lib/progress/local-progress";
import styles from "./page.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Props = { units: DashboardUnit[] };
type KindFilter = "all" | "movie" | "episode" | "special";

export function LocalDashboard({ units }: Props) {
  const shell = useRef<HTMLElement>(null);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
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
  }, { scope: shell });

  const watched = units.filter((unit) => watchedUnitIds.has(unit.id));
  const upcoming = units.filter((unit) => !watchedUnitIds.has(unit.id));
  const movies = units.filter((unit) => unit.unitKind === "movie");
  const episodes = units.filter((unit) => unit.unitKind === "episode");
  const visibleUpcoming = upcoming.filter((unit) => kindFilter === "all" || unit.unitKind === kindFilter);
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
    const next = new Set(watchedUnitIds);
    if (watchedValue) next.add(unitId);
    else next.delete(unitId);
    writeLocalProgress(next);
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
            <div className={styles.tileHeading}><div><p className={styles.kicker}>Queue filter</p><h2>Find your lane</h2></div><Filter size={18} aria-hidden="true" /></div>
            <div className={styles.filterRail}>
              <FilterButton active={kindFilter === "all"} onClick={() => setKindFilter("all")}>All</FilterButton>
              <FilterButton active={kindFilter === "movie"} onClick={() => setKindFilter("movie")}><Film size={15} /> Films</FilterButton>
              <FilterButton active={kindFilter === "episode"} onClick={() => setKindFilter("episode")}><Tv size={15} /> Episodes</FilterButton>
              <FilterButton active={kindFilter === "special"} onClick={() => setKindFilter("special")}>Specials</FilterButton>
            </div>
            <p className={styles.filterHint}>{visibleUpcoming.length} unwatched items match this view.</p>
          </section>

          <section className={`${styles.queueTile} ${styles.tile}`} data-entrance aria-label="Continuation queue">
            <div className={styles.tileHeading}><div><p className={styles.kicker}>Up next</p><h2>Release queue</h2></div><span>{visibleUpcoming.length} remaining</span></div>
            <ol className={styles.queueList}>{visibleUpcoming.slice(0, 5).map((unit) => <WatchUnitRow key={unit.id} unit={unit} watched={false} onChange={setWatched} />)}</ol>
          </section>

          <section className={`${styles.metricsTile} ${styles.tile}`} data-entrance aria-label="Progress totals">
            <Metric label="Films" watched={totals.moviesWatched} total={totals.moviesTotal} />
            <Metric label="Episodes" watched={totals.episodesWatched} total={totals.episodesTotal} />
            <Metric label="Titles complete" watched={totals.titlesCompleted} total={totals.titlesTotal} />
          </section>
        </section>

        {watched.length > 0 && <section className={styles.recentlyWatched} data-entrance><div><p className={styles.kicker}>Recently watched</p><h2>Undo a mark without losing your place.</h2></div><div className={styles.recentList}>{watched.slice(-3).reverse().map((unit) => <div className={styles.recentRow} key={unit.id}><span><Check size={16} /> {unit.title}</span><button type="button" onClick={() => setWatched(unit.id, false)} aria-label={`Undo watched status for ${unit.title}`}><RotateCcw size={15} /> Undo</button></div>)}</div></section>}

        <section className={styles.orderStory} data-story>
          <div className={styles.storyCopy}><p className={styles.kicker}>The order is the tool</p><h2>Release order stays factual. Chronology is editorial.</h2><p>Every item has a stable position, so your place survives catalog improvements and an eventual account sync.</p></div>
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
  return <li><span className={styles.position}>{String(unit.position).padStart(2, "0")}</span><div><UnitTitle unit={unit} heading="h3" /><p>{formatDate(unit.releaseDate)}</p></div><WatchButton unit={unit} watched={watched} onChange={onChange} compact /></li>;
}

function UnitTitle({ unit, heading }: { unit: DashboardUnit; heading: "h2" | "h3" }) {
  const Tag = heading;
  return <Tag>{unit.title}{unit.unitKind === "episode" && <span> S{unit.seasonNumber} E{unit.episodeNumber}</span>}</Tag>;
}

function WatchButton({ unit, watched, onChange, compact = false }: { unit: DashboardUnit; watched: boolean; onChange: (unitId: string, watchedValue: boolean) => void; compact?: boolean }) {
  return <button className={compact ? styles.compactWatch : styles.watchButton} type="button" onClick={() => onChange(unit.id, !watched)}>{watched ? <><RotateCcw size={16} /> Undo</> : <><Check size={16} /> Mark watched</>}</button>;
}

function subscribeToLocalProgress(onStoreChange: () => void) { window.addEventListener("storage", onStoreChange); window.addEventListener(LOCAL_PROGRESS_EVENT, onStoreChange); return () => { window.removeEventListener("storage", onStoreChange); window.removeEventListener(LOCAL_PROGRESS_EVENT, onStoreChange); }; }
function getLocalProgressSnapshot() { return window.localStorage.getItem(LOCAL_PROGRESS_KEY) ?? ""; }
function getServerProgressSnapshot() { return ""; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
