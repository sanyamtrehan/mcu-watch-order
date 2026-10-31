"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useGSAP } from "@gsap/react";
import { Check, ChevronDown, LayoutGrid, List, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
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
type FilterOption = { value: string; label: string };

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
  const activeFilterCount = [statusFilter !== "all", kindFilter !== "all", titleFilter !== "all", seasonFilter !== "all"].filter(Boolean).length;
  const titleOptions = [{ value: "all", label: "All titles" }, ...titles.map((title) => ({ value: title.id, label: title.title }))];
  const seasonOptions = [{ value: "all", label: "All seasons" }, ...seasons.map(([id, number]) => ({ value: id, label: `Season ${number}` }))];

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

  function clearFilters() {
    setStatusFilter("all");
    setKindFilter("all");
    setTitleFilter("all");
    setSeasonFilter("all");
  }

  return <main ref={shell} className={styles.page}>
    <header className={styles.nav}><a href="/dashboard" className={styles.wordmark}>MCU <span>Watch Order</span></a><nav><a href="/dashboard">Dashboard</a><a href="/catalog" aria-current="page">Catalog</a></nav><div className={styles.navActions}><SoundToggle className={styles.soundButton} /><a className={styles.syncLink} href={account ? "/dashboard" : "/login"}>{account ? account.email : "Sync"}</a></div></header>
    <section className={styles.catalogHero} data-catalog-hero><Image className={styles.characterBackdrop} src="/images/iron-man-avengers.jpg" alt="Iron Man from The Avengers" fill priority sizes="100vw" /><div><p>J.A.R.V.I.S. ARCHIVE / FULL INVENTORY</p><h1>Every unit.<br /><span>On record.</span></h1><div className={styles.marvelMark}><Image src="/images/avengers-promo.webp" alt="Marvel Studios The Avengers" width={320} height={180} priority /></div></div><div className={styles.heroCount}><span>Archive integrity</span><strong>{units.length}</strong><small>indexed watch units</small></div><i /></section>
    <section className={styles.content}>
      <div className={styles.heading} data-catalog-workspace><div><p>Release order controls</p><h2>Filter the archive.</h2></div><span>{visibleUnits.length} of {units.length} entries</span></div>
      <section className={styles.toolbar} aria-label="Catalog controls" data-catalog-workspace>
        <header className={styles.filterHeader}><div><SlidersHorizontal size={18} /><span>Catalog query</span><strong>Refine release order</strong></div><p><b>{activeFilterCount}</b> {activeFilterCount === 1 ? "filter" : "filters"} active</p></header>
        <div className={styles.filterGroup}>
          <FilterMenu label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={(value) => setStatusFilter(value as StatusFilter)} />
          <FilterMenu label="Type" value={kindFilter} options={TYPE_OPTIONS} onChange={(value) => { setKindFilter(value); setTitleFilter("all"); setSeasonFilter("all"); }} />
          <FilterMenu label="Title" value={titleFilter} options={titleOptions} searchable onChange={(value) => { setTitleFilter(value); setSeasonFilter("all"); }} />
          {seasons.length > 0 && <FilterMenu label="Season" value={seasonFilter} options={seasonOptions} onChange={setSeasonFilter} />}
        </div>
        <div className={styles.toolbarActions}><button className={styles.resetFilters} type="button" onClick={clearFilters} disabled={activeFilterCount === 0}><RotateCcw size={15} /> Clear filters</button><div className={styles.viewSwitch} aria-label="Catalog layout"><button type="button" aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")} title="Table view"><List size={17} /></button><button type="button" aria-pressed={viewMode === "cards"} onClick={() => setViewMode("cards")} title="Card grid view"><LayoutGrid size={17} /></button></div></div>
      </section>
      <section className={styles.bulkBar} aria-label="Bulk watch controls" data-catalog-workspace><div><strong>{selectedIds.size} selected</strong><span>Select entries, then update them together.</span></div><div><button className={styles.clearButton} type="button" onClick={toggleVisibleSelection} disabled={visibleUnits.length === 0}>{allVisibleSelected ? "Clear visible" : "Select visible"}</button>{selectedIds.size > 0 && <button className={styles.clearButton} type="button" onClick={() => setSelectedIds(new Set())}>Clear all</button>}<button className={styles.bulkUndoButton} type="button" onClick={() => void updateSelected(false)} disabled={selectedIds.size === 0 || saving}><RotateCcw size={16} /> {saving ? "Saving" : "Mark selected unwatched"}</button><button className={styles.bulkButton} type="button" onClick={() => void updateSelected(true)} disabled={selectedIds.size === 0 || saving}><Check size={16} /> {saving ? "Saving" : "Mark selected watched"}</button></div></section>
      {progressError && <p className={styles.progressError} role="alert">Unable to update progress: {progressError}</p>}
      {viewMode === "table" ? <div className={styles.tableWrap} data-catalog-workspace>
        <div className={styles.tableConsoleHeader} aria-hidden="true"><span>STARK_ARCHIVE // RELEASE_ORDER_MATRIX</span><div><b><i /> LIVE INDEX</b><span>{String(visibleUnits.length).padStart(3, "0")} RECORDS</span><span>SEQ / ASC</span></div></div>
        <table><thead><tr><th aria-label="Select units">Select</th><th>Archive ref</th><th>Record</th><th>Class</th><th>Released</th><th>Progress</th><th>Command</th></tr></thead><tbody>{visibleUnits.map((unit) => <CatalogRow key={unit.id} unit={unit} collection={titleFilterOption(unit, movieGroups).title} watched={watchedIds.has(unit.id)} selected={selectedIds.has(unit.id)} saving={saving} onSelect={toggleSelection} onChange={(item, watched) => void saveWatched([item.id], watched)} />)}</tbody></table>
      </div> : <div className={styles.cardGrid} data-catalog-workspace>{visibleUnits.map((unit) => <CatalogCard key={unit.id} unit={unit} collection={titleFilterOption(unit, movieGroups).title} watched={watchedIds.has(unit.id)} selected={selectedIds.has(unit.id)} saving={saving} onSelect={toggleSelection} onChange={(item, watched) => void saveWatched([item.id], watched)} />)}</div>}
    </section>
  </main>;
}

