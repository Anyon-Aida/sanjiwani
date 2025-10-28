// src/app/api/admin/catalog/route.ts
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis"; // ugyanaz a Redis kliens, amit eddig is használtál

const KEY = "catalog:json";

export type Variant = { durationMin: number; priceHUF: number };
export type Service = { id: string; name: string; image?: string; variants: Variant[] };
export type Category = { id: string; name: string; order: number; services: Service[] };
export type FAQ = { q: string; a: string };
export type Catalog = { categories: Category[]; faq: FAQ[] };

function isCatalog(x: unknown): x is Catalog {
  try {
    const c = x as Catalog;
    return Array.isArray(c.categories) && Array.isArray(c.faq);
  } catch {
    return false;
  }
}

export async function GET() {
  // 1) próbáljuk Redis-ből
  const fromKv = await redis.get<string>(KEY);
  if (fromKv) {
    try {
      const parsed = JSON.parse(fromKv) as Catalog;
      return NextResponse.json({ ok: true, catalog: parsed });
    } catch {
      // ha rossz a KV tartalom, dobjunk defaultot
    }
  }

  // 2) üres default (első induláskor)
  const fallback: Catalog = {
    categories: [
      { id: "cat-oil", name: "Olajos", order: 1, services: [] },
      { id: "cat-warm", name: "Meleg / herbál", order: 2, services: [] },
      { id: "cat-seg", name: "Szegmentált", order: 3, services: [] },
      { id: "cat-dry", name: "Száraz (thai)", order: 4, services: [] },
      { id: "cat-scrub", name: "Scrub / testradír", order: 5, services: [] },
    ],
    faq: [],
  };
  return NextResponse.json({ ok: true, catalog: fallback });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { catalog: Catalog };
    if (!body || !isCatalog(body.catalog)) {
      return NextResponse.json(
        { ok: false, message: "Érvénytelen catalog struktúra." },
        { status: 400 },
      );
    }
    // minimális szerver-oldali validáció
    for (const cat of body.catalog.categories) {
      if (!cat.name.trim()) {
        return NextResponse.json({ ok: false, message: "Üres kategórianév." }, { status: 400 });
      }
      for (const svc of cat.services) {
        if (!svc.name.trim()) {
          return NextResponse.json({ ok: false, message: "Üres szolgáltatásnév." }, { status: 400 });
        }
      }
    }

    await redis.set(KEY, JSON.stringify(body.catalog));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "Szerver hiba." }, { status: 500 });
  }
}
