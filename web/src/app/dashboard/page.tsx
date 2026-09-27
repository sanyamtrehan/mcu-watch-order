import { redirect } from "next/navigation";
import { setWatchProgress } from "@/app/dashboard/actions";
import { getDashboardData, type DashboardUnit } from "@/lib/catalog/dashboard";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect("/login");

  const dashboard = await getDashboardData();
  const percentage = dashboard.totals.total ? Math.round((dashboard.totals.watched / dashboard.totals.total) * 100) : 0;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.wordmark}>MCU WATCH ORDER</p>
        <form action="/auth/signout" method="post"><button type="submit">Sign out</button></form>
      </header>
      <section className={styles.content}>
        <div className={styles.intro}>
          <div><p className={styles.eyebrow}>RELEASE ORDER</p><h1>Your watch progress</h1></div>
          <p className={styles.account}>{data.user.email}</p>
        </div>

        <section className={styles.overview} aria-label="Overall progress">
          <div><p className={styles.metric}>{dashboard.totals.watched}<span> / {dashboard.totals.total}</span></p><p className={styles.metricLabel}>watch units completed</p></div>
          <div className={styles.progressArea}><div className={styles.progressTrack} aria-hidden="true"><div className={styles.progressFill} style={{ width: `${percentage}%` }} /></div><p>{percentage}% complete</p></div>
        </section>

        <section className={styles.stats} aria-label="Progress breakdown">
          <Stat label="Movies" watched={dashboard.totals.moviesWatched} total={dashboard.totals.moviesTotal} />
          <Stat label="Episodes" watched={dashboard.totals.episodesWatched} total={dashboard.totals.episodesTotal} />
          <Stat label="Titles completed" watched={dashboard.totals.titlesCompleted} total={dashboard.totals.titlesTotal} />
        </section>

        {dashboard.next ? <section className={styles.next}><div><p className={styles.eyebrow}>NEXT UP</p><UnitTitle unit={dashboard.next} /><p className={styles.metadata}>Release position {dashboard.next.position} · {formatDate(dashboard.next.releaseDate)}</p></div><ProgressButton unit={dashboard.next} /></section> : <section className={styles.next}><div><p className={styles.eyebrow}>COMPLETE</p><h2>You have finished the current release order.</h2></div></section>}

        <section className={styles.queue}>
          <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>UP NEXT</p><h2>Continue in release order</h2></div><p>{dashboard.totals.total - dashboard.totals.watched} remaining</p></div>
          <ol className={styles.unitList}>{dashboard.upcoming.map((unit) => <li key={unit.id} className={styles.unit}><span className={styles.position}>{unit.position}</span><div className={styles.unitInfo}><UnitTitle unit={unit} /><p className={styles.metadata}>{formatDate(unit.releaseDate)}</p></div><ProgressButton unit={unit} /></li>)}</ol>
        </section>

        {dashboard.recentlyWatched.length > 0 && <section className={styles.queue}>
          <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>RECENTLY WATCHED</p><h2>Adjust progress</h2></div></div>
          <ol className={styles.unitList}>{dashboard.recentlyWatched.map((unit) => <li key={unit.id} className={styles.unit}><span className={styles.position}>{unit.position}</span><div className={styles.unitInfo}><UnitTitle unit={unit} /><p className={styles.metadata}>{formatDate(unit.releaseDate)}</p></div><ProgressButton unit={unit} /></li>)}</ol>
        </section>}
      </section>
    </main>
  );
}

function Stat({ label, watched, total }: { label: string; watched: number; total: number }) {
  return <div><p>{label}</p><strong>{watched}<span> / {total}</span></strong></div>;
}

function UnitTitle({ unit }: { unit: DashboardUnit }) {
  return unit.unitKind === "episode" ? <h2>{unit.title} <span>S{unit.seasonNumber} E{unit.episodeNumber}</span></h2> : <h2>{unit.title}</h2>;
}

function ProgressButton({ unit }: { unit: DashboardUnit }) {
  return <form action={setWatchProgress}><input type="hidden" name="watchUnitId" value={unit.id} /><input type="hidden" name="watched" value={unit.watched ? "false" : "true"} /><button className={unit.watched ? styles.watchedButton : styles.watchButton} type="submit">{unit.watched ? "Watched" : "Mark watched"}</button></form>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
