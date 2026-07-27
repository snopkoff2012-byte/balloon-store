"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AdminSignOut() {
  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.location.assign("/admin/login");
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="text-sm font-medium text-slate-300 hover:text-white"
    >
      Выйти
    </button>
  );
}
