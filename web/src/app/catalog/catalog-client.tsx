"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useGSAP } from "@gsap/react";
import { Check, LayoutGrid, List, RotateCcw } from "lucide-react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SoundToggle } from "@/components/sound-toggle";
import type { DashboardUnit, TitleRelationship } from "@/lib/catalog/dashboard";
import { buildMovieTitleFilterGroups, type TitleFilterGroup } from "@/lib/catalog/title-filter-groups";
import { playScrollChime } from "@/lib/ui/scroll-chime";
import { LOCAL_PROGRESS_EVENT, LOCAL_PROGRESS_KEY, parseLocalProgress, writeLocalProgress } from "@/lib/progress/local-progress";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ViewMode = "table" | "cards";
type StatusFilter = "all" | "unwatched" | "watched";
type Account = { id: string; email: string };
type Props = { units: DashboardUnit[]; relationships: TitleRelationship[]; account: Account | null; initialRemoteWatchedUnitIds: string[] };

// shortcut: only the Team Thor shorts share a filter group, move grouping into catalog metadata when more collections need it.
const TEAM_THOR_TITLE_IDS = new Set(["special-team-thor", "special-team-thor-part-2", "special-team-darryl"]);

function titleFilterOption(unit: DashboardUnit, movieGroups: Map<string, TitleFilterGroup>) {
  return TEAM_THOR_TITLE_IDS.has(unit.titleId)
    ? { id: "collection-team-thor", title: "Team Thor" }
    : movieGroups.get(unit.titleId) ?? { id: unit.titleId, title: unit.title };
}

