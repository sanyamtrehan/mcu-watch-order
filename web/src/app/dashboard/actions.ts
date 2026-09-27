"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setWatchProgress(formData: FormData) {
  const watchUnitId = formData.get("watchUnitId");
  const watched = formData.get("watched") === "true";

  if (typeof watchUnitId !== "string" || watchUnitId.length === 0) {
    throw new Error("A watch unit is required.");
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("You must be signed in to update progress.");
  }

  if (watched) {
    const { error } = await supabase.from("watch_progress").upsert(
      { user_id: authData.user.id, watch_unit_id: watchUnitId, status: "watched", watched_at: new Date().toISOString() },
      { onConflict: "user_id,watch_unit_id" },
    );
    if (error) throw new Error(`Unable to save progress: ${error.message}`);
  } else {
    const { error } = await supabase.from("watch_progress").delete().eq("watch_unit_id", watchUnitId);
    if (error) throw new Error(`Unable to remove progress: ${error.message}`);
  }

  revalidatePath("/dashboard");
}
