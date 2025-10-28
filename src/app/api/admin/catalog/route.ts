// src/app/api/admin/catalog/route.ts
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis"; // ugyanaz a Redis kliens, amit eddig is használtál
import { CATALOG_KEY } from "@/lib/catalog";

export type Variant = { durationMin: number; priceHUF: number };
export type Service = { id: string; name: string; image?: string; variants: Variant[] };
export type Category = { id: string; name: string; order: number; services: Service[] };
export type FAQ = { q: string; a: string };
export type Catalog = { categories: Category[]; faq: FAQ[] };

const FALLBACK: Catalog = {
  categories: [
    { id: "cat-oil",   name: "Olajos",         order: 1, services: [] },
    { id: "cat-warm",  name: "Meleg / herbál", order: 2, services: [] },
    { id: "cat-seg",   name: "Szegmentált",    order: 3, services: [] },
    { id: "cat-dry",   name: "Száraz (thai)",  order: 4, services: [] },
    { id: "cat-scrub", name: "Scrub / testradír", order: 5, services: [] },
  ],
  faq: [],
};

function isCatalog(x: unknown): x is Catalog {
  try {
    const c = x as Catalog;
    return Array.isArray(c.categories) && Array.isArray(c.faq);
  } catch {
    return false;
  }
}

export async function GET() {
  // 1) próbáljuk a KV-t
  const raw = await redis.get<string>(CATALOG_KEY);

  if (typeof raw === "string" && raw.trim() !== "") {
    try {
      const parsed = JSON.parse(raw) as Catalog;
      return NextResponse.json({ ok: true, catalog: parsed, source: "kv" });
    } catch (e) {
      // rossz formátum a KV-ban
      return NextResponse.json(
        { ok: false, error: "BAD_JSON_IN_KV", source: "kv" },
        { status: 500 }
      );
    }
  }

  // 2) ha nincs a KV-ban, adjunk fallbacket
  return NextResponse.json({ ok: true, catalog: FALLBACK, source: "fallback" });
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

    await redis.set(CATALOG_KEY, JSON.stringify(body.catalog));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "Szerver hiba." }, { status: 500 });
  }
}
