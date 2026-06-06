import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

const BASE = "https://lapaclub.ru";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "Лапа Клуб — Зоогостиница и детский сад для животных в Калуге",
    template: "%s | Лапа Клуб Калуга",
  },
  description:
    "Зоогостиница и детский сад для собак и кошек в Калуге. Принимаем питомцев до 15 кг на час, полдня, полный день или длительное проживание. Ул. Дарвина 14Ф, ежедневно 8:00–20:00.",
  keywords: [
    "зоогостиница Калуга",
    "передержка собак Калуга",
    "детский сад для животных Калуга",
    "передержка кошек Калуга",
    "гостиница для собак Калуга",
    "лапа клуб Калуга",
    "уход за питомцами Калуга",
    "передержка животных Калуга",
  ],
  authors: [{ name: "Лапа Клуб" }],
  creator: "Лапа Клуб",
  alternates: {
    canonical: BASE,
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: BASE,
    siteName: "Лапа Клуб",
    title: "Лапа Клуб — Зоогостиница и детский сад для животных в Калуге",
    description:
      "Зоогостиница и детский сад для собак и кошек в Калуге. Принимаем питомцев до 15 кг. Ул. Дарвина 14Ф.",
  },
  icons: {
    icon: [{ url: "/icon.png?v=2", type: "image/png", sizes: "1000x1000" }],
    shortcut: "/icon.png?v=2",
    apple: "/icon.png?v=2",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": BASE,
  name: "Лапа Клуб",
  description: "Зоогостиница и детский сад для собак и кошек в Калуге",
  url: BASE,
  telephone: "+74842000000",
  email: "info@lapaclub.ru",
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Дарвина 14Ф",
    addressLocality: "Калуга",
    addressRegion: "Калужская область",
    addressCountry: "RU",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 54.5293,
    longitude: 36.2754,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    opens: "08:00",
    closes: "20:00",
  },
  priceRange: "₽₽",
  image: `${BASE}/logo.png`,
  sameAs: [],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
