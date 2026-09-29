"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useGSAP } from "@gsap/react";
import { Check, LayoutGrid, List, RotateCcw } from "lucide-react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SoundToggle } from "@/components/sound-toggle";
import type { DashboardUnit } from "@/lib/catalog/dashboard";
import { playScrollChime } from "@/lib/ui/scroll-chime";
import { LOCAL_PROGRESS_EVENT, LOCAL_PROGRESS_KEY, parseLocalProgress, writeLocalProgress } from "@/lib/progress/local-progress";
import styles from "./page.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ViewMode = "table" | "cards";
type StatusFilter = "all" | "unwatched" | "watched";

export function CatalogClient({ units }: { units: DashboardUnit[] }) {
  const shell = useRef<HTMLElement>(null);
  const heroChimed = useRef(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [titleFilter, setTitleFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const validUnitIds = useMemo(() => new Set(units.map((unit) => unit.id)), [units]);
  const serializedProgress = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const watchedIds = useMemo(() => new Set(parseLocalProgress(serializedProgress, validUnitIds).watchedUnitIds), [serializedProgress, validUnitIds]);
  const titles = [...new Map(units.map((unit) => [unit.titleId, { id: unit.titleId, title: unit.title }])).values()].sort((a, b) => a.title.localeCompare(b.title));
  const seasons = [...new Map(units.filter((unit) => unit.titleId === titleFilter && unit.seasonId).map((unit) => [unit.seasonId!, unit.seasonNumber!])).entries()].sort(([, a], [, b]) => a - b);
  const visibleUnits = units.filter((unit) => (statusFilter === "all" || (statusFilter === "watched") === watchedIds.has(unit.id)) && (kindFilter === "all" || unit.unitKind === kindFilter) && (titleFilter === "all" || unit.titleId === titleFilter) && (seasonFilter === "all" || unit.seasonId === seasonFilter));

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from("[data-catalog-hero] > *", { opacity: 0, y: 26, duration: .8, stagger: .12, ease: "power3.out" });
    gsap.from("[data-catalog-workspace]", { opacity: 0, y: 48, duration: .85, ease: "power3.out", scrollTrigger: { trigger: "[data-catalog-workspace]", start: "top 82%" } });
    ScrollTrigger.create({ trigger: "[data-catalog-hero]", start: "bottom 24%", onLeave: () => { if (!heroChimed.current) { heroChimed.current = true; playScrollChime(); } } });
  }, { scope: shell });

  function setWatched(unit: DashboardUnit, watched: boolean) {
    const next = new Set(watchedIds);
    if (watched) next.add(unit.id);
    else next.delete(unit.id);
    writeLocalProgress(next);
  }

  return <main ref={shell} className={styles.page}>
    <header className={styles.nav}><a href="/dashboard" className={styles.wordmark}>MCU <span>Watch Order</span></a><nav><a href="/dashboard">Dashboard</a><a href="/catalog" aria-current="page">Catalog</a></nav><div className={styles.navActions}><SoundToggle className={styles.soundButton} /><a className={styles.syncLink} href="/login">Sync</a></div></header>
    <section className={styles.catalogHero} data-catalog-hero><Image className={styles.characterBackdrop} src="/images/iron-man-avengers.jpg" alt="Iron Man from The Avengers" fill priority sizes="100vw" /><div><p>J.A.R.V.I.S. ARCHIVE / FULL INVENTORY</p><h1>Every unit.<br /><span>On record.</span></h1><div className={styles.marvelMark}><Image src="/images/avengers-promo.webp" alt="Marvel Studios The Avengers" width={320} height={180} priority /></div></div><div className={styles.heroCount}><span>Archive integrity</span><strong>{units.length}</strong><small>indexed watch units</small></div><i /></section>
    <section className={styles.content}>
      <div className={styles.heading} data-catalog-workspace><div><p>Release order controls</p><h2>Filter the archive.</h2></div><span>{visibleUnits.length} of {units.length} entries</span></div>
      <section className={styles.toolbar} aria-label="Catalog controls" data-catalog-workspace>
        <div className={styles.filterGroup}><label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">All progress</option><option value="unwatched">Unwatched</option><option value="watched">Watched</option></select></label><label>Type<select value={kindFilter} onChange={(event) => setKindFilter(event.target.value)}><option value="all">All media</option><option value="movie">Films</option><option value="episode">Episodes</option><option value="special">Specials</option></select></label><label>Title<select value={titleFilter} onChange={(event) => { setTitleFilter(event.target.value); setSeasonFilter("all"); }}><option value="all">All titles</option>{titles.map((title) => <option key={title.id} value={title.id}>{title.title}</option>)}</select></label><label>Season<select disabled={seasons.length === 0} value={seasonFilter} onChange={(event) => setSeasonFilter(event.target.value)}><option value="all">All seasons</option>{seasons.map(([id, number]) => <option key={id} value={id}>Season {number}</option>)}</select></label></div>
        <div className={styles.viewSwitch} aria-label="Catalog layout"><button type="button" aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")} title="Table view"><List size={17} /></button><button type="button" aria-pressed={viewMode === "cards"} onClick={() => setViewMode("cards")} title="Card grid view"><LayoutGrid size={17} /></button></div>
      </section>
      {viewMode === "table" ? <div className={styles.tableWrap} data-catalog-workspace><table><thead><tr><th>Order</th><th>Title</th><th>Type</th><th>Release</th><th>Status</th><th aria-label="Watch action" /></tr></thead><tbody>{visibleUnits.map((unit) => <CatalogRow key={unit.id} unit={unit} watched={watchedIds.has(unit.id)} onChange={setWatched} />)}</tbody></table></div> : <div className={styles.cardGrid} data-catalog-workspace>{visibleUnits.map((unit) => <article key={unit.id} className={watchedIds.has(unit.id) ? styles.watchedCard : styles.card}><p>#{unit.position}</p><h2>{unit.title}</h2><span>{unitLabel(unit)} · {formatDate(unit.releaseDate)}</span><WatchButton unit={unit} watched={watchedIds.has(unit.id)} onChange={setWatched} /></article>)}</div>}
    </section>
  </main>;
}

function CatalogRow({ unit, watched, onChange }: { unit: DashboardUnit; watched: boolean; onChange: (unit: DashboardUnit, watched: boolean) => void }) {
  return <tr className={watched ? styles.watchedRow : undefined}><td>{String(unit.position).padStart(3, "0")}</td><td><strong>{unit.title}</strong>{unit.unitKind === "episode" && <span>Season {unit.seasonNumber}, episode {unit.episodeNumber}</span>}</td><td>{unit.unitKind}</td><td>{formatDate(unit.releaseDate)}</td><td><span className={watched ? styles.statusWatched : styles.statusUnwatched}>{watched ? "Watched" : "Unwatched"}</span></td><td><WatchButton unit={unit} watched={watched} onChange={onChange} /></td></tr>;
}

function WatchButton({ unit, watched, onChange }: { unit: DashboardUnit; watched: boolean; onChange: (unit: DashboardUnit, watched: boolean) => void }) { return <button className={watched ? styles.undoButton : styles.watchButton} type="button" onClick={() => onChange(unit, !watched)}>{watched ? <><RotateCcw size={15} /> Undo</> : <><Check size={15} /> Watched</>}</button>; }
function unitLabel(unit: DashboardUnit) { return unit.unitKind === "episode" ? `S${unit.seasonNumber} E${unit.episodeNumber}` : unit.unitKind; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function subscribe(onChange: () => void) { window.addEventListener("storage", onChange); window.addEventListener(LOCAL_PROGRESS_EVENT, onChange); return () => { window.removeEventListener("storage", onChange); window.removeEventListener(LOCAL_PROGRESS_EVENT, onChange); }; }
function snapshot() { return window.localStorage.getItem(LOCAL_PROGRESS_KEY) ?? ""; }
function serverSnapshot() { return ""; }
