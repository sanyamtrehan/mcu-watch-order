"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function decideOAuthConsent(formData: FormData) {
  const authorizationId = formData.get("authorizationId");
  const decision = formData.get("decision");
  if (typeof authorizationId !== "string" || !authorizationId || (decision !== "approve" && decision !== "deny")) {
    throw new Error("Invalid authorization decision.");
  }

  const supabase = await createClient();
  const response = decision === "approve"
    ? await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
    : await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });

  if (response.error || !response.data) throw new Error(response.error?.message ?? "Unable to complete authorization.");
  redirect(response.data.redirect_url);
}
