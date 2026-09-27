"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useGSAP } from "@gsap/react";
import { Check, Cloud, Film, RotateCcw, Tv, UserRound } from "lucide-react";
import gsap from "gsap";
import type { DashboardUnit, ReleaseOrderCatalog } from "@/lib/catalog/dashboard";
import { LOCAL_PROGRESS_EVENT, LOCAL_PROGRESS_KEY, parseLocalProgress, writeLocalProgress } from "@/lib/progress/local-progress";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

gsap.registerPlugin(useGSAP);
type Account = { id: string; email: string };
type Props = { catalog: ReleaseOrderCatalog; account: Account | null; initialRemoteWatchedUnitIds: string[] };

export function LocalDashboard({ catalog, account, initialRemoteWatchedUnitIds }: Props) {
  const { units } = catalog;
  const shell = useRef<HTMLElement>(null);
  const [remoteWatched, setRemoteWatched] = useState(() => new Set(initialRemoteWatchedUnitIds));
  const [syncError, setSyncError] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const validIds = useMemo(() => new Set(units.map((unit) => unit.id)), [units]);
  const stored = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const localWatched = useMemo(() => new Set(parseLocalProgress(stored, validIds).watchedUnitIds), [stored, validIds]);
  const watchedIds = useMemo(() => account ? new Set([...localWatched, ...remoteWatched]) : localWatched, [account, localWatched, remoteWatched]);

  useGSAP(() => { if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) gsap.from("[data-telemetry]", { opacity: 0, y: 12, duration: .45, stagger: .06, ease: "power2.out" }); }, { scope: shell });

  const watched = units.filter((unit) => watchedIds.has(unit.id));
  const upcoming = units.filter((unit) => !watchedIds.has(unit.id));
  const titles = [...new Map(units.map((unit) => [unit.titleId, { id: unit.titleId, title: unit.title, kind: unit.titleKind }])).values()];
  const seriesTelemetry = titles.filter((title) => title.kind === "series").map((title) => {
    const titleUnits = units.filter((unit) => unit.titleId === title.id); const seasons = [...new Map(titleUnits.filter((unit) => unit.seasonNumber).map((unit) => [unit.seasonNumber!, { watched: 0, total: 0 }])).entries()];
    for (const unit of titleUnits) { const season = unit.seasonNumber ? seasons.find(([number]) => number === unit.seasonNumber)?.[1] : undefined; if (season) { season.total += 1; season.watched += Number(watchedIds.has(unit.id)); } }
    return { ...title, watched: titleUnits.filter((unit) => watchedIds.has(unit.id)).length, total: titleUnits.length, seasons };
  }).sort((a, b) => a.title.localeCompare(b.title));
  const films = units.filter((unit) => unit.unitKind === "movie"); const episodes = units.filter((unit) => unit.unitKind === "episode");
  const totalPercent = percent(watched.length, units.length); const filmPercent = percent(films.filter((unit) => watchedIds.has(unit.id)).length, films.length); const episodePercent = percent(episodes.filter((unit) => watchedIds.has(unit.id)).length, episodes.length);
  const releaseSignal = Array.from({ length: 16 }, (_, index) => {
    const start = Math.floor(index * units.length / 16); const end = Math.floor((index + 1) * units.length / 16);
    const segment = units.slice(start, end); return { total: segment.length, watched: segment.filter((unit) => watchedIds.has(unit.id)).length, index };
  });

  async function setWatched(unit: DashboardUnit, value: boolean) {
    const next = new Set(watchedIds);
    if (value) next.add(unit.id);
    else next.delete(unit.id);
    if (account) { const supabase = createBrowserClient(); const { error } = value ? await supabase.from("watch_progress").upsert({ user_id: account.id, watch_unit_id: unit.id, status: "watched", watched_at: new Date().toISOString() }, { onConflict: "user_id,watch_unit_id" }) : await supabase.from("watch_progress").delete().eq("user_id", account.id).eq("watch_unit_id", unit.id); if (error) { setSyncError(error.message); return; } setRemoteWatched(next); }
    writeLocalProgress(next);
  }
  async function mergeProgress() {
    if (!account) return; setMerging(true); setSyncError(null); const merged = new Set([...localWatched, ...remoteWatched]); const missing = [...merged].filter((id) => !remoteWatched.has(id));
    if (missing.length > 0) { const supabase = createBrowserClient(); const { error } = await supabase.from("watch_progress").upsert(missing.map((watchUnitId) => ({ user_id: account.id, watch_unit_id: watchUnitId, status: "watched", watched_at: new Date().toISOString() })), { onConflict: "user_id,watch_unit_id" }); if (error) { setSyncError(error.message); setMerging(false); return; } }
    setRemoteWatched(merged); writeLocalProgress(merged); setMerging(false);
  }

  return <main ref={shell} className={styles.appShell}>
    <CommandNav account={account} />
    <div className={styles.dashboardRail}>
      <header className={styles.consoleHeader} data-telemetry><div><p>RELEASE ORDER / TRACKING SYSTEM</p><h1>Progress telemetry</h1></div><span>{units.length} watch units online</span></header>
      <section className={styles.telemetryGrid} aria-label="MCU progress telemetry">
        <ReleaseSignal bins={releaseSignal} />
        <Instrument className={styles.overallInstrument} label="Overall completion" value={totalPercent} detail={`${watched.length} / ${units.length}`} color="cyan" />
        <article className={`${styles.splitInstrument} ${styles.panel}`} data-telemetry><header><p>Content split</p><span>Current order</span></header><div><MiniInstrument icon={<Film size={16} />} label="Films" value={filmPercent} detail={`${films.filter((unit) => watchedIds.has(unit.id)).length}/${films.length}`} color="magenta" /><MiniInstrument icon={<Tv size={16} />} label="Episodes" value={episodePercent} detail={`${episodes.filter((unit) => watchedIds.has(unit.id)).length}/${episodes.length}`} color="cobalt" /></div></article>
        <article className={`${styles.nextCommand} ${styles.panel}`} data-telemetry><header><p>Next command</p><span>#{upcoming[0]?.position ?? units.length}</span></header>{upcoming[0] ? <><h2>{upcoming[0].title}</h2><small>{label(upcoming[0])} · {formatDate(upcoming[0].releaseDate)}</small><button type="button" onClick={() => void setWatched(upcoming[0], true)}><Check size={16} /> Mark watched</button></> : <><h2>Release order complete</h2><small>All current units are marked watched.</small></>}</article>
        <section className={`${styles.seasonMatrix} ${styles.panel}`} data-telemetry><header><div><p>Series matrix</p><h2>Season completion</h2></div><span>{seriesTelemetry.length} series</span></header><div className={styles.matrixRows}>{seriesTelemetry.map((series) => <article key={series.id}><div><strong>{series.title}</strong><small>{series.watched} / {series.total}</small></div><div className={styles.seasonBlocks}>{series.seasons.sort(([a], [b]) => a - b).map(([number, season]) => <span key={number} className={styles[`season${progressClass(season.watched, season.total)}`]} title={`Season ${number}: ${season.watched} of ${season.total} watched`}>S{number}<b>{season.watched}/{season.total}</b></span>)}</div></article>)}</div></section>
        <section className={`${styles.queuePanel} ${styles.panel}`} data-telemetry><header><div><p>Continuation queue</p><h2>Immediate sequence</h2></div><a href="/catalog">Open catalog</a></header><ol>{upcoming.slice(0, 6).map((unit) => <li key={unit.id}><span>{String(unit.position).padStart(3, "0")}</span><div><strong>{unit.title}</strong><small>{label(unit)}</small></div><button type="button" onClick={() => void setWatched(unit, true)} aria-label={`Mark ${unit.title} watched`}><Check size={15} /></button></li>)}</ol></section>
      </section>
      <AccountPanel account={account} local={localWatched} remote={remoteWatched} error={syncError} merging={merging} onMerge={mergeProgress} />
      {watched.length > 0 && <section className={styles.recent} data-telemetry><p>Recent marks</p>{watched.slice(-5).reverse().map((unit) => <button key={unit.id} type="button" onClick={() => void setWatched(unit, false)}><RotateCcw size={14} /> {unit.title}</button>)}</section>}
    </div>
  </main>;
}

