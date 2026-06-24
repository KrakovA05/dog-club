import type { NextConfig } from "next";

// Хост self-host Storage (напр. db.lapaclub.ru). Если задан — публичные
// картинки с него тоже разрешаются для next/image. Облачный *.supabase.co
// оставлен как fallback на время переезда.
const supabaseImageHost = process.env.SUPABASE_IMAGE_HOSTNAME;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      ...(supabaseImageHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseImageHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/((?!api|_next/static|_next/image|favicon).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
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
