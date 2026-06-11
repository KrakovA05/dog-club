import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TOPICS = [
  "Как подготовить собаку к первому посещению детского сада",
  "Что взять с собой при сдаче питомца в зоогостиницу",
  "Как снизить стресс у кошки во время передержки",
  "Признаки того, что вашей собаке нужна социализация",
  "Кормление собаки в детском саду: что нужно знать",
  "Как выбрать зоогостиницу: на что обратить внимание",
  "Первые дни щенка дома: советы новым владельцам",
  "Почему регулярный груминг важен для здоровья собаки",
  "Игры и активности для собак в детском саду",
  "Как научить собаку оставаться одну без стресса",
  "Прививки и ветпаспорт: что нужно для передержки",
  "Признаки здоровья кошки: на что обращать внимание",
  "Как помочь питомцу адаптироваться после гостиницы",
  "Маленькие собаки: особенности ухода и содержания",
  "Зачем собаке общение с другими собаками",
];

function slugify(str: string): string {
  const map: Record<string, string> = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"j",
    к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
    х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
  };
  return str
    .toLowerCase()
    .replace(/[а-яёА-ЯЁ]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("is_staff").eq("id", user.id).single();
  return (profile?.is_admin || profile?.is_staff) ? user : null;
}

export async function GET() {
  return NextResponse.json({ topics: TOPICS });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "CLAUDE_API_KEY не настроен" }, { status: 500 });

  const body = await req.json();
  const topic: string = body.topic?.trim();
  if (!topic) return NextResponse.json({ error: "Тема не указана" }, { status: 400 });

  const prompt = `Ты — контент-маркетолог зоогостиницы «Лапа Клуб» в Калуге (ул. Дарвина 14).
Клуб принимает собак до 20 кг и кошек без ограничений по весу.
Услуги: детский сад (дневное пребывание) и гостиница (длительная передержка).

Напиши SEO-оптимизированную статью для блога на тему:
«${topic}»

Требования:
- Язык: русский
- Объём: 800–1200 слов
- Формат: Markdown (заголовки ##, ###, жирный текст, списки)
- Структура: вступление → 3–5 разделов с подзаголовками → заключение
- Упомяни «Лапа Клуб» естественно 1–2 раза, без навязчивой рекламы
- Добавь практические советы, которые реально полезны владельцам
- Пиши живо и дружелюбно, без канцеляризмов

Верни ТОЛЬКО валидный JSON без markdown-обёртки и без пояснений:
{
  "title": "заголовок статьи",
  "excerpt": "2-3 предложения для превью (без markdown)",
  "content": "полный текст статьи в markdown"
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Anthropic API error:", err);
    return NextResponse.json({ error: "Ошибка генерации" }, { status: 502 });
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? "";

  let parsed: { title: string; excerpt: string; content: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Не удалось разобрать ответ ИИ" }, { status: 500 });
    parsed = JSON.parse(match[0]);
  }

  return NextResponse.json({
    title: parsed.title,
    slug: slugify(parsed.title),
    excerpt: parsed.excerpt,
    content: parsed.content,
  });
}
