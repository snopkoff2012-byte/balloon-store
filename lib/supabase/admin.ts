import "server-only";

import { redirect } from "next/navigation";
import { getOptionalPublicEnvironment } from "@/lib/environment";
import { createServerSupabaseClient } from "./server";

export async function requireActiveAdmin() {
  if (!getOptionalPublicEnvironment()) {
    return { mode: "fallback" as const, profile: null };
  }

  const supabase = await createServerSupabaseClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/admin/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("user_id,display_name,role,is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=access");
  }

  return { mode: "supabase" as const, profile };
}
