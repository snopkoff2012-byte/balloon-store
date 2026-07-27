"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnvironment } from "@/lib/environment";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const environment = getPublicEnvironment();

  browserClient = createBrowserClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return browserClient;
}
