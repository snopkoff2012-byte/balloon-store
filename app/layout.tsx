import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
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
        url: "/social-preview.png",
        width: 1729,
        height: 911,
        alt: "Воздушная Москва — шары с доставкой",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/social-preview.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
