import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Блог — Дог Клуб",
  description: "Советы по уходу за собаками и кошками от команды Дог Клуб Калуга.",
};

export default function BlogPage() {
  return (
    <>
      <section className="bg-brand-light py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Блог</h1>
          <p className="text-muted-foreground text-lg">Советы по уходу и воспитанию питомцев</p>
        </div>
      </section>
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 text-center text-muted-foreground py-20">
          <p className="text-lg">Статьи появятся совсем скоро</p>
        </div>
      </section>
    </>
  );
}