function CommandNav({ account }: { account: Account | null }) { return <header className={styles.commandNav}><a href="/dashboard" className={styles.wordmark}>MCU <span>Watch Order</span></a><nav><a href="/dashboard" aria-current="page">Dashboard</a><a href="/catalog">Catalog</a><button type="button" aria-pressed="true">Release</button><button type="button" disabled title="Needs curated positions">Chronological</button></nav>{account ? <form action="/auth/signout" method="post"><button className={styles.accountButton} type="submit"><UserRound size={16} /><span>{account.email}</span></button></form> : <a className={styles.syncLink} href="/login"><Cloud size={16} /> Sync</a>}</header>; }
function ReleaseSignal({ bins }: { bins: { total: number; watched: number; index: number }[] }) { return <article className={`${styles.releaseSignal} ${styles.panel}`} data-telemetry><header><div><p>Release signal</p><h2>Completion distribution</h2></div><span>16 intervals</span></header><div className={styles.signalChart}>{bins.map((bin) => <div key={bin.index}><i style={{ height: `${Math.max(12, Math.round(bin.watched / bin.total * 100))}%` }} /><b>{String(bin.index + 1).padStart(2, "0")}</b></div>)}</div><footer><span>EARLY RELEASES</span><span>CURRENT SEQUENCE</span></footer></article>; }
function Instrument({ className, label, value, detail, color }: { className: string; label: string; value: number; detail: string; color: "cyan" | "magenta" | "cobalt" }) { return <article className={`${className} ${styles.panel}`} data-telemetry><p>{label}</p><div className={`${styles.ring} ${styles[color]}`} style={{ "--value": `${value * 3.6}deg` } as React.CSSProperties}><div><strong>{value}%</strong><span>{detail}</span></div></div></article>; }
function MiniInstrument({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: number; detail: string; color: "magenta" | "cobalt" }) { return <div className={styles.miniInstrument}><div className={`${styles.miniRing} ${styles[color]}`} style={{ "--value": `${value * 3.6}deg` } as React.CSSProperties}>{icon}</div><div><strong>{label}</strong><span>{value}% · {detail}</span></div></div>; }
function AccountPanel({ account, local, remote, error, merging, onMerge }: { account: Account | null; local: Set<string>; remote: Set<string>; error: string | null; merging: boolean; onMerge: () => Promise<void> }) { const pending = account && !setsEqual(local, remote); return <section className={styles.syncPanel} data-telemetry><div><p>Account channel</p><strong>{account ? pending ? "Local progress waiting to merge" : "Cloud progress synchronized" : "Local storage active"}</strong><span>{account ? `${local.size} local / ${remote.size} account marks` : "Sync only when you need another device."}</span>{error && <em>{error}</em>}</div>{account && pending ? <button type="button" onClick={() => void onMerge()} disabled={merging}><Cloud size={16} /> {merging ? "Merging" : "Merge progress"}</button> : !account ? <a href="/login"><Cloud size={16} /> Connect</a> : <Check size={18} />}</section>; }
function percent(value: number, total: number) { return total ? Math.round(value / total * 100) : 0; }
function progressClass(watched: number, total: number) { return watched === 0 ? "Empty" : watched === total ? "Complete" : "Partial"; }
function label(unit: DashboardUnit) { return unit.unitKind === "episode" ? `S${unit.seasonNumber} E${unit.episodeNumber}` : unit.unitKind; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function subscribe(onChange: () => void) { window.addEventListener("storage", onChange); window.addEventListener(LOCAL_PROGRESS_EVENT, onChange); return () => { window.removeEventListener("storage", onChange); window.removeEventListener(LOCAL_PROGRESS_EVENT, onChange); }; }
function snapshot() { return window.localStorage.getItem(LOCAL_PROGRESS_KEY) ?? ""; }
function serverSnapshot() { return ""; }
function setsEqual(left: Set<string>, right: Set<string>) { return left.size === right.size && [...left].every((id) => right.has(id)); }
