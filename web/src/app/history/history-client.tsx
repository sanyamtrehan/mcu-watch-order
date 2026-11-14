"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Check, Cloud, History, RotateCcw } from "lucide-react";
import type { DashboardUnit } from "@/lib/catalog/dashboard";
import { LOCAL_WATCH_HISTORY_EVENT, LOCAL_WATCH_HISTORY_KEY, parseLocalWatchHistory, type WatchHistoryEntry } from "@/lib/progress/watch-history";
import styles from "./page.module.css";

type Props = { units: DashboardUnit[]; account: { email: string } | null; initialRemoteHistory: WatchHistoryEntry[] };

export function HistoryClient({ units, account, initialRemoteHistory }: Props) {
  const validIds = useMemo(() => new Set(units.map((unit) => unit.id)), [units]);
  const storedHistory = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const localHistory = useMemo(() => parseLocalWatchHistory(storedHistory, validIds), [storedHistory, validIds]);
  const history = account ? initialRemoteHistory : localHistory;
  const unitsById = useMemo(() => new Map(units.map((unit) => [unit.id, unit])), [units]);
  const entries = history.flatMap((entry) => { const unit = unitsById.get(entry.watchUnitId); return unit ? [{ entry, unit }] : []; });

  return <main className={styles.page}>
    <header className={styles.nav}><a href="/dashboard" className={styles.wordmark}>MCU <span>Watch Order</span></a><nav><a href="/dashboard">Dashboard</a><a href="/catalog">Catalog</a><a href="/history" aria-current="page">History</a></nav><a className={styles.account} href={account ? "/dashboard" : "/login"}>{account ? account.email : <><Cloud size={15} /> Local history</>}</a></header>
    <section className={styles.hero}>
      <div><p>STARK_ARCHIVE // ACTIVITY_LEDGER</p><h1>Every action.<br /><span>On record.</span></h1><small>{account ? "Your synchronized watch history, newest action first." : "Actions recorded on this device, newest first."}</small></div>
      <div className={styles.counter}><History size={24} /><strong>{entries.length}</strong><span>logged actions</span></div>
    </section>
    <section className={styles.ledger}>
      <header><div><p>Audit trail</p><h2>Watch activity</h2></div><span>{account ? "Cloud synchronized" : "Stored on this device"}</span></header>
      {entries.length > 0 ? <ol>{entries.map(({ entry, unit }, index) => <li key={entry.id}>
        <span className={styles.sequence}>{String(entries.length - index).padStart(4, "0")}</span>
        <span className={entry.action === "watched" ? styles.watchedIcon : styles.unwatchedIcon}>{entry.action === "watched" ? <Check size={17} /> : <RotateCcw size={17} />}</span>
        <div className={styles.title}><strong>{unit.title}</strong><small>{unitLabel(unit)} · archive #{String(unit.position).padStart(3, "0")}</small></div>
        <span className={entry.action === "watched" ? styles.watched : styles.unwatched}>Marked {entry.action}</span>
        <time dateTime={entry.occurredAt} suppressHydrationWarning>{formatTimestamp(entry.occurredAt)}</time>
      </li>)}</ol> : <div className={styles.empty}><History size={28} /><strong>No actions recorded yet</strong><p>Mark something watched in the catalog and it will appear here.</p><a href="/catalog">Open catalog</a></div>}
    </section>
  </main>;
}

function unitLabel(unit: DashboardUnit) { return unit.unitKind === "episode" ? `Season ${unit.seasonNumber} · Episode ${unit.episodeNumber}` : unit.unitKind === "movie" ? "Feature film" : "Special"; }
function formatTimestamp(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function subscribe(onChange: () => void) { window.addEventListener("storage", onChange); window.addEventListener(LOCAL_WATCH_HISTORY_EVENT, onChange); return () => { window.removeEventListener("storage", onChange); window.removeEventListener(LOCAL_WATCH_HISTORY_EVENT, onChange); }; }
function snapshot() { return window.localStorage.getItem(LOCAL_WATCH_HISTORY_KEY) ?? ""; }
function serverSnapshot() { return ""; }
