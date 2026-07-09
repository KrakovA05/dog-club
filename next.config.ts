import type { NextConfig } from "next";

// Хост self-host Storage для next/image (публичные бакеты gallery/blog).
// Облачный *.supabase.co удалён — облако стёрто окончательно (07.2026).
const supabaseImageHost = process.env.SUPABASE_IMAGE_HOSTNAME ?? "db.lapaclub.ru";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseImageHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // public-кэш ТОЛЬКО для публичных страниц. cabinet/admin/staff исключены
        // из regex И перекрыты правилом ниже: их HTML содержит ПДн — кэширование
        // на прокси отдавало кабинет одного пользователя другому (инцидент 07.2026).
        source: "/((?!api|_next/static|_next/image|favicon|cabinet|admin|staff).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Страницы с ПДн: запрет любого кэширования (браузер и прокси).
        // Правило стоит ПОСЛЕ public-каскада — при пересечении побеждает последнее.
        source: "/(cabinet|admin|staff)/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/(cabinet|admin|staff)",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
