"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useGSAP } from "@gsap/react";
import { Check, ChevronDown, Download, ExternalLink, Info, LayoutGrid, List, Play, RotateCcw, Search, SlidersHorizontal, Upload, X } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SoundToggle } from "@/components/sound-toggle";
import type { DashboardUnit, TitleRelationship } from "@/lib/catalog/dashboard";
import { catalogArtworkForTitle } from "@/lib/catalog/catalog-artwork";
import { groupAdjacentEpisodeRuns, type EpisodeRun } from "@/lib/catalog/episode-runs";
import { buildSeasonFilterOptions } from "@/lib/catalog/season-filter-options";
import { buildMovieTitleFilterGroups, type TitleFilterGroup } from "@/lib/catalog/title-filter-groups";
import { CATALOG_COLLECTIONS, catalogMetadata } from "@/lib/catalog/catalog-metadata";
import { playScrollChime } from "@/lib/ui/scroll-chime";
import { LOCAL_PROGRESS_EVENT, LOCAL_PROGRESS_KEY, parseLocalProgress, parseProgressBackup, serializeProgressBackup, writeLocalProgress } from "@/lib/progress/local-progress";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ViewMode = "table" | "cards";
type StatusFilter = "all" | "unwatched" | "watched";
type Account = { id: string; email: string };
type Props = { units: DashboardUnit[]; relationships: TitleRelationship[]; account: Account | null; initialRemoteWatchedUnitIds: string[] };
type FilterOption = { value: string; label: string; meta?: string };
type VisibleEpisodeRun = EpisodeRun<DashboardUnit> & { visibleUnits: DashboardUnit[] };
type QueryChanges = Record<string, string>;

const STATUS_OPTIONS: FilterOption[] = [
  { value: "all", label: "All progress" },
  { value: "unwatched", label: "Unwatched" },
  { value: "watched", label: "Watched" },
];
const TYPE_OPTIONS: FilterOption[] = [
  { value: "all", label: "All media" },
  { value: "movie", label: "Films" },
  { value: "episode", label: "Episodes" },
  { value: "special", label: "Specials" },
];
const UNIT_META = {
  movie: { code: "MOV", label: "Feature film" },
  special: { code: "SPC", label: "Special presentation" },
  episode: { code: "EPS", label: "Series episode" },
} as const;
// shortcut: only the Team Thor shorts share a filter group, move grouping into catalog metadata when more collections need it.
const TEAM_THOR_TITLE_IDS = new Set(["special-team-thor", "special-team-thor-part-2", "special-team-darryl"]);

function titleFilterOption(unit: DashboardUnit, movieGroups: Map<string, TitleFilterGroup>) {
  const option = TEAM_THOR_TITLE_IDS.has(unit.titleId)
    ? { id: "collection-team-thor", title: "Team Thor" }
    : movieGroups.get(unit.titleId) ?? { id: unit.titleId, title: unit.title };
  return { ...option, kind: unit.titleKind };
}