function CatalogCard({ unit, collection, watched, selected, saving, onSelect, onChange }: { unit: DashboardUnit; collection: string; watched: boolean; selected: boolean; saving: boolean; onSelect: (unitId: string) => void; onChange: (unit: DashboardUnit, watched: boolean) => void }) {
  const meta = UNIT_META[unit.unitKind];
  const archiveRef = String(unit.position).padStart(3, "0");
  const detail = unit.unitKind === "episode" ? `S${String(unit.seasonNumber).padStart(2, "0")} / E${String(unit.episodeNumber).padStart(2, "0")}` : collection;
  const className = [watched ? styles.watchedCard : styles.card, selected ? styles.selectedCard : ""].filter(Boolean).join(" ");

  return <article className={className} tabIndex={0} data-selected={selected} onClick={() => onSelect(unit.id)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(unit.id); } }}>
    <div className={styles.cardTerminal} aria-hidden="true"><span>{`STARK_DB // ${meta.code}_NODE_${archiveRef}`}</span><b><i /> {watched ? "LOGGED" : "LINK ACTIVE"}</b></div>
    <header className={styles.cardHeader}><div className={styles.cardIndex}><span>Archive ref</span><strong>{archiveRef}</strong></div><label className={styles.cardSelector} onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selected} onChange={() => onSelect(unit.id)} aria-label={`Select ${unit.title} ${unitLabel(unit)}`} /><span>{selected ? "Selected" : "Select"}</span></label></header>
    <div className={styles.cardRecord}><p>{`${meta.code} // ${meta.label}`}</p><h2>{unit.title}</h2><code>{unit.id}</code></div>
    <dl className={styles.cardTelemetry}><div><dt>Released</dt><dd><time dateTime={unit.releaseDate}>{formatFullDate(unit.releaseDate)}</time></dd></div><div><dt>{unit.unitKind === "episode" ? "Episode" : "Collection"}</dt><dd>{detail}</dd></div></dl>
    <footer className={styles.cardCommand}><span className={watched ? styles.statusWatched : styles.statusUnwatched}><i /> {watched ? "Log complete" : "Awaiting input"}</span><WatchButton unit={unit} watched={watched} disabled={saving} onChange={onChange} /></footer>
  </article>;
}

