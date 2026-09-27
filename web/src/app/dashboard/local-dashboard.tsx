"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { DashboardUnit } from "@/lib/catalog/dashboard";
import { LOCAL_PROGRESS_EVENT, LOCAL_PROGRESS_KEY, parseLocalProgress, writeLocalProgress } from "@/lib/progress/local-progress";
import styles from "./page.module.css";

type Props = { units: DashboardUnit[] };

export function LocalDashboard({ units }: Props) {
  const validUnitIds = useMemo(() => new Set(units.map((unit) => unit.id)), [units]);
  const serializedProgress = useSyncExternalStore(subscribeToLocalProgress, getLocalProgressSnapshot, getServerProgressSnapshot);
  const watchedUnitIds = useMemo(
    () => new Set(parseLocalProgress(serializedProgress, validUnitIds).watchedUnitIds),
    [serializedProgress, validUnitIds],
  );

  const watched = units.filter((unit) => watchedUnitIds.has(unit.id));
  const upcoming = units.filter((unit) => !watchedUnitIds.has(unit.id));
  const movies = units.filter((unit) => unit.unitKind === "movie");
  const episodes = units.filter((unit) => unit.unitKind === "episode");
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
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.wordmark}>MCU WATCH ORDER</p>
        <a className={styles.syncLink} href="/login">Sync</a>
      </header>
      <section className={styles.content}>
        <div className={styles.intro}>
          <div><p className={styles.eyebrow}>RELEASE ORDER</p><h1>Your watch progress</h1></div>
          <p className={styles.account}>Saved on this device</p>
        </div>

        <section className={styles.overview} aria-label="Overall progress">
          <div><p className={styles.metric}>{totals.watched}<span> / {totals.total}</span></p><p className={styles.metricLabel}>watch units completed</p></div>
          <div className={styles.progressArea}><div className={styles.progressTrack} aria-hidden="true"><div className={styles.progressFill} style={{ width: `${percentage}%` }} /></div><p>{percentage}% complete</p></div>
        </section>

        <section className={styles.stats} aria-label="Progress breakdown">
          <Stat label="Movies" watched={totals.moviesWatched} total={totals.moviesTotal} />
          <Stat label="Episodes" watched={totals.episodesWatched} total={totals.episodesTotal} />
          <Stat label="Titles completed" watched={totals.titlesCompleted} total={totals.titlesTotal} />
        </section>

        {upcoming[0] ? <section className={styles.next}><div><p className={styles.eyebrow}>NEXT UP</p><UnitTitle unit={upcoming[0]} /><p className={styles.metadata}>Release position {upcoming[0].position} · {formatDate(upcoming[0].releaseDate)}</p></div><WatchButton unit={upcoming[0]} watched={false} onChange={setWatched} /></section> : <section className={styles.next}><div><p className={styles.eyebrow}>COMPLETE</p><h2>You have finished the current release order.</h2></div></section>}

        <section className={styles.queue}>
          <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>UP NEXT</p><h2>Continue in release order</h2></div><p>{upcoming.length} remaining</p></div>
          <ol className={styles.unitList}>{upcoming.slice(0, 12).map((unit) => <WatchUnitRow key={unit.id} unit={unit} watched={false} onChange={setWatched} />)}</ol>
        </section>

        {watched.length > 0 && <section className={styles.queue}>
          <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>RECENTLY WATCHED</p><h2>Adjust progress</h2></div></div>
          <ol className={styles.unitList}>{watched.slice(-8).reverse().map((unit) => <WatchUnitRow key={unit.id} unit={unit} watched onChange={setWatched} />)}</ol>
        </section>}
      </section>
    </main>
  );
}

function subscribeToLocalProgress(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LOCAL_PROGRESS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LOCAL_PROGRESS_EVENT, onStoreChange);
  };
}

function getLocalProgressSnapshot() {
  return window.localStorage.getItem(LOCAL_PROGRESS_KEY) ?? "";
}

function getServerProgressSnapshot() {
  return "";
}

function Stat({ label, watched, total }: { label: string; watched: number; total: number }) {
  return <div><p>{label}</p><strong>{watched}<span> / {total}</span></strong></div>;
}

function WatchUnitRow({ unit, watched, onChange }: { unit: DashboardUnit; watched: boolean; onChange: (unitId: string, watchedValue: boolean) => void }) {
  return <li className={styles.unit}><span className={styles.position}>{unit.position}</span><div className={styles.unitInfo}><UnitTitle unit={unit} /><p className={styles.metadata}>{formatDate(unit.releaseDate)}</p></div><WatchButton unit={unit} watched={watched} onChange={onChange} /></li>;
}

function UnitTitle({ unit }: { unit: DashboardUnit }) {
  return unit.unitKind === "episode" ? <h2>{unit.title} <span>S{unit.seasonNumber} E{unit.episodeNumber}</span></h2> : <h2>{unit.title}</h2>;
}

function WatchButton({ unit, watched, onChange }: { unit: DashboardUnit; watched: boolean; onChange: (unitId: string, watchedValue: boolean) => void }) {
  return <button className={watched ? styles.watchedButton : styles.watchButton} type="button" onClick={() => onChange(unit.id, !watched)}>{watched ? "Undo" : "Mark watched"}</button>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
