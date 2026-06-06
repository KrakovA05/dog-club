import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary">
            <Image src="/logo.png?v=3" alt="Лапа Клуб" width={40} height={40} className="rounded-xl" />
            Лапа Клуб
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
