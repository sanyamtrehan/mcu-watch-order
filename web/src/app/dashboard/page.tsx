import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>MCU WATCH ORDER</p>
        <form action="/auth/signout" method="post">
          <button type="submit">Sign out</button>
        </form>
      </header>
      <section className={styles.content}>
        <p className={styles.eyebrow}>SIGNED IN</p>
        <h1>Welcome back.</h1>
      </section>
    </main>
  );
}