export function CatalogClient({ units, relationships, account, initialRemoteWatchedUnitIds }: Props) {
  const shell = useRef<HTMLElement>(null);
  const heroChimed = useRef(false);
  const importInput = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewMode: ViewMode = searchParams.get("view") === "cards" ? "cards" : "table";
  const statusParam = searchParams.get("status");
  const statusFilter: StatusFilter = isStatusFilter(statusParam) ? statusParam : "all";
  const kindFilter = isKindFilter(searchParams.get("type")) ? searchParams.get("type")! : "all";
  const collectionFilter = isCollectionFilter(searchParams.get("collection")) ? searchParams.get("collection")! : "all";
  const titleFilter = searchParams.get("title") ?? "all";
  const seasonFilter = searchParams.get("season") ?? "all";
  const [remoteWatched, setRemoteWatched] = useState(() => new Set(initialRemoteWatchedUnitIds));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [runExpansion, setRunExpansion] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [progressNotice, setProgressNotice] = useState<string | null>(null);
  const [activeTitleId, setActiveTitleId] = useState<string | null>(null);
  const validUnitIds = useMemo(() => new Set(units.map((unit) => unit.id)), [units]);
  const serializedProgress = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const localWatched = useMemo(() => new Set(parseLocalProgress(serializedProgress, validUnitIds).watchedUnitIds), [serializedProgress, validUnitIds]);
  const watchedIds = useMemo(() => account ? new Set([...localWatched, ...remoteWatched]) : localWatched, [account, localWatched, remoteWatched]);
  const movieGroups = useMemo(() => buildMovieTitleFilterGroups([...new Map(units.map((unit) => [unit.titleId, { id: unit.titleId, title: unit.title, kind: unit.titleKind }])).values()], relationships), [units, relationships]);
  const catalogRuns = useMemo(() => groupAdjacentEpisodeRuns(units), [units]);
  const titles = [...new Map(units.filter((unit) => (kindFilter === "all" || unit.unitKind === kindFilter) && (collectionFilter === "all" || catalogMetadata(unit.titleId).collectionId === collectionFilter)).map((unit) => { const option = titleFilterOption(unit, movieGroups); return [option.id, option]; })).values()].sort((a, b) => a.title.localeCompare(b.title));
  const visibleRuns = catalogRuns.map((run) => ({ ...run, visibleUnits: run.units.filter((unit) => (statusFilter === "all" || (statusFilter === "watched") === watchedIds.has(unit.id)) && (kindFilter === "all" || unit.unitKind === kindFilter) && (collectionFilter === "all" || catalogMetadata(unit.titleId).collectionId === collectionFilter) && (titleFilter === "all" || titleFilterOption(unit, movieGroups).id === titleFilter) && (seasonFilter === "all" || unit.seasonId === seasonFilter)) })).filter((run) => run.visibleUnits.length > 0);
  const visibleUnits = visibleRuns.flatMap((run) => run.visibleUnits);
  const nextUnwatchedUnit = units.find((unit) => !watchedIds.has(unit.id));
  const resumeRun = nextUnwatchedUnit ? catalogRuns.find((run) => run.units.some((unit) => unit.id === nextUnwatchedUnit.id)) : undefined;
  const resumeRunId = resumeRun && isEpisodeRun(resumeRun) ? resumeRun.id : null;
  const allVisibleSelected = visibleUnits.length > 0 && visibleUnits.every((unit) => selectedIds.has(unit.id));
  const activeFilterCount = [statusFilter !== "all", kindFilter !== "all", collectionFilter !== "all", titleFilter !== "all", seasonFilter !== "all"].filter(Boolean).length;
  const titleOptions = [{ value: "all", label: "All titles" }, ...titles.map((title) => ({ value: title.id, label: title.title, meta: title.kind }))];
  const seasonOptions = [{ value: "all", label: "All seasons" }, ...buildSeasonFilterOptions(units.filter((unit) => titleFilterOption(unit, movieGroups).id === titleFilter))];
  const resumeTitleUnit = units.find((unit) => !watchedIds.has(unit.id) && units.some((candidate) => candidate.titleId === unit.titleId && watchedIds.has(candidate.id)));
  const activeTitleUnits = activeTitleId ? units.filter((unit) => unit.titleId === activeTitleId) : [];
  const activeRelations = activeTitleId ? relationships.filter((relation) => relation.fromTitleId === activeTitleId || relation.toTitleId === activeTitleId) : [];

  useEffect(() => {
    if (!activeTitleId) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveTitleId(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [activeTitleId]);

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
      for (let start = 0; start < unitIds.length; start += 250) {
        const batch = unitIds.slice(start, start + 250);
        const { error } = watched
          ? await supabase.from("watch_progress").upsert(batch.map((watchUnitId) => ({ user_id: account.id, watch_unit_id: watchUnitId, status: "watched", watched_at: new Date().toISOString() })), { onConflict: "user_id,watch_unit_id" })
          : await supabase.from("watch_progress").delete().eq("user_id", account.id).in("watch_unit_id", batch);
        if (error) {
          setProgressError(error.message);
          setSaving(false);
          return false;
        }
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

  function toggleRunSelection(unitIds: string[]) {
    setSelectedIds((current) => {
      const next = new Set(current);
      const allSelected = unitIds.every((unitId) => next.has(unitId));
      for (const unitId of unitIds) {
        if (allSelected) next.delete(unitId);
        else next.add(unitId);
      }
      return next;
    });
  }

  function toggleRun(runId: string, expandedByDefault: boolean) {
    setRunExpansion((current) => ({ ...current, [runId]: !(current[runId] ?? expandedByDefault) }));
  }

  function replaceQuery(changes: QueryChanges) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === "all" || (key === "view" && value === "table")) params.delete(key);
      else params.set(key, value);
    }
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  }

  function changeStatus(value: StatusFilter) { replaceQuery({ status: value }); }
  function changeKind(value: string) { replaceQuery({ type: value, title: "all", season: "all" }); }
  function changeCollection(value: string) { replaceQuery({ collection: value, title: "all", season: "all" }); }
  function changeTitle(value: string) { replaceQuery({ title: value, season: "all" }); }
  function changeSeason(value: string) { replaceQuery({ season: value }); }
  function changeView(value: ViewMode) { replaceQuery({ view: value }); }

  function clearFilters() {
    replaceQuery({ status: "all", type: "all", collection: "all", title: "all", season: "all" });
  }

  function focusUnit(unit: DashboardUnit | undefined) {
    if (!unit) return;
    clearFilters();
    const run = catalogRuns.find((candidate) => candidate.units.some((entry) => entry.id === unit.id));
    if (run && isEpisodeRun(run)) setRunExpansion((current) => ({ ...current, [run.id]: true }));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const target = document.getElementById(`catalog-unit-${unit.id}`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
    }));
  }

  function exportProgress() {
    const url = URL.createObjectURL(new Blob([serializeProgressBackup(watchedIds)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mcu-watch-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setProgressNotice(`Exported ${watchedIds.size} watched entries.`);
  }

  async function importProgress(file: File | undefined) {
    if (!file) return;
    setProgressNotice(null);
    setProgressError(null);
    try {
      if (file.size > 1_000_000) throw new Error("Backup must be smaller than 1 MB.");
      const importedIds = parseProgressBackup(await file.text(), validUnitIds);
      if (await saveWatched(importedIds, true)) setProgressNotice(`Restored ${importedIds.length} valid entries without removing existing progress.`);
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : "Unable to import this backup.");
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  }

  function showTitleRemaining(titleId: string) {
    const unit = units.find((entry) => entry.titleId === titleId);
    if (!unit) return;
    const option = titleFilterOption(unit, movieGroups);
    replaceQuery({ status: "unwatched", title: option.id, season: "all" });
    setActiveTitleId(null);
  }

  return <main ref={shell} className={styles.page}>
    <header className={styles.nav}><a href="/dashboard" className={styles.wordmark}>MCU <span>Watch Order</span></a><nav><a href="/dashboard">Dashboard</a><a href="/catalog" aria-current="page">Catalog</a></nav><div className={styles.navActions}><SoundToggle className={styles.soundButton} /><a className={styles.syncLink} href={account ? "/dashboard" : "/login"}>{account ? account.email : "Sync"}</a></div></header>
    <section className={styles.catalogHero} data-catalog-hero><Image className={styles.characterBackdrop} src="/images/iron-man-avengers.jpg" alt="Iron Man from The Avengers" fill priority sizes="100vw" /><div><p>J.A.R.V.I.S. ARCHIVE / FULL INVENTORY</p><h1>Every unit.<br /><span>On record.</span></h1><div className={styles.marvelMark}><Image src="/images/avengers-promo.webp" alt="Marvel Studios The Avengers" width={320} height={180} priority /></div></div><div className={styles.heroCount}><span>Archive integrity</span><strong>{units.length}</strong><small>indexed watch units</small></div><i /></section>
    <section className={styles.content}>
      <div className={styles.heading} data-catalog-workspace><div><p>Release order controls</p><h2>Filter the archive.</h2></div><span>{visibleUnits.length} of {units.length} entries</span></div>
      <div className={styles.stickyControls}>
        <section className={styles.toolbar} aria-label="Catalog controls">
          <header className={styles.filterHeader}><div><SlidersHorizontal size={18} /><span>Catalog query</span><strong>Refine release order</strong></div><p><b>{activeFilterCount}</b> {activeFilterCount === 1 ? "filter" : "filters"} active</p></header>
          <div className={styles.filterGroup}>
            <FilterMenu label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={(value) => changeStatus(value as StatusFilter)} />
            <FilterMenu label="Type" value={kindFilter} options={TYPE_OPTIONS} onChange={changeKind} />
            <FilterMenu label="Universe" value={collectionFilter} options={[{ value: "all", label: "All universes" }, ...CATALOG_COLLECTIONS.map((item) => ({ value: item.id, label: item.label }))]} onChange={changeCollection} />
            <FilterMenu label="Title" value={titleFilter} options={titleOptions} searchable onChange={changeTitle} />
            {seasonOptions.length > 1 && <FilterMenu label="Season" value={seasonFilter} options={seasonOptions} onChange={changeSeason} />}
          </div>
          <div className={styles.toolbarActions}><button className={styles.resetFilters} type="button" onClick={clearFilters} disabled={activeFilterCount === 0}><RotateCcw size={15} /> Clear filters</button><div className={styles.viewSwitch} aria-label="Catalog layout"><button type="button" aria-pressed={viewMode === "table"} onClick={() => changeView("table")} title="Table view"><List size={17} /></button><button type="button" aria-pressed={viewMode === "cards"} onClick={() => changeView("cards")} title="Card grid view"><LayoutGrid size={17} /></button></div></div>
        </section>
        <section className={styles.bulkBar} aria-label="Catalog shortcuts and bulk watch controls"><div><strong>{selectedIds.size} selected</strong><span>Select entries, then update them together.</span></div><div><button className={styles.resumeButton} type="button" onClick={() => focusUnit(nextUnwatchedUnit)} disabled={!nextUnwatchedUnit}><Play size={15} /> {nextUnwatchedUnit ? `Continue #${String(nextUnwatchedUnit.position).padStart(3, "0")}` : "Archive complete"}</button>{resumeTitleUnit && resumeTitleUnit.id !== nextUnwatchedUnit?.id && <button className={styles.resumeButton} type="button" onClick={() => focusUnit(resumeTitleUnit)}><Play size={15} /> Resume {resumeTitleUnit.title}</button>}<button className={styles.clearButton} type="button" aria-pressed={statusFilter === "unwatched"} onClick={() => changeStatus(statusFilter === "unwatched" ? "all" : "unwatched")}>Remaining only</button><button className={styles.clearButton} type="button" onClick={toggleVisibleSelection} disabled={visibleUnits.length === 0}>{allVisibleSelected ? "Clear visible" : "Select visible"}</button>{selectedIds.size > 0 && <button className={styles.clearButton} type="button" onClick={() => setSelectedIds(new Set())}>Clear all</button>}<button className={styles.bulkUndoButton} type="button" onClick={() => void updateSelected(false)} disabled={selectedIds.size === 0 || saving}><RotateCcw size={16} /> {saving ? "Saving" : "Mark selected unwatched"}</button><button className={styles.bulkButton} type="button" onClick={() => void updateSelected(true)} disabled={selectedIds.size === 0 || saving}><Check size={16} /> {saving ? "Saving" : "Mark selected watched"}</button><button className={styles.dataButton} type="button" onClick={exportProgress}><Download size={15} /> Export</button><button className={styles.dataButton} type="button" onClick={() => importInput.current?.click()}><Upload size={15} /> Restore</button><input ref={importInput} className={styles.hiddenInput} type="file" accept="application/json,.json" onChange={(event) => void importProgress(event.target.files?.[0])} /></div></section>
      </div>
      {progressError && <p className={styles.progressError} role="alert">Unable to update progress: {progressError}</p>}
      {progressNotice && <p className={styles.progressNotice} role="status">{progressNotice}</p>}
      {viewMode === "table" ? <div className={styles.tableWrap} data-catalog-workspace>
        <div className={styles.tableConsoleHeader} aria-hidden="true"><span>STARK_ARCHIVE // RELEASE_ORDER_MATRIX</span><div><b><i /> LIVE INDEX</b><span>{String(visibleUnits.length).padStart(3, "0")} RECORDS</span><span>SEQ / ASC</span></div></div>
        <table><thead><tr><th aria-label="Select units">Select</th><th>Archive ref</th><th>Title / episode</th><th>Class</th><th>Released</th><th>Progress</th><th>Command</th></tr></thead><tbody>{visibleRuns.map((run) => {
          if (!isEpisodeRun(run)) {
            const unit = run.visibleUnits[0];
            return <CatalogRow key={unit.id} unit={unit} collection={titleFilterOption(unit, movieGroups).title} watched={watchedIds.has(unit.id)} selected={selectedIds.has(unit.id)} saving={saving} onSelect={toggleSelection} onInspect={setActiveTitleId} onChange={(item, watched) => void saveWatched([item.id], watched)} />;
          }
          const expandedByDefault = run.id === resumeRunId;
          const expanded = runExpansion[run.id] ?? expandedByDefault;
          return <Fragment key={run.id}><tr id={`catalog-run-${run.id}`} className={styles.episodeRunRow}><td colSpan={7}><EpisodeRunSummary run={run} watchedIds={watchedIds} selectedIds={selectedIds} expanded={expanded} onSelect={toggleRunSelection} onInspect={setActiveTitleId} onToggle={() => toggleRun(run.id, expandedByDefault)} /></td></tr>{expanded && run.visibleUnits.map((unit) => <CatalogRow key={unit.id} unit={unit} collection={titleFilterOption(unit, movieGroups).title} watched={watchedIds.has(unit.id)} selected={selectedIds.has(unit.id)} saving={saving} onSelect={toggleSelection} onInspect={setActiveTitleId} onChange={(item, watched) => void saveWatched([item.id], watched)} />)}</Fragment>;
        })}</tbody></table>
      </div> : <div className={styles.cardGrid} data-catalog-workspace>{visibleRuns.map((run) => {
        if (!isEpisodeRun(run)) {
          const unit = run.visibleUnits[0];
          return <CatalogCard key={unit.id} unit={unit} collection={titleFilterOption(unit, movieGroups).title} watched={watchedIds.has(unit.id)} selected={selectedIds.has(unit.id)} saving={saving} onSelect={toggleSelection} onInspect={setActiveTitleId} onChange={(item, watched) => void saveWatched([item.id], watched)} />;
        }
        const expandedByDefault = run.id === resumeRunId;
        const expanded = runExpansion[run.id] ?? expandedByDefault;
        return <section key={run.id} id={`catalog-run-${run.id}`} className={styles.episodeRunCardGroup}><EpisodeRunSummary run={run} watchedIds={watchedIds} selectedIds={selectedIds} expanded={expanded} onSelect={toggleRunSelection} onInspect={setActiveTitleId} onToggle={() => toggleRun(run.id, expandedByDefault)} />{expanded && <div className={styles.episodeRunCards}>{run.visibleUnits.map((unit) => <CatalogCard key={unit.id} unit={unit} collection={titleFilterOption(unit, movieGroups).title} watched={watchedIds.has(unit.id)} selected={selectedIds.has(unit.id)} saving={saving} onSelect={toggleSelection} onInspect={setActiveTitleId} onChange={(item, watched) => void saveWatched([item.id], watched)} />)}</div>}</section>;
      })}</div>}
    </section>
    {activeTitleId && activeTitleUnits[0] && <TitleDrawer units={activeTitleUnits} relationships={activeRelations} watchedIds={watchedIds} saving={saving} onClose={() => setActiveTitleId(null)} onShowRemaining={showTitleRemaining} onChange={(ids, watched) => void saveWatched(ids, watched)} />}
  </main>;
}

function isEpisodeRun(run: EpisodeRun<DashboardUnit>) {
  return run.units.length > 1 && run.units[0].unitKind === "episode";
}

function EpisodeRunSummary({ run, watchedIds, selectedIds, expanded, onSelect, onInspect, onToggle }: { run: VisibleEpisodeRun; watchedIds: Set<string>; selectedIds: Set<string>; expanded: boolean; onSelect: (unitIds: string[]) => void; onInspect: (titleId: string) => void; onToggle: () => void }) {
  const first = run.units[0];
  const last = run.units.at(-1)!;
  const selectedCount = run.visibleUnits.filter((unit) => selectedIds.has(unit.id)).length;
  const watchedCount = run.units.filter((unit) => watchedIds.has(unit.id)).length;
  const nextUnit = run.units.find((unit) => !watchedIds.has(unit.id));
  const firstEpisode = String(first.episodeNumber).padStart(2, "0");
  const lastEpisode = String(last.episodeNumber).padStart(2, "0");
  const season = String(first.seasonNumber).padStart(2, "0");
  const visibleUnitIds = run.visibleUnits.map((unit) => unit.id);

  return <div className={styles.episodeRunSummary}>
    <label className={styles.episodeRunSelector}><input type="checkbox" checked={selectedCount === run.visibleUnits.length} onChange={() => onSelect(visibleUnitIds)} aria-label={`Select ${run.visibleUnits.length} visible ${first.title} episodes`} /><span>{selectedCount > 0 ? `${selectedCount} selected` : "Select block"}</span></label>
    <button className={styles.inspectRunButton} type="button" onClick={() => onInspect(first.titleId)} aria-label={`Inspect ${first.title}`}><Info size={17} /></button>
    <button className={styles.episodeRunToggle} type="button" aria-expanded={expanded} onClick={onToggle}>
      <span className={styles.episodeRunRef}><small>Release block</small><strong>#{String(first.position).padStart(3, "0")}-{String(last.position).padStart(3, "0")}</strong></span>
      <span className={styles.episodeRunTitle}><small>Series sequence</small><strong>{first.title}</strong><span>S{season} / E{firstEpisode}-E{lastEpisode} / {run.units.length} episodes</span></span>
      <span className={styles.episodeRunProgress}><strong>{watchedCount}/{run.units.length}</strong><small>{nextUnit ? `Next E${String(nextUnit.episodeNumber).padStart(2, "0")}` : "Viewed"}</small></span>
      {run.visibleUnits.length < run.units.length && <span className={styles.episodeRunMatches}>{run.visibleUnits.length} matching</span>}
      <span className={styles.episodeRunCommand}>{expanded ? "Collapse" : "Expand"}<ChevronDown className={expanded ? styles.episodeRunChevronOpen : undefined} size={18} /></span>
    </button>
  </div>;
}

function CatalogCard({ unit, collection, watched, selected, saving, onSelect, onInspect, onChange }: { unit: DashboardUnit; collection: string; watched: boolean; selected: boolean; saving: boolean; onSelect: (unitId: string) => void; onInspect: (titleId: string) => void; onChange: (unit: DashboardUnit, watched: boolean) => void }) {
  const meta = UNIT_META[unit.unitKind];
  const archiveRef = String(unit.position).padStart(3, "0");
  const isEpisode = unit.unitKind === "episode";
  const season = String(unit.seasonNumber).padStart(2, "0");
  const episode = String(unit.episodeNumber).padStart(2, "0");
  const artwork = catalogArtworkForTitle(unit.title);
  const archive = catalogMetadata(unit.titleId);
  const className = [watched ? styles.watchedCard : styles.card, selected ? styles.selectedCard : ""].filter(Boolean).join(" ");

  return <article id={`catalog-unit-${unit.id}`} className={className} tabIndex={0} data-selected={selected} data-artwork={artwork ?? undefined} onClick={() => onSelect(unit.id)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(unit.id); } }}>
    {artwork && <span className={styles.cardArtwork} aria-hidden="true" />}
    <div className={styles.cardTerminal} aria-hidden="true"><span>{`STARK_DB // ${meta.code}_NODE_${archiveRef}`}</span><b><i /> {watched ? "LOGGED" : "LINK ACTIVE"}</b></div>
    <header className={styles.cardHeader}><div className={styles.cardIndex}><span>Archive ref</span><strong>{archiveRef}</strong></div><label className={styles.cardSelector} onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selected} onChange={() => onSelect(unit.id)} aria-label={`Select ${unit.title} ${unitLabel(unit)}`} /><span>{selected ? "Selected" : "Select"}</span></label></header>
    <div className={styles.cardRecord}><p>{isEpisode ? "Series title" : meta.label}</p><button className={styles.inspectTitle} type="button" onClick={(event) => { event.stopPropagation(); onInspect(unit.titleId); }}><h2>{unit.title}</h2><Info size={15} /></button><span className={styles.collectionBadge}>{archive.collectionLabel}</span>{isEpisode ? <div className={styles.episodeRoute} aria-label={`Season ${unit.seasonNumber}, episode ${unit.episodeNumber}`}><span><small>Season</small><strong>S{season}</strong></span><i aria-hidden="true">{"//"}</i><span><small>Episode</small><strong>E{episode}</strong></span></div> : <div className={styles.collectionRoute}><small>Title group</small><strong>{collection}</strong></div>}</div>
    <dl className={styles.cardTelemetry}><div><dt>Released</dt><dd><time dateTime={unit.releaseDate}>{formatFullDate(unit.releaseDate)}</time></dd></div><div><dt>Watch order</dt><dd>#{archiveRef}</dd></div></dl>
    <footer className={styles.cardCommand}><span className={watched ? styles.statusWatched : styles.statusUnwatched}><i /> {watched ? "Log complete" : "Awaiting input"}</span><WatchButton unit={unit} watched={watched} disabled={saving} onChange={onChange} /></footer>
  </article>;
}

