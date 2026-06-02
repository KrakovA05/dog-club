import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="py-16 md:py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto max-w-6xl px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Не оставляйте питомца одного
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
          Займите место прямо сейчас — свободных мест становится меньше с каждым днём
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="text-base px-10"
          render={<Link href="/booking">Занять место для питомца</Link>}
        />
        <p className="mt-5 text-primary-foreground/60 text-sm">
          Или позвоните:{" "}
          <a href="tel:+74842000000" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors font-medium inline-flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            +7 (4842) 00-00-00
          </a>
        </p>
      </div>
    </section>
  );
}
