"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useGSAP } from "@gsap/react";
import { Check, Cloud, RotateCcw, UserRound } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { DashboardUnit, ReleaseOrderCatalog } from "@/lib/catalog/dashboard";
import { LOCAL_PROGRESS_EVENT, LOCAL_PROGRESS_KEY, parseLocalProgress, writeLocalProgress } from "@/lib/progress/local-progress";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);
type Account = { id: string; email: string };
type Props = { catalog: ReleaseOrderCatalog; account: Account | null; initialRemoteWatchedUnitIds: string[] };

export function LocalDashboard({ catalog, account, initialRemoteWatchedUnitIds }: Props) {
  const { units } = catalog;
  const shell = useRef<HTMLElement>(null);
  const bootSequence = useRef<HTMLElement>(null);
  const [remoteWatched, setRemoteWatched] = useState(() => new Set(initialRemoteWatchedUnitIds));
  const [syncError, setSyncError] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const validIds = useMemo(() => new Set(units.map((unit) => unit.id)), [units]);
  const stored = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const localWatched = useMemo(() => new Set(parseLocalProgress(stored, validIds).watchedUnitIds), [stored, validIds]);
  const watchedIds = useMemo(() => account ? new Set([...localWatched, ...remoteWatched]) : localWatched, [account, localWatched, remoteWatched]);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !bootSequence.current) return;
    gsap.from("[data-boot-reveal]", { opacity: 0, y: 22, duration: .8, stagger: .12, ease: "power3.out" });
    gsap.from("[data-telemetry]", { opacity: 0, y: 18, duration: .55, stagger: .06, ease: "power2.out", scrollTrigger: { trigger: "[data-dashboard-stage]", start: "top 82%" } });
    gsap.timeline({ scrollTrigger: { trigger: bootSequence.current, start: "top top", end: "+=110%", scrub: .75, pin: true, anticipatePin: 1 } })
      .to("[data-boot-copy]", { opacity: .16, y: -54, duration: .48 }, 0)
      .to("[data-boot-orbit]", { rotate: 126, scale: 1.18, duration: .7 }, 0)
      .to("[data-boot-core]", { scale: .42, y: 178, duration: .8, ease: "power2.inOut" }, 0)
      .to("[data-boot-status]", { opacity: 0, y: 24, duration: .35 }, .14)
      .to("[data-boot-grid]", { opacity: .12, scale: 1.18, duration: .75 }, 0);
  }, { scope: shell });

  const watched = units.filter((unit) => watchedIds.has(unit.id));
  const upcoming = units.filter((unit) => !watchedIds.has(unit.id));
  const titles = [...new Map(units.map((unit) => [unit.titleId, { id: unit.titleId, title: unit.title, kind: unit.titleKind }])).values()];
  const titleTelemetry = titles.map((title) => {
    const titleUnits = units.filter((unit) => unit.titleId === title.id); const seasons = [...new Map(titleUnits.filter((unit) => unit.seasonNumber).map((unit) => [unit.seasonNumber!, { watched: 0, total: 0 }])).entries()];
    for (const unit of titleUnits) { const season = unit.seasonNumber ? seasons.find(([number]) => number === unit.seasonNumber)?.[1] : undefined; if (season) { season.total += 1; season.watched += Number(watchedIds.has(unit.id)); } }
    return { ...title, watched: titleUnits.filter((unit) => watchedIds.has(unit.id)).length, total: titleUnits.length, seasons };
  });
  const seriesTelemetry = titleTelemetry.filter((title) => title.kind === "series").sort((a, b) => a.title.localeCompare(b.title));
  const films = units.filter((unit) => unit.unitKind === "movie"); const episodes = units.filter((unit) => unit.unitKind === "episode");
  const totalPercent = percent(watched.length, units.length);
  const releaseSignal = Array.from({ length: 12 }, (_, index) => {
    const start = Math.floor(index * units.length / 12); const end = Math.floor((index + 1) * units.length / 12);
    const segment = units.slice(start, end); return { total: segment.length, watched: segment.filter((unit) => watchedIds.has(unit.id)).length, index, label: segment[0] ? new Date(`${segment[0].releaseDate}T00:00:00Z`).getUTCFullYear().toString() : "" };
  });
  const completedTitles = titleTelemetry.filter((title) => title.watched === title.total).length;
  const incompleteTitles = titleTelemetry.filter((title) => title.watched > 0 && title.watched < title.total).sort((left, right) => right.watched / right.total - left.watched / left.total).slice(0, 6);
  const mix = [
    { label: "Films", value: films.filter((unit) => watchedIds.has(unit.id)).length, total: films.length, color: "var(--magenta)" },
    { label: "Episodes", value: episodes.filter((unit) => watchedIds.has(unit.id)).length, total: episodes.length, color: "var(--cobalt)" },
    { label: "Specials", value: watched.filter((unit) => unit.unitKind === "special").length, total: units.filter((unit) => unit.unitKind === "special").length, color: "var(--teal)" },
  ];

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
    <section ref={bootSequence} className={styles.bootSequence} aria-label="J.A.R.V.I.S. initialization sequence">
      <div className={styles.bootGrid} data-boot-grid />
      <div className={styles.bootCopy} data-boot-copy data-boot-reveal><p>J.A.R.V.I.S. / WATCH ORDER PROTOCOL</p><h1>Marvel<br /><span>intelligence.</span></h1><small>Personal viewing archive, synchronized to release sequence.</small></div>
      <div className={styles.bootStatus} data-boot-status data-boot-reveal><span>System state</span><strong>ONLINE</strong><i>{watched.length} / {units.length} units resolved</i></div>
      <ReactorCore progress={totalPercent} />
      <div className={styles.bootFooter} data-boot-status><span>Scroll to enter archive</span><span>{upcoming[0] ? `Next: ${upcoming[0].title}` : "Archive complete"}</span></div>
    </section>
    <div className={styles.dashboardRail} data-dashboard-stage>
      <header className={styles.consoleHeader} data-telemetry><div><p>AVENGERS ARCHIVE / RELEASE SEQUENCE</p><h1>Watch intelligence</h1></div><span><i /> {units.length} units indexed</span></header>
      <section className={styles.telemetryGrid} aria-label="MCU progress telemetry">
        <MetricRing className={styles.overallMetric} label="Completion" value={totalPercent} detail={`${watched.length} watched`} color="cyan" />
        <MixMetric className={styles.mixMetric} values={mix} />
        <MetricRing className={styles.titleMetric} label="Titles resolved" value={percent(completedTitles, titles.length)} detail={`${completedTitles} of ${titles.length}`} color="magenta" />
        <ReleaseSignal bins={releaseSignal} />
        <section className={`${styles.titlePanel} ${styles.panel}`} data-telemetry><header><div><p>Active title diagnostics</p><h2>Continue these stories</h2></div><span>{incompleteTitles.length} in progress</span></header><div className={styles.titleList}>{incompleteTitles.length ? incompleteTitles.map((title) => <article key={title.id}><div><strong>{title.title}</strong><small>{title.kind === "series" ? `${title.seasons.length} seasons` : "film"}</small></div><div className={styles.titleBar}><i style={{ width: `${percent(title.watched, title.total)}%` }} /></div><b>{title.watched}/{title.total}</b></article>) : <p className={styles.emptyState}>Mark a title watched to begin its diagnostic trace.</p>}</div></section>
        <section className={`${styles.seasonMatrix} ${styles.panel}`} data-telemetry><header><div><p>Series matrix</p><h2>Season completion map</h2></div><span>{seriesTelemetry.length} series</span></header><div className={styles.matrixRows}>{seriesTelemetry.map((series) => <article key={series.id}><div><strong>{series.title}</strong><small>{series.watched} / {series.total}</small></div><div className={styles.seasonBlocks}>{series.seasons.sort(([a], [b]) => a - b).map(([number, season]) => <span key={number} className={styles[`season${progressClass(season.watched, season.total)}`]} title={`Season ${number}: ${season.watched} of ${season.total} watched`}>S{number}<b>{season.watched}/{season.total}</b></span>)}</div></article>)}</div></section>
        <section className={`${styles.queuePanel} ${styles.panel}`} data-telemetry><header><div><p>Continuation queue</p><h2>Next in release order</h2></div><a href="/catalog">Catalog</a></header>{upcoming[0] && <button className={styles.priorityAction} type="button" onClick={() => void setWatched(upcoming[0], true)}><Check size={16} /> Complete next</button>}<ol>{upcoming.slice(0, 5).map((unit) => <li key={unit.id}><span>{String(unit.position).padStart(3, "0")}</span><div><strong>{unit.title}</strong><small>{label(unit)} · {formatDate(unit.releaseDate)}</small></div><button type="button" onClick={() => void setWatched(unit, true)} aria-label={`Mark ${unit.title} watched`}><Check size={15} /></button></li>)}</ol></section>
      </section>
      <AccountPanel account={account} local={localWatched} remote={remoteWatched} error={syncError} merging={merging} onMerge={mergeProgress} />
      {watched.length > 0 && <section className={styles.recent} data-telemetry><p>Recent marks</p>{watched.slice(-5).reverse().map((unit) => <button key={unit.id} type="button" onClick={() => void setWatched(unit, false)}><RotateCcw size={14} /> {unit.title}</button>)}</section>}
    </div>
  </main>;
}

