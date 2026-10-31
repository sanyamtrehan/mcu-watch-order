"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validatePasswordReset } from "@/lib/auth/password-reset";
import styles from "./page.module.css";

type Mode = "signin" | "signup" | "forgot" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("recovery") !== "1") return;

    const supabase = createClient();
    // The recovery marker only exists in the browser after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode("reset");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION") && session) {
        setMode("reset");
        setRecoveryReady(true);
        setError(null);
        setMessage(null);
      }
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      setMode("reset");
      if (sessionError || !data.session) {
        setError("This password reset link is invalid or has expired.");
        setMessage(null);
        return;
      }
      setRecoveryReady(true);
      setError(null);
      setMessage(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const supabase = createClient();
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (mode === "forgot") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?recovery=1`,
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage("If an account exists for that email, a password reset link has been sent.");
      }
      setIsSubmitting(false);
      return;
    }

    if (mode === "reset") {
      if (!recoveryReady) {
        setError("Open a valid password reset link before setting a new password.");
        setIsSubmitting(false);
        return;
      }
      const validationError = validatePasswordReset(password, String(formData.get("confirmPassword") ?? ""));
      if (validationError) {
        setError(validationError);
        setIsSubmitting(false);
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setIsSubmitting(false);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    const credentials = {
      email,
      password,
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
        <p className={styles.eyebrow}>{mode === "forgot" || mode === "reset" ? "ACCOUNT RECOVERY" : "IDENTITY VERIFICATION"}</p>
        <h2>{mode === "signup" ? "Create your account." : mode === "forgot" ? "Recover access." : mode === "reset" ? "Set a new password." : "Sign in to sync."}</h2>
        {mode !== "reset" && <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>}
        {mode !== "forgot" && <label>
          {mode === "reset" ? "New password" : "Password"}
          <span className={styles.passwordField}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signup" || mode === "reset" ? "new-password" : "current-password"}
              minLength={6}
              required
            />
            <button className={styles.passwordToggle} type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>}
        {mode === "reset" && <label>
          Confirm new password
          <span className={styles.passwordField}>
            <input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={6} required />
            <button className={styles.passwordToggle} type="button" aria-label={showPassword ? "Hide passwords" : "Show passwords"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {message ? <p className={styles.success} role="status">{message}</p> : null}
        {mode === "reset" && !recoveryReady && !error ? <p className={styles.success} role="status">Validating password reset link...</p> : null}
        {mode === "signin" && <button className={styles.forgotLink} type="button" onClick={() => { setMode("forgot"); setError(null); setMessage(null); }}>Forgot password?</button>}
        <button type="submit" disabled={isSubmitting || (mode === "reset" && !recoveryReady)}>
          {isSubmitting ? "Connecting" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Update password" : "Sign in"}
        </button>
        {mode !== "reset" && <button className={styles.modeSwitch} type="button" onClick={() => {
          setMode(mode === "signup" || mode === "forgot" ? "signin" : "signup");
          setShowPassword(false);
          setError(null);
          setMessage(null);
        }}>
          {mode === "signup" ? "Already have an account? Sign in" : mode === "forgot" ? "Back to sign in" : "Need an account? Create one"}
        </button>}
      </form>
      </section>
    </main>
  );
}