function CatalogRow({ unit, collection, watched, selected, saving, onSelect, onInspect, onChange }: { unit: DashboardUnit; collection: string; watched: boolean; selected: boolean; saving: boolean; onSelect: (unitId: string) => void; onInspect: (titleId: string) => void; onChange: (unit: DashboardUnit, watched: boolean) => void }) {
  const artwork = catalogArtworkForTitle(unit.title);
  const className = [watched ? styles.watchedRow : "", selected ? styles.selectedRow : "", artwork ? styles.artworkRow : ""].filter(Boolean).join(" ");
  const meta = UNIT_META[unit.unitKind];
  const isEpisode = unit.unitKind === "episode";
  const season = String(unit.seasonNumber).padStart(2, "0");
  const episode = String(unit.episodeNumber).padStart(2, "0");
  const archive = catalogMetadata(unit.titleId);
  return <tr id={`catalog-unit-${unit.id}`} className={className || undefined} tabIndex={0} aria-selected={selected} data-artwork={artwork ?? undefined} onClick={() => onSelect(unit.id)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(unit.id); } }}>
    <td className={styles.selectCell}><input type="checkbox" checked={selected} onClick={(event) => event.stopPropagation()} onChange={() => onSelect(unit.id)} aria-label={`Select ${unit.title} ${unitLabel(unit)}`} /></td>
    <td className={styles.recordCell}><strong>{String(unit.position).padStart(3, "0")}</strong><span>ARC/{meta.code}-{String(unit.position).padStart(3, "0")}</span></td>
    <td className={styles.titleCell}><button className={styles.inspectTitle} type="button" onClick={(event) => { event.stopPropagation(); onInspect(unit.titleId); }}><strong>{unit.title}</strong><Info size={14} /></button>{isEpisode ? <div className={styles.episodeInline} aria-label={`Season ${unit.seasonNumber}, episode ${unit.episodeNumber}`}><span><small>Season</small><b>S{season}</b></span><i aria-hidden="true" /><span><small>Episode</small><b>E{episode}</b></span></div> : <div className={styles.rowMeta}><span>{unit.titleKind} title</span>{collection !== unit.title && <span>{collection} collection</span>}</div>}<span className={styles.collectionBadge}>{archive.collectionLabel}</span></td>
    <td className={styles.classCell}><strong>{meta.label}</strong><span>{unit.titleKind} entity</span></td>
    <td className={styles.releaseCell}><time dateTime={unit.releaseDate}>{formatFullDate(unit.releaseDate)}</time><span>UTC / public release</span></td>
    <td className={styles.progressCell}><span className={watched ? styles.statusWatched : styles.statusUnwatched}><i /> {watched ? "Viewed" : "Pending"}</span><small>{watched ? "Log complete" : "Awaiting input"}</small></td>
    <td className={styles.actionCell}><WatchButton unit={unit} watched={watched} disabled={saving} onChange={onChange} /></td>
  </tr>;
}

