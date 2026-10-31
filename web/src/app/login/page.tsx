"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const supabase = createClient();
    const credentials = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };
    const { data, error: authError } = mode === "signup"
      ? await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: `${window.location.origin}/login` } })
      : await supabase.auth.signInWithPassword(credentials);

    if (authError) {
      setError(authError.message);
      setIsSubmitting(false);
      return;
    }

    if (!data.session) {
      setMode("signin");
      setMessage("Check your email to confirm your account, then sign in.");
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
        <h2>{mode === "signup" ? "Create your account." : "Sign in to sync."}</h2>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={6}
            required
          />
        </label>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {message ? <p className={styles.success} role="status">{message}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Connecting" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
        <button className={styles.modeSwitch} type="button" onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setError(null);
          setMessage(null);
        }}>
          {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Create one"}
        </button>
      </form>
      </section>
    </main>
  );
}
