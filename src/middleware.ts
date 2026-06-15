import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Вызов к Supabase (внешний, может быть медленным с российского хостинга).
  // Оборачиваем, чтобы зависший/упавший auth не отдавал 502 — считаем гостем.
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (e) {
    console.error("Middleware: getUser упал:", e);
  }

  // /cabinet — требует авторизации
  if (!user && request.nextUrl.pathname.startsWith("/cabinet")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // /admin — требует is_admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      if (profileError) console.error("Middleware: ошибка чтения is_admin для", user.id, profileError.message);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // /staff — требует is_staff или is_admin
  if (request.nextUrl.pathname.startsWith("/staff")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const { data: profile, error: staffError } = await supabase
      .from("profiles")
      .select("is_admin, is_staff")
      .eq("id", user.id)
      .single();

    if (staffError || (!profile?.is_admin && !profile?.is_staff)) {
      if (staffError) console.error("Middleware: ошибка чтения is_staff для", user.id, staffError.message);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // /login, /register — редирект авторизованных в /cabinet
  if (user && (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register"
  )) {
    return NextResponse.redirect(new URL("/cabinet", request.url));
  }

  return supabaseResponse;
}

export const config = {
  // Только защищённые пути и auth-страницы. Публичные страницы (главная, /about,
  // /blog и т.д.) не запускают middleware и не ходят в Supabase — это убирает
  // лишний внешний вызов с критического пути и причину 502 по таймауту.
  matcher: [
    "/cabinet/:path*",
    "/admin/:path*",
    "/staff/:path*",
    "/login",
    "/register",
  ],
};