function CatalogRow({ unit, collection, watched, selected, saving, onSelect, onChange }: { unit: DashboardUnit; collection: string; watched: boolean; selected: boolean; saving: boolean; onSelect: (unitId: string) => void; onChange: (unit: DashboardUnit, watched: boolean) => void }) {
  const className = [watched ? styles.watchedRow : "", selected ? styles.selectedRow : ""].filter(Boolean).join(" ");
  const meta = UNIT_META[unit.unitKind];
  return <tr className={className || undefined} tabIndex={0} aria-selected={selected} onClick={() => onSelect(unit.id)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(unit.id); } }}>
    <td className={styles.selectCell}><input type="checkbox" checked={selected} onClick={(event) => event.stopPropagation()} onChange={() => onSelect(unit.id)} aria-label={`Select ${unit.title} ${unitLabel(unit)}`} /></td>
    <td className={styles.recordCell}><strong>{String(unit.position).padStart(3, "0")}</strong><span>ARC/{meta.code}-{String(unit.position).padStart(3, "0")}</span></td>
    <td className={styles.titleCell}><strong>{unit.title}</strong><div>{unit.unitKind === "episode" ? <span>S{String(unit.seasonNumber).padStart(2, "0")} / E{String(unit.episodeNumber).padStart(2, "0")}</span> : <span>{unit.titleKind} title</span>}{collection !== unit.title && <span>{collection} collection</span>}<code>{unit.id}</code></div></td>
    <td className={styles.classCell}><strong>{meta.label}</strong><span>{unit.titleKind} entity</span></td>
    <td className={styles.releaseCell}><time dateTime={unit.releaseDate}>{formatFullDate(unit.releaseDate)}</time><span>UTC / public release</span></td>
    <td className={styles.progressCell}><span className={watched ? styles.statusWatched : styles.statusUnwatched}><i /> {watched ? "Viewed" : "Pending"}</span><small>{watched ? "Log complete" : "Awaiting input"}</small></td>
    <td className={styles.actionCell}><WatchButton unit={unit} watched={watched} disabled={saving} onChange={onChange} /></td>
  </tr>;
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
      <div className={styles.filterOptions} role="listbox" aria-label={`${label} options`}>{visibleOptions.length > 0 ? visibleOptions.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} onClick={() => { onChange(option.value); menu.current?.removeAttribute("open"); }}><span className={styles.filterOptionText}><code aria-hidden="true">IDX-{String(options.indexOf(option)).padStart(3, "0")}</code><span>{option.label}</span></span>{option.value === value ? <Check size={15} /> : <i />}</button>) : <p>No matching titles</p>}</div>
      <div className={styles.consoleFooter} aria-hidden="true"><span>{String(visibleOptions.length).padStart(3, "0")} RECORDS</span><span>NODE 04-A</span><span>MEM 7A:4F</span><b>QUERY READY</b></div>
    </div>
  </details>;
}

function unitLabel(unit: DashboardUnit) { return unit.unitKind === "episode" ? `S${unit.seasonNumber} E${unit.episodeNumber}` : unit.unitKind; }
function formatFullDate(value: string) { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function subscribe(onChange: () => void) { window.addEventListener("storage", onChange); window.addEventListener(LOCAL_PROGRESS_EVENT, onChange); return () => { window.removeEventListener("storage", onChange); window.removeEventListener(LOCAL_PROGRESS_EVENT, onChange); }; }
function snapshot() { return window.localStorage.getItem(LOCAL_PROGRESS_KEY) ?? ""; }
function serverSnapshot() { return ""; }
