import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PaymentStatusPanel } from "@/features/payments/payment-status-panel";

export const metadata: Metadata = {
  title: "Статус оплаты",
  robots: { index: false, follow: false },
};

export default async function PaymentStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ returned?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  return (
    <Container className="py-10 sm:py-16">
      <PaymentStatusPanel
        token={token}
        returnedFromProvider={query.returned === "1"}
      />
    </Container>
  );
}
