"use client";

import { useState, type FormEvent } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.user) {
        throw new Error("Неверная почта или пароль.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("admin_profiles")
        .select("user_id,is_active")
        .eq("user_id", data.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error("У этого аккаунта нет активных прав администратора.");
      }

      window.location.assign("/admin");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Не удалось выполнить вход.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
        Электронная почта
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="admin-input"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
        Пароль
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="admin-input"
        />
      </label>
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={isSubmitting} className="admin-primary">
        {isSubmitting ? "Проверяем доступ…" : "Войти"}
      </button>
    </form>
  );
}
