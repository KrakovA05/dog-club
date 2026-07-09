import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Отдаём фото ветпаспорта через наш домен: бакет passports приватный
// (миграция 024), прямых ссылок нет. Доступ: владелец питомца или админ/персонал.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ petId: string }> }
) {
  const { petId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const { data: pet } = await admin
    .from("pets")
    .select("owner_id, passport_photo_url")
    .eq("id", petId)
    .single();

  if (!pet?.passport_photo_url) return new NextResponse("Not found", { status: 404 });

  if (pet.owner_id !== user.id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin, is_staff")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin && !profile?.is_staff) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Поддерживаем оба формата: старые записи — полный URL, новые — путь uid/file.jpg
  const raw = pet.passport_photo_url;
  const path = raw.includes("/passports/") ? raw.split("/passports/")[1] : raw;
  if (!path) return new NextResponse("Not found", { status: 404 });

  const { data: file, error } = await admin.storage.from("passports").download(path);
  if (error || !file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(file.stream(), {
    headers: {
      "Content-Type": file.type || "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
