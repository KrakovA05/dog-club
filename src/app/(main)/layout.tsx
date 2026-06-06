import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StickyMobileCta } from "@/components/layout/StickyMobileCta";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="pb-[72px] md:pb-0">{children}</main>
      <Footer />
      <StickyMobileCta />
    </>
  );
}
