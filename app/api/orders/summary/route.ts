import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOptionalPublicEnvironment } from "@/lib/environment";

const tokenSchema = z.uuid();

export async function GET(request: Request) {
  const token = tokenSchema.safeParse(new URL(request.url).searchParams.get("token"));
  if (!token.success) return NextResponse.json({ error: "Некорректная ссылка на заказ." }, { status: 400 });
  const environment = getOptionalPublicEnvironment();
  if (!environment) return NextResponse.json({ error: "Заказ временно недоступен." }, { status: 503 });

  const supabase = createClient(environment.NEXT_PUBLIC_SUPABASE_URL, environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc("get_public_order_summary", { order_token: token.data });
  const summary = Array.isArray(data) ? data[0] : data;
  if (error || !summary) return NextResponse.json({ error: "Заказ не найден или временно недоступен." }, { status: 404 });
  return NextResponse.json(summary);
}
