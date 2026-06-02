import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StickyMobileCta } from "@/components/layout/StickyMobileCta";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Дог Клуб — Зоогостиница и детский сад для животных в Калуге",
    template: "%s | Дог Клуб Калуга",
  },
  description:
    "Профессиональный уход за собаками и кошками в Калуге. Детский сад (час, полдня, полный день) и гостиница с открытыми боксами. Ул. Дарвина 14Ф.",
  keywords: ["зоогостиница Калуга", "передержка собак Калуга", "детский сад для животных", "догклуб"],
  icons: {
    icon: [{ url: "/icon.png?v=2", type: "image/png", sizes: "1000x1000" }],
    shortcut: "/icon.png?v=2",
    apple: "/icon.png?v=2",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://dogclub-kaluga.ru",
    siteName: "Дог Клуб",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Header />
        <main className="pb-[72px] md:pb-0">{children}</main>
        <Footer />
        <StickyMobileCta />
      </body>
    </html>
  );
}
