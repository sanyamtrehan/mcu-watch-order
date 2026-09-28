"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <section className={styles.accessFrame}>
        <div className={styles.accessVisual} aria-hidden="true"><p>J.A.R.V.I.S. / SECURE ACCESS</p><h1>Authorized<br /><span>access.</span></h1><i /><small>Archive access requires a verified account channel.</small></div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.eyebrow}>IDENTITY VERIFICATION</p>
        <h2>Sign in to sync.</h2>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in" : "Sign in"}
        </button>
      </form>
      </section>
    </main>
  );
}
