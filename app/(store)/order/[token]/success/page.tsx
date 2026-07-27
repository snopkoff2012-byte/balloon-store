import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { OrderSuccess } from "@/features/checkout/order-success";

export const metadata: Metadata = { title: "Заказ оформлен", robots: { index: false, follow: false } };

export default async function OrderSuccessPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ number?: string; total?: string }> }) {
  const { token } = await params;
  const query = await searchParams;
  const number = Number(query.number);
  const total = Number(query.total);
  return <Container className="py-10 sm:py-16"><OrderSuccess token={token} fallbackNumber={Number.isInteger(number) && number > 0 ? number : undefined} fallbackTotal={Number.isInteger(total) && total >= 0 ? total : undefined} /></Container>;
}
