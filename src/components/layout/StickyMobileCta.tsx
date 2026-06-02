"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const HIDE_ON = ["/booking", "/admin", "/staff", "/cabinet", "/login", "/register", "/forgot-password", "/auth"];

export function StickyMobileCta() {
  const pathname = usePathname();
  const hidden = HIDE_ON.some((p) => pathname.startsWith(p));
  if (hidden) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t px-4 py-3 shadow-lg">
      <Button className="w-full text-base" size="lg" render={<Link href="/booking">Забронировать место</Link>} />
    </div>
  );
}