function TitleDrawer({ units, relationships, watchedIds, saving, onClose, onShowRemaining, onChange }: { units: DashboardUnit[]; relationships: TitleRelationship[]; watchedIds: Set<string>; saving: boolean; onClose: () => void; onShowRemaining: (titleId: string) => void; onChange: (unitIds: string[], watched: boolean) => void }) {
  const first = units[0];
  const metadata = catalogMetadata(first.titleId);
  const watchedCount = units.filter((unit) => watchedIds.has(unit.id)).length;
  const allWatched = watchedCount === units.length;
  const seasons = [...new Map(units.filter((unit) => unit.seasonId).map((unit) => [unit.seasonId!, { number: unit.seasonNumber!, units: units.filter((candidate) => candidate.seasonId === unit.seasonId) }])).values()].sort((left, right) => left.number - right.number);
  const connectedTitles = [...new Set(relationships.map((relation) => relation.fromTitleId === first.titleId ? relation.toTitle : relation.fromTitle))];

  return <div className={styles.drawerBackdrop} onMouseDown={onClose}>
    <aside className={styles.titleDrawer} role="dialog" aria-modal="true" aria-labelledby="title-drawer-heading" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><p>Archive title record</p><h2 id="title-drawer-heading">{first.title}</h2><span className={styles.collectionBadge}>{metadata.collectionLabel}</span></div><button type="button" onClick={onClose} aria-label="Close title details" autoFocus><X size={19} /></button></header>
      <section className={styles.drawerProgress}><div><span>Progress</span><strong>{watchedCount}<small> / {units.length}</small></strong></div><div className={styles.drawerProgressBar}><i style={{ width: `${Math.round(watchedCount / units.length * 100)}%` }} /></div><p>{allWatched ? "Title complete" : `${units.length - watchedCount} watch units remain`}</p></section>
      <dl className={styles.drawerFacts}><div><dt>First release</dt><dd>{formatFullDate(units[0].releaseDate)}</dd></div><div><dt>Latest release</dt><dd>{formatFullDate(units.at(-1)!.releaseDate)}</dd></div><div><dt>Format</dt><dd>{first.titleKind}</dd></div><div><dt>Archive units</dt><dd>{units.length}</dd></div></dl>
      <div className={styles.drawerActions}><button type="button" onClick={() => onShowRemaining(first.titleId)} disabled={allWatched}><Play size={15} /> Show remaining</button><button type="button" onClick={() => onChange(units.map((unit) => unit.id), !allWatched)} disabled={saving}>{allWatched ? <RotateCcw size={15} /> : <Check size={15} />} {allWatched ? "Mark title unwatched" : "Mark title watched"}</button></div>
      {seasons.length > 0 && <section className={styles.seasonActions}><h3>Season controls</h3>{seasons.map((season) => { const seasonWatched = season.units.filter((unit) => watchedIds.has(unit.id)).length; const complete = seasonWatched === season.units.length; return <div key={season.number}><span><strong>Season {season.number}</strong><small>{seasonWatched} / {season.units.length} watched</small></span><button type="button" disabled={saving} onClick={() => onChange(season.units.map((unit) => unit.id), !complete)}>{complete ? "Undo season" : "Complete season"}</button></div>; })}</section>}
      {connectedTitles.length > 0 && <section className={styles.drawerConnections}><h3>Connected records</h3><p>{connectedTitles.join(" · ")}</p></section>}
      <footer><span>Source reviewed {metadata.reviewedAt}</span><a href={metadata.source.url} target="_blank" rel="noreferrer">{metadata.source.label}<ExternalLink size={13} /></a></footer>
    </aside>
  </div>;
}

