import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { CalendarCheck, Star, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = createClient();

  const [
    { count: pendingDaycare },
    { count: pendingHotel },
    { count: unpublishedReviews },
    { count: totalUsers },
  ] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending").eq("service_type", "daycare"),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending").eq("service_type", "hotel"),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("is_published", false),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Дашборд</h1>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Детский сад</h2>
          <Link href="/admin/daycare/bookings">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-5 pb-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{pendingDaycare ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Новых заявок</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Гостиница</h2>
          <Link href="/admin/hotel/bookings">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-5 pb-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{pendingHotel ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Новых заявок</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/admin/reviews">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-5 pb-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-500">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{unpublishedReviews ?? 0}</div>
                <div className="text-sm text-muted-foreground">Отзывов к проверке</div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalUsers ?? 0}</div>
              <div className="text-sm text-muted-foreground">Пользователей</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
