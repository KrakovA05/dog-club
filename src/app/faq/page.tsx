import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createClient } from "@/lib/supabase/server";
import { CtaBanner } from "@/components/sections/CtaBanner";
import type { FaqRow } from "@/types";

export const metadata: Metadata = {
  title: "Частые вопросы о зоогостинице и детском саде",
  description:
    "Ответы на частые вопросы о зоогостинице и детском саде для животных Лапа Клуб в Калуге. Требования к питомцам, цены, что взять с собой.",
  alternates: { canonical: "https://lapaclub.ru/faq" },
};

export const revalidate = 3600;

async function getFaqs(): Promise<FaqRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("faq").select("*").order("sort_order");
    return (data as FaqRow[] | null) ?? [];
  } catch (e) {
    console.error("FAQ fetch error:", e);
    return [];
  }
}

export default async function FaqPage() {
  const faqs = await getFaqs();

  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  } : null;

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <section className="bg-brand-light py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Частые вопросы</h1>
          <p className="text-muted-foreground text-lg">
            Не нашли ответ? Напишите нам — ответим быстро.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          {faqs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Вопросы и ответы появятся скоро
            </p>
          ) : (
            <Accordion className="space-y-3">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border rounded-xl px-6 shadow-sm"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
