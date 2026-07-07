import type { Metadata } from "next";
import localFont from "next/font/local";
import { CookieNotice } from "@/components/layout/CookieNotice";
import "./globals.css";

const inter = localFont({
  src: [
    {
      path: "../../public/fonts/inter-cyrillic-ext-normal.woff2",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter-cyrillic-normal.woff2",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter-latin-ext-normal.woff2",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter-latin-normal.woff2",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

const BASE = "https://lapaclub.ru";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "Лапа Клуб — Зоогостиница и детский сад для животных в Калуге",
    template: "%s | Лапа Клуб Калуга",
  },
  description:
    "Зоогостиница и детский сад для собак и кошек в Калуге. Собаки до 20 кг, кошки без ограничений по весу. Час, полдня, полный день или длительное проживание. Ул. Дарвина 14, ежедневно 9:00–20:00.",
  keywords: [
    "зоогостиница Калуга",
    "передержка собак Калуга",
    "передержка кошек Калуга",
    "передержка животных Калуга",
    "детский сад для собак Калуга",
    "детский сад для животных Калуга",
    "гостиница для собак Калуга",
    "гостиница для кошек Калуга",
    "куда отдать собаку Калуга",
    "куда отдать кошку Калуга",
    "дневной уход за собакой Калуга",
    "уход за питомцами Калуга",
    "лапа клуб Калуга",
    "зоогостиница для собак и кошек",
    "передержка животных недорого Калуга",
  ],
  verification: {
    yandex: "40321a38420fdaed",
  },
  authors: [{ name: "Лапа Клуб" }],
  creator: "Лапа Клуб",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: BASE,
    siteName: "Лапа Клуб",
    title: "Лапа Клуб — Зоогостиница и детский сад для животных в Калуге",
    description:
      "Зоогостиница и детский сад для собак и кошек в Калуге. Собаки до 20 кг, кошки без ограничений. Ул. Дарвина 14.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Лапа Клуб — зоогостиница в Калуге" }],
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-3.png", type: "image/png", sizes: "1000x1000" },
    ],
    shortcut: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
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
  telephone: "+79605185000",
  email: "info@lapaclub.ru",
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Дарвина 14",
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
    opens: "09:00",
    closes: "20:00",
  },
  priceRange: "₽₽",
  image: `${BASE}/logo-2.png`,
  sameAs: [
    "https://vk.ru/lapaclub40",
    "https://yandex.ru/maps/-/CPh8q2zj",
  ],
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
        <CookieNotice />
      </body>
    </html>
  );
}
