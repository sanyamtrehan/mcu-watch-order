import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { decideOAuthConsent } from "./actions";
import styles from "./page.module.css";

export default async function OAuthConsentPage({ searchParams }: { searchParams: Promise<{ authorization_id?: string }> }) {
  const authorizationId = (await searchParams).authorization_id;
  if (!authorizationId) return <ConsentError message="Missing authorization request." />;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    const continuation = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
    redirect(`/login?redirect=${encodeURIComponent(continuation)}`);
  }

  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error || !data) return <ConsentError message={error?.message ?? "Invalid authorization request."} />;
  if (!("authorization_id" in data)) redirect(data.redirect_url);

  const scopes = data.scope.split(" ").filter(Boolean);
  return <main className={styles.page}>
    <section className={styles.panel}>
      <p className={styles.eyebrow}>J.A.R.V.I.S. / EXTERNAL LINK</p>
      <h1>Authorize <span>{data.client.name}</span></h1>
      <p className={styles.summary}>This client wants to access your MCU archive as <strong>{data.user.email}</strong>.</p>
      <dl>
        <div><dt>Client</dt><dd>{data.client.name}</dd></div>
        <div><dt>Return channel</dt><dd>{data.redirect_uri}</dd></div>
      </dl>
      {scopes.length > 0 && <div className={styles.scopes}><p>Requested permissions</p>{scopes.map((scope) => <code key={scope}>{scope}</code>)}</div>}
      <p className={styles.warning}>Approval lets ChatGPT read your catalog progress and request watched-status changes. Write actions still require confirmation in ChatGPT.</p>
      <form action={decideOAuthConsent}>
        <input type="hidden" name="authorizationId" value={data.authorization_id} />
        <button className={styles.deny} type="submit" name="decision" value="deny">Deny</button>
        <button className={styles.approve} type="submit" name="decision" value="approve">Authorize link</button>
      </form>
    </section>
  </main>;
}

function ConsentError({ message }: { message: string }) {
  return <main className={styles.page}><section className={styles.panel}><p className={styles.eyebrow}>LINK FAILED</p><h1>Authorization error</h1><p className={styles.warning}>{message}</p></section></main>;
}
