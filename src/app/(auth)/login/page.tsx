import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Войти — Лапа Клуб" };

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