function CommandNav({ account }: { account: Account | null }) { return <header className={styles.commandNav}><a href="/dashboard" className={styles.wordmark}>MCU <span>Watch Order</span></a><nav><a href="/dashboard" aria-current="page">Dashboard</a><a href="/catalog">Catalog</a><button type="button" aria-pressed="true">Release</button><button type="button" disabled title="Needs curated positions">Chronological</button></nav>{account ? <form action="/auth/signout" method="post"><button className={styles.accountButton} type="submit"><UserRound size={16} /><span>{account.email}</span></button></form> : <a className={styles.syncLink} href="/login"><Cloud size={16} /> Sync</a>}</header>; }
function ReactorCore({ progress }: { progress: number }) { return <div className={styles.reactorAssembly} data-boot-core aria-label={`${progress}% archive completion`}><div className={styles.reactorOrbit} data-boot-orbit><i /><i /><i /></div><div className={styles.reactorHalo} /><div className={styles.reactorCore}><div><strong>{progress}%</strong><span>resolved</span></div></div><span className={styles.reactorCaption}>ARC // {String(progress).padStart(2, "0")}</span></div>; }
function ReleaseSignal({ bins }: { bins: { total: number; watched: number; index: number; label: string }[] }) { const points = bins.map((bin, index) => `${index * 100 / (bins.length - 1)},${88 - percent(bin.watched, bin.total) * .72}`).join(" "); const area = `0,100 ${points} 100,100`; return <article className={`${styles.releaseSignal} ${styles.panel}`} data-telemetry><header><div><p>Release completion</p><h2>Sequence coverage</h2></div><span>12 release eras</span></header><div className={styles.areaChart}><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Completion by release era"><defs><linearGradient id="coverage-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#24d7ff" stopOpacity=".46" /><stop offset="1" stopColor="#24d7ff" stopOpacity="0" /></linearGradient></defs><path d={`M ${area.replaceAll(" ", " L ")} Z`} fill="url(#coverage-fill)" /><polyline points={points} fill="none" stroke="#24d7ff" strokeWidth="1.4" vectorEffect="non-scaling-stroke" /></svg><div className={styles.chartColumns}>{bins.map((bin) => <i key={bin.index} style={{ height: `${Math.max(4, percent(bin.watched, bin.total))}%` }} />)}</div></div><footer>{bins.map((bin) => <span key={bin.index}>{bin.label}</span>)}</footer></article>; }
function MetricRing({ className, label, value, detail, color }: { className: string; label: string; value: number; detail: string; color: "cyan" | "magenta" }) { return <article className={`${className} ${styles.panel}`} data-telemetry><header><p>{label}</p><span className={styles.metricReadout}>live</span></header><div className={`${styles.ring} ${styles[color]}`} style={{ "--value": `${value * 3.6}deg` } as React.CSSProperties}><div><strong>{value}%</strong><span>{detail}</span></div></div><footer className={styles.metricFooter}><i /><span>Archive signal stable</span></footer></article>; }
function MixMetric({ className, values }: { className: string; values: { label: string; value: number; total: number; color: string }[] }) { const total = values.reduce((sum, entry) => sum + entry.total, 0); const gradient = values.reduce<{ segments: string[]; offset: number }>((state, entry) => { const share = entry.total / total * 100; return { segments: [...state.segments, `${entry.color} ${state.offset}% ${state.offset + share}%`], offset: state.offset + share }; }, { segments: [], offset: 0 }).segments.join(", "); return <article className={`${className} ${styles.panel}`} data-telemetry><header><p>Archive mix</p><span>by watch unit</span></header><div className={styles.mixBody}><div className={styles.mixRing} style={{ background: `conic-gradient(${gradient})` }}><span>{total}</span></div><div>{values.map((entry) => <p key={entry.label}><i style={{ background: entry.color }} />{entry.label}<b>{entry.value}/{entry.total}</b></p>)}</div></div><footer className={styles.metricFooter}><i /><span>Media allocation</span></footer></article>; }
function AccountPanel({ account, local, remote, error, merging, onMerge }: { account: Account | null; local: Set<string>; remote: Set<string>; error: string | null; merging: boolean; onMerge: () => Promise<void> }) { const pending = account && !setsEqual(local, remote); return <section className={styles.syncPanel} data-telemetry><div><p>Account channel</p><strong>{account ? pending ? "Local progress waiting to merge" : "Cloud progress synchronized" : "Local storage active"}</strong><span>{account ? `${local.size} local / ${remote.size} account marks` : "Sync only when you need another device."}</span>{error && <em>{error}</em>}</div>{account && pending ? <button type="button" onClick={() => void onMerge()} disabled={merging}><Cloud size={16} /> {merging ? "Merging" : "Merge progress"}</button> : !account ? <a href="/login"><Cloud size={16} /> Connect</a> : <Check size={18} />}</section>; }
function percent(value: number, total: number) { return total ? Math.round(value / total * 100) : 0; }
function progressClass(watched: number, total: number) { return watched === 0 ? "Empty" : watched === total ? "Complete" : "Partial"; }
function label(unit: DashboardUnit) { return unit.unitKind === "episode" ? `S${unit.seasonNumber} E${unit.episodeNumber}` : unit.unitKind; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function subscribe(onChange: () => void) { window.addEventListener("storage", onChange); window.addEventListener(LOCAL_PROGRESS_EVENT, onChange); return () => { window.removeEventListener("storage", onChange); window.removeEventListener(LOCAL_PROGRESS_EVENT, onChange); }; }
function snapshot() { return window.localStorage.getItem(LOCAL_PROGRESS_KEY) ?? ""; }
function serverSnapshot() { return ""; }
function setsEqual(left: Set<string>, right: Set<string>) { return left.size === right.size && [...left].every((id) => right.has(id)); }
