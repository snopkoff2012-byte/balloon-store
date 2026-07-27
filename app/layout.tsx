import type { Metadata } from "next";
import { Manrope, Prata } from "next/font/google";
import { CatalogProvider } from "@/features/catalog/store";
import { loadPublicCatalog } from "@/features/catalog/server-repository";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const prata = Prata({
  variable: "--font-prata",
  subsets: ["latin", "cyrillic"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Воздушная Москва — шары с доставкой",
    template: "%s | Воздушная Москва",
  },
  description:
    "Воздушные шары и готовые композиции с доставкой по Москве и Московской области.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Воздушная Москва",
    description: "Шары и праздничные композиции с доставкой.",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1728,
        height: 911,
        alt: "Воздушная Москва — шары с доставкой",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const catalog = await loadPublicCatalog();

  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${prata.variable} antialiased`}>
        <CatalogProvider initial={catalog}>{children}</CatalogProvider>
      </body>
    </html>
  );
}