export function CatalogClient({ units, relationships, account, initialRemoteWatchedUnitIds }: Props) {
  const shell = useRef<HTMLElement>(null);
  const heroChimed = useRef(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [titleFilter, setTitleFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [remoteWatched, setRemoteWatched] = useState(() => new Set(initialRemoteWatchedUnitIds));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [saving, setSaving] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const validUnitIds = useMemo(() => new Set(units.map((unit) => unit.id)), [units]);
  const serializedProgress = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const localWatched = useMemo(() => new Set(parseLocalProgress(serializedProgress, validUnitIds).watchedUnitIds), [serializedProgress, validUnitIds]);
  const watchedIds = useMemo(() => account ? new Set([...localWatched, ...remoteWatched]) : localWatched, [account, localWatched, remoteWatched]);
  const movieGroups = useMemo(() => buildMovieTitleFilterGroups([...new Map(units.map((unit) => [unit.titleId, { id: unit.titleId, title: unit.title, kind: unit.titleKind }])).values()], relationships), [units, relationships]);
  const titles = [...new Map(units.filter((unit) => kindFilter === "all" || unit.unitKind === kindFilter).map((unit) => { const option = titleFilterOption(unit, movieGroups); return [option.id, option]; })).values()].sort((a, b) => a.title.localeCompare(b.title));
  const seasons = [...new Map(units.filter((unit) => titleFilterOption(unit, movieGroups).id === titleFilter && unit.seasonId).map((unit) => [unit.seasonId!, unit.seasonNumber!])).entries()].sort(([, a], [, b]) => a - b);
  const visibleUnits = units.filter((unit) => (statusFilter === "all" || (statusFilter === "watched") === watchedIds.has(unit.id)) && (kindFilter === "all" || unit.unitKind === kindFilter) && (titleFilter === "all" || titleFilterOption(unit, movieGroups).id === titleFilter) && (seasonFilter === "all" || unit.seasonId === seasonFilter));
  const allVisibleSelected = visibleUnits.length > 0 && visibleUnits.every((unit) => selectedIds.has(unit.id));

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from("[data-catalog-hero] > *", { opacity: 0, y: 26, duration: .8, stagger: .12, ease: "power3.out" });
    gsap.from("[data-catalog-workspace]", { opacity: 0, y: 48, duration: .85, ease: "power3.out", scrollTrigger: { trigger: "[data-catalog-workspace]", start: "top 82%" } });
    ScrollTrigger.create({ trigger: "[data-catalog-hero]", start: "bottom 24%", onLeave: () => { if (!heroChimed.current) { heroChimed.current = true; playScrollChime(); } } });
  }, { scope: shell });

  async function saveWatched(unitIds: string[], watched: boolean) {
    if (unitIds.length === 0) return false;
    setSaving(true);
    setProgressError(null);

    if (account) {
      const supabase = createBrowserClient();
      const { error } = watched
        ? await supabase.from("watch_progress").upsert(unitIds.map((watchUnitId) => ({ user_id: account.id, watch_unit_id: watchUnitId, status: "watched", watched_at: new Date().toISOString() })), { onConflict: "user_id,watch_unit_id" })
        : await supabase.from("watch_progress").delete().eq("user_id", account.id).in("watch_unit_id", unitIds);
      if (error) {
        setProgressError(error.message);
        setSaving(false);
        return false;
      }
      setRemoteWatched((current) => {
        const next = new Set(current);
        for (const unitId of unitIds) {
          if (watched) next.add(unitId);
          else next.delete(unitId);
        }
        return next;
      });
    }

    const next = new Set(watchedIds);
    for (const unitId of unitIds) {
      if (watched) next.add(unitId);
      else next.delete(unitId);
    }
    writeLocalProgress(next);
    setSaving(false);
    return true;
  }

  async function updateSelected(watched: boolean) {
    if (await saveWatched([...selectedIds], watched)) setSelectedIds(new Set());
  }

  function toggleVisibleSelection() {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const unit of visibleUnits) {
        if (allVisibleSelected) next.delete(unit.id);
        else next.add(unit.id);
      }
      return next;
    });
  }

  function toggleSelection(unitId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }

  return <main ref={shell} className={styles.page}>
    <header className={styles.nav}><a href="/dashboard" className={styles.wordmark}>MCU <span>Watch Order</span></a><nav><a href="/dashboard">Dashboard</a><a href="/catalog" aria-current="page">Catalog</a></nav><div className={styles.navActions}><SoundToggle className={styles.soundButton} /><a className={styles.syncLink} href={account ? "/dashboard" : "/login"}>{account ? account.email : "Sync"}</a></div></header>
    <section className={styles.catalogHero} data-catalog-hero><Image className={styles.characterBackdrop} src="/images/iron-man-avengers.jpg" alt="Iron Man from The Avengers" fill priority sizes="100vw" /><div><p>J.A.R.V.I.S. ARCHIVE / FULL INVENTORY</p><h1>Every unit.<br /><span>On record.</span></h1><div className={styles.marvelMark}><Image src="/images/avengers-promo.webp" alt="Marvel Studios The Avengers" width={320} height={180} priority /></div></div><div className={styles.heroCount}><span>Archive integrity</span><strong>{units.length}</strong><small>indexed watch units</small></div><i /></section>
    <section className={styles.content}>
      <div className={styles.heading} data-catalog-workspace><div><p>Release order controls</p><h2>Filter the archive.</h2></div><span>{visibleUnits.length} of {units.length} entries</span></div>
      <section className={styles.toolbar} aria-label="Catalog controls" data-catalog-workspace>
        <div className={styles.filterGroup}><label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">All progress</option><option value="unwatched">Unwatched</option><option value="watched">Watched</option></select></label><label>Type<select value={kindFilter} onChange={(event) => { setKindFilter(event.target.value); setTitleFilter("all"); setSeasonFilter("all"); }}><option value="all">All media</option><option value="movie">Films</option><option value="episode">Episodes</option><option value="special">Specials</option></select></label><label>Title<select value={titleFilter} onChange={(event) => { setTitleFilter(event.target.value); setSeasonFilter("all"); }}><option value="all">All titles</option>{titles.map((title) => <option key={title.id} value={title.id}>{title.title}</option>)}</select></label>{seasons.length > 0 && <label>Season<select value={seasonFilter} onChange={(event) => setSeasonFilter(event.target.value)}><option value="all">All seasons</option>{seasons.map(([id, number]) => <option key={id} value={id}>Season {number}</option>)}</select></label>}</div>
        <div className={styles.viewSwitch} aria-label="Catalog layout"><button type="button" aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")} title="Table view"><List size={17} /></button><button type="button" aria-pressed={viewMode === "cards"} onClick={() => setViewMode("cards")} title="Card grid view"><LayoutGrid size={17} /></button></div>
      </section>
      <section className={styles.bulkBar} aria-label="Bulk watch controls" data-catalog-workspace><div><strong>{selectedIds.size} selected</strong><span>Select entries, then update them together.</span></div><div><button className={styles.clearButton} type="button" onClick={toggleVisibleSelection} disabled={visibleUnits.length === 0}>{allVisibleSelected ? "Clear visible" : "Select visible"}</button>{selectedIds.size > 0 && <button className={styles.clearButton} type="button" onClick={() => setSelectedIds(new Set())}>Clear all</button>}<button className={styles.bulkUndoButton} type="button" onClick={() => void updateSelected(false)} disabled={selectedIds.size === 0 || saving}><RotateCcw size={16} /> {saving ? "Saving" : "Mark selected unwatched"}</button><button className={styles.bulkButton} type="button" onClick={() => void updateSelected(true)} disabled={selectedIds.size === 0 || saving}><Check size={16} /> {saving ? "Saving" : "Mark selected watched"}</button></div></section>
      {progressError && <p className={styles.progressError} role="alert">Unable to update progress: {progressError}</p>}
      {viewMode === "table" ? <div className={styles.tableWrap} data-catalog-workspace><table><thead><tr><th>Select</th><th>Order</th><th>Title</th><th>Type</th><th>Release</th><th>Status</th><th aria-label="Watch action" /></tr></thead><tbody>{visibleUnits.map((unit) => <CatalogRow key={unit.id} unit={unit} watched={watchedIds.has(unit.id)} selected={selectedIds.has(unit.id)} saving={saving} onSelect={toggleSelection} onChange={(item, watched) => void saveWatched([item.id], watched)} />)}</tbody></table></div> : <div className={styles.cardGrid} data-catalog-workspace>{visibleUnits.map((unit) => <article key={unit.id} className={watchedIds.has(unit.id) ? styles.watchedCard : styles.card}><label className={styles.cardSelector}><input type="checkbox" checked={selectedIds.has(unit.id)} onChange={() => toggleSelection(unit.id)} /><span>Select</span></label><p>#{unit.position}</p><h2>{unit.title}</h2><span>{unitLabel(unit)} · {formatDate(unit.releaseDate)}</span><WatchButton unit={unit} watched={watchedIds.has(unit.id)} disabled={saving} onChange={(item, watched) => void saveWatched([item.id], watched)} /></article>)}</div>}
    </section>
  </main>;
}

function CatalogRow({ unit, watched, selected, saving, onSelect, onChange }: { unit: DashboardUnit; watched: boolean; selected: boolean; saving: boolean; onSelect: (unitId: string) => void; onChange: (unit: DashboardUnit, watched: boolean) => void }) {
  const className = [watched ? styles.watchedRow : "", selected ? styles.selectedRow : ""].filter(Boolean).join(" ");
  return <tr className={className || undefined} tabIndex={0} aria-selected={selected} onClick={() => onSelect(unit.id)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(unit.id); } }}><td className={styles.selectCell}><input type="checkbox" checked={selected} onClick={(event) => event.stopPropagation()} onChange={() => onSelect(unit.id)} aria-label={`Select ${unit.title} ${unitLabel(unit)}`} /></td><td>{String(unit.position).padStart(3, "0")}</td><td><strong>{unit.title}</strong>{unit.unitKind === "episode" && <span>Season {unit.seasonNumber}, episode {unit.episodeNumber}</span>}</td><td>{unit.unitKind}</td><td>{formatDate(unit.releaseDate)}</td><td><span className={watched ? styles.statusWatched : styles.statusUnwatched}>{watched ? "Watched" : "Unwatched"}</span></td><td><WatchButton unit={unit} watched={watched} disabled={saving} onChange={onChange} /></td></tr>;
}

function WatchButton({ unit, watched, disabled, onChange }: { unit: DashboardUnit; watched: boolean; disabled: boolean; onChange: (unit: DashboardUnit, watched: boolean) => void }) { return <button className={watched ? styles.undoButton : styles.watchButton} type="button" disabled={disabled} onClick={(event) => { event.stopPropagation(); onChange(unit, !watched); }}>{watched ? <><RotateCcw size={15} /> Undo</> : <><Check size={15} /> Mark watched</>}</button>; }
function unitLabel(unit: DashboardUnit) { return unit.unitKind === "episode" ? `S${unit.seasonNumber} E${unit.episodeNumber}` : unit.unitKind; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function subscribe(onChange: () => void) { window.addEventListener("storage", onChange); window.addEventListener(LOCAL_PROGRESS_EVENT, onChange); return () => { window.removeEventListener("storage", onChange); window.removeEventListener(LOCAL_PROGRESS_EVENT, onChange); }; }
function snapshot() { return window.localStorage.getItem(LOCAL_PROGRESS_KEY) ?? ""; }
function serverSnapshot() { return ""; }