function WatchButton({ unit, watched, disabled, onChange }: { unit: DashboardUnit; watched: boolean; disabled: boolean; onChange: (unit: DashboardUnit, watched: boolean) => void }) { return <button className={watched ? styles.undoButton : styles.watchButton} type="button" disabled={disabled} onClick={(event) => { event.stopPropagation(); onChange(unit, !watched); }}>{watched ? <><RotateCcw size={15} /> Undo</> : <><Check size={15} /> Mark watched</>}</button>; }

function FilterMenu({ label, value, options, searchable = false, onChange }: { label: string; value: string; options: FilterOption[]; searchable?: boolean; onChange: (value: string) => void }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value) ?? options[0];
  const visibleOptions = query ? options.filter((option) => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())) : options;

  useEffect(() => {
    function closeMenu(event: PointerEvent) {
      if (menu.current && event.target instanceof Node && !menu.current.contains(event.target)) menu.current.open = false;
    }
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, []);

  return <details ref={menu} className={`${styles.filterMenu} ${value !== "all" ? styles.filterMenuActive : ""}`} onToggle={(event) => { if (!event.currentTarget.open) setQuery(""); }}>
    <summary><span>{label}</span><strong>{selected.label}</strong><ChevronDown size={17} /></summary>
    <div className={styles.filterPopover}>
      <div className={styles.consoleHeader} aria-hidden="true"><span>STARK_ARCHIVE // {label.toUpperCase()}_INDEX</span><b><i /> LINK ACTIVE</b></div>
      {searchable && <label className={styles.filterSearch}><Search size={15} /><span className={styles.searchPrompt} aria-hidden="true">QRY</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ENTER TITLE QUERY..." aria-label="Search title options" /></label>}
      <div className={styles.filterOptions} role="listbox" aria-label={`${label} options`}>{visibleOptions.length > 0 ? visibleOptions.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} onClick={() => { onChange(option.value); menu.current?.removeAttribute("open"); }}><span className={styles.filterOptionText}><code aria-hidden="true">IDX-{String(options.indexOf(option)).padStart(3, "0")}</code><span>{option.label}</span>{option.meta && <small>{option.meta}</small>}</span>{option.value === value ? <Check size={15} /> : <i />}</button>) : <p>No matching titles</p>}</div>
      <div className={styles.consoleFooter} aria-hidden="true"><span>{String(visibleOptions.length).padStart(3, "0")} RECORDS</span><span>NODE 04-A</span><span>MEM 7A:4F</span><b>QUERY READY</b></div>
    </div>
  </details>;
}

function unitLabel(unit: DashboardUnit) { return unit.unitKind === "episode" ? `S${unit.seasonNumber} E${unit.episodeNumber}` : unit.unitKind; }
function isStatusFilter(value: string | null): value is StatusFilter { return value === "all" || value === "unwatched" || value === "watched"; }
function isKindFilter(value: string | null) { return value === "all" || value === "movie" || value === "episode" || value === "special"; }
function isCollectionFilter(value: string | null) { return value === "all" || CATALOG_COLLECTIONS.some((collection) => collection.id === value); }
function formatFullDate(value: string) { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function subscribe(onChange: () => void) { window.addEventListener("storage", onChange); window.addEventListener(LOCAL_PROGRESS_EVENT, onChange); return () => { window.removeEventListener("storage", onChange); window.removeEventListener(LOCAL_PROGRESS_EVENT, onChange); }; }
function snapshot() { return window.localStorage.getItem(LOCAL_PROGRESS_KEY) ?? ""; }
function serverSnapshot() { return ""; }
