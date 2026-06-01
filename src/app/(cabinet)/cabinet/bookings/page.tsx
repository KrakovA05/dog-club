import type { Metadata } from "next";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = { title: "Мои бронирования" };

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои бронирования</h1>
      <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p className="mb-4">История бронирований появится после первого заказа</p>
        <Button render={<Link href="/booking">Забронировать место</Link>} />
      </div>
    </div>
  );
}
