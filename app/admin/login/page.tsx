import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/features/admin/auth/admin-login-form";
import { getOptionalPublicEnvironment } from "@/lib/environment";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Вход администратора",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const environment = getOptionalPublicEnvironment();
  const { error } = await searchParams;

  if (environment) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (userId) {
      const { data: profile } = await supabase
        .from("admin_profiles")
        .select("user_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      if (profile) {
        redirect("/admin");
      }
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-600">
        Защищённый раздел
      </p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">
        Вход администратора
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Используйте пользователя Supabase Auth, которому назначена активная роль
        в таблице admin_profiles.
      </p>
      {!environment ? (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
        >
          Вход временно недоступен: подключение Supabase не настроено. Панель
          остаётся закрытой.
        </p>
      ) : (
        <>
          {error === "configuration" ? (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              Панель закрыта до настройки подключения Supabase.
            </p>
          ) : null}
          {error === "access" ? (
            <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              Аккаунт найден, но права администратора не назначены.
            </p>
          ) : null}
          <AdminLoginForm />
        </>
      )}
    </div>
  );
}
