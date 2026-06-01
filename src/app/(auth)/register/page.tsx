import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Регистрация — Дог Клуб" };

export default function RegisterPage() {
  return <RegisterForm />;
}
