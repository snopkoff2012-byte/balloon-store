import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOptionalPublicEnvironment } from "@/lib/environment";

const tokenSchema = z.uuid();

export async function GET(request: Request) {
  const token = tokenSchema.safeParse(
    new URL(request.url).searchParams.get("token"),
  );
  if (!token.success) {
    return NextResponse.json(
      { error: "Некорректная ссылка на оплату." },
      { status: 400 },
    );
  }
  const environment = getOptionalPublicEnvironment();
  if (!environment) {
    return NextResponse.json(
      { error: "Статус оплаты временно недоступен." },
      { status: 503 },
    );
  }
  const supabase = createClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await supabase.rpc("get_public_payment_summary", {
    order_token: token.data,
  });
  const summary = Array.isArray(data) ? data[0] : data;
  if (error || !summary) {
    return NextResponse.json(
      { error: "Заказ или платёж не найден." },
      { status: 404 },
    );
  }
  return NextResponse.json(summary, {
    headers: { "Cache-Control": "no-store" },
  });
}
