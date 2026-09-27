import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const { url, publishableKey } = getSupabaseConfig();
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.headers
          .get("cookie")
          ?.split("; ")
          .map((value) => {
            const [name, ...rest] = value.split("=");
            return { name, value: rest.join("=") };
          }) ?? [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.signOut();
  return response;
}
